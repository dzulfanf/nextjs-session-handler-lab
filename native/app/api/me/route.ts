import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth/token";
import { MOCK_USER } from "@/lib/auth/mock-user";

/**
 * Returns the currently authenticated user's information.
 *
 * This endpoint represents a protected API that requires a valid
 * access token. It will be used later to test token expiration,
 * refresh, retry, and concurrent requests.
 */
export async function GET(request: Request) {
  // Read the access token from the request cookies.
  const cookieHeader = request.headers.get("cookie");

  // Extract the access token from the cookie header.
  const accessToken = cookieHeader
    ?.split(";")
    .find((cookie) => cookie.trim().startsWith("access_token="))
    ?.split("=")[1];

  // Reject the request when no access token is provided.
  if (!accessToken) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    // Verify the access token signature, expiration, and token type.
    const payload = await verifyAccessToken(accessToken);

    // Find the user associated with the token.
    const user = MOCK_USER.id === payload.userId ? MOCK_USER : null;

    // Reject the request if the token references an unknown user.
    if (!user) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // Return only information that is safe to expose to the client.
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    // Expired or invalid tokens are treated as unauthorized requests.
    return NextResponse.json(
      {
        message: "Access token expired or invalid",
      },
      {
        status: 401,
      },
    );
  }
}