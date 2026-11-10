import { z } from "zod";
import { store } from "@/lib/platform";
import { createSession, toUser } from "@/lib/auth";
import { ok, handleError, readJson } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password can be at most 72 characters"),
});

type Registered = { token: string; expiresAt: string; customer: Parameters<typeof toUser>[0] };

export async function POST(req: Request) {
  try {
    const body = schema.parse(await readJson(req));
    const s = await store<Registered>("/customer-svc/auth/register", { method: "POST", body });
    await createSession(s.token, s.expiresAt);
    return ok({ user: toUser(s.customer) }, 201);
  } catch (e) {
    return handleError(e, { 409: "An account with this email already exists" });
  }
}
