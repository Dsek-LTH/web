package elections

import (
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

// Election is a single committee's open-nominations/voting announcement -
// see Service.List. Link points to an external form/vote (e.g. a Google
// Form); this feature has no in-house ballot/voting mechanism of its own -
// see DESIGN.md's "Elections" section for the correction to the roadmap's
// original ("nomination/voting workflow") description. Ships both the raw
// markdownSv/markdownEn pair and one resolved Markdown field, same pattern
// as Alert.Message. Committee is always populated (every query joins it) -
// the election card needs it to render without a second request, same
// reasoning as Mandate.member/Position.committee in internal/committees.
type Election struct {
	ID          string             `json:"id"`
	CommitteeID string             `json:"committeeId"`
	Committee   apitypes.Committee `json:"committee"`
	Markdown    string             `json:"markdown"`
	MarkdownSv  string             `json:"markdownSv"`
	MarkdownEn  *string            `json:"markdownEn,omitempty"`
	Link        string             `json:"link"`
	CreatedAt   time.Time          `json:"createdAt"`
	ExpiresAt   time.Time          `json:"expiresAt"`
}

// ElectionInput is the create/update body - full-replace, same PUT-dressed
// -as-PATCH convention as articles/events/songs/booking (every field must
// be resent on update, including expiresAt).
type ElectionInput struct {
	CommitteeID string    `json:"committeeId"`
	MarkdownSv  string    `json:"markdownSv"`
	MarkdownEn  *string   `json:"markdownEn,omitempty"`
	Link        string    `json:"link"`
	ExpiresAt   time.Time `json:"expiresAt"`
}
