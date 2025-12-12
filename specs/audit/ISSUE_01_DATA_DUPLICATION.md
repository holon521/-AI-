
# ⚠️ ISSUE 01: SPECIFICATION DATA DUPLICATION

## 1. Problem Description
The system maintains two sources of truth for the system specifications ("The Soul"):
1.  **Markdown Files:** Located in `specs/*.md` (e.g., `specs/01_VISION.md`).
2.  **TypeScript String Literals:** Hardcoded in `01_SOUL/spec_loader.ts` as the `SPECS` constant.

## 2. Risk Analysis (Severity: Medium)
- **Split-Brain Condition:** If a developer updates the markdown files in `specs/` but forgets to update `spec_loader.ts`, the ZIA runtime (which reads `spec_loader.ts`) will operate on outdated axioms.
- **Maintenance Overhead:** Every documentation change requires double-entry.

## 3. Technical Root Cause
- Browsers cannot natively access the file system (`fs.readFile`) at runtime to read markdown files.
- The current solution manually embeds content into TS files to make them importable.

## 4. Proposed Solution
**Option A (Build Step):** Implement a build script (e.g., `scripts/sync_specs.js`) that reads `specs/*.md` and auto-generates `spec_loader.ts`.
**Option B (Fetch):** Move `specs/*.md` to the `public/` folder and use `fetch()` to load them at runtime.
