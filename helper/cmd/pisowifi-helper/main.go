// Command pisowifi-helper is the privileged helper of the Piso WiFi Machine
// (ADR 0002). It serves the protocol in PROTOCOL.md on a Unix socket.
//
// On a development PC, run it with the simulator backend and fake Devices
// and coins from its console on stdin:
//
//	go run ./cmd/pisowifi-helper -backend simulator
//
// On a Windows PC, Node cannot reach a Unix socket, so listen on loopback
// TCP instead and set the app's HELPER_ADDRESS to tcp://127.0.0.1:7377:
//
//	go run ./cmd/pisowifi-helper -backend simulator -tcp 127.0.0.1:7377
//
// On the Machine it runs as root, and -socket-group lets the app's group
// connect:
//
//	pisowifi-helper -socket /run/pisowifi/helper.sock -socket-group pisowifi
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"os/user"
	"path/filepath"
	"strconv"
	"syscall"

	"github.com/HelloCigar/pisowifi/helper/internal/server"
	"github.com/HelloCigar/pisowifi/helper/internal/simulator"
)

func main() {
	backendName := flag.String("backend", "simulator", "backend to drive: simulator")
	socket := flag.String("socket", filepath.Join(os.TempDir(), "pisowifi-helper.sock"), "path of the Unix socket the app connects to")
	socketGroup := flag.String("socket-group", "", "group that may connect to the socket; the socket gets this group and mode 0660 (Linux)")
	tcp := flag.String("tcp", "", "listen on this loopback TCP address instead of the socket, for the simulator on a Windows PC")
	flag.Parse()

	if *backendName != "simulator" {
		fmt.Fprintf(os.Stderr, "unknown backend %q; only simulator is built so far\n", *backendName)
		os.Exit(2)
	}
	sim := simulator.New(os.Stderr)

	if *tcp != "" {
		srv, err := server.ListenTCP(*tcp, sim)
		if err != nil {
			log.Fatalf("listen on %s: %v", *tcp, err)
		}
		log.Printf("helper listening on tcp://%s with the %s backend", srv.Addr(), sim.Name())
		run(srv, sim)
		return
	}

	srv, err := server.Listen(*socket, sim)
	if err != nil {
		log.Fatalf("listen on %s: %v", *socket, err)
	}
	if *socketGroup != "" {
		if err := grantGroup(*socket, *socketGroup); err != nil {
			srv.Close()
			log.Fatalf("give %s to group %s: %v", *socket, *socketGroup, err)
		}
	}
	log.Printf("helper listening on %s with the %s backend", *socket, sim.Name())
	run(srv, sim)
	os.Remove(*socket)
}

// run serves the app and the simulator's console until the helper is told
// to stop.
func run(srv *server.Server, sim *simulator.Simulator) {
	go func() {
		if err := srv.Serve(); err != nil {
			log.Fatalf("serve: %v", err)
		}
	}()
	go sim.RunConsole(os.Stdin, os.Stdout)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	srv.Close()
}

// grantGroup lets the members of group connect to the socket and nobody else
// but its owner. Connecting to a Unix socket needs write permission, and the
// helper runs as root while the app does not. It runs before Serve, so no
// connection is answered with the wrong permissions.
func grantGroup(socket, group string) error {
	g, err := user.LookupGroup(group)
	if err != nil {
		return err
	}
	gid, err := strconv.Atoi(g.Gid)
	if err != nil {
		return err
	}
	if err := os.Chown(socket, -1, gid); err != nil {
		return err
	}
	return os.Chmod(socket, 0o660)
}
