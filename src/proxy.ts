import { NextResponse } from "next/server";
import { auth } from "@/auth";

const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/dashboard/admin";
const AUTH_PAGES = new Set(["/login", "/register"]);

/**
 * Next.js 16 `proxy` (formerly `middleware.ts`).
 *
 * `proxy.ts` protects `/dashboard/*`, but it is NOT sufficient: every route
 * handler and server component re-checks session + role + ownership itself
 * (AGENT.md §12.1). `ADMIN` for `/dashboard/admin` is checked here AND in the
 * handler/page.
 */
export default auth((request) => {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  const sessionUser = request.auth?.user;
  const isLoggedIn = Boolean(sessionUser?.id);
  const isAdmin = sessionUser?.role === "ADMIN";

  const isDashboard = pathname === DASHBOARD_PREFIX || pathname.startsWith(`${DASHBOARD_PREFIX}/`);
  const isAdminRoute = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isAuthPage = AUTH_PAGES.has(pathname);

  if (isDashboard && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
