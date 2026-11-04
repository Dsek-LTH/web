package markdown

// InfoPage is a named markdown page (the /info/{slug} CMS pages, served by /info-pages/{slug}) - keyed by an
// arbitrary slug in the shared `markdowns` table, the same table
// internal/committees privately reuses for each committee's about/links
// text under different keys ({shortName}/{shortName}_links). Like
// articles, ships both the raw Sv/En pair and one resolved Markdown field.
type InfoPage struct {
	Name       string  `json:"name"                 doc:"The page's slug."`
	Markdown   string  `json:"markdown"             doc:"markdownEn or markdownSv, resolved from Accept-Language."`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
	// CanEdit is computed server-side from the exact check Update itself
	// runs (base MarkdownUpdate policy or this page's own dynamic grant) -
	// see DESIGN.md's Principle #5. The frontend reads this field instead
	// of calling isAuthorized with a dynamic policy string client-side.
	CanEdit bool `json:"canEdit" doc:"Whether the caller may edit the page (markdown:update, or a grant for this page)."`
}

type InfoPageInput struct {
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}
