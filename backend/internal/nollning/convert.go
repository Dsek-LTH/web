package nollning

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

func toSeason(row db.NollningSeason) Season {
	return Season{
		ID:                    dbutil.UUIDStr(row.ID),
		Year:                  int(row.Year),
		NollaStartAt:          row.NollaStartAt.Time,
		RevealAt:              row.RevealAt.Time,
		EndAt:                 row.EndAt.Time,
		OrganizingCommitteeID: dbutil.UUIDStrPtr(row.OrganizingCommitteeID),
	}
}

func toPhadderGroup(row db.PhadderGroup) PhadderGroup {
	return PhadderGroup{
		ID:          dbutil.UUIDStr(row.ID),
		Name:        row.Name,
		Description: dbutil.TextPtr(row.Description),
		ImageURL:    dbutil.TextPtr(row.ImageUrl),
		SeasonID:    dbutil.UUIDStr(row.SeasonID),
		CreatedAt:   row.CreatedAt.Time,
	}
}

// memberRow is the small subset of member columns every phadder-group
// membership query (ListNollorForGroup/ListPhaddrarForGroup) selects, in
// the same field order/types as both of those sqlc-generated row types -
// letting toMember accept either via a plain struct conversion instead of
// duplicating this literal at each call site (same adapter pattern as
// internal/committees/convert.go's committeeRow/positionRow).
type memberRow struct {
	ID          pgtype.UUID
	StudentID   pgtype.Text
	FirstName   pgtype.Text
	Nickname    pgtype.Text
	LastName    pgtype.Text
	PicturePath pgtype.Text
}

func toMember(row memberRow) apitypes.Member {
	return apitypes.Member{
		ID:          dbutil.UUIDStr(row.ID),
		StudentID:   dbutil.TextPtr(row.StudentID),
		FirstName:   dbutil.TextPtr(row.FirstName),
		LastName:    dbutil.TextPtr(row.LastName),
		Nickname:    dbutil.TextPtr(row.Nickname),
		PicturePath: dbutil.TextPtr(row.PicturePath),
	}
}
