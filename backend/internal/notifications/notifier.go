package notifications

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/integrations"
)

// RealNotifier implements integrations.Notifier for real, replacing
// MockNotifier - see DESIGN.md's Phase 9 entry. Each method mirrors one old
// TS sendNotification call site exactly (see backend/CLAUDE.md's
// "Notifications routes" section for the full call-site inventory);
// title/message text is synthesized here rather than passed in, matching
// how the mocked interface was already shaped (callers pass structured
// facts, not pre-rendered strings).
type RealNotifier struct {
	svc *Service
}

func NewRealNotifier(svc *Service) *RealNotifier {
	return &RealNotifier{svc: svc}
}

var _ integrations.Notifier = (*RealNotifier)(nil)

// NotifyNewArticle mirrors sendNewArticleNotification.
func (n *RealNotifier) NotifyNewArticle(
	ctx context.Context,
	a integrations.ArticleNotification,
) error {
	var tagIDs []pgtype.UUID
	var err error
	if len(a.TagIDs) > 0 {
		tagIDs, err = dbutil.ParseUUIDs(a.TagIDs)
		if err != nil {
			return invalidf("invalid tag id: %v", err)
		}
	}
	var memberIDs []string
	if len(tagIDs) > 0 {
		rows, err := n.svc.queries.ListMembersSubscribedToAnyTag(ctx, tagIDs)
		if err != nil {
			return fmt.Errorf("list tag-subscribed members: %w", err)
		}
		memberIDs = make([]string, len(rows))
		for i, id := range rows {
			memberIDs[i] = dbutil.UUIDStr(id)
		}
		if len(memberIDs) == 0 {
			return nil
		}
	} else {
		return nil
	}

	message := a.NotificationText
	if message == "" {
		message = stripToText(a.BodySv, 254)
	}

	params := SendParams{
		Title:     a.HeaderSv,
		Message:   message,
		Type:      TypeNewArticle,
		Link:      "/news/" + a.Slug,
		MemberIDs: memberIDs,
	}
	if a.AuthorID != "" {
		params.FromAuthorID = &a.AuthorID
	}
	return n.svc.Send(ctx, params)
}

// NotifyLike mirrors likesAction's sendNotification call.
func (n *RealNotifier) NotifyLike(ctx context.Context, l integrations.LikeNotification) error {
	likerName, err := n.svc.memberFullName(ctx, l.LikedByMemberID)
	if err != nil {
		return err
	}
	fromMemberID := l.LikedByMemberID
	return n.svc.Send(ctx, SendParams{
		Title:        l.HeaderSv,
		Message:      fmt.Sprintf("%s har gillat din nyhet", likerName),
		Type:         TypeNewsLike,
		Link:         "/news/" + l.Slug,
		MemberIDs:    []string{l.ArticleAuthorMemberID},
		FromMemberID: &fromMemberID,
	})
}

// NotifyNewBookingRequest mirrors sendNotificationToKM.
//
// Accepted deviation, not replicated: the old app always used the
// bookable's English name (bookable.nameEn) in this message regardless of
// anyone's locale; BookingRequestNotification.BookableNames carries the
// already-resolved (locale-aware) name instead, since booking.Service has
// no reason to track both variants just for this one English-only string.
func (n *RealNotifier) NotifyNewBookingRequest(
	ctx context.Context,
	b integrations.BookingRequestNotification,
) error {
	requesterName, err := n.svc.memberPlainName(ctx, b.RequesterMemberID)
	if err != nil {
		return err
	}
	return n.svc.Send(ctx, SendParams{
		Title: fmt.Sprintf("New booking request: %s", b.Event),
		Message: fmt.Sprintf(
			"%s wants to book '%s' from %s until %s.",
			requesterName, strings.Join(b.BookableNames, ", "),
			b.Start.Format("02/01 15:04"), b.End.Format("02/01 15:04"),
		),
		Type:      TypeBookingRequest,
		Link:      "/booking/admin/" + b.BookingRequestID,
		MemberIDs: []string{b.RecipientMemberID},
	})
}

// NotifyBookingRequestStatus mirrors performAction's sendNotification call.
func (n *RealNotifier) NotifyBookingRequestStatus(
	ctx context.Context,
	b integrations.BookingRequestNotification,
) error {
	return n.svc.Send(ctx, SendParams{
		Title:     fmt.Sprintf("Booking request %s", b.Status),
		Message:   fmt.Sprintf("Your booking request for %s has been %s", b.Event, b.Status),
		Type:      TypeBookingRequest,
		Link:      "/booking",
		MemberIDs: []string{b.RecipientMemberID},
	})
}

// NotifyEventGoing mirrors interestedGoing.ts's isGoing branch.
func (n *RealNotifier) NotifyEventGoing(
	ctx context.Context,
	e integrations.EventNotification,
) error {
	return n.notifyEventRSVP(ctx, e, TypeEventGoing, "kommer på ditt event.")
}

// NotifyEventInterested mirrors interestedGoing.ts's isInterested branch.
func (n *RealNotifier) NotifyEventInterested(
	ctx context.Context,
	e integrations.EventNotification,
) error {
	return n.notifyEventRSVP(ctx, e, TypeEventInterested, "är intresserad av ditt event.")
}

func (n *RealNotifier) notifyEventRSVP(
	ctx context.Context,
	e integrations.EventNotification,
	notifType NotificationType,
	suffix string,
) error {
	actorName, err := n.svc.memberFullName(ctx, e.ActingMemberID)
	if err != nil {
		return err
	}
	fromMemberID := e.ActingMemberID
	return n.svc.Send(ctx, SendParams{
		Title:        e.TitleSv,
		Message:      fmt.Sprintf("%s %s", actorName, suffix),
		Type:         notifType,
		Link:         "/events/" + e.Slug,
		MemberIDs:    []string{e.OrganizerMemberID},
		FromMemberID: &fromMemberID,
	})
}

// memberFullName resolves getFullName(member) for message text.
func (s *Service) memberFullName(ctx context.Context, memberID string) (string, error) {
	uuid, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return "", invalidf("invalid member id: %v", err)
	}
	row, err := s.queries.GetMemberNameForNotification(ctx, uuid)
	if err != nil {
		return "", fmt.Errorf("get member name: %w", err)
	}
	return fullName(
		dbutil.TextPtr(row.FirstName),
		dbutil.TextPtr(row.Nickname),
		dbutil.TextPtr(row.LastName),
	), nil
}

// memberPlainName mirrors sendNotificationToKM's `${booker.firstName}
// ${booker.lastName}` - deliberately not getFullName (no nickname
// formatting), matching that one call site's literal template exactly.
func (s *Service) memberPlainName(ctx context.Context, memberID string) (string, error) {
	uuid, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return "", invalidf("invalid member id: %v", err)
	}
	row, err := s.queries.GetMemberNameForNotification(ctx, uuid)
	if err != nil {
		return "", fmt.Errorf("get member name: %w", err)
	}
	first, last := "", ""
	if row.FirstName.Valid {
		first = row.FirstName.String
	}
	if row.LastName.Valid {
		last = row.LastName.String
	}
	return strings.TrimSpace(fmt.Sprintf("%s %s", first, last)), nil
}

// stripToText is a lightweight stand-in for markdownToTxt(...).slice(0,254):
// collapses newlines to spaces and truncates. Accepted simplification, not a
// full markdown-to-plaintext port - see DESIGN.md's Phase 9 entry.
func stripToText(s string, limit int) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > limit {
		return s[:limit]
	}
	return s
}
