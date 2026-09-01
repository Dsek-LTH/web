package articles

import "time"

// Name fields throughout this file come in pairs: NameSv/NameEn are the raw
// stored values (needed by bilingual edit forms), and Name is NameEn if the
// resolved request locale is "en" and it's set, NameSv otherwise -
// replicating the old Prisma `translationExtension`'s fallback rule, but
// resolved server-side now (see internal/locale) instead of by the
// frontend. Display code should read Name; edit forms read the Sv/En pair.
type Committee struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	ShortName *string `json:"shortName,omitempty"`
	SymbolURL *string `json:"symbolUrl,omitempty"`
}

type Position struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	NameSv string  `json:"nameSv"`
	NameEn *string `json:"nameEn,omitempty"`
}

// Mandate is a member's (currently active) hold on a Position - used for
// the "post as" author picker on create/edit.
type Mandate struct {
	ID       string   `json:"id"`
	Position Position `json:"position"`
}

type CustomAuthor struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	NameSv   string  `json:"nameSv"`
	NameEn   *string `json:"nameEn,omitempty"`
	ImageURL *string `json:"imageUrl,omitempty"`
}

type Member struct {
	ID          string  `json:"id"`
	StudentID   *string `json:"studentId,omitempty"`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	PicturePath *string `json:"picturePath,omitempty"`
}

// Author is one of: a plain member, a member acting under a mandate (Position
// is set), or a custom byline (CustomAuthor is set) - mirrors the
// authors.type generated column in the DB.
type Author struct {
	ID           string        `json:"id"`
	Type         string        `json:"type"`
	Member       Member        `json:"member"`
	Position     *Position     `json:"position,omitempty"`
	CustomAuthor *CustomAuthor `json:"customAuthor,omitempty"`
}

type Tag struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	NameSv    string  `json:"nameSv"`
	NameEn    *string `json:"nameEn,omitempty"`
	Color     *string `json:"color,omitempty"`
	IsDefault bool    `json:"isDefault"`
}

type Comment struct {
	ID        string    `json:"id"`
	Content   *string   `json:"content,omitempty"`
	Published time.Time `json:"published"`
	Member    Member    `json:"member"`
}

type ArticleSummary struct {
	ID           string     `json:"id"`
	Slug         string     `json:"slug"`
	Header       string     `json:"header"`
	HeaderSv     string     `json:"headerSv"`
	HeaderEn     *string    `json:"headerEn,omitempty"`
	Body         string     `json:"body"`
	BodySv       string     `json:"bodySv"`
	BodyEn       *string    `json:"bodyEn,omitempty"`
	ImageURL     *string    `json:"imageUrl,omitempty"`
	ImageURLs    []string   `json:"imageUrls,omitempty"`
	YoutubeURL   *string    `json:"youtubeUrl,omitempty"`
	Status       *string    `json:"status,omitempty"`
	PublishedAt  *time.Time `json:"publishedAt,omitempty"`
	UpdatedAt    *time.Time `json:"updatedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	Author       Author     `json:"author"`
	Committee    *Committee `json:"committee,omitempty"`
	Tags         []Tag      `json:"tags"`
	CommentCount int        `json:"commentCount"`
	LikeCount    int        `json:"likeCount"`
	// Scheduling bookkeeping: this API doesn't act on these (see
	// backend/CLAUDE.md), it just stores/returns them for a caller - like
	// the SvelteKit app - that owns the actual scheduled-publish logic.
	ShouldSendNotification bool    `json:"sendNotification"`
	NotificationText       *string `json:"notificationText,omitempty"`
	ScheduledID            *string `json:"scheduledId,omitempty"`
}

type ArticleDetail struct {
	ArticleSummary
	Comments []Comment `json:"comments"`
}

// AuthorInput identifies which byline to attach, on top of the acting
// member (taken from the request's auth.Identity, not client input - see
// Service.resolveAuthor). Set MandateID to post as a mandate the acting
// member holds (verified against the DB), or CustomID to post as a shared
// custom byline (e.g. "Styrelsen" - these aren't owned by a specific
// member, so there's nothing to verify). Leave both unset to post as the
// member themselves.
type AuthorInput struct {
	MandateID *string `json:"mandateId,omitempty"`
	CustomID  *string `json:"customId,omitempty"`
}

// ArticleInput is the writable shape of an article, shared by create and
// update (update is full-replace / PUT semantics - it does not support
// partial patches).
type ArticleInput struct {
	HeaderSv               string      `json:"headerSv"`
	HeaderEn               *string     `json:"headerEn"`
	BodySv                 string      `json:"bodySv"`
	BodyEn                 *string     `json:"bodyEn"`
	ImageURL               *string     `json:"imageUrl"`
	ImageURLs              []string    `json:"imageUrls"`
	YoutubeURL             *string     `json:"youtubeUrl"`
	Author                 AuthorInput `json:"author"`
	TagIDs                 []string    `json:"tagIds"`
	CommitteeID            *string     `json:"committeeId"`
	PublishedAt            *time.Time  `json:"publishedAt"`
	ShouldSendNotification bool        `json:"sendNotification"`
	NotificationText       *string     `json:"notificationText"`
}

type ListParams struct {
	Search          *string
	TagIDs          []string
	CommitteeID     *string
	AuthorStudentID *string
	Page            int
	PageSize        int
}
