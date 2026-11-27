import type { NextResponse } from "next/server";
import { AppError } from "./app-error";
import { apiFailure, type ApiFailure } from "./api-response";

/**
 * Map a domain `AppError` to an HTTP response in one place (AGENT.md §14).
 * `AppError` carries a stable `code` + `status`. Anything else is a 500 with
 * a generic message; no internals are leaked.
 */
export function appErrorToResponse(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof AppError) {
    return apiFailure(error.code, error.message, error.status);
  }
  return apiFailure("INTERNAL_ERROR", "Terjadi kesalahan. Coba lagi.", 500);
}
