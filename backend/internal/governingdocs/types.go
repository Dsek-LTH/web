package governingdocs

import "time"

// Document is a governing document (styrdokument) - a title/url/type
// pointer, not a stored file (url is just a plain string the author pastes
// in). Package named governingdocs, not documents, to avoid colliding with
// the unrelated MinIO-backed /documents file-browsing feature (no Prisma
// model, deferred to Phase 4 - see DESIGN.md's Phase 3 section).
type Document struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// DocumentInput is the create/update body - Type is restricted to
// POLICY/GUIDELINE (validated in Service), matching the old
// governingDocumentSchema's zod constraint even though the DB enum has
// more values (MEETING/OTHER/etc. exist but have no create/edit UI
// anywhere in the old app either).
type DocumentInput struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Type  string `json:"type"`
}
