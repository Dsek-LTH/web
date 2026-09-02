package accesspolicies

import "time"

type AccessPolicy struct {
	ID        string    `json:"id"`
	APIName   string    `json:"apiName"`
	Role      *string   `json:"role,omitempty"`
	StudentID *string   `json:"studentId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	// MemberFirstName/MemberLastName are only set for a studentId-scoped
	// row (role-scoped rows grant to a role, not a specific member).
	MemberFirstName *string `json:"memberFirstName,omitempty"`
	MemberLastName  *string `json:"memberLastName,omitempty"`
}

// CreateInput grants apiName to exactly one of Role or StudentID - enforced
// both here (app-level, for a clean 400 instead of a raw constraint-
// violation error) and by a DB CHECK constraint (defense in depth against
// concurrent requests - see the migration that added it).
type CreateInput struct {
	APIName   string  `json:"apiName"`
	Role      *string `json:"role,omitempty"`
	StudentID *string `json:"studentId,omitempty"`
}
