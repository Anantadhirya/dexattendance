import AdminNavigation from "./admin-navigation";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
      <AdminNavigation />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
