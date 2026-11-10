import { requireToken } from "@/lib/auth";
import { createAddress, listAddresses } from "@/lib/addresses";
import { addressSchema } from "@/lib/address-schema";
import { ok, handleError, readJson } from "@/lib/api";

export async function GET() {
  try {
    return ok({ addresses: await listAddresses(await requireToken()) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const token = await requireToken();
    return ok(await createAddress(token, addressSchema.parse(await readJson(req))), 201);
  } catch (e) {
    return handleError(e);
  }
}
