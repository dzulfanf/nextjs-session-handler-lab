/**
 * Event emitted when the current authentication session
 * can no longer be recovered.
 */
export const SESSION_EXPIRED_EVENT = "session-expired";

/**
 * Tracks whether the current browser session has already
 * been marked as expired.
 */
let sessionExpired = false;

/**
 * Returns whether the current session has already been
 * marked as expired.
 */
export function isSessionExpired(): boolean {
  // Return the current session expiration state.
  return sessionExpired;
}

/**
 * Marks the current session as expired and notifies the application.
 *
 * Multiple callers are intentionally ignored after the first
 * expiration event.
 */
export function notifySessionExpired(): void {
  // Do nothing when the session has already been marked as expired.
  if (sessionExpired) {
    return;
  }

  // Mark the current session as expired.
  sessionExpired = true;

  // Notify all listeners in the browser about the expired session.
  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT),
  );
}

/**
 * Resets the session expiration state.
 *
 * This should be called after a successful login.
 */
export function resetSessionExpired(): void {
  // Mark the current session as active again.
  sessionExpired = false;
}