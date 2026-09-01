// Package apinames declares the authorization policy strings this API
// checks, mirroring ../../../src/lib/utils/apiNames.ts's NEWS block. Kept
// as plain string constants (not a richer type) to match that file
// directly - a diff against it is how you'd notice these drifting.
package apinames

const (
	NewsArticleCreate        = "news:article:create"
	NewsArticleRead          = "news:article:read"
	NewsArticleUpdate        = "news:article:update"
	NewsArticleDelete        = "news:article:delete"
	NewsArticleManage        = "news:article:manage"
	NewsArticleLike          = "news:article:like"
	NewsArticleComment       = "news:article:comment"
	NewsArticleCommentDelete = "news:article:comment:delete"

	EventCreate        = "event:create"
	EventRead          = "event:read"
	EventUpdate        = "event:update"
	EventDelete        = "event:delete"
	EventComment       = "event:comment"
	EventCommentDelete = "event:comment:delete"

	MemberUpdate   = "core:member:update"
	MemberSeeEmail = "member:see_email"

	CommitteeUpdate = "core:committee:update"

	PositionUpdate = "core:position:update"

	MandateCreate = "core:mandate:create"
	MandateUpdate = "core:mandate:update"
	MandateDelete = "core:mandate:delete"

	AccessPolicyRead   = "core:access:api:read"
	AccessPolicyCreate = "core:access:api:create"
	AccessPolicyDelete = "core:access:api:delete"
)

// All lists every policy this API currently checks - used to build the
// all-permissions mock identity (see internal/auth.MockAuthenticator).
// Extend this whenever a new policy constant is added above.
func All() []string {
	return []string{
		NewsArticleCreate,
		NewsArticleRead,
		NewsArticleUpdate,
		NewsArticleDelete,
		NewsArticleManage,
		NewsArticleLike,
		NewsArticleComment,
		NewsArticleCommentDelete,
		EventCreate,
		EventRead,
		EventUpdate,
		EventDelete,
		EventComment,
		EventCommentDelete,
		MemberUpdate,
		MemberSeeEmail,
		CommitteeUpdate,
		PositionUpdate,
		MandateCreate,
		MandateUpdate,
		MandateDelete,
		AccessPolicyRead,
		AccessPolicyCreate,
		AccessPolicyDelete,
	}
}
