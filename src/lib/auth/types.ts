/**
 * The signed-in (or anonymous) caller, as resolved by the Go backend's
 * GET /me (backend/internal/auth/me.go). Available as locals.user and
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
export type SignedInMember = {
  id: string;
  studentId: string;
  firstName?: string;
  nickname?: string;
  lastName?: string;
  email?: string;
  picturePath?: string;
  classProgramme?: string;
  classYear?: number;
  language?: string;
};
