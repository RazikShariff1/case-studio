import { z } from "zod";
import { store } from "@/lib/platform";
import { createSession, toUser } from "@/lib/auth";
import { ok, fail, handleError, readJson } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

type LoggedIn = { token: string; expiresAt: string; customer: Parameters<typeof toUser>[0] };

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("Invalid email or password", 401);
    const s = await store<LoggedIn>("/customer-svc/auth/login", { method: "POST", body: parsed.data });
    await createSession(s.token, s.expiresAt);
    return ok({ user: toUser(s.customer) });
  } catch (e) {
    // The platform says 401 for any bad credentials, 403 for a suspended account and 429 after repeated failures.
    return handleError(e, { 401: "Invalid email or password" });
  }
}
