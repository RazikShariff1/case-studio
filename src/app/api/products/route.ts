import { listProducts, SORTS, type SortKey } from "@/lib/catalog";
import { ok } from "@/lib/api";

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sort = p.get("sort") as SortKey | null;
  const data = await listProducts({
    q: p.get("q")?.trim() || undefined,
    category: p.get("category") || undefined,
    model: p.get("model") || undefined,
    color: p.get("color") || undefined,
    min: num(p.get("min")),
    max: num(p.get("max")),
    sort: sort && sort in SORTS ? sort : undefined,
    page: num(p.get("page")),
  });
  return ok(data);
}
