package sanitize

import "testing"

func TestSanitize(t *testing.T) {
	p := UGC()
	cases := []struct{ in, want string }{
		{`it's "x"`, `it's "x"`},
		{"`don't` and \"quotes\"", "`don't` and \"quotes\""},
		{`<a href="https://dsek.se">it's</a>`, `<a href="https://dsek.se" rel="nofollow">it's</a>`},
		// Inside a tag the entities stay, so the attribute stays quoted.
		{`<p title="a 'b'">it's</p>`, `<p title="a &#39;b&#39;">it's</p>`},
		{`<script>alert("x")</script>ok`, `ok`},
		{`<img src=x onerror="alert('x')">`, `<img src="x">`},
		{`a < b & c`, `a &lt; b &amp; c`},
		{`&#39; typed as an entity`, `' typed as an entity`},
	}
	for _, c := range cases {
		if got := p.Sanitize(c.in); got != c.want {
			t.Errorf("Sanitize(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestSanitizePtr(t *testing.T) {
	if UGC().SanitizePtr(nil) != nil {
		t.Error("nil should stay nil")
	}
}
