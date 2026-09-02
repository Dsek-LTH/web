// Package nollning is the single source of truth for "what nollning phase/
// season/role is this" - every other domain (auth, articles, events,
// committees) calls into it rather than re-deriving its own answer. See
// ../../DESIGN.md's "Nollning: proposed redesign" for the full rationale:
// it collapses three previously-independent mechanisms (an AdminSetting-
// backed time window, a `[NOLLNING]` tag-name-prefix convention, and a
// dual-path PhadderGroup/mandate membership model) into one package.
package nollning

import (
	"errors"
	"fmt"
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

// ErrNotFound is returned when a season or phadder group lookup by id
// finds nothing.
var ErrNotFound = errors.New("nollning: not found")

// ErrInvalidInput is wrapped into errors caused by malformed caller input
// or a request that's well-formed but violates a business rule (e.g.
// associating a member with a phadder group they hold no phadder/uppdrag
// mandate for), so the API layer can map them to 400 instead of 500.
var ErrInvalidInput = errors.New("nollning: invalid input")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// Season is one nollning year's time window, replacing the old
// AdminSetting-backed nollning_start/nollning_end keys plus every
// hardcoded per-year date scattered across the old TS app
// (REVEAL_LAUNCH_DATE, nolla's CUTOFF_DATE, the nollning-events page's
// weekStarts array).
type Season struct {
	ID                    string    `json:"id"`
	Year                  int       `json:"year"`
	NollaStartAt          time.Time `json:"nollaStartAt"`
	RevealAt              time.Time `json:"revealAt"`
	EndAt                 time.Time `json:"endAt"`
	OrganizingCommitteeID *string   `json:"organizingCommitteeId,omitempty"`
}

// SeasonInput is the writable shape of a season, shared by create and
// update (update is full-replace, same PUT-dressed-as-PATCH convention as
// articles/events). OrganizingCommitteeID left nil on create resolves to
// whichever committee has short_name "nollu" (see Service.CreateSeason).
type SeasonInput struct {
	Year                  int       `json:"year"`
	NollaStartAt          time.Time `json:"nollaStartAt"`
	RevealAt              time.Time `json:"revealAt"`
	EndAt                 time.Time `json:"endAt"`
	OrganizingCommitteeID *string   `json:"organizingCommitteeId"`
}

// Phase is where "now" falls relative to the current season, if any -
// drives frontend theming/routing (replacing REVEAL_LAUNCH_DATE/
// CUTOFF_DATE/APP_PREFERRED_PAGE_COOKIE's ad-hoc date comparisons) and
// SEE_STABEN's default-grant rule (see Service.InjectStabenPolicy).
type Phase string

const (
	PhaseOff        Phase = "off"
	PhasePreReveal  Phase = "pre_reveal"
	PhasePostReveal Phase = "post_reveal"
)

// PhadderRole is a member's relationship to a phadder group for the
// current season - collapses the old dual-path membership model
// (Member.nollningGroupId for nollor, Mandate.phadderInId +
// phadderMandateFilter's hardcoded position IDs for phaddrar) into one
// answer. Empty string means neither.
type PhadderRole string

const (
	PhadderRoleNone    PhadderRole = ""
	PhadderRoleNolla   PhadderRole = "nolla"
	PhadderRolePhadder PhadderRole = "phadder"
)

// phadderPositionIDs are the two position IDs the old TS app hardcoded in
// phadderMandateFilter (src/lib/nollning/groups/types.ts) - kept as literal
// constants here for the same reason internal/committees/ordering.go
// already hardcodes specific position-ID strings for board ordering: these
// are genuine real-world identifiers, not derived from anything else in
// the schema.
const (
	positionIDPhadder = "dsek.noll.phadder"
	positionIDUppdrag = "dsek.noll.uppdrag"
)

// PhadderGroup is one year's phadder group (a small group of nollor
// assigned to one or more phaddrar/uppdrag-holders for the nollning
// period). Nollor/Phaddrar are only populated on a single-group fetch;
// NollaCount/PhadderCount are populated on the list view instead (same
// "counts on list, full data on detail" split as internal/committees'
// Committee.MandateCount vs a committee detail's nested positions).
type PhadderGroup struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  *string           `json:"description,omitempty"`
	ImageURL     *string           `json:"imageUrl,omitempty"`
	SeasonID     string            `json:"seasonId"`
	CreatedAt    time.Time         `json:"createdAt"`
	NollaCount   *int64            `json:"nollaCount,omitempty"`
	PhadderCount *int64            `json:"phadderCount,omitempty"`
	Nollor       []apitypes.Member `json:"nollor,omitempty"`
	Phaddrar     []apitypes.Member `json:"phaddrar,omitempty"`
}

// PhadderGroupInput is the writable shape of a phadder group, shared by
// create and update (full-replace, same convention as SeasonInput).
type PhadderGroupInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	ImageURL    *string `json:"imageUrl"`
	SeasonID    string  `json:"seasonId"`
}

// CurrentInfo is what GET /nollning/current returns - what the frontend
// needs to pick a theme and route the native app, replacing
// REVEAL_LAUNCH_DATE/CUTOFF_DATE/APP_PREFERRED_PAGE_COOKIE's ad-hoc date
// logic with one API call (see DESIGN.md's nollning section).
type CurrentInfo struct {
	Phase  Phase   `json:"phase"`
	Season *Season `json:"season,omitempty"`
}

// PhadderRoleInfo is what GET /members/{studentId}/phadder-role returns.
type PhadderRoleInfo struct {
	Role    PhadderRole `json:"role"`
	GroupID *string     `json:"groupId,omitempty"`
}
