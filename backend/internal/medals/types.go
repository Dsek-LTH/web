package medals

import "github.com/dsek-lth/web/backend/internal/apitypes"

// MemberMedal is one medal a member has earned, and the semester (as a
// display string, e.g. "VT 2026") after which they earned it - see
// Service.MemberMedals.
type MemberMedal struct {
	Medal string `json:"medal"`
	After string `json:"after"`
}

// MedalRecipients is one medal and every member who earned it after a
// given semester - see Service.MedalRecipients.
type MedalRecipients struct {
	Medal      string            `json:"medal"`
	Recipients []apitypes.Member `json:"recipients"`
}
