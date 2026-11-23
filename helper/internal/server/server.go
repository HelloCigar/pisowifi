// Package server speaks the helper protocol (see PROTOCOL.md) on a Unix
// socket and drives a Backend: the simulator on a development PC, or the
// real firewall and leases on the Machine.
package server

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"maps"
	"net"
	"os"
	"slices"
	"sync"
	"time"
)

// Backend is what the helper drives. The server owns the protocol and the
// rule that every Device stays blocked until the first sync; a backend only
// applies what it is told.
type Backend interface {
	Name() string
	// Sync replaces the whole allow list: the given Devices are allowed with
	// their speed caps, and every other Device is blocked.
	Sync(devices []Device) error
	// Allow lets one Device through with its speed cap.
	Allow(device Device) error
	// Block cuts one Device off and removes its speed cap.
	Block(mac string) error
	// SetSpeedCap changes the speed cap of an allowed Device.
	SetSpeedCap(device Device) error
	// LookupMAC finds the MAC address of the Device that holds ip, from the
	// DHCP leases or the ARP table. ok is false when no Device holds it.
	LookupMAC(ip string) (mac string, ok bool, err error)
	// Events delivers what the backend sees happen on the Hotspot Network.
	// The server pushes each one to every connected app.
	Events() <-chan Event
}

// Event is pushed to the app as it happens, with no id.
type Event struct {
	Name string `json:"event"`
	Data any    `json:"data"`
}

// DeviceOnline reports that a Device has connected to the Hotspot Network.
func DeviceOnline(mac, ip string) Event {
	return Event{Name: "device_online", Data: map[string]string{"mac": mac, "ip": ip}}
}

// DeviceOffline reports that a Device has left the Hotspot Network.
func DeviceOffline(mac string) Event {
	return Event{Name: "device_offline", Data: map[string]string{"mac": mac}}
}

// Device is one allowed Device as the app describes it.
type Device struct {
	MAC      string   `json:"mac"`
	IP       string   `json:"ip"`
	SpeedCap SpeedCap `json:"speed_cap"`
}

// SpeedCap limits one Device's bandwidth, in kilobits per second.
type SpeedCap struct {
	DownKbps int `json:"down_kbps"`
	UpKbps   int `json:"up_kbps"`
}

type request struct {
	ID     json.RawMessage `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type reply struct {
	ID     json.RawMessage `json:"id"`
	OK     bool            `json:"ok"`
	Result any             `json:"result,omitempty"`
	Error  *Error          `json:"error,omitempty"`
}

// Error is the error object of a failed reply.
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Server accepts app connections on one Unix socket.
type Server struct {
	listener net.Listener
	backend  Backend

	// mu orders every change to the firewall, so the backend sees them in
	// the same order as allowed records them.
	mu      sync.Mutex
	synced  bool
	allowed map[string]Device

	connsMu sync.Mutex
	conns   map[*appConn]struct{}
	done    chan struct{}
	closing sync.Once
}

// appConn is one connection from the app. Replies and events share it, so
// every write takes its lock to keep lines whole.
type appConn struct {
	conn    net.Conn
	writeMu sync.Mutex
	encoder *json.Encoder
}

func (c *appConn) send(message any) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	c.conn.SetWriteDeadline(time.Now().Add(writeTimeout))
	return c.encoder.Encode(message)
}

// writeTimeout drops an app connection that stops reading, so a stuck app
// cannot hold up events for the others.
const writeTimeout = 5 * time.Second

// maxLine bounds one request line; a sync of every Device fits easily.
const maxLine = 1 << 20

// Listen blocks every Device, removes a stale socket file left by a previous
// run, and listens on path.
func Listen(path string, backend Backend) (*Server, error) {
	// Block every Device until the app's first sync says who has time left.
	if err := backend.Sync(nil); err != nil {
		return nil, err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	listener, err := net.Listen("unix", path)
	if err != nil {
		return nil, err
	}
	s := &Server{
		listener: listener,
		backend:  backend,
		allowed:  map[string]Device{},
		conns:    map[*appConn]struct{}{},
		done:     make(chan struct{}),
	}
	go s.pushEvents()
	return s, nil
}

// Serve accepts connections until Close is called.
func (s *Server) Serve() error {
	for {
		conn, err := s.listener.Accept()
		if errors.Is(err, net.ErrClosed) {
			return nil
		}
		if err != nil {
			return err
		}
		go s.handle(conn)
	}
}

// Close stops accepting connections and closes the open ones.
func (s *Server) Close() error {
	err := s.listener.Close()
	s.closing.Do(func() { close(s.done) })
	for _, c := range s.openConns() {
		c.conn.Close()
	}
	return err
}

func (s *Server) openConns() []*appConn {
	s.connsMu.Lock()
	defer s.connsMu.Unlock()
	return slices.Collect(maps.Keys(s.conns))
}

func (s *Server) pushEvents() {
	for {
		select {
		case <-s.done:
			return
		case event := <-s.backend.Events():
			for _, c := range s.openConns() {
				if err := c.send(event); err != nil {
					log.Printf("push %s: %v", event.Name, err)
					c.conn.Close()
				}
			}
		}
	}
}

func (s *Server) handle(conn net.Conn) {
	c := &appConn{conn: conn, encoder: json.NewEncoder(conn)}
	s.connsMu.Lock()
	s.conns[c] = struct{}{}
	s.connsMu.Unlock()
	defer func() {
		s.connsMu.Lock()
		delete(s.conns, c)
		s.connsMu.Unlock()
		conn.Close()
	}()

	scanner := bufio.NewScanner(conn)
	scanner.Buffer(make([]byte, 0, 64*1024), maxLine)
	for scanner.Scan() {
		if err := c.send(s.answer(scanner.Bytes())); err != nil {
			log.Printf("write reply: %v", err)
			return
		}
	}
	if errors.Is(scanner.Err(), bufio.ErrTooLong) {
		c.send(failure(request{}, "bad_request", "the line is longer than 1 MiB"))
	}
}

func (s *Server) answer(line []byte) reply {
	var req request
	if err := json.Unmarshal(line, &req); err != nil {
		return failure(request{}, "bad_request", "the line is not a JSON request")
	}
	return s.dispatch(req)
}

func (s *Server) dispatch(req request) reply {
	switch req.Method {
	case "health":
		s.mu.Lock()
		defer s.mu.Unlock()
		return reply{ID: req.ID, OK: true, Result: map[string]any{"backend": s.backend.Name(), "synced": s.synced}}
	case "sync":
		return s.sync(req)
	case "allow":
		return s.allow(req)
	case "block":
		return s.block(req)
	case "set_speed_cap":
		return s.setSpeedCap(req)
	case "lookup_mac":
		return s.lookupMAC(req)
	default:
		return reply{ID: req.ID, Error: &Error{Code: "unknown_method", Message: "unknown method " + req.Method}}
	}
}

func (s *Server) sync(req request) reply {
	var params struct {
		Devices []Device `json:"devices"`
	}
	if err := decodeParams(req, &params); err != nil {
		return failure(req, "bad_request", err.Error())
	}
	if params.Devices == nil {
		return failure(req, "bad_request", "devices is required; send [] to block every Device")
	}
	for i := range params.Devices {
		if err := normalizeDevice(&params.Devices[i]); err != nil {
			return failure(req, "bad_request", err.Error())
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.backend.Sync(params.Devices); err != nil {
		return failure(req, "backend_failed", err.Error())
	}
	s.synced = true
	s.allowed = map[string]Device{}
	for _, d := range params.Devices {
		s.allowed[d.MAC] = d
	}
	return success(req, nil)
}

func (s *Server) allow(req request) reply {
	var device Device
	if err := decodeParams(req, &device); err != nil {
		return failure(req, "bad_request", err.Error())
	}
	if err := normalizeDevice(&device); err != nil {
		return failure(req, "bad_request", err.Error())
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.synced {
		return notSynced(req)
	}
	if err := s.backend.Allow(device); err != nil {
		return failure(req, "backend_failed", err.Error())
	}
	s.allowed[device.MAC] = device
	return success(req, nil)
}

// block works before the first sync too: every Device is blocked then
// anyway, so it can never open the firewall.
func (s *Server) block(req request) reply {
	var params struct {
		MAC string `json:"mac"`
	}
	if err := decodeParams(req, &params); err != nil {
		return failure(req, "bad_request", err.Error())
	}
	mac, err := NormalizeMAC(params.MAC)
	if err != nil {
		return failure(req, "bad_request", err.Error())
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.backend.Block(mac); err != nil {
		return failure(req, "backend_failed", err.Error())
	}
	delete(s.allowed, mac)
	return success(req, nil)
}

func (s *Server) setSpeedCap(req request) reply {
	var params struct {
		MAC      string   `json:"mac"`
		SpeedCap SpeedCap `json:"speed_cap"`
	}
	if err := decodeParams(req, &params); err != nil {
		return failure(req, "bad_request", err.Error())
	}
	mac, err := NormalizeMAC(params.MAC)
	if err != nil {
		return failure(req, "bad_request", err.Error())
	}
	if err := validateSpeedCap(params.SpeedCap); err != nil {
		return failure(req, "bad_request", err.Error())
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.synced {
		return notSynced(req)
	}
	device, ok := s.allowed[mac]
	if !ok {
		return failure(req, "not_allowed", "Device "+mac+" is blocked; allow it with its speed cap instead")
	}
	device.SpeedCap = params.SpeedCap
	if err := s.backend.SetSpeedCap(device); err != nil {
		return failure(req, "backend_failed", err.Error())
	}
	s.allowed[mac] = device
	return success(req, nil)
}

func (s *Server) lookupMAC(req request) reply {
	var params struct {
		IP string `json:"ip"`
	}
	if err := decodeParams(req, &params); err != nil {
		return failure(req, "bad_request", err.Error())
	}
	ip, err := NormalizeIP(params.IP)
	if err != nil {
		return failure(req, "bad_request", err.Error())
	}

	mac, ok, err := s.backend.LookupMAC(ip)
	if err != nil {
		return failure(req, "backend_failed", err.Error())
	}
	if !ok {
		return failure(req, "unknown_ip", "no Device holds "+ip)
	}
	return success(req, map[string]any{"mac": mac})
}

func notSynced(req request) reply {
	return failure(req, "not_synced", "every Device stays blocked until the first sync")
}

func decodeParams(req request, into any) error {
	if len(req.Params) == 0 || string(req.Params) == "null" {
		return errors.New("params are required")
	}
	if err := json.Unmarshal(req.Params, into); err != nil {
		return fmt.Errorf("invalid params: %w", err)
	}
	return nil
}

func normalizeDevice(d *Device) error {
	mac, err := NormalizeMAC(d.MAC)
	if err != nil {
		return err
	}
	ip, err := NormalizeIP(d.IP)
	if err != nil {
		return err
	}
	if err := validateSpeedCap(d.SpeedCap); err != nil {
		return err
	}
	d.MAC, d.IP = mac, ip
	return nil
}

// NormalizeMAC returns the lower-case, colon-separated form of a MAC address.
func NormalizeMAC(raw string) (string, error) {
	hw, err := net.ParseMAC(raw)
	if err != nil || len(hw) != 6 {
		return "", fmt.Errorf("invalid MAC address %q", raw)
	}
	return hw.String(), nil
}

// NormalizeIP returns the canonical text form of an IP address.
func NormalizeIP(raw string) (string, error) {
	ip := net.ParseIP(raw)
	if ip == nil {
		return "", fmt.Errorf("invalid IP address %q", raw)
	}
	return ip.String(), nil
}

func validateSpeedCap(c SpeedCap) error {
	if c.DownKbps <= 0 || c.UpKbps <= 0 {
		return errors.New("speed_cap needs positive down_kbps and up_kbps")
	}
	return nil
}

func success(req request, result any) reply {
	return reply{ID: req.ID, OK: true, Result: result}
}

// failure answers req with an error. A request with no id, or a line that is
// not a request, gets "id": null.
func failure(req request, code, message string) reply {
	return reply{ID: req.ID, Error: &Error{Code: code, Message: message}}
}
