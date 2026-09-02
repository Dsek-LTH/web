package songs

import "time"

// Song is the songbook detail/list shape - single-language (title/lyrics
// have no Sv/En pair in the old app either), unlike articles/events.
type Song struct {
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	Lyrics    string     `json:"lyrics"`
	Melody    *string    `json:"melody,omitempty"`
	Category  *string    `json:"category,omitempty"`
	Slug      string     `json:"slug"`
	Video     *string    `json:"video,omitempty"`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
}

// SongInput is the full-replace create/update body, matching articles'/
// events' PUT-dressed-as-PATCH convention.
type SongInput struct {
	Title    string  `json:"title"`
	Lyrics   string  `json:"lyrics"`
	Melody   *string `json:"melody,omitempty"`
	Category *string `json:"category,omitempty"`
	Video    *string `json:"video,omitempty"`
}

type ListParams struct {
	Search *string
	// Categories ANY-matches (contains, case-insensitive) against each
	// entry - mirroring the old app's repeated ?category= query param.
	Categories []string
	// ShowDeleted switches to the trash view (only soft-deleted songs)
	// instead of the normal active-songs list - an exclusive toggle, not a
	// union with active songs. Only honored for a caller holding SongDelete.
	ShowDeleted bool
	Page        int
	PageSize    int
}
