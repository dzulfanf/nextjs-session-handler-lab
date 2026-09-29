# Native Session Handler

A custom authentication and session management implementation built with Next.js, without using an authentication library.

This implementation is designed to explore how a production-oriented session lifecycle can be handled at the application level.

The implementation focuses on what happens when access tokens expire, multiple requests fail at the same time, refresh tokens become invalid, and users return to an inactive browser tab.

## Overview

The native implementation provides:

* Login
* Protected routes
* Access tokens
* Refresh tokens
* HttpOnly cookies
* Automatic session refresh
* Request retry
* Concurrent `401` handling
* Single-flight refresh
* Session expiration state
* Session-expired UI
* Callback URL handling
* Browser tab visibility detection

The implementation intentionally avoids authentication libraries so the underlying mechanics remain visible.

## Architecture

The authentication lifecycle is divided into several responsibilities:

```text
Browser
   │
   ▼
Next.js Application
   │
   ├── Protected routes
   │
   ├── API client
   │      │
   │      ├── Request
   │      ├── Handle 401
   │      ├── Refresh session
   │      └── Retry request
   │
   ├── Session state
   │      │
   │      └── Session expired
   │
   └── Session UI
          │
          ├── Session expired modal
          └── Login again
```

## Responsibility Boundaries

The native implementation separates authentication concerns into several layers.

### `lib/auth`

The `lib/auth` directory contains authentication and session-related domain logic.

```text
lib/auth/
├── errors.ts
├── mock-user.ts
├── session-events.ts
├── session.ts
└── token.ts

## Authentication Flow

A normal authenticated request follows this flow:

```text
Client
  │
  ▼
API request
  │
  ▼
Access token valid?
  │
  ├── Yes ──────────► 200 OK
  │
  └── No
       │
       ▼
      401
       │
       ▼
 Refresh session
       │
       ├── Success ──► Retry request
       │                    │
       │                    ▼
       │                  200 OK
       │
       └── Failed ───► Session expired
```

The client does not immediately redirect to the login page when the access token expires.

Instead, it first attempts to recover the session.

## Token Lifecycle

The implementation uses two tokens:

### Access Token

The access token is short-lived and is used for authenticated API requests.

When the access token expires, the API responds with `401`.

### Refresh Token

The refresh token is used to obtain a new access token.

It is stored in an HttpOnly cookie so client-side JavaScript cannot directly access it.

```text
Access token
     │
     │ expires
     ▼
   401
     │
     ▼
Refresh token
     │
     ├── Valid ──► New access token
     │
     └── Invalid ► Session expired
```

## API Client

Authenticated API requests are centralized through the API client.

The API client is responsible for:

1. Sending the original request.
2. Detecting `401` responses.
3. Refreshing the session.
4. Retrying the original request.
5. Returning the final response.
6. Preventing repeated refresh attempts after the session becomes unrecoverable.

This keeps authentication recovery logic out of individual pages and components.

## Concurrent `401` Handling

A common production scenario occurs when several API requests receive `401` at approximately the same time.

Without protection:

```text
Request A ──► 401 ──► Refresh
Request B ──► 401 ──► Refresh
Request C ──► 401 ──► Refresh
Request D ──► 401 ──► Refresh
Request E ──► 401 ──► Refresh
```

This can create unnecessary refresh requests and race conditions.

The implementation uses a shared refresh promise:

```text
Request A ──┐
Request B ──┤
Request C ──┼──► Shared refresh promise
Request D ──┤
Request E ──┘
                 │
                 ▼
             One refresh
                 │
                 ▼
            Retry requests
```

When a refresh is already running, additional requests reuse the same promise instead of starting another refresh operation.

This is commonly referred to as a **single-flight** or **refresh lock** pattern.

## Session Expiration

If the refresh operation fails, the application marks the session as expired.

The application does not immediately redirect the user.

Instead, the session-expired state is propagated to the UI.

```text
Refresh failed
      │
      ▼
Session expired
      │
      ▼
Session-expired UI
      │
      ▼
Login again
```

This allows the user to explicitly recover the session without unexpectedly losing their current application state.

## Session Expired Circuit Breaker

Once the session is known to be unrecoverable, additional API requests do not repeatedly attempt authentication recovery.

Instead:

```text
Session expired
      │
      ├── API request ──► SessionExpiredError
      │
      ├── API request ──► SessionExpiredError
      │
      └── API request ──► SessionExpiredError
```

This prevents unnecessary calls to the API and refresh endpoint after the session has already been determined to be expired.

The session state can be reset after the user successfully authenticates again.

## Browser Visibility Handling

A user may leave the application open in a browser tab while their session expires.

The application listens for the browser `visibilitychange` event.

When the user returns to the tab:

```text
Tab becomes visible
       │
       ▼
Check session
       │
       ▼
/api/me
       │
       ├── 200 ──► Continue normally
       │
       └── 401
             │
             ▼
          Refresh
             │
             ├── Success ──► Continue normally
             │
             └── Failed ───► Session expired UI
```

This allows the application to proactively detect an expired session when the user returns to an inactive tab.

The browser visibility event itself does not determine whether the session is expired. The application validates the session through an authenticated API request.

## Callback URL

When authentication is required, the original destination can be preserved through a callback URL.

For example:

```text
/dashboard/orders/123
        │
        ▼
Session expired
        │
        ▼
/login?callbackUrl=/dashboard/orders/123
        │
        ▼
Successful login
        │
        ▼
/dashboard/orders/123
```

The callback URL is validated before being used for navigation.

Only internal relative paths are accepted to prevent redirects to external origins.

## Testing Scenarios

The API Lab provides a small playground for testing the authentication lifecycle.

### Normal request

```text
Login
  ↓
Fetch Profile
  ↓
200
```

### Expired access token

```text
Access token expires
  ↓
Fetch Profile
  ↓
401
  ↓
Refresh
  ↓
Retry
  ↓
200
```

### Concurrent requests

```text
Access token expires
  ↓
5 Concurrent Requests
  ↓
5 × 401
  ↓
1 × Refresh
  ↓
5 × Retry
```

### Expired refresh token

```text
Access token expires
  ↓
Refresh token also expires
  ↓
5 × 401
  ↓
1 × Refresh
  ↓
Refresh fails
  ↓
Session expired UI
```

### Requests after session expiration

```text
Session expired
  ↓
Fetch Profile
  ↓
SessionExpiredError
  ↓
No API request
  ↓
No refresh request
```

### Returning to an inactive tab

```text
Login
  ↓
Open protected page
  ↓
Leave browser tab
  ↓
Session expires
  ↓
Return to tab
  ↓
visibilitychange
  ↓
Session check
  ↓
Session expired UI
```

## Project Structure

```text
native/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── refresh/
│   │   │       └── route.ts
│   │   │
│   │   └── me/
│   │       └── route.ts
│   │
│   ├── api-lab/
│   │   └── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   └── auth/
│       ├── session-expired-modal.tsx
│       └── session-visibility-handler.tsx
│
├── hooks/
│   └── use-session-visibility.ts
│
├── lib/
│   ├── api/
│   │   └── client.ts
│   │
│   └── auth/
│       ├── errors.ts
│       ├── mock-user.ts
│       ├── session-events.ts
│       ├── session.ts
│       └── token.ts
│
├── types/
│   └── auth.ts
│
├── public/
├── .env.local
├── package.json
└── README.md
```

## Design Principles

The implementation follows several principles:

### Centralize authentication recovery

Pages should not implement their own refresh logic.

```text
Page
  ↓
apiClient
  ↓
Authentication recovery
```

### Refresh once

Concurrent requests should share the same refresh operation.

### Retry once

A request should not enter an infinite refresh/retry loop.

### Do not force logout immediately

An expired session should be communicated to the user through an explicit session-expired state.

### Validate callback destinations

Authentication redirects should only target trusted internal paths.

### Keep browser lifecycle separate from authentication state

Browser events such as `visibilitychange` trigger a session check, but the API remains the source of truth for authentication validity.

## Key Takeaways

The main purpose of this implementation is not to build another authentication library.

It is to understand the problems that authentication libraries solve.

The native implementation makes those responsibilities explicit:

```text
Token lifecycle
      +
Request recovery
      +
Concurrency control
      +
Session state
      +
Browser lifecycle
      +
User recovery
```

The next implementation will reproduce these scenarios using Auth.js and compare which responsibilities can be delegated to the library and which still need application-level handling.