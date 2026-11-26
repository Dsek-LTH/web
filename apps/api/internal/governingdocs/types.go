package governingdocs

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// GoverningDocument is a governing document (styrdokument) - a title/url/type
// pointer, not a stored file (url is just a plain string the author pastes
// in). Package named governingdocs, not documents, to avoid colliding with
// the unrelated MinIO-backed meeting-document feature (internal/documents).
type GoverningDocument struct {
	ID        string       `json:"id"`
	Title     string       `json:"title"`
	URL       string       `json:"url"       doc:"Where the document is, usually a PDF."`
	Type      DocumentType `json:"type"`
	CreatedAt time.Time    `json:"createdAt"`
	UpdatedAt time.Time    `json:"updatedAt"`
}

// GoverningDocumentInput is the create/update body - Type is restricted to
// POLICY/GUIDELINE (validated in Service), matching the old
// governingDocumentSchema's zod constraint even though the DB enum has
// more values (MEETING/OTHER/etc. exist but have no create/edit UI
// anywhere in the old app either).
type GoverningDocumentInput struct {
	Title string       `json:"title"`
	URL   string       `json:"url"`
	Type  DocumentType `json:"type"  doc:"Only POLICY or GUIDELINE can be created or edited."`
}

// DocumentType is a governing document's kind (the document_type enum).
type DocumentType string

func (DocumentType) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(
		r,
		"GoverningDocumentType",
		"POLICY",
		"GUIDELINE",
		"MEETING",
		"OTHER",
		"PLAN_OF_OPERATIONS",
		"FRAMEWORK_BUDGET",
		"STRATEGIC_GOALS",
	)
}
