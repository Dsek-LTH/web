// Package apitypes holds the small handful of DTOs that are byte-for-byte
// identical across domain packages (internal/articles, internal/events, ...)
// because they describe the same underlying table (members, tags) or the
// same shape (a comment). Domain packages import these via a type alias
// (e.g. `type Member = apitypes.Member`) rather than defining their own -
// originally each package had its own copy, which is fine for Go itself
// but breaks huma's OpenAPI schema registry: it names a component schema
// after the bare Go type name (not the package-qualified one), so two
// distinct `Member` structs in different packages panic at startup with
// "duplicate name" the moment both get registered on the same huma.API.
// Aliasing to one real underlying type gives every domain package's field
// the exact same reflect.Type, so huma emits one shared schema instead of
// colliding.
package apitypes

import (
	"time"

	"github.com/danielgtaylor/huma/v2"
)

// EnumSchema registers a named string-enum schema (once) and returns a
// reference to it. Enum types implement huma.SchemaProvider with it, so
// the OpenAPI document - and the generated TypeScript - get one named
// union type per enum instead of a plain string:
//
//	func (Span) Schema(r huma.Registry) *huma.Schema {
//		return apitypes.EnumSchema(r, "EventSpan", "upcoming", "past", "range")
//	}
func EnumSchema(r huma.Registry, name string, values ...string) *huma.Schema {
	if _, ok := r.Map()[name]; !ok {
		enum := make([]any, len(values))
		for i, v := range values {
			enum[i] = v
		}
		r.Map()[name] = &huma.Schema{Type: huma.TypeString, Enum: enum}
	}
	return &huma.Schema{Ref: "#/components/schemas/" + name}
}

type Member struct {
	ID          string  `json:"id"                    doc:"Member id (UUID)."`
	StudentID   *string `json:"studentId,omitempty"   doc:"LU student id, e.g. ab1234cd-s. The key member routes use."`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	PicturePath *string `json:"picturePath,omitempty" doc:"Public URL of the profile picture."`
	// ClassYear/ClassProgramme are only populated where a consumer needs
	// them (e.g. a position's mandate-holder list, for study-year
	// statistics and programme badges) - nil elsewhere.
	ClassYear      *int32  `json:"classYear,omitempty"      doc:"Year the member started, e.g. 2024. Only set where a consumer needs it."`
	ClassProgramme *string `json:"classProgramme,omitempty" doc:"Programme code, e.g. D or C. Only set where a consumer needs it."`
}

type Tag struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"             doc:"nameEn or nameSv, resolved from Accept-Language."`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	Color     *string `json:"color,omitempty"  doc:"CSS color, e.g. #ff0000."`
	IsDefault bool    `json:"isDefault"        doc:"New members are subscribed to default tags."`
}

type Comment struct {
	ID        string    `json:"id"`
	Content   *string   `json:"content,omitempty" doc:"Markdown. Mentions are [@Name](/members/<studentId>) links."`
	Published time.Time `json:"published"`
	Member    Member    `json:"member"            doc:"The comment's author."`
	// CanDelete is whether the acting identity may delete this comment -
	// its author, or a moderator (see internal/comments.CanDelete).
	CanDelete bool `json:"canDelete" doc:"Whether the signed-in member may delete this comment."`
}

// Committee/Position/Mandate started as minimal structs local to
// internal/articles (built only for the article author-picker: a handful
// of fields, no CRUD). internal/committees needs much richer versions of
// the same three (banner/images/descriptions on Committee; committee_id/
// email/active/boardMember on Position; dates/member on Mandate) - moved
// here, generalized additively (every new field is an omitempty pointer),
// for the same duplicate-schema-name reason as Member/Tag/Comment above.
// internal/articles keeps working unchanged, just getting back a shared
// value with fewer fields populated.
type Committee struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"                doc:"nameEn or nameSv, resolved from Accept-Language."`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	ShortName *string `json:"shortName,omitempty" doc:"URL key, e.g. cafe. The key committee routes use."`
	SymbolURL *string `json:"symbolUrl,omitempty"`
	// Description is DescriptionEn if resolved-locale is "en" and set,
	// DescriptionSv otherwise - same resolution rule as Name, see above.
	Description       *string `json:"description,omitempty"       doc:"descriptionEn or descriptionSv, resolved from Accept-Language."`
	DescriptionSv     *string `json:"descriptionSv,omitempty"`
	DescriptionEn     *string `json:"descriptionEn,omitempty"`
	DarkImageURL      *string `json:"darkImageUrl,omitempty"      doc:"Logo for dark backgrounds."`
	LightImageURL     *string `json:"lightImageUrl,omitempty"     doc:"Logo for light backgrounds."`
	MonoImageURL      *string `json:"monoImageUrl,omitempty"      doc:"Single-color logo."`
	BannerURL         *string `json:"bannerUrl,omitempty"`
	IsBannerTextLight *bool   `json:"isBannerTextLight,omitempty" doc:"Whether text over the banner should be light."`
	PreviewURL        *string `json:"previewUrl,omitempty"        doc:"Image shown in link previews."`
	// MandateCount/MemberCount are only populated by the committee-overview
	// list (currently-active mandates/unique members) - nil elsewhere.
	MandateCount *int64 `json:"mandateCount,omitempty" doc:"Currently active mandates. Only set by GET /committees."`
	MemberCount  *int64 `json:"memberCount,omitempty"  doc:"Distinct members holding an active mandate. Only set by GET /committees."`
}

type Position struct {
	ID          string  `json:"id"                    doc:"Dotted position id, e.g. dsek.cafe.mastare."`
	Name        string  `json:"name"                  doc:"nameEn or nameSv, resolved from Accept-Language."`
	NameSv      string  `json:"nameSv"`
	NameEn      *string `json:"nameEn,omitempty"`
	CommitteeID *string `json:"committeeId,omitempty"`
	Email       *string `json:"email,omitempty"       doc:"The position's own email address."`
	Active      *bool   `json:"active,omitempty"      doc:"Inactive positions are kept for history but no longer filled."`
	BoardMember *bool   `json:"boardMember,omitempty" doc:"Whether the position is on the board."`
	// Description is DescriptionEn if resolved-locale is "en" and set,
	// DescriptionSv otherwise - same resolution rule as Name.
	Description   *string `json:"description,omitempty"   doc:"descriptionEn or descriptionSv, resolved from Accept-Language."`
	DescriptionSv *string `json:"descriptionSv,omitempty"`
	DescriptionEn *string `json:"descriptionEn,omitempty"`
	StartMonth    *int32  `json:"startMonth,omitempty"    doc:"Month (1-12) a mandate usually starts."`
	EndMonth      *int32  `json:"endMonth,omitempty"      doc:"Month (1-12) a mandate usually ends."`
	// EmailAliases is only populated on a position detail fetch.
	EmailAliases []string `json:"emailAliases,omitempty" doc:"Email aliases that forward to the holders. Only set on detail responses."`
	// Committee is only populated where a consumer needs to render/link a
	// position's committee without a second request (e.g. a member's
	// mandate history, GET /positions) - nil elsewhere (CommitteeID alone is enough when
	// the position is already being shown in the context of its own
	// committee, e.g. GET /committees/{shortName}).
	Committee *Committee `json:"committee,omitempty" doc:"Only set where the committee isn't otherwise known, e.g. a member's mandate history."`
}

// Mandate is a member's hold on a Position, for one of two contexts:
// a member's own mandate history (Position set, Member nil - the member is
// implied by whichever request returned this list) or a position's list of
// current/past holders (Member set, Position nil - the position is implied
// the same way). The article author-picker (internal/articles) only ever
// sets Position, matching its original minimal shape.
type Mandate struct {
	ID        string    `json:"id"`
	StartDate *string   `json:"startDate,omitempty" doc:"First day, YYYY-MM-DD."`
	EndDate   *string   `json:"endDate,omitempty"   doc:"Last day, YYYY-MM-DD."`
	Position  *Position `json:"position,omitempty"  doc:"Set in a member's mandate history."`
	Member    *Member   `json:"member,omitempty"    doc:"Set in a position's list of holders."`
	// PhadderIn is the phadder group a phadder mandate was for. Only set on
	// a member's own mandate history (GET /members/{studentId}).
	PhadderIn *MandatePhadderGroup `json:"phadderIn,omitempty" doc:"The phadder group a phadder mandate was for. Only set in a member's mandate history."`
}

// MandatePhadderGroup is the part of a phadder group a mandate shows: its
// name and logo.
type MandatePhadderGroup struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	ImageURL *string `json:"imageUrl,omitempty"`
}

// CommentInput is a new comment on an article or event.
type CommentInput struct {
	Content string `json:"content" doc:"Markdown, at most 255 characters after trimming."`
}

// Language is a UI language.
type Language string

func (Language) Schema(r huma.Registry) *huma.Schema {
	return EnumSchema(r, "Language", "sv", "en")
}
