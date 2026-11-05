package articles

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/backend/internal/dbutil"
	"github.com/dsek-lth/web/apps/backend/internal/integrations"
)

// An article's go-live announcement (in-app/push notification and Discord
// post) is sent once, when it goes live, tracked by articles.announced_at.
// A save that publishes right away announces immediately; a future-dated
// article is announced by AnnounceDue, which RunAnnouncementLoop calls
// every minute. This replaces the external scheduler-service.

// announceRetryWindow is how long after going live a failed announcement
// keeps being retried. Past it the article is marked as handled, so a
// broken webhook can't make the sweep retry forever.
const announceRetryWindow = time.Hour

// previousState is what an article looked like before an update - zero
// for a newly created one.
type previousState struct {
	publishedAt *time.Time
}

// syncNotifications announces a saved article if the save makes it live,
// with the rules upstream's #1401 settled on:
//   - an article that was already live never announces again, whatever the
//     edit (including moving it to a future time);
//   - with notifications wanted, a publish now announces right away -
//     including publishing a scheduled article early;
//   - a future publish waits for AnnounceDue.
//
// Announcing never fails the save: the article exists by then, and an
// error would only make the author submit again. announced reports
// whether the announcement went through.
func (s *Service) syncNotifications(
	ctx context.Context,
	slug, articleID, authorMemberID, authorID string,
	in ArticleInput,
	prev previousState,
) (announced bool, err error) {
	id, err := dbutil.ParseUUID(articleID)
	if err != nil {
		return false, fmt.Errorf("parse article id: %w", err)
	}

	now := time.Now()
	wasAlreadyLive := prev.publishedAt != nil && !prev.publishedAt.After(now)
	publishesNow := in.PublishedAt == nil || !in.PublishedAt.After(now)

	if wasAlreadyLive || (publishesNow && !in.ShouldSendNotification) {
		// Its moment to be announced has passed (or it doesn't want one);
		// make sure the sweep never picks it up later.
		if _, err := s.queries.ClaimArticleAnnouncement(ctx, id); err != nil {
			return false, fmt.Errorf("mark article announced: %w", err)
		}
		return true, nil
	}
	if !publishesNow {
		return true, nil
	}

	notification := integrations.ArticleNotification{
		ArticleID:      articleID,
		Slug:           slug,
		HeaderSv:       in.HeaderSv,
		BodySv:         in.BodySv,
		AuthorMemberID: authorMemberID,
		AuthorID:       authorID,
		TagIDs:         in.TagIDs,
	}
	if in.NotificationText != nil {
		notification.NotificationText = *in.NotificationText
	}
	return s.announce(ctx, id, notification), nil
}

// announce sends an article's announcement if nobody has yet: it claims
// announced_at first, so the sweep and a save racing for the same article
// announce it once. The notification and the Discord post are attempted
// independently; if either fails the claim is released so the sweep
// retries (the in-app send skips members who already have it, and Discord
// has its own once-only claim). Reports false only on a failed send.
func (s *Service) announce(
	ctx context.Context,
	id pgtype.UUID,
	notification integrations.ArticleNotification,
) bool {
	claimed, err := s.queries.ClaimArticleAnnouncement(ctx, id)
	if err != nil {
		slog.Error("articles: claim announcement", "slug", notification.Slug, "err", err)
		return false
	}
	if claimed == 0 {
		return true
	}

	ok := true
	if err := s.notifier.NotifyNewArticle(ctx, notification); err != nil {
		slog.Error("articles: notify subscribers", "slug", notification.Slug, "err", err)
		ok = false
	}
	if err := s.webhooker.NotifyNewArticle(ctx, notification); err != nil {
		slog.Error("articles: post to Discord", "slug", notification.Slug, "err", err)
		ok = false
	}
	if !ok {
		if err := s.queries.ReleaseArticleAnnouncement(context.WithoutCancel(ctx), id); err != nil {
			slog.Error(
				"articles: release announcement claim",
				"slug",
				notification.Slug,
				"err",
				err,
			)
		}
	}
	return ok
}

// AnnounceDue announces every article that has gone live since it was
// saved without being announced - typically a future-dated one whose time
// has come. Articles that don't want a notification, or that have kept
// failing past announceRetryWindow, are marked as handled without one.
func (s *Service) AnnounceDue(ctx context.Context) error {
	rows, err := s.queries.ListDueArticleAnnouncements(ctx)
	if err != nil {
		return fmt.Errorf("list due announcements: %w", err)
	}
	if len(rows) == 0 {
		return nil
	}

	ids := make([]pgtype.UUID, len(rows))
	for i, r := range rows {
		ids[i] = r.ID
	}
	tagRows, err := s.queries.ListTagsForArticles(ctx, ids)
	if err != nil {
		return fmt.Errorf("list tags: %w", err)
	}
	tagIDs := map[string][]string{}
	for _, t := range tagRows {
		articleID := dbutil.UUIDStr(t.ArticleID)
		tagIDs[articleID] = append(tagIDs[articleID], dbutil.UUIDStr(t.ID))
	}

	cutoff := time.Now().Add(-announceRetryWindow)
	for _, r := range rows {
		articleID := dbutil.UUIDStr(r.ID)
		if !r.ShouldSendNotification.Bool || r.PublishedDatetime.Time.Before(cutoff) {
			if r.ShouldSendNotification.Bool {
				slog.Warn("articles: giving up on announcing",
					"slug", r.Slug, "live_since", r.PublishedDatetime.Time)
			}
			if _, err := s.queries.ClaimArticleAnnouncement(ctx, r.ID); err != nil {
				return fmt.Errorf("mark %s announced: %w", r.Slug, err)
			}
			continue
		}
		s.announce(ctx, r.ID, integrations.ArticleNotification{
			ArticleID:        articleID,
			Slug:             r.Slug,
			HeaderSv:         r.HeaderSv,
			BodySv:           r.BodySv,
			NotificationText: r.NotificationText.String,
			AuthorMemberID:   dbutil.UUIDStr(r.AuthorMemberID),
			AuthorID:         dbutil.UUIDStr(r.AuthorID),
			TagIDs:           tagIDs[articleID],
		})
	}
	return nil
}

// RunAnnouncementLoop calls AnnounceDue now and then every interval until
// ctx is done - started from cmd/server, like the ticket offer sweep.
func (s *Service) RunAnnouncementLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		if err := s.AnnounceDue(ctx); err != nil {
			slog.Error("articles: announcement sweep", "err", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
