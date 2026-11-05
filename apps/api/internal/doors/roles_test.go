package doors

import "testing"

func TestIsVirtualRole(t *testing.T) {
	for role, want := range map[string]bool{
		"*": true, "_": true, "nolla": true, "dsek.styr": true,
		"D24": true, "C": true, "VR/AR23": true,
		"dsek.infu": false, "dsek": false, "": false,
	} {
		if got := isVirtualRole(role); got != want {
			t.Errorf("isVirtualRole(%q) = %v, want %v", role, got, want)
		}
	}
}
