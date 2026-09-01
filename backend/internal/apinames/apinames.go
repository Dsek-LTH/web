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
	// MemberSeeStaben mirrors the old apiNames.MEMBER.SEE_STABEN exactly -
	// granted to everyone outside a nollning season, opt-in only during one
	// (see internal/nollning.Service.InjectStabenPolicy).
	MemberSeeStaben = "member:see_staben"

	CommitteeUpdate = "core:committee:update"

	PositionUpdate = "core:position:update"

	MandateCreate = "core:mandate:create"
	MandateUpdate = "core:mandate:update"
	MandateDelete = "core:mandate:delete"

	AccessPolicyRead   = "core:access:api:read"
	AccessPolicyCreate = "core:access:api:create"
	AccessPolicyDelete = "core:access:api:delete"

	// NollningContentAssociate gates setting/changing an article's or
	// event's nollning_season_id - one shared policy across both domains
	// (decided 2026-09-01, see ../../DESIGN.md's nollning section) rather
	// than a per-domain pair, since it's the same real-world permission
	// ("can mark content as nollning-related") regardless of content type.
	NollningContentAssociate = "nollning:content:associate"
	// NollningSeasonManage gates nollning_seasons admin CRUD - new, the old
	// TS app had no dedicated policy for this (the AdminSetting rows it
	// replace were gated generically by admin:settings:*).
	NollningSeasonManage = "nollning:season:manage"
	// NollningPhadderGroupsManage mirrors the old
	// apiNames.NOLLNING.MANAGE_PHADDER_GROUPS exactly.
	NollningPhadderGroupsManage = "nollning:phaddrar:groups:manage"
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
		MemberSeeStaben,
		CommitteeUpdate,
		PositionUpdate,
		MandateCreate,
		MandateUpdate,
		MandateDelete,
		AccessPolicyRead,
		AccessPolicyCreate,
		AccessPolicyDelete,
		NollningContentAssociate,
		NollningSeasonManage,
		NollningPhadderGroupsManage,
	}
}
