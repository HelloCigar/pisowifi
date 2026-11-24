# Helper protocol

This is the contract between the AdonisJS app and the privileged helper (ADR 0002). Both sides follow it. A change to it changes the helper and the app together, in one image.

The Go tests in `internal/server/server_test.go` talk to the real helper over its socket and check this contract. The app's in-memory fake of the helper client has to behave the same way.

## Transport

- A local Unix socket. The default is `pisowifi-helper.sock` in the temp directory, which suits a development PC, and `-socket` changes it. On the Machine it is `/run/pisowifi/helper.sock`.
- On a Windows PC, Node cannot connect to a Unix socket, so the simulator can listen on loopback TCP instead with `-tcp 127.0.0.1:7377`, and the app's `HELPER_ADDRESS` is `tcp://127.0.0.1:7377`. The helper refuses a TCP address that is not loopback. The messages are the same.
- Connecting needs write permission on the socket. On the Machine the helper runs as root and the app does not, so the helper is started with `-socket-group <the app's group>`: the socket then belongs to that group with mode `0660`, and only root and that group can connect. On a development PC the helper and the app run as the same user, so no group is needed.
- Each message is one JSON object on one line, ended by `\n`. Lines are at most 1 MiB. A longer line gets a `bad_request` reply with `"id": null`, and the helper closes the connection.
- The app connects. The helper never connects to the app.
- The app may send several requests without waiting. Replies may arrive between events, so the app matches each reply to its request by `id`.

## Messages

**Request** (app → helper):

```json
{"id": 7, "method": "allow", "params": {"mac": "aa:bb:cc:00:00:01", "ip": "10.0.0.11", "speed_cap": {"down_kbps": 5000, "up_kbps": 2000}}}
```

- `id` is a JSON number or string the app chooses, unique among its requests in flight. The helper copies it into the reply as given. A request without `id` gets `"id": null`.
- `params` is a JSON object, required for every method except `health`. A missing or `null` `params` gets `bad_request`.

**Reply** (helper → app), one per request:

```json
{"id": 7, "ok": true}
{"id": 8, "ok": true, "result": {"mac": "aa:bb:cc:00:00:01"}}
{"id": 9, "ok": false, "error": {"code": "not_synced", "message": "every Device stays blocked until the first sync"}}
```

A line that is not valid JSON gets a `bad_request` reply with `"id": null`.

**Event** (helper → app), pushed as it happens to every connected app. It has `event` and no `id`:

```json
{"event": "device_online", "data": {"mac": "aa:bb:cc:00:00:01", "ip": "10.0.0.11"}}
```

## Values

- **MAC address**: any form Go's `net.ParseMAC` reads for 6 bytes (`AA-BB-CC-00-00-01`, `aa:bb:cc:00:00:01`). The helper always sends the lower-case, colon-separated form, and the app should store that form.
- **IP address**: an IPv4 or IPv6 address as text.
- **Speed cap**: `{"down_kbps": 5000, "up_kbps": 2000}`, in kilobits per second. Both must be positive.

## Startup

When the helper starts, it blocks every Device and turns the Coin Acceptor's inhibit line on, so the Coin Acceptor rejects every coin. Until the first `sync`:

- `allow` and `set_speed_cap` fail with `not_synced`;
- `set_inhibit` with `"on": false` fails with `not_synced`;
- `block`, `set_inhibit` with `"on": true`, `lookup_mac` and `health` work.

So after a reboot or power loss nobody gets online, and no coin is taken, until the app has decided who has time left and sent `sync`. After the first `sync` the inhibit line stays on until the app turns it off. The app sends `sync` every time it connects, because the helper may have restarted.

## Requests

| Method | Params | Result | Errors |
| --- | --- | --- | --- |
| `health` | none | `{"backend": "simulator", "synced": false, "inhibited": true}` | |
| `sync` | `{"devices": [{"mac", "ip", "speed_cap"}, …]}` | none | `bad_request` |
| `allow` | `{"mac", "ip", "speed_cap"}` | none | `bad_request`, `not_synced` |
| `block` | `{"mac"}` | none | `bad_request` |
| `set_speed_cap` | `{"mac", "speed_cap"}` | none | `bad_request`, `not_synced`, `not_allowed` |
| `lookup_mac` | `{"ip"}` | `{"mac"}` | `bad_request`, `unknown_ip` |
| `set_inhibit` | `{"on"}` | none | `bad_request`, `not_synced` |

- **`health`**: `backend` names the backend the helper drives. `synced` is true once the first `sync` has arrived. `inhibited` is true while the Coin Acceptor's inhibit line is on.
- **`sync`**: replaces the whole allow list. The listed Devices are allowed with their speed caps, and every other Device is blocked. `devices` is required. An empty list (`[]`) blocks everyone. If `devices` is missing or one Device in it is invalid, nothing changes and it does not count as the first `sync`.
- **`allow`**: lets one Device through with its speed cap. Allowing a Device that is already allowed replaces its IP address and speed cap.
- **`block`**: cuts one Device off. Blocking a Device that is already blocked succeeds.
- **`set_speed_cap`**: changes the speed cap of an allowed Device. A blocked Device has no speed cap, so this fails with `not_allowed`. Use `allow` with the cap instead.
- **`lookup_mac`**: finds the MAC address of the Device that holds an IP address, from the DHCP leases or the ARP table. An IP address no Device holds fails with `unknown_ip`.
- **`set_inhibit`**: drives the Coin Acceptor's inhibit line. `"on": true` makes the Coin Acceptor reject every coin, and `"on": false` lets it accept coins. `on` is a required boolean. Setting the line to the state it is already in succeeds.

## Events

| Event | Data | When |
| --- | --- | --- |
| `device_online` | `{"mac", "ip"}` | A Device connects to the Hotspot Network. |
| `device_offline` | `{"mac"}` | A Device leaves the Hotspot Network. |
| `coin` | `{"pesos"}` | The Coin Acceptor accepted a coin worth `pesos`. |

**Coins.** The Coin Acceptor sends one pulse per peso, so a ₱20 coin is a train of 20 pulses that takes about a second. The helper sends one `coin` event per train, once the line has been quiet for 250 ms. Two coins dropped one after the other are two events. The helper sends every coin it counts, whatever the inhibit line says; a coin that arrives when no Coin Window is open is an Orphan Coin for the app to keep.

The helper does not replay events. An app that was not connected when an event happened does not get it.

## Error codes

| Code | Meaning |
| --- | --- |
| `bad_request` | The line is not JSON, `params` is missing, or a value is invalid. The message says which. |
| `unknown_method` | The helper does not know the method. |
| `not_synced` | The request would open the firewall or enable the Coin Acceptor before the first `sync`. |
| `not_allowed` | `set_speed_cap` on a blocked Device. |
| `unknown_ip` | `lookup_mac` found no Device for the IP address. |
| `backend_failed` | The firewall, traffic control or leases could not be changed or read. The message has the cause. The app should treat the change as not made and retry, or send `sync`. |

## Still to come

- A later ticket adds the `mac_conflict` event to the contract.
