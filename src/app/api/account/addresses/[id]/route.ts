import { requireToken } from "@/lib/auth";
import { deleteAddress, updateAddress } from "@/lib/addresses";
import { addressSchema } from "@/lib/address-schema";
import { ok, handleError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const [{ id }, token] = await Promise.all([params, requireToken()]);
    return ok(await updateAddress(token, id, addressSchema.parse(await readJson(req))));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const [{ id }, token] = await Promise.all([params, requireToken()]);
    await deleteAddress(token, id);
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
