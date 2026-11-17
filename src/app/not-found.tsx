import Link from "next/link";

export default function NotFound() {
  return (
    <div className="tx-err">
      <p>We could not find that page.</p>
      <h1>Page not found</h1>
      <Link href="/shop" className="tx-ad__btn">Continue shopping</Link>
    </div>
  );
}
