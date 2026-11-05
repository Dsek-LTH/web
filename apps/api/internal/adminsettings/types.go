package adminsettings

import "time"

// AdminSetting is one admin_settings row - a generic operator key/value pair.
// value is nullable in the live table (see schema.sql) but every real
// caller (old and new) always sends a non-empty string, so it's exposed as
// a plain string here, empty when unset - matches the old
// prisma.adminSetting.findMany() shape closely enough that no caller
// distinguishes "" from null.
type AdminSetting struct {
	Key       string    `json:"key"       doc:"E.g. discord_webhook_se."`
	Value     string    `json:"value"     doc:"Empty when unset."`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// AdminSettingInput is a setting's new value.
type AdminSettingInput struct {
	Value string `json:"value"`
}
