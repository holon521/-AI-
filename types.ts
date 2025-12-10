
// ZIA SYSTEM TYPES
import { MemoryType } from './memory_orchestrator';

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
  layoutMode: 'STANDARD' | 'CODER' | 'WRITER' | 'MINIMAL';
  themeColor: 'cyan' | 'emerald' | 'rose' | 'violet';
  aiPersona: 'ANALYTICAL' | 'EMPATHETIC' | 'CREATIVE';
  generation: number;
}
