// Package documents is the MinIO-backed meeting-document/requirement-profile
// file-browsing feature (src/routes/(app)/documents/*,
// /documents/requirements, /documents/upload) - see ../../DESIGN.md's Phase
// 4 section ("Real file storage + gallery + document uploads"). Deliberately
// not named governingdocs and unrelated to it: that package is the
// Document-Prisma-model-backed "governing documents" (styrdokument)
// feature, ported in Phase 3, which happens to share the /documents URL
// prefix and nothing else (see backend/CLAUDE.md's "Info-pages routes"
// naming note for the same kind of prefix collision). Like gallery, there's
// no backing DB table at all - pure MinIO folder listings, exactly as
// before.
package documents

import (
	"errors"
	"fmt"
	"io"
	"time"
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

// Upload type constants - match the old
// src/routes/(app)/documents/upload/types.ts uploadSchema's `type` enum.
const (
	UploadMeeting     = "meeting"
	UploadSRD         = "srd"
	UploadRequirement = "requirement"
)

var ErrInvalidInput = errors.New("documents: invalid input")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// DocumentFile is one object in a meeting/requirement folder - the port of
// src/lib/files/fileHandler.ts's FileData as used by this feature.
type DocumentFile struct {
	// ID is the object's full key within its bucket.
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	URL          string    `json:"url"`
	Size         int64     `json:"size"`
	LastModified time.Time `json:"lastModified"`
}

// Meeting is one meeting folder's files, with notice/agenda/minutes
// resolved server-side (ported from Meeting.svelte's client-side findFile
// logic, matching this project's "resolve once, serve resolved field"
// convention) - Files holds everything else in the folder.
type Meeting struct {
	Name    string         `json:"name"`
	Notice  *DocumentFile  `json:"notice,omitempty"`
	Agenda  *DocumentFile  `json:"agenda,omitempty"`
	Minutes *DocumentFile  `json:"minutes,omitempty"`
	Files   []DocumentFile `json:"files"`
}

// RequirementFolder is one position/committee's requirement-profile folder
// under public/kravprofiler/{year}/... - matches
// documents/requirements/+page.server.ts's filesGroupedByFolder shape.
type RequirementFolder struct {
	Name  string         `json:"name"`
	Files []DocumentFile `json:"files"`
}

// UploadFile is the file half of a document upload.
type UploadFile struct {
	Filename string
	Data     io.Reader
}
