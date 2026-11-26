// Package gallery is the photo-album domain (upstream #1469's gallery): an
// album is a row in albums with its photographers and editors, and its
// pictures are MinIO objects under public/<album id>/album/ in the albums
// bucket, its cover under public/<album id>/cover/.
package gallery

import (
	"io"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// AlbumPicture is one picture (or the cover) of an album.
type AlbumPicture struct {
	ID           string    `json:"id"           doc:"The object's key in the albums bucket."`
	Name         string    `json:"name"         doc:"File name."`
	URL          string    `json:"url"          doc:"Public URL."`
	Size         int64     `json:"size"         doc:"Bytes."`
	LastModified time.Time `json:"lastModified"`
}

// Album is an album as the gallery lists it.
type Album struct {
	ID            string            `json:"id"                    doc:"Album id (UUID)."`
	Slug          string            `json:"slug"                  doc:"URL key, the slugified title and the album's year."`
	Title         string            `json:"title"`
	Description   *string           `json:"description,omitempty" doc:"Plain text."`
	Date          string            `json:"date"                  doc:"The day the pictures are from, YYYY-MM-DD."`
	ImageCount    int               `json:"imageCount"            doc:"Number of pictures, the cover not counted."`
	CoverURL      *string           `json:"coverUrl,omitempty"    doc:"Public URL of the cover picture."`
	Photographers []apitypes.Member `json:"photographers"         doc:"The photographers, by name."`
	Editors       []apitypes.Member `json:"editors"               doc:"The editors, by name."`
	CanEdit       bool              `json:"canEdit"               doc:"Whether the caller may change the album's details (gallery:update)."`
	CanDelete     bool              `json:"canDelete"             doc:"Whether the caller may delete the album (gallery:delete)."`
}

// AlbumDetail is one album with its pictures.
type AlbumDetail struct {
	Album
	Cover    *AlbumPicture  `json:"cover,omitempty" doc:"The cover picture."`
	Pictures []AlbumPicture `json:"pictures"        doc:"The pictures, by file name."`
}

// AlbumInput is an album's details, for creating one (with its pictures)
// or replacing them (PUT /albums/{slug}). The slug follows the title and
// year.
type AlbumInput struct {
	Title         string   `json:"title"                 doc:"Not empty."`
	Date          string   `json:"date"                  doc:"YYYY-MM-DD."`
	Description   *string  `json:"description,omitempty" doc:"Plain text. Unset or empty clears it."`
	Photographers []string `json:"photographers"         doc:"Student ids of the photographers."`
	Editors       []string `json:"editors"               doc:"Student ids of the editors."`
}

// UploadFile is one uploaded picture; Data is read during Service.Create.
type UploadFile struct {
	Filename string
	Data     io.Reader
}

// AlbumDownload is an album's pictures as a zip, written by Write.
type AlbumDownload struct {
	Slug  string
	Write func(w io.Writer) error
}
