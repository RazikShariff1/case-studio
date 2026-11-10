import { destroySession, getToken } from "@/lib/auth";
import { store } from "@/lib/platform";
import { ok } from "@/lib/api";

export async function POST() {
  const token = await getToken();
  // Ending the session at customer-svc revokes the token; the cookie goes either way, even if the platform is unreachable.
  if (token) await store("/customer-svc/auth/session", { method: "DELETE", token, timeoutMs: 10_000 }).catch(() => undefined);
  await destroySession();
  return ok({ ok: true });
}
