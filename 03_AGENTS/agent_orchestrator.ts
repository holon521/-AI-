
// ZIA AGENT ORCHESTRATOR v2.2 (SWARM SYNC ENABLED)
// [LOCATION]: 03_AGENTS/agent_orchestrator.ts
// [v2.2] AUTO-SYNC: World Knowledge is immediately dispatched to Colab/ChromaDB via Drive Bridge.

import { skillRegistry } from './skill_registry';
import { orchestrator } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../04_NERVES/drive_bridge'; // Direct access to Bridge
import { ReasoningMode, TaskLog } from '../types';
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

class AgentOrchestrator {
    
    private ROUTER_PROMPT = `
    You are the KERNEL ROUTER of the ZIA OS.
    Input: User's latest message + Recent Context.
    Output: A JSON object.
    
    [AVAILABLE TOOLS]
    - web_search: Use this for ANY query requiring real-time info, news, facts, or external knowledge.
    - calculate_expression: For math.
    - search_memory: For past conversations.
    - req_python_exec: For complex code/data analysis.
    - trigger_n8n_workflow: For automation pipelines or connecting to external APIs via n8n.
    
    [MEMORY CLASSIFICATION RULE]
    - "WORLD_KNOWLEDGE": If the user provides specific facts, axioms, definitions, codes, or technical knowledge.
    - "USER_CONTEXT": Personal stories, commands, greetings, or ephemeral chat.
    
    [RESPONSE FORMAT]
    Return a JSON object.
    Schema: 
    { 
        "intent": "CASUAL_CHAT" | "TOOL_USE" | "IMAGE_ANALYSIS" | "MEMORY_SEARCH", 
        "memory_classification": "USER_CONTEXT" | "WORLD_KNOWLEDGE",
        "tool_call": { "name": "string", "args": object } | null,
        "suggested_strategy": "FAST" | "PRECISE" | "DEBATE" | "RESEARCH",
        "reply_text": "string (optional immediate reply)"
    }
    `;

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

        // 1. EMBEDDING (Local Soft-Embedding for FDE)
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
        const routerTask = taskHelper('ROUTER', 'Analyzing Intent & Knowledge Type...');

        const historyBlock = ctx.history.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n');

        if (!attachment) {
            try {
                const toolDefs = skillRegistry.getToolsDefinition();
                const prompt = `${this.ROUTER_PROMPT}\n[RECENT CONTEXT]\n${historyBlock}\n[AVAILABLE TOOLS JSON]\n${JSON.stringify(toolDefs)}`;
                const routerRes = await llmGateway.call({ ...ctx, history: [] }, prompt, undefined, true);
                
                let jsonStr = routerRes.text;
                if (jsonStr.includes('```json')) jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '');
                intentData = JSON.parse(jsonStr);

                if (ctx.dna.reasoningMode === 'AUTO') effectiveStrategy = intentData.suggested_strategy || 'FAST';
                if (intentData.tool_call?.name === 'web_search') { effectiveStrategy = 'RESEARCH'; intentData.intent = 'TOOL_USE'; }
                
                taskFinish(routerTask, 'completed', `${intentData.intent} / Detected: ${intentData.memory_classification}`);

            } catch (e) {
                taskFinish(routerTask, 'failed', 'Routing failed, defaulting to Chat.');
            }
        } else {
            taskFinish(routerTask, 'completed', 'Visual Analysis Mode');
        }

        // 2.5 SWARM SYNC (The "Infinite Context" Pipeline)
        // If World Knowledge is detected, we AUTOMATICALLY dispatch it to the Swarm (Colab).
        if (intentData.memory_classification === 'WORLD_KNOWLEDGE') {
             const syncTask = taskHelper('FDE_SYNC', 'Swarm Sync: Dispatching to Vector DB...');
             try {
                 // 1. Local Store (Cache)
                 orchestrator.store('WORLD_KNOWLEDGE', text, 'User Consensus');
                 
                 // 2. Remote Store (Colab/Chroma)
                 // We fire this asynchronously. The Colab worker picks it up.
                 const authStatus = driveBridge.getStatus();
                 if (authStatus.isAuthenticated) {
                     const payload = {
                         id: Date.now().toString(),
                         content: text,
                         type: 'WORLD_KNOWLEDGE'
                     };
                     // Fire and forget (The worker script handles the embedding)
                     await driveBridge.saveFile(`req_store_memory_${payload.id}.json`, payload);
                     taskFinish(syncTask, 'completed', 'Dispatched to Swarm (Colab)');
                 } else {
                     taskFinish(syncTask, 'failed', 'Drive Not Connected (Saved Locally Only)');
                 }
             } catch (e) {
                 taskFinish(syncTask, 'failed', 'Sync Error');
             }
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

        // 4. MEMORY RECALL (Hybrid RAG: Local + Remote Trigger)
        let contextBlock = "";
        
        // If intent is MEMORY_SEARCH or Strategy is DEEP, we query the Swarm
        if (effectiveStrategy === 'RESEARCH' || effectiveStrategy === 'DEBATE' || intentData.intent === 'MEMORY_SEARCH') {
            const memTask = taskHelper('MEMORY', 'Retrieving Context (Local + Swarm)...');
            
            // 4.1 Local Retrieval (Fast)
            const localMemories = orchestrator.retrieveRelatedMemories(text, 3);
            if (localMemories) {
                contextBlock += `\n[LOCAL MEMORY CACHE]:\n${localMemories}\n`;
            }

            // 4.2 Swarm Retrieval (Async Trigger)
            // If connected, we ask Colab to check the Vector DB. 
            // NOTE: We cannot wait for Colab in this request cycle (too slow).
            // Instead, we leave a trace. If the user asks again, or if we use a "Thinking Loop", we could wait.
            // For now, we dispatch the query. The Result Poller in useZiaOS will pick up 'res_query_memory.json' later 
            // and inject it into the chat stream as a system message.
            const authStatus = driveBridge.getStatus();
            if (authStatus.isAuthenticated) {
                const queryId = Date.now().toString();
                driveBridge.saveFile(`req_query_memory_${queryId}.json`, { id: queryId, query: text })
                    .then(() => console.log("[Agent] Dispatched Swarm Query"))
                    .catch(e => console.error("[Agent] Swarm Query Failed", e));
                
                contextBlock += `\n[SWARM NOTE]: A deep search query has been dispatched to the Vector DB. Results may arrive shortly as a system message.\n`;
            }

            taskFinish(memTask, 'completed', 'Context Retrieved (Async Swarm Active)');
        }

        // 5. RESPONSE (Synthesis)
        const responseTask = taskHelper('RESPONSE', `Synthesizing via ${effectiveStrategy}...`);
        
        const metaPrompt = `
        [CONVERSATION HISTORY]
        ${historyBlock}

        [CURRENT CONTEXT]
        Strategy: ${effectiveStrategy}
        Memory Class: ${intentData.memory_classification}
        ${contextBlock}
        ${skillResultBlock}
        
        [USER MESSAGE]
        ${text}
        
        [INSTRUCTION]
        - If 'web_search' was requested, the system has enabled Grounding.
        - If WORLD_KNOWLEDGE was detected, CONFIRM that it has been synced to the Swarm (Colab/ChromaDB).
        - If swarmed memory is pending, tell the user you are checking the Archives.
        - To Generate App: Use 'req_render_app'.
        - To Execute Python: Use 'req_python_exec'.
        `;

        const useGrounding = effectiveStrategy === 'RESEARCH';
        
        const response = await llmGateway.call(ctx, metaPrompt, system_instruction_augmentation, false, attachment, useGrounding);
        
        // Command Parsing
        const jsonCandidates: string[] = [];
        const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
        let match;
        while ((match = codeBlockRegex.exec(response.text)) !== null) {
            jsonCandidates.push(match[1]);
        }
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
            } catch(e) {
                console.warn("Failed to parse command JSON:", e);
            }
        }
        
        taskFinish(responseTask, 'completed', 'Response Ready');

        return {
            responseText: response.text,
            tasks,
            metadata: { 
                appliedStrategy: effectiveStrategy, 
                modelUsed: ctx.model,
                groundingMetadata: response.groundingMetadata 
            },
            visualArtifact,
            swarmCommand
        };
    }
}

export const agentOrchestrator = new AgentOrchestrator();
