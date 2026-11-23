# A privileged helper owns GPIO and the firewall

The AdonisJS app runs on the Machine as a user without root. It does not touch GPIO pins or nftables itself. A small separate helper runs as root. It counts Coin Acceptor pulses, drives the acceptor's inhibit line, and adds or removes each Device's firewall and speed-cap rules. The app talks to it over a local Unix socket. We chose this so that a bug or crash in the web app, which faces every Customer on an open network, cannot run code as root or leave the firewall open. Coin pulses also need timing that a busy web process can't guarantee.

## Considered Options

- **The app runs as root and does everything.** Simplest, but a web exploit on an open hotspot would give root on the Machine.
- **The app calls `sudo` for scoped commands.** Avoids running a daemon, but it can't count coin pulses reliably, and each firewall change starts a new process.

## Consequences

- The socket protocol between the app and the helper is a contract. Changing it means updating both sides together in one image.
- When the helper starts, it blocks every Device until the app tells it which Devices have time left. That keeps Credits frozen after a power loss.
