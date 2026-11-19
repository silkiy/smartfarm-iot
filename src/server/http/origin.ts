export function isSameOrigin(request: Request, publicUrl?: string): boolean {
  const url = new URL(request.url);
  // Next can construct an internal request URL with localhost. Host reflects the
  // requested authority; AUTH_URL pins the public origin behind a reverse proxy.
  const expected = publicUrl
    ? new URL(publicUrl).origin
    : request.headers.get("host")
      ? `${url.protocol}//${request.headers.get("host")}`
      : url.origin;
  return request.headers.get("origin") === expected;
}
