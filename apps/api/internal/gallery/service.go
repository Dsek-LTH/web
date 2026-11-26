package gallery

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/images"
	"github.com/dsek-lth/web/apps/api/internal/nollning"
	"github.com/dsek-lth/web/apps/api/internal/slug"
	"github.com/dsek-lth/web/apps/api/internal/storage"
)

var (
	ErrNotFound     = errors.New("gallery: album not found")
	ErrInvalidInput = errors.New("gallery: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// MaxPictureSize is the largest picture Create accepts.
const MaxPictureSize = 25_000_000

type Service struct {
	pool     *pgxpool.Pool
	queries  *db.Queries
	store    storage.Backend
	nollning *nollning.Service
	bucket   string
}

func NewService(
	pool *pgxpool.Pool,
	store storage.Backend,
	nollningSvc *nollning.Service,
	bucket string,
) *Service {
	return &Service{
		pool:     pool,
		queries:  db.New(pool),
		store:    store,
		nollning: nollningSvc,
		bucket:   bucket,
	}
}

func albumPrefix(id string) string    { return "public/" + id + "/" }
func picturesPrefix(id string) string { return albumPrefix(id) + "album/" }
func coverPrefix(id string) string    { return albumPrefix(id) + "cover/" }

func toPicture(o storage.Object) AlbumPicture {
	return AlbumPicture{
		ID:           o.Key,
		Name:         o.Name,
		URL:          o.URL,
		Size:         o.Size,
		LastModified: o.LastModified,
	}
}

type albumRow struct {
	ID          pgtype.UUID
	Title       string
	Description pgtype.Text
	Date        pgtype.Date
	Slug        string
}

func (s *Service) toAlbum(ctx context.Context, r albumRow) Album {
	identity, _ := auth.FromContext(ctx)
	return Album{
		ID:            dbutil.UUIDStr(r.ID),
		Slug:          r.Slug,
		Title:         r.Title,
		Description:   dbutil.TextPtr(r.Description),
		Date:          r.Date.Time.Format(time.DateOnly),
		Photographers: []apitypes.Member{},
		Editors:       []apitypes.Member{},
		CanEdit:       identity != nil && identity.Has(apinames.GalleryUpdate),
		CanDelete:     identity != nil && identity.Has(apinames.GalleryDelete),
	}
}

// hiddenBefore is the date before which albums are hidden from the caller:
// during a nollning season, the albums from before it started, unless the
// caller has member:see_staben (outside a season everyone has it). Zero
// when nothing is hidden.
func (s *Service) hiddenBefore(ctx context.Context) (time.Time, error) {
	if identity, ok := auth.FromContext(ctx); ok && identity.Has(apinames.MemberSeeStaben) {
		return time.Time{}, nil
	}
	season, err := s.nollning.Current(ctx)
	if err != nil {
		return time.Time{}, fmt.Errorf("gallery: get current nollning season: %w", err)
	}
	if season == nil {
		return time.Time{}, nil
	}
	return season.NollaStartAt, nil
}

func hidden(date pgtype.Date, before time.Time) bool {
	return !before.IsZero() && date.Time.Before(before)
}

// withMembers fills in the albums' photographers and editors.
func (s *Service) withMembers(ctx context.Context, albums []*Album) error {
	if len(albums) == 0 {
		return nil
	}
	byID := make(map[string]*Album, len(albums))
	ids := make([]pgtype.UUID, 0, len(albums))
	for _, a := range albums {
		id, err := dbutil.ParseUUID(a.ID)
		if err != nil {
			return err
		}
		ids = append(ids, id)
		byID[a.ID] = a
	}
	rows, err := s.queries.ListAlbumMembers(ctx, ids)
	if err != nil {
		return fmt.Errorf("gallery: list album members: %w", err)
	}
	for _, r := range rows {
		a := byID[dbutil.UUIDStr(r.AlbumID)]
		if a == nil {
			continue
		}
		m := apitypes.Member{
			ID:             dbutil.UUIDStr(r.ID),
			StudentID:      dbutil.TextPtr(r.StudentID),
			FirstName:      dbutil.TextPtr(r.FirstName),
			LastName:       dbutil.TextPtr(r.LastName),
			Nickname:       dbutil.TextPtr(r.Nickname),
			PicturePath:    dbutil.TextPtr(r.PicturePath),
			ClassYear:      dbutil.Int4Ptr(r.ClassYear),
			ClassProgramme: dbutil.TextPtr(r.ClassProgramme),
		}
		if r.Role == "photographer" {
			a.Photographers = append(a.Photographers, m)
		} else {
			a.Editors = append(a.Editors, m)
		}
	}
	return nil
}

// ListAlbums lists the albums, newest first, each with its picture count
// and cover. The bucket is listed once for all of them.
func (s *Service) ListAlbums(ctx context.Context) ([]Album, error) {
	if err := auth.Require(ctx, apinames.FileAlbumsRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListAlbums(ctx)
	if err != nil {
		return nil, fmt.Errorf("gallery: list albums: %w", err)
	}
	before, err := s.hiddenBefore(ctx)
	if err != nil {
		return nil, err
	}
	objects, err := s.store.List(ctx, s.bucket, "public/", true)
	if err != nil {
		return nil, fmt.Errorf("gallery: list pictures: %w", err)
	}
	counts := map[string]int{}
	covers := map[string]string{}
	for _, o := range objects {
		// public/<album id>/<album|cover>/<file>
		parts := strings.Split(o.Key, "/")
		if len(parts) != 4 {
			continue
		}
		switch parts[2] {
		case "album":
			counts[parts[1]]++
		case "cover":
			if _, ok := covers[parts[1]]; !ok {
				covers[parts[1]] = o.URL
			}
		}
	}

	albums := make([]Album, 0, len(rows))
	for _, r := range rows {
		if hidden(r.Date, before) {
			continue
		}
		a := s.toAlbum(ctx, albumRow(r))
		a.ImageCount = counts[a.ID]
		if url, ok := covers[a.ID]; ok {
			a.CoverURL = &url
		}
		albums = append(albums, a)
	}
	ptrs := make([]*Album, len(albums))
	for i := range albums {
		ptrs[i] = &albums[i]
	}
	if err := s.withMembers(ctx, ptrs); err != nil {
		return nil, err
	}
	return albums, nil
}

// getRow finds an album the caller may see.
func (s *Service) getRow(ctx context.Context, albumSlug string) (albumRow, error) {
	r, err := s.queries.GetAlbumBySlug(ctx, albumSlug)
	if errors.Is(err, pgx.ErrNoRows) {
		return albumRow{}, ErrNotFound
	}
	if err != nil {
		return albumRow{}, fmt.Errorf("gallery: get album %q: %w", albumSlug, err)
	}
	before, err := s.hiddenBefore(ctx)
	if err != nil {
		return albumRow{}, err
	}
	if hidden(r.Date, before) {
		return albumRow{}, ErrNotFound
	}
	return albumRow(r), nil
}

// GetAlbum returns an album with its pictures.
func (s *Service) GetAlbum(ctx context.Context, albumSlug string) (*AlbumDetail, error) {
	if err := auth.Require(ctx, apinames.FileAlbumsRead); err != nil {
		return nil, err
	}
	r, err := s.getRow(ctx, albumSlug)
	if err != nil {
		return nil, err
	}
	return s.detail(ctx, r)
}

// detail is GetAlbum without the read check, for returning what a write
// made.
func (s *Service) detail(ctx context.Context, r albumRow) (*AlbumDetail, error) {
	album := s.toAlbum(ctx, r)
	if err := s.withMembers(ctx, []*Album{&album}); err != nil {
		return nil, err
	}
	objects, err := s.store.List(ctx, s.bucket, albumPrefix(album.ID), true)
	if err != nil {
		return nil, fmt.Errorf("gallery: list album %s: %w", album.ID, err)
	}
	detail := &AlbumDetail{Album: album, Pictures: []AlbumPicture{}}
	for _, o := range objects {
		switch {
		case strings.HasPrefix(o.Key, picturesPrefix(album.ID)):
			detail.Pictures = append(detail.Pictures, toPicture(o))
		case strings.HasPrefix(o.Key, coverPrefix(album.ID)) && detail.Cover == nil:
			cover := toPicture(o)
			detail.Cover = &cover
		}
	}
	detail.ImageCount = len(detail.Pictures)
	if detail.Cover != nil {
		detail.CoverURL = &detail.Cover.URL
	}
	return detail, nil
}

// details is a validated AlbumInput.
type details struct {
	title         string
	description   pgtype.Text
	date          pgtype.Date
	photographers []pgtype.UUID
	editors       []pgtype.UUID
}

func (s *Service) validate(ctx context.Context, in AlbumInput) (details, error) {
	var d details
	d.title = strings.TrimSpace(in.Title)
	if d.title == "" {
		return d, invalidf("the title is empty")
	}
	date, err := dbutil.ParseDate(in.Date)
	if err != nil {
		return d, invalidf("invalid date %q, want YYYY-MM-DD", in.Date)
	}
	d.date = date
	if in.Description != nil && strings.TrimSpace(*in.Description) != "" {
		d.description = pgtype.Text{String: strings.TrimSpace(*in.Description), Valid: true}
	}
	if d.photographers, err = s.memberIDs(ctx, in.Photographers); err != nil {
		return d, err
	}
	if d.editors, err = s.memberIDs(ctx, in.Editors); err != nil {
		return d, err
	}
	return d, nil
}

// memberIDs looks up members by student id; an unknown one is invalid.
func (s *Service) memberIDs(ctx context.Context, studentIDs []string) ([]pgtype.UUID, error) {
	if len(studentIDs) == 0 {
		return []pgtype.UUID{}, nil
	}
	rows, err := s.queries.ListMembersByStudentIDs(ctx, studentIDs)
	if err != nil {
		return nil, fmt.Errorf("gallery: look up members: %w", err)
	}
	found := make(map[string]pgtype.UUID, len(rows))
	for _, r := range rows {
		found[r.StudentID.String] = r.ID
	}
	ids := make([]pgtype.UUID, 0, len(studentIDs))
	for _, sid := range studentIDs {
		id, ok := found[sid]
		if !ok {
			return nil, invalidf("no member with student id %q", sid)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// freeSlug is the album's slug: the title and year, with a count appended
// if another album has it.
func freeSlug(ctx context.Context, q *db.Queries, d details, exclude pgtype.UUID) (string, error) {
	base := slug.WithYear(d.title, d.date.Time.Year())
	for count := 0; ; count++ {
		candidate := slug.SlugWithCount(base, count)
		taken, err := q.AlbumSlugTaken(ctx, db.AlbumSlugTakenParams{
			Slug:      candidate,
			ExcludeID: exclude,
		})
		if err != nil {
			return "", fmt.Errorf("gallery: check slug: %w", err)
		}
		if !taken {
			return candidate, nil
		}
	}
}

func setMembers(ctx context.Context, q *db.Queries, albumID pgtype.UUID, d details) error {
	if err := q.ClearAlbumPhotographers(ctx, albumID); err != nil {
		return err
	}
	if err := q.ClearAlbumEditors(ctx, albumID); err != nil {
		return err
	}
	if err := q.AddAlbumPhotographers(ctx, db.AddAlbumPhotographersParams{
		AlbumID:   albumID,
		MemberIds: d.photographers,
	}); err != nil {
		return err
	}
	return q.AddAlbumEditors(ctx, db.AddAlbumEditorsParams{
		AlbumID:   albumID,
		MemberIds: d.editors,
	})
}

func (s *Service) inTx(ctx context.Context, fn func(q *db.Queries) error) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		return fn(s.queries.WithTx(tx))
	})
}

// Create creates an album and uploads its pictures and cover (the first
// picture when cover is nil). Every file must be a JPEG, PNG, WebP or GIF;
// each is turned upright, scaled down and re-encoded (see internal/images).
// All of them are checked before any is stored.
func (s *Service) Create(
	ctx context.Context,
	in AlbumInput,
	files []UploadFile,
	cover *UploadFile,
) (*AlbumDetail, error) {
	if err := auth.Require(ctx, apinames.GalleryCreate); err != nil {
		return nil, err
	}
	if err := auth.Require(ctx, apinames.FileAlbumsCreate); err != nil {
		return nil, err
	}
	d, err := s.validate(ctx, in)
	if err != nil {
		return nil, err
	}
	if len(files) == 0 {
		return nil, invalidf("an album needs at least one picture")
	}

	all := files
	if cover != nil {
		all = append(append([]UploadFile{}, files...), *cover)
	}
	processed := make([]*images.Image, len(all))
	pg, pctx := errgroup.WithContext(ctx)
	for i, f := range all {
		pg.Go(func() error {
			img, err := images.Read(pctx, f.Data, MaxPictureSize, images.MaxWidth)
			if err != nil {
				return fmt.Errorf("%s: %w", f.Filename, err)
			}
			processed[i] = img
			return nil
		})
	}
	if err := pg.Wait(); err != nil {
		return nil, err
	}

	id := pgtype.UUID{Bytes: uuid.New(), Valid: true}
	albumID := dbutil.UUIDStr(id)

	type upload struct {
		key string
		img *images.Image
	}
	uploads := make([]upload, 0, len(all)+1)
	for i, f := range files {
		uploads = append(uploads, upload{
			key: picturesPrefix(
				albumID,
			) + storage.PreparedFilenameWithExt(
				f.Filename,
				processed[i].Ext,
			),
			img: processed[i],
		})
	}
	coverFile, coverImg := files[0], processed[0]
	if cover != nil {
		coverFile, coverImg = *cover, processed[len(processed)-1]
	}
	uploads = append(uploads, upload{
		key: coverPrefix(
			albumID,
		) + storage.PreparedFilenameWithExt(
			coverFile.Filename,
			coverImg.Ext,
		),
		img: coverImg,
	})

	g, gctx := errgroup.WithContext(ctx)
	for _, u := range uploads {
		g.Go(func() error {
			_, err := s.store.Put(
				gctx,
				s.bucket,
				u.key,
				bytes.NewReader(u.img.Data),
				int64(len(u.img.Data)),
			)
			return err
		})
	}
	if err := g.Wait(); err != nil {
		s.removePrefix(albumID)
		return nil, fmt.Errorf("gallery: upload album %s: %w", albumID, err)
	}

	var albumSlug string
	err = s.inTx(ctx, func(q *db.Queries) error {
		var err error
		if albumSlug, err = freeSlug(ctx, q, d, pgtype.UUID{}); err != nil {
			return err
		}
		if err := q.CreateAlbum(ctx, db.CreateAlbumParams{
			ID:          id,
			Title:       d.title,
			Description: d.description,
			Date:        d.date,
			Slug:        albumSlug,
		}); err != nil {
			return fmt.Errorf("gallery: create album: %w", err)
		}
		return setMembers(ctx, q, id, d)
	})
	if err != nil {
		s.removePrefix(albumID)
		return nil, err
	}
	return s.detail(ctx, albumRow{
		ID:          id,
		Title:       d.title,
		Description: d.description,
		Date:        d.date,
		Slug:        albumSlug,
	})
}

// Update replaces an album's details; its slug follows the new title and
// year.
func (s *Service) Update(
	ctx context.Context,
	albumSlug string,
	in AlbumInput,
) (*AlbumDetail, error) {
	if err := auth.Require(ctx, apinames.GalleryUpdate); err != nil {
		return nil, err
	}
	r, err := s.getRow(ctx, albumSlug)
	if err != nil {
		return nil, err
	}
	d, err := s.validate(ctx, in)
	if err != nil {
		return nil, err
	}
	var newSlug string
	err = s.inTx(ctx, func(q *db.Queries) error {
		var err error
		if newSlug, err = freeSlug(ctx, q, d, r.ID); err != nil {
			return err
		}
		n, err := q.UpdateAlbum(ctx, db.UpdateAlbumParams{
			ID:          r.ID,
			Title:       d.title,
			Description: d.description,
			Date:        d.date,
			Slug:        newSlug,
		})
		if err != nil {
			return fmt.Errorf("gallery: update album: %w", err)
		}
		if n == 0 {
			return ErrNotFound
		}
		return setMembers(ctx, q, r.ID, d)
	})
	if err != nil {
		return nil, err
	}
	return s.detail(ctx, albumRow{
		ID:          r.ID,
		Title:       d.title,
		Description: d.description,
		Date:        d.date,
		Slug:        newSlug,
	})
}

// Delete deletes an album and its pictures. The pictures go first, so a
// failure leaves the album to delete again rather than orphaned files.
func (s *Service) Delete(ctx context.Context, albumSlug string) error {
	if err := auth.Require(ctx, apinames.GalleryDelete); err != nil {
		return err
	}
	r, err := s.getRow(ctx, albumSlug)
	if err != nil {
		return err
	}
	albumID := dbutil.UUIDStr(r.ID)
	objects, err := s.store.List(ctx, s.bucket, albumPrefix(albumID), true)
	if err != nil {
		return fmt.Errorf("gallery: list album %q: %w", albumSlug, err)
	}
	keys := make([]string, len(objects))
	for i, o := range objects {
		keys[i] = o.Key
	}
	if len(keys) > 0 {
		if err := s.store.Remove(ctx, s.bucket, keys); err != nil {
			return fmt.Errorf("gallery: remove album %q's pictures: %w", albumSlug, err)
		}
	}
	if err := s.queries.DeleteAlbum(ctx, r.ID); err != nil {
		return fmt.Errorf("gallery: delete album: %w", err)
	}
	return nil
}

// removePrefix cleans up after a failed create.
func (s *Service) removePrefix(albumID string) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	objects, err := s.store.List(ctx, s.bucket, albumPrefix(albumID), true)
	if err == nil && len(objects) > 0 {
		keys := make([]string, len(objects))
		for i, o := range objects {
			keys[i] = o.Key
		}
		err = s.store.Remove(ctx, s.bucket, keys)
	}
	if err != nil {
		slog.Error("gallery: clean up after a failed upload", "album", albumID, "err", err)
	}
}

// Download returns an album's pictures and cover as a zip, written one
// picture at a time ("album/<name>" and "cover/<name>").
func (s *Service) Download(ctx context.Context, albumSlug string) (*AlbumDownload, error) {
	album, err := s.GetAlbum(ctx, albumSlug)
	if err != nil {
		return nil, err
	}
	entries := make([]struct{ name, key string }, 0, len(album.Pictures)+1)
	for _, p := range album.Pictures {
		entries = append(entries, struct{ name, key string }{"album/" + p.Name, p.ID})
	}
	if album.Cover != nil {
		entries = append(
			entries,
			struct{ name, key string }{"cover/" + album.Cover.Name, album.Cover.ID},
		)
	}
	return &AlbumDownload{
		Slug: album.Slug,
		Write: func(w io.Writer) error {
			zw := zip.NewWriter(w)
			for _, e := range entries {
				data, err := s.store.Get(ctx, s.bucket, e.key)
				if err != nil {
					return err
				}
				// Pictures are already compressed.
				f, err := zw.CreateHeader(&zip.FileHeader{Name: e.name, Method: zip.Store})
				if err != nil {
					return err
				}
				if _, err := f.Write(data); err != nil {
					return err
				}
			}
			return zw.Close()
		},
	}, nil
}
