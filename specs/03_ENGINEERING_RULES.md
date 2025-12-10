# 03. ENGINEERING RULES & EXCLUSIONS

> **Rule:** "Delete the part or process."

## 1. CODING PRINCIPLES
- **No Bloat:** Do not import heavy libraries (like Three.js or TensorFlow.js) into the main bundle unless critical. Use the **Swarm** (Colab) for heavy lifting.
- **Strict Typing:** TypeScript `any` is forbidden unless wrapping a legacy JS library.
- **Component Atomicity:** One component, one responsibility. If a file exceeds 300 lines, refactor.

## 2. EXCLUSIONS (WHAT WE DO NOT DO)
- **No Backend Servers:** We do not deploy AWS/Vercel backends. ZIA lives in the browser and connects directly to APIs.
- **No Proprietary Databases:** We use standard JSON or open-source Vector formats (Chroma/Parquet).
- **No "Black Box" Logic:** Every decision by the AI must be traceable via the **Cognitive Graph**.

## 3. ERROR HANDLING
- **Fail Gracefully:** If Colab is offline, fall back to Local Logic (SimHash).
- **Self-Correction:** If the LLM generates invalid JSON, the system must attempt to repair it automatically before crashing.

## 4. DEPLOYMENT
- The app must be deployable as a static single HTML file (or minimal bundle) that can run on any static host (GitHub Pages, Netlify, or Local File).
