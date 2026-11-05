package events

import (
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

// Member/Tag/Comment are aliased from internal/apitypes (same members/tags
// tables articles already uses) rather than defined here - see that
// package's doc comment for why: huma's OpenAPI schema registry panics on
// two same-named-but-distinct Go structs once both internal/articles and
// internal/events register routes on one huma.API.
type (
	Member    = apitypes.Member
	Tag       = apitypes.Tag
	Comment   = apitypes.Comment
	Committee = apitypes.Committee
)

// EventSummary is the list-view shape: going/interested/comments are counts
// only, not full lists - EventDetail adds the full lists. This
// deliberately diverges from the old Prisma getAllEvents/getEvent, which
// both eagerly loaded full going/interested/comment lists even for list
// views - the same "summary vs detail"
// split articles' ArticleSummary/ArticleDetail already established.
type EventSummary struct {
	ID                 string    `json:"id"`
	Slug               string    `json:"slug"                         doc:"URL key."`
	Title              string    `json:"title"                        doc:"titleEn or titleSv, resolved from Accept-Language."`
	TitleSv            string    `json:"titleSv"`
	TitleEn            *string   `json:"titleEn,omitempty"`
	Description        string    `json:"description"                  doc:"descriptionEn or descriptionSv, resolved from Accept-Language. Markdown."`
	DescriptionSv      string    `json:"descriptionSv"`
	DescriptionEn      *string   `json:"descriptionEn,omitempty"`
	ShortDescription   *string   `json:"shortDescription,omitempty"   doc:"shortDescriptionEn or shortDescriptionSv, resolved from Accept-Language."`
	ShortDescriptionSv *string   `json:"shortDescriptionSv,omitempty"`
	ShortDescriptionEn *string   `json:"shortDescriptionEn,omitempty"`
	Link               *string   `json:"link,omitempty"               doc:"External link, e.g. a sign-up form."`
	Location           *string   `json:"location,omitempty"`
	Organizer          string    `json:"organizer"                    doc:"Free text; the committee's Swedish name when committeeId is set."`
	ImageURL           *string   `json:"imageUrl,omitempty"`
	StartAt            time.Time `json:"startAt"`
	EndAt              time.Time `json:"endAt"`
	AlarmActive        bool      `json:"alarmActive"                  doc:"Sets off the alarm (GET /alarm) while the event runs."`
	IsCancelled        bool      `json:"isCancelled"`
	RecurringParentID  *string   `json:"recurringParentId,omitempty"  doc:"The recurring series this event is an occurrence of."`
	Author             Member    `json:"author"                       doc:"Who created the event."`
	Tags               []Tag     `json:"tags"`
	// CommitteeID/Committee are the organizing committee picked in the
	// event form (upstream #1198) - Organizer still carries its Swedish
	// name as text (see Service.resolveCommittee). Committee is a minimal
	// sub-object (id, name, shortName, symbolUrl), nil without one.
	CommitteeID     *string    `json:"committeeId,omitempty" doc:"The organizing committee."`
	Committee       *Committee `json:"committee,omitempty"   doc:"The organizing committee: id, name, shortName and symbolUrl only."`
	CommentCount    int        `json:"commentCount"`
	GoingCount      int        `json:"goingCount"`
	InterestedCount int        `json:"interestedCount"`
	// NollningSeasonID associates this event with a nollning season - see
	// articles.ArticleSummary's identical field.
	NollningSeasonID *string `json:"nollningSeasonId,omitempty" doc:"The nollning season the event belongs to."`
}

type EventDetail struct {
	EventSummary
	Comments []Comment `json:"comments" doc:"Newest first."`
	// TaggedMembers are the members @mentioned in Comments (by the
	// "[@Name](/members/<studentId>)" markdown the comment form inserts),
	// so the frontend can render each mention with the member's current
	// name - replaces the old SvelteKit-side getAllTaggedMembers Prisma
	// lookup the event/article detail pages used to run after the fact.
	TaggedMembers []Member `json:"taggedMembers" doc:"Members @mentioned in the comments, with their current names."`
	Going         []Member `json:"going"`
	Interested    []Member `json:"interested"`
	// CanEdit/CanDelete are the acting identity's own permissions on this
	// event, computed server-side from the same checks Update/Delete
	// themselves enforce (see Service.detail) - CanEdit mirrors Update's
	// author-or-EventUpdate bypass, CanDelete mirrors Delete's
	// EventDelete-only check (no author bypass - see Delete's doc comment).
	// The frontend reads these rather than recompute them: Go is the only
	// place authorization is decided.
	CanEdit   bool `json:"canEdit"   doc:"Whether the caller may edit the event (its author, or event:update)."`
	CanDelete bool `json:"canDelete" doc:"Whether the caller may delete the event (event:delete)."`
	// Recurring is the series this event belongs to (its type, separation
	// and last day), nil for a one-off event - so the edit form can show
	// the series' own settings instead of form defaults.
	Recurring *Recurrence `json:"recurring,omitempty" doc:"The series this event belongs to. Omitted for a one-off event."`
}

// EventList is one page of events.
type EventList struct {
	Events    []EventSummary `json:"events"`
	PageCount int            `json:"pageCount" doc:"Number of pages at this pageSize."`
}

// EditScope selects how a write to one occurrence of a recurring series
// affects its siblings - shared by Update and Delete, mirroring the old
// TS actionType enum ("THIS" | "FUTURE" | "ALL"). Meaningless (treated as
// This) for an event that isn't part of a series.
type EditScope string

const (
	EditScopeThis   EditScope = "THIS"
	EditScopeFuture EditScope = "FUTURE"
	EditScopeAll    EditScope = "ALL"
)

func (EditScope) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "EventEditScope", "THIS", "FUTURE", "ALL")
}

// RecurringType is how often a series repeats (the recurring_type enum).
type RecurringType string

func (RecurringType) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "RecurringType", "DAILY", "WEEKLY", "MONTHLY", "YEARLY")
}

// Recurrence describes a recurring series: on Create (when non-nil) the
// series to make, on EventDetail the series an event belongs to.
type Recurrence struct {
	Type            RecurringType `json:"type"`
	SeparationCount int           `json:"separationCount" doc:"Repeat every separationCount+1 periods; 0 is every period."`
	EndAt           time.Time     `json:"endAt"           doc:"The series' last day (inclusive)."`
}

// EventInput is the writable shape of an event, shared by create and
// update (update is full-replace / PUT semantics, same convention as
// articles.ArticleInput - see its doc comment). Recurring is only
// meaningful on Create; Update/Delete take EditScope instead.
type EventInput struct {
	TitleSv            string      `json:"titleSv"`
	TitleEn            *string     `json:"titleEn"`
	DescriptionSv      string      `json:"descriptionSv"       doc:"Markdown."`
	DescriptionEn      *string     `json:"descriptionEn"       doc:"Markdown."`
	ShortDescriptionSv *string     `json:"shortDescriptionSv"`
	ShortDescriptionEn *string     `json:"shortDescriptionEn"`
	Link               *string     `json:"link"`
	Location           *string     `json:"location"`
	Organizer          string      `json:"organizer"           doc:"Overwritten with the committee's Swedish name when committeeId is set."`
	ImageURL           *string     `json:"imageUrl"`
	StartAt            time.Time   `json:"startAt"`
	EndAt              time.Time   `json:"endAt"`
	AlarmActive        bool        `json:"alarmActive"`
	IsCancelled        bool        `json:"isCancelled"`
	TagIDs             []string    `json:"tagIds"`
	CommitteeID        *string     `json:"committeeId"`
	Recurring          *Recurrence `json:"recurring,omitempty" doc:"Create only: make a whole series, one event per occurrence."`
	NollningSeasonID   *string     `json:"nollningSeasonId"    doc:"Setting or changing it needs nollning:content:associate."`
}

// AttendanceStatus is the signed-in member's RSVP to an event.
type AttendanceStatus string

func (AttendanceStatus) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "EventAttendanceStatus", "going", "interested", "none")
}

// AttendanceInput sets the signed-in member's RSVP.
type AttendanceInput struct {
	Status AttendanceStatus `json:"status" doc:"going and interested are mutually exclusive; none clears both."`
}

// Span selects which time window ListParams covers: upcoming (ends after
// now, soonest first), past (starts before now, most recent first), or an
// explicit From/To range (overlapping [From, To), soonest first - the
// events page's week/month views).
type Span string

const (
	SpanUpcoming Span = "upcoming"
	SpanPast     Span = "past"
	SpanRange    Span = "range"
)

func (Span) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "EventSpan", "upcoming", "past", "range")
}

type ListParams struct {
	Search           *string
	TagIDs           []string
	Span             Span
	From, To         *time.Time
	NollningSeasonID *string
	// IncludeRemoved lists soft-removed events too - the admin
	// all-events page; requires apinames.EventUpdate.
	IncludeRemoved bool
	Page           int
	PageSize       int
}

func (p ListParams) window(
	now time.Time,
) (after, before pgtype.Timestamptz, descending bool, err error) {
	switch p.Span {
	case SpanUpcoming, "":
		return dbutil.ToTimestamptz(&now), pgtype.Timestamptz{}, false, nil
	case SpanPast:
		return pgtype.Timestamptz{}, dbutil.ToTimestamptz(&now), true, nil
	case SpanRange:
		if p.From == nil || p.To == nil {
			return after, before, false, invalidf("range span needs both from and to")
		}
		return dbutil.ToTimestamptz(p.From), dbutil.ToTimestamptz(p.To), false, nil
	default:
		return after, before, false, invalidf("unknown span %q", p.Span)
	}
}
