/**
 * Client for the platform's customer-facing gateway (`/store/{service}/...`). Everything the storefront knows comes through
 * here: accounts (customer-svc), products (catalogue-svc), prices and stock (inventory-svc) and orders (order-svc).
 * Server-side only: the browser talks to this app's own /api routes, never to the platform, so the shopper's token stays in an
 * httpOnly cookie and there is no CORS to configure.
 */
import { HttpError } from "./api";

export const PLATFORM_URL = (process.env.PLATFORM_URL ?? "https://as-project-j88g.onrender.com").replace(/\/+$/, "");

type Opts = {
  method?: string;
  body?: unknown;
  /** The shopper's bearer token, for signed calls. */
  token?: string;
  /** Cache the answer this many seconds (public catalogue reads). Omit for no caching. */
  revalidate?: number;
  timeoutMs?: number;
};

type Envelope<T> = { data?: T; error?: { message?: string } };

/** Calls `/store{path}` and returns the unwrapped `data`. Failures become an HttpError with the platform's own message. */
export async function store<T>(path: string, o: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  if (o.token) headers.Authorization = `Bearer ${o.token}`;

  let res: Response;
  try {
    res = await fetch(`${PLATFORM_URL}/store${path}`, {
      method: o.method ?? "GET",
      headers,
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      ...(o.revalidate ? { next: { revalidate: o.revalidate } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(o.timeoutMs ?? 45_000),
    });
  } catch {
    throw new HttpError("The store is not reachable right now. Please try again in a moment.", 503);
  }

  const text = await res.text();
  let json: Envelope<T> | null = null;
  try {
    json = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    if (res.status >= 502 && res.status <= 504) throw new HttpError("The store is not reachable right now. Please try again in a moment.", 503);
    throw new HttpError(json?.error?.message ?? `The store answered ${res.status}`, res.status);
  }

  return (json && "data" in json ? json.data : json) as T;
}

/** What the platform returns for a catalogue or order list. */
export type Page<K extends string, T> = { count: number; offset: number; limit: number } & { [P in K]: T[] };
