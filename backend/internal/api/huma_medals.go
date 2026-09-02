package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/medals"
	"github.com/dsek-lth/web/backend/internal/semesters"
)

type listMedalRecipientsInput struct {
	Semester string `query:"semester" doc:"e.g. \"VT 2026\" or \"HT 2026\" - defaults to the current semester"`
}

type listMedalRecipientsOutput struct {
	Body []medals.MedalRecipients
}

func parseSemesterParam(raw string) (semesters.Semester, error) {
	if raw == "" {
		return semesters.FromDate(time.Now()), nil
	}
	return semesters.Parse(raw)
}

func registerMedalRoutes(api huma.API, svc *medals.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-medal-recipients",
		Method:      http.MethodGet,
		Path:        "/medals",
		Summary:     "List who earned which medal after a given semester",
	}, func(ctx context.Context, input *listMedalRecipientsInput) (*listMedalRecipientsOutput, error) {
		semester, err := parseSemesterParam(input.Semester)
		if err != nil {
			return nil, huma.Error400BadRequest(err.Error())
		}
		items, err := svc.MedalRecipients(ctx, semester)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listMedalRecipientsOutput{Body: items}, nil
	})
}

// MedalsCSVHandler is a plain (non-huma) endpoint, like /me and the other
// /auth/* routes - CSV doesn't fit huma's typed-JSON-body model, and
// POST /uploads already established the precedent of stepping outside huma
// for a response shape it doesn't suit. Mounted directly on the mux in
// router.go, but still runs behind the same auth/locale middleware chain,
// so auth.FromContext(r.Context()) works exactly like it does in any huma
// handler.
func MedalsCSVHandler(svc *medals.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		semester, err := parseSemesterParam(r.URL.Query().Get("semester"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		recipients, err := svc.MedalRecipients(r.Context(), semester)
		if err != nil {
			status := http.StatusInternalServerError
			if statusErr, ok := humaServiceError(err).(huma.StatusError); ok {
				status = statusErr.GetStatus()
			}
			http.Error(w, err.Error(), status)
			return
		}

		var b strings.Builder
		b.WriteString("Namn,StilID,Medalj\n")
		for _, rec := range recipients {
			for _, m := range rec.Recipients {
				name := strings.ReplaceAll(
					fmt.Sprintf("%s %s", derefOr(m.FirstName, ""), derefOr(m.LastName, "")),
					",", "",
				)
				b.WriteString(fmt.Sprintf("%s,%s,%s\n", name, derefOr(m.StudentID, ""), rec.Medal))
			}
		}

		filename := strings.ReplaceAll(semesters.String(semester), " ", "-")
		w.Header().Set("Content-Type", "text/csv")
		w.Header().
			Set("Content-Disposition", fmt.Sprintf("attachment; filename=medals-%s.csv", filename))
		_, _ = w.Write([]byte(b.String()))
	}
}

func derefOr(s *string, fallback string) string {
	if s == nil {
		return fallback
	}
	return *s
}
