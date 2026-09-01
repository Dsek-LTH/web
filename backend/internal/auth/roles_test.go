package auth

import (
	"reflect"
	"testing"
)

// Cases taken from ../../../src/lib/utils/authorization.test.ts to keep
// parity with the TS implementation this replaces.
func TestDerivedRoles(t *testing.T) {
	cases := []struct {
		name      string
		groupList []string
		signedIn  bool
		want      []string
	}{
		{"signed out user", nil, false, []string{"*"}},
		{"signed in user with no groups", []string{}, true, []string{"*", "_"}},
		{
			"signed in user with one simple group",
			[]string{"group"},
			false,
			[]string{"group", "*", "_"},
		},
		{
			"signed in user with complex groups",
			[]string{"dsek.infu.mdlm", "dsek.ordf"},
			false,
			[]string{"dsek", "dsek.infu", "dsek.infu.mdlm", "dsek.ordf", "*", "_"},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := DerivedRoles(c.groupList, c.signedIn, nil, nil)
			if !reflect.DeepEqual(got, c.want) {
				t.Errorf("DerivedRoles(%v, %v) = %v, want %v", c.groupList, c.signedIn, got, c.want)
			}
		})
	}
}
