package documents

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"path"
	"strconv"
	"strings"
	"sync"
	"unicode/utf8"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/storage"
)

type Service struct {
	store           storage.Backend
	documentsBucket string
	filesBucket     string

	locksMu sync.Mutex
	locks   map[string]*sync.Mutex // per meeting sidecar, see updateGroupMap
}

func NewService(store storage.Backend, documentsBucket, filesBucket string) *Service {
	return &Service{store: store, documentsBucket: documentsBucket, filesBucket: filesBucket}
}

// meetingPrefixByType mirrors documents/+page.server.ts's prefixByType -
// the sub-prefix appended to "public/{year}/" when listing documentsBucket
// for a given tab.
var meetingPrefixByType = map[string]string{
	TypeBoardMeeting: "S",
	TypeGuildMeeting: "",
	TypeSRDMeeting:   "Möte ",
	TypeOther:        "",
}

func toDocumentFile(o storage.Object) StoredFile {
	return StoredFile{
		ID:           o.Key,
		Name:         o.Name,
		URL:          o.URL,
		Size:         o.Size,
		LastModified: o.LastModified,
	}
}

// ListMeetings lists one year's meetings of one kind. Board meetings are the
// "S..." folders, guild meetings "HTM..."/"VTM...", other meetings every
// folder but those; SRD meetings are the documents bucket's "Möte ..."
// folders together with the files bucket's public/srd/{year}, where files
// outside a "SRD..." or "Möte ..." folder (from before the folders) are
// meetings of their own, named after the file.
func (s *Service) ListMeetings(ctx context.Context, docType string, year int) ([]Meeting, error) {
	if err := auth.Require(ctx, apinames.FileDocumentsRead); err != nil {
		return nil, err
	}
	prefix, ok := meetingPrefixByType[docType]
	if !ok {
		return nil, invalidf("unknown document type %q", docType)
	}
	if docType == TypeSRDMeeting {
		if err := auth.Require(ctx, apinames.FileFilesRead); err != nil {
			return nil, err
		}
	}

	yearStr := strconv.Itoa(year)
	base := "public/" + yearStr + "/"
	files, err := s.listFiles(ctx, s.documentsBucket, base+prefix)
	if err != nil {
		return nil, fmt.Errorf("list documents for %d: %w", year, err)
	}
	meetings := s.groupDocuments(ctx, s.documentsBucket, files, base, groupOptions{})

	isGuild := func(name string) bool {
		return strings.HasPrefix(name, "HTM") || strings.HasPrefix(name, "VTM")
	}
	switch docType {
	case TypeGuildMeeting:
		maps.DeleteFunc(meetings, func(name string, _ *meetingFiles) bool { return !isGuild(name) })
	case TypeOther:
		maps.DeleteFunc(meetings, func(name string, _ *meetingFiles) bool {
			return isGuild(name) || strings.HasPrefix(name, "S") || name == yearStr
		})
	case TypeSRDMeeting:
		srdBase := "public/srd/" + yearStr + "/"
		srdFiles, err := s.listFiles(ctx, s.filesBucket, "public/srd/"+yearStr)
		if err != nil {
			return nil, fmt.Errorf("list SRD documents for %d: %w", year, err)
		}
		mergeMeetings(
			meetings,
			s.groupDocuments(ctx, s.filesBucket, srdFiles, srdBase, groupOptions{
				oldSRDFormat: true,
				meetingFilter: func(name string) bool {
					return strings.HasPrefix(name, "SRD") || strings.HasPrefix(name, "Möte")
				},
			}),
		)
	}
	return s.meetingList(ctx, meetings), nil
}

// ListRequirements ports documents/requirements/+page.server.ts's load
// function - grouped by folder (path segments 2..len-2, i.e. everything
// between "public/kravprofiler" and the filename, which includes the year
// itself, matching the old slice(2, length-1).join("/") exactly despite its
// comment claiming the year is excluded).
func (s *Service) ListRequirements(
	ctx context.Context,
	year int,
) ([]RequirementProfileFolder, error) {
	if err := auth.Require(ctx, apinames.FileFilesRead); err != nil {
		return nil, err
	}
	yearStr := strconv.Itoa(year)
	files, err := s.store.List(ctx, s.filesBucket, "public/kravprofiler/"+yearStr, true)
	if err != nil {
		return nil, invalidf("list requirements for %d: %w", year, err)
	}

	groups := make(map[string][]storage.Object)
	var order []string
	for _, f := range files {
		parts := strings.Split(f.Key, "/")
		if len(parts) < 3 {
			continue
		}
		folder := strings.Join(parts[2:len(parts)-1], "/")
		if _, ok := groups[folder]; !ok {
			order = append(order, folder)
		}
		groups[folder] = append(groups[folder], f)
	}

	folders := make([]RequirementProfileFolder, 0, len(order))
	for _, name := range order {
		files := make([]StoredFile, 0, len(groups[name]))
		for _, f := range groups[name] {
			files = append(files, toDocumentFile(f))
		}
		folders = append(folders, RequirementProfileFolder{Name: name, Files: files})
	}
	return folders, nil
}

// uploadTarget resolves an upload type to its bucket/prefix/create-policy,
// matching documents/upload/helpers.ts's typeToPath table exactly.
func (s *Service) uploadTarget(
	uploadType string,
	year int,
	folder string,
) (bucket, prefix, createPolicy string, err error) {
	yearStr := strconv.Itoa(year)
	switch uploadType {
	case UploadMeeting:
		return s.documentsBucket, "public/" + yearStr + "/" + folder, apinames.FileDocumentsCreate, nil
	case UploadSRD:
		return s.filesBucket, "public/srd/" + yearStr + "/" + folder, apinames.FileFilesCreate, nil
	case UploadRequirement:
		return s.filesBucket, "public/kravprofiler/" + yearStr + "/" + folder, apinames.FileFilesCreate, nil
	default:
		return "", "", "", invalidf("unknown upload type %q", uploadType)
	}
}

// bucketOf resolves a meeting document (its key, and the tab it was listed
// on) to the bucket it lives in. The SRD tab lists both buckets (see
// ListMeetings), so its bucket comes from the key: only the files bucket's
// SRD files are under public/srd/.
func (s *Service) bucketOf(docType, key string) (string, error) {
	switch docType {
	case TypeBoardMeeting, TypeGuildMeeting, TypeOther:
		return s.documentsBucket, nil
	case TypeSRDMeeting:
		if strings.HasPrefix(key, "public/srd/") {
			return s.filesBucket, nil
		}
		return s.documentsBucket, nil
	default:
		return "", invalidf("unknown document type %q", docType)
	}
}

// bucketPolicies returns the policies for updating and deleting files in a
// bucket.
func (s *Service) bucketPolicies(bucket string) (update, del string) {
	if bucket == s.filesBucket {
		return apinames.FileFilesUpdate, apinames.FileFilesDelete
	}
	return apinames.FileDocumentsUpdate, apinames.FileDocumentsDelete
}

// isSafePathSegment reports whether name can be one segment of a key.
func isSafePathSegment(name string) bool {
	return name != "." && !strings.ContainsAny(name, "/\\") && !strings.Contains(name, "..")
}

// cleanGroup trims a group name and checks it: at most 80 characters, and
// one path segment.
func cleanGroup(group string) (string, error) {
	group = strings.TrimSpace(group)
	if utf8.RuneCountInString(group) > 80 || (group != "" && !isSafePathSegment(group)) {
		return "", invalidf("invalid group name %q", group)
	}
	return group, nil
}

// Upload stores one document/requirement/SRD file, gated on the
// appropriate bucket's create policy for uploadType.
func (s *Service) Upload(
	ctx context.Context,
	uploadType string,
	year int,
	folder, group, name string,
	file UploadFile,
) (*StoredFile, error) {
	folder = strings.TrimSpace(folder)
	if folder == "" || !isSafePathSegment(folder) {
		return nil, invalidf("invalid folder %q", folder)
	}
	group, err := cleanGroup(group)
	if err != nil {
		return nil, err
	}
	if uploadType == UploadRequirement {
		group = ""
	}
	bucket, prefix, createPolicy, err := s.uploadTarget(uploadType, year, folder)
	if err != nil {
		return nil, err
	}
	if err := auth.Require(ctx, createPolicy); err != nil {
		return nil, err
	}
	filename := storage.PreparedFilename(name, file.Filename)
	if isReservedName(filename) {
		return nil, invalidf("invalid file name %q", filename)
	}
	key := prefix + "/" + filename
	url, err := s.store.Put(ctx, bucket, key, file.Data, -1)
	if err != nil {
		return nil, fmt.Errorf("upload %s: %w", key, err)
	}
	if group != "" {
		err := s.updateGroupMap(ctx, bucket, prefix, func(groups groupMap) bool {
			groups[meetingFileKey(key, prefix)] = group
			return true
		})
		if err != nil {
			return nil, fmt.Errorf("uploaded %s, but not its group: %w", key, err)
		}
	}
	return &StoredFile{ID: key, Name: filename, URL: url}, nil
}

// Delete removes one meeting document, and its entry in the meeting's
// sidecar. Needs the delete policy of the bucket it's in.
func (s *Service) Delete(ctx context.Context, docType, key string) error {
	if isReservedName(path.Base(key)) {
		return invalidf("invalid file %q", key)
	}
	bucket, err := s.bucketOf(docType, key)
	if err != nil {
		return err
	}
	_, deletePolicy := s.bucketPolicies(bucket)
	if err := auth.Require(ctx, deletePolicy); err != nil {
		return err
	}
	// The object goes first, so a failed delete never strips a surviving
	// file's group. A leftover entry only matters if a new file reuses the
	// path.
	if err := s.store.Remove(ctx, bucket, []string{key}); err != nil {
		return err
	}
	folder, ok := s.meetingFolder(bucket, key)
	if !ok {
		return nil
	}
	fileKey := meetingFileKey(key, folder)
	return s.updateGroupMap(ctx, bucket, folder, func(groups groupMap) bool {
		if _, ok := groups[fileKey]; !ok {
			return false
		}
		delete(groups, fileKey)
		return true
	})
}

// Update renames a meeting document and sets its group. Needs the update
// policy of the bucket it's in. Files the SRD tab lists from before the
// meeting folders (public/srd/{year}/{file}) can be renamed but not grouped.
func (s *Service) Update(
	ctx context.Context,
	docType, key string,
	in MeetingDocumentInput,
) (*MeetingDocument, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" || utf8.RuneCountInString(name) > 200 || !isSafePathSegment(name) ||
		isReservedName(name) {
		return nil, invalidf("invalid file name %q", name)
	}
	group, err := cleanGroup(in.Group)
	if err != nil {
		return nil, err
	}
	fileName := path.Base(key)
	if isReservedName(fileName) {
		return nil, invalidf("invalid file %q", key)
	}
	bucket, err := s.bucketOf(docType, key)
	if err != nil {
		return nil, err
	}
	updatePolicy, _ := s.bucketPolicies(bucket)
	if err := auth.Require(ctx, updatePolicy); err != nil {
		return nil, err
	}

	oldSRD := bucket == s.filesBucket && strings.HasPrefix(key, "public/srd/") &&
		strings.Count(key, "/") == 3
	folder, inMeeting := s.meetingFolder(bucket, key)
	switch {
	case oldSRD && group != "":
		return nil, invalidf("files from before the SRD meeting folders can't be grouped")
	case oldSRD:
		inMeeting = false
	case !inMeeting:
		return nil, invalidf("%q isn't in a meeting folder", key)
	}

	newKey := key
	if name != fileName {
		newKey = path.Join(path.Dir(key), name)
		exists, err := s.store.Exists(ctx, bucket, newKey)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, fmt.Errorf("%w: %s", ErrFileExists, name)
		}
		if err := s.store.Copy(ctx, bucket, key, newKey); err != nil {
			return nil, err
		}
		if err := s.store.Remove(ctx, bucket, []string{key}); err != nil {
			return nil, err
		}
	}

	if inMeeting {
		// The rename went first: if the sidecar can't be written, the file
		// keeps its new name and loses its group.
		fileKey := meetingFileKey(key, folder)
		nextKey := path.Join(path.Dir(fileKey), name)
		err := s.updateGroupMap(ctx, bucket, folder, func(groups groupMap) bool {
			current, has := groups[fileKey]
			if (!has && group == "") || (name == fileName && current == group) {
				return false
			}
			delete(groups, fileKey)
			if group != "" {
				groups[nextKey] = group
			}
			return true
		})
		if err != nil {
			return nil, fmt.Errorf("renamed %s, but not its group: %w", key, err)
		}
	}

	objects, err := s.store.List(ctx, bucket, newKey, false)
	if err != nil {
		return nil, err
	}
	for _, o := range objects {
		if o.Key == newKey {
			_, deletePolicy := s.bucketPolicies(bucket)
			identity, _ := auth.FromContext(ctx)
			return &MeetingDocument{
				ID:           o.Key,
				Name:         o.Name,
				URL:          o.URL,
				Size:         o.Size,
				LastModified: o.LastModified,
				CanEdit:      true,
				CanDelete:    identity.Has(deletePolicy),
			}, nil
		}
	}
	return &MeetingDocument{ID: newKey, Name: name, CanEdit: true}, nil
}

// DeleteRequirement removes one requirement-profile file. Requirement
// files only ever live in filesBucket (see uploadTarget), so - unlike
// Delete - there's no type-derived bucket ambiguity to resolve; this fixes
// the same class of bug documents/requirements/+page.server.ts's own
// deleteFile action had (it always targeted documentsBucket, where
// requirement files never live).
func (s *Service) DeleteRequirement(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.FileFilesDelete); err != nil {
		return err
	}
	return s.store.Remove(ctx, s.filesBucket, []string{id})
}

// miscPrefix is admin/minio's fixed MISCELLANEOUS_FILES_PREFIX - "a page
// to upload files to the server and get a link back", the old app's own
// doc comment for it.
const miscPrefix = "public/miscellaneous"

// ListMisc lists admin/minio's browser - every file under miscPrefix (plus
// any subfolder prefix a caller has uploaded into) in filesBucket. Requires
// FileFilesRead, matching fileHandler.ts's real getInBucket check (the old
// page's own load() additionally required FILES.BUCKET(...).CREATE before
// even calling getInBucket - a stricter, redundant outer gate for a page
// whose only real purpose is uploading, not replicated as a second
// requirement here since the real enforced check inside fileHandler was
// always just READ).
func (s *Service) ListMisc(ctx context.Context) ([]StoredFile, error) {
	if err := auth.Require(ctx, apinames.FileFilesRead); err != nil {
		return nil, err
	}
	files, err := s.store.List(ctx, s.filesBucket, miscPrefix, true)
	if err != nil {
		return nil, invalidf("list misc files: %w", err)
	}
	out := make([]StoredFile, len(files))
	for i, f := range files {
		out[i] = toDocumentFile(f)
	}
	return out, nil
}

// GetMisc returns one file under miscPrefix, for pages that serve a file
// from there to signed-in members only (e.g. /dcompassen/2026). Any
// signed-in member, like the old route's check.
func (s *Service) GetMisc(ctx context.Context, name string) ([]byte, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return nil, auth.ErrUnauthenticated
	}
	if name == "" || strings.Contains(name, "..") {
		return nil, invalidf("invalid file name")
	}
	data, err := s.store.Get(ctx, s.filesBucket, miscPrefix+"/"+name)
	if errors.Is(err, storage.ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return data, nil
}

// miscUploadKey mirrors admin/minio's upload action: `prefix` (default
// "/") is appended to miscPrefix, with the resulting "//" collapsed and any
// trailing slash trimmed, exactly as the old
// `${MISCELLANEOUS_FILES_PREFIX}${prefix}`.replace("//", "/") did.
func miscUploadKey(prefix, name, originalFilename string) string {
	full := strings.Replace(miscPrefix+prefix, "//", "/", 1)
	full = strings.TrimSuffix(full, "/")
	return full + "/" + storage.PreparedFilename(name, originalFilename)
}

// UploadMisc stores one file under miscPrefix (optionally in a caller-given
// subfolder), gated on FileFilesCreate.
func (s *Service) UploadMisc(
	ctx context.Context,
	prefix, name string,
	file UploadFile,
) (*StoredFile, error) {
	if err := auth.Require(ctx, apinames.FileFilesCreate); err != nil {
		return nil, err
	}
	if prefix == "" {
		prefix = "/"
	}
	key := miscUploadKey(prefix, name, file.Filename)
	url, err := s.store.Put(ctx, s.filesBucket, key, file.Data, -1)
	if err != nil {
		return nil, invalidf("upload %s: %w", key, err)
	}
	return &StoredFile{ID: key, Name: path.Base(key), URL: url}, nil
}

// DeleteMisc removes one file from admin/minio's browser, gated on
// FileFilesDelete (matching fileHandler.ts's remove() check).
func (s *Service) DeleteMisc(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.FileFilesDelete); err != nil {
		return err
	}
	return s.store.Remove(ctx, s.filesBucket, []string{id})
}
