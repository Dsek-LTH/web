package committees

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// committeeRow is the scalar shape every sqlc-generated committee row type
// shares (ListCommitteesWithCountsRow, GetCommitteeByShortNameRow,
// db.Committee, ...) - sqlc generates a distinct Go struct per query even
// when the columns are identical, so callers adapt their row into this one
// with a trivial field-for-field copy, then call toCommittee once. This is
// the single place Committee's field resolution (Name/Description from
// their Sv/En pairs) lives - see toPosition below for the same pattern,
// and DESIGN.md's note on why this replaced inlining the resolve calls at
// every construction site.
type committeeRow struct {
	ID            pgtype.UUID
	NameSv        string
	NameEn        pgtype.Text
	ShortName     pgtype.Text
	DescriptionSv pgtype.Text
	DescriptionEn pgtype.Text
	DarkImageUrl  pgtype.Text
	LightImageUrl pgtype.Text
	MonoImageUrl  pgtype.Text
	SymbolUrl     pgtype.Text
	BannerUrl     pgtype.Text
	// IsBannerTextLight is a pointer here (unlike the live DB column, which
	// is a plain NOT NULL bool) so a caller that never fetched this column
	// - GetPosition's minimal joined committee sub-object, which only
	// selects name/shortName - can leave it nil and have toCommittee omit
	// it, rather than have it default to a possibly-wrong `false`.
	IsBannerTextLight *bool
	PreviewUrl        pgtype.Text
	// MandateCount/MemberCount are nil for row types that don't compute
	// them (e.g. db.Committee, UpdateCommittee's return) - toCommittee
	// passes nil straight through, matching Committee's own "nil where not
	// populated" convention for these two fields.
	MandateCount *int64
	MemberCount  *int64
}

func toCommittee(r committeeRow, loc string) Committee {
	nameEn := dbutil.TextPtr(r.NameEn)
	return Committee{
		ID:                dbutil.UUIDStr(r.ID),
		Name:              dbutil.ResolveName(r.NameSv, nameEn, loc),
		NameSv:            r.NameSv,
		NameEn:            nameEn,
		ShortName:         dbutil.TextPtr(r.ShortName),
		SymbolURL:         dbutil.TextPtr(r.SymbolUrl),
		Description:       dbutil.ResolveNullableName(r.DescriptionSv, r.DescriptionEn, loc),
		DescriptionSv:     dbutil.TextPtr(r.DescriptionSv),
		DescriptionEn:     dbutil.TextPtr(r.DescriptionEn),
		DarkImageURL:      dbutil.TextPtr(r.DarkImageUrl),
		LightImageURL:     dbutil.TextPtr(r.LightImageUrl),
		MonoImageURL:      dbutil.TextPtr(r.MonoImageUrl),
		BannerURL:         dbutil.TextPtr(r.BannerUrl),
		IsBannerTextLight: r.IsBannerTextLight,
		PreviewURL:        dbutil.TextPtr(r.PreviewUrl),
		MandateCount:      r.MandateCount,
		MemberCount:       r.MemberCount,
	}
}

// positionRow is the scalar shape every sqlc-generated position row type
// shares (ListPositionsRow, GetPositionRow, UpdatePositionRow, ...) - same
// adapt-then-convert pattern as committeeRow above. Committee/EmailAliases
// aren't part of this shape since they're populated conditionally by the
// caller (not every position fetch joins a committee or looks up aliases).
type positionRow struct {
	ID            string
	NameSv        string
	NameEn        pgtype.Text
	CommitteeID   pgtype.UUID
	Email         pgtype.Text
	Active        bool
	BoardMember   bool
	DescriptionSv pgtype.Text
	DescriptionEn pgtype.Text
	StartMonth    int32
	EndMonth      int32
}

func toPosition(r positionRow, loc string) Position {
	nameEn := dbutil.TextPtr(r.NameEn)
	return Position{
		ID:            r.ID,
		Name:          dbutil.ResolveName(r.NameSv, nameEn, loc),
		NameSv:        r.NameSv,
		NameEn:        nameEn,
		CommitteeID:   dbutil.UUIDStrPtr(r.CommitteeID),
		Email:         dbutil.TextPtr(r.Email),
		Active:        &r.Active,
		BoardMember:   &r.BoardMember,
		Description:   dbutil.ResolveNullableName(r.DescriptionSv, r.DescriptionEn, loc),
		DescriptionSv: dbutil.TextPtr(r.DescriptionSv),
		DescriptionEn: dbutil.TextPtr(r.DescriptionEn),
		StartMonth:    &r.StartMonth,
		EndMonth:      &r.EndMonth,
	}
}
