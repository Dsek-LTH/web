package cafe

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

func toOpeningHour(row db.Markdown, loc string) OpeningHour {
	return OpeningHour{
		Name:       row.Name,
		Markdown:   dbutil.ResolveName(row.MarkdownSv, dbutil.TextPtr(row.MarkdownEn), loc),
		MarkdownSv: row.MarkdownSv,
		MarkdownEn: dbutil.TextPtr(row.MarkdownEn),
	}
}

// shiftRow adapts the shared cafe_shifts-plus-worker column shape
// (ListCafeShiftsInRangeRow is currently the only query producing it, but
// keeping it a named adapter type matches the internal/booking/
// internal/committees precedent for joined rows over a plain inline
// struct literal at the call site).
type shiftRow struct {
	ID                pgtype.UUID
	Date              pgtype.Timestamp
	WorkerId          pgtype.UUID
	TimeSlot          db.TimeSlots
	WorkerMemberID    pgtype.UUID
	WorkerStudentID   pgtype.Text
	WorkerFirstName   pgtype.Text
	WorkerLastName    pgtype.Text
	WorkerNickname    pgtype.Text
	WorkerPicturePath pgtype.Text
}

func toShift(row shiftRow) Shift {
	return Shift{
		ID:       dbutil.UUIDStr(row.ID),
		Date:     row.Date.Time,
		TimeSlot: TimeSlot(row.TimeSlot),
		Worker: apitypes.Member{
			ID:          dbutil.UUIDStr(row.WorkerMemberID),
			StudentID:   dbutil.TextPtr(row.WorkerStudentID),
			FirstName:   dbutil.TextPtr(row.WorkerFirstName),
			LastName:    dbutil.TextPtr(row.WorkerLastName),
			Nickname:    dbutil.TextPtr(row.WorkerNickname),
			PicturePath: dbutil.TextPtr(row.WorkerPicturePath),
		},
	}
}

func toCiabatta(row db.CiabattaOfTheWeek) Ciabatta {
	return Ciabatta{
		ID:   dbutil.UUIDStr(row.ID),
		Year: row.Year,
		Week: row.Week,
		Name: row.Name,
	}
}
