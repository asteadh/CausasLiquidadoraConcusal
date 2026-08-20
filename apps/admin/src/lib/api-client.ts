import { headers } from "next/headers";

// Server-only helper for calling apps/api (the Go service) from React
// Server Components and Server Actions. It forwards the incoming request's
// Cookie header so the Go server can validate the caller's Better Auth
// session directly against Postgres (see apps/api/cmd/server/middleware_auth.go).
// Not meant to be imported into Client Components — browser fetches would
// hit a different origin in dev and get blocked by the CSP connect-src
// policy set in next.config.ts.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie") ?? "";

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      cookie,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${init.method ?? "GET"} ${path} failed: ${res.status} ${text}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  // Tolerate an empty body on any other 2xx too — res.json() would throw
  // "Unexpected end of JSON input" and take down the whole Server Component.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
