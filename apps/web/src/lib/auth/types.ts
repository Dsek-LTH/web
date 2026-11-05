import type { components } from "$lib/api/schema";

/**
 * The signed-in (or anonymous) caller, as resolved by the Go backend's
 * GET /me (apps/api/internal/api/huma_me.go). Available as locals.user and
 * page.data.user.
 */
export type AuthUser = {
  studentId?: string;
  memberId?: string;
  policies: string[];
  roles: string[];
  /** Random id kept in a cookie for anonymous visitors. */
  externalCode?: string;
};

/**
 * The signed-in member's own profile fields from GET /me. Available as
 * locals.member and page.data.member.
 */
export type SignedInMember = components["schemas"]["MeMember"];
