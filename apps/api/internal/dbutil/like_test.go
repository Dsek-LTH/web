package dbutil

import "testing"

func TestEscapeLike(t *testing.T) {
	cases := map[string]string{
		"":            "",
		"plain":       "plain",
		"100%":        `100\%`,
		"a_b":         `a\_b`,
		`back\slash`:  `back\\slash`,
		`\%_`:         `\\\%\_`,
		"dsek.km.mdm": "dsek.km.mdm",
	}
	for in, want := range cases {
		if got := EscapeLike(in); got != want {
			t.Errorf("EscapeLike(%q) = %q, want %q", in, got, want)
		}
	}
	if EscapeLikePtr(nil) != nil {
		t.Error("EscapeLikePtr(nil) != nil")
	}
}
