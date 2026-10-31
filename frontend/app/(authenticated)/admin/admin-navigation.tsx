"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/attendances", label: "Attendances" },
  { href: "/admin/schedules", label: "Schedules" },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-red-100 bg-white p-4 shadow-sm md:w-56">
      <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
        Administration
      </p>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "bg-red-700 text-white"
                : "text-zinc-600 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
