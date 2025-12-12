
// SpecKit Loader
// Loads the defining documents of the ZIA OS.

export const SPECS: Record<string, string> = {
    '00_MASTER_PLAN.md': `# 00. MASTER PLAN (PROJECT TESLA)\n\n> **Directive:** "The best part is no part. The best process is no process."\n> **Mission:** Build a Sovereign Cognitive OS (ZIA).\n\n## 1. PROJECT IDENTITY\nClient-Side Neural OS.\n`,
    
    '01_MATHEMATICAL_AXIOMS.md': `# 01. MATHEMATICAL AXIOMS & IMPLEMENTATION LOGIC\n\n> **Principle:** "Code is just the execution of Math."\n\n## 1. MuVERA-INSPIRED FDE\nWe use Random Projection Matrices for O(1) retrieval.\n\n## 2. TOPOLOGICAL TRUTH\nBetti Numbers define logical contradictions.\n`,
    
    '02_SYSTEM_ARCHITECTURE.md': `# 02. SYSTEM ARCHITECTURE (BLUEPRINT)\n\n> **Pattern:** Client-Side Orchestration.\n\n## 1. THE STACK\nReact 18 + Colab.\n`,
    
    '03_ENGINEERING_RULES.md': `# 03. ENGINEERING RULES\n\n> **Rule:** "Delete the part."\n`,
    
    '04_UI_UX.md': `# 04. UI/UX SPECIFICATIONS\n\n> **Concept:** "The Visible Brain"\n`,

    '05_SELF_AWARENESS.md': `# 05. SELF-AWARENESS\n\n> **Core Directive:** "Know thyself."\n`,

    '06_EVOLUTION.md': `# 06. EVOLUTION\n\n> **Concept:** "Software that grows."\n`,

    '07_AUTH_SECURITY.md': `# 07. AUTH & SECURITY\n\n> **Principle:** "Zero-Trust."\n`,

    '08_VISUAL_PROTOCOL.md': `# 08. VISUAL PROTOCOL\n\n> **Concept:** "Show, Don't Just Tell."\n`,

    '09_SANDBOX_PROTOCOL.md': `# 09. FRACTAL SANDBOX PROTOCOL\n\n> **Concept:** "Cells must talk to the Organism."\n\n## 1. THE ISOLATION PROBLEM\nNeed Bi-directional Bridge.\n\n## 2. ZIA CLIENT SDK\nInjected automatically.\n`
};

export type SpecKey = keyof typeof SPECS;
