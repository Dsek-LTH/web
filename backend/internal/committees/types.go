package committees

import "github.com/dsek-lth/web/backend/internal/apitypes"

// Committee/Position/Mandate are aliased from internal/apitypes, same
// reasoning as internal/articles' aliases - see that package's doc comment.
// This package is the one that populates their full field set; articles
// only ever populates a subset for its author-picker.
type (
	Committee = apitypes.Committee
	Position  = apitypes.Position
	Mandate   = apitypes.Mandate
	Member    = apitypes.Member
)

// MarkdownContent is the raw Sv/En pair for a piece of named markdown
// content (see internal/db/schema.sql's markdowns table doc comment) -
// resolution to a single display string happens the same way as
// article/event bodies (internal/locale), left to the caller here since
// edit forms need the raw pair.
type MarkdownContent struct {
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// CommitteeDetail is the full committee page: the committee itself, its
// positions (each with that position's mandates for CommitteeDetail.Year
// and email aliases), and the about/links markdown content.
type CommitteeDetail struct {
	Committee
	Year          int32           `json:"year"`
	Positions     []Position      `json:"positions"`
	AboutMarkdown MarkdownContent `json:"aboutMarkdown"`
	LinksMarkdown MarkdownContent `json:"linksMarkdown"`
}

// PositionDetail is a single position with its mandates for Year and email
// aliases populated (Position.EmailAliases).
type PositionDetail struct {
	Position
	Year     int32     `json:"year"`
	Mandates []Mandate `json:"mandates"`
}

// UpdateCommitteeInput is the full-replace body for PATCH
// /committees/{shortName} - the committee-details form specifically, one of
// three independently-submitted forms on the old committee page (see
// UpdateMarkdownInput/UpdateLinksInput for the other two).
type UpdateCommitteeInput struct {
	DescriptionSv     *string `json:"descriptionSv,omitempty"`
	DescriptionEn     *string `json:"descriptionEn,omitempty"`
	DarkImageURL      *string `json:"darkImageUrl,omitempty"`
	LightImageURL     *string `json:"lightImageUrl,omitempty"`
	MonoImageURL      *string `json:"monoImageUrl,omitempty"`
	SymbolURL         *string `json:"symbolUrl,omitempty"`
	BannerURL         *string `json:"bannerUrl,omitempty"`
	IsBannerTextLight bool    `json:"isBannerTextLight"`
	PreviewURL        *string `json:"previewUrl,omitempty"`
}

type UpdateMarkdownInput struct {
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// UpdatePositionInput is the full-replace body for PATCH /positions/{id} -
// deliberately combines the old TS app's two separate actions (field edits;
// active/boardMember toggles) into one endpoint, since positions have few
// fields and the flags-toggle UI doesn't exist in TS yet (see
// backend/DESIGN.md's roadmap for the reasoning).
type UpdatePositionInput struct {
	NameSv        string  `json:"nameSv"`
	NameEn        *string `json:"nameEn,omitempty"`
	Email         *string `json:"email,omitempty"`
	DescriptionSv *string `json:"descriptionSv,omitempty"`
	DescriptionEn *string `json:"descriptionEn,omitempty"`
	Active        bool    `json:"active"`
	BoardMember   bool    `json:"boardMember"`
}

// CreateMandateInput supports multiple memberIds at once (one mandate row
// created per member), matching the old TS addMandate action.
type CreateMandateInput struct {
	MemberIDs []string `json:"memberIds"`
	StartDate string   `json:"startDate"`
	EndDate   string   `json:"endDate"`
}

type UpdateMandateInput struct {
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}
