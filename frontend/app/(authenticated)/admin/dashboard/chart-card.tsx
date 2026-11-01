import type { ReactNode } from "react";

export default function ChartCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm transition-opacity outline-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-red-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
