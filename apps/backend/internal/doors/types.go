package doors

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

// Door is deliberately missing the live table's own "id" column - a
// nullable, unused-by-any-real-code legacy field (see schema.sql's door
// comment) - no DTO here exposes it, same as several other domains'
// db-only-junk-column omissions.
type Door struct {
	Name        string `json:"name"        doc:"Internal name; the key door routes use and what Salto polls."`
	VerboseName string `json:"verboseName" doc:"Display name."`
}

// DoorAccessPolicy is the admin edit-door page's own view of one rule -
// named with the Door prefix (not just AccessPolicy) to avoid colliding
// with internal/accesspolicies.AccessPolicy in huma's schema registry,
// which names schemas after the bare Go type and panics on a duplicate. Member is populated
// only for a studentId-scoped row (nil for a role-scoped one), same
// "sub-object only where a real consumer renders it" convention as
// apitypes.Mandate.member/Position.committee.
type DoorAccessPolicy struct {
	ID            string           `json:"id"`
	DoorName      string           `json:"doorName"`
	Role          *string          `json:"role,omitempty"          doc:"Everyone with this role (a position id prefix such as dsek.cafe, or *, _, nolla, a programme code)."`
	StudentID     *string          `json:"studentId,omitempty"     doc:"This member only."`
	Member        *apitypes.Member `json:"member,omitempty"        doc:"Only for a studentId rule."`
	StartDatetime *time.Time       `json:"startDatetime,omitempty" doc:"Unset means already started."`
	EndDatetime   *time.Time       `json:"endDatetime,omitempty"   doc:"Unset means never ends."`
	IsBan         bool             `json:"isBan"                   doc:"A ban removes access the member would otherwise have."`
	Information   *string          `json:"information,omitempty"   doc:"The reason given."`
}

// DoorAccessPolicyInput mirrors the old admin create form's zod schema
// (createSchema in edit/[slug]/+page.server.ts) field-for-field - see
// Service.CreateAccessPolicy for the refinement checks ported from its
// .refine() chain.
type DoorAccessPolicyInput struct {
	// Subject is a studentId (Type == "member") or a position-id prefix /
	// "*" (Type == "role").
	Subject       string            `json:"subject"                 doc:"A student id (type member) or a role (type role)."`
	Type          DoorPolicySubject `json:"type,omitempty"          doc:"Defaults to member."`
	Mode          DoorPolicyMode    `json:"mode,omitempty"          doc:"Defaults to allow. A role can't be denied."`
	StartDatetime *time.Time        `json:"startDatetime,omitempty"`
	EndDatetime   *time.Time        `json:"endDatetime,omitempty"   doc:"Required for a member rule."`
	Reason        *string           `json:"reason,omitempty"        doc:"Required for a member rule and for deny."`
}

// DoorPolicySubject is who a door access policy is for.
type DoorPolicySubject string

func (DoorPolicySubject) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "DoorPolicySubject", "member", "role")
}

// DoorPolicyMode is whether a door access policy grants or bans.
type DoorPolicyMode string

func (DoorPolicyMode) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "DoorPolicyMode", "allow", "deny")
}

// MemberDoorAccess is one row of the member profile page's self-view "which
// doors do I have access to" widget - Name is the door's internal (raw)
// name, kept even though only VerboseName renders client-side, for parity
// with the old MemberDoorPolicies shape.
type MemberDoorAccess struct {
	Name          string     `json:"name"                    doc:"The door's internal name."`
	VerboseName   string     `json:"verboseName"             doc:"The door's display name."`
	Roles         []string   `json:"roles"                   doc:"The member's roles that grant access."`
	StartDatetime *time.Time `json:"startDatetime,omitempty"`
	EndDatetime   *time.Time `json:"endDatetime,omitempty"`
}
