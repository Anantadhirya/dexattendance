"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  async function logout() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-screen bg-red-50">
      <header className="border-b border-red-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-lg font-black text-white">
              d
            </span>
            <span className="font-semibold tracking-tight text-red-950">
              dexattendance
            </span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-semibold text-red-700 hover:text-red-900"
          >
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
