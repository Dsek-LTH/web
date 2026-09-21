package releases

import (
	"context"
	"errors"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Dsek-LTH/ticket-service/internal/db"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, queries: db.New(pool)}
}

func (s *Service) CreateRelease(ctx context.Context, in CreateReleaseInput) (Release, error) {
	eventID, err := parseUUID(in.EventID)
	if err != nil {
		return Release{}, ErrInvalidInput
	}
	if in.Title == "" || in.Quantity <= 0 || in.CreatedBy == "" {
		return Release{}, ErrInvalidInput
	}
	if !in.ClosesAt.After(in.OpensAt) {
		return Release{}, ErrInvalidInput
	}
	if !in.ExpiresAt.After(in.ClosesAt) {
		return Release{}, ErrInvalidInput
	}

	grace := in.GraceWindowSeconds
	if grace == 0 {
		grace = 60
	}
	offer := in.OfferWindowSeconds
	if offer == 0 {
		offer = 300
	}

	r, err := s.queries.CreateRelease(ctx, db.CreateReleaseParams{
		EventID:            eventID,
		Title:              in.Title,
		Description:        in.Description,
		Location:           in.Location,
		Quantity:           int32(in.Quantity),
		OpensAt:            pgtype.Timestamptz{Time: in.OpensAt, Valid: true},
		ClosesAt:           pgtype.Timestamptz{Time: in.ClosesAt, Valid: true},
		ExpiresAt:          pgtype.Timestamptz{Time: in.ExpiresAt, Valid: true},
		GraceWindowSeconds: int32(grace),
		OfferWindowSeconds: int32(offer),
		CreatedBy:          in.CreatedBy,
	})
	if err != nil {
		return Release{}, err
	}
	return toRelease(r), nil
}

// UpdateRelease changes the editable fields of a release. If quantity
// increases and the lottery has already run, the newly freed slots are
// immediately offered to the front of the waitlist, same as a cancellation
// would.
func (s *Service) UpdateRelease(ctx context.Context, releaseID string, in UpdateReleaseInput) (Release, error) {
	var result Release
	err := s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		if in.Title == "" || in.Quantity <= 0 {
			return ErrInvalidInput
		}
		if !in.ClosesAt.After(release.OpensAt.Time) {
			return ErrInvalidInput
		}
		if !release.ExpiresAt.Time.After(in.ClosesAt) {
			return ErrInvalidInput
		}

		claimed, err := q.CountGrantedOrAccepted(ctx, release.ID)
		if err != nil {
			return err
		}
		if int64(in.Quantity) < claimed {
			return ErrInvalidInput
		}

		updated, err := q.UpdateRelease(ctx, db.UpdateReleaseParams{
			ID:          release.ID,
			Title:       in.Title,
			Description: in.Description,
			Location:    in.Location,
			Quantity:    int32(in.Quantity),
			ClosesAt:    pgtype.Timestamptz{Time: in.ClosesAt, Valid: true},
		})
		if err != nil {
			return err
		}

		if release.Status == ReleaseStatusLotteryDone && updated.Quantity > release.Quantity {
			if err := s.promoteWaitlist(ctx, q, updated, int(updated.Quantity-release.Quantity)); err != nil {
				return err
			}
		}

		result = toRelease(updated)
		return nil
	})
	if err != nil {
		return Release{}, err
	}
	return result, nil
}

func (s *Service) GetRelease(ctx context.Context, releaseID string) (Release, error) {
	id, err := parseUUID(releaseID)
	if err != nil {
		return Release{}, ErrInvalidInput
	}
	r, err := s.queries.GetRelease(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Release{}, ErrNotFound
		}
		return Release{}, err
	}
	return toRelease(r), nil
}

// ListReleases returns releases, newest opens_at first. By default, releases
// whose linked event is over are excluded (the public browsing view);
// includeExpired lifts that for admin use, so past events stay reviewable.
func (s *Service) ListReleases(ctx context.Context, includeExpired bool) ([]Release, error) {
	var rows []db.TicketRelease
	var err error
	if includeExpired {
		rows, err = s.queries.ListAllReleases(ctx)
	} else {
		rows, err = s.queries.ListReleases(ctx)
	}
	if err != nil {
		return nil, err
	}
	out := make([]Release, len(rows))
	for i, r := range rows {
		out[i] = toRelease(r)
	}
	return out, nil
}

// ListEntriesForMember returns every queue entry a member has ever had,
// across all releases, newest first - their "my tickets" view.
func (s *Service) ListEntriesForMember(ctx context.Context, memberID string) ([]MemberEntry, error) {
	rows, err := s.queries.ListEntriesForMember(ctx, memberID)
	if err != nil {
		return nil, err
	}
	out := make([]MemberEntry, len(rows))
	for i, r := range rows {
		out[i] = MemberEntry{
			QueueEntry: toQueueEntry(db.TicketQueueEntry{
				ID:             r.ID,
				ReleaseID:      r.ReleaseID,
				MemberID:       r.MemberID,
				Status:         r.Status,
				QueuePosition:  r.QueuePosition,
				OfferExpiresAt: r.OfferExpiresAt,
				RequestedAt:    r.RequestedAt,
				UpdatedAt:      r.UpdatedAt,
			}),
			ReleaseTitle: r.ReleaseTitle,
		}
	}
	return out, nil
}

// ListAcceptedEntriesForRelease returns everyone with a confirmed ticket for
// one release, oldest first - the admin roster.
func (s *Service) ListAcceptedEntriesForRelease(ctx context.Context, releaseID string) ([]QueueEntry, error) {
	id, err := parseUUID(releaseID)
	if err != nil {
		return nil, ErrInvalidInput
	}
	rows, err := s.queries.ListAcceptedEntriesForRelease(ctx, id)
	if err != nil {
		return nil, err
	}
	out := make([]QueueEntry, len(rows))
	for i, r := range rows {
		out[i] = toQueueEntry(r)
	}
	return out, nil
}

func (s *Service) GetCounts(ctx context.Context, releaseID string) (Counts, error) {
	id, err := parseUUID(releaseID)
	if err != nil {
		return Counts{}, ErrInvalidInput
	}
	row, err := s.queries.GetReleaseCounts(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Counts{}, ErrNotFound
		}
		return Counts{}, err
	}
	return Counts{
		Quantity:   int(row.Quantity),
		Claimed:    int(row.Claimed),
		Waitlisted: int(row.Waitlisted),
	}, nil
}

func (s *Service) Status(ctx context.Context, releaseID, memberID string) (QueueEntry, error) {
	id, err := parseUUID(releaseID)
	if err != nil {
		return QueueEntry{}, ErrInvalidInput
	}
	e, err := s.queries.GetQueueEntry(ctx, db.GetQueueEntryParams{ReleaseID: id, MemberID: memberID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return QueueEntry{}, ErrEntryNotFound
		}
		return QueueEntry{}, err
	}
	return toQueueEntry(e), nil
}

// RequestTicket joins the grace-window pool if the lottery for this release
// hasn't run yet, or - once it has - immediately grants a ticket if one is
// free, otherwise appends to the tail of the waitlist. Calling it again for
// the same member is a no-op that just returns their existing entry.
func (s *Service) RequestTicket(ctx context.Context, releaseID, memberID string) (QueueEntry, error) {
	var result db.TicketQueueEntry
	err := s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		if time.Now().Before(release.OpensAt.Time) {
			return ErrNotOpenYet
		}
		if time.Now().After(release.ClosesAt.Time) {
			return ErrClosed
		}

		if release.Status != ReleaseStatusLotteryDone {
			e, err := q.InsertQueueEntry(ctx, db.InsertQueueEntryParams{ReleaseID: release.ID, MemberID: memberID})
			if err != nil {
				return err
			}
			result = e
			return nil
		}

		existing, err := q.GetQueueEntry(ctx, db.GetQueueEntryParams{ReleaseID: release.ID, MemberID: memberID})
		if err == nil {
			result = existing
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		e, err := q.InsertQueueEntry(ctx, db.InsertQueueEntryParams{ReleaseID: release.ID, MemberID: memberID})
		if err != nil {
			return err
		}

		claimed, err := q.CountGrantedOrAccepted(ctx, release.ID)
		if err != nil {
			return err
		}

		if int32(claimed) < release.Quantity {
			offerExpiresAt := offerDeadline(release)
			if err := q.GrantEntry(ctx, db.GrantEntryParams{ID: e.ID, ReleaseID: release.ID, OfferExpiresAt: offerExpiresAt}); err != nil {
				return err
			}
			e.Status = EntryStatusGranted
			e.OfferExpiresAt = offerExpiresAt
		} else {
			waitlisted, err := q.CountWaitlisted(ctx, release.ID)
			if err != nil {
				return err
			}
			position := pgtype.Int4{Int32: int32(waitlisted), Valid: true}
			if err := q.WaitlistEntry(ctx, db.WaitlistEntryParams{ID: e.ID, ReleaseID: release.ID, QueuePosition: position}); err != nil {
				return err
			}
			e.Status = EntryStatusWaitlisted
			e.QueuePosition = position
		}
		result = e
		return nil
	})
	if err != nil {
		return QueueEntry{}, err
	}
	return toQueueEntry(result), nil
}

func (s *Service) Accept(ctx context.Context, releaseID, memberID string) error {
	return s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		rows, err := q.AcceptEntry(ctx, db.AcceptEntryParams{ReleaseID: release.ID, MemberID: memberID})
		if err != nil {
			return err
		}
		if rows == 0 {
			return ErrOfferNotActive
		}
		return nil
	})
}

// Cancel withdraws a member's request, offer, or waitlist spot. If they held
// an active granted-but-unaccepted offer, the freed slot is immediately
// offered to whoever is at the front of the waitlist.
func (s *Service) Cancel(ctx context.Context, releaseID, memberID string) error {
	return s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		entry, err := q.GetQueueEntry(ctx, db.GetQueueEntryParams{ReleaseID: release.ID, MemberID: memberID})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrEntryNotFound
			}
			return err
		}

		rows, err := q.CancelEntry(ctx, db.CancelEntryParams{ReleaseID: release.ID, MemberID: memberID})
		if err != nil {
			return err
		}
		if rows == 0 {
			return ErrEntryNotFound
		}

		if entry.Status == EntryStatusGranted && release.Status == ReleaseStatusLotteryDone {
			return s.promoteWaitlist(ctx, q, release, 1)
		}
		return nil
	})
}

// RunLottery performs the grace-window lottery for a release: pending
// entries are shuffled, the first `quantity` are granted a ticket, the rest
// become an ordered waitlist. Safe to call more than once - a no-op once the
// release has already moved past the "scheduled" phase.
func (s *Service) RunLottery(ctx context.Context, releaseID string) error {
	return s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		if release.Status != ReleaseStatusScheduled {
			return nil
		}

		pending, err := q.ListPendingForUpdate(ctx, release.ID)
		if err != nil {
			return err
		}

		granted, waitlisted := runLottery(rand.New(rand.NewSource(time.Now().UnixNano())), pending, int(release.Quantity))

		offerExpiresAt := offerDeadline(release)
		for _, e := range granted {
			if err := q.GrantEntry(ctx, db.GrantEntryParams{ID: e.ID, ReleaseID: release.ID, OfferExpiresAt: offerExpiresAt}); err != nil {
				return err
			}
		}
		for i, e := range waitlisted {
			position := pgtype.Int4{Int32: int32(i), Valid: true}
			if err := q.WaitlistEntry(ctx, db.WaitlistEntryParams{ID: e.ID, ReleaseID: release.ID, QueuePosition: position}); err != nil {
				return err
			}
		}

		return q.SetReleaseStatus(ctx, db.SetReleaseStatusParams{ID: release.ID, Status: ReleaseStatusLotteryDone})
	})
}

// SweepExpiredOffers expires any granted-but-unaccepted offers past their
// deadline and promotes the same number of entries from the front of the
// waitlist into fresh offers. Called periodically by Scheduler.RunSweepLoop
// for every release that currently has an active offer.
func (s *Service) SweepExpiredOffers(ctx context.Context, releaseID string) error {
	return s.withReleaseLock(ctx, releaseID, func(ctx context.Context, q *db.Queries, release db.TicketRelease) error {
		expired, err := q.ListExpiredGrantedForUpdate(ctx, release.ID)
		if err != nil {
			return err
		}
		for _, e := range expired {
			if err := q.ExpireEntry(ctx, e.ID); err != nil {
				return err
			}
		}
		if len(expired) == 0 {
			return nil
		}
		return s.promoteWaitlist(ctx, q, release, len(expired))
	})
}

// ListScheduledReleases returns releases whose lottery hasn't run yet -
// used at startup to re-arm in-process timers that don't survive a restart.
func (s *Service) ListScheduledReleases(ctx context.Context) ([]Release, error) {
	rows, err := s.queries.ListScheduledReleases(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]Release, len(rows))
	for i, r := range rows {
		out[i] = toRelease(r)
	}
	return out, nil
}

// ListReleaseIDsWithActiveOffers returns releases that currently have at
// least one granted-but-unaccepted offer, i.e. that need an expiry sweep.
func (s *Service) ListReleaseIDsWithActiveOffers(ctx context.Context) ([]string, error) {
	rows, err := s.queries.ListReleasesWithActiveOffers(ctx)
	if err != nil {
		return nil, err
	}
	ids := make([]string, len(rows))
	for i, r := range rows {
		ids[i] = r.ID.String()
	}
	return ids, nil
}

func (s *Service) promoteWaitlist(ctx context.Context, q *db.Queries, release db.TicketRelease, n int) error {
	front, err := q.ListWaitlistFrontForUpdate(ctx, db.ListWaitlistFrontForUpdateParams{ReleaseID: release.ID, Limit: int32(n)})
	if err != nil {
		return err
	}
	if len(front) == 0 {
		return nil
	}
	offerExpiresAt := offerDeadline(release)
	for _, e := range front {
		if err := q.GrantEntry(ctx, db.GrantEntryParams{ID: e.ID, ReleaseID: release.ID, OfferExpiresAt: offerExpiresAt}); err != nil {
			return err
		}
	}
	return q.DecrementWaitlistPositions(ctx, db.DecrementWaitlistPositionsParams{
		ReleaseID:     release.ID,
		QueuePosition: pgtype.Int4{Int32: int32(len(front)), Valid: true},
	})
}

// withReleaseLock runs fn inside a transaction with the release row locked
// via SELECT ... FOR UPDATE, serializing every state change for one release
// through Postgres so overselling is impossible even under a simultaneous
// burst of requests, regardless of how many instances of this service run.
func (s *Service) withReleaseLock(ctx context.Context, releaseID string, fn func(ctx context.Context, q *db.Queries, release db.TicketRelease) error) error {
	id, err := parseUUID(releaseID)
	if err != nil {
		return ErrInvalidInput
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)
	release, err := q.LockRelease(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	if err := fn(ctx, q, release); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func offerDeadline(release db.TicketRelease) pgtype.Timestamptz {
	return pgtype.Timestamptz{
		Time:  time.Now().Add(time.Duration(release.OfferWindowSeconds) * time.Second),
		Valid: true,
	}
}

func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, err
	}
	return u, nil
}

func toRelease(r db.TicketRelease) Release {
	return Release{
		ID:                 r.ID.String(),
		EventID:            r.EventID.String(),
		Title:              r.Title,
		Description:        r.Description,
		Location:           r.Location,
		Quantity:           int(r.Quantity),
		OpensAt:            r.OpensAt.Time,
		ClosesAt:           r.ClosesAt.Time,
		ExpiresAt:          r.ExpiresAt.Time,
		GraceWindowSeconds: int(r.GraceWindowSeconds),
		OfferWindowSeconds: int(r.OfferWindowSeconds),
		Status:             r.Status,
		CreatedBy:          r.CreatedBy,
		CreatedAt:          r.CreatedAt.Time,
	}
}

func toQueueEntry(e db.TicketQueueEntry) QueueEntry {
	out := QueueEntry{
		ID:          e.ID.String(),
		ReleaseID:   e.ReleaseID.String(),
		MemberID:    e.MemberID,
		Status:      e.Status,
		RequestedAt: e.RequestedAt.Time,
		UpdatedAt:   e.UpdatedAt.Time,
	}
	if e.QueuePosition.Valid {
		pos := int(e.QueuePosition.Int32)
		out.QueuePosition = &pos
	}
	if e.OfferExpiresAt.Valid {
		t := e.OfferExpiresAt.Time
		out.OfferExpiresAt = &t
	}
	return out
}
