// Package sanitize cleans user-written markdown and text, which may contain
// HTML, before it's stored.
package sanitize

import (
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

// Policy is bluemonday's UGC policy, except that quotes in text stay quotes.
// bluemonday escapes ' and " in text as &#39; and &#34;, which the old
// DOMPurify didn't; since what's stored is markdown (or plain text), the
// entities would show up in edit forms, code spans, the calendar feed and
// notifications.
type Policy struct {
	policy *bluemonday.Policy
}

// UGC returns the policy for user-generated content. It's safe for
// concurrent use.
func UGC() *Policy {
	return &Policy{policy: bluemonday.UGCPolicy()}
}

func (p *Policy) Sanitize(s string) string {
	return unescapeQuotesInText(p.policy.Sanitize(s))
}

// SanitizePtr sanitizes *s, keeping nil as nil.
func (p *Policy) SanitizePtr(s *string) *string {
	if s == nil {
		return nil
	}
	clean := p.Sanitize(*s)
	return &clean
}

// unescapeQuotesInText turns &#39; and &#34; back into quotes outside tags.
// In bluemonday's output every raw < starts a tag and every raw > ends one
// (text and attribute values have them escaped), so this is a plain scan.
// Inside a tag the entities stay: they keep attribute values quoted.
func unescapeQuotesInText(s string) string {
	if !strings.Contains(s, "&#") {
		return s
	}
	var b strings.Builder
	b.Grow(len(s))
	inTag := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c == '<':
			inTag = true
		case c == '>':
			inTag = false
		case !inTag && strings.HasPrefix(s[i:], "&#39;"):
			b.WriteByte('\'')
			i += len("&#39;") - 1
			continue
		case !inTag && strings.HasPrefix(s[i:], "&#34;"):
			b.WriteByte('"')
			i += len("&#34;") - 1
			continue
		}
		b.WriteByte(c)
	}
	return b.String()
}
