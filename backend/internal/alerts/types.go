package alerts

import "time"

// Alert is a site-wide banner message - see Service.List. Like articles,
// ships both the raw Sv/En pair and one resolved Message (see
// internal/locale) - display code reads Message, admin forms read the raw
// pair. ClosedByMe is resolved server-side from the acting identity rather
// than shipping the full closer-member-id list to the client (data
// minimization, same reasoning DESIGN.md already used for articles' like
// count vs a full likers list).
type Alert struct {
	ID         string    `json:"id"`
	Severity   string    `json:"severity"`
	Message    string    `json:"message"`
	MessageSv  string    `json:"messageSv"`
	MessageEn  string    `json:"messageEn"`
	CreatedAt  time.Time `json:"createdAt"`
	ClosedByMe bool      `json:"closedByMe"`
}

// AlertInput is the admin create body. Severity is validated against the
// same fixed set the old app's zod schema used (info/success/warning/
// error - see Alert.svelte's severity-to-icon map, which has no fallback
// for anything else).
type AlertInput struct {
	Severity  string `json:"severity"`
	MessageSv string `json:"messageSv"`
	MessageEn string `json:"messageEn"`
}
