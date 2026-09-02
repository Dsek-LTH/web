package gallery

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/nollning"
	"github.com/dsek-lth/web/backend/internal/storage"
)

// albumMetadataFile is the optional per-album metadata object - see
// GetAlbum.
const albumMetadataFile = "album.json"

// parseDate parses an album folder's leading "YYYY-MM-DD" date token,
// matching the old TS code's Date.parse(a[0].split(" ")[0]).
func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

type Service struct {
	store    storage.Backend
	nollning *nollning.Service
	bucket   string
}

// nollning is used by ListAlbums to redact pre-reveal albums from viewers
// without apinames.MemberSeeStaben - same pattern as
// internal/committees.Service.ListBoard, replacing the old
// isNollningPeriod/getNollningStart AdminSetting-based date hack (see
// ../../DESIGN.md's Phase 4 section).
func NewService(store storage.Backend, nollningSvc *nollning.Service, bucket string) *Service {
	return &Service{store: store, nollning: nollningSvc, bucket: bucket}
}

func toPicture(o storage.Object) Picture {
	return Picture{ID: o.Key, Name: o.Name, URL: o.URL, Size: o.Size, LastModified: o.LastModified}
}

// ListAlbums lists every album folder under the bucket, grouped exactly
// like the old gallery/+page.server.ts's filesGroupedByAlbum (album =
// second-to-last path segment of each object's key).
//
// Redaction: mirrors the old page's isNollningPeriod/getNollningStart
// check, but for real - during an active nollning season, an album whose
// folder date predates the season's NollaStartAt is hidden from viewers
// without apinames.MemberSeeStaben (outside any season,
// nollning.Service.InjectStabenPolicy has already granted everyone that
// policy by default, so this is a no-op then).
func (s *Service) ListAlbums(ctx context.Context) ([]Album, error) {
	if err := auth.Require(ctx, apinames.FileAlbumsRead); err != nil {
		return nil, err
	}

	objects, err := s.store.List(ctx, s.bucket, "public/", true)
	if err != nil {
		return nil, fmt.Errorf("gallery: list albums: %w", err)
	}

	order := make([]string, 0)
	byAlbum := make(map[string][]Picture)
	for _, o := range objects {
		parts := strings.Split(o.Key, "/")
		if len(parts) < 2 {
			continue
		}
		album := parts[len(parts)-2]
		if _, ok := byAlbum[album]; !ok {
			order = append(order, album)
		}
		byAlbum[album] = append(byAlbum[album], toPicture(o))
	}

	season, err := s.nollning.Current(ctx)
	if err != nil {
		return nil, fmt.Errorf("gallery: get current nollning season: %w", err)
	}
	canSeeStaben := false
	if identity, ok := auth.FromContext(ctx); ok {
		canSeeStaben = identity.Has(apinames.MemberSeeStaben)
	}

	albums := make([]Album, 0, len(order))
	for _, key := range order {
		if season != nil && !canSeeStaben {
			date, _, _ := strings.Cut(key, " ")
			if t, err := parseDate(date); err == nil && t.Before(season.NollaStartAt) {
				continue
			}
		}
		albums = append(albums, Album{Key: key, Pictures: byAlbum[key]})
	}
	return albums, nil
}

// GetAlbum returns one album's pictures plus its optional album.json
// metadata (photographer/editor), matching
// gallery/album/[slug]/+page.server.ts exactly - fetched directly via
// storage.Store.Get rather than an HTTP round-trip through the object's own
// public URL like the old TS code did.
func (s *Service) GetAlbum(ctx context.Context, slug string) (*AlbumDetail, error) {
	if err := auth.Require(ctx, apinames.FileAlbumsRead); err != nil {
		return nil, err
	}

	year := storage.YearFromDate(slug)
	prefix := "public/" + year + "/" + slug
	objects, err := s.store.List(ctx, s.bucket, prefix, true)
	if err != nil {
		return nil, fmt.Errorf("gallery: list album %q: %w", slug, err)
	}

	detail := &AlbumDetail{Key: slug}
	for _, o := range objects {
		if o.Name == albumMetadataFile {
			data, err := s.store.Get(ctx, s.bucket, o.Key)
			if err != nil {
				return nil, fmt.Errorf("gallery: read %s: %w", albumMetadataFile, err)
			}
			var meta struct {
				Photographer string `json:"photographer"`
				Editor       string `json:"editor"`
			}
			if err := json.Unmarshal(data, &meta); err != nil {
				return nil, fmt.Errorf("gallery: parse %s: %w", albumMetadataFile, err)
			}
			detail.Photographer = &meta.Photographer
			detail.Editor = &meta.Editor
			continue
		}
		detail.Pictures = append(detail.Pictures, toPicture(o))
	}
	return detail, nil
}

// UploadAlbum uploads every file into the "public/{year}/{date} {name}"
// folder and waits for all of them to finish before returning - fixes
// gallery/upload/uploadFiles.ts's fire-and-forget bug, which pushed upload
// promises into a list it never awaited.
func (s *Service) UploadAlbum(ctx context.Context, name, date string, files []UploadFile) error {
	if err := auth.Require(ctx, apinames.FileAlbumsCreate); err != nil {
		return err
	}

	prefix := "public/" + storage.YearFromDate(date) + "/" + storage.AlbumFolderName(date, name)

	g, gctx := errgroup.WithContext(ctx)
	for _, f := range files {
		f := f
		g.Go(func() error {
			key := prefix + "/" + storage.PreparedFilename(f.Filename, f.Filename)
			_, err := s.store.Put(gctx, s.bucket, key, f.Data, -1)
			return err
		})
	}
	if err := g.Wait(); err != nil {
		return fmt.Errorf("gallery: upload album %q: %w", prefix, err)
	}
	return nil
}
