import { z } from "zod";
import { requireToken, destroySession } from "@/lib/auth";
import { store } from "@/lib/platform";
import { ok, handleError, readJson } from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72, "Password can be at most 72 characters"),
});

export async function PUT(req: Request) {
  try {
    const token = await requireToken();
    const body = schema.parse(await readJson(req));
    await store("/customer-svc/customer/me/password", { method: "PUT", token, body });
    // customer-svc ends every session when the password changes, this one included: the shopper signs in again.
    await destroySession();
    return ok({ ok: true });
  } catch (e) {
    return handleError(e, { 401: "Your current password is wrong" });
  }
}
