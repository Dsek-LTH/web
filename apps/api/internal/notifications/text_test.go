package notifications

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestTruncateKeepsValidUTF8(t *testing.T) {
	s := strings.Repeat("å", 300)
	got := truncate(s, 255)
	if !utf8.ValidString(got) || utf8.RuneCountInString(got) != 255 ||
		!strings.HasSuffix(got, "...") {
		t.Errorf(
			"truncate gave %d runes, valid=%v",
			utf8.RuneCountInString(got),
			utf8.ValidString(got),
		)
	}
	if got := truncate("kort", 255); got != "kort" {
		t.Errorf("short string changed: %q", got)
	}
	if got := cut(strings.Repeat("ä", 300), 254); !utf8.ValidString(got) ||
		utf8.RuneCountInString(got) != 254 {
		t.Errorf("cut gave %d runes", utf8.RuneCountInString(got))
	}
}

func TestPlainText(t *testing.T) {
	in := "# Rubrik\n\n**Fet** text med [en länk](https://dsek.se) och " +
		"![bild](https://x/y.png) av [@Anna](/members/an1234an-s).\n\n" +
		"- punkt\n> citat &amp; `kod` <b>html</b>"
	want := "Rubrik Fet text med en länk och bild av @Anna. punkt citat & kod html"
	if got := plainText(in); got != want {
		t.Errorf("plainText = %q, want %q", got, want)
	}
}
