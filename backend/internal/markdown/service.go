// Package markdown is the generic named-page CMS domain behind the old
// /info/{slug} routes - see DESIGN.md's Phase 3 ("Simple standalone CRUD")
// section. Ported from src/routes/(app)/info/[slug] and admin/info,
// unifying their two previously-divergent create paths/policy groups into
// one (see backend/CLAUDE.md's Markdown routes section for the full
// rationale). Distinct from internal/committees' own private reuse of the
// same `markdowns` table for each committee's about/links text under
// {shortName}/{shortName}_links keys - that package still calls
// db.Queries.GetMarkdown directly and is unaffected by this one.
package markdown

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/microcosm-cc/bluemonday"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
)

var (
	ErrNotFound     = errors.New("markdown: not found")
	ErrInvalidInput = errors.New("markdown: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// pageUpdatePolicy builds the per-page dynamic ACL string
// (fmt.Sprintf("markdowns:%s:update", slug), plural - matching the live
// table/old TS naming, deliberately distinct from the singular
// apinames.MarkdownUpdate base policy) - not a const since it's
// per-instance. See backend/CLAUDE.md's Markdown routes section: any plain
// string works with auth.Require/Identity.Has, no enum involved.
func pageUpdatePolicy(name string) string {
	return fmt.Sprintf("markdowns:%s:update", name)
}

type Service struct {
	queries   *db.Queries
	sanitizer *bluemonday.Policy
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx), sanitizer: bluemonday.UGCPolicy()}
}

// Get is a public read (matches the old ZModel's @@allow("read", true)).
func (s *Service) Get(ctx context.Context, name string) (*Page, error) {
	row, err := s.queries.GetMarkdown(ctx, name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get markdown: %w", err)
	}
	page := toPage(row, locale.FromContext(ctx))
	page.CanEdit = canEditPage(ctx, name)
	return page, nil
}

// canEditPage runs the same check Update enforces, without erroring - for
// computing Page.CanEdit. A non-existent or absent identity (anonymous
// caller) simply can't edit, same as everywhere else.
func canEditPage(ctx context.Context, name string) bool {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return false
	}
	return identity.Has(apinames.MarkdownUpdate) || identity.Has(pageUpdatePolicy(name))
}

// Create requires MarkdownCreate and fails if the page already exists (a
// real create, not an upsert-as-create). On success it auto-grants the
// creating member a page-scoped update policy
// (pageUpdatePolicy(name) = "markdowns:{name}:update") via a direct
// api_access_policies insert - mirroring the old info/[slug]/edit create
// action's real side effect exactly. This bypasses
// accesspolicies.Service.Create deliberately: that method itself requires
// AccessPolicyCreate, a policy an ordinary page-creating member won't hold
// - the grant here is a system-triggered side effect of a successful
// MarkdownCreate, not a new access-policy-management action the caller is
// separately asking for, so it goes straight through db.Queries like
// internal/committees already does for its own read of this same table.
func (s *Service) Create(ctx context.Context, name string, in PageInput) (*Page, error) {
	if err := auth.Require(ctx, apinames.MarkdownCreate); err != nil {
		return nil, err
	}
	if name == "" {
		return nil, invalidf("name is required")
	}
	if in.MarkdownSv == "" {
		return nil, invalidf("markdownSv is required")
	}
	if _, err := s.queries.GetMarkdown(ctx, name); err == nil {
		return nil, invalidf("a page named %q already exists", name)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check existing markdown: %w", err)
	}

	row, err := s.queries.UpsertMarkdown(ctx, db.UpsertMarkdownParams{
		Name:       name,
		MarkdownSv: s.sanitizer.Sanitize(in.MarkdownSv),
		MarkdownEn: dbutil.ToText(sanitizePtr(s.sanitizer, in.MarkdownEn)),
	})
	if err != nil {
		return nil, fmt.Errorf("create markdown: %w", err)
	}

	identity, _ := auth.FromContext(ctx) // Require above guarantees this is present
	if identity.StudentID != "" {
		if _, err := s.queries.CreateAccessPolicy(ctx, db.CreateAccessPolicyParams{
			ApiName:   pageUpdatePolicy(name),
			StudentID: dbutil.ToText(&identity.StudentID),
		}); err != nil {
			return nil, fmt.Errorf("grant page-scoped update policy: %w", err)
		}
	}

	page := toPage(row, locale.FromContext(ctx))
	page.CanEdit = true // just passed the exact check that gates it
	return page, nil
}

// Update requires either the base MarkdownUpdate policy or the caller's
// page-scoped grant from Create above - mirrors articles'/events' "own
// resource or policy" bypass pattern, just with a dynamic per-page string
// instead of an author-id comparison.
func (s *Service) Update(ctx context.Context, name string, in PageInput) (*Page, error) {
	if err := auth.Require(ctx, apinames.MarkdownUpdate); err != nil {
		identity, ok := auth.FromContext(ctx)
		if !ok || !identity.Has(pageUpdatePolicy(name)) {
			return nil, err
		}
	}
	if in.MarkdownSv == "" {
		return nil, invalidf("markdownSv is required")
	}
	if _, err := s.queries.GetMarkdown(ctx, name); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get markdown: %w", err)
	}

	row, err := s.queries.UpsertMarkdown(ctx, db.UpsertMarkdownParams{
		Name:       name,
		MarkdownSv: s.sanitizer.Sanitize(in.MarkdownSv),
		MarkdownEn: dbutil.ToText(sanitizePtr(s.sanitizer, in.MarkdownEn)),
	})
	if err != nil {
		return nil, fmt.Errorf("update markdown: %w", err)
	}
	page := toPage(row, locale.FromContext(ctx))
	page.CanEdit = true // just passed the exact check that gates it
	return page, nil
}

func toPage(row db.Markdown, loc string) *Page {
	return &Page{
		Name:       row.Name,
		Markdown:   dbutil.ResolveName(row.MarkdownSv, dbutil.TextPtr(row.MarkdownEn), loc),
		MarkdownSv: row.MarkdownSv,
		MarkdownEn: dbutil.TextPtr(row.MarkdownEn),
	}
}

func sanitizePtr(p *bluemonday.Policy, s *string) *string {
	if s == nil {
		return nil
	}
	sanitized := p.Sanitize(*s)
	return &sanitized
}
