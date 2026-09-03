// Mirrors backend/internal/notifications.SettingType/AllSettingTypes - the
// coarser, user-facing subscription toggles shown on /settings. Kept as a
// small frontend-local list rather than derived from the Go schema, since
// Go doesn't expose an enum-listing endpoint for this (it's a fixed set of
// Go consts, not a DB-backed enumerable value) - see backend/CLAUDE.md's
// "Notifications routes" section.
export enum NotificationSettingType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  NEW_ARTICLE = "NEW_ARTICLE",
  EVENT_GOING = "EVENT_GOING",
  CREATE_MANDATE = "CREATE_MANDATE",
  BOOKING_REQUEST = "BOOKING_REQUEST",
  PING = "PING",
}
