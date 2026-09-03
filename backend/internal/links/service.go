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
// Read responses (list short URLs, tags) are passed through as raw JSON
// rather than decoded into a hand-modeled Go struct - Shlink's exact
// response shape (e.g. whether visit counts nest under "visitsSummary" or
// sit flat) varies across the versions this project's dependency pins
// have tracked, and SHLINK_API_KEY is blank in the shared dev .env (see
// backend/CLAUDE.md's Admin routes section), so there is no way to
// exercise a live response here and confirm a hand-modeled shape against
// it. Write request bodies (create/update) are fully typed instead - they
// mirror the old app's own zod schemas exactly, which are a much smaller,
// stable surface this package fully controls either way.
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

// List proxies GET /short-urls, returning Shlink's own {data, pagination}
// body verbatim - see the package doc comment for why this isn't
// decoded into a Go struct.
func (s *Service) List(ctx context.Context, p ListParams) (json.RawMessage, error) {
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
	return s.client.get(ctx, "/short-urls", q)
}

// ListTags proxies GET /tags?withStats=true, matching the JS SDK's
// listTags exactly (including the withStats query param it still sets
// "until Shlink 3.0 is no longer supported").
func (s *Service) ListTags(ctx context.Context) (json.RawMessage, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkRead); err != nil {
		return nil, err
	}
	q := url.Values{"withStats": {"true"}}
	return s.client.get(ctx, "/tags", q)
}

func (s *Service) Create(ctx context.Context, in CreateLinkInput) (json.RawMessage, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkCreate); err != nil {
		return nil, err
	}
	if in.URL == "" || in.Slug == "" || len(in.Tags) == 0 {
		return nil, invalidf("url, slug, and at least one tag are required")
	}
	return s.client.post(ctx, "/short-urls", map[string]any{
		"longUrl":    in.URL,
		"customSlug": in.Slug,
		"tags":       in.Tags,
	})
}

func (s *Service) Update(
	ctx context.Context,
	shortCode string,
	in UpdateLinkInput,
) (json.RawMessage, error) {
	if err := auth.Require(ctx, apinames.AdminShlinkUpdate); err != nil {
		return nil, err
	}
	if in.URL == "" {
		return nil, invalidf("url is required")
	}
	return s.client.patch(ctx, "/short-urls/"+url.PathEscape(shortCode), map[string]any{
		"longUrl": in.URL,
		"tags":    in.Tags,
	})
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
