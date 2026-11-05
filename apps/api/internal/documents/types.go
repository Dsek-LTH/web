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

// Meeting is one meeting folder's files, with notice/agenda/minutes
// resolved server-side (ported from Meeting.svelte's client-side findFile
// logic, matching this project's "resolve once, serve resolved field"
// convention) - Files holds everything else in the folder.
type Meeting struct {
	Name    string       `json:"name"              doc:"The meeting folder's name, e.g. S01 or HTM1."`
	Notice  *StoredFile  `json:"notice,omitempty"  doc:"The newest file named like a notice (kallelse)."`
	Agenda  *StoredFile  `json:"agenda,omitempty"  doc:"The newest file named like an agenda (dagordning)."`
	Minutes *StoredFile  `json:"minutes,omitempty" doc:"The newest file named like minutes (protokoll)."`
	Files   []StoredFile `json:"files"             doc:"Every other file in the folder."`
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
