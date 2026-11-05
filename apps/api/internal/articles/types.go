package articles

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
)

// Member/Tag/Comment/Committee/Position/Mandate are aliased from
// internal/apitypes rather than defined here - see that package's doc
// comment for why (huma's OpenAPI schema registry panics on two
// same-named-but-distinct Go structs once both internal/articles and
// another domain package register routes on one huma.API). Committee/
// Position/Mandate originally were defined here as minimal author-picker-only
// structs; internal/committees now owns the full-featured versions in
// apitypes, and this package just uses a subset of their fields.
type (
	Member    = apitypes.Member
	Tag       = apitypes.Tag
	Comment   = apitypes.Comment
	Committee = apitypes.Committee
	Position  = apitypes.Position
	Mandate   = apitypes.Mandate
)

// Name fields throughout this file come in pairs: NameSv/NameEn are the raw
// stored values (needed by bilingual edit forms), and Name is NameEn if the
// resolved request locale is "en" and it's set, NameSv otherwise -
// replicating the old Prisma `translationExtension`'s fallback rule, but
// resolved server-side now (see internal/locale) instead of by the
// frontend. Display code should read Name; edit forms read the Sv/En pair.

type CustomAuthor struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"               doc:"nameEn or nameSv, resolved from Accept-Language."`
	NameSv   string  `json:"nameSv"`
	NameEn   *string `json:"nameEn,omitempty"`
	ImageURL *string `json:"imageUrl,omitempty"`
}

// AuthorType mirrors the authors.type generated column.
type AuthorType string

const (
	AuthorTypeMember  AuthorType = "Member"
	AuthorTypeMandate AuthorType = "Mandate"
	AuthorTypeCustom  AuthorType = "Custom"
)

func (AuthorType) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "ArticleAuthorType", "Member", "Mandate", "Custom")
}

// ArticleAuthor is one of: a plain member, a member acting under a mandate
// (Position is set), or a custom byline (CustomAuthor is set).
type ArticleAuthor struct {
	ID           string        `json:"id"`
	Type         AuthorType    `json:"type"                   doc:"Member: the member themselves. Mandate: as a position they hold. Custom: a shared byline."`
	Member       Member        `json:"member"                 doc:"The member who wrote it, whatever the byline."`
	Position     *Position     `json:"position,omitempty"     doc:"Set for a Mandate byline."`
	CustomAuthor *CustomAuthor `json:"customAuthor,omitempty" doc:"Set for a Custom byline."`
}

// ArticleStatus is the moderation status (articles.status).
type ArticleStatus string

func (ArticleStatus) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "ArticleStatus", "draft", "approved", "rejected")
}

type ArticleSummary struct {
	ID           string         `json:"id"`
	Slug         string         `json:"slug"                  doc:"URL key."`
	Header       string         `json:"header"                doc:"headerEn or headerSv, resolved from Accept-Language."`
	HeaderSv     string         `json:"headerSv"`
	HeaderEn     *string        `json:"headerEn,omitempty"`
	Body         string         `json:"body"                  doc:"bodyEn or bodySv, resolved from Accept-Language. Sanitized HTML."`
	BodySv       string         `json:"bodySv"`
	BodyEn       *string        `json:"bodyEn,omitempty"`
	ImageURL     *string        `json:"imageUrl,omitempty"    doc:"The first image, for list views."`
	ImageURLs    []string       `json:"imageUrls"             doc:"Every image, in order."`
	YoutubeURL   *string        `json:"youtubeUrl,omitempty"`
	Status       *ArticleStatus `json:"status,omitempty"`
	PublishedAt  *time.Time     `json:"publishedAt,omitempty" doc:"When it goes (or went) live. Unset for a draft."`
	UpdatedAt    *time.Time     `json:"updatedAt,omitempty"   doc:"Last edit."`
	CreatedAt    time.Time      `json:"createdAt"`
	Author       ArticleAuthor  `json:"author"`
	Committee    *Committee     `json:"committee,omitempty"   doc:"The committee the article is about, if any."`
	Tags         []Tag          `json:"tags"`
	CommentCount int            `json:"commentCount"`
	LikeCount    int            `json:"likeCount"`
	// Whether (and with what text) the article is announced when it goes
	// live - see Service.syncNotifications and Service.AnnounceDue.
	ShouldSendNotification bool    `json:"sendNotification"           doc:"Whether subscribers are notified when it goes live."`
	NotificationText       *string `json:"notificationText,omitempty" doc:"Custom notification text; the header is used if unset."`
	// NollningSeasonID associates this article with a nollning season.
	// Setting/changing it to a non-null
	// value requires apinames.NollningContentAssociate (see Service.Create/
	// Update); leaving it unset or resubmitting the current value doesn't.
	NollningSeasonID *string `json:"nollningSeasonId,omitempty" doc:"The nollning season the article belongs to."`
}

type ArticleDetail struct {
	ArticleSummary
	Comments []Comment `json:"comments" doc:"Newest first."`
	// TaggedMembers are the members @mentioned in Comments - see
	// events.EventDetail's identical field.
	TaggedMembers []Member `json:"taggedMembers" doc:"Members @mentioned in the comments, with their current names."`
	// Likers is everyone who liked the article - the like button reads
	// whether the viewer is among them, and the likers list names them
	// (upstream #1390 restored both on the article page).
	Likers []Member `json:"likers" doc:"Everyone who liked the article."`
	// CanEdit/CanDelete are the acting identity's own permissions on this
	// article, computed server-side from the exact same author-or-policy
	// checks Update/Delete themselves enforce (see Service.detail) - the
	// frontend reads these instead of recomputing authorization itself: Go is
	// the sole source of truth for authorization, even client-side-only
	// reads of a policy array count as a forbidden reimplementation.
	CanEdit   bool `json:"canEdit"   doc:"Whether the caller may edit the article (its author, or news:article:update)."`
	CanDelete bool `json:"canDelete" doc:"Whether the caller may delete the article (news:article:delete)."`
	// AnnouncementFailed is only set on a create/update response: the
	// article was saved, but sending its notification or Discord post
	// failed (see Service.syncNotifications).
	AnnouncementFailed bool `json:"announcementFailed,omitempty" doc:"Only on create/update: the article was saved, but its notification or Discord post failed."`
}

// ArticleList is one page of articles.
type ArticleList struct {
	Articles  []ArticleSummary `json:"articles"`
	PageCount int              `json:"pageCount" doc:"Number of pages at this pageSize."`
}

// AuthorInput identifies which byline to attach, on top of the acting
// member (taken from the request's auth.Identity, not client input - see
// Service.resolveAuthor). Set MandateID to post as a mandate the acting
// member holds (verified against the DB), or CustomID to post as a shared
// custom byline (e.g. "Styrelsen" - these aren't owned by a specific
// member, so there's nothing to verify). Leave both unset to post as the
// member themselves.
type AuthorInput struct {
	MandateID *string `json:"mandateId,omitempty" doc:"Post as this mandate, which the caller must hold."`
	CustomID  *string `json:"customId,omitempty"  doc:"Post as this custom author."`
}

// ArticleInput is the writable shape of an article, shared by create and
// update (update is full-replace / PUT semantics - it does not support
// partial patches).
type ArticleInput struct {
	HeaderSv               string      `json:"headerSv"`
	HeaderEn               *string     `json:"headerEn"`
	BodySv                 string      `json:"bodySv"           doc:"HTML; sanitized on save."`
	BodyEn                 *string     `json:"bodyEn"           doc:"HTML; sanitized on save."`
	ImageURL               *string     `json:"imageUrl"         doc:"Deprecated single image; imageUrls[0] is used if unset."`
	ImageURLs              []string    `json:"imageUrls"`
	YoutubeURL             *string     `json:"youtubeUrl"`
	Author                 AuthorInput `json:"author"           doc:"The byline. The author is always the caller."`
	TagIDs                 []string    `json:"tagIds"`
	CommitteeID            *string     `json:"committeeId"`
	PublishedAt            *time.Time  `json:"publishedAt"      doc:"When it goes live. Unset keeps it a draft; omitting it on update un-publishes it."`
	ShouldSendNotification bool        `json:"sendNotification" doc:"Notify subscribers when it goes live."`
	NotificationText       *string     `json:"notificationText"`
	NollningSeasonID       *string     `json:"nollningSeasonId" doc:"Setting or changing it needs nollning:content:associate."`
}

// TagInput is a tag's editable fields.
type TagInput struct {
	NameSv string  `json:"nameSv"`
	NameEn *string `json:"nameEn,omitempty"`
	Color  *string `json:"color,omitempty"  doc:"CSS color, e.g. #ff0000."`
}

type ListParams struct {
	Search           *string
	TagIDs           []string
	CommitteeID      *string
	AuthorStudentID  *string
	NollningSeasonID *string
	Page             int
	PageSize         int
}
