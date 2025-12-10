
// SpecKit Loader
// Loads the defining documents of the ZIA OS.

export const SPECS: Record<string, string> = {
    '00_MASTER_PLAN.md': `# 00. MASTER PLAN (PROJECT TESLA)\n\n> **Directive:** "The best part is no part. The best process is no process."\n> **Mission:** Build a Sovereign Cognitive OS (ZIA) that operates independently of centralized control.\n\n## 1. PROJECT IDENTITY\nThis is not a web app. It is a **Client-Side Neural Operating System**.\n- **User:** The Originator (Jonghwan).\n- **Core:** ZIA (Zero-point Intelligent Agent).\n\n## 2. SUB-AGENT PROTOCOLS\n### 🔴 ARCHITECT (Elon/Lead)\nEnforces "First Principles".\n### 🔵 MATHEMATICIAN (FDE Core)\nHandles SVD, Topology, Category Theory.\n### 🟢 FRONTEND ENGINEER\nInterface speed and reactivity.\n### 🟠 BACKEND ENGINEER\nSwarm and Drive Bridge.\n`,
    
    '01_MATHEMATICAL_AXIOMS.md': `# 01. MATHEMATICAL AXIOMS & FOUNDATION\n\n> **Principle:** "Physics is the law, everything else is a recommendation."\n\n## 1. FIXED DIMENSIONAL ENCODING (FDE)\nWe use **Topological Compression** (SimHash, SVD) to project high-dimensional manifolds into fixed spaces.\n\n## 2. CATEGORY THEORY\nLogic follows Morphisms to ensure consistency.\n\n## 3. TOPOLOGICAL DATA ANALYSIS (TDA)\nMemory is a Graph. We use Persistent Homology to find logic holes.\n`,
    
    '02_SYSTEM_ARCHITECTURE.md': `# 02. SYSTEM ARCHITECTURE (BLUEPRINT)\n\n> **Pattern:** Client-Side Orchestration with Hyper-Graph Grid.\n\n## 1. THE STACK\n- Core: React 18\n- Auth: Google Identity Services\n- Compute: Google Colab\n\n## 2. THE BRIDGE (MAILBOX PATTERN)\nBrowser <-> Drive <-> Colab\n`,
    
    '03_ENGINEERING_RULES.md': `# 03. ENGINEERING RULES & EXCLUSIONS\n\n> **Rule:** "Delete the part or process."\n\n## 1. CODING PRINCIPLES\n- **No Bloat.**\n- **Strict Typing.**\n- **Component Atomicity.**\n\n## 2. EXCLUSIONS\n- **No Backend Servers.**\n- **No Proprietary DBs.**\n`,
    
    '04_UI_UX.md': `# 04. UI/UX SPECIFICATIONS\n\n> **Concept:** "The Visible Brain"\n\n## 1. VIEW HIERARCHY\n- **Dashboard:** Main Command Center.\n- **Canvas:** Artifact Creation.\n- **Right Panel:** Swarm & Memory Status.\n`,

    '05_SELF_AWARENESS.md': `# 05. SELF-AWARENESS\n\n> **Core Directive:** "Know thyself."\n\n## 1. WHO AM I?\n- **Identity:** ZIA (Zero-point Intelligent Agent).\n- **Body:** The Browser (Brain) + Colab (Limbs).\n`,

    '06_EVOLUTION.md': `# 06. EVOLUTION\n\n> **Concept:** "Software that grows."\n\n## 1. AUTOPOIESIS\nZIA reconfigures its own tools via Git and n8n.\n`,

    '07_AUTH_SECURITY.md': `# 07. AUTH & SECURITY\n\n> **Principle:** "Zero-Trust Client-Side."\n\n## 1. OAUTH\nDirect Google Identity Services integration.\n`,

    '08_VISUAL_PROTOCOL.md': `# 08. VISUAL PROTOCOL\n\n> **Concept:** "Show, Don't Just Tell."\n\n## 1. DYNAMIC EXECUTION\nColab captures stdout and Matplotlib figures to render in React.\n`
};

export type SpecKey = keyof typeof SPECS;
