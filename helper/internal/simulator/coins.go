package simulator

import (
	"fmt"
	"slices"
	"time"

	"github.com/HelloCigar/pisowifi/helper/internal/coins"
	"github.com/HelloCigar/pisowifi/helper/internal/server"
)

// Denominations are the coins the fake Coin Acceptor takes, in pesos.
var Denominations = []int{1, 5, 10, 20}

const (
	// pulseSpacing is the time between two pulses of one coin, so a ₱20 coin
	// takes about a second, as on the real Coin Acceptor.
	pulseSpacing = 50 * time.Millisecond
	// coinSpacing is the quiet time between two coins dropped back to back:
	// just longer than coins.Gap, the closest two coins can come and still
	// count as two.
	coinSpacing = coins.Gap + pulseSpacing
	// slotSize is how many dropped coins may wait for their turn.
	slotSize = 16
)

// InsertCoin drops a coin worth pesos into the fake Coin Acceptor. It sends
// one pulse per peso, and the pulses are counted into a coin event as the
// real backend counts the GPIO line. Coins dropped back to back wait their
// turn. While the inhibit line is on, the Coin Acceptor returns the coin.
func (s *Simulator) InsertCoin(pesos int) error {
	if !slices.Contains(Denominations, pesos) {
		return fmt.Errorf("there is no ₱%d coin; the Coin Acceptor takes ₱1, ₱5, ₱10 and ₱20", pesos)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.inhibited {
		s.log.Printf("coin acceptor: ₱%d coin returned, inhibit is on", pesos)
		return fmt.Errorf("the Coin Acceptor is inhibited and returned the ₱%d coin", pesos)
	}
	select {
	case s.slot <- pesos:
		s.log.Printf("coin acceptor: ₱%d coin dropped", pesos)
		return nil
	default:
		return fmt.Errorf("the Coin Acceptor is busy; wait for the coins already dropped")
	}
}

// runCoinAcceptor turns each dropped coin into its pulse train, and counts
// the pulses back into coin events. It runs for the life of the simulator.
func (s *Simulator) runCoinAcceptor() {
	pulses := make(chan time.Time)
	go coins.Count(pulses, coins.Gap, func(pesos int) {
		s.mu.Lock()
		defer s.mu.Unlock()
		s.log.Printf("coin acceptor: counted a ₱%d coin", pesos)
		s.emit(server.Coin(pesos))
	})

	for pesos := range s.slot {
		for i := range pesos {
			if i > 0 {
				time.Sleep(pulseSpacing)
			}
			pulses <- time.Now()
		}
		time.Sleep(coinSpacing)
	}
}
