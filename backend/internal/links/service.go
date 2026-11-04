// Package links is a thin wrapper around Shlink (the university's URL
// shortener, at SHLINK_ENDPOINT) behind admin/links - see DESIGN.md's
// roadmap Phase 11 ("Admin consolidation"). Unlike every other domain
// package in this backend, there is no local table at all: every read/
// write proxies straight through to Shlink's own REST API v3, the same
// external system the old app's @shlinkio/shlink-js-sdk dependency talked
// to directly - matching the "mock/wrap an out-of-scope external
// dependency, don't rebuild it" precedent already used for the Discord
// webhook and Expo push (see internal/notifications).
//
// Read responses are decoded into this package's own types (ShortLink,
// LinkDomain) rather than passed through, so the API documents them; only
// the fields admin/links uses are kept.
package links

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
)

var (
	ErrNotFound     = errors.New("links: not found")
	ErrInvalidInput = errors.New("links: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Service struct {
	client *client
}

func NewService(endpoint, apiKey string) *Service {
	return &Service{client: newClient(endpoint, apiKey)}
}

// List proxies GET /short-urls, 20 per page. Shlink wraps the list as
// {"shortUrls": {"data": [...], "pagination": {...}}}.
func (s *Service) List(ctx context.Context, p ListParams) (*ShortLinkList, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkRead); err != nil {
		return nil, err
	}
	q := url.Values{}
	q.Set("itemsPerPage", "20")
	if p.Page > 0 {
		q.Set("page", fmt.Sprint(p.Page))
	}
	if p.OrderBy != "" && p.Dir != "" {
		q.Set("orderBy", p.OrderBy+"-"+p.Dir)
	}
	for _, t := range p.Tags {
		q.Add("tags[]", t)
	}
	if p.Search != "" {
		q.Set("searchTerm", p.Search)
	}
	var resp struct {
		ShortURLs struct {
			Data       []shlinkShortURL `json:"data"`
			Pagination struct {
				PagesCount int `json:"pagesCount"`
			} `json:"pagination"`
		} `json:"shortUrls"`
	}
	if err := s.getJSON(ctx, "/short-urls", q, &resp); err != nil {
		return nil, err
	}
	out := &ShortLinkList{
		Links:     make([]ShortLink, len(resp.ShortURLs.Data)),
		PageCount: resp.ShortURLs.Pagination.PagesCount,
	}
	for i, u := range resp.ShortURLs.Data {
		out.Links[i] = u.toShortLink()
	}
	return out, nil
}

// ListTags proxies GET /tags?withStats=true (matching the JS SDK's
// listTags), answering {"tags": {"data": ["name", ...]}}.
func (s *Service) ListTags(ctx context.Context) ([]string, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkRead); err != nil {
		return nil, err
	}
	var resp struct {
		Tags struct {
			Data []string `json:"data"`
		} `json:"tags"`
	}
	if err := s.getJSON(ctx, "/tags", url.Values{"withStats": {"true"}}, &resp); err != nil {
		return nil, err
	}
	return resp.Tags.Data, nil
}

// ListDomains proxies GET /domains ({"domains": {"data": [...]}}). The
// admin links page pre-fills its create form with the default domain
// (upstream #1291).
func (s *Service) ListDomains(ctx context.Context) ([]LinkDomain, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkRead); err != nil {
		return nil, err
	}
	var resp struct {
		Domains struct {
			Data []LinkDomain `json:"data"`
		} `json:"domains"`
	}
	if err := s.getJSON(ctx, "/domains", nil, &resp); err != nil {
		return nil, err
	}
	return resp.Domains.Data, nil
}

func (s *Service) getJSON(ctx context.Context, path string, query url.Values, into any) error {
	body, err := s.client.get(ctx, path, query)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(body, into); err != nil {
		return fmt.Errorf("links: decode %s: %w", path, err)
	}
	return nil
}

func decodeShortURL(body json.RawMessage) (*ShortLink, error) {
	var u shlinkShortURL
	if err := json.Unmarshal(body, &u); err != nil {
		return nil, fmt.Errorf("links: decode short URL: %w", err)
	}
	link := u.toShortLink()
	return &link, nil
}

func (s *Service) Create(ctx context.Context, in CreateLinkInput) (*ShortLink, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkCreate); err != nil {
		return nil, err
	}
	if in.URL == "" || in.Slug == "" || len(in.Tags) == 0 {
		return nil, invalidf("url, slug, and at least one tag are required")
	}
	body, err := s.client.post(ctx, "/short-urls", map[string]any{
		"longUrl":    in.URL,
		"customSlug": in.Slug,
		"tags":       in.Tags,
	})
	if err != nil {
		return nil, err
	}
	return decodeShortURL(body)
}

func (s *Service) Update(
	ctx context.Context,
	shortCode string,
	in UpdateLinkInput,
) (*ShortLink, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkUpdate); err != nil {
		return nil, err
	}
	if in.URL == "" {
		return nil, invalidf("url is required")
	}
	body, err := s.client.patch(ctx, "/short-urls/"+url.PathEscape(shortCode), map[string]any{
		"longUrl": in.URL,
		"tags":    in.Tags,
	})
	if err != nil {
		return nil, err
	}
	return decodeShortURL(body)
}

// tagStats is the subset of Shlink's /tags/stats response this package
// actually reads, to find tags left with zero short URLs after Delete -
// the one read response this package does decode, since it only consumes
// two fields it controls the meaning of either way (a stats endpoint isn't
// going to stop returning a tag's own name and its short-URL count).
type tagStats struct {
	Tags struct {
		Data []struct {
			Tag            string `json:"tag"`
			ShortURLsCount int    `json:"shortUrlsCount"`
		} `json:"data"`
	} `json:"tags"`
}

// Delete removes every given short code, then cleans up any tag left with
// zero remaining short URLs - matching the old delete action's
// Promise.all(deleteShortUrl) + deleteTags(emptyTags) exactly.
func (s *Service) Delete(ctx context.Context, shortCodes []string) error {
	if err := auth.Require(ctx, apinames.AdminShlinkDelete); err != nil {
		return err
	}
	if len(shortCodes) == 0 {
		return invalidf("at least one shortCode is required")
	}
	for _, code := range shortCodes {
		if err := s.client.delete(ctx, "/short-urls/"+url.PathEscape(code), nil); err != nil {
			return err
		}
	}

	statsBody, err := s.client.get(ctx, "/tags/stats", nil)
	if err != nil {
		return err
	}
	var stats tagStats
	if err := json.Unmarshal(statsBody, &stats); err != nil {
		return fmt.Errorf("links: parse tag stats: %w", err)
	}
	var emptyTags []string
	for _, t := range stats.Tags.Data {
		if t.ShortURLsCount == 0 {
			emptyTags = append(emptyTags, t.Tag)
		}
	}
	if len(emptyTags) == 0 {
		return nil
	}
	q := url.Values{}
	for _, t := range emptyTags {
		q.Add("tags[]", t)
	}
	return s.client.delete(ctx, "/tags", q)
}
