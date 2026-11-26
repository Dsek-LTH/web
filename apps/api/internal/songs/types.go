package songs

import "time"

// Song is the songbook detail/list shape - single-language (title/lyrics
// have no Sv/En pair in the old app either), unlike articles/events.
type Song struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Lyrics string `json:"lyrics" doc:"Typographic replacements (--, ||: etc.) already applied."`
	// RawTitle/RawLyrics are the stored text before FixSongText, for the
	// edit form: seeding it with the display text would save the
	// replacements (an em dash for --) on the next edit.
	RawTitle  *string    `json:"rawTitle,omitempty"  doc:"The title as stored, before the typographic replacements. Only for callers who may edit songs (song:update)."`
	RawLyrics *string    `json:"rawLyrics,omitempty" doc:"The lyrics as stored, before the typographic replacements. Only for callers who may edit songs (song:update)."`
	Melody    *string    `json:"melody,omitempty"    doc:"The tune it's sung to."`
	Category  *string    `json:"category,omitempty"  doc:"One or more categories, comma separated."`
	Slug      string     `json:"slug"`
	Video     *string    `json:"video,omitempty"     doc:"Video URL."`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
	DeletedAt *time.Time `json:"deletedAt,omitempty" doc:"Set if the song is soft-deleted."`
}

// SongInput is the full-replace create/update body, matching articles'/
// events' full-replace (PUT) convention.
type SongInput struct {
	Title    string  `json:"title"`
	Lyrics   string  `json:"lyrics"`
	Melody   *string `json:"melody,omitempty"`
	Category *string `json:"category,omitempty" doc:"One or more categories, comma separated."`
	Video    *string `json:"video,omitempty"`
}

// SongList is one page of songs.
type SongList struct {
	Songs     []Song `json:"songs"`
	PageCount int    `json:"pageCount" doc:"Number of pages at this pageSize."`
}

type ListParams struct {
	Search *string
	// TitleOnly limits Search to titles (the songbook editor's song
	// picker) instead of also matching lyrics and melodies.
	TitleOnly bool
	// Categories ANY-matches (contains, case-insensitive) against each
	// entry - mirroring the old app's repeated ?category= query param.
	Categories []string
	// OnlyDeleted switches to the trash view (only soft-deleted songs)
	// instead of the normal active-songs list - an exclusive toggle, not a
	// union with active songs. Only honored for a caller holding SongDelete.
	OnlyDeleted bool
	Page        int
	PageSize    int
}
