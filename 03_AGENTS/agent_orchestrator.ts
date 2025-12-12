
// ZIA AGENT ORCHESTRATOR v3.2 (CONFIGURABLE INTERPRETER)
// [LOCATION]: 03_AGENTS/agent_orchestrator.ts
// [v3.2] Added support for 'interpreterConfig' to dynamically adjust router strictness.

import { skillRegistry } from './skill_registry';
import { orchestrator } from '../02_CORTEX/memory_orchestrator';
import { calculateLogicDensity } from '../02_CORTEX/fde_logic'; 
import { driveBridge } from '../04_NERVES/drive_bridge'; 
import { ReasoningMode, TaskLog, BranchingOption } from '../types';
import { system_instruction_augmentation } from '../01_SOUL/knowledge_archive';
import { llmGateway, ExecutionContext } from './llm_gateway';
import { GoogleGenAI } from "@google/genai"; 

export interface OrchestrationResult {
    responseText: string;
    tasks: TaskLog[];
    metadata: any;
    visualArtifact?: { html?: string, image?: string };
    swarmCommand?: { type: string, payload: any }; 
}

type CognitiveLayer = 'DATA' | 'INFORMATION' | 'KNOWLEDGE' | 'WISDOM';

class AgentOrchestrator {
    
    // Base prompt structure - we will inject config into it
    private getRouterPrompt(ambiguityThreshold: number) {
        return `
    You are the KERNEL ROUTER of the ZIA OS.
    Input: User's latest message + Recent Context.
    Output: A JSON object.
    
    [INTERPRETER PROTOCOL SETTINGS]
    - Ambiguity Threshold: ${ambiguityThreshold} (0.0=Guess Everything, 1.0=Ask Everything).
    - If the user's intent ambiguity is ABOVE ${ambiguityThreshold}, you MUST set intent to "CLARIFICATION".
    - "I'm hungry" -> Ambiguity ~0.6 (Food? Knowledge? Power?) -> ASK if threshold < 0.6.
    
    [AVAILABLE TOOLS]
    - web_search: Use this for ANY query requiring real-time info, news, facts, or external knowledge.
    - calculate_expression: For math.
    - search_memory: For past conversations.
    - req_python_exec: For complex code/data analysis.
    - trigger_n8n_workflow: For automation pipelines.
    
    [MEMORY CLASSIFICATION RULE]
    - "WORLD_KNOWLEDGE": Facts, axioms, definitions, codes.
    - "USER_CONTEXT": Personal stories, commands, greetings.
    
    [RESPONSE FORMAT]
    Return a JSON object.
    Schema: 
    { 
        "intent": "CASUAL_CHAT" | "TOOL_USE" | "IMAGE_ANALYSIS" | "MEMORY_SEARCH" | "CLARIFICATION", 
        "memory_classification": "USER_CONTEXT" | "WORLD_KNOWLEDGE",
        "tool_call": { "name": "string", "args": object } | null,
        "suggested_strategy": "FAST" | "PRECISE" | "DEBATE" | "RESEARCH",
        "reply_text": "string (optional immediate reply)",
        "interpreted_intent_summary": "string (e.g. 'User wants to find a restaurant')", 
        "branching_options": [ 
            { "id": "opt_1", "label": "Short Title", "description": "What this does", "next_action": "full query string", "icon": "material_icon_name" } 
        ]
    }
    `;
    }

    public async processMessage(
        text: string, 
        attachment: { mimeType: string, data: string } | undefined,
        ctx: ExecutionContext,
        onTaskUpdate: (task: TaskLog) => void
    ): Promise<OrchestrationResult> {
        
        const tasks: TaskLog[] = [];
        const taskHelper = (stage: TaskLog['stage'], msg: string) => {
            const t: TaskLog = { id: Date.now().toString(), stage, status: 'processing', message: msg, timestamp: Date.now() };
            tasks.push(t);
            onTaskUpdate(t);
            return t;
        };
        const taskFinish = (t: TaskLog, status: 'completed'|'failed', msg?: string) => {
            t.status = status;
            if(msg) t.message = msg;
            onTaskUpdate(t);
        };

        // 1. EMBEDDING
        if (ctx.provider === 'GOOGLE' && text && ctx.apiKey) {
             try {
                const ai = new GoogleGenAI({ apiKey: ctx.apiKey });
                const emb = await ai.models.embedContent({ model: 'text-embedding-004', contents: text });
                orchestrator.store('USER_CONTEXT', text, 'User Input', emb.embeddings?.[0]?.values);
             } catch(e) { 
                 orchestrator.store('USER_CONTEXT', text, 'User Input', undefined);
             }
        }

        // 2. ROUTING & CLASSIFICATION
        let intentData: any = { intent: 'CASUAL_CHAT', suggested_strategy: 'FAST', memory_classification: 'USER_CONTEXT' };
        let effectiveStrategy: ReasoningMode = ctx.dna.reasoningMode;
        const routerTask = taskHelper('ROUTER', 'Analyzing Intent & Ambiguity...');

        const historyBlock = ctx.history.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n');
        
        // Use user-defined threshold, default to 0.5
        const threshold = ctx.dna.interpreterConfig?.ambiguityThreshold ?? 0.5;

        if (!attachment) {
            try {
                const toolDefs = skillRegistry.getToolsDefinition();
                const prompt = `${this.getRouterPrompt(threshold)}\n[RECENT CONTEXT]\n${historyBlock}\n[AVAILABLE TOOLS JSON]\n${JSON.stringify(toolDefs)}`;
                const routerRes = await llmGateway.call({ ...ctx, history: [] }, prompt, undefined, true);
                
                let jsonStr = routerRes.text;
                if (jsonStr.includes('```json')) jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '');
                intentData = JSON.parse(jsonStr);

                if (ctx.dna.reasoningMode === 'AUTO') effectiveStrategy = intentData.suggested_strategy || 'FAST';
                if (intentData.tool_call?.name === 'web_search') { effectiveStrategy = 'RESEARCH'; intentData.intent = 'TOOL_USE'; }
                
                // [AMBIGUITY CHECK]
                if (intentData.intent === 'CLARIFICATION' && intentData.branching_options) {
                    taskFinish(routerTask, 'completed', `Ambiguity Detected (Threshold ${threshold}). Branching...`);
                    return {
                        responseText: intentData.reply_text || "I need clarification to proceed precisely. Please choose a path:",
                        tasks,
                        metadata: {
                            modelUsed: ctx.model,
                            appliedStrategy: effectiveStrategy,
                            branchingOptions: intentData.branching_options,
                            interpretedIntent: intentData.interpreted_intent_summary
                        }
                    };
                }
                
                taskFinish(routerTask, 'completed', `${intentData.intent} / Detected: ${intentData.memory_classification}`);

            } catch (e) {
                taskFinish(routerTask, 'failed', 'Routing failed, defaulting to Chat.');
            }
        } else {
            taskFinish(routerTask, 'completed', 'Visual Analysis Mode');
        }

        // 2.5 SWARM SYNC (Input Sync)
        if (intentData.memory_classification === 'WORLD_KNOWLEDGE') {
             const syncTask = taskHelper('FDE_SYNC', 'Input Sync: Dispatching to Vector DB...');
             this.dispatchToSwarm(text, syncTask, taskFinish);
        }

        // 3. SKILL EXECUTION
        let skillResultBlock = "";
        let visualArtifact: any = undefined;
        let swarmCommand: { type: string, payload: any } | undefined = undefined;

        if (intentData.tool_call && intentData.tool_call.name !== 'web_search') {
            const skillName = intentData.tool_call.name;
            const skillTask = taskHelper('SWARM', `Executing Skill: ${skillName}`);
            const result = await skillRegistry.execute(skillName, intentData.tool_call.args);
            
            if (result.success) {
                if (result.data.command === 'req_n8n_proxy') {
                     swarmCommand = { type: 'req_n8n_proxy', payload: result.data };
                     skillResultBlock = `\n[SKILL RESULT]: Delegating to Swarm n8n bridge...\n`;
                     taskFinish(skillTask, 'completed', 'Delegated to Swarm');
                } else {
                    skillResultBlock = `\n[SKILL RESULT (${skillName})]:\n${JSON.stringify(result.data)}\n`;
                    taskFinish(skillTask, 'completed', 'Skill Execution Successful');
                }
            } else {
                skillResultBlock = `\n[SKILL ERROR]: ${result.error}\n`;
                taskFinish(skillTask, 'failed', `Error: ${result.error}`);
            }
        }

        // 4. MEMORY RECALL
        let contextBlock = "";
        if (effectiveStrategy === 'RESEARCH' || effectiveStrategy === 'DEBATE' || intentData.intent === 'MEMORY_SEARCH') {
            const memTask = taskHelper('MEMORY', 'Retrieving Context (Local + Swarm)...');
            const localMemories = orchestrator.retrieveRelatedMemories(text, 3);
            if (localMemories) contextBlock += `\n[LOCAL MEMORY CACHE]:\n${localMemories}\n`;
            
            const authStatus = driveBridge.getStatus();
            if (authStatus.isAuthenticated) {
                const queryId = Date.now().toString();
                driveBridge.saveFile(`req_query_memory_${queryId}.json`, { id: queryId, query: text }).catch(e => console.error(e));
                contextBlock += `\n[SWARM NOTE]: Deep search dispatched to Vector DB. Results pending.\n`;
            }
            taskFinish(memTask, 'completed', 'Context Retrieved');
        }

        // 5. RESPONSE (Synthesis)
        const responseTask = taskHelper('RESPONSE', `Synthesizing via ${effectiveStrategy}...`);
        
        const metaPrompt = `
        [CONVERSATION HISTORY]
        ${historyBlock}

        [CURRENT CONTEXT]
        Strategy: ${effectiveStrategy}
        Memory Class: ${intentData.memory_classification}
        Interpreted Intent: ${intentData.interpreted_intent_summary || "Direct Execution"}
        ${contextBlock}
        ${skillResultBlock}
        
        [USER MESSAGE]
        ${text}
        
        [INSTRUCTION]
        - If 'web_search' was requested, the system has enabled Grounding. Use the provided Grounding Metadata.
        - If you find new facts via Search, summarize them clearly.
        - To Generate App: Use 'req_render_app'.
        - To Execute Python: Use 'req_python_exec'.
        `;

        const useGrounding = effectiveStrategy === 'RESEARCH';
        const response = await llmGateway.call(ctx, metaPrompt, system_instruction_augmentation, false, attachment, useGrounding);
        
        // --- 6. THE ALCHEMIST ---
        let harvestStatus = false;
        if (response.groundingMetadata && response.groundingMetadata.groundingChunks) {
            const refineTask = taskHelper('FDE_SYNC', 'The Alchemist: Distilling Knowledge...');
            const chunks = response.groundingMetadata.groundingChunks;
            const sources = chunks.map((c: any) => c.web?.uri).filter(Boolean).join(', ');
            const logicScore = calculateLogicDensity(response.text);
            const sourceCount = chunks.length;

            let layer: CognitiveLayer = 'DATA';
            if (logicScore < 0.3) layer = 'DATA';
            else if (logicScore >= 0.3 && logicScore < 0.6) layer = 'INFORMATION';
            else if (logicScore >= 0.6 && sourceCount >= 2) layer = 'KNOWLEDGE';

            if (layer === 'DATA') {
                taskFinish(refineTask, 'completed', `Discarded: Classified as ephemeral DATA (Density: ${logicScore.toFixed(2)})`);
                harvestStatus = false;
            } 
            else if (layer === 'INFORMATION') {
                 orchestrator.store('WORLD_KNOWLEDGE', `[INFO]: ${response.text.substring(0, 500)}...`, 'Web Search');
                 taskFinish(refineTask, 'completed', `Stored as INFORMATION (Local Only)`);
                 harvestStatus = true;
            }
            else if (layer === 'KNOWLEDGE') {
                const harvestContent = `[KNOWLEDGE (Logic:${logicScore.toFixed(2)})]: ${response.text.substring(0, 800)}...\n[SOURCES]: ${sources}`;
                orchestrator.store('WORLD_KNOWLEDGE', harvestContent, 'The Alchemist');
                this.dispatchToSwarm(harvestContent, refineTask, taskFinish);
                harvestStatus = true;
            }
        }

        // Command Parsing
        const jsonCandidates: string[] = [];
        const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
        let match;
        while ((match = codeBlockRegex.exec(response.text)) !== null) jsonCandidates.push(match[1]);
        if (jsonCandidates.length === 0) {
             const rawJsonRegex = /(\{\s*"req_[\s\S]*?\})/;
             const rawMatch = response.text.match(rawJsonRegex);
             if (rawMatch) jsonCandidates.push(rawMatch[1]);
        }

        for (const jsonStr of jsonCandidates) {
            try {
                const cmd = JSON.parse(jsonStr);
                if (cmd.req_render_app) visualArtifact = { html: cmd.req_render_app.html };
                if (cmd.req_python_exec) swarmCommand = { type: 'req_python_exec', payload: cmd.req_python_exec };
                if (cmd.req_launch_app) swarmCommand = { type: 'req_launch_app', payload: cmd.req_launch_app };
                if (cmd.req_git_clone) swarmCommand = { type: 'req_git_clone', payload: cmd.req_git_clone };
                if (cmd.req_drive_list) swarmCommand = { type: 'req_drive_list', payload: cmd.req_drive_list };
                if (cmd.req_drive_read) swarmCommand = { type: 'req_drive_read', payload: cmd.req_drive_read };
                if (cmd.req_n8n_proxy) swarmCommand = { type: 'req_n8n_proxy', payload: cmd.req_n8n_proxy };
            } catch(e) { console.warn("Failed to parse command JSON:", e); }
        }
        
        taskFinish(responseTask, 'completed', 'Response Ready');

        return {
            responseText: response.text,
            tasks,
            metadata: { 
                appliedStrategy: effectiveStrategy, 
                modelUsed: ctx.model,
                groundingMetadata: response.groundingMetadata,
                harvested: harvestStatus,
                interpretedIntent: intentData.interpreted_intent_summary // Pass for transparency
            },
            visualArtifact,
            swarmCommand
        };
    }

    private async dispatchToSwarm(content: string, task: TaskLog, taskFinish: any) {
        try {
             const authStatus = driveBridge.getStatus();
             if (authStatus.isAuthenticated) {
                 const payload = { id: Date.now().toString(), content: content, type: 'WORLD_KNOWLEDGE' };
                 await driveBridge.saveFile(`req_store_memory_${payload.id}.json`, payload);
                 taskFinish(task, 'completed', 'Knowledge Crystallized in Swarm');
             } else {
                 taskFinish(task, 'failed', 'Drive Not Connected (Local Only)');
             }
         } catch (e) {
             taskFinish(task, 'failed', 'Refinery Sync Error');
         }
    }
}

export const agentOrchestrator = new AgentOrchestrator();
