package articles

import (
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// toArticleSummary builds the DTO from the joined article-row shape shared
// by ListArticles/GetArticleBySlug/GetArticleRowBySlug. The three sqlc row
// types are structurally identical (same SELECT list, same column order) so
// callers convert with a plain Go type conversion, e.g.
// toArticleSummary(db.ListArticlesRow(row), locale).
func toArticleSummary(row db.ListArticlesRow, loc string) ArticleSummary {
	summary := ArticleSummary{
		ID:                     dbutil.UUIDStr(row.ID),
		Slug:                   row.Slug,
		Header:                 dbutil.ResolveName(row.HeaderSv, dbutil.TextPtr(row.HeaderEn), loc),
		HeaderSv:               row.HeaderSv,
		HeaderEn:               dbutil.TextPtr(row.HeaderEn),
		Body:                   dbutil.ResolveName(row.BodySv, dbutil.TextPtr(row.BodyEn), loc),
		BodySv:                 row.BodySv,
		BodyEn:                 dbutil.TextPtr(row.BodyEn),
		ImageURL:               dbutil.TextPtr(row.ImageUrl),
		ImageURLs:              row.ImageUrls,
		YoutubeURL:             dbutil.TextPtr(row.YoutubeUrl),
		Status:                 dbutil.TextPtr(row.Status),
		PublishedAt:            dbutil.TimePtr(row.PublishedDatetime),
		UpdatedAt:              dbutil.TimePtr(row.LatestEditDatetime),
		CreatedAt:              row.CreatedDatetime.Time,
		Tags:                   []Tag{},
		CommentCount:           int(row.CommentCount),
		LikeCount:              int(row.LikeCount),
		ShouldSendNotification: row.ShouldSendNotification.Bool,
		NotificationText:       dbutil.TextPtr(row.NotificationText),
		ScheduledID:            dbutil.TextPtr(row.ScheduledID),
		Author: Author{
			ID:   dbutil.UUIDStr(row.AuthorID),
			Type: dbutil.StringOr(dbutil.TextPtr(row.AuthorType), "Member"),
			Member: Member{
				ID:          dbutil.UUIDStr(row.MemberID),
				StudentID:   dbutil.TextPtr(row.MemberStudentID),
				FirstName:   dbutil.TextPtr(row.MemberFirstName),
				LastName:    dbutil.TextPtr(row.MemberLastName),
				Nickname:    dbutil.TextPtr(row.MemberNickname),
				PicturePath: dbutil.TextPtr(row.MemberPicturePath),
			},
		},
	}

	if row.PositionID.Valid {
		nameSv := dbutil.StringOr(dbutil.TextPtr(row.PositionNameSv), "")
		nameEn := dbutil.TextPtr(row.PositionNameEn)
		summary.Author.Position = &Position{
			ID:     row.PositionID.String,
			Name:   dbutil.ResolveName(nameSv, nameEn, loc),
			NameSv: nameSv,
			NameEn: nameEn,
		}
	}

	if row.CustomAuthorID.Valid {
		nameSv := dbutil.StringOr(dbutil.TextPtr(row.CustomAuthorNameSv), "")
		nameEn := dbutil.TextPtr(row.CustomAuthorNameEn)
		summary.Author.CustomAuthor = &CustomAuthor{
			ID:       dbutil.UUIDStr(row.CustomAuthorID),
			Name:     dbutil.ResolveName(nameSv, nameEn, loc),
			NameSv:   nameSv,
			NameEn:   nameEn,
			ImageURL: dbutil.TextPtr(row.CustomAuthorImageUrl),
		}
	}

	if row.CommitteeID.Valid {
		nameSv := dbutil.StringOr(dbutil.TextPtr(row.CommitteeNameSv), "")
		nameEn := dbutil.TextPtr(row.CommitteeNameEn)
		summary.Committee = &Committee{
			ID:        dbutil.UUIDStr(row.CommitteeID),
			Name:      dbutil.ResolveName(nameSv, nameEn, loc),
			NameSv:    nameSv,
			NameEn:    nameEn,
			ShortName: dbutil.TextPtr(row.CommitteeShortName),
			SymbolURL: dbutil.TextPtr(row.CommitteeSymbolUrl),
		}
	}

	return summary
}
