// Command pisowifi-helper is the privileged helper of the Piso WiFi Machine
// (ADR 0002). It serves the protocol in PROTOCOL.md on a Unix socket.
//
// On a development PC, run it with the simulator backend and fake Devices
// from its console on stdin:
//
//	go run ./cmd/pisowifi-helper -backend simulator
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"

	"github.com/HelloCigar/pisowifi/helper/internal/server"
	"github.com/HelloCigar/pisowifi/helper/internal/simulator"
)

func main() {
	backendName := flag.String("backend", "simulator", "backend to drive: simulator")
	socket := flag.String("socket", defaultSocket(), "path of the Unix socket the app connects to")
	flag.Parse()

	if *backendName != "simulator" {
		fmt.Fprintf(os.Stderr, "unknown backend %q; only simulator is built so far\n", *backendName)
		os.Exit(2)
	}
	sim := simulator.New(os.Stderr)

	srv, err := server.Listen(*socket, sim)
	if err != nil {
		log.Fatalf("listen on %s: %v", *socket, err)
	}
	log.Printf("helper listening on %s with the %s backend", *socket, sim.Name())

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
	os.Remove(*socket)
}

func defaultSocket() string {
	if runtime.GOOS == "linux" {
		return "/run/pisowifi/helper.sock"
	}
	return filepath.Join(os.TempDir(), "pisowifi-helper.sock")
}
