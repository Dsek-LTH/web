// Package committees is the directory-foundation committee/position/mandate
// domain, plus the board (ListBoard), whose staben redaction asks
// internal/nollning.
package committees

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/locale"
	"github.com/dsek-lth/web/apps/api/internal/nollning"
	"github.com/dsek-lth/web/apps/api/internal/sanitize"
)

var (
	ErrNotFound     = errors.New("committees: not found")
	ErrInvalidInput = errors.New("committees: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Service struct {
	queries   *db.Queries
	nollning  *nollning.Service
	sanitizer *sanitize.Policy
}

// nollning is used by ListBoard to know which committee's positions to
// redact from viewers without apinames.MemberSeeStaben - no import-cycle risk the way internal/auth's
// dependency on internal/nollning has, since internal/nollning never
// imports this package.
func NewService(dbtx db.DBTX, nollningSvc *nollning.Service) *Service {
	return &Service{
		queries:   db.New(dbtx),
		nollning:  nollningSvc,
		sanitizer: sanitize.UGC(),
	}
}

func (s *Service) ListCommittees(ctx context.Context) ([]Committee, error) {
	rows, err := s.queries.ListCommitteesWithCounts(ctx)
	if err != nil {
		return nil, fmt.Errorf("list committees: %w", err)
	}
	loc := locale.FromContext(ctx)
	committees := make([]Committee, len(rows))
	for i, r := range rows {
		mandateCount, memberCount := r.MandateCount, r.MemberCount
		committees[i] = toCommittee(committeeRow{
			ID:                r.ID,
			NameSv:            r.NameSv,
			NameEn:            r.NameEn,
			ShortName:         r.ShortName,
			DescriptionSv:     r.DescriptionSv,
			DescriptionEn:     r.DescriptionEn,
			DarkImageUrl:      r.DarkImageUrl,
			LightImageUrl:     r.LightImageUrl,
			MonoImageUrl:      r.MonoImageUrl,
			SymbolUrl:         r.SymbolUrl,
			BannerUrl:         r.BannerUrl,
			IsBannerTextLight: &r.IsBannerTextLight,
			PreviewUrl:        r.PreviewUrl,
			MandateCount:      &mandateCount,
			MemberCount:       &memberCount,
		}, loc)
	}
	return committees, nil
}

// GetByShortName fetches a committee's full detail: positions active-or-
// with-mandates-in-year (server-side pre-sorted per the hand-curated
// ordering table), each with that year's mandates and email aliases, plus
// about/links markdown.
func (s *Service) GetByShortName(
	ctx context.Context,
	shortName string,
	year int32,
) (*CommitteeDetail, error) {
	row, err := s.queries.GetCommitteeByShortName(ctx, dbutil.ToText(&shortName))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get committee: %w", err)
	}
	loc := locale.FromContext(ctx)

	positionRows, err := s.queries.ListPositions(ctx)
	if err != nil {
		return nil, fmt.Errorf("list positions: %w", err)
	}

	positions := make([]PositionDetail, 0, len(positionRows))
	for _, p := range positionRows {
		if !p.CommitteeID.Valid || dbutil.UUIDStr(p.CommitteeID) != dbutil.UUIDStr(row.ID) {
			continue
		}
		mandates, err := s.mandatesForPosition(ctx, p.ID, year)
		if err != nil {
			return nil, err
		}
		if !p.Active && len(mandates) == 0 {
			continue
		}
		aliases, err := s.emailAliasesForPosition(ctx, p.ID)
		if err != nil {
			return nil, err
		}
		position := toPosition(positionRow{
			ID:            p.ID,
			NameSv:        p.NameSv,
			NameEn:        p.NameEn,
			CommitteeID:   p.CommitteeID,
			Email:         p.Email,
			Active:        p.Active,
			BoardMember:   p.BoardMember,
			DescriptionSv: p.DescriptionSv,
			DescriptionEn: p.DescriptionEn,
			StartMonth:    p.StartMonth,
			EndMonth:      p.EndMonth,
		}, loc)
		position.EmailAliases = aliases
		positions = append(positions, PositionDetail{
			Position: position,
			Year:     year,
			Mandates: mandates,
		})
	}
	shortNameStr := dbutil.StringOr(dbutil.TextPtr(row.ShortName), shortName)
	SortCommitteePositions(positions, shortNameStr, func(p PositionDetail) string { return p.ID })

	about, err := s.markdown(ctx, shortNameStr)
	if err != nil {
		return nil, err
	}
	links, err := s.markdown(ctx, shortNameStr+"_links")
	if err != nil {
		return nil, err
	}

	mandateCount, memberCount := row.MandateCount, row.MemberCount
	return &CommitteeDetail{
		Committee: toCommittee(committeeRow{
			ID:                row.ID,
			NameSv:            row.NameSv,
			NameEn:            row.NameEn,
			ShortName:         row.ShortName,
			DescriptionSv:     row.DescriptionSv,
			DescriptionEn:     row.DescriptionEn,
			DarkImageUrl:      row.DarkImageUrl,
			LightImageUrl:     row.LightImageUrl,
			MonoImageUrl:      row.MonoImageUrl,
			SymbolUrl:         row.SymbolUrl,
			BannerUrl:         row.BannerUrl,
			IsBannerTextLight: &row.IsBannerTextLight,
			PreviewUrl:        row.PreviewUrl,
			MandateCount:      &mandateCount,
			MemberCount:       &memberCount,
		}, loc),
		Year:          year,
		Positions:     positions,
		AboutMarkdown: about,
		LinksMarkdown: links,
	}, nil
}

func (s *Service) markdown(ctx context.Context, name string) (CommitteeMarkdown, error) {
	row, err := s.queries.GetMarkdown(ctx, name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CommitteeMarkdown{}, nil
		}
		return CommitteeMarkdown{}, fmt.Errorf("get markdown %q: %w", name, err)
	}
	markdownEn := dbutil.TextPtr(row.MarkdownEn)
	return CommitteeMarkdown{
		Markdown:   dbutil.ResolveName(row.MarkdownSv, markdownEn, locale.FromContext(ctx)),
		MarkdownSv: row.MarkdownSv,
		MarkdownEn: markdownEn,
	}, nil
}

func (s *Service) UpdateCommittee(
	ctx context.Context,
	shortName string,
	in CommitteeInput,
) (*Committee, error) {
	if err := auth.Require(ctx, apinames.CommitteeUpdate); err != nil {
		return nil, err
	}
	row, err := s.queries.UpdateCommittee(ctx, db.UpdateCommitteeParams{
		ShortName:         dbutil.ToText(&shortName),
		NameSv:            in.NameSv,
		NameEn:            dbutil.ToText(in.NameEn),
		DescriptionSv:     dbutil.ToText(in.DescriptionSv),
		DescriptionEn:     dbutil.ToText(in.DescriptionEn),
		DarkImageUrl:      dbutil.ToText(in.DarkImageURL),
		LightImageUrl:     dbutil.ToText(in.LightImageURL),
		MonoImageUrl:      dbutil.ToText(in.MonoImageURL),
		SymbolUrl:         dbutil.ToText(in.SymbolURL),
		BannerUrl:         dbutil.ToText(in.BannerURL),
		IsBannerTextLight: in.IsBannerTextLight,
		PreviewUrl:        dbutil.ToText(in.PreviewURL),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update committee: %w", err)
	}
	committee := toCommittee(committeeRow{
		ID:                row.ID,
		NameSv:            row.NameSv,
		NameEn:            row.NameEn,
		ShortName:         row.ShortName,
		DescriptionSv:     row.DescriptionSv,
		DescriptionEn:     row.DescriptionEn,
		DarkImageUrl:      row.DarkImageUrl,
		LightImageUrl:     row.LightImageUrl,
		MonoImageUrl:      row.MonoImageUrl,
		SymbolUrl:         row.SymbolUrl,
		BannerUrl:         row.BannerUrl,
		IsBannerTextLight: &row.IsBannerTextLight,
		PreviewUrl:        row.PreviewUrl,
	}, locale.FromContext(ctx))
	return &committee, nil
}

func (s *Service) UpdateCommitteeMarkdown(
	ctx context.Context,
	shortName string,
	in CommitteeMarkdownInput,
) (*CommitteeMarkdown, error) {
	return s.upsertMarkdown(ctx, shortName, in)
}

func (s *Service) UpdateCommitteeLinks(
	ctx context.Context,
	shortName string,
	in CommitteeMarkdownInput,
) (*CommitteeMarkdown, error) {
	return s.upsertMarkdown(ctx, shortName+"_links", in)
}

func (s *Service) upsertMarkdown(
	ctx context.Context,
	name string,
	in CommitteeMarkdownInput,
) (*CommitteeMarkdown, error) {
	if err := auth.Require(ctx, apinames.CommitteeUpdate); err != nil {
		return nil, err
	}
	row, err := s.queries.UpsertMarkdown(ctx, db.UpsertMarkdownParams{
		Name: name,
		// Rendered with {@html}, so sanitized like every other markdown.
		MarkdownSv: s.sanitizer.Sanitize(in.MarkdownSv),
		MarkdownEn: dbutil.ToText(s.sanitizer.SanitizePtr(in.MarkdownEn)),
	})
	if err != nil {
		return nil, fmt.Errorf("upsert markdown %q: %w", name, err)
	}
	markdownEn := dbutil.TextPtr(row.MarkdownEn)
	return &CommitteeMarkdown{
		Markdown:   dbutil.ResolveName(row.MarkdownSv, markdownEn, locale.FromContext(ctx)),
		MarkdownSv: row.MarkdownSv,
		MarkdownEn: markdownEn,
	}, nil
}

func (s *Service) ListPositions(ctx context.Context) ([]Position, error) {
	rows, err := s.queries.ListPositions(ctx)
	if err != nil {
		return nil, fmt.Errorf("list positions: %w", err)
	}
	loc := locale.FromContext(ctx)
	positions := make([]Position, len(rows))
	for i, p := range rows {
		positions[i] = toPosition(positionRow{
			ID:            p.ID,
			NameSv:        p.NameSv,
			NameEn:        p.NameEn,
			CommitteeID:   p.CommitteeID,
			Email:         p.Email,
			Active:        p.Active,
			BoardMember:   p.BoardMember,
			DescriptionSv: p.DescriptionSv,
			DescriptionEn: p.DescriptionEn,
			StartMonth:    p.StartMonth,
			EndMonth:      p.EndMonth,
		}, loc)
	}
	return positions, nil
}

// ListBoard returns every board-flagged, active position with its current
// holder, sorted per the hand-curated board display order (ordering.go) -
// backs GET /board, replacing board/+page.server.ts's own query+merge.
//
// Redaction: a position belonging to the current nollning season's
// organizing committee is omitted unless the caller holds
// apinames.MemberSeeStaben - outside any active season (or once nollning
// has no organizing committee configured) internal/nollning.
// InjectStabenPolicy has already granted everyone that policy by default,
// so this is a no-op filter then. Replaces the old TS board page's
// `position.id.startsWith("dsek.noll")` hack with a real committee_id
// comparison.
func (s *Service) ListBoard(ctx context.Context) ([]BoardPosition, error) {
	rows, err := s.queries.ListBoard(ctx)
	if err != nil {
		return nil, fmt.Errorf("list board: %w", err)
	}

	season, err := s.nollning.Current(ctx)
	if err != nil {
		return nil, fmt.Errorf("get current nollning season: %w", err)
	}
	var organizingCommitteeID *string
	if season != nil {
		organizingCommitteeID = season.OrganizingCommitteeID
	}
	canSeeStaben := false
	if identity, ok := auth.FromContext(ctx); ok {
		canSeeStaben = identity.Has(apinames.MemberSeeStaben)
	}

	loc := locale.FromContext(ctx)
	positions := make([]BoardPosition, 0, len(rows))
	for _, r := range rows {
		position := toPosition(positionRow{
			ID:            r.ID,
			NameSv:        r.NameSv,
			NameEn:        r.NameEn,
			CommitteeID:   r.CommitteeID,
			Email:         r.Email,
			Active:        r.Active,
			BoardMember:   r.BoardMember,
			DescriptionSv: r.DescriptionSv,
			DescriptionEn: r.DescriptionEn,
			StartMonth:    r.StartMonth,
			EndMonth:      r.EndMonth,
		}, loc)

		if !canSeeStaben && organizingCommitteeID != nil &&
			position.CommitteeID != nil && *position.CommitteeID == *organizingCommitteeID {
			continue
		}

		bp := BoardPosition{Position: position}
		if r.MemberID.Valid {
			bp.Member = &Member{
				ID:             dbutil.UUIDStr(r.MemberID),
				StudentID:      dbutil.TextPtr(r.StudentID),
				FirstName:      dbutil.TextPtr(r.FirstName),
				LastName:       dbutil.TextPtr(r.LastName),
				Nickname:       dbutil.TextPtr(r.Nickname),
				PicturePath:    dbutil.TextPtr(r.PicturePath),
				ClassYear:      dbutil.Int4Ptr(r.ClassYear),
				ClassProgramme: dbutil.TextPtr(r.ClassProgramme),
			}
		}
		positions = append(positions, bp)
	}

	SortBoardPositions(positions, func(bp BoardPosition) string { return bp.Position.ID })
	return positions, nil
}

// GetPosition returns a position's full (unscoped, not year-filtered)
// mandate history - the position detail page groups it client-side by
// year for historical study-year statistics, unlike the committee detail
// page's single-year view (GetByShortName). Staben's mandates are left out
// for callers who may not see staben (nollning.StabenView), here and on
// the committee page.
func (s *Service) GetPosition(ctx context.Context, id string) (*PositionDetail, error) {
	row, err := s.queries.GetPosition(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get position: %w", err)
	}
	loc := locale.FromContext(ctx)

	mandateRows, err := s.queries.ListAllMandatesForPosition(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("list mandates for position: %w", err)
	}
	staben := nollning.StabenViewFor(ctx)
	mandates := make([]Mandate, 0, len(mandateRows))
	for _, m := range mandateRows {
		if staben.HidesMandate(id, dbutil.UUIDStr(m.MemberID)) {
			continue
		}
		mandates = append(mandates, Mandate{
			ID:        dbutil.UUIDStr(m.ID),
			StartDate: dbutil.DatePtr(m.StartDate),
			EndDate:   dbutil.DatePtr(m.EndDate),
			Member: &Member{
				ID:             dbutil.UUIDStr(m.MemberID),
				StudentID:      dbutil.TextPtr(m.StudentID),
				FirstName:      dbutil.TextPtr(m.FirstName),
				Nickname:       dbutil.TextPtr(m.Nickname),
				LastName:       dbutil.TextPtr(m.LastName),
				PicturePath:    dbutil.TextPtr(m.PicturePath),
				ClassYear:      dbutil.Int4Ptr(m.ClassYear),
				ClassProgramme: dbutil.TextPtr(m.ClassProgramme),
			},
		})
	}

	aliases, err := s.emailAliasesForPosition(ctx, id)
	if err != nil {
		return nil, err
	}

	var committee *Committee
	if row.CommitteeID.Valid {
		// Only name/shortName are joined by GetPosition's query (see its SQL
		// doc comment) - the rest of committeeRow's fields are left at their
		// zero value, which toCommittee already treats the same as "not
		// fetched" (dbutil.TextPtr on an invalid pgtype.Text is nil).
		c := toCommittee(committeeRow{
			ID:        row.CommitteeID,
			NameSv:    row.CommitteeNameSv.String,
			NameEn:    row.CommitteeNameEn,
			ShortName: row.CommitteeShortName,
		}, loc)
		committee = &c
	}

	position := toPosition(positionRow{
		ID:            row.ID,
		NameSv:        row.NameSv,
		NameEn:        row.NameEn,
		CommitteeID:   row.CommitteeID,
		Email:         row.Email,
		Active:        row.Active,
		BoardMember:   row.BoardMember,
		DescriptionSv: row.DescriptionSv,
		DescriptionEn: row.DescriptionEn,
		StartMonth:    row.StartMonth,
		EndMonth:      row.EndMonth,
	}, loc)
	position.Committee = committee
	position.EmailAliases = aliases

	return &PositionDetail{
		Position: position,
		Mandates: mandates,
	}, nil
}

func (s *Service) UpdatePosition(
	ctx context.Context,
	id string,
	in PositionInput,
) (*Position, error) {
	if err := auth.Require(ctx, apinames.PositionUpdate); err != nil {
		return nil, err
	}
	row, err := s.queries.UpdatePosition(ctx, db.UpdatePositionParams{
		ID:     id,
		NameSv: in.NameSv,
		NameEn: dbutil.ToText(in.NameEn),
		Email:  dbutil.ToText(in.Email),
		// Position descriptions may contain HTML since upstream #1363
		// (rendered through MarkdownBody), so they're sanitized here, the
		// way upstream's action DOMPurified them.
		DescriptionSv: dbutil.ToText(s.sanitizePtr(in.DescriptionSv)),
		DescriptionEn: dbutil.ToText(s.sanitizePtr(in.DescriptionEn)),
		Active:        in.Active,
		BoardMember:   in.BoardMember,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update position: %w", err)
	}
	position := toPosition(positionRow{
		ID:            row.ID,
		NameSv:        row.NameSv,
		NameEn:        row.NameEn,
		CommitteeID:   row.CommitteeID,
		Email:         row.Email,
		Active:        row.Active,
		BoardMember:   row.BoardMember,
		DescriptionSv: row.DescriptionSv,
		DescriptionEn: row.DescriptionEn,
		StartMonth:    row.StartMonth,
		EndMonth:      row.EndMonth,
	}, locale.FromContext(ctx))
	return &position, nil
}

func (s *Service) mandatesForPosition(
	ctx context.Context,
	positionID string,
	year int32,
) ([]Mandate, error) {
	rows, err := s.queries.ListMandatesForPosition(ctx, db.ListMandatesForPositionParams{
		PositionID: positionID,
		Year:       year,
	})
	if err != nil {
		return nil, fmt.Errorf("list mandates for position: %w", err)
	}
	staben := nollning.StabenViewFor(ctx)
	mandates := make([]Mandate, 0, len(rows))
	for _, m := range rows {
		if staben.HidesMandate(positionID, dbutil.UUIDStr(m.MemberID)) {
			continue
		}
		mandates = append(mandates, Mandate{
			ID:        dbutil.UUIDStr(m.ID),
			StartDate: dbutil.DatePtr(m.StartDate),
			EndDate:   dbutil.DatePtr(m.EndDate),
			Member: &Member{
				ID:          dbutil.UUIDStr(m.MemberID),
				StudentID:   dbutil.TextPtr(m.StudentID),
				FirstName:   dbutil.TextPtr(m.FirstName),
				Nickname:    dbutil.TextPtr(m.Nickname),
				LastName:    dbutil.TextPtr(m.LastName),
				PicturePath: dbutil.TextPtr(m.PicturePath),
			},
		})
	}
	return mandates, nil
}

func (s *Service) emailAliasesForPosition(
	ctx context.Context,
	positionID string,
) ([]string, error) {
	rows, err := s.queries.ListEmailAliasesForPosition(ctx, positionID)
	if err != nil {
		return nil, fmt.Errorf("list email aliases: %w", err)
	}
	aliases := make([]string, len(rows))
	for i, r := range rows {
		aliases[i] = r.Email
	}
	return aliases, nil
}

func (s *Service) CreateMandates(
	ctx context.Context,
	positionID string,
	in MandatesInput,
) ([]Mandate, error) {
	if err := auth.Require(ctx, apinames.MandateCreate); err != nil {
		return nil, err
	}
	startDate, err := dbutil.ParseDate(in.StartDate)
	if err != nil {
		return nil, invalidf("invalid startDate: %v", err)
	}
	endDate, err := dbutil.ParseDate(in.EndDate)
	if err != nil {
		return nil, invalidf("invalid endDate: %v", err)
	}

	mandates := make([]Mandate, 0, len(in.MemberIDs))
	for _, memberIDStr := range in.MemberIDs {
		memberID, err := dbutil.ParseUUID(memberIDStr)
		if err != nil {
			return nil, invalidf("invalid member id: %v", err)
		}
		row, err := s.queries.CreateMandate(ctx, db.CreateMandateParams{
			MemberID:   memberID,
			PositionID: positionID,
			StartDate:  startDate,
			EndDate:    endDate,
		})
		if err != nil {
			return nil, fmt.Errorf("create mandate: %w", err)
		}
		mandates = append(mandates, Mandate{
			ID:        dbutil.UUIDStr(row.ID),
			StartDate: dbutil.DatePtr(row.StartDate),
			EndDate:   dbutil.DatePtr(row.EndDate),
		})
	}
	return mandates, nil
}

func (s *Service) UpdateMandate(
	ctx context.Context,
	id string,
	in MandateDatesInput,
) (*Mandate, error) {
	if err := auth.Require(ctx, apinames.MandateUpdate); err != nil {
		return nil, err
	}
	mandateID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid mandate id: %v", err)
	}
	startDate, err := dbutil.ParseDate(in.StartDate)
	if err != nil {
		return nil, invalidf("invalid startDate: %v", err)
	}
	endDate, err := dbutil.ParseDate(in.EndDate)
	if err != nil {
		return nil, invalidf("invalid endDate: %v", err)
	}
	row, err := s.queries.UpdateMandate(ctx, db.UpdateMandateParams{
		ID:        mandateID,
		StartDate: startDate,
		EndDate:   endDate,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update mandate: %w", err)
	}
	return &Mandate{
		ID:        dbutil.UUIDStr(row.ID),
		StartDate: dbutil.DatePtr(row.StartDate),
		EndDate:   dbutil.DatePtr(row.EndDate),
	}, nil
}

func (s *Service) DeleteMandate(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.MandateDelete); err != nil {
		return err
	}
	mandateID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid mandate id: %v", err)
	}
	if err := s.queries.DeleteMandate(ctx, mandateID); err != nil {
		return fmt.Errorf("delete mandate: %w", err)
	}
	return nil
}

// CurrentYear is a small helper for handlers defaulting the ?year= query
// param, extracted so it's easy to find/replace in tests.
func CurrentYear() int32 {
	return int32(time.Now().Year())
}

func (s *Service) sanitizePtr(p *string) *string {
	if p == nil {
		return nil
	}
	clean := s.sanitizer.Sanitize(*p)
	return &clean
}
