// Package api wires every article/tag/upload endpoint through huma
// (code-first: handlers take/return typed Go structs, and huma derives the
// OpenAPI spec from those types directly, so the spec cannot drift from
// the code). See ../../DESIGN.md's "API shape and frontend integration"
// section for why huma was chosen over annotation-based tools.
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/articles"
)

type listArticlesInput struct {
	Search          string   `query:"search"          doc:"free-text search over header/body"`
	Tags            []string `query:"tags,explode"    doc:"tag UUIDs, ANY-match"`
	CommitteeID     string   `query:"committeeId"`
	AuthorStudentID string   `query:"authorStudentId"`
	Page            int      `query:"page"            doc:"1-based"`
	PageSize        int      `query:"pageSize"`
}

type listArticlesOutput struct {
	Body struct {
		Articles  []articles.ArticleSummary `json:"articles"`
		PageCount int                       `json:"pageCount"`
	}
}

type getArticleInput struct {
	Slug   string `path:"slug"`
	Status string `            query:"status" enum:"any" doc:"pass 'any' to bypass the publish/removed filter, for an author viewing their own draft or scheduled article"`
}

type articleOutput struct {
	Body articles.ArticleDetail
}

type createArticleInput struct {
	Body articles.ArticleInput
}

type updateArticleInput struct {
	Slug string `path:"slug"`
	Body articles.ArticleInput
}

type slugInput struct {
	Slug string `path:"slug"`
}

type setScheduleInput struct {
	Slug string `path:"slug"`
	Body struct {
		ScheduledID string `json:"scheduledId"`
	}
}

type createCommentInput struct {
	Slug string `path:"slug"`
	Body struct {
		Content string `json:"content"`
	}
}

type commentOutput struct {
	Body articles.Comment
}

type deleteCommentInput struct {
	Slug      string `path:"slug"`
	CommentID string `path:"commentId"`
}

type listTagsOutput struct {
	Body []articles.Tag
}

type uploadInput struct {
	RawBody huma.MultipartFormFiles[struct {
		File huma.FormFile `form:"file" required:"true"`
	}]
}

type uploadOutput struct {
	Body struct {
		URL string `json:"url"`
	}
}

// registerArticleRoutes registers every article/tag/upload operation. There
// is no authentication/authorization layer beyond the mock described in
// ../../DESIGN.md's Auth section: mutating operations call auth.Require via
// the service layer (internal/articles), reading "who is doing this" from
// context (see internal/auth), which auth.Middleware (router.go) attaches
// to every request before it reaches huma.
func registerArticleRoutes(api huma.API, svc *articles.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-articles",
		Method:      http.MethodGet,
		Path:        "/articles",
		Summary:     "List published articles",
	}, func(ctx context.Context, input *listArticlesInput) (*listArticlesOutput, error) {
		params := articles.ListParams{
			TagIDs:   input.Tags,
			Page:     input.Page,
			PageSize: input.PageSize,
		}
		if input.Search != "" {
			params.Search = &input.Search
		}
		if input.CommitteeID != "" {
			params.CommitteeID = &input.CommitteeID
		}
		if input.AuthorStudentID != "" {
			params.AuthorStudentID = &input.AuthorStudentID
		}

		items, pageCount, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &listArticlesOutput{}
		out.Body.Articles = items
		out.Body.PageCount = pageCount
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-article",
		Method:      http.MethodGet,
		Path:        "/articles/{slug}",
		Summary:     "Get an article by slug",
	}, func(ctx context.Context, input *getArticleInput) (*articleOutput, error) {
		var (
			article *articles.ArticleDetail
			err     error
		)
		if input.Status == "any" {
			article, err = svc.GetAny(ctx, input.Slug)
		} else {
			article, err = svc.Get(ctx, input.Slug)
		}
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &articleOutput{Body: *article}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-article",
		Method:        http.MethodPost,
		Path:          "/articles",
		Summary:       "Create an article",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createArticleInput) (*articleOutput, error) {
		article, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &articleOutput{Body: *article}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-article",
		Method:      http.MethodPatch,
		Path:        "/articles/{slug}",
		Summary:     "Replace an article (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateArticleInput) (*articleOutput, error) {
		article, err := svc.Update(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &articleOutput{Body: *article}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-article",
		Method:        http.MethodDelete,
		Path:          "/articles/{slug}",
		Summary:       "Soft-delete an article",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *slugInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "set-article-schedule",
		Method:        http.MethodPatch,
		Path:          "/articles/{slug}/schedule",
		Summary:       "Record the external scheduler task id for a future publish",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *setScheduleInput) (*struct{}, error) {
		if err := svc.SetScheduledID(ctx, input.Slug, input.Body.ScheduledID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "like-article",
		Method:        http.MethodPost,
		Path:          "/articles/{slug}/likes",
		Summary:       "Like an article as the acting member",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *slugInput) (*struct{}, error) {
		if err := svc.Like(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "unlike-article",
		Method:        http.MethodDelete,
		Path:          "/articles/{slug}/likes",
		Summary:       "Unlike an article as the acting member",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *slugInput) (*struct{}, error) {
		if err := svc.Unlike(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-comment",
		Method:        http.MethodPost,
		Path:          "/articles/{slug}/comments",
		Summary:       "Comment on an article as the acting member",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createCommentInput) (*commentOutput, error) {
		comment, err := svc.AddComment(ctx, input.Slug, input.Body.Content)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &commentOutput{Body: *comment}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-comment",
		Method:        http.MethodDelete,
		Path:          "/articles/{slug}/comments/{commentId}",
		Summary:       "Delete a comment",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteCommentInput) (*struct{}, error) {
		if err := svc.RemoveComment(ctx, input.Slug, input.CommentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-tags",
		Method:      http.MethodGet,
		Path:        "/tags",
		Summary:     "List all tags",
	}, func(ctx context.Context, _ *struct{}) (*listTagsOutput, error) {
		tags, err := svc.ListTags(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listTagsOutput{Body: tags}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-image",
		Method:        http.MethodPost,
		Path:          "/uploads",
		Summary:       "Upload an image (storage is mocked, see internal/integrations)",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *uploadInput) (*uploadOutput, error) {
		data := input.RawBody.Data()
		url, err := svc.UploadImage(ctx, data.File.Filename, data.File)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &uploadOutput{}
		out.Body.URL = url
		return out, nil
	})
}
