import { SessionExpiredError } from "../auth/errors";
import { isSessionExpired, notifySessionExpired } from "../auth/session-events";

/**
 * Configuration for an API request.
 *
 * Extends the native RequestInit options while allowing the API client
 * to control whether authentication recovery should be skipped.
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * Prevents the API client from attempting to refresh the session
   * when the request receives a 401 response.
   *
   * This is required for authentication endpoints such as /refresh.
   */
  skipAuthRefresh?: boolean;
}

/**
 * Represents the response returned by the refresh endpoint.
 */
interface RefreshResponse {
  message: string;
}

/**
 * Holds the currently running refresh request.
 *
 * Multiple API requests that receive 401 at the same time will
 * share this promise instead of creating multiple refresh requests.
 */
let refreshPromise: Promise<void> | null = null;

/**
 * Refreshes the current authentication session.
 *
 * If another request is already refreshing the session, this function
 * returns the existing promise instead of starting another refresh.
 */
async function refreshSession(): Promise<void> {
  // Reuse the existing refresh operation when one is already running.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Request a new access token from the server.
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      // Parse the refresh response.
      const data = (await response.json()) as RefreshResponse;

      // Throw when the session cannot be refreshed.
      if (!response.ok) {
        throw new Error(
          data.message ?? "Unable to refresh session",
        );
      }
    } finally {
      // Allow a future 401 to start a new refresh operation.
      refreshPromise = null;
    }
  })();

  // Return the shared refresh operation.
  return refreshPromise;
}

/**
 * Performs an API request through the application's centralized
 * API client.
 */
export async function apiClient<T>(
  input: RequestInfo | URL,
  options: ApiRequestOptions = {},
): Promise<T> {
  // Extract client-specific options before passing the remaining
  // options to the native fetch API.
  const { skipAuthRefresh = false, ...fetchOptions } = options;

  // Immediately stop authentication recovery when the session
  // has already been marked as expired.
  if (!skipAuthRefresh && isSessionExpired()) {
    // Expose the same dedicated error used by failed refreshes.
    throw new SessionExpiredError();
  }

  // Perform the original API request.
  const response = await fetch(input, {
    ...fetchOptions,
    credentials: "include",
  });

  // Handle requests that explicitly skip authentication recovery.
  if (skipAuthRefresh) {
    return handleResponse<T>(response);
  }

  // Handle an unauthorized response.
  if (response.status === 401) {
    // Stop immediately when another request has already determined
    // that the session is expired.
    if (isSessionExpired()) {
      throw new SessionExpiredError();
    }

    try {
      // Attempt to recover the authentication session.
      await refreshSession();
    } catch {
      // Mark the session as expired and notify the application.
      notifySessionExpired();

      // Expose a dedicated authentication error to the caller.
      throw new SessionExpiredError();
    }

    // Retry the original request after successful session recovery.
    const retryResponse = await fetch(input, {
      ...fetchOptions,
      credentials: "include",
    });

    // A second 401 means the session could not be recovered.
    if (retryResponse.status === 401) {
      // Mark the session as expired and notify the application.
      notifySessionExpired();

      // Stop further processing.
      throw new SessionExpiredError();
    }

    // Handle the successful retry response.
    return handleResponse<T>(retryResponse);
  }

  // Handle all non-401 responses normally.
  return handleResponse<T>(response);
}

/**
 * Converts an HTTP response into the expected API result.
 *
 * Successful responses are returned as typed JSON.
 * Failed responses are converted into JavaScript errors.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Parse the JSON response body.
  const data = await response.json();

  // Convert HTTP errors into JavaScript errors.
  if (!response.ok) {
    throw new Error(data.message ?? "API request failed");
  }

  // Return the response body using the caller-provided type.
  return data as T;
}