"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import Link from "next/link";

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Dashboard page.
 *
 * The page uses the centralized API client to retrieve the
 * authenticated user's information.
 */
export default function DashboardPage() {
  // Store the authenticated user returned by the API.
  const [user, setUser] = useState<MeResponse["user"] | null>(null);

  // Track the initial API request.
  const [isLoading, setIsLoading] = useState(true);

  // Store an API error for demonstration purposes.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Loads the authenticated user's information.
     */
    async function loadUser() {
      try {
        // Request the current user through the centralized API client.
        const data = await apiClient<MeResponse>("/api/me");

        // Store the authenticated user.
        setUser(data.user);
      } catch (error) {
        // Convert the caught error into a user-readable message.
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load user.",
        );
      } finally {
        // Finish the initial loading state.
        setIsLoading(false);
      }
    }

    // Start loading the authenticated user.
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-8 text-[#171719]">
      <div className="mx-auto w-full max-w-2xl flex flex-col">
        <nav className="mb-12 flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#171719] px-4 py-2 text-sm font-medium text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/api-lab"
            className="rounded-xl border border-[#e5e5e7] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f7f7f8]"
          >
            API Lab
          </Link>
        </nav>

        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {user?.name}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {user?.email}
          </p>
        </div>
      </div>
    </main> 
  );
}