package validate

import (
	"strings"
	"testing"
)

// Mostly the cases of apps/web/src/lib/utils/youtube.test.ts.
func TestYouTubeVideoID(t *testing.T) {
	const id = "dQw4w9WgXcQ"
	for _, in := range []string{
		id,
		"https://www.youtube.com/watch?v=" + id,
		"https://youtube.com/watch?v=" + id + "&t=42",
		"youtube.com/watch?v=" + id,
		"https://m.youtube.com/watch?v=" + id,
		"https://youtu.be/" + id,
		"https://youtu.be/" + id + "?si=abc",
		"https://www.youtube.com/shorts/" + id,
		"https://www.youtube.com/embed/" + id,
		"https://www.youtube-nocookie.com/embed/" + id,
		"https://www.youtube.com/live/" + id,
		"https://music.youtube.com/watch?v=" + id,
		"  https://youtu.be/" + id + "  ",
	} {
		if got, err := YouTubeVideoID(in); err != nil || got != id {
			t.Errorf("YouTubeVideoID(%q) = %q, %v; want %q", in, got, err, id)
		}
	}
	for _, in := range []string{
		"", "https://vimeo.com/123", "https://www.youtube.com/watch?v=short",
		"https://youtube.com/channel/abc", "not a url", "https://evil.com/watch?v=" + id,
	} {
		if got, err := YouTubeVideoID(in); err == nil {
			t.Errorf("YouTubeVideoID(%q) = %q, want an error", in, got)
		}
	}
}

func TestLength(t *testing.T) {
	if err := Length("x", strings.Repeat("å", MaxLen), MaxLen); err != nil {
		t.Errorf("255 å: %v", err)
	}
	if err := Length("x", strings.Repeat("å", MaxLen+1), MaxLen); err == nil {
		t.Error("256 å: want an error")
	}
	if err := Required("x", "  "); err == nil {
		t.Error("blank: want an error")
	}
}
