// Package coins turns the Coin Acceptor's pulses into coins. The Coin
// Acceptor is programmed to send one pulse per peso, so a ₱20 coin is a
// train of 20 pulses that takes about a second. A gap with no pulse ends
// each train.
package coins

import "time"

// Gap is how long the line stays quiet before a pulse train counts as one
// finished coin. It is longer than the space between two pulses of a coin,
// about 50 ms, and shorter than the time between two coins dropped one after
// the other.
const Gap = 250 * time.Millisecond

// Count reads pulses, each the time it was seen, and calls coin with the
// value of every finished train. A train finishes once Gap has passed after
// its last pulse, or when a pulse arrives Gap or more after it. Count returns
// when pulses is closed, after reporting the train in progress. The real
// backend feeds it from the GPIO line, and the simulator from fake coins.
func Count(pulses <-chan time.Time, coin func(pesos int)) {
	var train counter
	report := func(pesos int) {
		if pesos > 0 {
			coin(pesos)
		}
	}
	quiet := time.NewTimer(Gap)
	quiet.Stop()
	for {
		select {
		case at, ok := <-pulses:
			if !ok {
				report(train.flush())
				return
			}
			report(train.pulse(at))
			quiet.Reset(Gap)
		case <-quiet.C:
			report(train.flush())
		}
	}
}

// counter is the pulse train in progress.
type counter struct {
	pulses int
	last   time.Time
}

// pulse adds one pulse seen at at. If the line was quiet for Gap before it,
// the pulse starts a new train, and pulse returns the value of the train it
// ends; otherwise it returns 0. This catches a train whose quiet timer had
// not fired yet when the next coin's first pulse came in.
func (c *counter) pulse(at time.Time) int {
	finished := 0
	if c.pulses > 0 && at.Sub(c.last) >= Gap {
		finished = c.flush()
	}
	c.pulses++
	c.last = at
	return finished
}

// flush ends the train in progress and returns its value in pesos, or 0
// when no train is in progress.
func (c *counter) flush() int {
	pesos := c.pulses
	c.pulses = 0
	return pesos
}
