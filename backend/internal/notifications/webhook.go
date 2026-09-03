package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/integrations"
)

// nollningTagPrefix mirrors NOLLNING_TAG_PREFIX - articles tagged with this
// never get webhooked to Discord, same as the old app.
const nollningTagPrefix = "[NOLLNING]"

// RealWebhooker implements integrations.Webhooker for real, posting to
// Discord - a verbatim port of sendNewArticleWebhook (see
// src/lib/news/server/webhooks.ts, recovered from before articles was
// ported), including its config source: the admin_settings table's
// "discord_webhook_se"/"webhook_tags_se" keys (an admin-editable runtime
// setting, not an env var - see DESIGN.md's Phase 9 entry for why).
type RealWebhooker struct {
	svc *Service
}

func NewRealWebhooker(svc *Service) *RealWebhooker {
	return &RealWebhooker{svc: svc}
}

var _ integrations.Webhooker = (*RealWebhooker)(nil)

type discordPayload struct {
	Content *string        `json:"content"`
	Embeds  []discordEmbed `json:"embeds"`
}

type discordEmbed struct {
	Title       string        `json:"title"`
	Author      discordAuthor `json:"author"`
	URL         string        `json:"url"`
	Description string        `json:"description"`
	Color       *int          `json:"color,omitempty"`
	Footer      discordFooter `json:"footer"`
	Timestamp   string        `json:"timestamp"`
}

type discordAuthor struct {
	Name    string  `json:"name"`
	IconURL *string `json:"icon_url,omitempty"`
}

type discordFooter struct {
	Text string `json:"text"`
}

func (w *RealWebhooker) NotifyNewArticle(
	ctx context.Context,
	a integrations.ArticleNotification,
) error {
	var tags []struct {
		ID     string
		NameSv string
		NameEn *string
		Color  *string
	}
	if len(a.TagIDs) > 0 {
		tagUUIDs, err := dbutil.ParseUUIDs(a.TagIDs)
		if err != nil {
			return invalidf("invalid tag id: %v", err)
		}
		rows, err := w.svc.queries.ListTagsByIDs(ctx, tagUUIDs)
		if err != nil {
			return fmt.Errorf("list tags: %w", err)
		}
		for _, r := range rows {
			tags = append(tags, struct {
				ID     string
				NameSv string
				NameEn *string
				Color  *string
			}{
				ID: dbutil.UUIDStr(r.ID), NameSv: r.NameSv,
				NameEn: dbutil.TextPtr(r.NameEn), Color: dbutil.TextPtr(r.Color),
			})
		}
	}
	for _, t := range tags {
		if strings.HasPrefix(t.NameSv, nollningTagPrefix) {
			return nil
		}
	}

	settingRows, err := w.svc.queries.GetAdminSettings(
		ctx,
		[]string{"discord_webhook_se", "webhook_tags_se"},
	)
	if err != nil {
		return fmt.Errorf("get admin settings: %w", err)
	}
	settings := make(map[string]string, len(settingRows))
	for _, r := range settingRows {
		if r.Value.Valid {
			settings[r.Key] = r.Value.String
		}
	}
	webhookURL := settings["discord_webhook_se"]
	if webhookURL == "" {
		return nil
	}
	if tagFilter, ok := settings["webhook_tags_se"]; ok && tagFilter != "" {
		allowed := make(map[string]bool)
		for _, id := range strings.Split(tagFilter, ",") {
			allowed[id] = true
		}
		matched := false
		for _, id := range a.TagIDs {
			if allowed[id] {
				matched = true
				break
			}
		}
		if !matched {
			return nil
		}
	}

	var color *int
	var footer string
	if len(a.TagIDs) > 0 {
		firstTagID := a.TagIDs[0]
		for _, t := range tags {
			if t.ID != firstTagID {
				continue
			}
			footer = t.NameSv
			if t.Color != nil {
				if c, err := strconv.ParseInt(
					strings.TrimPrefix(*t.Color, "#"),
					16,
					64,
				); err == nil {
					ci := int(c)
					color = &ci
				}
			}
		}
	}

	authorName, iconURL := "", (*string)(nil)
	if a.AuthorID != "" {
		authorUUID, err := dbutil.ParseUUID(a.AuthorID)
		if err == nil {
			row, err := w.svc.queries.GetAuthorForNotification(ctx, authorUUID)
			if err == nil {
				first, last := "", ""
				if row.FirstName.Valid {
					first = row.FirstName.String
				}
				if row.LastName.Valid {
					last = row.LastName.String
				}
				authorName = strings.TrimSpace(fmt.Sprintf("%s %s", first, last))
				if row.PositionNameSv.Valid {
					authorName = fmt.Sprintf("%s | %s", authorName, row.PositionNameSv.String)
				}
				iconURL = dbutil.TextPtr(row.PicturePath)
			}
		}
	}

	var content *string
	if a.NotificationText != "" {
		content = &a.NotificationText
	}

	origin := getOriginOrDefault()
	payload := discordPayload{
		Content: content,
		Embeds: []discordEmbed{{
			Title:       a.HeaderSv,
			Author:      discordAuthor{Name: authorName, IconURL: iconURL},
			URL:         fmt.Sprintf("%s/news/%s", origin, a.Slug),
			Description: limitDescription(a.BodySv),
			Color:       color,
			Footer:      discordFooter{Text: footer},
			Timestamp:   time.Now().UTC().Format(time.RFC3339),
		}},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal discord payload: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build discord request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("notifications: discord webhook request failed: %v", err)
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		log.Printf("notifications: failed Discord webhook (%d)", resp.StatusCode)
	}
	return nil
}

// limitDescription mirrors webhooks.ts's limitDescription exactly,
// including its slightly redundant two-step truncation (replicated
// faithfully rather than "fixed" - see backend/CLAUDE.md's convention of
// leaving intentional-looking old-app behavior alone absent evidence it's a
// bug).
func limitDescription(text string) string {
	description := strings.ReplaceAll(text, "\n", " ")
	if len(description) > 256-3 {
		description = description[:256-3] + "..."
	}
	rows := strings.Split(description, "\n")
	if len(rows) > 4 {
		description = strings.Join(rows[:4], "\n") + "..."
	}
	return description
}

// getOriginOrDefault mirrors `process.env["ORIGIN"] ?? "http://localhost:5173"`.
func getOriginOrDefault() string {
	if origin := os.Getenv("ORIGIN"); origin != "" {
		return origin
	}
	return "http://localhost:5173"
}
