import { NextResponse } from "next/server";

export type ApiError = { code: string; message: string };
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: ApiError };

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status, headers: NO_STORE });
}

export function apiFailure(
  code: string,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: { ...NO_STORE, ...extraHeaders } },
  );
}
