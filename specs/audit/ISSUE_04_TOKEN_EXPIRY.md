
# ℹ️ ISSUE 04: OAUTH TOKEN EXPIRY UX

## 1. Problem Description
Google OAuth tokens expire after 1 hour. When this happens, `drive_bridge.ts` correctly catches the 401 error and sets `accessToken = null`. However, the UI does not aggressively notify the user.

## 2. Risk Analysis (Severity: Low)
- **Silent Failure:** A long-running Swarm task might finish, but the App fails to read the result because the token expired during execution.
- **User Confusion:** The user sees "Swarm Active" but gets no response.

## 3. Technical Root Cause
- The 401 error is caught in the Data Layer, but there is no Event Emitter or Callback to trigger a UI Toast/Modal in the View Layer.

## 4. Proposed Solution
- Implement a `onAuthExpired` callback in `DriveBridge`.
- `useZiaOS` listens to this callback and sets a `showLoginModal(true)` state or displays a persistent red banner: "SESSION EXPIRED - RECONNECT".
