import { NextResponse } from "next/server";

import { generateAccessToken, generateRefreshToken } from "@/lib/auth/token";
import { MOCK_USER } from "@/lib/auth/mock-user";

/**
 * Handles user authentication.
 *
 * Validates the submitted credentials and, when successful,
 * creates access and refresh tokens stored in HttpOnly cookies.
 */
export async function POST(request: Request) {
  // Read the credentials submitted by the client.
  const { email, password } = await request.json();

  // Validate the credentials against our mock user.
  if (email !== MOCK_USER.email || password !== MOCK_USER.password) {
    return NextResponse.json(
      {
        message: "Invalid email or password",
      },
      {
        status: 401,
      },
    );
  }

  // Generate a short-lived access token.
  const accessToken = await generateAccessToken(MOCK_USER.id);

  // Generate a longer-lived refresh token.
  const refreshToken = await generateRefreshToken(MOCK_USER.id);

  // Return only safe user information to the client.
  // Password and tokens must never be included in the response body.
  const user = {
    id: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
  };

  // Create the API response before setting authentication cookies.
  const response = NextResponse.json({
    user,
  });

  // Store the access token in an HttpOnly cookie.
  // HttpOnly prevents client-side JavaScript from reading the token.
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30,
  });

  // Store the refresh token in a separate HttpOnly cookie.
  // This cookie has a longer lifetime than the access token.
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  // Return the response containing the authentication cookies.
  return response;
}