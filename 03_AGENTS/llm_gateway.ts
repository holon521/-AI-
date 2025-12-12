
// ZIA LLM GATEWAY v1.2 (ANTI-FRAGILE)
// [LOCATION]: 03_AGENTS/llm_gateway.ts
// [v1.2] Aggressive Backoff for 429 Errors (Max 5 retries, start at 5s).

import { GoogleGenAI } from "@google/genai";
import { LLMProvider } from '../types';

export interface ExecutionContext {
    apiKey: string;
    model: string;
    provider: LLMProvider;
    baseUrl?: string;
    history: any[]; 
    dna: any;       
}

export interface LLMResponse {
    text: string;
    groundingMetadata?: any;
}

// Helper: Wait function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class LLMGateway {
    
    // Generic Retry Wrapper with Enhanced Detection
    private async withRetry<T>(fn: () => Promise<T>, retries = 5, backoff = 5000): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            let errorMsg = error.message || JSON.stringify(error);
            
            // Check for Rate Limits (429 / Resource Exhausted)
            const isRateLimit = 
                error.status === 429 || 
                error.code === 429 ||
                errorMsg.includes('429') || 
                errorMsg.includes('RESOURCE_EXHAUSTED') ||
                errorMsg.includes('Quota');

            // Check for Server Errors (500/503) which are often transient
            const isServerOverload = error.status === 503 || error.status === 500;

            if (retries > 0 && (isRateLimit || isServerOverload)) {
                console.warn(`[LLMGateway] Rate limit/Error hit. Retrying in ${backoff/1000}s... (Attempts left: ${retries})`);
                await delay(backoff);
                // Geometric Backoff: 5s -> 10s -> 20s -> 40s -> 80s
                return this.withRetry(fn, retries - 1, backoff * 2);
            }
            throw error;
        }
    }

    // Standardize the call logic
    public async call(
        ctx: ExecutionContext, 
        prompt: string, 
        sysInstruction?: string, 
        jsonMode: boolean = false, 
        attachment?: {mimeType:string, data:string},
        useGrounding: boolean = false
    ): Promise<LLMResponse> {
        
        if (ctx.provider === 'GOOGLE') {
            return this.callGemini(ctx, prompt, sysInstruction, jsonMode, attachment, useGrounding);
        } else {
            return this.callOpenAICompatible(ctx, prompt, sysInstruction, jsonMode);
        }
    }

    private async callGemini(
        ctx: ExecutionContext, 
        prompt: string, 
        sysInstruction: string | undefined, 
        jsonMode: boolean, 
        attachment: {mimeType:string, data:string} | undefined,
        useGrounding: boolean
    ): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const ai = new GoogleGenAI({ apiKey: ctx.apiKey });
            
            let tools: any[] | undefined = undefined;
            // Search Grounding Logic
            if (useGrounding) {
                tools = [{ googleSearch: {} }];
            }

            const config = { 
                systemInstruction: sysInstruction, 
                responseMimeType: jsonMode ? "application/json" : "text/plain",
                tools: tools 
            };

            if (attachment) {
                // Multimodal Request (Grounding usually disabled for images in v1)
                const result = await ai.models.generateContent({
                    model: ctx.model,
                    contents: { parts: [{ inlineData: { mimeType: attachment.mimeType, data: attachment.data } }, { text: prompt }] },
                    config: { systemInstruction: sysInstruction }
                });
                return { text: result.text || "" };
            } else {
                // Text/Tool Request
                const result = await ai.models.generateContent({
                    model: ctx.model,
                    contents: prompt,
                    config
                });
                
                return { 
                    text: result.text || "", 
                    groundingMetadata: result.candidates?.[0]?.groundingMetadata 
                };
            }
        });
    }

    private async callOpenAICompatible(
        ctx: ExecutionContext, 
        prompt: string, 
        sysInstruction: string | undefined, 
        jsonMode: boolean
    ): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const targetUrl = ctx.baseUrl || 'https://api.openai.com/v1';
            const headers: any = { 'Content-Type': 'application/json' };
            if (ctx.apiKey) headers['Authorization'] = `Bearer ${ctx.apiKey}`;
            
            const messages = [ { role: 'system', content: sysInstruction || "You are ZIA." }, ...ctx.history, { role: 'user', content: prompt } ];
            
            if(ctx.history.length === 0) {
                 messages.splice(1, messages.length - 1); 
                 messages.push({ role: 'user', content: prompt });
            }

            const res = await fetch(`${targetUrl}/chat/completions`, {
                method: 'POST', headers,
                body: JSON.stringify({ 
                    model: ctx.model, 
                    messages, 
                    temperature: 0.7, 
                    response_format: jsonMode ? { type: "json_object" } : undefined 
                })
            });
            
            if (!res.ok) {
                const err: any = new Error(`Provider Error: ${res.statusText}`);
                err.status = res.status;
                throw err;
            }
            const data = await res.json();
            return { text: data.choices?.[0]?.message?.content || "" };
        });
    }
}

export const llmGateway = new LLMGateway();
