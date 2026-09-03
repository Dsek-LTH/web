package notifications

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
	"github.com/dsek-lth/web/backend/internal/nollning"
)

var (
	ErrNotFound     = errors.New("notifications: not found")
	ErrInvalidInput = errors.New("notifications: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

func toInt4(id *int32) pgtype.Int4 {
	if id == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *id, Valid: true}
}

// Service is the notifications domain/service layer: in-app notifications,
// subscription settings, and Send (the core primitive articles/events/
// booking's real Notifier - see notifier.go - all funnel through, mirroring
// src/lib/utils/notifications/index.ts's sendNotification).
type Service struct {
	queries  *db.Queries
	nollning *nollning.Service
	pushMock bool
}

// pushMock gates only the actual Expo network call (see push.go), never the
// in-app Notification rows - matching the old app's own "web notifications
// always created, push is the part that no-ops in dev" split. Default true
// (mock/no-op) unless PUSH_MOCK=false is set explicitly, mirroring AUTH_MOCK/
// STORAGE_MOCK's "opt-in to real, loud either way" shape - see main.go.
func NewService(dbtx db.DBTX, nollningSvc *nollning.Service, pushMock bool) *Service {
	return &Service{queries: db.New(dbtx), nollning: nollningSvc, pushMock: pushMock}
}

// SendParams mirrors SendNotificationProps. MemberIDs narrows the audience
// (e.g. "just this article's tag-subscribers") on top of the subscription-
// setting filter every send already applies; nil/empty means "everyone
// subscribed to Type's setting". Exactly one of FromAuthorID/FromMemberID
// should be set, or neither for a "from the system" notification.
type SendParams struct {
	Title, Message string
	Type           NotificationType
	Link           string
	MemberIDs      []string
	FromAuthorID   *string
	FromMemberID   *string
}

// Send mirrors sendNotification: resolves the sending author, computes the
// receiving member set (subscription setting + optional MemberIDs
// intersection + dedup-unless-allowed + self-exclusion), creates one
// Notification row per recipient, then best-effort pushes to whichever of
// them have push enabled for Type's setting.
//
// Accepted simplification, not replicated: the old app skipped
// self-exclusion when NODE_ENV=development, purely a manual-testing
// convenience with no bearing on production semantics - Send always
// excludes the sender here.
func (s *Service) Send(ctx context.Context, p SendParams) error {
	settingType, ok := settingTypeFor[p.Type]
	if !ok {
		return fmt.Errorf("%w: unknown notification type %q", ErrInvalidInput, p.Type)
	}

	var fromAuthorID pgtype.UUID
	switch {
	case p.FromAuthorID != nil:
		id, err := dbutil.ParseUUID(*p.FromAuthorID)
		if err != nil {
			return invalidf("invalid author id: %v", err)
		}
		fromAuthorID = id
	case p.FromMemberID != nil:
		id, err := s.resolveSelfAuthor(ctx, *p.FromMemberID)
		if err != nil {
			return err
		}
		fromAuthorID = id
	}

	var candidateIDs []pgtype.UUID
	if len(p.MemberIDs) > 0 {
		ids, err := dbutil.ParseUUIDs(p.MemberIDs)
		if err != nil {
			return invalidf("invalid member id: %v", err)
		}
		if len(ids) == 0 {
			return nil
		}
		candidateIDs = ids
	}

	var excludeMemberID pgtype.UUID
	if p.FromMemberID != nil {
		id, err := dbutil.ParseUUID(*p.FromMemberID)
		if err != nil {
			return invalidf("invalid from member id: %v", err)
		}
		excludeMemberID = id
	}

	var fromAuthorIDArg pgtype.UUID
	if fromAuthorID.Valid {
		fromAuthorIDArg = fromAuthorID
	}

	var recipientIDs []pgtype.UUID
	var err error
	if settingType == alwaysOnSetting {
		recipientIDs, err = s.queries.ListAllMemberIDs(ctx, db.ListAllMemberIDsParams{
			CandidateIds:    candidateIDs,
			ExcludeMemberID: excludeMemberID,
		})
	} else {
		recipientIDs, err = s.queries.ListMembersWithSubscriptionSetting(
			ctx,
			db.ListMembersWithSubscriptionSettingParams{
				SettingType:     string(settingType),
				CandidateIds:    candidateIDs,
				ExcludeMemberID: excludeMemberID,
				AllowDuplicates: duplicateAllowedTypes[p.Type],
				NotifType:       string(p.Type),
				Link:            p.Link,
				FromAuthorID:    fromAuthorIDArg,
			},
		)
	}
	if err != nil {
		return fmt.Errorf("list recipients: %w", err)
	}
	if len(recipientIDs) == 0 {
		return nil
	}

	title, message := p.Title, p.Message
	if len(title) > 255 {
		title = title[:251] + "..."
	}
	if len(message) > 255 {
		message = message[:251] + "..."
	}

	if err := s.queries.CreateNotifications(ctx, db.CreateNotificationsParams{
		Title:        title,
		Message:      message,
		Type:         string(p.Type),
		Link:         p.Link,
		MemberIds:    recipientIDs,
		FromAuthorID: fromAuthorIDArg,
	}); err != nil {
		return fmt.Errorf("create notifications: %w", err)
	}

	pushEligible, err := s.queries.ListPushEnabledMemberIDs(ctx, db.ListPushEnabledMemberIDsParams{
		SettingType: string(settingType),
		MemberIds:   recipientIDs,
	})
	if err != nil {
		return fmt.Errorf("list push-enabled recipients: %w", err)
	}
	if len(pushEligible) == 0 {
		return nil
	}
	tokens, err := s.queries.ListExpoTokensWithUnreadCount(ctx, pushEligible)
	if err != nil {
		return fmt.Errorf("list expo tokens: %w", err)
	}
	if len(tokens) == 0 {
		return nil
	}
	msgs := make([]pushMessage, len(tokens))
	for i, t := range tokens {
		msgs[i] = pushMessage{
			Token: t.ExpoToken,
			Title: title,
			Body:  message,
			Link:  p.Link,
			Badge: int(t.UnreadCount),
		}
	}
	s.sendPush(ctx, msgs)
	return nil
}

// resolveSelfAuthor finds-or-creates the (member, nil, nil) "acting as
// themselves" Author row for memberID - mirrors sendNotification's
// fromMemberId branch (authorized_prisma_client's find-then-create), reusing
// the same FindAuthor/CreateAuthor queries internal/articles' resolveAuthor
// does.
func (s *Service) resolveSelfAuthor(ctx context.Context, memberID string) (pgtype.UUID, error) {
	memberUUID, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid member id: %v", err)
	}
	existing, err := s.queries.FindAuthor(ctx, db.FindAuthorParams{MemberID: memberUUID})
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return pgtype.UUID{}, fmt.Errorf("find author: %w", err)
	}
	created, err := s.queries.CreateAuthor(ctx, db.CreateAuthorParams{MemberID: memberUUID})
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("create author: %w", err)
	}
	return created, nil
}

// List returns the acting member's notifications, grouped - mirrors
// getMyGroupedNotifications. If nolla is true, mirrors
// getNollaGroupedNotifications instead: filtered to the current season's
// NollaStartAt cutoff (replacing the old hardcoded 2025-06-26 date) and to
// NEW_ARTICLE/`/nollning`-linked notifications; returns an empty list if no
// season is currently active, since "nolla notifications" has no meaning
// outside one.
func (s *Service) List(ctx context.Context, nolla bool) ([]Group, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}

	var rows []db.Notification
	if nolla {
		season, err := s.nollning.Current(ctx)
		if err != nil {
			return nil, fmt.Errorf("get current season: %w", err)
		}
		if season == nil {
			return []Group{}, nil
		}
		rows, err = s.queries.ListNollaNotificationsForMember(
			ctx,
			db.ListNollaNotificationsForMemberParams{
				MemberID: memberUUID,
				Since:    dbutil.ToTimestamptz(&season.NollaStartAt),
			},
		)
		if err != nil {
			return nil, fmt.Errorf("list nolla notifications: %w", err)
		}
	} else {
		rows, err = s.queries.ListNotificationsForMember(ctx, memberUUID)
		if err != nil {
			return nil, fmt.Errorf("list notifications: %w", err)
		}
	}

	authorCache := make(map[string]*NotificationAuthor)
	loc := locale.FromContext(ctx)
	raw := make([]rawNotification, len(rows))
	for i, r := range rows {
		var fromAuthor *NotificationAuthor
		if r.FromAuthorID.Valid {
			key := dbutil.UUIDStr(r.FromAuthorID)
			if cached, ok := authorCache[key]; ok {
				fromAuthor = cached
			} else {
				fromAuthor, err = s.resolveAuthorDisplay(ctx, r.FromAuthorID, loc)
				if err != nil {
					return nil, err
				}
				authorCache[key] = fromAuthor
			}
		}
		raw[i] = rawNotification{
			Group: Group{
				ID:        r.ID,
				Title:     r.Title,
				Message:   r.Message,
				Type:      r.Type,
				Link:      r.Link,
				ReadAt:    dbutil.TimePtr(r.ReadAt),
				CreatedAt: r.CreatedAt.Time,
			},
			fromAuthor: fromAuthor,
		}
	}
	return groupNotifications(raw), nil
}

func (s *Service) resolveAuthorDisplay(
	ctx context.Context,
	authorID pgtype.UUID,
	loc string,
) (*NotificationAuthor, error) {
	row, err := s.queries.GetAuthorForNotification(ctx, authorID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get author for notification: %w", err)
	}
	fullName := fullName(
		dbutil.TextPtr(row.FirstName),
		dbutil.TextPtr(row.Nickname),
		dbutil.TextPtr(row.LastName),
	)
	name := fullName
	if row.PositionNameSv.Valid {
		positionName := dbutil.ResolveName(
			row.PositionNameSv.String,
			dbutil.TextPtr(row.PositionNameEn),
			loc,
		)
		name = fmt.Sprintf("%s %s", positionName, fullName)
	}
	return &NotificationAuthor{
		ID:         dbutil.UUIDStr(row.ID),
		Name:       name,
		PictureURL: dbutil.TextPtr(row.PicturePath),
	}, nil
}

// fullName mirrors getFullName: `firstName "nickname" lastName` if a
// nickname is set (truncated to 60 chars, same as the old app), else
// `firstName lastName`, else whichever of the two is set, else "No name".
func fullName(firstName, nickname, lastName *string) string {
	nick := nickname
	if nick != nil && len(*nick) > 60 {
		truncated := (*nick)[:57] + "..."
		nick = &truncated
	}
	if nick != nil && *nick != "" {
		if firstName != nil && lastName != nil {
			return fmt.Sprintf("%s \"%s\" %s", *firstName, *nick, *lastName)
		}
		return fmt.Sprintf("\"%s\"", *nick)
	}
	if firstName != nil && lastName != nil {
		return fmt.Sprintf("%s %s", *firstName, *lastName)
	}
	if firstName != nil {
		return *firstName
	}
	if lastName != nil {
		return *lastName
	}
	return "No name"
}

// MarkRead mirrors the readNotifications/readAllNotifications actions - id
// and ids are mutually exclusive filters, both nil means "every unread
// notification".
func (s *Service) MarkRead(ctx context.Context, id *int32, ids []int32) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}
	return s.queries.MarkNotificationsRead(ctx, db.MarkNotificationsReadParams{
		MemberID: memberUUID,
		ID:       toInt4(id),
		Ids:      ids,
	})
}

// Delete mirrors deleteNotification/deleteAllNotifications - same
// id/ids/both-nil convention as MarkRead.
func (s *Service) Delete(ctx context.Context, id *int32, ids []int32) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}
	return s.queries.DeleteNotifications(ctx, db.DeleteNotificationsParams{
		MemberID: memberUUID,
		ID:       toInt4(id),
		Ids:      ids,
	})
}

// UpsertExpoToken mirrors uploadNotificationToken - the in-memory 7-day
// cache the old app used to skip redundant upserts isn't replicated (a
// pure perf micro-optimization, and the upsert itself is already cheap/
// idempotent).
func (s *Service) UpsertExpoToken(ctx context.Context, token string) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}
	return s.queries.UpsertExpoToken(ctx, db.UpsertExpoTokenParams{
		MemberID:  memberUUID,
		ExpoToken: token,
	})
}

// GetSettings mirrors settingsLoad's subscriptions/pushSubscriptions/
// subscribedTags shape.
func (s *Service) GetSettings(ctx context.Context) (*Settings, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}
	return s.getSettings(ctx, memberUUID)
}

func (s *Service) getSettings(ctx context.Context, memberUUID pgtype.UUID) (*Settings, error) {
	rows, err := s.queries.GetSubscriptionSettingsForMember(ctx, memberUUID)
	if err != nil {
		return nil, fmt.Errorf("get subscription settings: %w", err)
	}
	settings := &Settings{Subscriptions: []SettingType{}, PushSubscriptions: []SettingType{}}
	for _, r := range rows {
		settings.Subscriptions = append(settings.Subscriptions, SettingType(r.Type))
		if r.PushNotification {
			settings.PushSubscriptions = append(settings.PushSubscriptions, SettingType(r.Type))
		}
	}
	tagIDs, err := s.queries.GetSubscribedTagIDsForMember(ctx, memberUUID)
	if err != nil {
		return nil, fmt.Errorf("get subscribed tags: %w", err)
	}
	settings.SubscribedTagIDs = make([]string, len(tagIDs))
	for i, id := range tagIDs {
		settings.SubscribedTagIDs[i] = dbutil.UUIDStr(id)
	}
	return settings, nil
}

// PutSettings mirrors updateSettings/settingsActions.default: a full
// delete-then-recreate of the member's subscription_settings rows plus a
// full replace (`set`) of subscribedTags, in one write (not a real DB
// transaction across both, same as the old settings.remote.ts, which
// commits the subscription-settings transaction and the tag update as two
// separate statements too).
func (s *Service) PutSettings(ctx context.Context, in Settings) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	pushSet := make(map[SettingType]bool, len(in.PushSubscriptions))
	for _, t := range in.PushSubscriptions {
		pushSet[t] = true
	}
	if err := s.queries.ReplaceSubscriptionSettings(ctx, memberUUID); err != nil {
		return fmt.Errorf("clear subscription settings: %w", err)
	}
	for _, t := range in.Subscriptions {
		if err := s.queries.InsertSubscriptionSetting(ctx, db.InsertSubscriptionSettingParams{
			MemberID:         memberUUID,
			Type:             string(t),
			PushNotification: pushSet[t],
		}); err != nil {
			return fmt.Errorf("insert subscription setting: %w", err)
		}
	}

	tagIDs, err := dbutil.ParseUUIDs(in.SubscribedTagIDs)
	if err != nil {
		return invalidf("invalid tag id: %v", err)
	}
	if err := s.queries.ReplaceSubscribedTags(ctx, memberUUID); err != nil {
		return fmt.Errorf("clear subscribed tags: %w", err)
	}
	for _, tagID := range tagIDs {
		if err := s.queries.InsertSubscribedTag(ctx, db.InsertSubscribedTagParams{
			A: memberUUID,
			B: tagID,
		}); err != nil {
			return fmt.Errorf("insert subscribed tag: %w", err)
		}
	}
	return nil
}

// SeedDefaults gives a newly-created member its default subscription
// settings + default tag subscriptions - the permanent home for
// createMember()'s DEFAULT_SUBSCRIPTION_SETTINGS/
// NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS logic, called from wherever a Member
// row gets created (internal/auth's callback flow), gated on the current
// nollning phase rather than a hardcoded boolean AdminSetting read. Not
// identity-gated - this runs as part of member creation itself, before the
// new member has any session to authenticate with.
func (s *Service) SeedDefaults(ctx context.Context, memberID string) error {
	memberUUID, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	phase, err := s.nollning.Phase(ctx)
	if err != nil {
		return fmt.Errorf("get nollning phase: %w", err)
	}
	defaults := DefaultSubscriptionSettings
	nollaActive := phase != nollning.PhaseOff
	if nollaActive {
		defaults = NollaDefaultSubscriptionSettings
	}
	for _, d := range defaults {
		if err := s.queries.InsertSubscriptionSetting(ctx, db.InsertSubscriptionSettingParams{
			MemberID:         memberUUID,
			Type:             string(d.Type),
			PushNotification: d.Push,
		}); err != nil {
			return fmt.Errorf("insert default subscription setting: %w", err)
		}
	}

	var tagIDs []pgtype.UUID
	if nollaActive {
		tagIDs, err = s.queries.ListNollningTagIDs(ctx)
	} else {
		tagIDs, err = s.queries.ListDefaultTagIDs(ctx)
	}
	if err != nil {
		return fmt.Errorf("list default tags: %w", err)
	}
	for _, tagID := range tagIDs {
		if err := s.queries.InsertSubscribedTag(ctx, db.InsertSubscribedTagParams{
			A: memberUUID,
			B: tagID,
		}); err != nil {
			return fmt.Errorf("insert default tag subscription: %w", err)
		}
	}
	return nil
}
