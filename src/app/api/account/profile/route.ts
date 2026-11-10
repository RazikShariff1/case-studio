import { z } from "zod";
import { requireToken } from "@/lib/auth";
import { store } from "@/lib/platform";
import { PHONE_RE } from "@/lib/india";
import { ok, handleError, readJson } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().refine((p) => p === "" || PHONE_RE.test(p), "Enter a valid 10-digit mobile number"),
});

export async function PUT(req: Request) {
  try {
    const token = await requireToken();
    const body = schema.parse(await readJson(req));
    return ok(await store("/customer-svc/customer/me", { method: "PUT", token, body }));
  } catch (e) {
    return handleError(e);
  }
}
