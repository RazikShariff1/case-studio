import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await getUser();
  if (!user) return fail("Not signed in", 401);
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return ok({ orders });
}
