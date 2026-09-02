// Package governingdocs is the governing-documents (styrdokument) domain
// behind /documents/governing - see DESIGN.md's Phase 3 ("Simple
// standalone CRUD") section. Ported from
// src/routes/(app)/documents/governing/*.
package governingdocs

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

var (
	ErrNotFound     = errors.New("governingdocs: not found")
	ErrInvalidInput = errors.New("governingdocs: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// writableTypes mirrors the old governingDocumentSchema's zod enum -
// MEETING/OTHER/PLAN_OF_OPERATIONS/FRAMEWORK_BUDGET/STRATEGIC_GOALS exist
// in the DB enum but have no create/edit UI anywhere in the old app either,
// so Create/Update don't open them up here.
var writableTypes = map[string]bool{"POLICY": true, "GUIDELINE": true}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// List requires GoverningDocumentRead (matches the old ZModel's
// @@allow("read", has(...,"governing_document:read"))) - unlike
// Markdown/Alert, governing documents are not a public read.
func (s *Service) List(ctx context.Context) ([]Document, error) {
	if err := auth.Require(ctx, apinames.GoverningDocumentRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListGoverningDocuments(ctx)
	if err != nil {
		return nil, fmt.Errorf("list governing documents: %w", err)
	}
	docs := make([]Document, len(rows))
	for i, row := range rows {
		docs[i] = toDocument(row)
	}
	return docs, nil
}

func (s *Service) Get(ctx context.Context, id string) (*Document, error) {
	if err := auth.Require(ctx, apinames.GoverningDocumentRead); err != nil {
		return nil, err
	}
	docID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	row, err := s.queries.GetGoverningDocumentByID(ctx, docID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get governing document: %w", err)
	}
	doc := toDocument(row)
	return &doc, nil
}

// Create requires GoverningDocumentWrite - a real, necessary explicit
// check to add: the old app's new/+page.server.ts create action had no
// authorize() call at all, relying purely on ZenStack's model-level
// @@allow policy. Go has no such fallback layer.
func (s *Service) Create(ctx context.Context, in DocumentInput) (*Document, error) {
	if err := auth.Require(ctx, apinames.GoverningDocumentWrite); err != nil {
		return nil, err
	}
	if !writableTypes[in.Type] {
		return nil, invalidf("type must be POLICY or GUIDELINE, got %q", in.Type)
	}
	if in.Title == "" || in.URL == "" {
		return nil, invalidf("title and url are required")
	}

	row, err := s.queries.CreateGoverningDocument(ctx, db.CreateGoverningDocumentParams{
		Title: in.Title,
		Url:   in.URL,
		Type:  db.DocumentType(in.Type),
	})
	if err != nil {
		return nil, fmt.Errorf("create governing document: %w", err)
	}
	doc := toDocument(row)
	return &doc, nil
}

// Update requires GoverningDocumentWrite - same "old app had no explicit
// check" note as Create above.
func (s *Service) Update(ctx context.Context, id string, in DocumentInput) (*Document, error) {
	if err := auth.Require(ctx, apinames.GoverningDocumentWrite); err != nil {
		return nil, err
	}
	if !writableTypes[in.Type] {
		return nil, invalidf("type must be POLICY or GUIDELINE, got %q", in.Type)
	}
	if in.Title == "" || in.URL == "" {
		return nil, invalidf("title and url are required")
	}
	docID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	if _, err := s.queries.GetGoverningDocumentByID(ctx, docID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get governing document: %w", err)
	}

	row, err := s.queries.UpdateGoverningDocument(ctx, db.UpdateGoverningDocumentParams{
		ID:    docID,
		Title: in.Title,
		Url:   in.URL,
		Type:  db.DocumentType(in.Type),
	})
	if err != nil {
		return nil, fmt.Errorf("update governing document: %w", err)
	}
	doc := toDocument(row)
	return &doc, nil
}

// Delete is a real soft-delete (per DESIGN.md's Phase 3 decision) - the old
// app's delete action did a hard prisma.document.delete despite the
// deletedAt column existing, effectively dead schema. Fixed here to match
// Song/Article/Event's existing soft-delete convention, not replicated.
func (s *Service) Delete(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.GoverningDocumentWrite); err != nil {
		return err
	}
	docID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	// Unconstrained by type (unlike Get/Update above) - the list page's
	// delete action can remove any document type, matching the old app.
	if _, err := s.queries.GetAnyGoverningDocumentByID(ctx, docID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get governing document: %w", err)
	}
	if err := s.queries.SoftDeleteGoverningDocument(ctx, docID); err != nil {
		return fmt.Errorf("delete governing document: %w", err)
	}
	return nil
}

func toDocument(row db.Document) Document {
	return Document{
		ID:        dbutil.UUIDStr(row.ID),
		Title:     row.Title,
		URL:       row.Url,
		Type:      string(row.Type),
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
}
