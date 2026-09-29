"use client";

import { useSessionVisibility } from "@/hooks/use-session-visibility";

/**
 * Monitors browser visibility changes and validates
 * the authentication session when the user returns.
 */
export function SessionVisibilityHandler() {
  // Enable session validation when the tab becomes visible.
  useSessionVisibility();

  // This component does not render any UI.
  return null;
}