package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

// expoPushEndpoint is Expo's push API - no access token is required (the
// old app's `new Expo()` called it unauthenticated too, see
// src/lib/utils/notifications/push.ts), so this is a plain HTTP POST rather
// than a full SDK dependency.
const expoPushEndpoint = "https://exp.host/--/api/v2/push/send"

// expoChunkSize mirrors expo-server-sdk's own chunking limit.
const expoChunkSize = 100

type pushMessage struct {
	Token string
	Title string
	Body  string
	Link  string
	Badge int
}

type expoPushMessage struct {
	To        string         `json:"to"`
	Title     string         `json:"title"`
	Body      string         `json:"body"`
	ChannelID string         `json:"channelId"`
	Data      map[string]any `json:"data"`
	Sound     string         `json:"sound"`
	Priority  string         `json:"priority"`
	Badge     int            `json:"badge"`
}

// isExpoPushToken mirrors Expo.isExpoPushToken's shape check.
func isExpoPushToken(token string) bool {
	return strings.HasPrefix(token, "ExponentPushToken[") ||
		strings.HasPrefix(token, "ExpoPushToken[")
}

// sendPush mirrors sendPushNotifications: filters to valid-looking tokens,
// chunks, POSTs each chunk, best-effort (logs, never fails the caller -
// Send already committed the in-app Notification rows by the time this
// runs). Gated by pushMock, same "explicit opt-in to real" shape as
// AUTH_MOCK/STORAGE_MOCK - see Service's doc comment.
func (s *Service) sendPush(ctx context.Context, messages []pushMessage) {
	if s.pushMock {
		log.Printf(
			"notifications: mock push - pretending to send %d push message(s)",
			len(messages),
		)
		return
	}

	var payload []expoPushMessage
	for _, m := range messages {
		if !isExpoPushToken(m.Token) {
			continue
		}
		payload = append(payload, expoPushMessage{
			To: m.Token, Title: m.Title, Body: m.Body, ChannelID: "default",
			Data: map[string]any{"link": m.Link}, Sound: "default",
			Priority: "high", Badge: m.Badge,
		})
	}
	if len(payload) == 0 {
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	failed := 0
	for i := 0; i < len(payload); i += expoChunkSize {
		end := min(i+expoChunkSize, len(payload))
		chunk := payload[i:end]
		body, err := json.Marshal(chunk)
		if err != nil {
			log.Printf("notifications: marshal push chunk: %v", err)
			failed += len(chunk)
			continue
		}
		req, err := http.NewRequestWithContext(
			ctx,
			http.MethodPost,
			expoPushEndpoint,
			bytes.NewReader(body),
		)
		if err != nil {
			log.Printf("notifications: build push request: %v", err)
			failed += len(chunk)
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("notifications: send push chunk: %v", err)
			failed += len(chunk)
			continue
		}
		resp.Body.Close()
		if resp.StatusCode >= 300 {
			log.Printf("notifications: push chunk failed with status %d", resp.StatusCode)
			failed += len(chunk)
		}
	}
	if failed == len(payload) {
		log.Printf("notifications: all %d push message(s) failed to send", len(payload))
	} else if failed > 0 {
		log.Printf("notifications: %d/%d push message(s) failed to send", failed, len(payload))
	}
}
