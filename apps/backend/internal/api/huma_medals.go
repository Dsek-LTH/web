package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/medals"
	"github.com/dsek-lth/web/apps/backend/internal/semesters"
)

type semesterInput struct {
	Semester string `query:"semester" doc:"VT (spring) or HT (fall) and a year, e.g. \"VT 2026\". Defaults to the current semester."`
}

func parseSemesterParam(raw string) (semesters.Semester, error) {
	if raw == "" {
		return semesters.FromDate(time.Now()), nil
	}
	return semesters.Parse(raw)
}

func registerMedalRoutes(api huma.API, svc *medals.Service) {
	tags := []string{"Medals"}

	huma.Register(api, huma.Operation{
		OperationID: "list-member-medals",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/medals",
		Tags:        tags,
		Summary:     "List a member's medals",
		Description: "Every medal the member had earned by the end of last semester.",
	}, func(ctx context.Context, input *StudentIDPath) (*struct{ Body []medals.MemberMedal }, error) {
		items, err := svc.MemberMedals(ctx, input.StudentID, semesters.FromDate(time.Now())-1)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []medals.MemberMedal }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-medal-recipients",
		Method:      http.MethodGet,
		Path:        "/medals",
		Tags:        tags,
		Summary:     "List medal recipients",
		Description: "Who earned which medal after the given semester. Signed-in members only.",
	}, func(ctx context.Context, input *semesterInput) (*struct{ Body []medals.MedalRecipients }, error) {
		recipients, err := medalRecipients(ctx, svc, input.Semester)
		if err != nil {
			return nil, err
		}
		return &struct{ Body []medals.MedalRecipients }{Body: recipients}, nil
	})

	// Proxied by SvelteKit's /medals/download-csv.
	huma.Register(api, huma.Operation{
		OperationID: "get-medal-recipients-csv",
		Method:      http.MethodGet,
		Path:        "/medals.csv",
		Tags:        tags,
		Summary:     "Medal recipients as CSV",
		Description: "The same list as GET /medals, one row per member and medal: Namn,StilID,Medalj.",
		Responses:   rawResponses("text/csv", "A CSV file."),
	}, func(ctx context.Context, input *semesterInput) (*rawOutput, error) {
		recipients, err := medalRecipients(ctx, svc, input.Semester)
		if err != nil {
			return nil, err
		}
		var b strings.Builder
		b.WriteString("Namn,StilID,Medalj\n")
		for _, rec := range recipients {
			for _, m := range rec.Recipients {
				name := strings.ReplaceAll(
					fmt.Sprintf("%s %s", derefOr(m.FirstName, ""), derefOr(m.LastName, "")),
					",", "",
				)
				fmt.Fprintf(&b, "%s,%s,%s\n", name, derefOr(m.StudentID, ""), rec.Medal)
			}
		}
		semester, _ := parseSemesterParam(input.Semester)
		filename := strings.ReplaceAll(semesters.String(semester), " ", "-")
		return &rawOutput{
			ContentType:        "text/csv",
			ContentDisposition: fmt.Sprintf("attachment; filename=medals-%s.csv", filename),
			Body:               []byte(b.String()),
		}, nil
	})
}

func medalRecipients(
	ctx context.Context,
	svc *medals.Service,
	rawSemester string,
) ([]medals.MedalRecipients, error) {
	semester, err := parseSemesterParam(rawSemester)
	if err != nil {
		return nil, huma.Error422UnprocessableEntity(err.Error())
	}
	recipients, err := svc.MedalRecipients(ctx, semester)
	if err != nil {
		return nil, humaServiceError(err)
	}
	return recipients, nil
}

func derefOr(s *string, fallback string) string {
	if s == nil {
		return fallback
	}
	return *s
}
