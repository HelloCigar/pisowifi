# Piso WiFi

A coin-operated Wi-Fi vending system: customers drop coins into a machine and get internet access for the time they paid for.

## Language

### People and hardware

**Operator**:
The person who owns a Machine, sets its prices and collects its coins.
_Avoid_: Admin, owner, vendor

**Customer**:
A person who pays coins at a Machine to get internet access.
_Avoid_: User, client, subscriber

**Machine**:
One flashed board, with its Coin Acceptor, serving one Hotspot Network.
_Avoid_: Vendo, box, unit, router

**Coin Acceptor**:
The coin slot hardware that reports each accepted coin to the Machine.
_Avoid_: Coin slot, coin mech

### Payment

**Rate Tier**:
A price the Operator sets that buys a fixed amount of time, such as ₱5 for 1 hour.
_Avoid_: Promo, plan, package, rate

**Coin Window**:
A short period in which one Device holds the Coin Acceptor, and every coin inserted during it adds to that Device's Credit.
_Avoid_: Insert session, coin session

**Top-up**:
All the coins from one Coin Window, priced together against the Rate Tiers and added to a Credit.
_Avoid_: Load, purchase, transaction

**Orphan Coin**:
A coin the Coin Acceptor reports when no Coin Window is open. It belongs to no Credit until the Operator assigns it.
_Avoid_: Lost coin, stray coin

**Collection**:
The Operator emptying the coin box. It closes one period of takings and starts the next.
_Avoid_: Withdrawal, cash-out, payout

**Adjustment**:
Time the Operator adds to or removes from a Credit by hand, with a reason. It is not counted in coin takings.
_Avoid_: Comp, manual load, correction

### Access

**Device**:
A phone, laptop or other client currently connected to the network, known by its MAC address. A Device is transient; the same person may appear as a new Device when their MAC address changes.
_Avoid_: Client, user, MAC

**Credit**:
The paid internet time a Customer still has. A Credit is held by at most one Device at a time, and a Device holds at most one Credit.
_Avoid_: Balance, load, minutes, wallet

**Resume Code**:
The short code that belongs to one Credit for its whole life. Entering it on another Device moves the Credit to that Device.
_Avoid_: PIN, voucher, ticket

**Expiry**:
The point after which an unused Credit is gone, measured from its last top-up.
_Avoid_: Validity

**Pause**:
A state in which a Credit is kept but does not count down, and its Device has no internet access.
_Avoid_: Hold, freeze

**Suspension**:
A Pause the Machine forces when it sees two Devices using one MAC address. Only the Resume Code ends it.
_Avoid_: Ban, block, lockout

### Network

**Uplink**:
The network side that faces the ISP modem.
_Avoid_: WAN port, internet port

**Hotspot Network**:
The network side that customers connect to through the access points.
_Avoid_: LAN, client network
