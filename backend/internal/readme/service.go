// Package readme serves issues of the README newsletter. Ported from
// src/routes/(app)/readme/[year]/[number].
package readme

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

var ErrNotFound = errors.New("readme: not found")

// ReadmeIssue is one README issue. URL points at the issue itself (a PDF).
type ReadmeIssue struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	URL         string     `json:"url"                   doc:"Where the issue is, usually a PDF."`
	Year        int32      `json:"year"`
	Number      int32      `json:"number"                doc:"Issue number within the year."`
	PublishedAt *time.Time `json:"publishedAt,omitempty" doc:"Unset for an issue not out yet."`
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// Get returns issue number of year. Public, like the old page.
func (s *Service) Get(ctx context.Context, year, number int32) (*ReadmeIssue, error) {
	row, err := s.queries.GetReadmeIssue(ctx, db.GetReadmeIssueParams{Year: year, Number: number})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get readme issue: %w", err)
	}
	return &ReadmeIssue{
		ID:          dbutil.UUIDStr(row.ID),
		Title:       row.Title,
		URL:         row.Url,
		Year:        row.Year,
		Number:      row.Number,
		PublishedAt: dbutil.TimePtr(row.PublishedAt),
	}, nil
}
