package notifications

import (
	"html"
	"regexp"
	"strings"
	"unicode/utf8"
)

// truncate cuts s to at most limit characters, ending with "..." when it
// had to cut. It counts runes, not bytes: cutting inside å/ä/ö would leave
// invalid UTF-8, which Postgres rejects.
func truncate(s string, limit int) string {
	if utf8.RuneCountInString(s) <= limit {
		return s
	}
	runes := []rune(s)
	return string(runes[:limit-3]) + "..."
}

// cut is truncate without the "...": the first limit characters.
func cut(s string, limit int) string {
	if utf8.RuneCountInString(s) <= limit {
		return s
	}
	return string([]rune(s)[:limit])
}

var (
	mdImage    = regexp.MustCompile(`!\[([^\]]*)\]\([^)]*\)`)
	mdLink     = regexp.MustCompile(`\[([^\]]*)\]\([^)]*\)`)
	htmlTag    = regexp.MustCompile(`<[^>]*>`)
	mdLineMark = regexp.MustCompile(`(?m)^\s*(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)`)
	mdInline   = regexp.MustCompile("\\*\\*|__|~~|`+")
)

// plainText is a small stand-in for the old markdownToTxt: it drops images,
// keeps link text, removes HTML tags, heading/quote/list markers and
// emphasis, decodes entities and collapses whitespace.
func plainText(markdown string) string {
	s := mdImage.ReplaceAllString(markdown, "$1")
	s = mdLink.ReplaceAllString(s, "$1")
	s = htmlTag.ReplaceAllString(s, "")
	s = mdLineMark.ReplaceAllString(s, "")
	s = mdInline.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.Join(strings.Fields(s), " ")
}
