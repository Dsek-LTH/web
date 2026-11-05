// Package documents is the MinIO-backed meeting-document/requirement-profile
// file-browsing feature (src/routes/(app)/documents/*,
// /documents/requirements, /documents/upload). Deliberately
// not named governingdocs and unrelated to it: that package is the
// Document-Prisma-model-backed "governing documents" (styrdokument)
// feature, ported in Phase 3, which happens to share the /documents URL
// prefix and nothing else. Like gallery, there's
// no backing DB table at all - pure MinIO folder listings, exactly as
// before.
package documents

import (
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// Document type constants - values match the old
// src/routes/(app)/documents/types.ts DocumentTypes enum exactly (the
// frontend sends these as-is).
const (
	TypeBoardMeeting = "board-meeting"
	TypeGuildMeeting = "guild-meeting"
	TypeSRDMeeting   = "SRD-meeting"
	TypeOther        = "other"
)

// MeetingType is which kind of meeting documents to list or delete.
type MeetingType string

func (MeetingType) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(
		r,
		"MeetingType",
		TypeBoardMeeting,
		TypeGuildMeeting,
		TypeSRDMeeting,
		TypeOther,
	)
}

// MeetingUploadType is where an uploaded meeting document goes.
type MeetingUploadType string

func (MeetingUploadType) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "MeetingUploadType", UploadMeeting, UploadSRD)
}

// Upload type constants - match the old
// src/routes/(app)/documents/upload/types.ts uploadSchema's `type` enum.
const (
	UploadMeeting     = "meeting"
	UploadSRD         = "srd"
	UploadRequirement = "requirement"
)

var (
	ErrInvalidInput = errors.New("documents: invalid input")
	ErrNotFound     = errors.New("documents: not found")
	ErrFileExists   = errors.New("documents: a file with that name already exists")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// StoredFile is one object in a meeting/requirement folder - the port of
// src/lib/files/fileHandler.ts's FileData as used by this feature.
type StoredFile struct {
	// ID is the object's full key within its bucket.
	ID           string    `json:"id"                    doc:"The object's key in its bucket; what delete takes."`
	Name         string    `json:"name"                  doc:"File name."`
	URL          string    `json:"url"                   doc:"Public URL."`
	Size         int64     `json:"size,omitempty"        doc:"Bytes. Omitted right after an upload."`
	LastModified time.Time `json:"lastModified,omitzero" doc:"Omitted right after an upload."`
}

// MeetingDocument is one file of a meeting.
type MeetingDocument struct {
	ID           string    `json:"id"                    doc:"The object's key in its bucket; what edit and delete take."`
	Name         string    `json:"name"                  doc:"File name."`
	URL          string    `json:"url"                   doc:"Public URL."`
	Size         int64     `json:"size,omitempty"        doc:"Bytes."`
	LastModified time.Time `json:"lastModified,omitzero" doc:"When it was last written."`
	CanEdit      bool      `json:"canEdit"               doc:"Whether the caller may rename it or change its group."`
	CanDelete    bool      `json:"canDelete"             doc:"Whether the caller may delete it."`
}

// MeetingDocumentGroup is the files of a meeting that share a group, as
// recorded in the meeting folder's _groups.json.
type MeetingDocumentGroup struct {
	Name  string            `json:"name,omitempty" doc:"The group, e.g. a motion. Omitted for the files in no group, which come last."`
	Files []MeetingDocument `json:"files"          doc:"By name."`
}

// Meeting is one meeting's files: its notice, agenda and minutes picked
// out, and every file (those three included) by group.
type Meeting struct {
	Name    string                 `json:"name"              doc:"The meeting folder's name, e.g. S01 or HTM1."`
	Notice  *MeetingDocument       `json:"notice,omitempty"  doc:"The newest file whose name mentions a notice (kallelse)."`
	Agenda  *MeetingDocument       `json:"agenda,omitempty"  doc:"The newest file whose name mentions an agenda (föredragningslista)."`
	Minutes *MeetingDocument       `json:"minutes,omitempty" doc:"The newest file whose name mentions minutes (protokoll)."`
	Groups  []MeetingDocumentGroup `json:"groups"            doc:"Named groups first, by name."`
}

// MeetingDocumentInput renames a meeting document or changes its group.
type MeetingDocumentInput struct {
	Name  string `json:"name"            doc:"The file name, extension included." minLength:"1" maxLength:"200"`
	Group string `json:"group,omitempty" doc:"The group; empty for none."                       maxLength:"80"`
}

// RequirementProfileFolder is one position/committee's requirement-profile folder
// under public/kravprofiler/{year}/... - matches
// documents/requirements/+page.server.ts's filesGroupedByFolder shape.
type RequirementProfileFolder struct {
	Name  string       `json:"name"  doc:"Folder path below public/kravprofiler, including the year."`
	Files []StoredFile `json:"files"`
}

// UploadFile is the file half of a document upload.
type UploadFile struct {
	Filename string
	Data     io.Reader
}
