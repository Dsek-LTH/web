package songs

import (
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

func toSong(row db.Song) Song {
	return Song{
		ID:        dbutil.UUIDStr(row.ID),
		Title:     FixSongText(row.Title),
		Lyrics:    FixSongText(row.Lyrics),
		Melody:    dbutil.TextPtr(row.Melody),
		Category:  dbutil.TextPtr(row.Category),
		Slug:      row.Slug,
		Video:     dbutil.TextPtr(row.Video),
		CreatedAt: dbutil.TimePtr(row.CreatedAt),
		UpdatedAt: dbutil.TimePtr(row.UpdatedAt),
		DeletedAt: dbutil.TimePtr(row.DeletedAt),
	}
}
