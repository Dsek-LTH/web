package locale

import "testing"

func TestResolve(t *testing.T) {
	for in, want := range map[string]string{
		"":                        "en",
		"sv":                      "sv",
		"sv-SE,sv;q=0.9,en;q=0.8": "sv",
		"en-GB,en;q=0.9":          "en",
		"de-DE,de;q=0.9,sv;q=0.8": "sv",
		"de-DE,de;q=0.9":          "en",
		"svx":                     "en",
		" SV ; q=1":               "sv",
	} {
		if got := resolve(in); got != want {
			t.Errorf("resolve(%q) = %q, want %q", in, got, want)
		}
	}
}
