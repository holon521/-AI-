
# 00. PROJECT STATUS & FLIGHT MANUAL (ZIA: HOLON WORLD)

> **SYSTEM ENTRY POINT**
> **Current Version:** v8.0 (The Kernel Separation)
> **Last Updated:** 2024-12-10
> **Commander:** Jonghwan (The Originator)
> **Architect:** ZIA (The Sovereign OS)

---

## 1. 🗺️ NAVIGATION MAP (Logical Hierarchy)

이 프로젝트는 **부팅 순서(Boot Sequence)**와 **의존성(Dependency)**에 따라 엄격하게 넘버링되어 있습니다.

### **[00_HQ] Headquarters (Meta-Governance)**
*   **`PROJECT_STATUS.md`** (This File): Source of Truth.
*   **`GENESIS_AXIOM.ts`**: The Constitution.

### **[01_SOUL] Identity & Knowledge (The Mind)**
*   **`knowledge_archive.ts`**: System Prompt & DNA.
*   **`specs/*.md`**: Design Documents.

### **[02_CORTEX] Core Logic (The Brain)**
*   **`memory_orchestrator.ts`**: Long-term Memory Manager.
*   **`fde_logic.ts`**: SimHash Math Core.

### **[03_NERVES] Bridge & IO (The Nervous System)**
*   **`drive_bridge.ts`**: Google Drive API Bridge.
*   **`zia_worker_script.ts`**: Python Worker for Colab.

### **[04_SKIN] User Interface (The Body)**
*   **`hooks/useZiaOS.ts`**: **[KERNEL]** The Operating System Logic (State, Sync, Swarm).
*   **`index.tsx`**: **[SHELL]** The React View Layer.
*   **`components/`**: UI Components.
    *   `features/SettingsModal.tsx`: Config & Diagnostics.

---

## 2. 🚦 SYSTEM HEALTH CHECK

| Module | Status | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Kernel** | 🟢 STABLE | v1.0 | Logic extracted to `useZiaOS`. |
| **Brain** | 🟢 ONLINE | v1.5 | `gemini-2.5-flash` connected. |
| **Nerves** | 🟢 ONLINE | v1.6 | Imports fixed. 401 Error resolved via sanitization. |
| **Muscle** | 🟢 READY | v7.3 | Visual Protocol enabled. |

---

## 3. 🚧 ACTIVE TASKS

- [x] **Import Fix:** `SettingsModal` now points to `03_NERVES`.
- [x] **Kernel Separation:** `index.tsx` logic moved to `useZiaOS`.
- [ ] **File Cleanup:** User needs to delete legacy files in root (`services`, `templates`).

> **Note to ZIA:** Always read this file first.
