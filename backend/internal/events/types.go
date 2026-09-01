package events

import (
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

// Member/Tag/Comment are aliased from internal/apitypes (same members/tags
// tables articles already uses) rather than defined here - see that
// package's doc comment for why: huma's OpenAPI schema registry panics on
// two same-named-but-distinct Go structs once both internal/articles and
// internal/events register routes on one huma.API.
type (
	Member  = apitypes.Member
	Tag     = apitypes.Tag
	Comment = apitypes.Comment
)

// EventSummary is the list-view shape: going/interested/comments are counts
// only, not full lists - EventDetail adds the full lists. This
// deliberately diverges from the old Prisma getAllEvents/getEvent, which
// both eagerly loaded full going/interested/comment lists even for list
// views (see DESIGN.md's events section) - the same "summary vs detail"
// split articles' ArticleSummary/ArticleDetail already established.
type EventSummary struct {
	ID                 string    `json:"id"`
	Slug               string    `json:"slug"`
	Title              string    `json:"title"`
	TitleSv            string    `json:"titleSv"`
	TitleEn            *string   `json:"titleEn,omitempty"`
	Description        string    `json:"description"`
	DescriptionSv      string    `json:"descriptionSv"`
	DescriptionEn      *string   `json:"descriptionEn,omitempty"`
	ShortDescription   *string   `json:"shortDescription,omitempty"`
	ShortDescriptionSv *string   `json:"shortDescriptionSv,omitempty"`
	ShortDescriptionEn *string   `json:"shortDescriptionEn,omitempty"`
	Link               *string   `json:"link,omitempty"`
	Location           *string   `json:"location,omitempty"`
	Organizer          string    `json:"organizer"`
	ImageURL           *string   `json:"imageUrl,omitempty"`
	StartAt            time.Time `json:"startAt"`
	EndAt              time.Time `json:"endAt"`
	AlarmActive        bool      `json:"alarmActive"`
	IsCancelled        bool      `json:"isCancelled"`
	RecurringParentID  *string   `json:"recurringParentId,omitempty"`
	Author             Member    `json:"author"`
	Tags               []Tag     `json:"tags"`
	CommentCount       int       `json:"commentCount"`
	GoingCount         int       `json:"goingCount"`
	InterestedCount    int       `json:"interestedCount"`
	// NollningSeasonID associates this event with a nollning season - see
	// articles.ArticleSummary's identical field and DESIGN.md's nollning
	// section.
	NollningSeasonID *string `json:"nollningSeasonId,omitempty"`
}

type EventDetail struct {
	EventSummary
	Comments   []Comment `json:"comments"`
	Going      []Member  `json:"going"`
	Interested []Member  `json:"interested"`
	// CanEdit/CanDelete are the acting identity's own permissions on this
	// event, computed server-side from the same checks Update/Delete
	// themselves enforce (see Service.detail) - CanEdit mirrors Update's
	// author-or-EventUpdate bypass, CanDelete mirrors Delete's
	// EventDelete-only check (no author bypass - see Delete's doc comment).
	// See articles.ArticleDetail's identical fields and DESIGN.md's
	// "Principles going forward" #5 for why the frontend must read these
	// rather than recompute them.
	CanEdit   bool `json:"canEdit"`
	CanDelete bool `json:"canDelete"`
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

// RecurringInput describes a new recurring series - only read on Create,
// and only when non-nil. EndAt is the series' last day (inclusive); Type is
// one of DAILY/WEEKLY/MONTHLY/YEARLY.
type RecurringInput struct {
	Type            string    `json:"type"`
	SeparationCount int       `json:"separationCount"`
	EndAt           time.Time `json:"endAt"`
}

// EventInput is the writable shape of an event, shared by create and
// update (update is full-replace / PUT semantics, same convention as
// articles.ArticleInput - see its doc comment). Recurring is only
// meaningful on Create; Update/Delete take EditScope instead.
type EventInput struct {
	TitleSv            string          `json:"titleSv"`
	TitleEn            *string         `json:"titleEn"`
	DescriptionSv      string          `json:"descriptionSv"`
	DescriptionEn      *string         `json:"descriptionEn"`
	ShortDescriptionSv *string         `json:"shortDescriptionSv"`
	ShortDescriptionEn *string         `json:"shortDescriptionEn"`
	Link               *string         `json:"link"`
	Location           *string         `json:"location"`
	Organizer          string          `json:"organizer"`
	ImageURL           *string         `json:"imageUrl"`
	StartAt            time.Time       `json:"startAt"`
	EndAt              time.Time       `json:"endAt"`
	AlarmActive        bool            `json:"alarmActive"`
	IsCancelled        bool            `json:"isCancelled"`
	TagIDs             []string        `json:"tagIds"`
	Recurring          *RecurringInput `json:"recurring,omitempty"`
	NollningSeasonID   *string         `json:"nollningSeasonId"`
}

type ListParams struct {
	Search           *string
	TagIDs           []string
	Past             bool
	NollningSeasonID *string
	Page             int
	PageSize         int
}
