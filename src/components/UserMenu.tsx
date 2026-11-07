"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ user }: { user: { name: string; email: string } | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-card">Sign in</Link>
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu"
        className="grid h-10 w-10 place-items-center rounded-full bg-olive text-sm font-semibold text-white">
        {user.name.trim()[0]?.toUpperCase()}
      </button>
      {open && (
        <>
          <button aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Link href="/orders" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-cream">My orders</Link>
            <button onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-cream">Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}
