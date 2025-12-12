
# ⚠️ ISSUE 03: GOD HOOK ANTIPATTERN (useZiaOS)

## 1. Problem Description
The `hooks/useZiaOS.ts` file has grown too large (>300 lines) and manages too many unrelated concerns:
- UI State (Canvas, Panels)
- Authentication (API Keys)
- Business Logic (Message handling)
- Infrastructure (Drive Polling)
- Audio (TTS)

## 2. Risk Analysis (Severity: Medium)
- **Rigidity:** Changing one part (e.g., TTS) might break unrelated parts (e.g., Swarm Polling) due to shared state dependencies.
- **Performance:** Any state update in this hook triggers a re-render of the entire App.
- **Testability:** Impossible to unit test isolation logic.

## 3. Technical Root Cause
- Rapid prototyping prioritized a single entry point for all state.

## 4. Proposed Solution
Decompose `useZiaOS` into specialized hooks:
- `useZiaAuth`: Manages API keys and Drive tokens.
- `useSwarmBridge`: Manages polling and connectivity status.
- `useAgentCore`: Manages messages and LLM interaction.
- `useZiaUI`: Manages panels and canvas state.
