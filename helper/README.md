# Piso WiFi helper

The privileged helper of the Machine (ADR 0002). It runs as root and owns the firewall, the speed caps and the Coin Acceptor. The AdonisJS app talks to it over a Unix socket, using the protocol in [PROTOCOL.md](PROTOCOL.md).

Requires Go 1.27 or later.

## Run the simulator on a development PC

The simulator backend keeps the firewall and the Coin Acceptor's inhibit line in memory, logs every change the real Machine would make, and fakes Devices and coins from a console. It runs on Windows, macOS and Linux.

```sh
cd helper
go run ./cmd/pisowifi-helper -backend simulator
```

It prints the socket path it listens on. Set the app's `HELPER_ADDRESS` to that path. Type commands into the console to fake Devices and coins:

```text
add aa:bb:cc:00:00:01
map aa:bb:cc:00:00:01 10.0.0.11
online aa:bb:cc:00:00:01
offline aa:bb:cc:00:00:01
coin 20
devices
firewall
```

`coin` drops a ₱1, ₱5, ₱10 or ₱20 coin. The simulator sends its pulses one per peso, about 50 ms apart, and counts them into a `coin` event as the real Machine does. While the inhibit line is on, which it is from startup until the app turns it off, the Coin Acceptor returns the coin. `firewall` shows the inhibit line too.

### On Windows

Node cannot reach a Unix socket on Windows, so listen on loopback TCP instead:

```sh
go run ./cmd/pisowifi-helper -backend simulator -tcp 127.0.0.1:7377
```

and set `HELPER_ADDRESS=tcp://127.0.0.1:7377` in the app's `.env`. To open the portal as a fake Device from the same PC, run the app with `HOST=127.0.0.1` and lease the fake Device the address your browser connects from:

```text
add aa:bb:cc:00:00:01
map aa:bb:cc:00:00:01 127.0.0.1
online aa:bb:cc:00:00:01
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

On the Machine the helper runs as root, and the app connects without root. Start it with the app's group so the app can reach the socket:

```sh
pisowifi-helper -socket /run/pisowifi/helper.sock -socket-group pisowifi
```

The socket then has that group and mode `0660`. The directory `/run/pisowifi` has to exist first; the install script sets it up.

The real hardware backends come in a later ticket. Until then, the binary only has the simulator backend.

## Layout

- `cmd/pisowifi-helper`: the binary and its flags.
- `internal/server`: the socket protocol, and the rule that every Device stays blocked and the Coin Acceptor stays inhibited until the first `sync`. It drives a `Backend`.
- `internal/coins`: groups the Coin Acceptor's pulses into coins. Every backend counts its pulses with it.
- `internal/simulator`: the simulator backend, its fake Coin Acceptor, and its console.
