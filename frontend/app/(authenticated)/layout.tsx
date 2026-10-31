import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AuthenticatedShell from "./authenticated-shell";
import { UserProvider, type CurrentUser } from "./user-provider";

async function getCurrentUser(): Promise<CurrentUser> {
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
    redirect("/sign-in");
  }

  if (!response.ok) {
    redirect("/sign-in");
  }

  return response.json();
}

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname.startsWith("/admin") && !user.isAdmin) {
    notFound();
  }

  return (
    <UserProvider user={user}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </UserProvider>
  );
}
