package accesspolicies

import "time"

// AccessPolicy grants one API policy (apiName) to a role or to one member.
type AccessPolicy struct {
	ID        string    `json:"id"`
	APIName   string    `json:"apiName"             doc:"The policy, e.g. news:article:create."`
	Role      *string   `json:"role,omitempty"      doc:"Granted to everyone with this role, e.g. dsek.cafe (and every role under it), * (anyone) or _ (signed in)."`
	StudentID *string   `json:"studentId,omitempty" doc:"Granted to this member only."`
	CreatedAt time.Time `json:"createdAt"`
	// MemberFirstName/MemberLastName are only set for a studentId-scoped
	// row (role-scoped rows grant to a role, not a specific member).
	MemberFirstName *string `json:"memberFirstName,omitempty" doc:"Only for a studentId grant."`
	MemberLastName  *string `json:"memberLastName,omitempty"  doc:"Only for a studentId grant."`
}

// AccessPolicyAPIName is a policy that has grants, and how many.
type AccessPolicyAPIName struct {
	APIName    string `json:"apiName"`
	GrantCount int    `json:"grantCount"`
}

// AccessPolicyBulkInput grants APIName to each of Roles and each of StudentIDs.
type AccessPolicyBulkInput struct {
	APIName    string   `json:"apiName"`
	Roles      []string `json:"roles"`
	StudentIDs []string `json:"studentIds"`
}

// AccessPolicyInput grants apiName to exactly one of Role or StudentID - enforced
// both here (app-level, for a clean 422 instead of a raw constraint-
// violation error) and by a DB CHECK constraint (defense in depth against
// concurrent requests - see the migration that added it).
type AccessPolicyInput struct {
	APIName   string  `json:"apiName"`
	Role      *string `json:"role,omitempty"      doc:"Set exactly one of role and studentId."`
	StudentID *string `json:"studentId,omitempty" doc:"Set exactly one of role and studentId."`
}
