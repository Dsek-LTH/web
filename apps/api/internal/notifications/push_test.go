package notifications

import (
	"encoding/json"
	"slices"
	"testing"
)

// Mirrors upstream's push.test.ts getUnregisteredTokens case.
func TestUnregisteredTokens(t *testing.T) {
	var res expoPushResponse
	raw := `{"data":[
		{"status":"ok","id":"1"},
		{"status":"error","message":"gone","details":{"error":"DeviceNotRegistered","expoPushToken":"ExponentPushToken[a]"}},
		{"status":"error","message":"too big","details":{"error":"MessageTooBig","expoPushToken":"ExponentPushToken[b]"}},
		{"status":"error","message":"gone","details":{"error":"DeviceNotRegistered"}}
	]}`
	if err := json.Unmarshal([]byte(raw), &res); err != nil {
		t.Fatal(err)
	}
	got := unregisteredTokens(res.Data)
	if !slices.Equal(got, []string{"ExponentPushToken[a]"}) {
		t.Errorf("got %v", got)
	}
}
