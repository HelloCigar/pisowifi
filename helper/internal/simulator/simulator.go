// Package simulator is the helper backend for a development PC. It keeps the
// firewall state in memory, logs every change the real Machine would make,
// and fakes Devices so they can be mapped to IP addresses and brought online
// or offline by hand.
package simulator

import (
	"fmt"
	"io"
	"log"
	"maps"
	"sync"

	"github.com/HelloCigar/pisowifi/helper/internal/server"
)

// Simulator is an in-memory firewall and a set of fake Devices.
type Simulator struct {
	log *log.Logger

	mu      sync.Mutex
	allowed map[string]server.Device
	devices map[string]*fakeDevice
	events  chan server.Event
}

// fakeDevice is a Device on the simulated Hotspot Network.
type fakeDevice struct {
	ip     string
	online bool
}

// New returns a simulator that logs firewall changes to out. A nil out
// discards them.
func New(out io.Writer) *Simulator {
	if out == nil {
		out = io.Discard
	}
	return &Simulator{
		log:     log.New(out, "simulator: ", log.Ltime),
		allowed: map[string]server.Device{},
		devices: map[string]*fakeDevice{},
		events:  make(chan server.Event, 64),
	}
}

// Name identifies the backend in health replies.
func (s *Simulator) Name() string { return "simulator" }

// Sync replaces the allow list. Every Device not listed is blocked.
func (s *Simulator) Sync(devices []server.Device) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.allowed = map[string]server.Device{}
	s.log.Printf("firewall: block every Device")
	for _, d := range devices {
		s.allowed[d.MAC] = d
		s.log.Printf("firewall: allow %s at %s, cap %d/%d kbps", d.MAC, d.IP, d.SpeedCap.DownKbps, d.SpeedCap.UpKbps)
	}
	return nil
}

// Allow lets one Device through with its speed cap.
func (s *Simulator) Allow(d server.Device) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.allowed[d.MAC] = d
	s.log.Printf("firewall: allow %s at %s, cap %d/%d kbps", d.MAC, d.IP, d.SpeedCap.DownKbps, d.SpeedCap.UpKbps)
	return nil
}

// Block cuts one Device off.
func (s *Simulator) Block(mac string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.allowed, mac)
	s.log.Printf("firewall: block %s", mac)
	return nil
}

// SetSpeedCap changes the speed cap of an allowed Device.
func (s *Simulator) SetSpeedCap(d server.Device) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.allowed[d.MAC] = d
	s.log.Printf("traffic: cap %s at %s to %d/%d kbps", d.MAC, d.IP, d.SpeedCap.DownKbps, d.SpeedCap.UpKbps)
	return nil
}

// AllowedDevices returns a copy of the simulated firewall's allow list, keyed
// by MAC address. Every Device not in it is blocked.
func (s *Simulator) AllowedDevices() map[string]server.Device {
	s.mu.Lock()
	defer s.mu.Unlock()
	return maps.Clone(s.allowed)
}

// LookupMAC finds the fake Device mapped to ip.
func (s *Simulator) LookupMAC(ip string) (string, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for mac, d := range s.devices {
		if d.ip == ip {
			return mac, true, nil
		}
	}
	return "", false, nil
}

// AddDevice puts a fake Device on the Hotspot Network. It has no IP address
// and is offline until MapIP and Online.
func (s *Simulator) AddDevice(mac string) error {
	mac, err := server.NormalizeMAC(mac)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[mac]; ok {
		return fmt.Errorf("Device %s already exists", mac)
	}
	s.devices[mac] = &fakeDevice{}
	s.log.Printf("network: Device %s added", mac)
	return nil
}

// MapIP gives a fake Device an IP address, as a DHCP lease would. Any other
// fake Device holding that address loses it.
func (s *Simulator) MapIP(mac, ip string) error {
	mac, err := server.NormalizeMAC(mac)
	if err != nil {
		return err
	}
	ip, err = server.NormalizeIP(ip)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	d, err := s.device(mac)
	if err != nil {
		return err
	}
	for _, other := range s.devices {
		if other.ip == ip {
			other.ip = ""
		}
	}
	d.ip = ip
	s.log.Printf("network: Device %s leased %s", mac, ip)
	return nil
}

// Online brings a fake Device onto the Hotspot Network and sends
// device_online. The Device needs an IP address first.
func (s *Simulator) Online(mac string) error {
	mac, err := server.NormalizeMAC(mac)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	d, err := s.device(mac)
	if err != nil {
		return err
	}
	if d.ip == "" {
		return fmt.Errorf("Device %s has no IP address; map one first", mac)
	}
	if d.online {
		return fmt.Errorf("Device %s is already online", mac)
	}
	d.online = true
	s.log.Printf("network: Device %s online at %s", mac, d.ip)
	s.emit(server.DeviceOnline(mac, d.ip))
	return nil
}

// Offline takes a fake Device off the Hotspot Network and sends
// device_offline. It keeps its IP address, as a DHCP lease outlives a
// disconnect.
func (s *Simulator) Offline(mac string) error {
	mac, err := server.NormalizeMAC(mac)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	d, err := s.device(mac)
	if err != nil {
		return err
	}
	if !d.online {
		return fmt.Errorf("Device %s is already offline", mac)
	}
	d.online = false
	s.log.Printf("network: Device %s offline", mac)
	s.emit(server.DeviceOffline(mac))
	return nil
}

// emit queues an event for the server. Callers hold s.mu, so events leave
// in the order the changes happened. It never waits: with no server reading,
// the event is dropped and logged rather than freezing the console.
func (s *Simulator) emit(event server.Event) {
	select {
	case s.events <- event:
	default:
		s.log.Printf("event %s dropped: nothing is reading events", event.Name)
	}
}

// Events delivers device_online and device_offline as fake Devices come and
// go.
func (s *Simulator) Events() <-chan server.Event { return s.events }

func (s *Simulator) device(mac string) (*fakeDevice, error) {
	d, ok := s.devices[mac]
	if !ok {
		return nil, fmt.Errorf("no Device %s; add it first", mac)
	}
	return d, nil
}
