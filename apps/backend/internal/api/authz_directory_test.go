package api

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/backend/internal/apinames"
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

	// Email and birth date only for the member themselves or with the
	// policy that reveals them.
	for _, c := range []struct {
		as          caller
		email, born bool
	}{
		{e.as(1), false, false},
		{e.as(1, apinames.MemberSeeEmail), true, false},
		{e.as(1, apinames.MemberUser), false, true},
		{e.as(2), true, true},
	} {
		var profile map[string]any
		e.mustCall(t, c.as, http.MethodGet, path, nil).decode(t, &profile)
		_, hasEmail := profile["email"]
		_, hasBirth := profile["birthDate"]
		if hasEmail != c.email || hasBirth != c.born {
			t.Errorf("GET %s as %s: email %v, birthDate %v; want %v, %v",
				path, c.as.label, hasEmail, hasBirth, c.email, c.born)
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

// mustJSON is for building raw bodies in tests.
func mustJSON(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return b
}
