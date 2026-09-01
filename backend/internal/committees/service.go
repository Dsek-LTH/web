// Package committees is the directory-foundation committee/position/mandate
// domain. See backend/DESIGN.md's roadmap "Phase 1: directory foundation"
// for scope - notably, the board page and its SEE_STABEN staben-hiding
// logic are deliberately NOT here, deferred to Phase 2's nollning redesign.
package committees

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
)

var (
	ErrNotFound     = errors.New("committees: not found")
	ErrInvalidInput = errors.New("committees: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// resolveDescription mirrors dbutil.ResolveName, but descriptionSv is
// itself nullable in the DB (unlike name_sv) - nil in, nil out.
func resolveDescription(descriptionSv, descriptionEn pgtype.Text, loc string) *string {
	if !descriptionSv.Valid {
		return nil
	}
	resolved := dbutil.ResolveName(descriptionSv.String, dbutil.TextPtr(descriptionEn), loc)
	return &resolved
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

func (s *Service) ListCommittees(ctx context.Context) ([]Committee, error) {
	rows, err := s.queries.ListCommitteesWithCounts(ctx)
	if err != nil {
		return nil, fmt.Errorf("list committees: %w", err)
	}
	loc := locale.FromContext(ctx)
	committees := make([]Committee, len(rows))
	for i, r := range rows {
		nameEn := dbutil.TextPtr(r.NameEn)
		mandateCount, memberCount := r.MandateCount, r.MemberCount
		committees[i] = Committee{
			ID:                dbutil.UUIDStr(r.ID),
			Name:              dbutil.ResolveName(r.NameSv, nameEn, loc),
			NameSv:            r.NameSv,
			NameEn:            nameEn,
			ShortName:         dbutil.TextPtr(r.ShortName),
			SymbolURL:         dbutil.TextPtr(r.SymbolUrl),
			Description:       resolveDescription(r.DescriptionSv, r.DescriptionEn, loc),
			DescriptionSv:     dbutil.TextPtr(r.DescriptionSv),
			DescriptionEn:     dbutil.TextPtr(r.DescriptionEn),
			DarkImageURL:      dbutil.TextPtr(r.DarkImageUrl),
			LightImageURL:     dbutil.TextPtr(r.LightImageUrl),
			MonoImageURL:      dbutil.TextPtr(r.MonoImageUrl),
			BannerURL:         dbutil.TextPtr(r.BannerUrl),
			IsBannerTextLight: &r.IsBannerTextLight,
			PreviewURL:        dbutil.TextPtr(r.PreviewUrl),
			MandateCount:      &mandateCount,
			MemberCount:       &memberCount,
		}
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
		nameEn := dbutil.TextPtr(p.NameEn)
		positions = append(positions, PositionDetail{
			Position: Position{
				ID:            p.ID,
				Name:          dbutil.ResolveName(p.NameSv, nameEn, loc),
				NameSv:        p.NameSv,
				NameEn:        nameEn,
				CommitteeID:   dbutil.UUIDStrPtr(p.CommitteeID),
				Email:         dbutil.TextPtr(p.Email),
				Active:        &p.Active,
				BoardMember:   &p.BoardMember,
				Description:   resolveDescription(p.DescriptionSv, p.DescriptionEn, loc),
				DescriptionSv: dbutil.TextPtr(p.DescriptionSv),
				DescriptionEn: dbutil.TextPtr(p.DescriptionEn),
				StartMonth:    &p.StartMonth,
				EndMonth:      &p.EndMonth,
				EmailAliases:  aliases,
			},
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

	nameEn := dbutil.TextPtr(row.NameEn)
	mandateCount, memberCount := row.MandateCount, row.MemberCount
	return &CommitteeDetail{
		Committee: Committee{
			ID:                dbutil.UUIDStr(row.ID),
			Name:              dbutil.ResolveName(row.NameSv, nameEn, loc),
			NameSv:            row.NameSv,
			NameEn:            nameEn,
			ShortName:         dbutil.TextPtr(row.ShortName),
			SymbolURL:         dbutil.TextPtr(row.SymbolUrl),
			Description:       resolveDescription(row.DescriptionSv, row.DescriptionEn, loc),
			DescriptionSv:     dbutil.TextPtr(row.DescriptionSv),
			DescriptionEn:     dbutil.TextPtr(row.DescriptionEn),
			DarkImageURL:      dbutil.TextPtr(row.DarkImageUrl),
			LightImageURL:     dbutil.TextPtr(row.LightImageUrl),
			MonoImageURL:      dbutil.TextPtr(row.MonoImageUrl),
			BannerURL:         dbutil.TextPtr(row.BannerUrl),
			IsBannerTextLight: &row.IsBannerTextLight,
			PreviewURL:        dbutil.TextPtr(row.PreviewUrl),
			MandateCount:      &mandateCount,
			MemberCount:       &memberCount,
		},
		Year:          year,
		Positions:     positions,
		AboutMarkdown: about,
		LinksMarkdown: links,
	}, nil
}

func (s *Service) markdown(ctx context.Context, name string) (MarkdownContent, error) {
	row, err := s.queries.GetMarkdown(ctx, name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return MarkdownContent{}, nil
		}
		return MarkdownContent{}, fmt.Errorf("get markdown %q: %w", name, err)
	}
	markdownEn := dbutil.TextPtr(row.MarkdownEn)
	return MarkdownContent{
		Markdown:   dbutil.ResolveName(row.MarkdownSv, markdownEn, locale.FromContext(ctx)),
		MarkdownSv: row.MarkdownSv,
		MarkdownEn: markdownEn,
	}, nil
}

func (s *Service) UpdateCommittee(
	ctx context.Context,
	shortName string,
	in UpdateCommitteeInput,
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
	loc := locale.FromContext(ctx)
	nameEn := dbutil.TextPtr(row.NameEn)
	return &Committee{
		ID:                dbutil.UUIDStr(row.ID),
		Name:              dbutil.ResolveName(row.NameSv, nameEn, loc),
		NameSv:            row.NameSv,
		NameEn:            nameEn,
		ShortName:         dbutil.TextPtr(row.ShortName),
		SymbolURL:         dbutil.TextPtr(row.SymbolUrl),
		Description:       resolveDescription(row.DescriptionSv, row.DescriptionEn, loc),
		DescriptionSv:     dbutil.TextPtr(row.DescriptionSv),
		DescriptionEn:     dbutil.TextPtr(row.DescriptionEn),
		DarkImageURL:      dbutil.TextPtr(row.DarkImageUrl),
		LightImageURL:     dbutil.TextPtr(row.LightImageUrl),
		MonoImageURL:      dbutil.TextPtr(row.MonoImageUrl),
		BannerURL:         dbutil.TextPtr(row.BannerUrl),
		IsBannerTextLight: &row.IsBannerTextLight,
		PreviewURL:        dbutil.TextPtr(row.PreviewUrl),
	}, nil
}

func (s *Service) UpdateCommitteeMarkdown(
	ctx context.Context,
	shortName string,
	in UpdateMarkdownInput,
) (*MarkdownContent, error) {
	return s.upsertMarkdown(ctx, shortName, in)
}

func (s *Service) UpdateCommitteeLinks(
	ctx context.Context,
	shortName string,
	in UpdateMarkdownInput,
) (*MarkdownContent, error) {
	return s.upsertMarkdown(ctx, shortName+"_links", in)
}

func (s *Service) upsertMarkdown(
	ctx context.Context,
	name string,
	in UpdateMarkdownInput,
) (*MarkdownContent, error) {
	if err := auth.Require(ctx, apinames.CommitteeUpdate); err != nil {
		return nil, err
	}
	row, err := s.queries.UpsertMarkdown(ctx, db.UpsertMarkdownParams{
		Name:       name,
		MarkdownSv: in.MarkdownSv,
		MarkdownEn: dbutil.ToText(in.MarkdownEn),
	})
	if err != nil {
		return nil, fmt.Errorf("upsert markdown %q: %w", name, err)
	}
	markdownEn := dbutil.TextPtr(row.MarkdownEn)
	return &MarkdownContent{
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
		nameEn := dbutil.TextPtr(p.NameEn)
		positions[i] = Position{
			ID:            p.ID,
			Name:          dbutil.ResolveName(p.NameSv, nameEn, loc),
			NameSv:        p.NameSv,
			NameEn:        nameEn,
			CommitteeID:   dbutil.UUIDStrPtr(p.CommitteeID),
			Email:         dbutil.TextPtr(p.Email),
			Active:        &p.Active,
			BoardMember:   &p.BoardMember,
			Description:   resolveDescription(p.DescriptionSv, p.DescriptionEn, loc),
			DescriptionSv: dbutil.TextPtr(p.DescriptionSv),
			DescriptionEn: dbutil.TextPtr(p.DescriptionEn),
			StartMonth:    &p.StartMonth,
			EndMonth:      &p.EndMonth,
		}
	}
	return positions, nil
}

// GetPosition returns a position's full (unscoped, not year-filtered)
// mandate history - the position detail page groups it client-side by
// year for historical study-year statistics, unlike the committee detail
// page's single-year view (GetByShortName).
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
	mandates := make([]Mandate, len(mandateRows))
	for i, m := range mandateRows {
		mandates[i] = Mandate{
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
		}
	}

	aliases, err := s.emailAliasesForPosition(ctx, id)
	if err != nil {
		return nil, err
	}

	var committee *Committee
	if row.CommitteeID.Valid {
		committeeNameEn := dbutil.TextPtr(row.CommitteeNameEn)
		committee = &Committee{
			ID:        dbutil.UUIDStr(row.CommitteeID),
			Name:      dbutil.ResolveName(row.CommitteeNameSv.String, committeeNameEn, loc),
			NameSv:    row.CommitteeNameSv.String,
			NameEn:    committeeNameEn,
			ShortName: dbutil.TextPtr(row.CommitteeShortName),
		}
	}

	nameEn := dbutil.TextPtr(row.NameEn)
	return &PositionDetail{
		Position: Position{
			ID:            row.ID,
			Name:          dbutil.ResolveName(row.NameSv, nameEn, loc),
			NameSv:        row.NameSv,
			NameEn:        nameEn,
			CommitteeID:   dbutil.UUIDStrPtr(row.CommitteeID),
			Committee:     committee,
			Email:         dbutil.TextPtr(row.Email),
			Active:        &row.Active,
			BoardMember:   &row.BoardMember,
			Description:   resolveDescription(row.DescriptionSv, row.DescriptionEn, loc),
			DescriptionSv: dbutil.TextPtr(row.DescriptionSv),
			DescriptionEn: dbutil.TextPtr(row.DescriptionEn),
			StartMonth:    &row.StartMonth,
			EndMonth:      &row.EndMonth,
			EmailAliases:  aliases,
		},
		Mandates: mandates,
	}, nil
}

func (s *Service) UpdatePosition(
	ctx context.Context,
	id string,
	in UpdatePositionInput,
) (*Position, error) {
	if err := auth.Require(ctx, apinames.PositionUpdate); err != nil {
		return nil, err
	}
	row, err := s.queries.UpdatePosition(ctx, db.UpdatePositionParams{
		ID:            id,
		NameSv:        in.NameSv,
		NameEn:        dbutil.ToText(in.NameEn),
		Email:         dbutil.ToText(in.Email),
		DescriptionSv: dbutil.ToText(in.DescriptionSv),
		DescriptionEn: dbutil.ToText(in.DescriptionEn),
		Active:        in.Active,
		BoardMember:   in.BoardMember,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update position: %w", err)
	}
	loc := locale.FromContext(ctx)
	nameEn := dbutil.TextPtr(row.NameEn)
	return &Position{
		ID:            row.ID,
		Name:          dbutil.ResolveName(row.NameSv, nameEn, loc),
		NameSv:        row.NameSv,
		NameEn:        nameEn,
		CommitteeID:   dbutil.UUIDStrPtr(row.CommitteeID),
		Email:         dbutil.TextPtr(row.Email),
		Active:        &row.Active,
		BoardMember:   &row.BoardMember,
		Description:   resolveDescription(row.DescriptionSv, row.DescriptionEn, loc),
		DescriptionSv: dbutil.TextPtr(row.DescriptionSv),
		DescriptionEn: dbutil.TextPtr(row.DescriptionEn),
		StartMonth:    &row.StartMonth,
		EndMonth:      &row.EndMonth,
	}, nil
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
	mandates := make([]Mandate, len(rows))
	for i, m := range rows {
		mandates[i] = Mandate{
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
		}
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
	in CreateMandateInput,
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
	in UpdateMandateInput,
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
