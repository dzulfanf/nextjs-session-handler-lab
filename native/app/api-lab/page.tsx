"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";

import Link from "next/link";

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RequestResult {
  id: string;
  status: "success" | "error";
  message: string;
}

/**
 * API Lab page.
 *
 * This page is intentionally used as a testing playground for
 * authentication lifecycle scenarios such as:
 *
 * - Normal API requests
 * - Expired access tokens
 * - Automatic token refresh
 * - Concurrent 401 responses
 * - Request retry
 */
export default function ApiLabPage() {
  // Store the latest request results displayed by the playground.
  const [results, setResults] = useState<RequestResult[]>([]);

  // Track whether a test is currently running.
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Sends a single authenticated request.
   */
  async function handleSingleRequest() {
    // Start the loading state.
    setIsLoading(true);

    // Create a unique identifier for this request instance.
    const requestId = crypto.randomUUID();

    try {
      // Request the current user through the centralized API client.
      const data = await apiClient<MeResponse>("/api/me");

      // Add the successful request to the result list.
      setResults((current) => [
        ...current,
        {
          id: requestId,
          status: "success",
          message: `${data.user.name} authenticated successfully.`,
        },
      ]);
    } catch (error) {
      // Add the failed request to the result list.
      setResults((current) => [
        ...current,
        {
          id: requestId,
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Request failed.",
        },
      ]);
    } finally {
      // Finish the loading state.
      setIsLoading(false);
    }
  }

  /**
   * Sends multiple authenticated requests at the same time.
   *
   * This intentionally uses Promise.all so multiple requests can
   * receive a 401 response concurrently when the access token expires.
   */
  async function handleConcurrentRequests() {
    // Start the loading state.
    setIsLoading(true);

    // Create five requests that start at approximately the same time.
    const requests = Array.from({ length: 5 }, (_, index) => {
      // Create a unique identifier for this request instance.
      const requestId = crypto.randomUUID();

      return apiClient<MeResponse>("/api/me")
        .then((data) => ({
          id: requestId,
          status: "success" as const,
          message: `Request ${index + 1}: ${data.user.name} - request succeeded.`,
        }))
        .catch((error) => ({
          id: requestId,
          status: "error" as const,
          message:
            error instanceof Error
              ? `Request ${index + 1}: ${error.message}`
              : `Request ${index + 1}: Request failed.`,
        }));
    });

    // Wait until all five requests have completed.
    const requestResults = await Promise.all(requests);

    // Add all results to the playground.
    setResults((current) => [...current, ...requestResults]);

    // Finish the loading state.
    setIsLoading(false);
  }

  /**
   * Clears all previously displayed request results.
   */
  function handleClearResults() {
    // Reset the request result list.
    setResults([]);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-8 text-[#171719]">
      <div className="mx-auto w-full max-w-2xl">
        {/* Page navigation */}
        <nav className="mb-6 flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#e5e5e7] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f7f7f8]"
          >
            Dashboard
          </Link>

          <Link
            href="/api-lab"
            className="rounded-xl bg-[#171719] px-4 py-2 text-sm font-medium text-white"
          >
            API Lab
          </Link>
        </nav>

        {/* Page header */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[#737373]">
            Session Handler Lab
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            API Playground
          </h1>

          <p className="mt-1 text-sm text-[#737373]">
            Test authentication, token refresh, and concurrent requests.
          </p>
        </header>

        {/* Testing controls */}
        <section className="rounded-[28px] border border-[#e5e5e7] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Single request */}
            <button
              type="button"
              onClick={handleSingleRequest}
              disabled={isLoading}
              className="h-11 flex-1 rounded-2xl bg-[#171719] px-4 text-sm font-semibold text-white transition hover:bg-[#2a2a2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fetch Profile
            </button>

            {/* Concurrent requests */}
            <button
              type="button"
              onClick={handleConcurrentRequests}
              disabled={isLoading}
              className="h-11 flex-1 rounded-2xl border border-[#e5e5e7] bg-white px-4 text-sm font-semibold text-[#171719] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              5 Concurrent Requests
            </button>
          </div>

          {/* Clear results */}
          <button
            type="button"
            onClick={handleClearResults}
            disabled={results.length === 0}
            className="mt-3 text-xs font-medium text-[#737373] transition hover:text-[#171719] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear results
          </button>
        </section>

        {/* Request results */}
        <section className="mt-4 rounded-[28px] border border-[#e5e5e7] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Request results
            </h2>

            <span className="text-xs text-[#a3a3a3]">
              {results.length} requests
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f7f8] px-4 py-8 text-center">
              <p className="text-sm text-[#737373]">
                No requests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-start gap-3 rounded-2xl bg-[#f7f7f8] px-4 py-3"
                >
                  <span
                    className={`mt-0.5 text-xs font-semibold ${
                      result.status === "success"
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {result.status === "success" ? "200" : "ERR"}
                  </span>

                  <p className="text-sm text-[#525252]">
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Testing instructions */}
        <section className="mt-4 rounded-[28px] border border-[#e5e5e7] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold">
            Test scenario
          </h2>

          <ol className="mt-3 space-y-2 text-sm text-[#737373]">
            <li>1. Login normally.</li>
            <li>2. Open this API playground.</li>
            <li>3. Wait until the access token expires.</li>
            <li>4. Click &quot;5 Concurrent Requests&quot;.</li>
            <li>5. Inspect the Network tab.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}