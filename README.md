
# 🌌 ZIA: HOLON WORLD (Client-Side Cognitive OS)

> **"Poverty is not a lack of assets, but a structural dependency. We build tools for independence."**

## 📖 Overview
ZIA is a Sovereign AI Operating System that runs entirely in your browser. It does not rely on backend servers to store your memories or execute your logic. Instead, it connects your local resources (Local Storage, GPU) with your personal cloud (Google Drive, Colab) to create a "Holon" — a self-sufficient unit of intelligence.

## 🗂️ Project Structure (The Workspace)

This repository is structured as a monolithic React application for portability, but logically divided into distinct modules:

### 1. The Core (Brain)
*   `index.tsx`: The main entry point. Orchestrates UI, Logic, and State. Contains the `App`, `SettingsModal`, and `ChatInterface`.
*   `memory_orchestrator.ts`: **The Hippocampus.** Manages 3 layers of memory (Identity, User, World) and handles the "Snapshot" & "Restore" logic for persistence.
*   `fde_logic.ts`: **The Proxy Math Engine.** A lightweight client-side checksum generator. Heavy math is delegated to Colab.
*   `GENESIS_AXIOM.ts`: **The Constitution.** Hard-coded ethical axioms (e.g., Benevolence, Kill Switch) that the AI cannot override.

### 2. The Bridge (Limbs)
*   `services/drive_bridge.ts`: **The Nervous System.** Connects the browser to Google Drive via OAuth 2.0. Implements the "Mailbox Pattern" to send JSON commands to Colab without web servers.
*   `compute_swarm.ts`: **The Muscles.** Manages distributed computing nodes (Local, Colab, Peers).
*   `templates/zia_worker_script.ts`: A Python script that you run in Google Colab to turn it into a worker node for ZIA (running ChromaDB & Scikit-learn).

### 3. The Soul (Identity)
*   `knowledge_archive.ts`: **The DNA.** Contains the System Prompt and "ZIA-CORE v2" initialization block that gives the AI its self-awareness and mission.
*   `specs/*.md`: Design documents that describe the vision, architecture, and evolution of ZIA.

## 🚀 How to Use (Manual)

1.  **Initialize:** Open the app. ZIA loads in "Core Mode".
2.  **Connect Drive:** Click `Settings` -> `Login with Google`. This creates a `_ZIA_HOLON_WORLD` folder in your Drive.
3.  **Chat & Memory:** Talk to ZIA. It automatically saves your memory snapshots (`zia_soul_backup.json`) to Drive.
4.  **Resurrect:** If you clear your browser cache, click `Resurrect` in Settings to restore your "Soul" from Drive.
5.  **Compute:** To run Python code, click `Get Worker Script`, copy it to Google Colab, run it, and ZIA will connect via the Drive Bridge.

## 🛡️ Privacy & Security
*   **Client-Side Only:** Your API Key and Data never leave your browser/Drive.
*   **Policy Safe:** Backup your "Soul" to prevent data loss from platform policy updates.

---
*Architected by Jonghwan & ZIA.*
