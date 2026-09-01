package events

import (
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// toEventSummary builds the DTO from the joined event-row shape shared by
// ListEvents/GetEventBySlug/GetEventRowBySlug. The three sqlc row types are
// structurally identical (same SELECT list, same column order) so callers
// convert with a plain Go type conversion, e.g.
// toEventSummary(db.ListEventsRow(row), locale) - same pattern as
// internal/articles.toArticleSummary.
func toEventSummary(row db.ListEventsRow, loc string) EventSummary {
	shortSv := dbutil.TextPtr(row.ShortDescriptionSv)
	shortEn := dbutil.TextPtr(row.ShortDescriptionEn)
	var short *string
	if shortSv != nil {
		s := dbutil.ResolveName(*shortSv, shortEn, loc)
		short = &s
	}

	return EventSummary{
		ID:      dbutil.UUIDStr(row.ID),
		Slug:    dbutil.StringOr(dbutil.TextPtr(row.Slug), ""),
		Title:   dbutil.ResolveName(row.TitleSv, dbutil.TextPtr(row.TitleEn), loc),
		TitleSv: row.TitleSv,
		TitleEn: dbutil.TextPtr(row.TitleEn),
		Description: dbutil.ResolveName(
			row.DescriptionSv,
			dbutil.TextPtr(row.DescriptionEn),
			loc,
		),
		DescriptionSv:      row.DescriptionSv,
		DescriptionEn:      dbutil.TextPtr(row.DescriptionEn),
		ShortDescription:   short,
		ShortDescriptionSv: shortSv,
		ShortDescriptionEn: shortEn,
		Link:               dbutil.TextPtr(row.Link),
		Location:           dbutil.TextPtr(row.Location),
		Organizer:          row.Organizer,
		ImageURL:           dbutil.TextPtr(row.ImageUrl),
		StartAt:            row.StartDatetime.Time,
		EndAt:              row.EndDatetime.Time,
		AlarmActive:        row.AlarmActive.Bool,
		IsCancelled:        row.IsCancelled.Bool,
		RecurringParentID:  dbutil.UUIDStrPtr(row.RecurringParentID),
		Tags:               []Tag{},
		CommentCount:       int(row.CommentCount),
		GoingCount:         int(row.GoingCount),
		InterestedCount:    int(row.InterestedCount),
		Author: Member{
			ID:          dbutil.UUIDStr(row.AuthorMemberID),
			StudentID:   dbutil.TextPtr(row.AuthorStudentID),
			FirstName:   dbutil.TextPtr(row.AuthorFirstName),
			LastName:    dbutil.TextPtr(row.AuthorLastName),
			Nickname:    dbutil.TextPtr(row.AuthorNickname),
			PicturePath: dbutil.TextPtr(row.AuthorPicturePath),
		},
	}
}

func orEmptyTags(tags []Tag) []Tag {
	if tags == nil {
		return []Tag{}
	}
	return tags
}

func orEmptyMembers(members []Member) []Member {
	if members == nil {
		return []Member{}
	}
	return members
}
