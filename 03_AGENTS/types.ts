
// ZIA AGENT SYSTEM TYPES
// [LOCATION]: 02_AGENTS/types.ts

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    parameters: {
        type: 'OBJECT';
        properties: Record<string, any>;
        required?: string[];
    };
    // The deterministic code execution logic
    execute: (args: any, context?: any) => Promise<any> | any;
}

export interface AgentProfile {
    id: string;
    name: string;
    role: 'ROUTER' | 'CODER' | 'ANALYST' | 'SYSTEM';
    skills: string[]; // List of Skill IDs this agent can use
    systemPrompt: string;
}

export interface SkillExecutionResult {
    success: boolean;
    data: any;
    error?: string;
}
