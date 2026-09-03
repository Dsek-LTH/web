package documents

import (
	"context"
	"path"
	"strconv"
	"strings"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/storage"
)

type Service struct {
	store           storage.Backend
	documentsBucket string
	filesBucket     string
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

func toDocumentFile(o storage.Object) DocumentFile {
	return DocumentFile{
		ID:           o.Key,
		Name:         o.Name,
		URL:          o.URL,
		Size:         o.Size,
		LastModified: o.LastModified,
	}
}

// folderOf returns an object key's second-to-last path segment (its
// containing "meeting" folder), matching
// `fileParts[fileParts.length - 2] ?? m.documents_unknown()` throughout the
// old TS code.
func folderOf(key string) string {
	parts := strings.Split(key, "/")
	if len(parts) < 2 {
		return "unknown"
	}
	return parts[len(parts)-2]
}

// oldFormatSRDMeetingName strips a trailing "pdf"/"html" substring (not
// ".pdf" - no dot check, matching the old TS's fileName.endsWith(ext) exactly)
// from a filename, used to group pre-folder-convention SRD files by
// filename instead of by folder.
func oldFormatSRDMeetingName(filename string) string {
	for _, ext := range []string{"pdf", "html"} {
		if strings.HasSuffix(filename, ext) {
			return filename[:len(filename)-len(ext)]
		}
	}
	return filename
}

// ListMeetings ports documents/+page.server.ts's load function verbatim -
// board/guild/SRD/other each have a genuinely different filter/grouping
// rule, reflecting years of ad-hoc naming conventions in the live MinIO
// bucket layout; this is a direct translation, not a redesign, since real
// files already sit under these exact prefixes.
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
	files, err := s.store.List(ctx, s.documentsBucket, "public/"+yearStr+"/"+prefix, true)
	if err != nil {
		return nil, invalidf("list documents for %d: %w", year, err)
	}

	var filteredFiles, oldFormatSRDFiles []storage.Object
	switch docType {
	case TypeGuildMeeting:
		for _, f := range files {
			if meeting := folderOf(
				f.Key,
			); strings.HasPrefix(meeting, "HTM") ||
				strings.HasPrefix(meeting, "VTM") {
				filteredFiles = append(filteredFiles, f)
			}
		}
	case TypeSRDMeeting:
		filteredFiles = files
		srdFiles, err := s.store.List(ctx, s.filesBucket, "public/srd/"+yearStr, true)
		if err != nil {
			return nil, invalidf("list SRD documents for %d: %w", year, err)
		}
		for _, f := range srdFiles {
			meeting := folderOf(f.Key)
			if strings.HasPrefix(meeting, "SRD") || strings.HasPrefix(meeting, "Möte") {
				filteredFiles = append(filteredFiles, f)
			} else {
				oldFormatSRDFiles = append(oldFormatSRDFiles, f)
			}
		}
	case TypeOther:
		for _, f := range files {
			meeting := folderOf(f.Key)
			if !strings.HasPrefix(meeting, "HTM") && !strings.HasPrefix(meeting, "VTM") &&
				!strings.HasPrefix(meeting, "S") && meeting != yearStr {
				filteredFiles = append(filteredFiles, f)
			}
		}
	default: // TypeBoardMeeting - no further filter, already scoped by the "S" prefix.
		filteredFiles = files
	}

	groups := make(map[string][]storage.Object)
	var order []string
	addTo := func(key string, f storage.Object) {
		if _, ok := groups[key]; !ok {
			order = append(order, key)
		}
		groups[key] = append(groups[key], f)
	}
	for _, f := range oldFormatSRDFiles {
		addTo(oldFormatSRDMeetingName(f.Name), f)
	}
	for _, f := range filteredFiles {
		addTo(folderOf(f.Key), f)
	}

	meetings := make([]Meeting, 0, len(order))
	for _, name := range order {
		meetings = append(meetings, buildMeeting(name, groups[name]))
	}
	return meetings, nil
}

// buildMeeting ports Meeting.svelte's findFile: for each of
// notice/agenda/minutes, the most-recently-modified file whose name
// case-insensitively contains one of that field's substrings.
//
// Real fix included here: the old minutes substring list was
// ["Protokoll", "Minutes, Minute"] - a single string containing a literal
// comma, so "Minutes"/"Minute" alone never actually matched anything (a
// find/replace-with-comma typo, not an intentional compound phrase). Split
// into three separate substrings here.
func buildMeeting(name string, files []storage.Object) Meeting {
	notice := findFile(files, "kallelse", "notice")
	agenda := findFile(files, "föredragningslista", "foredragningslista", "agenda")
	minutes := findFile(files, "protokoll", "minutes", "minute")

	m := Meeting{Name: name}
	if notice != nil {
		f := toDocumentFile(*notice)
		m.Notice = &f
	}
	if agenda != nil {
		f := toDocumentFile(*agenda)
		m.Agenda = &f
	}
	if minutes != nil {
		f := toDocumentFile(*minutes)
		m.Minutes = &f
	}
	for _, f := range files {
		if (notice != nil && f.Key == notice.Key) ||
			(agenda != nil && f.Key == agenda.Key) ||
			(minutes != nil && f.Key == minutes.Key) {
			continue
		}
		m.Files = append(m.Files, toDocumentFile(f))
	}
	return m
}

func findFile(files []storage.Object, substrings ...string) *storage.Object {
	var best *storage.Object
	for i := range files {
		f := &files[i]
		lower := strings.ToLower(f.Name)
		matched := false
		for _, s := range substrings {
			if strings.Contains(lower, s) {
				matched = true
				break
			}
		}
		if !matched {
			continue
		}
		if best == nil || f.LastModified.After(best.LastModified) {
			best = f
		}
	}
	return best
}

// ListRequirements ports documents/requirements/+page.server.ts's load
// function - grouped by folder (path segments 2..len-2, i.e. everything
// between "public/kravprofiler" and the filename, which includes the year
// itself, matching the old slice(2, length-1).join("/") exactly despite its
// comment claiming the year is excluded).
func (s *Service) ListRequirements(ctx context.Context, year int) ([]RequirementFolder, error) {
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

	folders := make([]RequirementFolder, 0, len(order))
	for _, name := range order {
		files := make([]DocumentFile, 0, len(groups[name]))
		for _, f := range groups[name] {
			files = append(files, toDocumentFile(f))
		}
		folders = append(folders, RequirementFolder{Name: name, Files: files})
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

// deleteTarget resolves a document type (the tab a delete was performed
// from) to its bucket/delete-policy. Fixes a real bug: the old app's main
// documents-page delete action always removed from documentsBucket
// regardless of which tab/type the file actually lived in - silently
// broken for SRD files, which live in filesBucket. Deriving the bucket from
// type server-side closes this structurally.
func (s *Service) deleteTarget(docType string) (bucket, deletePolicy string, err error) {
	switch docType {
	case TypeBoardMeeting, TypeGuildMeeting, TypeOther:
		return s.documentsBucket, apinames.FileDocumentsDelete, nil
	case TypeSRDMeeting:
		return s.filesBucket, apinames.FileFilesDelete, nil
	default:
		return "", "", invalidf("unknown document type %q", docType)
	}
}

// Upload stores one document/requirement/SRD file, gated on the
// appropriate bucket's create policy for uploadType.
func (s *Service) Upload(
	ctx context.Context,
	uploadType string,
	year int,
	folder, name string,
	file UploadFile,
) error {
	bucket, prefix, createPolicy, err := s.uploadTarget(uploadType, year, folder)
	if err != nil {
		return err
	}
	if err := auth.Require(ctx, createPolicy); err != nil {
		return err
	}
	key := prefix + "/" + storage.PreparedFilename(name, file.Filename)
	if _, err := s.store.Put(ctx, bucket, key, file.Data, -1); err != nil {
		return invalidf("upload %s: %w", key, err)
	}
	return nil
}

// Delete removes one meeting-document file, gated on the bucket its docType
// actually lives in - see deleteTarget's doc comment for the bug this
// fixes.
func (s *Service) Delete(ctx context.Context, docType, id string) error {
	bucket, deletePolicy, err := s.deleteTarget(docType)
	if err != nil {
		return err
	}
	if err := auth.Require(ctx, deletePolicy); err != nil {
		return err
	}
	return s.store.Remove(ctx, bucket, []string{id})
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
func (s *Service) ListMisc(ctx context.Context) ([]DocumentFile, error) {
	if err := auth.Require(ctx, apinames.FileFilesRead); err != nil {
		return nil, err
	}
	files, err := s.store.List(ctx, s.filesBucket, miscPrefix, true)
	if err != nil {
		return nil, invalidf("list misc files: %w", err)
	}
	out := make([]DocumentFile, len(files))
	for i, f := range files {
		out[i] = toDocumentFile(f)
	}
	return out, nil
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
) (*DocumentFile, error) {
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
	return &DocumentFile{ID: key, Name: path.Base(key), URL: url}, nil
}

// DeleteMisc removes one file from admin/minio's browser, gated on
// FileFilesDelete (matching fileHandler.ts's remove() check).
func (s *Service) DeleteMisc(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.FileFilesDelete); err != nil {
		return err
	}
	return s.store.Remove(ctx, s.filesBucket, []string{id})
}
