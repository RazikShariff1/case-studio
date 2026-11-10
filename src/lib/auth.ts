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
  (await cookies()).delete(COOKIE);
}

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value;
}

/** The signed-in shopper, or null (no cookie, an expired or revoked session, a suspended account, or the platform is down). */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    const p = await store<{ customer: Customer }>("/customer-svc/auth/me", { token, timeoutMs: AUTH_TIMEOUT_MS });
    return toUser(p.customer);
  } catch {
    return null;
  }
});

/** For routes that need a signed-in shopper: the token to call the platform with, or a 401. */
export async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new HttpError("Please sign in to continue", 401);
  return token;
}
