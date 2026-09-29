/**
 * Represents a session that can no longer be recovered automatically.
 *
 * This error is intentionally different from a normal API error so
 * the UI can display a session-expired experience instead of treating
 * it as a generic request failure.
 */
export class SessionExpiredError extends Error {
  /**
   * Creates a new session-expired error.
   */
  constructor() {
    super("Your session has expired.");

    // Preserve the custom error name for easier identification.
    this.name = "SessionExpiredError";
  }
}