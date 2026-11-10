import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-xs py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-page mt-2">We could not find that page.</h1>
      <p className="h-sub mt-3 text-muted">It may have moved, or the link is not quite right.</p>
      <Link href="/shop" className="btn btn-blue mt-8">Back to the store</Link>
    </div>
  );
}
