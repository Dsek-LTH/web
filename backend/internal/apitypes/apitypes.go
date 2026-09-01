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

import "time"

type Member struct {
	ID          string  `json:"id"`
	StudentID   *string `json:"studentId,omitempty"`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	PicturePath *string `json:"picturePath,omitempty"`
}

type Tag struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	Color     *string `json:"color,omitempty"`
	IsDefault bool    `json:"isDefault"`
}

type Comment struct {
	ID        string    `json:"id"`
	Content   *string   `json:"content,omitempty"`
	Published time.Time `json:"published"`
	Member    Member    `json:"member"`
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
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	NameSv            string  `json:"nameSv"`
	NameEn            *string `json:"nameEn,omitempty"`
	ShortName         *string `json:"shortName,omitempty"`
	SymbolURL         *string `json:"symbolUrl,omitempty"`
	DescriptionSv     *string `json:"descriptionSv,omitempty"`
	DescriptionEn     *string `json:"descriptionEn,omitempty"`
	DarkImageURL      *string `json:"darkImageUrl,omitempty"`
	LightImageURL     *string `json:"lightImageUrl,omitempty"`
	MonoImageURL      *string `json:"monoImageUrl,omitempty"`
	BannerURL         *string `json:"bannerUrl,omitempty"`
	IsBannerTextLight *bool   `json:"isBannerTextLight,omitempty"`
	PreviewURL        *string `json:"previewUrl,omitempty"`
	// MandateCount/MemberCount are only populated by the committee-overview
	// list (currently-active mandates/unique members) - nil elsewhere.
	MandateCount *int64 `json:"mandateCount,omitempty"`
	MemberCount  *int64 `json:"memberCount,omitempty"`
}

type Position struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	NameSv        string  `json:"nameSv"`
	NameEn        *string `json:"nameEn,omitempty"`
	CommitteeID   *string `json:"committeeId,omitempty"`
	Email         *string `json:"email,omitempty"`
	Active        *bool   `json:"active,omitempty"`
	BoardMember   *bool   `json:"boardMember,omitempty"`
	DescriptionSv *string `json:"descriptionSv,omitempty"`
	DescriptionEn *string `json:"descriptionEn,omitempty"`
	StartMonth    *int32  `json:"startMonth,omitempty"`
	EndMonth      *int32  `json:"endMonth,omitempty"`
	// EmailAliases is only populated on a position detail fetch.
	EmailAliases []string `json:"emailAliases,omitempty"`
}

// Mandate is a member's hold on a Position, for one of two contexts:
// a member's own mandate history (Position set, Member nil - the member is
// implied by whichever request returned this list) or a position's list of
// current/past holders (Member set, Position nil - the position is implied
// the same way). The article author-picker (internal/articles) only ever
// sets Position, matching its original minimal shape.
type Mandate struct {
	ID        string    `json:"id"`
	StartDate *string   `json:"startDate,omitempty"`
	EndDate   *string   `json:"endDate,omitempty"`
	Position  *Position `json:"position,omitempty"`
	Member    *Member   `json:"member,omitempty"`
}
