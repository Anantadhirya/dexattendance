"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "./user-provider";

export default function AuthenticatedShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function logout() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace("/sign-in");
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/attendance", label: "History" },
    ...(user.isAdmin
      ? [{ href: "/admin/dashboard", label: "Admin" }]
      : []),
  ];

  const isActive = (href: string) =>
    pathname === href || (href === "/admin/dashboard" && pathname.startsWith("/admin"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white">
      <header className="sticky top-0 z-10 border-b border-red-100/80 bg-white/90 shadow-sm shadow-red-900/5 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="flex h-[4.5rem] items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-lg font-black text-white shadow-lg shadow-red-700/20">
                d
              </span>
              <span className="font-semibold tracking-tight text-red-950">
                dexattendance
              </span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-full bg-red-50 p-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive(link.href)
                      ? "bg-white text-red-700 shadow-sm"
                      : "text-zinc-500 hover:text-red-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-4 md:flex">
              <span className="hidden text-sm text-zinc-400 lg:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-xl border border-red-100 p-2 text-red-700 transition hover:bg-red-50 md:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
          {isMenuOpen && (
            <div className="border-t border-red-100 py-4 md:hidden">
              <nav className="grid gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      isActive(link.href)
                        ? "bg-red-700 text-white"
                        : "text-zinc-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 rounded-xl border border-red-100 px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
