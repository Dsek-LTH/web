package nollning

import (
	"context"
	"strings"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
)

// StabenPositionPrefix starts the ids of staben's own positions
// (dsek.noll.stab.oph, dsek.noll.stab.mdlm). It is a position prefix, not
// the season's organizing committee, because that committee (nollu) also
// holds the phadder, pepp and funk positions, which were never hidden.
// The SQL in queries/articles.sql matches the same prefix.
const StabenPositionPrefix = "dsek.noll.stab."

// IsStabenPosition reports whether positionID is one of staben's positions.
func IsStabenPosition(positionID string) bool {
	return strings.HasPrefix(positionID, StabenPositionPrefix)
}

// StabenView is what a caller may see of staben: who holds staben's
// positions is hidden during a season from callers without
// apinames.MemberSeeStaben, except a member's own. Outside a season
// InjectStabenPolicy grants everyone that policy, so the view hides
// nothing then. It replaces the old schema.zmodel rules on Mandate,
// Author and Member.email.
type StabenView struct {
	hide     bool
	viewerID string
}

// StabenViewFor reads the caller's view from the request context.
func StabenViewFor(ctx context.Context) StabenView {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return StabenView{hide: true}
	}
	return StabenView{
		hide:     !identity.Has(apinames.MemberSeeStaben),
		viewerID: identity.MemberID,
	}
}

// Hides reports whether the caller may not see staben at all (only their
// own staben mandates), for filters that run in SQL.
func (v StabenView) Hides() bool {
	return v.hide
}

func (v StabenView) hides(memberID string) bool {
	return v.hide && (v.viewerID == "" || memberID != v.viewerID)
}

// HidesMandate reports whether memberID's mandate on positionID should be
// left out.
func (v StabenView) HidesMandate(positionID, memberID string) bool {
	return IsStabenPosition(positionID) && v.hides(memberID)
}

// HidesMember reports whether something identifying memberID as staben
// (their email, an article byline) should be left out; isStaben is whether
// they hold one of staben's positions today (IsCurrentStabenMandate).
func (v StabenView) HidesMember(memberID string, isStaben bool) bool {
	return isStaben && v.hides(memberID)
}

// IsCurrentStabenMandate reports whether a mandate on positionID running
// from start to end (dates, inclusive) is a staben mandate held today.
func IsCurrentStabenMandate(positionID string, start, end time.Time) bool {
	if !IsStabenPosition(positionID) {
		return false
	}
	today := time.Now().UTC().Truncate(24 * time.Hour)
	return !start.After(today) && !end.Before(today)
}
