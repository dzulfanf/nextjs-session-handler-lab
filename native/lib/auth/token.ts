import { jwtVerify, SignJWT } from "jose";

// Secret key used to sign and verify JWTs.
// In production, this value must be stored securely in environment variables.
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

// Short-lived token used to authenticate API requests.
const ACCESS_TOKEN_EXPIRY = "30s";

// Long-lived token used to obtain a new access token.
const REFRESH_TOKEN_EXPIRY = "5m";

/**
 * Generates a short-lived access token for an authenticated user.
 *
 * The access token is sent with API requests and intentionally expires
 * quickly in this project so we can easily simulate session expiration.
 */
export async function generateAccessToken(userId: string) {
  return new SignJWT({
    // Identifies this JWT as an access token.
    type: "access",

    // Associates the token with the authenticated user.
    userId,
  })
    // Use HS256 for this learning project.
    .setProtectedHeader({ alg: "HS256" })

    // Store the token creation time.
    .setIssuedAt()

    // Automatically expire the token after 30 seconds.
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)

    // Sign the JWT using our secret key.
    .sign(secret);
}

/**
 * Generates a refresh token for an authenticated user.
 *
 * The refresh token has a longer lifetime and is only used to
 * obtain a new access token when the access token expires.
 */
export async function generateRefreshToken(userId: string) {
  return new SignJWT({
    // Identifies this JWT as a refresh token.
    type: "refresh",

    // Associates the token with the authenticated user.
    userId,
  })
    // Use HS256 for this learning project.
    .setProtectedHeader({ alg: "HS256" })

    // Store the token creation time.
    .setIssuedAt()

    // Automatically expire the token after 5 minutes.
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)

    // Sign the JWT using our secret key.
    .sign(secret);
}

/**
 * Verifies an access token and returns its payload.
 *
 * jwtVerify() automatically validates the signature and expiration.
 * We additionally verify that the token is actually an access token.
 */
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret);

  // Prevent a refresh token from being used as an access token.
  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }

  return payload;
}

/**
 * Verifies a refresh token and returns its payload.
 *
 * jwtVerify() automatically validates the signature and expiration.
 * We additionally verify that the token is actually a refresh token.
 */
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, secret);

  // Prevent an access token from being used as a refresh token.
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  return payload;
}