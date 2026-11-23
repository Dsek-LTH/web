package notifications

import (
	"testing"
	"time"
)

func TestBookingTimeIsSwedish(t *testing.T) {
	cases := map[time.Time]string{
		time.Date(2026, 1, 15, 17, 30, 0, 0, time.UTC): "15/01 18:30", // CET
		time.Date(2026, 6, 30, 22, 0, 0, 0, time.UTC):  "01/07 00:00", // CEST
	}
	for in, want := range cases {
		if got := bookingTime(in); got != want {
			t.Errorf("bookingTime(%v) = %q, want %q", in, got, want)
		}
	}
}
