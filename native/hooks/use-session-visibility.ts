"use client";

import { useEffect } from "react";

import { apiClient } from "@/lib/api/client";

/**
 * Checks the current authentication session whenever
 * the browser tab becomes visible again.
 */
export function useSessionVisibility() {
  useEffect(() => {
    /**
     * Handles the browser visibility change event.
     */
    async function handleVisibilityChange() {
      // Ignore events when the user is still viewing another tab/window.
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        // Validate the current authentication session.
        await apiClient("/api/me");
      } catch {
        // The centralized API client handles session expiration.
        // No additional action is required here.
      }
    }

    // Listen for browser tab visibility changes.
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    // Clean up the event listener when the component unmounts.
    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);
}