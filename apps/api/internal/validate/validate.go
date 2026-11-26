// Package validate holds the small input checks several domains share,
// the ones the old app's zod schemas made. Each returns nil or an error
// naming the field, for a domain to wrap in its own ErrInvalidInput.
package validate

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"unicode/utf8"
)

// MaxLen is the VARCHAR(255) most short text columns are.
const MaxLen = 255

// First returns the first non-nil error.
func First(errs ...error) error {
	for _, err := range errs {
		if err != nil {
			return err
		}
	}
	return nil
}

// Required fails for an empty or blank value.
func Required(field, value string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s is empty", field)
	}
	return nil
}

// Length fails when value has more than maxChars characters (not bytes:
// Postgres VARCHAR counts characters).
func Length(field, value string, maxChars int) error {
	if n := utf8.RuneCountInString(value); n > maxChars {
		return fmt.Errorf("%s is %d characters, at most %d are allowed", field, n, maxChars)
	}
	return nil
}

// LengthPtr is Length for an optional value.
func LengthPtr(field string, value *string, maxChars int) error {
	if value == nil {
		return nil
	}
	return Length(field, *value, maxChars)
}

var errNotYouTube = errors.New("not a YouTube video URL")

var videoIDPattern = regexp.MustCompile(`^[\w-]{11}$`)

var youtubePathPattern = regexp.MustCompile(`^/(?:embed|shorts|v|live|e)/([^/?#]+)`)

// YouTubeVideoID extracts the 11-character video id from any common
// YouTube URL shape, like the web app's getYoutubeVideoId
// (apps/web/src/lib/utils/youtube.ts), which embeds the video. Bare ids
// are accepted too.
func YouTubeVideoID(raw string) (string, error) {
	s := strings.TrimSpace(raw)
	if videoIDPattern.MatchString(s) {
		return s, nil
	}
	lower := strings.ToLower(s)
	if !strings.HasPrefix(lower, "http://") && !strings.HasPrefix(lower, "https://") {
		s = "https://" + s
	}
	u, err := url.Parse(s)
	if err != nil || u.Hostname() == "" {
		return "", errNotYouTube
	}
	host := strings.ToLower(u.Hostname())
	host = strings.TrimPrefix(strings.TrimPrefix(host, "www."), "m.")
	id := ""
	switch host {
	case "youtu.be":
		id, _, _ = strings.Cut(strings.TrimPrefix(u.Path, "/"), "/")
	case "youtube.com", "youtube-nocookie.com", "music.youtube.com":
		id = u.Query().Get("v")
		if !videoIDPattern.MatchString(id) {
			if m := youtubePathPattern.FindStringSubmatch(u.Path); m != nil {
				id = m[1]
			}
		}
	}
	if !videoIDPattern.MatchString(id) {
		return "", errNotYouTube
	}
	return id, nil
}

// YouTubeURL fails for a set value that isn't a YouTube video URL.
func YouTubeURL(field string, value *string) error {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil
	}
	if _, err := YouTubeVideoID(*value); err != nil {
		return fmt.Errorf("%s: %w", field, err)
	}
	return nil
}
