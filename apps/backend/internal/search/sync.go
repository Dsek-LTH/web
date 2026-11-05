package search

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"sync"
	"time"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// batchSize is how many documents go to Meilisearch per request.
const batchSize = 1000

// pdfConcurrency is how many PDFs are fetched and converted at once.
const pdfConcurrency = 10

func (s *Service) httpClient() *http.Client {
	return &http.Client{Timeout: 2 * time.Minute}
}

// StartSync begins a full rebuild in the background, for an admin
// (core:admin, the policy the old admin/debug sync button checked).
func (s *Service) StartSync(ctx context.Context) error {
	if err := auth.Require(ctx, apinames.CoreAdmin); err != nil {
		return err
	}
	return s.StartSyncUnchecked()
}

// StartSyncUnchecked begins a full rebuild in the background without an
// authorization check - for the SYNC_PASSWORD-protected endpoint, whose
// caller has no session. Returns ErrSyncRunning if one is already going.
func (s *Service) StartSyncUnchecked() error {
	if s.meili == nil {
		return ErrUnavailable
	}
	if !s.syncMu.TryLock() {
		return ErrSyncRunning
	}
	go func() {
		defer s.syncMu.Unlock()
		if err := s.sync(context.Background()); err != nil {
			slog.Error("search: sync failed", "err", err)
		}
	}()
	return nil
}

// sync rebuilds every index from scratch, like the old
// src/lib/search/sync.ts: for each index, delete every document, apply the
// settings, then add everything back. Each index is empty for the few
// seconds that takes, as before.
func (s *Service) sync(ctx context.Context) error {
	start := time.Now()
	slog.Info("search: syncing Meilisearch")
	for _, index := range Indexes {
		if err := s.meili.ensureIndex(ctx, index); err != nil {
			return fmt.Errorf("create index %s: %w", index, err)
		}
	}

	type loader struct {
		index string
		load  func(context.Context) ([]map[string]any, error)
	}
	loaders := []loader{
		{IndexMembers, s.loadMembers},
		{IndexSongs, s.loadSongs},
		{IndexArticles, s.loadArticles},
		{IndexEvents, s.loadEvents},
		{IndexPositions, s.loadPositions},
		{IndexCommittees, s.loadCommittees},
	}
	// The document indexes need poppler; if it's down they are left as
	// they were rather than emptied, as before.
	if s.poppler.healthy(ctx) {
		loaders = append(loaders,
			loader{IndexGoverningDocuments, s.loadGoverningDocuments},
			loader{IndexMeetingDocuments, s.loadMeetingDocuments},
		)
	} else {
		slog.Warn("search: poppler is not reachable, skipping the document indexes")
	}

	for _, l := range loaders {
		docs, err := l.load(ctx)
		if err != nil {
			return fmt.Errorf("load %s: %w", l.index, err)
		}
		if err := s.replaceIndex(ctx, l.index, docs); err != nil {
			return fmt.Errorf("sync %s: %w", l.index, err)
		}
		slog.Info("search: synced", "index", l.index, "documents", len(docs))
	}
	slog.Info("search: sync done", "duration_ms", time.Since(start).Milliseconds())
	return nil
}

func (s *Service) replaceIndex(ctx context.Context, index string, docs []map[string]any) error {
	if err := s.meili.deleteAllDocuments(ctx, index); err != nil {
		return err
	}
	if err := s.meili.updateSettings(ctx, index, indexDefs[index].settings); err != nil {
		return err
	}
	for i := 0; i < len(docs); i += batchSize {
		if err := s.meili.addDocuments(
			ctx,
			index,
			docs[i:min(i+batchSize, len(docs))],
		); err != nil {
			return err
		}
	}
	return nil
}

// The loaders below build each index's documents with the same field
// names the old sync stored (the frontend's result components read them).

func (s *Service) loadMembers(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListMembersForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, map[string]any{
			"id":             meiliID(dbutil.UUIDStr(r.ID)),
			"studentId":      dbutil.TextPtr(r.StudentID),
			"firstName":      dbutil.TextPtr(r.FirstName),
			"lastName":       dbutil.TextPtr(r.LastName),
			"nickname":       dbutil.TextPtr(r.Nickname),
			"picturePath":    dbutil.TextPtr(r.PicturePath),
			"classYear":      dbutil.Int4Ptr(r.ClassYear),
			"classProgramme": dbutil.TextPtr(r.ClassProgramme),
			"fullName":       strings.TrimSpace(r.FirstName.String + " " + r.LastName.String),
		})
	}
	return docs, nil
}

func (s *Service) loadSongs(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListSongsForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, map[string]any{
			"id":       meiliID(dbutil.UUIDStr(r.ID)),
			"title":    r.Title,
			"category": dbutil.TextPtr(r.Category),
			"lyrics":   r.Lyrics,
			"melody":   dbutil.TextPtr(r.Melody),
			"slug":     r.Slug,
		})
	}
	return docs, nil
}

func (s *Service) loadArticles(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListArticlesForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, map[string]any{
			"id":          meiliID(dbutil.UUIDStr(r.ID)),
			"headerSv":    r.HeaderSv,
			"headerEn":    dbutil.TextPtr(r.HeaderEn),
			"bodySv":      r.BodySv,
			"bodyEn":      dbutil.TextPtr(r.BodyEn),
			"slug":        r.Slug,
			"publishedAt": dbutil.TimePtr(r.PublishedDatetime),
			"author": map[string]any{
				"firstName":   dbutil.TextPtr(r.AuthorFirstName),
				"lastName":    dbutil.TextPtr(r.AuthorLastName),
				"nickname":    dbutil.TextPtr(r.AuthorNickname),
				"picturePath": dbutil.TextPtr(r.AuthorPicturePath),
			},
		})
	}
	return docs, nil
}

func (s *Service) loadEvents(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListEventsForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, map[string]any{
			"id":            meiliID(dbutil.UUIDStr(r.ID)),
			"titleSv":       r.TitleSv,
			"titleEn":       dbutil.TextPtr(r.TitleEn),
			"descriptionSv": r.DescriptionSv,
			"descriptionEn": dbutil.TextPtr(r.DescriptionEn),
			"slug":          dbutil.TextPtr(r.Slug),
			"startDatetime": dbutil.TimePtr(r.StartDatetime),
			"endDatetime":   dbutil.TimePtr(r.EndDatetime),
			"location":      dbutil.TextPtr(r.Location),
		})
	}
	return docs, nil
}

func (s *Service) loadPositions(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListPositionsForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		var committee map[string]any
		if r.CommitteeID.Valid {
			committee = map[string]any{
				"id":            dbutil.UUIDStr(r.CommitteeID),
				"shortName":     dbutil.TextPtr(r.CommitteeShortName),
				"nameSv":        dbutil.TextPtr(r.CommitteeNameSv),
				"nameEn":        dbutil.TextPtr(r.CommitteeNameEn),
				"darkImageUrl":  dbutil.TextPtr(r.CommitteeDarkImageUrl),
				"lightImageUrl": dbutil.TextPtr(r.CommitteeLightImageUrl),
				"monoImageUrl":  dbutil.TextPtr(r.CommitteeMonoImageUrl),
			}
		}
		docs = append(docs, map[string]any{
			"id":              meiliID(r.ID),
			"dsekId":          r.ID,
			"nameSv":          r.NameSv,
			"nameEn":          dbutil.TextPtr(r.NameEn),
			"descriptionSv":   dbutil.TextPtr(r.DescriptionSv),
			"descriptionEn":   dbutil.TextPtr(r.DescriptionEn),
			"committeeId":     dbutil.UUIDStrPtr(r.CommitteeID),
			"committee":       committee,
			"committeeNameSv": r.CommitteeNameSv.String,
			"committeeNameEn": r.CommitteeNameEn.String,
		})
	}
	return docs, nil
}

func (s *Service) loadCommittees(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListCommitteesForSearch(ctx)
	if err != nil {
		return nil, err
	}
	docs := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, map[string]any{
			"id":            meiliID(dbutil.UUIDStr(r.ID)),
			"shortName":     dbutil.TextPtr(r.ShortName),
			"nameSv":        r.NameSv,
			"nameEn":        dbutil.TextPtr(r.NameEn),
			"descriptionSv": dbutil.TextPtr(r.DescriptionSv),
			"descriptionEn": dbutil.TextPtr(r.DescriptionEn),
			"darkImageUrl":  dbutil.TextPtr(r.DarkImageUrl),
			"lightImageUrl": dbutil.TextPtr(r.LightImageUrl),
			"monoImageUrl":  dbutil.TextPtr(r.MonoImageUrl),
		})
	}
	return docs, nil
}

func (s *Service) loadGoverningDocuments(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.queries.ListGoverningDocumentsForSearch(ctx)
	if err != nil {
		return nil, err
	}
	client := s.httpClient()
	return extractAll(ctx, len(rows), func(i int) map[string]any {
		r := rows[i]
		pdf, err := fetchPDF(ctx, client, r.Url)
		if err != nil {
			slog.Warn("search: skipping governing document", "title", r.Title, "err", err)
			return nil
		}
		content, err := s.poppler.toText(ctx, pdf, r.Title)
		if err != nil {
			slog.Warn("search: skipping governing document", "title", r.Title, "err", err)
			return nil
		}
		return map[string]any{
			"id":      meiliID(dbutil.UUIDStr(r.ID)),
			"title":   r.Title,
			"type":    string(r.Type),
			"url":     r.Url,
			"content": content,
		}
	}), nil
}

// loadMeetingDocuments indexes every PDF in the documents bucket. The old
// sync downloaded every file and dropped the non-PDFs by content type;
// this filters on the .pdf extension first instead of downloading them.
func (s *Service) loadMeetingDocuments(ctx context.Context) ([]map[string]any, error) {
	objects, err := s.store.List(ctx, s.documentBucket, "", true)
	if err != nil {
		return nil, err
	}
	var pdfs []int
	for i, obj := range objects {
		if !obj.IsDir && strings.EqualFold(path.Ext(obj.Key), ".pdf") {
			pdfs = append(pdfs, i)
		}
	}
	return extractAll(ctx, len(pdfs), func(i int) map[string]any {
		obj := objects[pdfs[i]]
		pdf, err := s.store.Get(ctx, s.documentBucket, obj.Key)
		if err != nil {
			slog.Warn("search: skipping meeting document", "key", obj.Key, "err", err)
			return nil
		}
		content, err := s.poppler.toText(ctx, pdf, obj.Name)
		if err != nil {
			slog.Warn("search: skipping meeting document", "key", obj.Key, "err", err)
			return nil
		}
		return map[string]any{
			"id":      meiliID(obj.Key),
			"title":   obj.Name,
			"url":     obj.URL,
			"content": content,
		}
	}), nil
}

// extractAll runs build for 0..n-1, pdfConcurrency at a time, keeping
// input order and dropping nil results (skipped documents).
func extractAll(ctx context.Context, n int, build func(int) map[string]any) []map[string]any {
	results := make([]map[string]any, n)
	sem := make(chan struct{}, pdfConcurrency)
	var wg sync.WaitGroup
	for i := range n {
		if ctx.Err() != nil {
			break
		}
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()
			defer func() { <-sem }()
			results[i] = build(i)
		}()
	}
	wg.Wait()
	docs := make([]map[string]any, 0, n)
	for _, doc := range results {
		if doc != nil {
			docs = append(docs, doc)
		}
	}
	return docs
}
