import { cookies } from "next/headers";

import { verifyAccessToken } from "@/lib/auth/token";
import { MOCK_USER } from "@/lib/auth/mock-user";
import type { Session, User } from "@/types/auth";

/**
 * Retrieves the currently authenticated user from the access token.
 *
 * The access token is stored in an HttpOnly cookie, so the client
 * cannot access it directly. The server reads and verifies it here.
 *
 * Returns the user when the token is valid, otherwise returns null.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Read the cookies sent with the current request.
  const cookieStore = await cookies();

  // Retrieve the access token from the HttpOnly cookie.
  const accessToken = cookieStore.get("access_token")?.value;

  // No access token means there is no authenticated session.
  if (!accessToken) {
    return null;
  }

  try {
    // Verify the token signature, expiration, and token type.
    const payload = await verifyAccessToken(accessToken);

    // Find the user associated with the token.
    const user = MOCK_USER.id === payload.userId ? MOCK_USER : null;

    // Return only safe user information.
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  } catch {
    // Invalid or expired tokens are treated as unauthenticated sessions.
    return null;
  }
}

/**
 * Retrieves the current session.
 *
 * This provides a single abstraction for the rest of the application
 * instead of requiring every component to understand JWTs or cookies.
 */
export async function getSession(): Promise<Session | null> {
  // Get the currently authenticated user.
  const user = await getCurrentUser();

  // No authenticated user means there is no active session.
  if (!user) {
    return null;
  }

  // Return the session object consumed by the application.
  return {
    user,

    // This value represents when the current session check occurred.
    // The actual token expiration is still enforced by JWT verification.
    expiresAt: Date.now(),
  };
}

/**
 * Clears authentication cookies from the current response.
 *
 * This function will be used later when the user explicitly logs out
 * or when the refresh session can no longer be renewed.
 */
export async function clearSessionCookies() {
  const cookieStore = await cookies();

  // Remove the short-lived access token.
  cookieStore.delete("access_token");

  // Remove the refresh token as well.
  cookieStore.delete("refresh_token");
}