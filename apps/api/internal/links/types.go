package links

import "time"

// ShortLink is one short URL.
type ShortLink struct {
	ShortCode   string    `json:"shortCode"       doc:"The slug after the domain; the key link routes use."`
	ShortURL    string    `json:"shortUrl"        doc:"The full short URL."`
	LongURL     string    `json:"longUrl"         doc:"Where it redirects."`
	Title       *string   `json:"title,omitempty"`
	Tags        []string  `json:"tags"`
	DateCreated time.Time `json:"dateCreated"`
	Visits      int       `json:"visits"          doc:"Total visits, bots included."`
}

// ShortLinkList is one page of short URLs.
type ShortLinkList struct {
	Links     []ShortLink `json:"links"`
	PageCount int         `json:"pageCount" doc:"Number of pages (20 links each)."`
}

// LinkDomain is a domain short URLs can be made on.
type LinkDomain struct {
	Domain    string `json:"domain"    doc:"E.g. link.dsek.se."`
	IsDefault bool   `json:"isDefault" doc:"Whether new links go on it by default."`
}

// CreateLinkInput mirrors admin/links' createLinksSchema exactly (url/slug/
// tags, tags required non-empty).
type CreateLinkInput struct {
	URL  string   `json:"url"  doc:"Where the link redirects."`
	Slug string   `json:"slug" doc:"The short code."`
	Tags []string `json:"tags" doc:"At least one."`
}

// UpdateLinkInput is a short URL's editable fields - Shlink's PATCH body
// is narrower than create's (the short code is the path param, not
// renameable).
type UpdateLinkInput struct {
	URL  string   `json:"url"  doc:"Where the link redirects."`
	Tags []string `json:"tags"`
}

// DeleteLinksInput is the short codes to delete.
type DeleteLinksInput struct {
	ShortCodes []string `json:"shortCodes" minItems:"1"`
}

// ListParams mirrors admin/links' paramsSchema.
type ListParams struct {
	Page    int
	OrderBy string
	Dir     string
	Tags    []string
	Search  string
}

// shlinkShortURL is Shlink's own short-URL shape. Visit counts moved from
// visitsCount to visitsSummary across Shlink versions; both are read.
type shlinkShortURL struct {
	ShortCode     string    `json:"shortCode"`
	ShortURL      string    `json:"shortUrl"`
	LongURL       string    `json:"longUrl"`
	Title         *string   `json:"title"`
	Tags          []string  `json:"tags"`
	DateCreated   time.Time `json:"dateCreated"`
	VisitsCount   *int      `json:"visitsCount"`
	VisitsSummary *struct {
		Total int `json:"total"`
	} `json:"visitsSummary"`
}

func (u shlinkShortURL) toShortLink() ShortLink {
	visits := 0
	switch {
	case u.VisitsSummary != nil:
		visits = u.VisitsSummary.Total
	case u.VisitsCount != nil:
		visits = *u.VisitsCount
	}
	return ShortLink{
		ShortCode:   u.ShortCode,
		ShortURL:    u.ShortURL,
		LongURL:     u.LongURL,
		Title:       u.Title,
		Tags:        u.Tags,
		DateCreated: u.DateCreated,
		Visits:      visits,
	}
}
