# Piso WiFi helper

The privileged helper of the Machine (ADR 0002). It runs as root and owns the firewall, the speed caps and, later, the Coin Acceptor. The AdonisJS app talks to it over a Unix socket, using the protocol in [PROTOCOL.md](PROTOCOL.md).

Requires Go 1.27 or later.

## Run the simulator on a development PC

The simulator backend keeps the firewall in memory, logs every change the real Machine would make, and fakes Devices from a console. It runs on Windows, macOS and Linux.

```sh
cd helper
go run ./cmd/pisowifi-helper -backend simulator
```

It prints the socket path it listens on. Type commands into the console to fake Devices:

```text
add aa:bb:cc:00:00:01
map aa:bb:cc:00:00:01 10.0.0.11
online aa:bb:cc:00:00:01
offline aa:bb:cc:00:00:01
devices
firewall
```

## Test

```sh
go test ./...
```

The tests start the real helper on a socket with the simulator backend and talk to it as the app would.

## Build for the Machine

The board is ARMv7 or ARM64 Linux:

```sh
GOOS=linux GOARCH=arm GOARM=7 go build -o dist/pisowifi-helper-armv7 ./cmd/pisowifi-helper
GOOS=linux GOARCH=arm64 go build -o dist/pisowifi-helper-arm64 ./cmd/pisowifi-helper
```

The real hardware backends come in a later ticket. Until then, the binary only has the simulator backend.

## Layout

- `cmd/pisowifi-helper`: the binary and its flags.
- `internal/server`: the socket protocol, and the rule that every Device stays blocked until the first `sync`. It drives a `Backend`.
- `internal/simulator`: the simulator backend and its console.
