package api

import (
	"context"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
)

func profileBody() map[string]any {
	return map[string]any{"firstName": "Test", "lastName": "Person", "birthDate": "2001-05-04"}
}

func TestMemberAccess(t *testing.T) {
	e := requireDB(t)
	self := e.members[2].StudentID
	path := "/members/" + self

	// Writes: the member themselves, or core:member:update.
	for _, op := range []struct {
		method, path string
		body         any
	}{
		{http.MethodPut, path, profileBody()},
		{http.MethodPut, path + "/food-preference", map[string]any{"foodPreference": "Vegan"}},
		{http.MethodPut, path + "/language", map[string]any{"language": "en"}},
		{http.MethodPut, path + "/picture", form{files: map[string][]formFile{"image": {pngFile}}}},
		{http.MethodDelete, path + "/picture", nil},
	} {
		e.check(t, []accessCase{
			{anonymous, op.method, op.path, op.body, denied},
			{e.as(1), op.method, op.path, op.body, denied},
			{e.as(2), op.method, op.path, op.body, ok},
			{e.as(1, apinames.MemberUpdate), op.method, op.path, op.body, ok},
		})
	}

	// Reads are for signed-in members.
	for _, p := range []string{"/members", path, "/medals", "/medals.csv"} {
		e.check(t, []accessCase{
			{anonymous, http.MethodGet, p, nil, denied},
			{e.as(1), http.MethodGet, p, nil, ok},
		})
	}

	// Email, birth date and food preference only for the member themselves
	// or with the policy that reveals them. The writes above left a food
	// preference set.
	for _, c := range []struct {
		as                caller
		email, born, food bool
	}{
		{e.as(1), false, false, false},
		{e.as(1, apinames.MemberSeeEmail), true, false, false},
		{e.as(1, apinames.MemberUser), false, true, false},
		{e.as(1, apinames.MemberUpdate), false, false, true},
		{e.as(2), true, true, true},
	} {
		var profile map[string]any
		e.mustCall(t, c.as, http.MethodGet, path, nil).decode(t, &profile)
		_, hasEmail := profile["email"]
		_, hasBirth := profile["birthDate"]
		_, hasFood := profile["foodPreference"]
		if hasEmail != c.email || hasBirth != c.born || hasFood != c.food {
			t.Errorf("GET %s as %s: email %v, birthDate %v, foodPreference %v; want %v, %v, %v",
				path, c.as.label, hasEmail, hasBirth, hasFood, c.email, c.born, c.food)
		}
	}

	// Birthdays on the home page need member:user.
	var none, some []map[string]any
	e.mustCall(t, e.as(1), http.MethodGet, "/members?birthdayToday=true", nil).decode(t, &none)
	if len(none) != 0 {
		t.Errorf("birthdays without member:user: got %d, want none", len(none))
	}
	e.mustCall(t, e.as(1, apinames.MemberUser), http.MethodGet, "/members?birthdayToday=true", nil).
		decode(t, &some)
	if len(some) == 0 {
		t.Errorf("birthdays with member:user: got none (the seed gives some members today)")
	}

	// Door access is only shown to the member themselves.
	var doors []any
	e.mustCall(t, e.as(1, apinames.DoorRead), http.MethodGet, path+"/door-access", nil).
		decode(t, &doors)
	if len(doors) != 0 {
		t.Errorf("someone else's door access: got %d entries, want none", len(doors))
	}

	e.check(t, e.gate(http.MethodPost, path+"/ping", nil, ok, apinames.MemberPing))
}

func TestCommitteeAccess(t *testing.T) {
	e := requireDB(t)
	shortName := e.one(
		t,
		`SELECT short_name FROM committees WHERE short_name IS NOT NULL ORDER BY short_name LIMIT 1`,
	)
	committee := "/committees/" + shortName
	e.check(
		t,
		e.gate(
			http.MethodPut,
			committee,
			map[string]any{"nameSv": "Authz", "isBannerTextLight": false},
			ok,
			apinames.CommitteeUpdate,
		),
	)
	markdown := map[string]any{"markdownSv": "Text"}
	e.check(t, e.gate(http.MethodPut, committee+"/about", markdown, ok, apinames.CommitteeUpdate))
	e.check(t, e.gate(http.MethodPut, committee+"/links", markdown, ok, apinames.CommitteeUpdate))

	position := "/positions/" + e.one(t, `SELECT id FROM positions ORDER BY id LIMIT 1`)
	e.check(t, e.gate(http.MethodPut, position,
		map[string]any{"nameSv": "Authz", "active": true, "boardMember": false}, ok,
		apinames.PositionUpdate))

	year := time.Now().Year()
	e.check(t, e.gate(http.MethodPost, position+"/mandates", map[string]any{
		"memberIds": []string{e.members[3].ID},
		"startDate": time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC).Format(time.DateOnly),
		"endDate":   time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC).Format(time.DateOnly),
	}, ok, apinames.MandateCreate))
	mandate := "/mandates/" + e.one(t,
		`SELECT id::text FROM mandates WHERE member_id = $1 AND position_id = $2`,
		e.members[3].ID, position[len("/positions/"):])
	e.check(t, e.gate(http.MethodPut, mandate, map[string]any{
		"startDate": time.Date(year, 2, 1, 0, 0, 0, 0, time.UTC).Format(time.DateOnly),
		"endDate":   time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC).Format(time.DateOnly),
	}, ok, apinames.MandateUpdate))
	e.check(t, e.gate(http.MethodDelete, mandate, nil, ok, apinames.MandateDelete))
}

func TestAccessPolicyAccess(t *testing.T) {
	e := requireDB(t)
	e.check(t, e.gate(http.MethodGet, "/access-policies", nil, ok, apinames.AccessPolicyRead))
	e.check(
		t,
		e.gate(http.MethodGet, "/access-policies/api-names", nil, ok, apinames.AccessPolicyRead),
	)
	e.check(t, e.gate(
		http.MethodPost,
		"/access-policies",
		map[string]any{
			"apiName": "authz:test",
			"role":    "dsek.authz",
		},
		ok,
		apinames.AccessPolicyCreate,
	))
	e.check(t, e.gate(
		http.MethodPost,
		"/access-policies/bulk",
		map[string]any{
			"apiName":    "authz:bulk",
			"roles":      []string{"dsek.authz"},
			"studentIds": []string{},
		},
		ok,
		apinames.AccessPolicyCreate,
	))
	id := e.one(t, `SELECT id::text FROM api_access_policies WHERE api_name = 'authz:test'`)
	e.check(
		t,
		e.gate(http.MethodDelete, "/access-policies/"+id, nil, ok, apinames.AccessPolicyDelete),
	)
}

func TestDoorAccess(t *testing.T) {
	e := requireDB(t)
	door := e.one(t, `SELECT name FROM doors ORDER BY name LIMIT 1`)
	path := "/doors/" + door + "/access-policies"
	e.check(t, e.gate(http.MethodGet, "/doors", nil, ok, apinames.DoorRead))
	e.check(t, e.gate(http.MethodGet, path, nil, ok, apinames.DoorRead))
	e.check(t, e.gate(
		http.MethodPost,
		path,
		map[string]any{
			"subject": "dsek",
			"type":    "role",
			"mode":    "allow",
		},
		ok,
		apinames.DoorCreate,
	))
	var policies []struct {
		ID   string `json:"id"`
		Role string `json:"role"`
	}
	e.mustCall(t, e.admin(), http.MethodGet, path, nil).decode(t, &policies)
	var id string
	for _, p := range policies {
		if p.Role == "dsek" {
			id = p.ID
		}
	}
	if id == "" {
		t.Fatalf("the new door policy isn't listed")
	}
	e.check(t, e.gate(http.MethodDelete, path+"/"+id, nil, ok, apinames.DoorDelete))
}

func TestNollningAccess(t *testing.T) {
	e := requireDB(t)
	year := time.Now().Year() + 5
	start := time.Date(year, 8, 1, 0, 0, 0, 0, time.UTC)
	season := map[string]any{
		"year": year, "nollaStartAt": start, "revealAt": start.AddDate(0, 0, 20),
		"endAt": start.AddDate(0, 2, 0), "organizingCommitteeId": nil,
	}
	e.check(
		t,
		e.gate(http.MethodPost, "/nollning/seasons", season, ok, apinames.NollningSeasonManage),
	)
	seasonID := e.one(t, `SELECT id::text FROM nollning_seasons WHERE year = $1`, year)
	e.check(t, e.gate(http.MethodPut, "/nollning/seasons/"+seasonID, season, ok,
		apinames.NollningSeasonManage))

	group := map[string]any{
		"name":        "Authz group",
		"description": nil,
		"imageUrl":    nil,
		"seasonId":    seasonID,
	}
	e.check(t, e.gate(http.MethodPost, "/nollning/phadder-groups", group, ok,
		apinames.NollningPhadderGroupsManage))
	path := "/nollning/phadder-groups/" + e.one(t,
		`SELECT id::text FROM phadder_groups WHERE name = 'Authz group'`)
	e.check(t, e.gate(http.MethodPut, path, group, ok, apinames.NollningPhadderGroupsManage))
	nolla := map[string]any{"studentIds": []string{e.members[4].StudentID}}
	e.check(t, e.gate(http.MethodPost, path+"/nollor", nolla, ok,
		apinames.NollningPhadderGroupsManage))
	e.check(t, e.gate(http.MethodDelete, path+"/nollor/"+e.members[4].StudentID, nil, ok,
		apinames.NollningPhadderGroupsManage))
	// Member 4 holds no phadder mandate, so adding them is refused - but
	// only after the policy check.
	e.check(t, e.gate(http.MethodPost, path+"/phaddrar", nolla, allowed,
		apinames.NollningPhadderGroupsManage))
	e.check(t, e.gate(http.MethodDelete, path+"/phaddrar/"+e.members[4].StudentID, nil, allowed,
		apinames.NollningPhadderGroupsManage))
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.NollningPhadderGroupsManage))
}

// TestStabenAccess: who holds staben's positions is hidden from callers
// without member:see_staben (everyone, during a season), except from the
// member themselves. Test callers get no injected policies, so a caller
// without it here is a caller during a season.
func TestStabenAccess(t *testing.T) {
	e := requireDB(t)
	ctx := context.Background()
	stab := e.members[3]
	const position = "dsek.noll.stab.authz"
	today := time.Now().UTC()
	if _, err := e.pool.Exec(ctx, `
		INSERT INTO positions (id, name_sv, committee_id, active, board_member)
		SELECT $1, 'Authz stab', id, true, false FROM committees WHERE short_name = 'nollu'`,
		position); err != nil {
		t.Fatal(err)
	}
	var mandateID string
	if err := e.pool.QueryRow(ctx, `
		INSERT INTO mandates (member_id, position_id, start_date, end_date, last_synced)
		VALUES ($1, $2, $3, $4, $3) RETURNING id::text`,
		stab.ID, position, today.AddDate(0, -1, 0), today.AddDate(0, 1, 0),
	).Scan(&mandateID); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = e.pool.Exec(ctx, `DELETE FROM articles WHERE header_sv LIKE 'Authz staben%'`)
		_, _ = e.pool.Exec(ctx, `DELETE FROM authors WHERE mandate_id = $1`, mandateID)
		_, _ = e.pool.Exec(ctx, `DELETE FROM mandates WHERE id = $1`, mandateID)
		_, _ = e.pool.Exec(ctx, `DELETE FROM positions WHERE id = $1`, position)
	})

	// Member 3 writes one article as the staben mandate and one as
	// themselves (hidden too, since they're in staben today).
	past := time.Now().Add(-time.Hour)
	asMandate := articleBody("Authz staben mandate", &past)
	asMandate["author"] = map[string]any{"mandateId": mandateID}
	writer := e.as(3, apinames.NewsArticleCreate)
	e.mustCall(t, writer, http.MethodPost, "/articles", asMandate)
	e.mustCall(t, writer, http.MethodPost, "/articles", articleBody("Authz staben member", &past))
	articles := []string{
		"/articles/" + e.one(
			t,
			`SELECT slug FROM articles WHERE header_sv = 'Authz staben mandate'`,
		),
		"/articles/" + e.one(
			t,
			`SELECT slug FROM articles WHERE header_sv = 'Authz staben member'`,
		),
	}

	// New-article notifications from both bylines, to the two members the
	// callers below are.
	for _, header := range []string{"Authz staben mandate", "Authz staben member"} {
		for _, to := range []string{e.members[1].ID, stab.ID} {
			if _, err := e.pool.Exec(ctx, `
				INSERT INTO notifications (title, message, type, link, member_id, from_author_id)
				SELECT header_sv, 'Text', 'NEW_ARTICLE', '/news/' || slug, $2, author_id
				FROM articles WHERE header_sv = $1`, header, to); err != nil {
				t.Fatal(err)
			}
		}
	}
	t.Cleanup(func() {
		_, _ = e.pool.Exec(ctx, `DELETE FROM notifications WHERE title LIKE 'Authz staben%'`)
	})

	year := today.Year()
	for _, c := range []struct {
		as   caller
		sees bool
	}{
		{e.as(1, apinames.MemberSeeEmail), false},
		{e.as(1, apinames.MemberSeeEmail, apinames.MemberSeeStaben), true},
		{e.as(3), true},
	} {
		var profile struct {
			Email    *string `json:"email"`
			Mandates []struct {
				ID string `json:"id"`
			} `json:"mandates"`
		}
		e.mustCall(t, c.as, http.MethodGet, "/members/"+stab.StudentID, nil).decode(t, &profile)
		if got := slices.ContainsFunc(profile.Mandates, func(m struct {
			ID string `json:"id"`
		},
		) bool {
			return m.ID == mandateID
		}); got != c.sees {
			t.Errorf("profile as %s: staben mandate shown %v, want %v", c.as.label, got, c.sees)
		}
		if got := profile.Email != nil; got != c.sees {
			t.Errorf("profile as %s: email shown %v, want %v", c.as.label, got, c.sees)
		}

		var detail struct {
			Mandates []struct {
				ID string `json:"id"`
			} `json:"mandates"`
		}
		e.mustCall(t, c.as, http.MethodGet, "/positions/"+position, nil).decode(t, &detail)
		if got := len(detail.Mandates) > 0; got != c.sees {
			t.Errorf("position as %s: mandates shown %v, want %v", c.as.label, got, c.sees)
		}

		var committee struct {
			Positions []struct {
				ID       string `json:"id"`
				Mandates []any  `json:"mandates"`
			} `json:"positions"`
		}
		e.mustCall(t, c.as, http.MethodGet, fmt.Sprintf("/committees/nollu?year=%d", year), nil).
			decode(t, &committee)
		shown := false
		for _, p := range committee.Positions {
			if p.ID == position {
				shown = len(p.Mandates) > 0
			}
		}
		if shown != c.sees {
			t.Errorf("nollu committee as %s: mandates shown %v, want %v", c.as.label, shown, c.sees)
		}

		for _, path := range articles {
			var article struct {
				Author struct {
					Member struct {
						ID string `json:"id"`
					} `json:"member"`
					Position *struct{} `json:"position"`
				} `json:"author"`
			}
			e.mustCall(t, c.as, http.MethodGet, path, nil).decode(t, &article)
			if got := article.Author.Member.ID == stab.ID; got != c.sees {
				t.Errorf("%s as %s: author shown %v, want %v", path, c.as.label, got, c.sees)
			}
			if !c.sees && article.Author.Position != nil {
				t.Errorf("%s as %s: staben position shown", path, c.as.label)
			}
		}

		var active []struct {
			ID string `json:"id"`
		}
		e.mustCall(t, c.as, http.MethodGet, "/members/"+stab.StudentID+"/mandates", nil).
			decode(t, &active)
		if got := slices.ContainsFunc(active, func(m struct {
			ID string `json:"id"`
		},
		) bool {
			return m.ID == mandateID
		}); got != c.sees {
			t.Errorf("active mandates as %s: staben mandate shown %v, want %v",
				c.as.label, got, c.sees)
		}

		var bell struct {
			Notifications []struct {
				Title   string `json:"title"`
				Authors []any  `json:"authors"`
			} `json:"notifications"`
		}
		e.mustCall(t, c.as, http.MethodGet, "/notifications?pageSize=50", nil).decode(t, &bell)
		found := 0
		for _, n := range bell.Notifications {
			if !strings.HasPrefix(n.Title, "Authz staben") {
				continue
			}
			found++
			if got := len(n.Authors) > 0; got != c.sees {
				t.Errorf("notification %q as %s: sender shown %v, want %v",
					n.Title, c.as.label, got, c.sees)
			}
		}
		if found != 2 {
			t.Errorf("notifications as %s: found %d of the test's, want 2", c.as.label, found)
		}

		var list struct {
			Articles []struct {
				Slug string `json:"slug"`
			} `json:"articles"`
		}
		e.mustCall(t, c.as, http.MethodGet,
			"/articles?pageSize=100&authorStudentId="+stab.StudentID, nil).decode(t, &list)
		listed := 0
		for _, a := range list.Articles {
			for _, path := range articles {
				if "/articles/"+a.Slug == path {
					listed++
				}
			}
		}
		if want := map[bool]int{true: 2, false: 0}[c.sees]; listed != want {
			t.Errorf("articles by member 3 as %s: %d of theirs listed, want %d",
				c.as.label, listed, want)
		}
	}
}
