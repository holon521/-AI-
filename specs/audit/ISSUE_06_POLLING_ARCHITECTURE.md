
# ⚠️ ISSUE 06: INEFFICIENT POLLING ARCHITECTURE

## 1. Problem Description
In `useZiaOS.ts`, the connection to the Swarm (Google Drive Bridge) relies on a `setInterval` loop running every 2000ms.

```typescript
interval = setInterval(async () => {
    // Checks Drive for new files...
}, 2000);
```

## 2. Risk Analysis (Severity: Medium)
- **Latency:** User has to wait up to 2 seconds *after* the Swarm finishes before seeing the result.
- **Resource Waste:** The browser makes network requests even when nothing is happening, consuming battery and API quota.
- **Thread Blocking:** If the Drive check takes long, it can stutter the UI main thread.

## 3. Technical Root Cause
- Absence of a WebSocket (due to Colab restrictions) forced a polling design.
- However, the polling logic is tightly coupled inside the React Component (`useZiaOS`) rather than a dedicated Web Worker or Service.

## 4. Proposed Solution
- **Short Term:** Optimize polling to "Adaptive Interval" (fast when active, slow when idle).
- **Long Term:** Move the polling logic to a **Web Worker**. This keeps the UI thread free (60fps) and allows the worker to handle the async I/O more aggressively without freezing the interface.
