// Package api registers every endpoint on huma (code-first: handlers take
// and return typed Go structs, and huma derives the OpenAPI document from
// them, so it cannot drift from the code).
//
// Conventions: plural kebab-case paths; POST creates
// (201), PUT replaces (200), DELETE removes (204); other state changes are
// POST /{resource}/{key}/{verb}; every operation has one tag; request
// bodies are named <Thing>Input; lists never come back null.
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/articles"
)

// Paging is the shared page/pageSize query pair.
type Paging struct {
	Page     int `query:"page"     doc:"1-based page number. Defaults to 1."`
	PageSize int `query:"pageSize" doc:"Items per page. Each endpoint has its own default and maximum."`
}

type listArticlesInput struct {
	Search           string   `query:"search"           doc:"Free-text search over header and body."`
	Tags             []string `query:"tags,explode"     doc:"Tag ids; an article matches if it has any of them."`
	CommitteeID      string   `query:"committeeId"      doc:"Only articles about this committee."`
	AuthorStudentID  string   `query:"authorStudentId"  doc:"Only articles written by this member."`
	NollningSeasonID string   `query:"nollningSeasonId" doc:"Only articles in this nollning season."`
	IncludeNollning  bool     `query:"includeNollning"  doc:"Also list nollning season articles, which are left out unless nollningSeasonId is set."`
	Paging
}

type getArticleInput struct {
	Slug               string `path:"slug"`
	IncludeDeleted     bool   `            query:"includeDeleted"     doc:"Also return a soft-deleted article. Hidden articles are only returned to someone who may edit them."`
	IncludeUnpublished bool   `            query:"includeUnpublished" doc:"Also return a draft or scheduled article. Hidden articles are only returned to someone who may edit them."`
}

type articleOutput struct {
	Body articles.ArticleDetail
}

type slugInput struct {
	Slug string `path:"slug"`
}

type commentOutput struct {
	Body apitypes.Comment
}

type deleteCommentInput struct {
	Slug      string `path:"slug"`
	CommentID string `path:"commentId"`
}

type tagOutput struct {
	Body articles.Tag
}

// UploadedImage is where an uploaded image can be fetched from.
type UploadedImage struct {
	URL string `json:"url" doc:"Public URL of the stored image."`
}

func registerArticleRoutes(api huma.API, svc *articles.Service) {
	tags := []string{"Articles"}

	huma.Register(api, huma.Operation{
		OperationID: "list-articles",
		Method:      http.MethodGet,
		Path:        "/articles",
		Tags:        tags,
		Summary:     "List published articles",
		Description: "Published, non-deleted articles, newest first, without nollning season articles " +
			"unless includeNollning or nollningSeasonId is set. pageSize defaults to 10.",
	}, func(ctx context.Context, input *listArticlesInput) (*struct{ Body articles.ArticleList }, error) {
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
		if input.NollningSeasonID != "" {
			params.NollningSeasonID = &input.NollningSeasonID
		}
		params.IncludeNollning = input.IncludeNollning

		items, pageCount, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body articles.ArticleList }{
			Body: articles.ArticleList{Articles: items, PageCount: pageCount},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-article",
		Method:      http.MethodGet,
		Path:        "/articles/{slug}",
		Tags:        tags,
		Summary:     "Get an article",
		Description: "A published, non-deleted article, with its comments and likers. " +
			"includeDeleted/includeUnpublished let an editor load a hidden one.",
	}, func(ctx context.Context, input *getArticleInput) (*articleOutput, error) {
		var (
			article *articles.ArticleDetail
			err     error
		)
		if input.IncludeDeleted || input.IncludeUnpublished {
			article, err = svc.GetHidden(
				ctx,
				input.Slug,
				input.IncludeDeleted,
				input.IncludeUnpublished,
			)
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
		Tags:          tags,
		Summary:       "Create an article",
		Description:   "Needs news:article:create. The caller is the author.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body articles.ArticleInput }) (*articleOutput, error) {
		article, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &articleOutput{Body: *article}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-article",
		Method:      http.MethodPut,
		Path:        "/articles/{slug}",
		Tags:        tags,
		Summary:     "Replace an article",
		Description: "Replaces every field, so omitting publishedAt un-publishes the article. " +
			"Needs news:article:update, or being its author. Only the author can change the byline; " +
			"anyone else editing keeps the current author and author is ignored.",
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug"`
		Body articles.ArticleInput
	},
	) (*articleOutput, error) {
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
		Tags:          tags,
		Summary:       "Delete an article",
		Description:   "Soft delete. Needs news:article:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *slugInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "like-article",
		Method:        http.MethodPut,
		Path:          "/articles/{slug}/like",
		Tags:          tags,
		Summary:       "Like an article",
		Description:   "As the signed-in member. Needs news:article:like.",
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
		Path:          "/articles/{slug}/like",
		Tags:          tags,
		Summary:       "Unlike an article",
		Description:   "As the signed-in member.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *slugInput) (*struct{}, error) {
		if err := svc.Unlike(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-article-comment",
		Method:        http.MethodPost,
		Path:          "/articles/{slug}/comments",
		Tags:          tags,
		Summary:       "Comment on an article",
		Description:   "As the signed-in member. Needs news:article:comment. Mentioned members are notified.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug"`
		Body apitypes.CommentInput
	},
	) (*commentOutput, error) {
		comment, err := svc.AddComment(ctx, input.Slug, input.Body.Content)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &commentOutput{Body: *comment}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-article-comment",
		Method:        http.MethodDelete,
		Path:          "/articles/{slug}/comments/{commentId}",
		Tags:          tags,
		Summary:       "Delete an article comment",
		Description:   "Needs news:article:comment:delete, or being the comment's author.",
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
		Tags:        tags,
		Summary:     "List tags",
		Description: "Every tag, including nollning ones. Tags are shared by articles, events and notification settings.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []articles.Tag }, error) {
		all, err := svc.ListTags(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []articles.Tag }{Body: all}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-tag",
		Method:        http.MethodPost,
		Path:          "/tags",
		Tags:          tags,
		Summary:       "Create a tag",
		Description:   "Needs tags:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body articles.TagInput }) (*tagOutput, error) {
		tag, err := svc.CreateTag(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &tagOutput{Body: *tag}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-tag",
		Method:      http.MethodPut,
		Path:        "/tags/{id}",
		Tags:        tags,
		Summary:     "Replace a tag",
		Description: "Needs tags:update.",
	}, func(ctx context.Context, input *struct {
		ID   string `path:"id"`
		Body articles.TagInput
	},
	) (*tagOutput, error) {
		tag, err := svc.UpdateTag(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &tagOutput{Body: *tag}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-custom-authors",
		Method:      http.MethodGet,
		Path:        "/custom-authors",
		Tags:        tags,
		Summary:     "List custom authors",
		Description: "Shared bylines that aren't a member, e.g. Styrelsen.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []articles.CustomAuthor }, error) {
		customAuthors, err := svc.ListCustomAuthors(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []articles.CustomAuthor }{Body: customAuthors}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-member-active-mandates",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/mandates",
		Tags:        []string{"Members"},
		Summary:     "List a member's active mandates",
		Description: "Only the mandates running today - the article byline picker. " +
			"GET /members/{studentId} has the full history.",
	}, func(ctx context.Context, input *struct {
		StudentID string `path:"studentId"`
	},
	) (*struct{ Body []articles.Mandate }, error) {
		mandates, err := svc.ListActiveMandatesForMember(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []articles.Mandate }{Body: mandates}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "upload-image",
		Method:      http.MethodPost,
		Path:        "/images",
		Tags:        []string{"Files"},
		Summary:     "Upload an image",
		Description: "For articles and event header images: a JPEG, PNG, WebP or GIF of at most 25 MB. " +
			"It's turned upright (EXIF orientation), scaled down to at most 1920 pixels wide and stored as " +
			"a JPEG, or a PNG if it has transparency. Needs news:article:create, event:create or event:update.",
		DefaultStatus: http.StatusCreated,
		MaxBodyBytes:  articles.MaxImageSize + multipartSlack,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			File huma.FormFile `form:"file" required:"true" doc:"The image."`
		}]
	},
	) (*struct{ Body UploadedImage }, error) {
		data := input.RawBody.Data()
		url, err := svc.UploadImage(ctx, data.File.Filename, data.File)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body UploadedImage }{Body: UploadedImage{URL: url}}, nil
	})
}
