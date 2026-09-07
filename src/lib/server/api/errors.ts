/**
 * Typed errors the service layer can throw. `endpoint()` catches these and
 * maps them to a response; page load functions/actions that call the
 * service layer directly catch them and map to SvelteKit's own `error()`.
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
