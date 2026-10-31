export default function SchedulesPage() {
  return <AdminPlaceholder title="Schedules" />;
}

function AdminPlaceholder({ title }: { title: string }) {
  return <section><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Administration</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">{title}</h1><p className="mt-4 text-zinc-600">This page is reserved for the upcoming administration tools.</p></section>;
}
