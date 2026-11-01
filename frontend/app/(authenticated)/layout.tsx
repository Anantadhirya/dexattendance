import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AuthenticatedShell from "./authenticated-shell";
import BackendUnavailable from "./backend-unavailable";
import { UserProvider, type CurrentUser } from "./user-provider";

async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get("dexattendance_token")?.value;

  if (!token) {
    redirect("/sign-in");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/auth/me`, {
      headers: { Cookie: `dexattendance_token=${encodeURIComponent(token)}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    redirect("/sign-in");
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) {
    return <BackendUnavailable />;
  }

  const pathname = (await headers()).get("x-pathname") ?? "";

  if (!user.isActive) {
    if (pathname !== "/account-inactive") {
      redirect("/account-inactive");
    }

    return children;
  }

  if (pathname === "/account-inactive") {
    redirect("/");
  }

  if (pathname.startsWith("/admin") && !user.isAdmin) {
    notFound();
  }

  return (
    <UserProvider user={user}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </UserProvider>
  );
}
