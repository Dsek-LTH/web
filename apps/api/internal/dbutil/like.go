package dbutil

import "strings"

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// EscapeLike escapes LIKE/ILIKE's wildcards (`%`, `_`) and its default
// escape character (`\`) in s, so a caller-supplied search term or prefix
// matches literally inside a pattern such as `'%' || $1 || '%'`.
func EscapeLike(s string) string {
	return likeEscaper.Replace(s)
}

// EscapeLikePtr is EscapeLike for an optional string; nil stays nil.
func EscapeLikePtr(s *string) *string {
	if s == nil {
		return nil
	}
	escaped := EscapeLike(*s)
	return &escaped
}
