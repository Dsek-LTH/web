package elections

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// electionRow is the scalar shape every sqlc-generated election-with-
// committee row type shares (ListOpenElectionsRow, GetElectionByIDRow) -
// same adapt-then-convert pattern as internal/committees' committeeRow.
type electionRow struct {
	ID                     pgtype.UUID
	CommitteeID            pgtype.UUID
	MarkdownSv             string
	MarkdownEn             pgtype.Text
	Link                   string
	CreatedAt              pgtype.Timestamptz
	ExpiresAt              pgtype.Timestamptz
	CommitteeNameSv        string
	CommitteeNameEn        pgtype.Text
	CommitteeDarkImageUrl  pgtype.Text
	CommitteeLightImageUrl pgtype.Text
	CommitteeMonoImageUrl  pgtype.Text
}

func toElection(r electionRow, loc string) Election {
	markdownEn := dbutil.TextPtr(r.MarkdownEn)
	committeeNameEn := dbutil.TextPtr(r.CommitteeNameEn)
	return Election{
		ID:          dbutil.UUIDStr(r.ID),
		CommitteeID: dbutil.UUIDStr(r.CommitteeID),
		Committee: apitypes.Committee{
			ID:            dbutil.UUIDStr(r.CommitteeID),
			Name:          dbutil.ResolveName(r.CommitteeNameSv, committeeNameEn, loc),
			NameSv:        r.CommitteeNameSv,
			NameEn:        committeeNameEn,
			DarkImageURL:  dbutil.TextPtr(r.CommitteeDarkImageUrl),
			LightImageURL: dbutil.TextPtr(r.CommitteeLightImageUrl),
			MonoImageURL:  dbutil.TextPtr(r.CommitteeMonoImageUrl),
		},
		Markdown:   dbutil.ResolveName(r.MarkdownSv, markdownEn, loc),
		MarkdownSv: r.MarkdownSv,
		MarkdownEn: markdownEn,
		Link:       r.Link,
		CreatedAt:  r.CreatedAt.Time,
		ExpiresAt:  r.ExpiresAt.Time,
	}
}
