/**
 * Represents a user that has been authenticated.
 *
 * This type intentionally contains only information that is safe
 * to expose to the application. Sensitive credentials such as
 * passwords and authentication tokens are excluded.
 */
export interface User {
  /** Unique identifier of the user. */
  id: string;

  /** Display name of the user. */
  name: string;

  /** Email address associated with the account. */
  email: string;
}

/**
 * Represents the authenticated session available to the application.
 *
 * The session contains the authenticated user and the expiration
 * timestamp of the current authentication session.
 */
export interface Session {
  /** Currently authenticated user. */
  user: User;

  /** Session expiration timestamp in milliseconds. */
  expiresAt: number;
}