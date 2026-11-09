package api

import (
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
)

func articleBody(header string, publishedAt *time.Time) map[string]any {
	return map[string]any{
		"headerSv": header, "headerEn": nil, "bodySv": "<p>Text</p>", "bodyEn": nil,
		"imageUrl": nil, "imageUrls": []string{}, "youtubeUrl": nil,
		"author": map[string]any{}, "tagIds": []string{}, "committeeId": nil,
		"publishedAt": publishedAt, "sendNotification": false, "notificationText": nil,
		"nollningSeasonId": nil,
	}
}

func TestArticleAccess(t *testing.T) {
	e := requireDB(t)
	past := time.Now().Add(-time.Hour)

	// Member 1 writes an article; only they or news:article:update may edit
	// it, and someone else saving it keeps member 1 as the author.
	e.check(t, e.gate(http.MethodPost, "/articles", articleBody("Authz article", &past), ok,
		apinames.NewsArticleCreate))
	slug := e.one(t, `SELECT slug FROM articles WHERE header_sv = 'Authz article'`)
	path := "/articles/" + slug
	e.check(t, []accessCase{
		{anonymous, http.MethodPut, path, articleBody("Authz article", &past), denied},
		{e.as(2), http.MethodPut, path, articleBody("Authz article", &past), denied},
		{e.as(1), http.MethodPut, path, articleBody("Authz article", &past), ok},
		{
			e.as(2, apinames.NewsArticleUpdate), http.MethodPut, path,
			articleBody("Authz article", &past), ok,
		},
		// Member 1 is still the author.
		{e.as(1), http.MethodPut, path, articleBody("Authz article", &past), ok},
	})

	// Likes and comments, as the signed-in member.
	e.check(t, e.gate(http.MethodPut, path+"/like", nil, ok, apinames.NewsArticleLike))
	e.check(t, e.gate(http.MethodDelete, path+"/like", nil, ok, apinames.NewsArticleLike))
	comment := map[string]any{"content": "A comment"}
	e.check(t, e.gate(http.MethodPost, path+"/comments", comment, ok, apinames.NewsArticleComment))
	commentID := e.one(t,
		`SELECT c.id::text FROM article_comments c JOIN articles a ON a.id = c.article_id
		 WHERE a.slug = $1 ORDER BY c.published DESC LIMIT 1`, slug)
	e.check(t, []accessCase{
		{anonymous, http.MethodDelete, path + "/comments/" + commentID, nil, denied},
		{e.as(2), http.MethodDelete, path + "/comments/" + commentID, nil, denied},
		{e.as(1), http.MethodDelete, path + "/comments/" + commentID, nil, ok},
	})
	e.mustCall(t, e.as(3, apinames.NewsArticleComment), http.MethodPost, path+"/comments", comment)
	commentID = e.one(t,
		`SELECT c.id::text FROM article_comments c JOIN articles a ON a.id = c.article_id
		 WHERE a.slug = $1 ORDER BY c.published DESC LIMIT 1`, slug)
	e.check(t, []accessCase{
		{
			e.as(2, apinames.NewsArticleCommentDelete), http.MethodDelete,
			path + "/comments/" + commentID, nil, ok,
		},
	})

	// Deleting needs the policy; being the author isn't enough.
	e.check(t, []accessCase{
		{e.as(2), http.MethodDelete, path, nil, denied},
	})
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.NewsArticleDelete))

	// A deleted article is only shown to someone who may edit it.
	hidden := path + "?includeDeleted=true"
	e.check(t, []accessCase{
		{anonymous, http.MethodGet, path, nil, hiddenOutcome()},
		{anonymous, http.MethodGet, hidden, nil, hiddenOutcome()},
		{e.as(1), http.MethodGet, hidden, nil, ok},
		{e.as(2), http.MethodGet, hidden, nil, hiddenOutcome()},
		{e.as(4, apinames.NewsArticleUpdate), http.MethodGet, hidden, nil, ok},
	})

	// A scheduled article too, and its author may see it.
	future := time.Now().Add(48 * time.Hour)
	e.mustCall(t, e.as(1, apinames.NewsArticleCreate), http.MethodPost, "/articles",
		articleBody("Authz draft", &future))
	draft := "/articles/" + e.one(t, `SELECT slug FROM articles WHERE header_sv = 'Authz draft'`)
	e.check(t, []accessCase{
		{anonymous, http.MethodGet, draft, nil, hiddenOutcome()},
		{e.as(2), http.MethodGet, draft + "?includeUnpublished=true", nil, hiddenOutcome()},
		{e.as(1), http.MethodGet, draft + "?includeUnpublished=true", nil, ok},
	})

	// Images for articles and events, and tags.
	image := form{files: map[string][]formFile{"file": {pngFile}}}
	e.check(t, e.gate(http.MethodPost, "/images", image, ok, apinames.NewsArticleCreate))
	e.check(t, []accessCase{
		{e.as(1, apinames.EventCreate), http.MethodPost, "/images", image, ok},
		{e.as(1, apinames.EventUpdate), http.MethodPost, "/images", image, ok},
	})
	e.check(t, e.gate(http.MethodPost, "/tags", map[string]any{"nameSv": "Authz tag"}, ok,
		apinames.TagsCreate))
	tagID := e.one(t, `SELECT id::text FROM tags WHERE name_sv = 'Authz tag'`)
	e.check(t, e.gate(http.MethodPut, "/tags/"+tagID, map[string]any{"nameSv": "Authz tag 2"}, ok,
		apinames.TagsUpdate))
}

// hiddenOutcome is how a hidden article or event answers: as if it didn't
// exist.
func hiddenOutcome() outcome { return hidden }

func eventBody(title string) map[string]any {
	start := time.Now().Add(48 * time.Hour).Truncate(time.Minute)
	return map[string]any{
		"titleSv": title, "titleEn": nil, "descriptionSv": "<p>Text</p>", "descriptionEn": nil,
		"shortDescriptionSv": nil, "shortDescriptionEn": nil, "link": nil, "location": nil,
		"organizer": "Authz", "imageUrl": nil, "startAt": start, "endAt": start.Add(time.Hour),
		"alarmActive": false, "isCancelled": false, "tagIds": []string{}, "committeeId": nil,
		"nollningSeasonId": nil,
	}
}

func TestEventAccess(t *testing.T) {
	e := requireDB(t)

	e.check(t, e.gate(http.MethodPost, "/events", eventBody("Authz event"), ok,
		apinames.EventCreate))
	slug := e.one(t, `SELECT slug FROM events WHERE title_sv = 'Authz event'`)
	path := "/events/" + slug
	e.check(t, []accessCase{
		{anonymous, http.MethodPut, path, eventBody("Authz event"), denied},
		{e.as(2), http.MethodPut, path, eventBody("Authz event"), denied},
		{e.as(1), http.MethodPut, path, eventBody("Authz event"), ok},
		{e.as(2, apinames.EventUpdate), http.MethodPut, path, eventBody("Authz event"), ok},
		// Unlike articles, editing doesn't make the editor the author.
		{e.as(1), http.MethodPut, path, eventBody("Authz event"), ok},
	})

	e.check(t, []accessCase{
		{
			anonymous,
			http.MethodPut,
			path + "/attendance",
			map[string]any{"status": "going"},
			denied,
		},
		{e.as(2), http.MethodPut, path + "/attendance", map[string]any{"status": "going"}, ok},
	})

	comment := map[string]any{"content": "A comment"}
	e.check(t, e.gate(http.MethodPost, path+"/comments", comment, ok, apinames.EventComment))
	commentID := e.one(t,
		`SELECT c.id::text FROM event_comments c JOIN events ev ON ev.id = c.event_id
		 WHERE ev.slug = $1 ORDER BY c.published DESC LIMIT 1`, slug)
	e.check(t, []accessCase{
		{anonymous, http.MethodDelete, path + "/comments/" + commentID, nil, denied},
		{e.as(2), http.MethodDelete, path + "/comments/" + commentID, nil, denied},
		{e.as(1), http.MethodDelete, path + "/comments/" + commentID, nil, ok},
	})
	e.mustCall(t, e.as(3, apinames.EventComment), http.MethodPost, path+"/comments", comment)
	commentID = e.one(t,
		`SELECT c.id::text FROM event_comments c JOIN events ev ON ev.id = c.event_id
		 WHERE ev.slug = $1 ORDER BY c.published DESC LIMIT 1`, slug)
	e.check(t, []accessCase{
		{
			e.as(2, apinames.EventCommentDelete), http.MethodDelete,
			path + "/comments/" + commentID, nil, ok,
		},
	})

	// Deleting needs event:delete, author or not.
	e.check(t, []accessCase{{e.as(1), http.MethodDelete, path, nil, denied}})
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.EventDelete))

	hiddenPath := path + "?includeDeleted=true"
	e.check(t, []accessCase{
		{anonymous, http.MethodGet, path, nil, hidden},
		{anonymous, http.MethodGet, hiddenPath, nil, hidden},
		{e.as(2), http.MethodGet, hiddenPath, nil, hidden},
		{e.as(1), http.MethodGet, hiddenPath, nil, ok},
		{e.as(4, apinames.EventUpdate), http.MethodGet, hiddenPath, nil, ok},
	})
}

// withRoles is c with these derived roles on top of "*" and "_".
func withRoles(c caller, roles ...string) caller {
	id := *c.identity
	id.Roles = append([]string{"*", "_"}, roles...)
	c.identity = &id
	c.label += " in " + strings.Join(roles, ", ")
	return c
}

// A custom author is only offered to, and usable by, members holding an
// active mandate for a position under one of its custom_author_roles
// (prefixes included) or with one of them among their session's roles,
// unless they may manage or edit articles; an edit keeps the article's
// current one.
func TestCustomAuthorAccess(t *testing.T) {
	e := requireDB(t)
	newAuthor := func(name, role string) string {
		id := e.one(t, `INSERT INTO custom_authors (name_sv) VALUES ($1) RETURNING id::text`, name)
		e.one(t, `INSERT INTO custom_author_roles (custom_author_id, role) VALUES ($1, $2)
			RETURNING id::text`, id, role)
		return id
	}
	board := newAuthor("Authz board", "dsek.authzca")
	other := newAuthor("Authz other", "dsek.authzother")
	group := newAuthor("Authz group", "dsek.authzgroup")
	ours := []string{board, other, group}

	// Member 1 holds a mandate today for a position under board's role.
	e.one(t, `INSERT INTO positions (id, name_sv) VALUES ('dsek.authzca.x', 'Authz x')
		RETURNING id`)
	mandate := e.one(t, `INSERT INTO mandates (member_id, position_id, start_date, end_date,
		last_synced) VALUES ($1, 'dsek.authzca.x', CURRENT_DATE - 1, CURRENT_DATE + 1, CURRENT_DATE)
		RETURNING id::text`, e.members[1].ID)

	byline := func(header, customID string) map[string]any {
		body := articleBody(header, nil)
		body["author"] = map[string]any{"customId": customID}
		return body
	}
	writer := e.as(1, apinames.NewsArticleCreate)
	// Member 3 has group's role only through the session (Authentik groups).
	grouped := withRoles(e.as(3, apinames.NewsArticleCreate), "dsek", "dsek.authzgroup")
	manager := e.as(2, apinames.NewsArticleCreate, apinames.NewsArticleManage)

	listed := func(c caller) []string {
		var authors []struct {
			ID string `json:"id"`
		}
		e.mustCall(t, c, http.MethodGet, "/custom-authors", nil).decode(t, &authors)
		var ids []string
		for _, a := range authors {
			if slices.Contains(ours, a.ID) {
				ids = append(ids, a.ID)
			}
		}
		slices.Sort(ids)
		return ids
	}
	sorted := func(ids ...string) []string {
		slices.Sort(ids)
		return ids
	}
	for _, c := range []struct {
		as   caller
		want []string
	}{
		{writer, []string{board}},
		{grouped, []string{group}},
		{e.as(4), nil},
		{anonymous, nil},
		{manager, sorted(board, other, group)},
	} {
		if got := listed(c.as); !slices.Equal(got, c.want) {
			t.Errorf("custom authors for %s: got %v, want %v", c.as.label, got, c.want)
		}
	}

	e.check(t, []accessCase{
		{writer, http.MethodPost, "/articles", byline("Authz board article", board), ok},
		{writer, http.MethodPost, "/articles", byline("Authz other article", other), denied},
		{grouped, http.MethodPost, "/articles", byline("Authz group article", group), ok},
		{grouped, http.MethodPost, "/articles", byline("Authz group article 2", board), denied},
		{manager, http.MethodPost, "/articles", byline("Authz managed article", other), ok},
	})

	// Once the mandate is gone, member 1 may keep the byline on their
	// article but not pick it again or switch to one they lack.
	e.one(t, `DELETE FROM mandates WHERE id = $1 RETURNING id::text`, mandate)
	path := "/articles/" + e.one(
		t,
		`SELECT slug FROM articles WHERE header_sv = 'Authz board article'`,
	)
	e.check(t, []accessCase{
		{writer, http.MethodPut, path, byline("Authz board article", board), ok},
		{writer, http.MethodPut, path, byline("Authz board article", other), denied},
		{writer, http.MethodPost, "/articles", byline("Authz board article 2", board), denied},
	})
}
