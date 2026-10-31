import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("dexattendance_token");
  const isUnauthenticatedRoute = request.nextUrl.pathname.startsWith("/sign-in");

  if (isUnauthenticatedRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isUnauthenticatedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
