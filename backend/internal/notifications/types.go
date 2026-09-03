// Package notifications is the Phase 9 port of src/lib/utils/notifications/*
// (see ../../../DESIGN.md's roadmap, "9. Real notifications + Discord
// webhook") - in-app notifications, push (Expo), subscription settings, and
// (via notifier.go/webhook.go) the two integrations.Notifier/Webhooker
// implementations every other domain's mocked calls become real through.
package notifications

import "time"

// NotificationType is the internal, fine-grained event kind - mirrors
// src/lib/utils/notifications/types.ts's NotificationType enum exactly,
// including the members no call site in the old app ever actually
// triggered (Comment/EventComment/Mention/CreateMandate - kept for parity
// with SettingType's own unused toggles, not exercised by any Send call
// yet).
type NotificationType string

const (
	TypeNewsLike             NotificationType = "NEWS_LIKE"
	TypeEventLike            NotificationType = "EVENT_LIKE"
	TypeComment              NotificationType = "COMMENT"
	TypeEventComment         NotificationType = "EVENT_COMMENT"
	TypeArticleRequestUpdate NotificationType = "ARTICLE_REQUEST_UPDATE"
	TypeMention              NotificationType = "MENTION"
	TypeNewArticle           NotificationType = "NEW_ARTICLE"
	TypeEventGoing           NotificationType = "EVENT_GOING"
	TypeEventInterested      NotificationType = "EVENT_INTERESTED"
	TypeCreateMandate        NotificationType = "CREATE_MANDATE"
	TypeBookingRequest       NotificationType = "BOOKING_REQUEST"
	TypePing                 NotificationType = "PING"
)

// SettingType is the coarser, user-facing toggle shown in /settings -
// mirrors NotificationSettingType. alwaysOnSetting ("DEFAULT" in the old
// app) is a sentinel, not a real toggle: every member "has" it without a
// subscription_settings row at all.
type SettingType string

const (
	SettingLike           SettingType = "LIKE"
	SettingComment        SettingType = "COMMENT"
	SettingMention        SettingType = "MENTION"
	SettingNewArticle     SettingType = "NEW_ARTICLE"
	SettingEventGoing     SettingType = "EVENT_GOING"
	SettingCreateMandate  SettingType = "CREATE_MANDATE"
	SettingBookingRequest SettingType = "BOOKING_REQUEST"
	SettingPing           SettingType = "PING"

	alwaysOnSetting SettingType = "DEFAULT"
)

// AllSettingTypes drives the settings page's dynamic per-type form fields,
// mirroring Object.values(NotificationSettingType) in settings.remote.ts.
var AllSettingTypes = []SettingType{
	SettingLike, SettingComment, SettingMention, SettingNewArticle,
	SettingEventGoing, SettingCreateMandate, SettingBookingRequest, SettingPing,
}

// settingTypeFor is the reverse of SUBSCRIPTION_SETTINGS_MAP (a lookup by
// NotificationType instead of by SettingType, since Send always starts from
// a concrete NotificationType) - every NotificationType maps to exactly one
// SettingType in the old map, so this loses no information.
var settingTypeFor = map[NotificationType]SettingType{
	TypeNewsLike:             SettingLike,
	TypeEventLike:            SettingLike,
	TypeComment:              SettingComment,
	TypeEventComment:         SettingComment,
	TypeArticleRequestUpdate: SettingComment,
	TypeMention:              SettingMention,
	TypeNewArticle:           SettingNewArticle,
	TypeEventGoing:           SettingEventGoing,
	TypeEventInterested:      SettingEventGoing,
	TypeCreateMandate:        SettingCreateMandate,
	TypeBookingRequest:       SettingBookingRequest,
	TypePing:                 SettingPing,
}

// duplicateAllowedTypes mirrors DUPLICATE_ALLOWED_TYPES - these notification
// types may fire more than once for the same (type, link, fromAuthor) to
// the same member, unlike everything else which dedupes.
var duplicateAllowedTypes = map[NotificationType]bool{
	TypeCreateMandate:        true,
	TypeArticleRequestUpdate: true,
	TypeBookingRequest:       true,
}

// shouldMergeNotifications mirrors SHOULD_MERGE_NOTIFICATIONS exactly -
// whether same-(type,link) notifications collapse into one NotificationGroup
// in the bell/list view.
var shouldMergeNotifications = map[NotificationType]bool{
	TypeNewsLike:             true,
	TypeEventLike:            true,
	TypeComment:              false,
	TypeEventComment:         false,
	TypeArticleRequestUpdate: false,
	TypeMention:              true,
	TypeNewArticle:           false,
	TypeEventGoing:           true,
	TypeEventInterested:      true,
	TypeCreateMandate:        false,
	TypeBookingRequest:       false,
	TypePing:                 true,
}

// SettingDefault is one entry of DEFAULT_SUBSCRIPTION_SETTINGS/
// NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS.
type SettingDefault struct {
	Type SettingType
	Push bool
}

// DefaultSubscriptionSettings mirrors DEFAULT_SUBSCRIPTION_SETTINGS - the
// settings a normal (non-nolla) member is seeded with at creation.
var DefaultSubscriptionSettings = []SettingDefault{
	{Type: SettingLike, Push: false},
	{Type: SettingComment, Push: true},
	{Type: SettingMention, Push: true},
	{Type: SettingNewArticle, Push: true},
	{Type: SettingCreateMandate, Push: true},
	{Type: SettingBookingRequest, Push: true},
	{Type: SettingPing, Push: false},
}

// NollaDefaultSubscriptionSettings mirrors NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS
// - seeded instead of DefaultSubscriptionSettings while nollning is active
// (Phase != off), per Service.SeedDefaults.
var NollaDefaultSubscriptionSettings = []SettingDefault{
	{Type: SettingMention, Push: false},
	{Type: SettingNewArticle, Push: true},
	{Type: SettingPing, Push: false},
}

// NotificationAuthor is a notification's resolved sender, for display in
// the bell/list - Name is pre-resolved server-side (mirrors getAuthorName's
// "Member"/"Mandate" branches; the "Custom" branch is omitted, since no
// real call site ever sends a notification from a CustomAuthor byline),
// matching this project's "resolve once, serve resolved field" convention
// (Committee.description, Alert.message) rather than shipping raw parts
// for the frontend to recompute.
//
// Named NotificationAuthor, not Author, to avoid huma's "duplicate schema
// name" trap (internal/articles already registers its own bare "Author"
// type) - see backend/CLAUDE.md's huma gotcha note.
type NotificationAuthor struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	PictureURL *string `json:"pictureUrl,omitempty"`
}

// Group is one row of the notification bell/list - either a single
// notification or several merged ones (see group.go's mergeNotifications).
// ID is the most recent individual notification's id, matching the old
// TS's "...notifications[0]" spread.
type Group struct {
	ID            int32                `json:"id"`
	Title         string               `json:"title"`
	Message       string               `json:"message"`
	Type          string               `json:"type"`
	Link          string               `json:"link"`
	ReadAt        *time.Time           `json:"readAt,omitempty"`
	CreatedAt     time.Time            `json:"createdAt"`
	Authors       []NotificationAuthor `json:"authors"`
	IndividualIDs []int32              `json:"individualIds"`
}

// Settings is a member's full subscription-settings shape - GET/PUT
// /notification-settings, mirroring settingsLoad's return shape
// (subscriptions/pushSubscriptions/subscribedTags) minus the "tags" list
// itself (the caller already has GET /tags for that).
type Settings struct {
	Subscriptions     []SettingType `json:"subscriptions"`
	PushSubscriptions []SettingType `json:"pushSubscriptions"`
	SubscribedTagIDs  []string      `json:"subscribedTagIds"`
}
