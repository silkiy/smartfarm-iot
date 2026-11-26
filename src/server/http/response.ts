export const ok = (data: unknown, status = 200) =>
  Response.json({ data }, { status, headers: { "Cache-Control": "private, no-store" } });

export const err = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });
