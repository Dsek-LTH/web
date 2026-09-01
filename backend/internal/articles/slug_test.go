package articles

import "testing"

// Cases taken from ../../src/lib/utils/slugify.test.ts to keep parity with
// the TS implementation this replaces.
func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Diss #2 till 10 staben":       "diss-2-till-10-staben",
		"Bumbibjörnarnas fyllesång":    "bumbibjornarnas-fyllesang",
		"toString = null":              "tostring-null",
		"Ä&amp;&amp;P diss 11":         "a-amp-amp-p-diss-11",
		"Debatt - SåS 17":              "debatt-sas-17",
		"a b c":                        "a-b-c",
		"":                             "",
		"  leading-trailing  ":         "leading-trailing",
		"Åpple sträßé":                 "apple-stra-e",
		`"quoted string"`:              "quoted-string",
		"a!b@c#d$e%f\\g&h*i(j)k_l+m=n": "a-b-c-d-e-f-g-h-i-j-k-l-m-n",
		"--leading-trailing--":         "leading-trailing",
		"UpperCase":                    "uppercase",
	}

	for input, want := range cases {
		if got := Slugify(input); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestSlugifyTruncates(t *testing.T) {
	long := ""
	for range 100 {
		long += "a"
	}
	want := ""
	for range defaultSlugMaxLength {
		want += "a"
	}
	if got := Slugify(long); got != want {
		t.Errorf("Slugify(100 a's) = %q, want %d a's", got, defaultSlugMaxLength)
	}
}

func TestSlugWithCount(t *testing.T) {
	if got := SlugWithCount("foo", 0); got != "foo" {
		t.Errorf("SlugWithCount(foo, 0) = %q, want foo", got)
	}
	if got := SlugWithCount("foo", 1); got != "foo-2" {
		t.Errorf("SlugWithCount(foo, 1) = %q, want foo-2", got)
	}
}
