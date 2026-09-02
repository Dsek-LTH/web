package markdown

// Page is a named markdown page (the /info/{slug} CMS pages) - keyed by an
// arbitrary slug in the shared `markdowns` table, the same table
// internal/committees privately reuses for each committee's about/links
// text under different keys ({shortName}/{shortName}_links). Like
// articles, ships both the raw Sv/En pair and one resolved Markdown field.
type Page struct {
	Name       string  `json:"name"`
	Markdown   string  `json:"markdown"`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
	// CanEdit is computed server-side from the exact check Update itself
	// runs (base MarkdownUpdate policy or this page's own dynamic grant) -
	// see DESIGN.md's Principle #5. The frontend reads this field instead
	// of calling isAuthorized with a dynamic policy string client-side.
	CanEdit bool `json:"canEdit"`
}

type PageInput struct {
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}
