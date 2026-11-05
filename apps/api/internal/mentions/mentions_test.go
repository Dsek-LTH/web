package mentions

import (
	"slices"
	"testing"
)

func TestStudentIDs(t *testing.T) {
	got := StudentIDs([]string{
		"hej [@Anna A](/members/an1234aa-s) och [@Bo](/members/bo5678bb-s)",
		"igen [@Anna](/members/an1234aa-s), [ingen länk](/news/x)",
		"",
	})
	want := []string{"an1234aa-s", "bo5678bb-s"}
	if !slices.Equal(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
