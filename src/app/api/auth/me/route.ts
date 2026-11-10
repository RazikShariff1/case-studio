import { getUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await getUser();
  return user ? ok({ user }) : fail("Not signed in", 401);
}
