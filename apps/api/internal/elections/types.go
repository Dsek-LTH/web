package elections

import (
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// Election is a single committee's open-nominations/voting announcement -
// see Service.List. Link points to an external form/vote (e.g. a Google
// Form); this feature has no in-house ballot/voting mechanism of its own.
// Ships both the raw
// markdownSv/markdownEn pair and one resolved Markdown field, same pattern
// as Alert.Message. Committee is always populated (every query joins it) -
// the election card needs it to render without a second request, same
// reasoning as Mandate.member/Position.committee in internal/committees.
type Election struct {
	ID          string             `json:"id"`
	CommitteeID string             `json:"committeeId"`
	Committee   apitypes.Committee `json:"committee"            doc:"The committee holding the election."`
	Markdown    string             `json:"markdown"             doc:"markdownEn or markdownSv, resolved from Accept-Language."`
	MarkdownSv  string             `json:"markdownSv"`
	MarkdownEn  *string            `json:"markdownEn,omitempty"`
	Link        string             `json:"link"                 doc:"Where to nominate or vote (an external form)."`
	CreatedAt   time.Time          `json:"createdAt"`
	ExpiresAt   time.Time          `json:"expiresAt"            doc:"When nominations close; the election is hidden from the list after."`
}

// ElectionInput is the create/update body - full-replace, same full-replace (PUT)
// -as-PATCH convention as articles/events/songs/booking (every field must
// be resent on update, including expiresAt).
type ElectionInput struct {
	CommitteeID string    `json:"committeeId"`
	MarkdownSv  string    `json:"markdownSv"`
	MarkdownEn  *string   `json:"markdownEn,omitempty"`
	Link        string    `json:"link"                 doc:"Where to nominate or vote (an external form)."`
	ExpiresAt   time.Time `json:"expiresAt"            doc:"When nominations close."`
}
