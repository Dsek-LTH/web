// Package nollning is the single source of truth for "what nollning phase/
// season/role is this" - every other domain (auth, articles, events,
// committees) calls into it rather than re-deriving its own answer. It
// collapses three previously-independent mechanisms (an AdminSetting-
// backed time window, a `[NOLLNING]` tag-name-prefix convention, and a
// dual-path PhadderGroup/mandate membership model) into one package.
package nollning

import (
	"errors"
	"fmt"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// ErrNotFound is returned when a season or phadder group lookup by id
// finds nothing.
var ErrNotFound = errors.New("nollning: not found")

// ErrInvalidInput is wrapped into errors caused by malformed caller input
// or a request that's well-formed but violates a business rule (e.g.
// associating a member with a phadder group they hold no phadder/uppdrag
// mandate for), so the API layer can map them to 422 instead of 500.
var ErrInvalidInput = errors.New("nollning: invalid input")

// ErrYearTaken is returned when a season is created or moved to a year
// another season already has.
var ErrYearTaken = errors.New("nollning: a season already exists for that year")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// NollningSeason is one nollning year's time window, replacing the old
// AdminSetting-backed nollning_start/nollning_end keys plus every
// hardcoded per-year date scattered across the old TS app
// (REVEAL_LAUNCH_DATE, nolla's CUTOFF_DATE, the nollning-events page's
// weekStarts array).
type NollningSeason struct {
	ID                    string    `json:"id"`
	Year                  int       `json:"year"`
	NollaStartAt          time.Time `json:"nollaStartAt"                    doc:"When the nollor arrive; the season starts."`
	RevealAt              time.Time `json:"revealAt"                        doc:"When the theme is revealed (phase pre_reveal ends)."`
	EndAt                 time.Time `json:"endAt"                           doc:"When the season ends."`
	OrganizingCommitteeID *string   `json:"organizingCommitteeId,omitempty" doc:"The committee running nollning (staben), whose positions the board hides during the season."`
}

// NollningSeasonInput is the writable shape of a season, shared by create and
// update (update is full-replace, same full-replace (PUT) convention as
// articles/events). OrganizingCommitteeID left nil on create resolves to
// whichever committee has short_name "nollu" (see Service.CreateSeason).
type NollningSeasonInput struct {
	Year                  int       `json:"year"`
	NollaStartAt          time.Time `json:"nollaStartAt"`
	RevealAt              time.Time `json:"revealAt"`
	EndAt                 time.Time `json:"endAt"`
	OrganizingCommitteeID *string   `json:"organizingCommitteeId" doc:"Defaults to the committee with short name nollu on create."`
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

func (Phase) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "NollningPhase", "off", "pre_reveal", "post_reveal")
}

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

func (PhadderRole) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "PhadderRole", "", "nolla", "phadder")
}

// PhadderGroup is one year's phadder group (a small group of nollor
// assigned to one or more phaddrar/uppdrag-holders for the nollning
// period). Nollor/Phaddrar are only populated on a single-group fetch;
// NollaCount/PhadderCount are populated on the list view instead (same
// "counts on list, full data on detail" split as internal/committees'
// Committee.MandateCount vs a committee detail's nested positions).
type PhadderGroup struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  *string           `json:"description,omitempty"  doc:"HTML, sanitized on save."`
	ImageURL     *string           `json:"imageUrl,omitempty"`
	SeasonID     string            `json:"seasonId"`
	CreatedAt    time.Time         `json:"createdAt"`
	NollaCount   *int64            `json:"nollaCount,omitempty"   doc:"Only on the list."`
	PhadderCount *int64            `json:"phadderCount,omitempty" doc:"Only on the list."`
	Nollor       []apitypes.Member `json:"nollor,omitempty"       doc:"Only on GET /nollning/phadder-groups/{id}."`
	Phaddrar     []apitypes.Member `json:"phaddrar,omitempty"     doc:"Only on GET /nollning/phadder-groups/{id}."`
}

// PhadderGroupInput is the writable shape of a phadder group, shared by
// create and update (full-replace, same convention as SeasonInput).
type PhadderGroupInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description" doc:"HTML, sanitized on save."`
	ImageURL    *string `json:"imageUrl"`
	SeasonID    string  `json:"seasonId"`
}

// NollningStatus is what GET /nollning/current returns - what the frontend
// needs to pick a theme and route the native app, replacing
// REVEAL_LAUNCH_DATE/CUTOFF_DATE/APP_PREFERRED_PAGE_COOKIE's ad-hoc date
// logic with one API call.
type NollningStatus struct {
	Phase  Phase           `json:"phase"            doc:"off outside a season; pre_reveal before the theme is revealed; post_reveal after."`
	Season *NollningSeason `json:"season,omitempty" doc:"The active season. Omitted when phase is off."`
	// LatestRevealed lets the nollning site keep showing last season's
	// messages and events between seasons, like the old site did.
	LatestRevealed *NollningSeason `json:"latestRevealed,omitempty" doc:"The newest season whose theme has been revealed, current or past. Omitted if none has been."`
}

// MemberPhadderRole is what GET /members/{studentId}/phadder-role returns.
type MemberPhadderRole struct {
	Role    PhadderRole `json:"role"              doc:"Empty when the member is neither a nolla nor a phadder this season."`
	GroupID *string     `json:"groupId,omitempty" doc:"The phadder group, if any."`
}

// PhadderGroupMembersInput adds members to a phadder group.
type PhadderGroupMembersInput struct {
	StudentIDs []string `json:"studentIds" minItems:"1" doc:"All are added, or none."`
}
