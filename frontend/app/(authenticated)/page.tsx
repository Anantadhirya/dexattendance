"use client";

import { useUser } from "./user-provider";

export default function DashboardPage() {
  const user = useUser();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
        Attendance
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
        Welcome, {user.name}
      </h1>
      <p className="mt-3 text-zinc-600">
        Signed in as {user.email}
        {user.isAdmin ? " · Administrator" : ""}
      </p>
      <div className="mt-10 rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-red-950">
          Check in and check out
        </h2>
        <p className="mt-2 text-zinc-500">
          Check-in and check-out controls will be available here.
        </p>
      </div>
    </main>
  );
}
