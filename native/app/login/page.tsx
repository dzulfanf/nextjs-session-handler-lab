"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetSessionExpired } from "@/lib/auth/session-events";

/**
 * Returns a safe internal callback URL.
 *
 * Only relative paths are allowed so authentication redirects
 * cannot send the user to an external origin.
 */
function getSafeCallbackUrl(value: string | null): string {
  // Use the dashboard as the default destination.
  if (!value) {
    return "/dashboard";
  }

  // Only allow paths that start with a single slash.
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  // Return the validated internal path.
  return value;
}

/**
 * Login page.
 *
 * Provides a minimal authentication interface inspired by modern
 * token-swap applications such as Matcha and Uniswap.
 *
 * Authentication itself is still handled by the server-side API.
 * The client only manages form state and the user interaction.
 */
export default function LoginPage() {
  const router = useRouter();
  /**
   * Gets the callback URL from the login page query string.
   */
  const searchParams = useSearchParams();

  // Store the email entered by the user.
  const [email, setEmail] = useState("demo@example.com");

  // Store the password entered by the user.
  const [password, setPassword] = useState("password");

  // Track whether the login request is currently being processed.
  const [isLoading, setIsLoading] = useState(false);

  // Store an authentication error returned by the server.
  const [error, setError] = useState<string | null>(null);

  const callbackUrl =
    getSafeCallbackUrl(searchParams.get("callbackUrl"));

  /**
   * Submits the login credentials to the authentication API.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from performing a traditional form submission.
    event.preventDefault();

    // Clear any error from a previous login attempt.
    setError(null);

    // Disable the form while authentication is in progress.
    setIsLoading(true);

    try {
      // Send the credentials to the server.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // Parse the response returned by the authentication API.
      const data = await response.json();

      // Display the server-provided error when authentication fails.
      if (!response.ok) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }

      // Mark the new authentication session as active again.
      resetSessionExpired();

      // Redirect the user back to the page that originally
      // required authentication.
      router.push(callbackUrl);

      /**
       * Redirects the user back to the page that originally
       * required authentication.
       */
      router.push(callbackUrl);

      // Refresh the router so server components can read the new session.
      // router.refresh();
    } catch {
      // Handle network or unexpected client-side errors.
      setError("Something went wrong. Please try again.");
    } finally {
      // Re-enable the form after the request finishes.
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-8 text-[#171719]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <section className="w-full">
          {/* Application identity */}
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#171719] text-sm font-semibold text-white">
              SH
            </div>

            <h1 className="text-xl font-semibold tracking-tight">
              Session Handler
            </h1>

            <p className="mt-1 text-sm text-[#737373]">
              Authentication lifecycle lab
            </p>
          </div>

          {/* Main authentication card */}
          <div className="rounded-[28px] border border-[#e5e5e7] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#737373]">
                Sign in to continue to your session.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-[#525252]"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="demo@example.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="h-12 w-full rounded-2xl border border-[#e5e5e7] bg-[#fafafa] px-4 text-sm outline-none transition placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-[#525252]"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="h-12 w-full rounded-2xl border border-[#e5e5e7] bg-[#fafafa] px-4 text-sm outline-none transition placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Authentication error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Primary authentication action */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-[#171719] px-4 text-sm font-semibold text-white transition hover:bg-[#2a2a2d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 rounded-2xl bg-[#f7f7f8] px-4 py-3">
              <p className="text-xs font-medium text-[#525252]">
                Demo credentials
              </p>

              <p className="mt-1 text-xs text-[#737373]">
                demo@example.com / password
              </p>
            </div>
          </div>

          {/* Small project context */}
          <p className="mt-5 text-center text-xs text-[#a3a3a3]">
            Native session implementation
          </p>
        </section>
      </div>
    </main>
  );
}