package simulator

import (
	"bufio"
	"fmt"
	"io"
	"maps"
	"slices"
	"strings"
)

const consoleHelp = `commands:
  add <mac>           put a fake Device on the Hotspot Network
  map <mac> <ip>      lease an IP address to a fake Device
  online <mac>        connect a fake Device (sends device_online)
  offline <mac>       disconnect a fake Device (sends device_offline)
  devices             list fake Devices
  firewall            list allowed Devices and their speed caps
  help                show this help`

// RunConsole reads commands that fake Devices, one per line, until in ends.
func (s *Simulator) RunConsole(in io.Reader, out io.Writer) {
	fmt.Fprintln(out, consoleHelp)
	scanner := bufio.NewScanner(in)
	for scanner.Scan() {
		args := strings.Fields(scanner.Text())
		if len(args) == 0 {
			continue
		}
		if err := s.runCommand(args, out); err != nil {
			fmt.Fprintln(out, "error:", err)
		}
	}
}

func (s *Simulator) runCommand(args []string, out io.Writer) error {
	switch {
	case args[0] == "add" && len(args) == 2:
		return s.AddDevice(args[1])
	case args[0] == "map" && len(args) == 3:
		return s.MapIP(args[1], args[2])
	case args[0] == "online" && len(args) == 2:
		return s.Online(args[1])
	case args[0] == "offline" && len(args) == 2:
		return s.Offline(args[1])
	case args[0] == "devices" && len(args) == 1:
		s.printDevices(out)
		return nil
	case args[0] == "firewall" && len(args) == 1:
		s.printFirewall(out)
		return nil
	case args[0] == "help":
		fmt.Fprintln(out, consoleHelp)
		return nil
	default:
		return fmt.Errorf("unknown command %q; type help", strings.Join(args, " "))
	}
}

func (s *Simulator) printDevices(out io.Writer) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.devices) == 0 {
		fmt.Fprintln(out, "no fake Devices")
		return
	}
	for _, mac := range slices.Sorted(maps.Keys(s.devices)) {
		d := s.devices[mac]
		state := "offline"
		if d.online {
			state = "online"
		}
		ip := d.ip
		if ip == "" {
			ip = "no IP"
		}
		fmt.Fprintf(out, "%s  %-15s  %s\n", mac, ip, state)
	}
}

func (s *Simulator) printFirewall(out io.Writer) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.allowed) == 0 {
		fmt.Fprintln(out, "every Device is blocked")
		return
	}
	for _, mac := range slices.Sorted(maps.Keys(s.allowed)) {
		d := s.allowed[mac]
		fmt.Fprintf(out, "%s  %-15s  allowed, cap %d/%d kbps\n", mac, d.IP, d.SpeedCap.DownKbps, d.SpeedCap.UpKbps)
	}
}
