import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { ok, fail, handleError, readJson } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function POST(req: Request) {
  try {
    const { name, email, password } = schema.parse(await readJson(req));
    if (await prisma.user.findUnique({ where: { email } })) return fail("An account with this email already exists", 409);
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, name: true, email: true },
    });
    await createSession(user.id);
    await mergeGuestCart(user.id);
    return ok({ user }, 201);
  } catch (e) {
    return handleError(e);
  }
}
