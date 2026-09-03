package adminsettings

import "time"

// Setting is one admin_settings row - a generic operator key/value pair.
// value is nullable in the live table (see schema.sql) but every real
// caller (old and new) always sends a non-empty string, so it's exposed as
// a plain string here, empty when unset - matches the old
// prisma.adminSetting.findMany() shape closely enough that no caller
// distinguishes "" from null.
type Setting struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
