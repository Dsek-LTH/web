package alerts

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/apitypes"
)

// Alert is a site-wide banner message - see Service.List. Like articles,
// ships both the raw Sv/En pair and one resolved Message (see
// internal/locale) - display code reads Message, admin forms read the raw
// pair. ClosedByMe is resolved server-side from the acting identity rather
// than shipping the full closer-member-id list to the client (data
// minimization, the same reason articles send a like count rather than
// every liker).
type Alert struct {
	ID         string    `json:"id"`
	Severity   Severity  `json:"severity"`
	Message    string    `json:"message"    doc:"messageEn or messageSv, resolved from Accept-Language."`
	MessageSv  string    `json:"messageSv"`
	MessageEn  string    `json:"messageEn"`
	CreatedAt  time.Time `json:"createdAt"`
	ClosedByMe bool      `json:"closedByMe" doc:"Whether the signed-in member has dismissed it. Always false when anonymous."`
}

// AlertInput is the admin create body. Severity is validated against the
// same fixed set the old app's zod schema used (info/success/warning/
// error - see Alert.svelte's severity-to-icon map, which has no fallback
// for anything else).
type AlertInput struct {
	Severity  Severity `json:"severity"`
	MessageSv string   `json:"messageSv"`
	MessageEn string   `json:"messageEn"`
}

// Severity picks the alert's color and icon.
type Severity string

func (Severity) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "AlertSeverity", "info", "success", "warning", "error")
}
