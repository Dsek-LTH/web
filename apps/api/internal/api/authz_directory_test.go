package api

import (
	"context"
	"net/http"
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
	e.check(t, []accessCase{{
		e.as(1, apinames.AccessPolicyDelete), http.MethodDelete, "/access-policies/" + id, nil,
		hidden,
	}})
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
	// A group's members and anyone's phadder role name members, so they
	// are for signed-in members only, like the member directory.
	for _, p := range []string{path, "/members/" + e.members[4].StudentID + "/phadder-role"} {
		e.check(t, []accessCase{
			{anonymous, http.MethodGet, p, nil, denied},
			{e.as(1), http.MethodGet, p, nil, ok},
		})
	}
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

// A member picks their own phadder group, and a manager anyone's, but only
// among the current season's groups.
func TestMemberPhadderGroupAccess(t *testing.T) {
	e := requireDB(t)
	now := time.Now()
	// A season running right now and one that's over, each with a group.
	current := e.one(t, `INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
		VALUES ($1, $2, $2, $3) RETURNING id::text`,
		now.Year()+10, now.Add(-time.Hour), now.Add(time.Hour))
	past := e.one(t, `INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
		VALUES ($1, $2, $2, $3) RETURNING id::text`,
		now.Year()+11, now.AddDate(0, 0, -30), now.AddDate(0, 0, -20))
	group := e.one(t, `INSERT INTO phadder_groups (name, season_id)
		VALUES ('Current authz group', $1) RETURNING id::text`, current)
	oldGroup := e.one(t, `INSERT INTO phadder_groups (name, season_id)
		VALUES ('Past authz group', $1) RETURNING id::text`, past)
	t.Cleanup(func() {
		// The running season would hide staben from the other tests.
		_, err := e.pool.Exec(context.Background(),
			`DELETE FROM phadder_groups WHERE season_id IN ($1, $2)`, current, past)
		if err == nil {
			_, err = e.pool.Exec(context.Background(),
				`DELETE FROM nollning_seasons WHERE id IN ($1, $2)`, current, past)
		}
		if err != nil {
			t.Errorf("clean up seasons: %v", err)
		}
	})

	self := e.members[2].StudentID
	path := "/members/" + self + "/phadder-group"
	join := map[string]any{"groupId": group}
	leave := map[string]any{}
	groupOf := func() string {
		return e.one(t, `SELECT coalesce(nollning_group_id::text, '') FROM members
			WHERE student_id = $1`, self)
	}

	e.check(t, []accessCase{
		{anonymous, http.MethodPut, path, join, denied},
		{e.as(1), http.MethodPut, path, join, denied},
		{e.as(1, apinames.MemberUpdate), http.MethodPut, path, join, denied},
		{e.as(2), http.MethodPut, path, join, ok},
	})
	if got := groupOf(); got != group {
		t.Errorf("after joining: group %q, want %q", got, group)
	}

	// The group is on the profile for those who may change it.
	for _, c := range []struct {
		as   caller
		want bool
	}{
		{e.as(1), false},
		{e.as(1, apinames.MemberUpdate), false},
		{e.as(1, apinames.NollningPhadderGroupsManage), true},
		{e.as(2), true},
	} {
		var profile map[string]any
		e.mustCall(t, c.as, http.MethodGet, "/members/"+self, nil).decode(t, &profile)
		if _, has := profile["nollningGroupId"]; has != c.want {
			t.Errorf("GET /members/%s as %s: nollningGroupId %v, want %v",
				self, c.as.label, has, c.want)
		}
	}

	// Last season's group can't be picked, even by a manager.
	res := e.call(t, e.as(2), http.MethodPut, path, map[string]any{"groupId": oldGroup})
	if res.status != http.StatusUnprocessableEntity {
		t.Errorf("joining a past season's group: got %d, want 422", res.status)
	}
	res = e.call(t, e.as(1, apinames.NollningPhadderGroupsManage), http.MethodPut, path,
		map[string]any{"groupId": oldGroup})
	if res.status != http.StatusUnprocessableEntity {
		t.Errorf("a manager joining a past season's group: got %d, want 422", res.status)
	}

	e.check(t, []accessCase{
		{e.as(1, apinames.NollningPhadderGroupsManage), http.MethodPut, path, leave, ok},
	})
	if got := groupOf(); got != "" {
		t.Errorf("after leaving: group %q, want none", got)
	}
	e.check(t, []accessCase{
		{e.as(2), http.MethodPut, path, join, ok},
		{e.as(2), http.MethodPut, path, leave, ok},
	})
}

// TestNollningValidation: bad season and phadder-group input answers 4xx,
// not the 500 a foreign key, unique or ordering violation used to give.
func TestNollningValidation(t *testing.T) {
	e := requireDB(t)
	year := time.Now().Year() + 7
	start := time.Date(year, 8, 1, 0, 0, 0, 0, time.UTC)
	season := func(year int, start time.Time) map[string]any {
		return map[string]any{
			"year": year, "nollaStartAt": start, "revealAt": start.AddDate(0, 0, 20),
			"endAt": start.AddDate(0, 2, 0), "organizingCommitteeId": nil,
		}
	}
	expect := func(method, path string, body any, want int) {
		t.Helper()
		if res := e.call(t, e.admin(), method, path, body); res.status != want {
			t.Errorf("%s %s: got %d %s, want %d", method, path, res.status, res.body, want)
		}
	}

	e.mustCall(t, e.admin(), http.MethodPost, "/nollning/seasons", season(year, start))
	seasonID := e.one(t, `SELECT id::text FROM nollning_seasons WHERE year = $1`, year)

	// Same year again: 409.
	expect(http.MethodPost, "/nollning/seasons", season(year, start.AddDate(1, 0, 0)), 409)
	// Overlapping another season: 422.
	expect(http.MethodPost, "/nollning/seasons", season(year+1, start.AddDate(0, 1, 0)), 422)
	// Dates out of order: 422.
	backwards := season(year+1, start.AddDate(1, 0, 0))
	backwards["revealAt"] = start.AddDate(0, 11, 0)
	expect(http.MethodPost, "/nollning/seasons", backwards, 422)
	backwards = season(year+1, start.AddDate(1, 0, 0))
	backwards["endAt"] = start.AddDate(1, 0, 10)
	expect(http.MethodPost, "/nollning/seasons", backwards, 422)
	// Unknown organizing committee: 422.
	unknownCommittee := season(year+1, start.AddDate(1, 0, 0))
	unknownCommittee["organizingCommitteeId"] = "00000000-0000-0000-0000-000000000000"
	expect(http.MethodPost, "/nollning/seasons", unknownCommittee, 422)
	// Updating a season keeps its own year and window without conflicting
	// with itself; an unknown season is 404.
	expect(http.MethodPut, "/nollning/seasons/"+seasonID, season(year, start), 200)
	expect(http.MethodPut, "/nollning/seasons/00000000-0000-0000-0000-000000000000",
		season(year+1, start.AddDate(1, 0, 0)), 404)

	group := map[string]any{
		"name": "Validation group", "description": nil, "imageUrl": nil,
		"seasonId": "00000000-0000-0000-0000-000000000000",
	}
	// Unknown season: 422 on create and update.
	expect(http.MethodPost, "/nollning/phadder-groups", group, 422)
	group["seasonId"] = seasonID
	e.mustCall(t, e.admin(), http.MethodPost, "/nollning/phadder-groups", group)
	path := "/nollning/phadder-groups/" + e.one(t,
		`SELECT id::text FROM phadder_groups WHERE name = 'Validation group'`)
	group["seasonId"] = "00000000-0000-0000-0000-000000000000"
	expect(http.MethodPut, path, group, 422)
	// Unknown group: 404.
	nolla := map[string]any{"studentIds": []string{e.members[4].StudentID}}
	expect(http.MethodPost,
		"/nollning/phadder-groups/00000000-0000-0000-0000-000000000000/nollor", nolla, 404)
	e.mustCall(t, e.admin(), http.MethodDelete, path, nil)
}
