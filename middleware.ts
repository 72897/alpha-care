import { NextResponse, type NextRequest } from "next/server";

/**
 * Bounces requests based on the mere presence of the session cookie, before any
 * page renders. This is a fast path only — it does not verify the cookie, and
 * every protected page still calls getCurrentUser() and redirects if the
 * session is actually invalid. The point is to avoid paying for a full server
 * render plus a Firestore read just to discover there is no session at all.
 */
const PROTECTED_PREFIXES = ["/myprofile", "/history", "/interview", "/chat"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");

  const isProtected =
    pathname === "/" ||
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (AUTH_ROUTES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets, images, and API routes: those either have no session
  // semantics or enforce them themselves.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
