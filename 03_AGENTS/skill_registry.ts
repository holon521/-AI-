
// ZIA SKILL REGISTRY & DISPATCHER v1.3
// [LOCATION]: 03_AGENTS/skill_registry.ts
// [v1.3] Added 'n8n_workflow' to allow ZIA to trigger automations.

import { AgentSkill, SkillExecutionResult } from './types';
import { orchestrator } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../04_NERVES/drive_bridge';

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

    public getToolsDefinition() {
        return Array.from(this.skills.values()).map(skill => ({
            name: skill.name,
            description: skill.description,
            parameters: skill.parameters
        }));
    }

    public async execute(skillName: string, args: any): Promise<SkillExecutionResult> {
        // Find skill
        const skill = Array.from(this.skills.values()).find(s => s.name === skillName);
        
        if (!skill) {
             if (skillName === 'web_search') {
                 return { success: true, data: "Search initiated via Grounding Protocol." };
             }
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
        // 1. Math Skill
        this.register({
            id: 'core_math',
            name: 'calculate_expression',
            description: 'Evaluate a mathematical expression precisely.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    expression: { type: 'STRING', description: 'The math expression (e.g., "123 * 45")' }
                },
                required: ['expression']
            },
            execute: (args) => {
                try {
                    // eslint-disable-next-line no-new-func
                    const safeCalc = new Function('return ' + args.expression.replace(/[^0-9+\-*/().Math%]/g, ''));
                    return safeCalc();
                } catch (e) { return "Calculation Error"; }
            }
        });

        // 2. Memory Retrieval
        this.register({
            id: 'core_memory_read',
            name: 'search_memory',
            description: 'Search internal long-term memory.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    query: { type: 'STRING', description: 'The search keywords' }
                },
                required: ['query']
            },
            execute: (args) => {
                return orchestrator.retrieveRelatedMemories(args.query, 5);
            }
        });

        // 3. System Time
        this.register({
            id: 'core_time',
            name: 'get_current_time',
            description: 'Get current system time.',
            parameters: { type: 'OBJECT', properties: {} },
            execute: () => new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        });
        
        // 4. Drive Search
        this.register({
            id: 'core_drive_list',
            name: 'list_files',
            description: 'List files in Google Drive.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    query: { type: 'STRING', description: 'Filename part' }
                },
                required: ['query']
            },
            execute: async (args) => {
                const files = await driveBridge.globalSearch(args.query);
                return files.map((f: any) => `${f.name} (ID: ${f.id})`).join('\n');
            }
        });

        // 5. N8N Workflow Trigger (NEW)
        this.register({
            id: 'core_n8n_trigger',
            name: 'trigger_n8n_workflow',
            description: 'Trigger an n8n automation workflow on the Swarm. Use when the user asks to "process data pipeline", "run automation", or use a specific webhook.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    webhook_path: { type: 'STRING', description: 'The webhook path (e.g. "webhook/test" or "webhook-test/run")' },
                    payload: { type: 'OBJECT', description: 'JSON data to send to the workflow' }
                },
                required: ['webhook_path']
            },
            // Note: This skill creates a JSON command, actual execution happens in AgentOrchestrator -> Drive Bridge
            execute: async (args) => {
                return {
                    command: 'req_n8n_proxy',
                    endpoint: args.webhook_path,
                    data: args.payload || {}
                };
            }
        });

        // 6. Web Search Marker
        this.register({
            id: 'core_web_search',
            name: 'web_search',
            description: 'Search the internet for real-time information, news, or unknown facts.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    query: { type: 'STRING', description: 'Search query' }
                },
                required: ['query']
            },
            execute: async () => "SEARCH_DELEGATED_TO_GROUNDING"
        });
    }
}

export const skillRegistry = new SkillRegistry();
