package main

import (
	"testing"
	"time"
)

func TestRetryAttempts(t *testing.T) {
	delays := []time.Duration{time.Minute, 5 * time.Minute}

	tests := []struct {
		name         string
		succeedOn    int
		wantAttempts int
		wantSleeps   []time.Duration
	}{
		{"stops after first success", 1, 1, nil},
		{"retries until success", 2, 2, delays[:1]},
		{"gives up when out of delays", 99, 3, delays},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var slept []time.Duration
			attempts := 0

			retryAttempts(delays, func(d time.Duration) { slept = append(slept, d) }, func() bool {
				attempts++

				return attempts == test.succeedOn
			})

			if attempts != test.wantAttempts {
				t.Errorf("attempts = %d, want %d", attempts, test.wantAttempts)
			}
			if len(slept) != len(test.wantSleeps) {
				t.Errorf("slept %v, want %v", slept, test.wantSleeps)
			}
		})
	}
}
