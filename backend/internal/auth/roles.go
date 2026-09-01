package auth

import (
	"strconv"
	"strings"
	"time"
)

// DerivedRoles ports src/lib/utils/authorization.ts's getDerivedRoles:
// expands the caller's flat Authentik group list (e.g. "dsek.infu.mdlm")
// into every dot-separated prefix, in first-seen order, plus "*" (everyone),
// "_" (signed in), and year/programme-based pseudo-roles that access
// policies (see ListPoliciesForRolesOrStudentID) can be granted against.
func DerivedRoles(
	groupList []string,
	signedIn bool,
	classYear *int,
	classProgramme *string,
) []string {
	seen := make(map[string]bool)
	var roles []string
	add := func(role string) {
		if seen[role] {
			return
		}
		seen[role] = true
		roles = append(roles, role)
	}

	for _, group := range groupList {
		parts := strings.Split(group, ".")
		for i := range parts {
			add(strings.Join(parts[:i+1], "."))
		}
	}

	add("*")
	if len(groupList) > 0 || signedIn {
		add("_")
	}
	if classYear != nil && *classYear == time.Now().Year() {
		add("nolla")
	}
	if classYear != nil {
		// The TS original concatenates classProgramme (possibly undefined)
		// + shortYear with no nil-check; replicated literally here rather
		// than special-cased, same treatment as this codebase's byte-for-byte
		// slugify port.
		programme := "undefined"
		if classProgramme != nil {
			programme = *classProgramme
		}
		add(programme + strconv.Itoa(*classYear%100))
	}
	if classProgramme != nil {
		add(*classProgramme)
	}

	return roles
}
