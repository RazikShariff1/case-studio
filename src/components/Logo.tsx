import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-baseline gap-0.5 leading-none" aria-label="Case Studio home">
      <span className="text-2xl font-semibold tracking-tight">Case</span>
      <span className="text-sm">✦</span>
      <span className="ml-1 text-[11px] text-muted">Studio</span>
    </Link>
  );
}
