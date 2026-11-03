package search

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dsek-lth/web/backend/internal/auth"
)

// Expected values come from the old prismaIdToMeiliId, so existing
// Meilisearch document ids stay the same.
func TestMeiliID(t *testing.T) {
	cases := map[string]string{
		"dsek.infu.dwww":                       "ZHNlay5pbmZ1LmR3d3c",
		"dsek.km.mastare":                      "ZHNlay5rbS5tYXN0YXJl",
		"dsek.sexm.förman":                     "ZHNlay5zZXhtLmbDtnJtYW4",
		"c3f8a1e2-0b5d-4d7e-9a7a-1b2c3d4e5f60": "YzNmOGExZTItMGI1ZC00ZDdlLTlhN2EtMWIyYzNkNGU1ZjYw",
		"public/2024/S01/Kallelse.pdf":         "cHVibGljLzIwMjQvUzAxL0thbGxlbHNlLnBkZg",
	}
	for in, want := range cases {
		if got := meiliID(in); got != want {
			t.Errorf("meiliID(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestFilterContent(t *testing.T) {
	in := "Protokoll  \nD-SEKTIONEN INOM TLTH\n H \n\n\n\nPunkt 1 - D T L\n"
	want := "Protokoll\nPunkt 1\n"
	if got := filterContent(in); got != want {
		t.Errorf("filterContent = %q, want %q", got, want)
	}
}

func TestToHit(t *testing.T) {
	long := strings.Repeat("å", 80)
	raw := map[string]any{
		"_federation":          map[string]any{"indexUid": "articles"},
		"_rankingScoreDetails": map[string]any{},
		"headerSv":             "Rubrik",
		"headerEn":             "Header",
		"bodySv":               long,
		"slug":                 long,
		"author":               map[string]any{"firstName": "A"},
	}

	sv := toHit(raw, "sv")
	if sv.Type != "articles" {
		t.Fatalf("type = %q", sv.Type)
	}
	if _, ok := sv.Data["_federation"]; ok {
		t.Error("underscore fields should be dropped")
	}
	if _, ok := sv.Data["header"]; ok {
		t.Error("sv should not get resolved fields")
	}
	if got := sv.Data["bodySv"].(string); len([]rune(got)) != truncateAt {
		t.Errorf("bodySv has %d runes, want %d", len([]rune(got)), truncateAt)
	}
	if sv.Data["slug"] != long {
		t.Error("link attributes must not be truncated")
	}

	en := toHit(raw, "en")
	if en.Data["header"] != "Header" {
		t.Errorf("header = %v, want the English value", en.Data["header"])
	}
}

func TestToHitDropsNulls(t *testing.T) {
	raw := map[string]any{
		"_federation": map[string]any{"indexUid": "articles"},
		"headerSv":    "Rubrik",
		"headerEn":    nil,
		"header":      "Rubrik",
		"author":      map[string]any{"firstName": "A", "nickname": nil},
	}
	en := toHit(raw, "en")
	if _, ok := en.Data["headerEn"]; ok {
		t.Error("null fields should be dropped")
	}
	if en.Data["header"] != "Rubrik" {
		t.Errorf("header = %v; an unset English value must not replace it", en.Data["header"])
	}
	if _, ok := en.Data["author"].(map[string]any)["nickname"]; ok {
		t.Error("null fields in nested objects should be dropped")
	}
}

// fakeMeili answers /multi-search with no hits and records the request.
func fakeMeili(t *testing.T, got *multiSearchRequest) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(body, got); err != nil {
			t.Errorf("decode request: %v", err)
		}
		_, _ = w.Write([]byte(`{"hits":[]}`))
	}))
	t.Cleanup(srv.Close)
	return srv
}

func TestSearchLeavesOutMembersWhenSignedOut(t *testing.T) {
	var got multiSearchRequest
	s := &Service{meili: newMeiliClient(fakeMeili(t, &got).URL, "key")}

	// Signed out: only members was asked for, so Meilisearch isn't called.
	hits, err := s.Search(context.Background(), Query{Query: "x", Indexes: []string{IndexMembers}})
	if err != nil || len(hits) != 0 || got.Queries != nil {
		t.Fatalf(
			"signed-out members-only search: hits=%v err=%v queries=%v",
			hits,
			err,
			got.Queries,
		)
	}

	_, err = s.Search(context.Background(), Query{
		Query:   "x",
		Indexes: []string{IndexMembers, IndexSongs, IndexSongs},
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Queries) != 1 || got.Queries[0].IndexUID != IndexSongs {
		t.Errorf("signed-out queries = %+v, want songs only", got.Queries)
	}

	ctx := auth.ContextWithIdentity(context.Background(), &auth.Identity{MemberID: "m"})
	if _, err := s.Search(ctx, Query{Query: "x", Indexes: []string{IndexMembers}}); err != nil {
		t.Fatal(err)
	}
	if len(got.Queries) != 1 || got.Queries[0].IndexUID != IndexMembers {
		t.Errorf("signed-in queries = %+v, want members", got.Queries)
	}
	if got.Federation.Limit != 20 {
		t.Errorf("default limit = %d, want 20", got.Federation.Limit)
	}
}

func TestSearchRejectsUnknownIndex(t *testing.T) {
	s := &Service{meili: newMeiliClient("http://unused", "key")}
	_, err := s.Search(context.Background(), Query{Query: "x", Indexes: []string{"nope"}})
	if err == nil {
		t.Fatal("want an error for an unknown index")
	}
}
