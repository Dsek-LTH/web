package members

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

var stockholm = mustLoadLocation("Europe/Stockholm")

func mustLoadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic(err)
	}
	return loc
}

// BirthdayOn reports whether someone born on birthDate has their birthday
// on now's date in Swedish time. A 29 February birthday falls on 1 March
// in other years.
func BirthdayOn(birthDate pgtype.Date, now time.Time) bool {
	if !birthDate.Valid {
		return false
	}
	today := now.In(stockholm)
	b := birthDate.Time
	birthday := time.Date(today.Year(), b.Month(), b.Day(), 0, 0, 0, 0, time.UTC)
	return birthday.Month() == today.Month() && birthday.Day() == today.Day()
}
