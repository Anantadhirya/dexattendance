import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("dexattendance_token");
  const isSignInRoute = request.nextUrl.pathname.startsWith("/sign-in");
  const isPublicRoute =
    isSignInRoute ||
    request.nextUrl.pathname.startsWith("/account-inactive");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  if (isSignInRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
