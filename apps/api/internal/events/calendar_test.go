package events

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestWriteICSLineFolds(t *testing.T) {
	var b strings.Builder
	value := strings.Repeat("åäö", 60)
	writeICSLine(&b, "DESCRIPTION", value)
	lines := strings.Split(strings.TrimSuffix(b.String(), "\r\n"), "\r\n")
	if len(lines) < 2 {
		t.Fatalf("expected folding, got %d line(s)", len(lines))
	}
	var unfolded strings.Builder
	for i, line := range lines {
		if len(line) > 75 {
			t.Errorf("line %d is %d octets", i, len(line))
		}
		if !utf8.ValidString(line) {
			t.Errorf("line %d splits a character", i)
		}
		if i > 0 {
			if !strings.HasPrefix(line, " ") {
				t.Errorf("continuation line %d doesn't start with a space", i)
			}
			line = line[1:]
		}
		unfolded.WriteString(line)
	}
	if unfolded.String() != "DESCRIPTION:"+value {
		t.Errorf("unfolding doesn't give back the original line")
	}
}

func TestICSEscape(t *testing.T) {
	got := icsEscape("a,b;c\\d\ne")
	want := `a\,b\;c\\d\ne`
	if got != want {
		t.Errorf("icsEscape = %q, want %q", got, want)
	}
}
