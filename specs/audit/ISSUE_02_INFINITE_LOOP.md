
# 🚨 ISSUE 02: SWARM AUTO-TRIGGER INFINITE LOOP

## 1. Problem Description
In `useZiaOS.ts`, the new Multi-Turn Automation logic automatically triggers the Agent when a Swarm result arrives.

```typescript
if (lastMsg.metadata?.swarmResult) {
    setTimeout(() => {
        handleSendMessage('[SYSTEM_TRIGGER] ...');
    }, 800);
}
```

## 2. Risk Analysis (Severity: High)
- **Recursive Expansion:** If the Agent analyzes a Swarm result and decides "I need to run another Python task", it will dispatch a new task.
- **The Loop:** Task -> Result -> Auto-Trigger -> Agent Decision -> New Task -> Result...
- **Consequence:** Infinite API usage, Colab overload, and browser freeze. There is no counter or "Stop" condition.

## 3. Technical Root Cause
- The `[SYSTEM_TRIGGER]` logic lacks a `recursionDepth` or `maxTurns` check.
- The LLM's system prompt does not explicitly forbid chained execution without user confirmation.

## 4. Proposed Solution
1.  **Circuit Breaker:** Add a `recursionCount` state to `useZiaOS`. If it exceeds 3, stop auto-triggering and ask user for permission to continue.
2.  **Stop Token:** Inject a system instruction to the Agent: "If you have run a tool 3 times in a row, STOP and summarize."
