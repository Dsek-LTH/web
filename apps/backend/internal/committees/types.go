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

// CommitteeMarkdown is a piece of named markdown content (see
// internal/db/schema.sql's markdowns table doc comment). Markdown is
// MarkdownEn if resolved-locale is "en" and set, MarkdownSv otherwise -
// same resolution rule as Name/Description elsewhere in this package;
// display code reads Markdown, edit forms read the Sv/En pair.
type CommitteeMarkdown struct {
	Markdown   string  `json:"markdown"             doc:"markdownEn or markdownSv, resolved from Accept-Language."`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// CommitteeDetail is the full committee page: the committee itself, its
// positions (each with that position's mandates for CommitteeDetail.Year
// and email aliases), and the about/links markdown content.
type CommitteeDetail struct {
	Committee
	Year          int32             `json:"year"          doc:"The year positions and mandates are shown for."`
	Positions     []PositionDetail  `json:"positions"     doc:"Positions active that year or with mandates that year, in display order."`
	AboutMarkdown CommitteeMarkdown `json:"aboutMarkdown" doc:"The committee page's main text."`
	LinksMarkdown CommitteeMarkdown `json:"linksMarkdown" doc:"The committee page's sidebar links."`
}

// PositionDetail is a single position with its mandates and email aliases
// (Position.EmailAliases) populated. Year is only set in the context of a
// committee detail fetch (GetByShortName) - GetPosition itself returns a
// position's full, unscoped mandate history instead of a single year.
type PositionDetail struct {
	Position
	Year     int32     `json:"year,omitempty" doc:"Only in a committee's positions: the year the mandates are for."`
	Mandates []Mandate `json:"mandates"       doc:"Mandates, each with its member. In a committee, that year's; from GET /positions/{id}, every one."`
}

// CommitteeInput is the full-replace body for PUT
// /committees/{shortName} - the committee-details form specifically, one of
// three independently-submitted forms on the old committee page (see
// UpdateMarkdownInput/UpdateLinksInput for the other two).
type CommitteeInput struct {
	NameSv            string  `json:"nameSv"`
	NameEn            *string `json:"nameEn,omitempty"`
	DescriptionSv     *string `json:"descriptionSv,omitempty"`
	DescriptionEn     *string `json:"descriptionEn,omitempty"`
	DarkImageURL      *string `json:"darkImageUrl,omitempty"`
	LightImageURL     *string `json:"lightImageUrl,omitempty"`
	MonoImageURL      *string `json:"monoImageUrl,omitempty"`
	SymbolURL         *string `json:"symbolUrl,omitempty"`
	BannerURL         *string `json:"bannerUrl,omitempty"`
	IsBannerTextLight bool    `json:"isBannerTextLight"       doc:"Whether text over the banner should be light."`
	PreviewURL        *string `json:"previewUrl,omitempty"`
}

type CommitteeMarkdownInput struct {
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// PositionInput is the full-replace body for PUT /positions/{id} -
// deliberately combines the old TS app's two separate actions (field edits;
// active/boardMember toggles) into one endpoint, since positions have few
// fields.
type PositionInput struct {
	NameSv        string  `json:"nameSv"`
	NameEn        *string `json:"nameEn,omitempty"`
	Email         *string `json:"email,omitempty"`
	DescriptionSv *string `json:"descriptionSv,omitempty"`
	DescriptionEn *string `json:"descriptionEn,omitempty"`
	Active        bool    `json:"active"                  doc:"Inactive positions are kept for history but no longer filled."`
	BoardMember   bool    `json:"boardMember"             doc:"Whether the position is on the board."`
}

// MandatesInput supports multiple memberIds at once (one mandate row
// created per member), matching the old TS addMandate action.
type MandatesInput struct {
	MemberIDs []string `json:"memberIds" doc:"Member ids (UUIDs); one mandate is created per member."`
	StartDate string   `json:"startDate" doc:"First day, YYYY-MM-DD."`
	EndDate   string   `json:"endDate"   doc:"Last day, YYYY-MM-DD."`
}

type MandateDatesInput struct {
	StartDate string `json:"startDate" doc:"First day, YYYY-MM-DD."`
	EndDate   string `json:"endDate"   doc:"Last day, YYYY-MM-DD."`
}

// BoardPosition is one board-flagged, active position with its current
// holder (Member nil means vacant) - backs GET /board, replacing the old
// board/+page.server.ts's own Prisma query + merge loop. Sorted per
// ordering.SortBoardPositions and redacted per Service.ListBoard's doc
// comment before being returned - a row present here has already passed
// both.
type BoardPosition struct {
	Position Position `json:"position"`
	Member   *Member  `json:"member,omitempty" doc:"The current holder. Omitted when vacant."`
}
