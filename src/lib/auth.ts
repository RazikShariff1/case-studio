import { cache } from "react";
import { cookies } from "next/headers";
import { store } from "./platform";
import { HttpError } from "./api";

const COOKIE = "session";
const AUTH_TIMEOUT_MS = 15_000;

export type SessionUser = { id: string; name: string; email: string; phone: string };

type Customer = { id: number; name: string; email: string; phone: string };

export const toUser = (c: Customer): SessionUser => ({ id: String(c.id), name: c.name, email: c.email, phone: c.phone ?? "" });

/** Route handlers / server actions only (sets a cookie). The token is customer-svc's own; it expires when the session does. */
export async function createSession(token: string, expiresAt: string) {
  const left = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Number.isFinite(left) && left > 60 ? left : 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) who.delete(token);
  jar.delete(COOKIE);
}

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value;
}

// Who a token belongs to rarely changes, and every protected call to the platform checks the token again anyway, so a warm server
// remembers the answer for a short while instead of asking customer-svc on every page. A suspension shows up within this time.
const WHO_TTL_MS = 30_000;
const who = new Map<string, { user: SessionUser; until: number }>();

/** The signed-in shopper, or null (no cookie, an expired or revoked session, a suspended account, or the platform is down). */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken();
  if (!token) return null;

  const hit = who.get(token);
  if (hit && hit.until > Date.now()) return hit.user;

  try {
    const p = await store<{ customer: Customer }>("/customer-svc/auth/me", { token, timeoutMs: AUTH_TIMEOUT_MS });
    const user = toUser(p.customer);
    if (who.size > 500) who.clear(); // never grow without bound
    who.set(token, { user, until: Date.now() + WHO_TTL_MS });
    return user;
  } catch {
    who.delete(token);
    return null;
  }
});

/** Whether a session cookie is present. Free: the pages that matter still verify it. Used for the top bar, which must not wait on the platform. */
export async function hasSession() {
  return !!(await getToken());
}

/** For routes that need a signed-in shopper: the token to call the platform with, or a 401. */
export async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new HttpError("Please sign in to continue", 401);
  return token;
}
