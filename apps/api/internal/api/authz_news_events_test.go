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

// A custom author is only offered to, and usable by, members with one of
// its custom_author_roles (prefixes included), unless they may manage or
// edit articles; an edit keeps the article's current one.
func TestCustomAuthorAccess(t *testing.T) {
	e := requireDB(t)
	board := e.one(t,
		`INSERT INTO custom_authors (name_sv) VALUES ('Authz board') RETURNING id::text`)
	other := e.one(t,
		`INSERT INTO custom_authors (name_sv) VALUES ('Authz other') RETURNING id::text`)
	e.one(t, `INSERT INTO custom_author_roles (custom_author_id, role)
		VALUES ($1, 'dsek.authz'), ($2, 'dsek.other') RETURNING id::text`, board, other)

	byline := func(header, customID string) map[string]any {
		body := articleBody(header, nil)
		body["author"] = map[string]any{"customId": customID}
		return body
	}
	writer := withRoles(e.as(1, apinames.NewsArticleCreate), "dsek", "dsek.authz", "dsek.authz.x")

	listed := func(c caller) []string {
		var authors []struct {
			ID string `json:"id"`
		}
		e.mustCall(t, c, http.MethodGet, "/custom-authors", nil).decode(t, &authors)
		var ids []string
		for _, a := range authors {
			if a.ID == board || a.ID == other {
				ids = append(ids, a.ID)
			}
		}
		return ids
	}
	if got := listed(writer); !slices.Equal(got, []string{board}) {
		t.Errorf("custom authors for %s: got %v, want only %s", writer.label, got, board)
	}
	if got := listed(e.as(1)); len(got) != 0 {
		t.Errorf("custom authors for member 1 without roles: got %v, want none", got)
	}
	if got := listed(e.as(2, apinames.NewsArticleManage)); len(got) != 2 {
		t.Errorf("custom authors for an article manager: got %v, want both", got)
	}

	e.check(t, []accessCase{
		{writer, http.MethodPost, "/articles", byline("Authz board article", board), ok},
		{writer, http.MethodPost, "/articles", byline("Authz other article", other), denied},
		{
			e.as(2, apinames.NewsArticleCreate, apinames.NewsArticleManage), http.MethodPost,
			"/articles", byline("Authz managed article", other), ok,
		},
	})

	// Without the role any more, the author may keep the byline but not
	// switch to one they lack.
	path := "/articles/" + e.one(
		t,
		`SELECT slug FROM articles WHERE header_sv = 'Authz board article'`,
	)
	e.check(t, []accessCase{
		{e.as(1), http.MethodPut, path, byline("Authz board article", board), ok},
		{e.as(1), http.MethodPut, path, byline("Authz board article", other), denied},
	})
}
