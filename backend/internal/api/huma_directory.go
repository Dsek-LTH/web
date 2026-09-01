package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/articles"
)

// registerDirectoryRoutes registers the small set of non-article lookups
// article features depend on (committees, a member's mandates, custom
// authors) - added minimally to support the article "post as" picker and
// committee-news page, not as a first step toward porting those domains in
// full. See ../../DESIGN.md's "Leftover Prisma calls" note.
func registerDirectoryRoutes(api huma.API, svc *articles.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-committees",
		Method:      http.MethodGet,
		Path:        "/committees",
		Summary:     "List committees, optionally filtered to one by shortName",
	}, func(ctx context.Context, input *struct {
		ShortName string `query:"shortName"`
	},
	) (*struct {
		Body []articles.Committee
	}, error,
	) {
		var shortName *string
		if input.ShortName != "" {
			shortName = &input.ShortName
		}
		committees, err := svc.ListCommittees(ctx, shortName)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []articles.Committee
		}{Body: committees}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-member-mandates",
		Method:      http.MethodGet,
		Path:        "/members/{id}/mandates",
		Summary:     "List a member's currently-active mandates",
	}, func(ctx context.Context, input *struct {
		ID string `path:"id"`
	},
	) (*struct {
		Body []articles.Mandate
	}, error,
	) {
		mandates, err := svc.ListActiveMandatesForMember(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []articles.Mandate
		}{Body: mandates}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-custom-authors",
		Method:      http.MethodGet,
		Path:        "/custom-authors",
		Summary:     "List custom (non-member) bylines",
	}, func(ctx context.Context, _ *struct{}) (*struct {
		Body []articles.CustomAuthor
	}, error,
	) {
		customAuthors, err := svc.ListCustomAuthors(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []articles.CustomAuthor
		}{Body: customAuthors}, nil
	})
}
