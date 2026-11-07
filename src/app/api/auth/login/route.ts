import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { ok, fail, handleError, readJson } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

// Compared against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("Invalid email or password", 401);
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return fail("Invalid email or password", 401);
    await createSession(user.id);
    await mergeGuestCart(user.id);
    return ok({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    return handleError(e);
  }
}
