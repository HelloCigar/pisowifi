package server_test

import (
	"bufio"
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/HelloCigar/pisowifi/helper/internal/server"
	"github.com/HelloCigar/pisowifi/helper/internal/simulator"
)

// fakeApp is the app's side of the socket, written from the protocol document.
type fakeApp struct {
	t      *testing.T
	conn   net.Conn
	lines  chan map[string]any
	nextID int
}

func startHelper(t *testing.T) (*simulator.Simulator, *fakeApp) {
	t.Helper()
	sim := simulator.New(nil)
	return sim, startHelperWith(t, sim)
}

func startHelperWith(t *testing.T, sim *simulator.Simulator) *fakeApp {
	t.Helper()
	// t.TempDir() is too long for a Unix socket path (108 bytes) on Windows.
	dir, err := os.MkdirTemp("", "ph")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	socket := filepath.Join(dir, "h.sock")

	srv, err := server.Listen(socket, sim)
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	go srv.Serve()
	t.Cleanup(func() { srv.Close() })

	app := dial(t, socket)
	// A reply proves the helper has taken the connection, so no event the
	// test triggers afterwards can be missed.
	assertOK(t, app.call("health", nil))
	return app
}

func dial(t *testing.T, socket string) *fakeApp {
	t.Helper()
	conn, err := net.Dial("unix", socket)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	c := &fakeApp{t: t, conn: conn, lines: make(chan map[string]any, 64)}
	go func() {
		scanner := bufio.NewScanner(conn)
		for scanner.Scan() {
			var msg map[string]any
			if err := json.Unmarshal(scanner.Bytes(), &msg); err != nil {
				t.Errorf("helper sent invalid JSON %q: %v", scanner.Text(), err)
				continue
			}
			c.lines <- msg
		}
		close(c.lines)
	}()
	return c
}

// call sends one request and waits for the reply with the same id.
// Events that arrive in between are ignored.
func (c *fakeApp) call(method string, params any) map[string]any {
	c.t.Helper()
	c.nextID++
	id := c.nextID
	req := map[string]any{"id": id, "method": method}
	if params != nil {
		req["params"] = params
	}
	line, _ := json.Marshal(req)
	if _, err := c.conn.Write(append(line, '\n')); err != nil {
		c.t.Fatalf("write: %v", err)
	}

	for {
		msg := c.next()
		if msg["id"] == float64(id) {
			return msg
		}
	}
}

// event waits for the next pushed event.
func (c *fakeApp) event() map[string]any {
	c.t.Helper()
	for {
		msg := c.next()
		if _, ok := msg["event"]; ok {
			return msg
		}
	}
}

func (c *fakeApp) next() map[string]any {
	c.t.Helper()
	select {
	case msg, ok := <-c.lines:
		if !ok {
			c.t.Fatal("helper closed the connection")
		}
		return msg
	case <-time.After(2 * time.Second):
		c.t.Fatal("timed out waiting for the helper")
		return nil
	}
}

func assertOK(t *testing.T, reply map[string]any) map[string]any {
	t.Helper()
	if reply["ok"] != true {
		t.Fatalf("expected ok reply, got %v", reply)
	}
	result, _ := reply["result"].(map[string]any)
	return result
}

func assertError(t *testing.T, reply map[string]any, code string) {
	t.Helper()
	errObj, _ := reply["error"].(map[string]any)
	if reply["ok"] != false || errObj["code"] != code {
		t.Fatalf("expected error %q, got %v", code, reply)
	}
}

func TestHealthReportsTheBackendAndThatNoSyncHasArrived(t *testing.T) {
	_, app := startHelper(t)

	result := assertOK(t, app.call("health", nil))

	if result["backend"] != "simulator" || result["synced"] != false {
		t.Fatalf("unexpected health %v", result)
	}
}

const (
	phoneMAC  = "aa:bb:cc:00:00:01"
	laptopMAC = "aa:bb:cc:00:00:02"
)

var defaultCap = map[string]any{"down_kbps": 5000, "up_kbps": 2000}

func TestEveryDeviceIsBlockedUntilTheFirstSync(t *testing.T) {
	sim, app := startHelper(t)

	assertError(t, app.call("allow", map[string]any{"mac": phoneMAC, "ip": "10.0.0.11", "speed_cap": defaultCap}), "not_synced")
	assertError(t, app.call("set_speed_cap", map[string]any{"mac": phoneMAC, "speed_cap": defaultCap}), "not_synced")

	if len(sim.AllowedDevices()) != 0 {
		t.Fatalf("expected no allowed Devices before sync, got %v", sim.AllowedDevices())
	}
}

func TestStartingTheHelperBlocksDevicesLeftAllowedBefore(t *testing.T) {
	sim := simulator.New(nil)
	must(t, sim.Allow(server.Device{MAC: phoneMAC, IP: "10.0.0.11", SpeedCap: server.SpeedCap{DownKbps: 5000, UpKbps: 2000}}))

	startHelperWith(t, sim)

	assertBlocked(t, sim, phoneMAC)
}

func TestSyncWithoutADeviceListIsRejected(t *testing.T) {
	sim, app := startHelper(t)

	assertError(t, app.call("sync", map[string]any{}), "bad_request")

	if assertOK(t, app.call("health", nil))["synced"] != false {
		t.Fatal("a rejected sync must not count as the first sync")
	}
	if len(sim.AllowedDevices()) != 0 {
		t.Fatalf("expected nothing allowed, got %v", sim.AllowedDevices())
	}
}

func TestSyncAllowsExactlyTheListedDevices(t *testing.T) {
	sim, app := startHelper(t)

	assertOK(t, app.call("sync", map[string]any{"devices": []any{
		map[string]any{"mac": phoneMAC, "ip": "10.0.0.11", "speed_cap": defaultCap},
	}}))

	assertAllowed(t, sim, phoneMAC, "10.0.0.11", 5000, 2000)
	assertBlocked(t, sim, laptopMAC)
	if assertOK(t, app.call("health", nil))["synced"] != true {
		t.Fatal("expected health to report synced")
	}
}

func TestALaterSyncReplacesTheAllowedDevices(t *testing.T) {
	sim, app := startHelper(t)
	assertOK(t, app.call("sync", map[string]any{"devices": []any{
		map[string]any{"mac": phoneMAC, "ip": "10.0.0.11", "speed_cap": defaultCap},
	}}))

	assertOK(t, app.call("sync", map[string]any{"devices": []any{
		map[string]any{"mac": laptopMAC, "ip": "10.0.0.12", "speed_cap": defaultCap},
	}}))

	assertBlocked(t, sim, phoneMAC)
	assertAllowed(t, sim, laptopMAC, "10.0.0.12", 5000, 2000)
}

func syncNothing(t *testing.T, app *fakeApp) {
	t.Helper()
	assertOK(t, app.call("sync", map[string]any{"devices": []any{}}))
}

func TestAllowLetsOneDeviceThroughWithItsSpeedCap(t *testing.T) {
	sim, app := startHelper(t)
	syncNothing(t, app)

	assertOK(t, app.call("allow", map[string]any{"mac": "AA-BB-CC-00-00-01", "ip": "10.0.0.11", "speed_cap": defaultCap}))

	assertAllowed(t, sim, phoneMAC, "10.0.0.11", 5000, 2000)
	assertBlocked(t, sim, laptopMAC)
}

func TestBlockCutsOneDeviceOff(t *testing.T) {
	sim, app := startHelper(t)
	assertOK(t, app.call("sync", map[string]any{"devices": []any{
		map[string]any{"mac": phoneMAC, "ip": "10.0.0.11", "speed_cap": defaultCap},
		map[string]any{"mac": laptopMAC, "ip": "10.0.0.12", "speed_cap": defaultCap},
	}}))

	assertOK(t, app.call("block", map[string]any{"mac": phoneMAC}))

	assertBlocked(t, sim, phoneMAC)
	assertAllowed(t, sim, laptopMAC, "10.0.0.12", 5000, 2000)
}

func TestSetSpeedCapChangesTheCapOfAnAllowedDevice(t *testing.T) {
	sim, app := startHelper(t)
	assertOK(t, app.call("sync", map[string]any{"devices": []any{
		map[string]any{"mac": phoneMAC, "ip": "10.0.0.11", "speed_cap": defaultCap},
	}}))

	assertOK(t, app.call("set_speed_cap", map[string]any{"mac": phoneMAC, "speed_cap": map[string]any{"down_kbps": 1000, "up_kbps": 500}}))

	assertAllowed(t, sim, phoneMAC, "10.0.0.11", 1000, 500)
}

func TestSetSpeedCapRefusesABlockedDevice(t *testing.T) {
	sim, app := startHelper(t)
	syncNothing(t, app)

	assertError(t, app.call("set_speed_cap", map[string]any{"mac": phoneMAC, "speed_cap": defaultCap}), "not_allowed")

	assertBlocked(t, sim, phoneMAC)
}

func TestRequestsWithAnInvalidMACAddressAreRejected(t *testing.T) {
	sim, app := startHelper(t)
	syncNothing(t, app)

	assertError(t, app.call("allow", map[string]any{"mac": "not-a-mac", "ip": "10.0.0.11", "speed_cap": defaultCap}), "bad_request")

	if len(sim.AllowedDevices()) != 0 {
		t.Fatalf("expected nothing allowed, got %v", sim.AllowedDevices())
	}
}

func TestLookupMACFindsTheDeviceMappedToAnIP(t *testing.T) {
	sim, app := startHelper(t)
	must(t, sim.AddDevice(phoneMAC))
	must(t, sim.MapIP(phoneMAC, "10.0.0.11"))

	result := assertOK(t, app.call("lookup_mac", map[string]any{"ip": "10.0.0.11"}))

	if result["mac"] != phoneMAC {
		t.Fatalf("expected %s, got %v", phoneMAC, result)
	}
}

func TestLookupMACSaysUnknownForAnUnmappedIP(t *testing.T) {
	sim, app := startHelper(t)
	must(t, sim.AddDevice(phoneMAC))
	must(t, sim.MapIP(phoneMAC, "10.0.0.11"))

	assertError(t, app.call("lookup_mac", map[string]any{"ip": "10.0.0.99"}), "unknown_ip")
}

func TestDeviceOnlineAndOfflineEventsArePushed(t *testing.T) {
	sim, app := startHelper(t)
	must(t, sim.AddDevice(phoneMAC))
	must(t, sim.MapIP(phoneMAC, "10.0.0.11"))

	must(t, sim.Online(phoneMAC))
	online := app.event()
	must(t, sim.Offline(phoneMAC))
	offline := app.event()

	assertEvent(t, online, "device_online", map[string]any{"mac": phoneMAC, "ip": "10.0.0.11"})
	assertEvent(t, offline, "device_offline", map[string]any{"mac": phoneMAC})
}

func assertEvent(t *testing.T, msg map[string]any, name string, data map[string]any) {
	t.Helper()
	got, _ := msg["data"].(map[string]any)
	if msg["event"] != name || len(got) != len(data) {
		t.Fatalf("expected %s %v, got %v", name, data, msg)
	}
	for k, v := range data {
		if got[k] != v {
			t.Fatalf("expected %s %v, got %v", name, data, msg)
		}
	}
}

func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func assertAllowed(t *testing.T, sim *simulator.Simulator, mac, ip string, downKbps, upKbps int) {
	t.Helper()
	d, ok := sim.AllowedDevices()[mac]
	if !ok {
		t.Fatalf("expected %s to be allowed, allowed: %v", mac, sim.AllowedDevices())
	}
	if d.IP != ip || d.SpeedCap.DownKbps != downKbps || d.SpeedCap.UpKbps != upKbps {
		t.Fatalf("unexpected firewall entry for %s: %+v", mac, d)
	}
}

func assertBlocked(t *testing.T, sim *simulator.Simulator, mac string) {
	t.Helper()
	if _, ok := sim.AllowedDevices()[mac]; ok {
		t.Fatalf("expected %s to be blocked", mac)
	}
}
