package articles

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/db"
)

func uuidStr(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

func uuidStrPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := uuidStr(u)
	return &s
}

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func timePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

// parseUUID parses a client-supplied UUID string into pgtype.UUID.
func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

// parseUUIDPtr parses an optional client-supplied UUID string; a nil input
// yields an invalid (SQL NULL) pgtype.UUID rather than an error.
func parseUUIDPtr(s *string) (pgtype.UUID, error) {
	if s == nil {
		return pgtype.UUID{}, nil
	}
	return parseUUID(*s)
}

// parseUUIDs parses a list of client-supplied UUID strings. An empty input
// deliberately returns a nil (not empty) slice: pgx encodes nil as SQL NULL
// for array params and a non-nil empty slice as '{}', and the "tag_ids"
// filter in ListArticles/CountArticles relies on NULL meaning "no filter"
// rather than "match nothing".
func parseUUIDs(ss []string) ([]pgtype.UUID, error) {
	if len(ss) == 0 {
		return nil, nil
	}
	result := make([]pgtype.UUID, len(ss))
	for i, s := range ss {
		u, err := parseUUID(s)
		if err != nil {
			return nil, err
		}
		result[i] = u
	}
	return result, nil
}

// textOrInvalid treats both a nil and an empty string as "not provided",
// matching the TS backend's `filters.search && filters.search.length > 0`
// check for the article search filter.
func textOrInvalid(s *string) pgtype.Text {
	if s == nil || *s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// toText converts an optional string into pgtype.Text, distinguishing "not
// provided" (nil) from an explicit empty string.
func toText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func toTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

// resolveName picks NameEn if locale is "en" and it's set, NameSv
// otherwise - see the doc comment on Committee in types.go.
func resolveName(sv string, en *string, locale string) string {
	if locale == "en" && en != nil && *en != "" {
		return *en
	}
	return sv
}

// toArticleSummary builds the DTO from the joined article-row shape shared
// by ListArticles/GetArticleBySlug/GetArticleRowBySlug. The three sqlc row
// types are structurally identical (same SELECT list, same column order) so
// callers convert with a plain Go type conversion, e.g.
// toArticleSummary(db.ListArticlesRow(row), locale).
func toArticleSummary(row db.ListArticlesRow, loc string) ArticleSummary {
	summary := ArticleSummary{
		ID:                     uuidStr(row.ID),
		Slug:                   row.Slug,
		Header:                 resolveName(row.HeaderSv, textPtr(row.HeaderEn), loc),
		HeaderSv:               row.HeaderSv,
		HeaderEn:               textPtr(row.HeaderEn),
		Body:                   resolveName(row.BodySv, textPtr(row.BodyEn), loc),
		BodySv:                 row.BodySv,
		BodyEn:                 textPtr(row.BodyEn),
		ImageURL:               textPtr(row.ImageUrl),
		ImageURLs:              row.ImageUrls,
		YoutubeURL:             textPtr(row.YoutubeUrl),
		Status:                 textPtr(row.Status),
		PublishedAt:            timePtr(row.PublishedDatetime),
		UpdatedAt:              timePtr(row.LatestEditDatetime),
		CreatedAt:              row.CreatedDatetime.Time,
		Tags:                   []Tag{},
		CommentCount:           int(row.CommentCount),
		LikeCount:              int(row.LikeCount),
		ShouldSendNotification: row.ShouldSendNotification.Bool,
		NotificationText:       textPtr(row.NotificationText),
		ScheduledID:            textPtr(row.ScheduledID),
		Author: Author{
			ID:   uuidStr(row.AuthorID),
			Type: stringOr(textPtr(row.AuthorType), "Member"),
			Member: Member{
				ID:          uuidStr(row.MemberID),
				StudentID:   textPtr(row.MemberStudentID),
				FirstName:   textPtr(row.MemberFirstName),
				LastName:    textPtr(row.MemberLastName),
				Nickname:    textPtr(row.MemberNickname),
				PicturePath: textPtr(row.MemberPicturePath),
			},
		},
	}

	if row.PositionID.Valid {
		nameSv := stringOr(textPtr(row.PositionNameSv), "")
		nameEn := textPtr(row.PositionNameEn)
		summary.Author.Position = &Position{
			ID:     row.PositionID.String,
			Name:   resolveName(nameSv, nameEn, loc),
			NameSv: nameSv,
			NameEn: nameEn,
		}
	}

	if row.CustomAuthorID.Valid {
		nameSv := stringOr(textPtr(row.CustomAuthorNameSv), "")
		nameEn := textPtr(row.CustomAuthorNameEn)
		summary.Author.CustomAuthor = &CustomAuthor{
			ID:       uuidStr(row.CustomAuthorID),
			Name:     resolveName(nameSv, nameEn, loc),
			NameSv:   nameSv,
			NameEn:   nameEn,
			ImageURL: textPtr(row.CustomAuthorImageUrl),
		}
	}

	if row.CommitteeID.Valid {
		nameSv := stringOr(textPtr(row.CommitteeNameSv), "")
		nameEn := textPtr(row.CommitteeNameEn)
		summary.Committee = &Committee{
			ID:        uuidStr(row.CommitteeID),
			Name:      resolveName(nameSv, nameEn, loc),
			NameSv:    nameSv,
			NameEn:    nameEn,
			ShortName: textPtr(row.CommitteeShortName),
			SymbolURL: textPtr(row.CommitteeSymbolUrl),
		}
	}

	return summary
}

func stringOr(s *string, fallback string) string {
	if s == nil {
		return fallback
	}
	return *s
}
