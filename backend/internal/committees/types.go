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

// MarkdownContent is a piece of named markdown content (see
// internal/db/schema.sql's markdowns table doc comment). Markdown is
// MarkdownEn if resolved-locale is "en" and set, MarkdownSv otherwise -
// same resolution rule as Name/Description elsewhere in this package;
// display code reads Markdown, edit forms read the Sv/En pair.
type MarkdownContent struct {
	Markdown   string  `json:"markdown"`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// CommitteeDetail is the full committee page: the committee itself, its
// positions (each with that position's mandates for CommitteeDetail.Year
// and email aliases), and the about/links markdown content.
type CommitteeDetail struct {
	Committee
	Year          int32            `json:"year"`
	Positions     []PositionDetail `json:"positions"`
	AboutMarkdown MarkdownContent  `json:"aboutMarkdown"`
	LinksMarkdown MarkdownContent  `json:"linksMarkdown"`
}

// PositionDetail is a single position with its mandates and email aliases
// (Position.EmailAliases) populated. Year is only set in the context of a
// committee detail fetch (GetByShortName) - GetPosition itself returns a
// position's full, unscoped mandate history instead of a single year.
type PositionDetail struct {
	Position
	Year     int32     `json:"year,omitempty"`
	Mandates []Mandate `json:"mandates"`
}

// UpdateCommitteeInput is the full-replace body for PATCH
// /committees/{shortName} - the committee-details form specifically, one of
// three independently-submitted forms on the old committee page (see
// UpdateMarkdownInput/UpdateLinksInput for the other two).
type UpdateCommitteeInput struct {
	NameSv            string  `json:"nameSv"`
	NameEn            *string `json:"nameEn,omitempty"`
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

// BoardPosition is one board-flagged, active position with its current
// holder (Member nil means vacant) - backs GET /board, replacing the old
// board/+page.server.ts's own Prisma query + merge loop. Sorted per
// ordering.SortBoardPositions and redacted per Service.ListBoard's doc
// comment before being returned - a row present here has already passed
// both.
type BoardPosition struct {
	Position Position `json:"position"`
	Member   *Member  `json:"member,omitempty"`
}
