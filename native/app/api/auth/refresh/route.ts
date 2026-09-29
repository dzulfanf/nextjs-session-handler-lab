import { NextResponse } from "next/server";

import {
  generateAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/token";
import { MOCK_USER } from "@/lib/auth/mock-user";

/**
 * Refreshes an expired access token using a valid refresh token.
 *
 * The refresh token is read from an HttpOnly cookie, verified on
 * the server, and then used to issue a new short-lived access token.
 *
 * Important:
 * - The refresh token itself is never exposed to the client.
 * - A refresh request does not require a valid access token.
 * - Only the refresh token determines whether the session can be renewed.
 */
export async function POST(request: Request) {
  // Read the refresh token from the request cookies.
  const cookieHeader = request.headers.get("cookie");

  // Extract the refresh token from the cookie header.
  const refreshToken = cookieHeader
    ?.split(";")
    .find((cookie) => cookie.trim().startsWith("refresh_token="))
    ?.split("=")[1];

  // Reject the request when there is no refresh token.
  if (!refreshToken) {
    return NextResponse.json(
      {
        message: "Refresh token is missing",
      },
      {
        status: 401,
      },
    );
  }

  try {
    // Verify the refresh token signature, expiration, and token type.
    const payload = await verifyRefreshToken(refreshToken);

    // Find the user associated with the refresh token.
    const user = MOCK_USER.id === payload.userId ? MOCK_USER : null;

    // Reject the request when the token references an unknown user.
    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid refresh token",
        },
        {
          status: 401,
        },
      );
    }

    // Generate a new short-lived access token.
    const accessToken = await generateAccessToken(user.id);

    // Create the response that will carry the new cookie.
    const response = NextResponse.json({
      message: "Session refreshed",
    });

    // Replace the expired access token with the newly generated token.
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30,
    });

    // Return the successful refresh response.
    return response;
  } catch {
    // An expired or invalid refresh token means the session
    // can no longer be renewed.
    return NextResponse.json(
      {
        message: "Refresh token expired or invalid",
      },
      {
        status: 401,
      },
    );
  }
}