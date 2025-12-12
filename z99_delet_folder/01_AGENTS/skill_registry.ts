
// ZIA SKILL REGISTRY & DISPATCHER v1.0
// [LOCATION]: 01_AGENTS/skill_registry.ts
// Handles the registration and execution of deterministic skills.

import { AgentSkill, SkillExecutionResult } from './types';
import { orchestrator } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../03_NERVES/drive_bridge';

class SkillRegistry {
    private skills: Map<string, AgentSkill> = new Map();

    constructor() {
        this.registerBuiltInSkills();
    }

    public register(skill: AgentSkill) {
        this.skills.set(skill.id, skill);
    }

    public getSkill(id: string) {
        return this.skills.get(id);
    }

    // Export tools definition for LLM (JSON Schema)
    public getToolsDefinition() {
        return Array.from(this.skills.values()).map(skill => ({
            name: skill.name,
            description: skill.description,
            parameters: skill.parameters
        }));
    }

    public async execute(skillName: string, args: any): Promise<SkillExecutionResult> {
        // Find skill by name (assuming name is unique enough for mapping)
        const skill = Array.from(this.skills.values()).find(s => s.name === skillName);
        
        if (!skill) {
            return { success: false, data: null, error: `Skill '${skillName}' not found.` };
        }

        try {
            console.log(`[SkillRegistry] ⚡ Executing: ${skillName}`, args);
            const result = await skill.execute(args);
            return { success: true, data: result };
        } catch (e: any) {
            console.error(`[SkillRegistry] 💥 Execution Failed:`, e);
            return { success: false, data: null, error: e.message };
        }
    }

    private registerBuiltInSkills() {
        // 1. Math Skill (Deterministic Calculation)
        this.register({
            id: 'core_math',
            name: 'calculate_expression',
            description: 'Evaluate a mathematical expression precisely. Use this for ANY arithmetic.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    expression: { type: 'STRING', description: 'The math expression to evaluate (e.g., "123 * 45")' }
                },
                required: ['expression']
            },
            execute: (args) => {
                // Safer than raw eval, specifically for math
                // In production, use a math parser library. Here we use a sanitized Function approach.
                try {
                    // eslint-disable-next-line no-new-func
                    const safeCalc = new Function('return ' + args.expression.replace(/[^0-9+\-*/().Math%]/g, ''));
                    return safeCalc();
                } catch (e) {
                    return "Calculation Error";
                }
            }
        });

        // 2. Memory Retrieval Skill
        this.register({
            id: 'core_memory_read',
            name: 'search_memory',
            description: 'Search the internal long-term memory for specific information.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    query: { type: 'STRING', description: 'The search keywords or question' }
                },
                required: ['query']
            },
            execute: (args) => {
                return orchestrator.retrieveRelatedMemories(args.query, 5);
            }
        });

        // 3. System Time Skill (Self-Awareness)
        this.register({
            id: 'core_time',
            name: 'get_current_time',
            description: 'Get the current system time and date.',
            parameters: {
                type: 'OBJECT',
                properties: {},
            },
            execute: () => {
                return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            }
        });
        
        // 4. Drive Search Skill (File System)
        this.register({
            id: 'core_drive_list',
            name: 'list_files',
            description: 'List files in Google Drive matching a query.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    query: { type: 'STRING', description: 'Filename part to search' }
                },
                required: ['query']
            },
            execute: async (args) => {
                const files = await driveBridge.globalSearch(args.query);
                return files.map((f: any) => `${f.name} (ID: ${f.id})`).join('\n');
            }
        });
    }
}

export const skillRegistry = new SkillRegistry();
