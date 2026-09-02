// Package storage is the real MinIO-backed object store replacing
// internal/integrations.MockUploader - see ../../DESIGN.md's Phase 4
// section ("Real file storage + gallery + document uploads") for why this
// was mocked until now. Store wraps github.com/minio/minio-go/v7 and is
// consumed directly by internal/gallery and internal/documents (which need
// listing/deleting, not just a single-shot upload), and implements
// integrations.Uploader for the simpler article-image upload path.
//
// internal/gallery, internal/documents, and internal/articles all depend on
// the Backend interface, not *Store directly, so MockBackend can stand in
// for local dev when MINIO_ROOT_USER/MINIO_ROOT_PASSWORD aren't configured
// (see main.go's STORAGE_MOCK - same "explicit opt-in, never a silent
// fallback" shape as AUTH_MOCK, not a permanent mode).
package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"path"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// folderPreserverObject is a placeholder object MinIO folder-creation UIs
// write so an otherwise-empty "folder" (prefix) stays visible - filtered
// out of every listing, mirroring src/lib/files/fileHandler.ts's
// getFilesInFolder.
const folderPreserverObject = "_folder-preserver"

// Backend is what internal/gallery, internal/documents, and
// internal/articles actually depend on - *Store's real implementation, or
// MockBackend for local dev without MinIO credentials (see main.go's
// STORAGE_MOCK).
type Backend interface {
	Put(ctx context.Context, bucket, key string, data io.Reader, size int64) (string, error)
	List(ctx context.Context, bucket, prefix string, recursive bool) ([]Object, error)
	Get(ctx context.Context, bucket, key string) ([]byte, error)
	Remove(ctx context.Context, bucket string, keys []string) error
	// Upload implements internal/integrations.Uploader.
	Upload(ctx context.Context, filename string, data io.Reader) (string, error)
}

// Config is everything needed to reach the MinIO instance, read from env
// vars already present in .env (MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL,
// MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, PUBLIC_MINIO_BASE_URL) - see
// main.go.
type Config struct {
	Endpoint string
	UseSSL   bool
	// AccessKey/SecretKey are MINIO_ROOT_USER/MINIO_ROOT_PASSWORD.
	AccessKey string
	SecretKey string
	// BaseURL is PUBLIC_MINIO_BASE_URL, used to build public object URLs
	// (e.g. "https://files-sandbox.dsek.se") - no trailing slash.
	BaseURL string
	// ArticleImageBucket/Prefix are where Store.Upload (the
	// integrations.Uploader implementation used by article image upload)
	// stores files - see Upload's doc comment.
	ArticleImageBucket string
}

// Store is the real object store. Safe for concurrent use (minio.Client
// is).
type Store struct {
	client *minio.Client
	cfg    Config
}

func New(cfg Config) (*Store, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("storage: connect to minio: %w", err)
	}
	return &Store{client: client, cfg: cfg}, nil
}

// Object is one listed file or (non-recursive) folder prefix.
type Object struct {
	// Key is the full object path within the bucket (what old TS code
	// called "id").
	Key          string
	Name         string
	Size         int64
	LastModified time.Time
	// IsDir is true for a common-prefix "folder" entry, only possible when
	// List is called with recursive=false. Every current caller passes
	// recursive=true, so this is always false in practice today - kept for
	// completeness/parity with fileHandler.ts's FileData.isDir.
	IsDir bool
	URL   string
}

func (s *Store) objectURL(bucket, key string) string {
	return s.cfg.BaseURL + "/" + bucket + "/" + key
}

// List mirrors src/lib/files/fileHandler.ts's getFilesInFolder: lists
// objects under prefix (recursive or not), filters out the
// _folder-preserver placeholder, and resolves each object's public URL.
func (s *Store) List(ctx context.Context, bucket, prefix string, recursive bool) ([]Object, error) {
	var objects []Object
	for info := range s.client.ListObjects(ctx, bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: recursive,
	}) {
		if info.Err != nil {
			return nil, fmt.Errorf("storage: list %s/%s: %w", bucket, prefix, info.Err)
		}
		if strings.HasSuffix(info.Key, "/") {
			// A common-prefix ("folder") entry from a non-recursive listing -
			// minio-go represents these as an ObjectInfo with only Key set,
			// to the prefix itself (always "/"-terminated).
			name := strings.TrimSuffix(info.Key, "/")
			objects = append(objects, Object{Key: info.Key, Name: path.Base(name), IsDir: true})
			continue
		}
		name := path.Base(info.Key)
		if name == folderPreserverObject {
			continue
		}
		objects = append(objects, Object{
			Key:          info.Key,
			Name:         name,
			Size:         info.Size,
			LastModified: info.LastModified,
			URL:          s.objectURL(bucket, info.Key),
		})
	}
	sort.Slice(objects, func(i, j int) bool { return objects[i].Key < objects[j].Key })
	return objects, nil
}

// Get fetches one object's full content - used to read album.json's small
// metadata payload (src/routes/(app)/gallery/album/[slug]/+page.server.ts
// used to do this via an HTTP round-trip through the object's own public
// URL; fetching it directly from MinIO is simpler and doesn't depend on the
// bucket being publicly readable over HTTP).
func (s *Store) Get(ctx context.Context, bucket, key string) ([]byte, error) {
	obj, err := s.client.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("storage: get %s/%s: %w", bucket, key, err)
	}
	defer obj.Close()
	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("storage: read %s/%s: %w", bucket, key, err)
	}
	return data, nil
}

// Put uploads data as bucket/key and returns its public URL. size may be
// -1 if unknown (minio-go streams it in that case).
func (s *Store) Put(
	ctx context.Context,
	bucket, key string,
	data io.Reader,
	size int64,
) (string, error) {
	_, err := s.client.PutObject(ctx, bucket, key, data, size, minio.PutObjectOptions{})
	if err != nil {
		return "", fmt.Errorf("storage: put %s/%s: %w", bucket, key, err)
	}
	return s.objectURL(bucket, key), nil
}

// Remove deletes every given key from bucket in one batch call.
func (s *Store) Remove(ctx context.Context, bucket string, keys []string) error {
	objectsCh := make(chan minio.ObjectInfo)
	go func() {
		defer close(objectsCh)
		for _, key := range keys {
			objectsCh <- minio.ObjectInfo{Key: key}
		}
	}()
	for removeErr := range s.client.RemoveObjects(ctx, bucket, objectsCh, minio.RemoveObjectsOptions{}) {
		if removeErr.Err != nil {
			return fmt.Errorf(
				"storage: remove %s/%s: %w",
				bucket,
				removeErr.ObjectName,
				removeErr.Err,
			)
		}
	}
	return nil
}

// Upload implements internal/integrations.Uploader for article image
// upload (the one existing caller, internal/articles.Service.UploadImage) -
// this is what replaces MockUploader in main.go. Every other consumer
// (internal/gallery, internal/documents) needs bucket/prefix control and
// calls Put/List/Remove directly instead.
func (s *Store) Upload(ctx context.Context, filename string, data io.Reader) (string, error) {
	key := "public/news/" + uuid.NewString() + "-" + SanitizeFilename(filename)
	return s.Put(ctx, s.cfg.ArticleImageBucket, key, data, -1)
}

var (
	unsafeFilenameChars     = regexp.MustCompile(`[^a-zA-Z0-9_åäöÅÄÖ]`)
	unsafeFullFilenameChars = regexp.MustCompile(`[^a-zA-Z0-9_åäöÅÄÖ.]`)
)

// sanitizeNamePart mirrors the "name" half of
// src/lib/files/utils.ts's prepareNameForFilesystem: replaces whitespace
// with "_" and strips everything outside the same allow-list of
// characters - notably not ".", so a dot anywhere in name is dropped just
// like the original.
func sanitizeNamePart(name string) string {
	name = strings.Join(strings.Fields(name), "_")
	return unsafeFilenameChars.ReplaceAllString(name, "")
}

// ExtensionOf mirrors src/lib/files/utils.ts's getExtensionOfFile - the
// substring after the last ".", unsanitized, empty if there's no ".".
func ExtensionOf(filename string) string {
	i := strings.LastIndex(filename, ".")
	if i < 0 {
		return ""
	}
	return filename[i+1:]
}

// PreparedFilename mirrors prepareNameForFilesystem(name, originalFilename):
// sanitizes name and appends originalFilename's own extension - used by
// internal/gallery and internal/documents, whose upload forms always pass a
// defined (never null/undefined) name string, so the old TS's
// `name ?? getNameOfFile(file.name)` fallback never actually triggered in
// either real caller and isn't replicated here.
func PreparedFilename(name, originalFilename string) string {
	return sanitizeNamePart(name) + "." + ExtensionOf(originalFilename)
}

// SanitizeFilename sanitizes a whole filename (including its extension) as
// one unit - used by Store.Upload (article image upload), which has no old
// TS naming convention to match since it's a new Go-only endpoint.
func SanitizeFilename(name string) string {
	name = strings.Join(strings.Fields(name), "_")
	return unsafeFullFilenameChars.ReplaceAllString(name, "")
}

// AlbumFolderName builds a gallery album's "{date} {name}" folder segment,
// matching gallery/upload/uploadFiles.ts's prefix convention exactly (not
// sanitized - old dates/names land in MinIO unsanitized today, and
// GetAlbum's slug lookup depends on this being reproducible byte-for-byte
// from the same date+name).
func AlbumFolderName(date, name string) string {
	return date + " " + name
}

// YearFromDate extracts the leading "YYYY" from a "YYYY-MM-DD" date
// string, matching date.split("-")[0] in the old TS gallery/documents code.
func YearFromDate(date string) string {
	if i := strings.Index(date, "-"); i >= 0 {
		return date[:i]
	}
	return date
}

var _ Backend = (*Store)(nil)

// MockBackend is a no-op Backend for local dev without real MinIO
// credentials (main.go's STORAGE_MOCK=true) - every write logs and
// succeeds without storing anything, every read returns empty, matching
// internal/integrations.MockUploader's existing "obviously fake, loud in
// the log" shape. Not meant to be exercised in CI/production - gallery and
// documents are simply non-functional (empty lists, uploads that vanish)
// under this mode, same as they'd be with no backend at all.
type MockBackend struct{}

func (MockBackend) Put(_ context.Context, bucket, key string, _ io.Reader, _ int64) (string, error) {
	log.Printf("storage: STORAGE_MOCK - pretending to store %s/%s", bucket, key)
	return "https://mock-storage.invalid/" + bucket + "/" + key, nil
}

func (MockBackend) List(_ context.Context, bucket, prefix string, _ bool) ([]Object, error) {
	log.Printf("storage: STORAGE_MOCK - pretending to list %s/%s", bucket, prefix)
	return nil, nil
}

func (MockBackend) Get(_ context.Context, bucket, key string) ([]byte, error) {
	log.Printf("storage: STORAGE_MOCK - pretending to read %s/%s", bucket, key)
	return nil, fmt.Errorf("storage: STORAGE_MOCK has no object %s/%s", bucket, key)
}

func (MockBackend) Remove(_ context.Context, bucket string, keys []string) error {
	log.Printf("storage: STORAGE_MOCK - pretending to remove %d object(s) from %s", len(keys), bucket)
	return nil
}

func (MockBackend) Upload(_ context.Context, filename string, _ io.Reader) (string, error) {
	url := "https://mock-storage.invalid/" + filename
	log.Printf("storage: STORAGE_MOCK - pretending to store %q, returning %s", filename, url)
	return url, nil
}

var _ Backend = MockBackend{}
