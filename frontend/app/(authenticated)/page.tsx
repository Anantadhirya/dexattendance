"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  name: string;
  email: string;
  isAdmin: boolean;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    fetch(`${apiUrl}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/sign-in");
          return;
        }

        setUser(await response.json());
      })
      .catch(() => router.replace("/sign-in"));
  }, [router]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
        Dashboard
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
        {user ? `Welcome, ${user.name}` : "Loading your dashboard..."}
      </h1>
      {user && (
        <p className="mt-3 text-zinc-600">
          Signed in as {user.email}
          {user.isAdmin ? " · Administrator" : ""}
        </p>
      )}
    </main>
  );
}
