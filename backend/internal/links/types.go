package links

// CreateLinkInput mirrors admin/links' createLinksSchema exactly (url/slug/
// tags, tags required non-empty).
type CreateLinkInput struct {
	URL  string   `json:"url"`
	Slug string   `json:"slug"`
	Tags []string `json:"tags"`
}

// UpdateLinkInput mirrors updateLinksSchema, which the old app aliased 1:1 to
// createLinksSchema - kept as its own type here since Shlink's real PATCH
// body (longUrl/tags, no slug - the short code is the path param, not
// renameable) is genuinely narrower than create's.
type UpdateLinkInput struct {
	URL  string   `json:"url"`
	Tags []string `json:"tags"`
}

// ListParams mirrors admin/links' paramsSchema.
type ListParams struct {
	Page    int
	OrderBy string
	Dir     string
	Tags    []string
	Search  string
}
