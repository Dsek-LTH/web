package members

import "github.com/dsek-lth/web/backend/internal/apitypes"

type Mandate = apitypes.Mandate

// MemberProfile is the full profile shape - unlike apitypes.Member (a thin
// byline view shared with articles/events), this includes every profile
// field the member directory/profile page needs. Named distinctly from
// apitypes.Member (not just "Member") because huma's OpenAPI schema
// registry names a component after the bare Go type name - two different
// "Member" structs registered on the same huma.API panics at startup (see
// apitypes' package doc comment for the general rule). Kept local rather
// than folded into apitypes.Member since nothing outside this package
// needs the extra fields, and widening the shared byline type for every
// article/event response would be unnecessary bloat there.
type MemberProfile struct {
	ID             string    `json:"id"`
	StudentID      *string   `json:"studentId,omitempty"`
	FirstName      *string   `json:"firstName,omitempty"`
	Nickname       *string   `json:"nickname,omitempty"`
	LastName       *string   `json:"lastName,omitempty"`
	PicturePath    *string   `json:"picturePath,omitempty"`
	ClassProgramme *string   `json:"classProgramme,omitempty"`
	ClassYear      *int32    `json:"classYear,omitempty"`
	Visible        bool      `json:"visible"`
	FoodPreference *string   `json:"foodPreference,omitempty"`
	Bio            *string   `json:"bio,omitempty"`
	GraduationYear *int32    `json:"graduationYear,omitempty"`
	Language       *string   `json:"language,omitempty"`
	Email          *string   `json:"email,omitempty"`
	Mandates       []Mandate `json:"mandates,omitempty"`
}

// UpdateProfileInput is the full-replace body for PATCH /members/{studentId}
// - every field is resent on every save, matching articles/events' PATCH
// convention (see backend/DESIGN.md).
type UpdateProfileInput struct {
	FirstName      string  `json:"firstName"`
	LastName       string  `json:"lastName"`
	Nickname       *string `json:"nickname,omitempty"`
	ClassProgramme *string `json:"classProgramme,omitempty"`
	ClassYear      *int32  `json:"classYear,omitempty"`
	GraduationYear *int32  `json:"graduationYear,omitempty"`
	Language       *string `json:"language,omitempty"`
	Bio            *string `json:"bio,omitempty"`
}
