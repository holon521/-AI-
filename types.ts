
// ZIA SYSTEM TYPES
import { MemoryType } from './02_CORTEX/memory_orchestrator';

export type LLMProvider = 'GOOGLE' | 'OPENAI' | 'OLLAMA' | 'ANTHROPIC';
export type ReasoningMode = 'AUTO' | 'FAST' | 'PRECISE' | 'DEBATE' | 'RESEARCH';

export interface TaskLog {
    id: string;
    stage: 'ROUTER' | 'MEMORY' | 'SWARM' | 'RESPONSE' | 'FDE_SYNC';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message: string;
    timestamp: number;
    details?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system' | 'refiner'; 
  text: string;
  timestamp: Date;
  metadata?: {
    modelUsed?: string; 
    activeMemorySectors?: MemoryType[]; 
    truthState?: string; 
    fdeSignature?: string;
    doubtLevel?: number;
    refinementStatus?: 'RAW' | 'REFINED' | 'CLARIFICATION_NEEDED';
    cognitiveCard?: {
        intent: 'TASK' | 'EMOTIONAL' | 'QUERY' | 'PHILOSOPHICAL';
        original: string;
        data: any;
    };
    groundingMetadata?: any;
    harvested?: boolean;
    swarmProcessed?: boolean;
    appliedStrategy?: ReasoningMode; // [New] To track which strategy AUTO picked
  };
}

export interface GraphNode {
  id: string;
  label: string;
  status: 'idle' | 'active' | 'completed' | 'warning'; 
}

export interface UserEnvironment {
  os: string;
  language: string; 
  isLegacyPathRisk: boolean; 
}

export interface SystemDNA {
  layoutMode: 'STANDARD' | 'CODER' | 'WRITER' | 'MINIMAL' | 'FOCUS';
  themeColor: 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber';
  aiPersona: 'ANALYTICAL' | 'EMPATHETIC' | 'CREATIVE';
  generation: number;
  reasoningMode: ReasoningMode; // [New]
}
