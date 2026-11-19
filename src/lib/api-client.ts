export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requestJson<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (response.status === 401) window.location.replace("/login");
  let result;
  try {
    result = await response.json();
  } catch {
    throw new RequestError(
      response.ok ? 502 : response.status,
      "Respons layanan belum tersedia. Silakan coba lagi.",
    );
  }
  if (!result || typeof result !== "object")
    throw new RequestError(
      502,
      "Respons layanan tidak valid. Silakan coba lagi.",
    );
  if (!response.ok) {
    throw new RequestError(
      response.status,
      typeof result.error?.message === "string"
        ? result.error.message
        : "Permintaan gagal. Silakan coba lagi.",
    );
  }
  if (!("data" in result))
    throw new RequestError(
      502,
      "Respons layanan tidak valid. Silakan coba lagi.",
    );
  return result.data as T;
}
