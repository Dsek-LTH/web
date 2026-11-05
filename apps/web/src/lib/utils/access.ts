import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

type Viewer = { memberId?: string; policies: string[] } | undefined;

// Picks the page shown to someone who can't use it: 401 when logged out,
// 403 otherwise, instead of an empty page or a form that can't be saved.
// Go still decides every write; these only mirror the policy (or canEdit)
// the page's own action needs from Go.

/** Answers 401/403 unless the viewer holds one of the policies. */
export function requirePolicy(user: Viewer, ...policies: string[]) {
  if (!user?.memberId) error(401, m.errors_notLoggedIn());
  if (!policies.some((policy) => user.policies.includes(policy)))
    error(403, m.errors_noAccess());
}

/** Answers 401/403 unless Go says the viewer may edit the resource. */
export function requireCanEdit(user: Viewer, canEdit: boolean | undefined) {
  if (canEdit) return;
  if (!user?.memberId) error(401, m.errors_notLoggedIn());
  error(403, m.errors_noAccess());
}

/** For a load that failed in Go: the same status, with Go's reason. */
export function goError(
  response: Response,
  body: { detail?: string } | undefined,
  fallback: string,
): never {
  if (response.status === 401) error(401, m.errors_notLoggedIn());
  if (response.status === 403) error(403, m.errors_noAccess());
  error(response.status, body?.detail ?? fallback);
}
