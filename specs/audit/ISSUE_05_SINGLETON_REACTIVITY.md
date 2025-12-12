
# ⚠️ ISSUE 05: SINGLETON REACTIVITY GAP

## 1. Problem Description
The system uses Singleton Classes for core logic:
- `orchestrator` (Memory)
- `driveBridge` (Network)
- `skillRegistry` (Tools)

These classes maintain their own internal state (e.g., `memoryGraph`). However, React components (`useZiaOS`) do not automatically know when this internal state changes.
Currently, the UI only updates because `useZiaOS` *manually* calls methods like `setMemoryStats(orchestrator.getStats())` after specific actions.

## 2. Risk Analysis (Severity: Medium)
- **UI Desync:** If a background process (e.g., a Swarm result arriving) updates the Memory Graph, the UI counters (Identity/User/World) will not update until the user types a message or triggers a refresh.
- **Fragile Code:** Every time a developer adds a logic function, they must remember to manually trigger a UI state update. Forgetting this leads to "stale UI" bugs.

## 3. Technical Root Cause
- The Service Layer (Classes) lacks a Subscription/Observer pattern.
- React's `useState` is decoupled from the Class properties.

## 4. Proposed Solution
- Implement a lightweight **Observer Pattern (EventEmitter)** in the core classes.
- `orchestrator.subscribe((newStats) => setMemoryStats(newStats))`
- This ensures the UI is always a perfect reflection of the Core Logic.
