package coins_test

import (
	"slices"
	"testing"
	"time"

	"github.com/HelloCigar/pisowifi/helper/internal/coins"
)

// count feeds pulses seen at the given offsets all at once, so only their
// timestamps decide where one coin ends and the next begins, and returns
// the coins counted.
func count(offsets ...time.Duration) []int {
	pulses := make(chan time.Time, len(offsets))
	start := time.Now()
	for _, offset := range offsets {
		pulses <- start.Add(offset)
	}
	close(pulses)

	var counted []int
	coins.Count(pulses, func(pesos int) { counted = append(counted, pesos) })
	return counted
}

// train returns the offsets of n pulses 50 ms apart, starting at from.
func train(from time.Duration, n int) []time.Duration {
	offsets := make([]time.Duration, n)
	for i := range offsets {
		offsets[i] = from + time.Duration(i)*50*time.Millisecond
	}
	return offsets
}

func TestPulsesCloserThanTheGapAreOneCoin(t *testing.T) {
	five := train(0, 5)
	// The sixth pulse comes just inside the gap, so it still belongs.
	got := count(append(five, five[4]+coins.Gap-time.Millisecond)...)

	if !slices.Equal(got, []int{6}) {
		t.Fatalf("expected one ₱6 coin, got %v", got)
	}
}

func TestAPulseAGapAfterTheLastStartsTheNextCoin(t *testing.T) {
	five := train(0, 5)
	ten := train(five[4]+coins.Gap, 10)

	got := count(append(five, ten...)...)

	if !slices.Equal(got, []int{5, 10}) {
		t.Fatalf("expected ₱5 then ₱10, got %v", got)
	}
}

func TestATrainEndsOnceTheLineStaysQuietForTheGap(t *testing.T) {
	pulses := make(chan time.Time)
	counted := make(chan int, 1)
	go coins.Count(pulses, func(pesos int) { counted <- pesos })
	t.Cleanup(func() { close(pulses) })

	for range 20 {
		pulses <- time.Now()
	}

	select {
	case pesos := <-counted:
		if pesos != 20 {
			t.Fatalf("expected a ₱20 coin, got ₱%d", pesos)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the train never ended")
	}
}
