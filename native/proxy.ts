import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protects application pages at the route level.
 *
 * The proxy only checks whether an authentication cookie exists.
 * It intentionally does not verify the token or its expiration.
 */
export function proxy(request: NextRequest) {
  // Read the access token from the HttpOnly cookie.
  const accessToken = request.cookies.get("access_token")?.value;

  // Redirect only when the authentication cookie does not exist.
  if (!accessToken) {
    return redirectToLogin(request);
  }

  // Allow the request to continue when the cookie exists.
  return NextResponse.next();
}

/**
 * Redirects an unauthenticated request to the login page.
 */
function redirectToLogin(request: NextRequest) {
  // Create the login URL.
  const loginUrl = new URL("/login", request.url);

  // Preserve the original requested URL.
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  // Redirect the user to login.
  return NextResponse.redirect(loginUrl);
}

/**
 * Only dashboard pages are protected by the proxy.
 *
 * API routes are intentionally excluded.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};