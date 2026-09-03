package doors

import (
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

// Door is deliberately missing the live table's own "id" column - a
// nullable, unused-by-any-real-code legacy field (see schema.sql's door
// comment) - no DTO here exposes it, same as several other domains'
// db-only-junk-column omissions.
type Door struct {
	Name        string `json:"name"`
	VerboseName string `json:"verboseName"`
}

// DoorAccessPolicy is the admin edit-door page's own view of one rule -
// named with the Door prefix (not just AccessPolicy) to avoid colliding
// with internal/accesspolicies.AccessPolicy in huma's schema registry (see
// CLAUDE.md's huma "duplicate name" gotcha - this collided and panicked at
// server startup during this port before the rename). Member is populated
// only for a studentId-scoped row (nil for a role-scoped one), same
// "sub-object only where a real consumer renders it" convention as
// apitypes.Mandate.member/Position.committee.
type DoorAccessPolicy struct {
	ID            string           `json:"id"`
	DoorName      string           `json:"doorName"`
	Role          *string          `json:"role,omitempty"`
	StudentID     *string          `json:"studentId,omitempty"`
	Member        *apitypes.Member `json:"member,omitempty"`
	StartDatetime *time.Time       `json:"startDatetime,omitempty"`
	EndDatetime   *time.Time       `json:"endDatetime,omitempty"`
	IsBan         bool             `json:"isBan"`
	Information   *string          `json:"information,omitempty"`
}

// CreatePolicyInput mirrors the old admin create form's zod schema
// (createSchema in edit/[slug]/+page.server.ts) field-for-field - see
// Service.CreateAccessPolicy for the refinement checks ported from its
// .refine() chain.
type CreatePolicyInput struct {
	// Subject is a studentId (Type == "member") or a position-id prefix /
	// "*" (Type == "role").
	Subject       string     `json:"subject"`
	Type          string     `json:"type"`
	Mode          string     `json:"mode"`
	StartDatetime *time.Time `json:"startDatetime,omitempty"`
	EndDatetime   *time.Time `json:"endDatetime,omitempty"`
	Reason        *string    `json:"reason,omitempty"`
}

// MemberAccess is one row of the member profile page's self-view "which
// doors do I have access to" widget - Name is the door's internal (raw)
// name, kept even though only VerboseName renders client-side, for parity
// with the old MemberDoorPolicies shape.
type MemberAccess struct {
	Name          string     `json:"name"`
	VerboseName   string     `json:"verboseName"`
	Roles         []string   `json:"roles"`
	StartDatetime *time.Time `json:"startDatetime,omitempty"`
	EndDatetime   *time.Time `json:"endDatetime,omitempty"`
}
