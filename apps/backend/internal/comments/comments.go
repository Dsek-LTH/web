// Package comments holds the rules article and event comments share:
// content validation and who may delete a comment.
package comments

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/dsek-lth/web/backend/internal/auth"
)

// MaxLength matches the comment form's zod limit and article_comments'
// VARCHAR(255) column (upstream #1390).
const MaxLength = 255

var ErrInvalidContent = errors.New("invalid comment content")

// Normalize trims content and checks it is non-empty and at most MaxLength
// characters.
func Normalize(content string) (string, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return "", fmt.Errorf("%w: empty", ErrInvalidContent)
	}
	if n := utf8.RuneCountInString(content); n > MaxLength {
		return "", fmt.Errorf("%w: %d characters, max %d", ErrInvalidContent, n, MaxLength)
	}
	return content, nil
}

// CanDelete reports whether identity may delete a comment written by
// commentMemberID: moderators holding deletePolicy, or the comment's own
// author - the old ZModel's two @@allow("delete", ...) rules on
// ArticleComment/EventComment.
func CanDelete(identity *auth.Identity, deletePolicy, commentMemberID string) bool {
	if identity == nil {
		return false
	}
	return identity.Has(deletePolicy) ||
		(identity.MemberID != "" && identity.MemberID == commentMemberID)
}
