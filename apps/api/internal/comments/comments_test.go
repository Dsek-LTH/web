package comments

import (
	"errors"
	"strings"
	"testing"

	"github.com/dsek-lth/web/apps/api/internal/auth"
)

func TestNormalize(t *testing.T) {
	if got, err := Normalize("  hej  "); err != nil || got != "hej" {
		t.Fatalf("got %q, %v", got, err)
	}
	for _, bad := range []string{"", "   ", strings.Repeat("å", MaxLength+1)} {
		if _, err := Normalize(bad); !errors.Is(err, ErrInvalidContent) {
			t.Errorf("Normalize(%d chars) = %v, want ErrInvalidContent", len(bad), err)
		}
	}
	if _, err := Normalize(strings.Repeat("å", MaxLength)); err != nil {
		t.Errorf("max length rejected: %v", err)
	}
}

func TestCanDelete(t *testing.T) {
	author := &auth.Identity{MemberID: "a"}
	mod := &auth.Identity{MemberID: "m", Policies: []string{"x:delete"}}
	other := &auth.Identity{MemberID: "o"}
	anon := &auth.Identity{}
	cases := []struct {
		id   *auth.Identity
		want bool
	}{{author, true}, {mod, true}, {other, false}, {anon, false}, {nil, false}}
	for i, c := range cases {
		if got := CanDelete(c.id, "x:delete", "a"); got != c.want {
			t.Errorf("case %d: got %v, want %v", i, got, c.want)
		}
	}
}
