import { error } from "@sveltejs/kit";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Typed errors a service function can throw. `endpoint()` and
 * `handleServiceError` both just check `instanceof ServiceError` — neither
 * needs to know how a service function arrived at one, ZenStack-guarded
 * write or otherwise.
 */
export abstract class ServiceError extends Error {
  abstract readonly status: number;
}

export class NotFoundError extends ServiceError {
  readonly status = 404;
}

export class ForbiddenError extends ServiceError {
  readonly status = 403;
}

/**
 * ZenStack enforces `@@allow`/`@@deny` policies itself and reports a
 * failure as a plain Prisma error, not something app code threw.
 * `withZenStackErrors` is the one place that knows those error shapes —
 * wrap a ZenStack-guarded write in it and its own denial becomes the typed
 * error a service function would otherwise have to re-derive by hand from
 * `locals.user?.policies`. That's the whole point of using ZenStack.
 *
 * - P2025 "record not found": either genuinely missing, or hidden by a
 *   `@@deny("read", ...)` rule — ZenStack deliberately reports both the
 *   same way, so as not to leak existence to a caller who can't read it.
 * - P2004 "constraint failed" with reason `ACCESS_POLICY_VIOLATION`: a
 *   write (create/update/delete) rejected by an `@@allow`/`@@deny` rule.
 */
function fromZenStackError(err: unknown): ServiceError | undefined {
  if (!(err instanceof PrismaClientKnownRequestError)) return undefined;
  if (err.code === "P2025") return new NotFoundError(err.message);
  if (err.code === "P2004" && err.meta?.["reason"] === "ACCESS_POLICY_VIOLATION") {
    return new ForbiddenError(err.message);
  }
  return undefined;
}

/** Runs a ZenStack-guarded write, translating a policy denial into a typed `ServiceError`. */
export async function withZenStackErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw fromZenStackError(err) ?? err;
  }
}

/**
 * The page-side equivalent of what `endpoint()` does for API routes: map a
 * `ServiceError` a service function threw to SvelteKit's own `error()`, so
 * the website and the API agree on what status a given failure gets.
 * Anything else is rethrown as-is (a genuine bug, not a modeled failure).
 *
 * `await songs.someWrite(...).catch(handleServiceError)` keeps the await's
 * resolved type: this always throws, so `never` drops out of the union.
 */
export function handleServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    error(err.status, { message: err.message });
  }
  throw err;
}
