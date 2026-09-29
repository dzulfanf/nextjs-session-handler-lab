"use client";

import { useEffect, useState } from "react";

import {
  SESSION_EXPIRED_EVENT,
} from "@/lib/auth/session-events";

/**
 * Displays a modal when the authentication session
 * can no longer be recovered.
 */
export function SessionExpiredModal() {
  // Track whether the session-expired modal is visible.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    /**
     * Handles the global session-expired event.
     */
    function handleSessionExpired() {
      // Show the session-expired modal.
      setIsOpen(true);
    }

    // Listen for session expiration events.
    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleSessionExpired,
    );

    // Remove the listener when the component unmounts.
    return () => {
      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, []);

  // Do not render the modal while the session is active.
  if (!isOpen) {
    return null;
  }

  /**
   * Redirects the user to login while preserving
   * the current page as the callback URL.
   */
  function handleLoginAgain() {
    // Read the current path and query string.
    const callbackUrl =
      window.location.pathname + window.location.search;

    // Encode the callback URL for use as a query parameter.
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    // Redirect to login with the current page as the callback.
    window.location.href =
      `/login?callbackUrl=${encodedCallbackUrl}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wider text-[#737373]">
          Session
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Session expired
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#737373]">
          Your session has expired. Please sign in again
          to continue.
        </p>

        <button
          type="button"
          onClick={handleLoginAgain}
          className="mt-6 h-11 w-full rounded-2xl bg-[#171719] text-sm font-semibold text-white"
        >
          Login again
        </button>
      </div>
    </div>
  );
}