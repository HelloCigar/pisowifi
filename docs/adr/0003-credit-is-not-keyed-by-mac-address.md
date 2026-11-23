# Credit is not keyed by MAC address

Most piso wifi systems store paid time against the client's MAC address. We store it in a Credit, and a Credit is reached through its Resume Code. The Device (the MAC address) is only the handle the firewall uses for whoever holds the Credit right now. We chose this because modern phones randomize and rotate MAC addresses, and because MAC addresses can be read and cloned on open Wi-Fi. If time were keyed by MAC, a changed MAC would lose the Customer's time, and a cloned MAC would hand that time to someone else with no way for the Customer to get it back.

## Consequences

- When a Customer's MAC address changes, they get their time back by entering their Resume Code. No Operator needs to step in.
- When two Devices use one MAC address, the Machine puts the Credit into Suspension. Only the Customer who holds the Resume Code can end it.
- Free trial time per MAC address is left out on purpose, because a randomized MAC defeats it.
