// Package gallery is the photo-album domain. Unlike
// every other internal/<domain> package, there's no backing DB table at
// all: albums are pure MinIO folder listings, exactly as they were in the
// old SvelteKit app (src/routes/(app)/gallery/*, no Prisma model).
package gallery

import (
	"io"
	"time"
)

// AlbumPicture is one object in an album folder - the port of
// src/lib/files/fileHandler.ts's FileData as used by gallery.
type AlbumPicture struct {
	// ID is the object's full key within the albums bucket.
	ID           string    `json:"id"           doc:"The object's key in the albums bucket."`
	Name         string    `json:"name"         doc:"File name."`
	URL          string    `json:"url"          doc:"Public URL."`
	Size         int64     `json:"size"         doc:"Bytes."`
	LastModified time.Time `json:"lastModified"`
}

// Album is one "{date} {name}" folder and everything in it - matches the
// old gallery list page's shape exactly (Object.entries of
// folder-name -> FileData[]), not just a summary, since there was never a
// cheaper summary view for this feature.
type Album struct {
	// Key is the folder name, e.g. "2026-01-01 Nollningsfinal" - doubles as
	// the album detail page's slug.
	Key      string         `json:"key"      doc:"Folder name, \"{date} {name}\" - also the album's slug."`
	Pictures []AlbumPicture `json:"pictures"`
}

// AlbumDetail is one album's own view (src/routes/(app)/gallery/album/[slug]) -
// metadata parsed from an optional album.json object in the folder,
// Pictures with that object stripped out.
type AlbumDetail struct {
	Key          string         `json:"key"                    doc:"Folder name, \"{date} {name}\" - also the album's slug."`
	Pictures     []AlbumPicture `json:"pictures"`
	Photographer *string        `json:"photographer,omitempty" doc:"From the album's album.json, if any."`
	Editor       *string        `json:"editor,omitempty"       doc:"From the album's album.json, if any."`
}

// UploadedAlbum is the album pictures were uploaded to.
type UploadedAlbum struct {
	Key string `json:"key" doc:"The album's slug."`
}

// UploadFile is one file of an album upload - Data is read fully during
// Service.UploadAlbum, matching how the old presigned-PUT flow uploaded
// each file to completion before returning.
type UploadFile struct {
	Filename string
	Data     io.Reader
}
