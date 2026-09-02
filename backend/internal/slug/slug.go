// Package slug ports ../../../src/lib/utils/slugify.ts's slug generation -
// shared by internal/articles and internal/events, since both features
// need the same "slugify, then suffix with a count on collision" pattern.
package slug

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

const defaultSlugMaxLength = 50

var (
	quotesPattern     = regexp.MustCompile(`['"]+`)
	nonAlnumPattern   = regexp.MustCompile(`(?i)[^a-z0-9]+`)
	hyphensPattern    = regexp.MustCompile(`-+`)
	edgeHyphenPattern = regexp.MustCompile(`^-+|-+$`)
)

// Slugify mirrors ../../../src/lib/utils/slugify.ts: NFKD-normalize, strip
// diacritics and quotes, collapse everything else into hyphens, truncate,
// then trim stray edge hyphens left by truncation.
func Slugify(s string) string {
	s = strings.TrimSpace(s)
	s = norm.NFKD.String(s)
	s = stripMarks(s)
	s = quotesPattern.ReplaceAllString(s, "")
	s = nonAlnumPattern.ReplaceAllString(s, "-")
	s = hyphensPattern.ReplaceAllString(s, "-")
	if len(s) > defaultSlugMaxLength {
		s = s[:defaultSlugMaxLength]
	}
	s = edgeHyphenPattern.ReplaceAllString(s, "")
	return strings.ToLower(s)
}

func stripMarks(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

// SlugWithCount mirrors slugWithCount from the same file: appended only
// once a plain slug collides with an existing one.
func SlugWithCount(slug string, count int) string {
	if count > 0 {
		return fmt.Sprintf("%s-%d", slug, count+1)
	}
	return slug
}
