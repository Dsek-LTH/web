package medals

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/semesters"
)

func TestMedalRecipientsRejectsSemestersWithoutMedals(t *testing.T) {
	s := &Service{}
	ctx := auth.ContextWithIdentity(context.Background(), &auth.Identity{MemberID: "m"})
	for _, sem := range []semesters.Semester{
		semesters.FromYearAndTerm(1981, "HT"), // before the guild
		semesters.FromDate(time.Now()) + 1,    // next semester
		semesters.FromYearAndTerm(2332, "VT"), // crawlers walking forward
	} {
		if _, err := s.MedalRecipients(ctx, sem); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("MedalRecipients(%s) = %v, want invalid input", semesters.String(sem), err)
		}
	}
	if FirstSemester != semesters.FromYearAndTerm(1982, "VT") {
		t.Errorf("FirstSemester = %s", semesters.String(FirstSemester))
	}
}
