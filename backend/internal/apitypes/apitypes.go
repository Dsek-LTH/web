// Package apitypes holds the small handful of DTOs that are byte-for-byte
// identical across domain packages (internal/articles, internal/events, ...)
// because they describe the same underlying table (members, tags) or the
// same shape (a comment). Domain packages import these via a type alias
// (e.g. `type Member = apitypes.Member`) rather than defining their own -
// originally each package had its own copy, which is fine for Go itself
// but breaks huma's OpenAPI schema registry: it names a component schema
// after the bare Go type name (not the package-qualified one), so two
// distinct `Member` structs in different packages panic at startup with
// "duplicate name" the moment both get registered on the same huma.API.
// Aliasing to one real underlying type gives every domain package's field
// the exact same reflect.Type, so huma emits one shared schema instead of
// colliding.
package apitypes

import "time"

type Member struct {
	ID          string  `json:"id"`
	StudentID   *string `json:"studentId,omitempty"`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	PicturePath *string `json:"picturePath,omitempty"`
}

type Tag struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	Color     *string `json:"color,omitempty"`
	IsDefault bool    `json:"isDefault"`
}

type Comment struct {
	ID        string    `json:"id"`
	Content   *string   `json:"content,omitempty"`
	Published time.Time `json:"published"`
	Member    Member    `json:"member"`
}
