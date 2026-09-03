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

	// Phase 3 ("Simple standalone CRUD" - see DESIGN.md's roadmap) below.

	SongCreate = "song:create"
	SongRead   = "song:read"
	SongUpdate = "song:update"
	SongDelete = "song:delete"

	// AlertManage mirrors the old apiNames.ALERT exactly - a single flat
	// policy gating all admin alert mutations, not a crud() group.
	AlertManage = "alert"

	// MarkdownCreate/MarkdownUpdate are the base (any-page) policies for the
	// generic /info CMS pages, unifying the old app's split MARKDOWNS/
	// MARKDOWN policy groups into one (see DESIGN.md's Phase 3 section).
	// A page can also be edited via a per-page dynamic policy string
	// ("markdowns:{slug}:update", plural, matching the live table/old TS
	// naming) granted to that page's creator - built at call sites via
	// fmt.Sprintf, not a const here, since it's per-instance.
	MarkdownCreate = "markdown:create"
	MarkdownUpdate = "markdown:update"

	// GoverningDocumentRead/Write mirror the old apiNames.GOVERNING_DOCUMENT
	// exactly - create/update/delete all share Write, only Read is separate.
	GoverningDocumentRead  = "governing_document:read"
	GoverningDocumentWrite = "governing_document:write"

	// Phase 4 ("Real file storage + gallery + document uploads" - see
	// DESIGN.md's roadmap) below. Naming mirrors the old
	// apiNames.FILES.BUCKET(name) exactly ("fileHandler:{bucket}:{action}"),
	// not a fresh scheme, so existing dev-DB AccessPolicy grants for these
	// strings carry over unchanged.
	FileAlbumsRead      = "fileHandler:albums:read"
	FileAlbumsCreate    = "fileHandler:albums:create"
	FileDocumentsRead   = "fileHandler:documents:read"
	FileDocumentsCreate = "fileHandler:documents:create"
	FileDocumentsDelete = "fileHandler:documents:delete"
	FileFilesRead       = "fileHandler:files:read"
	FileFilesCreate     = "fileHandler:files:create"
	FileFilesDelete     = "fileHandler:files:delete"

	// Phase 5 ("Booking" - see DESIGN.md's roadmap) below. Naming mirrors
	// the old apiNames.BOOKINGS/BOOKABLES crud() groups exactly
	// ("booking_request:*" / "booking_request:bookable:*"), so existing
	// dev-DB AccessPolicy grants for these strings carry over unchanged.
	// No BookableDelete: the old zmodel never had a delete @@allow for
	// Bookable either (create/read/update only) - not replicated as a gap,
	// there's just genuinely no delete operation to gate.
	BookingRequestCreate = "booking_request:create"
	BookingRequestRead   = "booking_request:read"
	BookingRequestUpdate = "booking_request:update"
	BookingRequestDelete = "booking_request:delete"

	BookableCreate = "booking_request:bookable:create"
	BookableRead   = "booking_request:bookable:read"
	BookableUpdate = "booking_request:bookable:update"

	// Phase 7 ("Elections" - see DESIGN.md's roadmap) below. Naming mirrors
	// the old apiNames.ELECTION crud() group exactly - three separate policy
	// strings (unlike GoverningDocument's shared Write), since that's how
	// the live ZModel actually gated create/update/delete individually. No
	// ElectionRead: the old ZModel's @@allow("read", true) makes reads fully
	// public, with no policy ever checked for them - not a gap, there's
	// nothing to gate.
	ElectionCreate = "election:create"
	ElectionUpdate = "election:update"
	ElectionDelete = "election:delete"

	// Phase 8 ("Cafe" - see DESIGN.md's roadmap) below. Naming mirrors the
	// old apiNames.CAFE group exactly - four flat policies, not a crud()
	// group, matching the live ZModel's own shape (CafeShift/
	// CiabattaOfTheWeek's @@allow expressions reference these same four
	// strings directly, not a create/read/update/delete split).
	CafeEditWorkers   = "cafe:edit_workers"
	CafeEditCiabattas = "cafe:edit_ciabattas"
	CafeSeeAllWeeks   = "cafe:see_all_weeks"
	CafeDayManager    = "cafe:day_manager"

	// Phase 10 ("Doors/Salto" - see DESIGN.md's roadmap) below. Naming
	// mirrors the old apiNames.DOOR crud() group exactly
	// ("core:access:door:*"), so existing dev-DB AccessPolicy grants carry
	// over unchanged. No DoorUpdate: the old zmodel's DoorAccessPolicy
	// @@allow("update", ...) existed, but no create/edit-in-place UI ever
	// called it (the admin page only ever created new rows or deleted old
	// ones) - not replicated as a gap, there's nothing real to port.
	DoorRead   = "core:access:door:read"
	DoorCreate = "core:access:door:create"
	DoorDelete = "core:access:door:delete"
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
		SongCreate,
		SongRead,
		SongUpdate,
		SongDelete,
		AlertManage,
		MarkdownCreate,
		MarkdownUpdate,
		GoverningDocumentRead,
		GoverningDocumentWrite,
		FileAlbumsRead,
		FileAlbumsCreate,
		FileDocumentsRead,
		FileDocumentsCreate,
		FileDocumentsDelete,
		FileFilesRead,
		FileFilesCreate,
		FileFilesDelete,
		BookingRequestCreate,
		BookingRequestRead,
		BookingRequestUpdate,
		BookingRequestDelete,
		BookableCreate,
		BookableRead,
		BookableUpdate,
		ElectionCreate,
		ElectionUpdate,
		ElectionDelete,
		CafeEditWorkers,
		CafeEditCiabattas,
		CafeSeeAllWeeks,
		CafeDayManager,
		DoorRead,
		DoorCreate,
		DoorDelete,
	}
}
