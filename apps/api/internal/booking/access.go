package booking

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

// Door access for bookings (upstream #1184, "bookings: grant access"): a
// request names doors and members; accepting it grants each member
// access to each door for the booking's window widened by
// doorAccessBuffer on both sides, recorded as door_access_policies rows
// tagged with the request's id. Rejecting (or re-accepting) clears those
// rows first, and deleting the request cascades them away.
const doorAccessBuffer = time.Hour

// ListDoors lists the doors a booking can ask access for - every door, by
// name and display name only. Anyone who may create a booking request may
// list them (upstream read them past the door:read policy for the same
// reason); the door access policies themselves stay behind door:read.
func (s *Service) ListDoors(ctx context.Context) ([]BookingDoor, error) {
	if err := auth.Require(ctx, apinames.BookingRequestCreate); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListDoorsForBooking(ctx)
	if err != nil {
		return nil, fmt.Errorf("list doors: %w", err)
	}
	doors := make([]BookingDoor, len(rows))
	for i, r := range rows {
		doors[i] = BookingDoor{Name: r.Name, VerboseName: r.VerboseName}
	}
	return doors, nil
}

// setAccess replaces a request's requested doors and members, after
// checking every door and member exists.
func (s *Service) setAccess(ctx context.Context, id pgtype.UUID, in BookingAccessInput) error {
	doorNames := uniqueStrings(in.AccessDoors)
	memberIDs, err := dbutil.ParseUUIDs(uniqueStrings(in.AccessMemberIDs))
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}
	if len(doorNames) > 0 {
		n, err := s.queries.CountDoorsByName(ctx, doorNames)
		if err != nil {
			return fmt.Errorf("look up doors: %w", err)
		}
		if int(n) != len(doorNames) {
			return invalidf("unknown door")
		}
	}
	if len(memberIDs) > 0 {
		n, err := s.queries.CountMembersByID(ctx, memberIDs)
		if err != nil {
			return fmt.Errorf("look up members: %w", err)
		}
		if int(n) != len(memberIDs) {
			return invalidf("unknown member")
		}
	}

	if err := s.queries.ClearBookingRequestAccessDoors(ctx, id); err != nil {
		return fmt.Errorf("clear access doors: %w", err)
	}
	if err := s.queries.ClearBookingRequestAccessMembers(ctx, id); err != nil {
		return fmt.Errorf("clear access members: %w", err)
	}
	if len(doorNames) > 0 {
		if err := s.queries.AddBookingRequestAccessDoors(ctx, db.AddBookingRequestAccessDoorsParams{
			ID: id, DoorNames: doorNames,
		}); err != nil {
			return fmt.Errorf("add access doors: %w", err)
		}
	}
	if len(memberIDs) > 0 {
		if err := s.queries.AddBookingRequestAccessMembers(
			ctx,
			db.AddBookingRequestAccessMembersParams{
				ID: id, MemberIds: memberIDs,
			},
		); err != nil {
			return fmt.Errorf("add access members: %w", err)
		}
	}
	return nil
}

// grantDoorAccess replaces the door policies granted for this request
// with one per requested door and member.
func (s *Service) grantDoorAccess(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.ClearBookingDoorAccess(ctx, id); err != nil {
		return fmt.Errorf("clear booking door access: %w", err)
	}
	if err := s.queries.GrantBookingDoorAccess(ctx, db.GrantBookingDoorAccessParams{
		ID:     id,
		Buffer: pgtype.Interval{Microseconds: doorAccessBuffer.Microseconds(), Valid: true},
	}); err != nil {
		return fmt.Errorf("grant booking door access: %w", err)
	}
	return nil
}

// attachAccess fills in each request's AccessDoors/AccessMembers.
func (s *Service) attachAccess(ctx context.Context, requests []*BookingRequest) error {
	if len(requests) == 0 {
		return nil
	}
	ids := make([]pgtype.UUID, 0, len(requests))
	byID := make(map[string]*BookingRequest, len(requests))
	for _, r := range requests {
		r.AccessDoors = []BookingDoor{}
		r.AccessMembers = []apitypes.Member{}
		id, err := dbutil.ParseUUID(r.ID)
		if err != nil {
			return fmt.Errorf("parse booking request id: %w", err)
		}
		ids = append(ids, id)
		byID[r.ID] = r
	}

	doors, err := s.queries.ListAccessDoorsForBookingRequests(ctx, ids)
	if err != nil {
		return fmt.Errorf("list access doors: %w", err)
	}
	for _, d := range doors {
		r := byID[dbutil.UUIDStr(d.BookingRequestID)]
		r.AccessDoors = append(r.AccessDoors, BookingDoor{Name: d.Name, VerboseName: d.VerboseName})
	}

	members, err := s.queries.ListAccessMembersForBookingRequests(ctx, ids)
	if err != nil {
		return fmt.Errorf("list access members: %w", err)
	}
	for _, m := range members {
		r := byID[dbutil.UUIDStr(m.BookingRequestID)]
		r.AccessMembers = append(r.AccessMembers, apitypes.Member{
			ID:             dbutil.UUIDStr(m.ID),
			StudentID:      dbutil.TextPtr(m.StudentID),
			FirstName:      dbutil.TextPtr(m.FirstName),
			LastName:       dbutil.TextPtr(m.LastName),
			Nickname:       dbutil.TextPtr(m.Nickname),
			PicturePath:    dbutil.TextPtr(m.PicturePath),
			ClassYear:      dbutil.Int4Ptr(m.ClassYear),
			ClassProgramme: dbutil.TextPtr(m.ClassProgramme),
		})
	}
	return nil
}

func uniqueStrings(values []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, v := range values {
		if v != "" && !seen[v] {
			seen[v] = true
			out = append(out, v)
		}
	}
	return out
}
