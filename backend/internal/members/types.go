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
	ID             string             `json:"id"`
	StudentID      *string            `json:"studentId,omitempty"`
	FirstName      *string            `json:"firstName,omitempty"`
	Nickname       *string            `json:"nickname,omitempty"`
	LastName       *string            `json:"lastName,omitempty"`
	PicturePath    *string            `json:"picturePath,omitempty"    doc:"Public URL of the profile picture."`
	ClassProgramme *string            `json:"classProgramme,omitempty" doc:"Programme code, e.g. D or C."`
	ClassYear      *int32             `json:"classYear,omitempty"      doc:"Year the member started."`
	Visible        bool               `json:"visible"`
	FoodPreference *string            `json:"foodPreference,omitempty" doc:"Free text, e.g. allergies."`
	Bio            *string            `json:"bio,omitempty"            doc:"HTML, sanitized on save."`
	GraduationYear *int32             `json:"graduationYear,omitempty"`
	Language       *apitypes.Language `json:"language,omitempty"       doc:"Preferred UI language."`
	Email          *string            `json:"email,omitempty"          doc:"Only for the member themselves, or with member:see_email."`
	BirthDate      *string            `json:"birthDate,omitempty"      doc:"YYYY-MM-DD. Only for the member themselves, or with member:user."`
	BirthdayToday  bool               `json:"birthdayToday"            doc:"Whether it's the member's birthday today (Swedish time). False when birthDate is hidden."`
	Mandates       []Mandate          `json:"mandates,omitempty"       doc:"Every mandate the member has held, each with its position and committee. Only on GET /members/{studentId}."`
}

// ProfileInput is the full-replace body for PUT /members/{studentId}.
type ProfileInput struct {
	FirstName      string             `json:"firstName"`
	LastName       string             `json:"lastName"`
	Nickname       *string            `json:"nickname,omitempty"`
	ClassProgramme *string            `json:"classProgramme,omitempty"`
	ClassYear      *int32             `json:"classYear,omitempty"`
	GraduationYear *int32             `json:"graduationYear,omitempty"`
	Language       *apitypes.Language `json:"language,omitempty"`
	Bio            *string            `json:"bio,omitempty"            doc:"HTML, sanitized on save."`
	BirthDate      *string            `json:"birthDate,omitempty"      doc:"YYYY-MM-DD. Omit to clear it."`
}

// FoodPreferenceInput replaces a member's food preference.
type FoodPreferenceInput struct {
	FoodPreference *string `json:"foodPreference,omitempty" doc:"Free text. Omit to clear it."`
}

// LanguageInput sets a member's UI language.
type LanguageInput struct {
	Language apitypes.Language `json:"language"`
}

// MemberPicture is where a newly uploaded profile picture is.
type MemberPicture struct {
	PicturePath string `json:"picturePath" doc:"Public URL of the new picture."`
}
