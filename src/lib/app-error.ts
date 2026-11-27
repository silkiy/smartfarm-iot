/** Domain error mapped to an HTTP status in one place (AGENT.md §14). */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = (message = "Authentication required") =>
  new AppError(message, "UNAUTHORIZED", 401);

export const forbidden = (message = "Forbidden") =>
  new AppError(message, "FORBIDDEN", 403);

/** 404 (not 403) so the existence of another user's resource is not leaked. */
export const notFound = (message = "Not found") =>
  new AppError(message, "NOT_FOUND", 404);
