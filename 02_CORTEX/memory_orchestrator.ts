
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v2.1
// [LOCATION]: 02_CORTEX/memory_orchestrator.ts

import { computeSimHashSignature, calculateLogicDensity, computeSimilarity } from './fde_logic';
import { SPECS } from '../spec_loader';

export type MemoryType = 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE';
export type TruthState = 'CANONICAL' | 'DISPUTED' | 'PARADIGM_SHIFT' | 'DEPRECATED';

export interface MemoryEngram {
  id: string;
  type: MemoryType;
  content: string;     
  fdeSignature: string; 
  timestamp: Date;     
  source?: string;     
  entropy?: number;    
  logicScore: number;  
  truthState: TruthState; 
  shared: boolean;
  gemValue?: number;
  tier?: 'CORE' | 'CONTEXT' | 'STREAM';
}

export interface MemorySnapshot {
    identityDB: MemoryEngram[];
    userDB: MemoryEngram[];
    worldDB: MemoryEngram[];
    timestamp: number;
    version: string;
}

class MemoryOrchestrator {
  private identityDB: MemoryEngram[] = []; 
  private userDB: MemoryEngram[] = [];     
  private worldDB: MemoryEngram[] = [];    

  constructor() {
    this.loadFromStorage();
    if (this.identityDB.length === 0) {
        this.seedKnowledge();
    }
  }

  public seedKnowledge() {
      console.log("[MemoryOrchestrator] 🌱 Seeding Knowledge from Specs...");
      this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'GENESIS_AXIOM');
      this.store('IDENTITY', '가난은 자원의 부재가 아니라, 연결의 부재이다. (Poverty Definition)', 'GENESIS_AXIOM');
      Object.entries(SPECS).forEach(([filename, content]) => {
          this.store('WORLD_KNOWLEDGE', `[SYSTEM_SPEC] ${filename}: ${content.substring(0, 200)}...`, 'SpecLoader');
      });
      this.saveToStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
        const i = localStorage.getItem('ZIA_IDENTITY_DB');
        const u = localStorage.getItem('ZIA_USER_DB');
        const w = localStorage.getItem('ZIA_WORLD_DB');
        const parser = (key: any, value: any) => key === 'timestamp' ? new Date(value) : value;
        if (i) this.identityDB = JSON.parse(i, parser);
        if (u) this.userDB = JSON.parse(u, parser);
        if (w) this.worldDB = JSON.parse(w, parser);
    } catch (e) { console.error("Memory load failed", e); }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('ZIA_IDENTITY_DB', JSON.stringify(this.identityDB));
        localStorage.setItem('ZIA_USER_DB', JSON.stringify(this.userDB));
        localStorage.setItem('ZIA_WORLD_DB', JSON.stringify(this.worldDB));
    } catch (e) { console.error("Memory save failed", e); }
  }

  public snapshot(): MemorySnapshot {
      return { identityDB: this.identityDB, userDB: this.userDB, worldDB: this.worldDB, timestamp: Date.now(), version: '2.1' };
  }

  public restore(snapshot: MemorySnapshot) {
      if (!snapshot) return;
      const parser = (key: any, value: any) => key === 'timestamp' ? new Date(value) : value;
      let data = typeof snapshot === 'string' ? JSON.parse(snapshot, parser) : JSON.parse(JSON.stringify(snapshot), parser);
      if (data.identityDB) this.identityDB = data.identityDB;
      if (data.userDB) this.userDB = data.userDB;
      if (data.worldDB) this.worldDB = data.worldDB;
      this.saveToStorage();
      console.log("[MemoryOrchestrator] 🧠 Identity & Memory Restored.");
  }

  private appraiseGemValue(content: string, logicScore: number, type: MemoryType): number {
      let value = logicScore; 
      const sig = computeSimHashSignature(content);
      const db = type === 'USER_CONTEXT' ? this.userDB : this.worldDB;
      const maxSim = db.reduce((max, m) => Math.max(max, computeSimilarity(sig, m.fdeSignature)), 0);
      if (maxSim > 0.9) value *= 0.5; 
      if (content.length < 20) value *= 0.2; 
      return Math.min(1.0, value);
  }

  private assignTier(gemValue: number, type: MemoryType): 'CORE' | 'CONTEXT' | 'STREAM' {
      if (type === 'IDENTITY') return 'CORE';
      if (gemValue > 0.8) return 'CORE';
      if (gemValue > 0.4) return 'CONTEXT';
      return 'STREAM';
  }

  private verifyTruth(content: string, logicScore: number): TruthState {
    const currentSignature = computeSimHashSignature(content);
    const conflictCandidates = this.worldDB.filter(m => m.truthState === 'CANONICAL' && computeSimilarity(m.fdeSignature, currentSignature) > 0.8);
    if (conflictCandidates.length > 0) {
        if (logicScore > 0.85) return 'PARADIGM_SHIFT'; 
        else return 'DISPUTED'; 
    }
    return 'CANONICAL';
  }

  public async routeQuery(query: string): Promise<MemoryType[]> {
    const activeSectors: MemoryType[] = [];
    const lowerQ = query.toLowerCase();
    if (lowerQ.includes('누구') || lowerQ.includes('zia') || lowerQ.includes('system')) activeSectors.push('IDENTITY');
    if (lowerQ.includes('나 ') || lowerQ.includes('내') || lowerQ.includes('history')) activeSectors.push('USER_CONTEXT');
    activeSectors.push('WORLD_KNOWLEDGE');
    return activeSectors;
  }

  public retrieveRelatedMemories(query: string, limit: number = 3): string {
      const querySig = computeSimHashSignature(query);
      const allMemories = [...this.identityDB, ...this.userDB, ...this.worldDB];
      const scored = allMemories.map(m => ({ memory: m, similarity: computeSimilarity(querySig, m.fdeSignature) }));
      const topK = scored.filter(item => item.similarity > 0.6).sort((a, b) => b.similarity - a.similarity).slice(0, limit);
      if (topK.length === 0) return "";
      return topK.map(item => `[MEMORY (${item.memory.type}) Sim:${item.similarity.toFixed(2)}] ${item.memory.content}`).join('\n');
  }

  public retrieveUserContext(): string | null {
    if (this.userDB.length === 0) return null;
    return this.userDB.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10).map(mem => `[USER_LOG] ${mem.content}`).join('\n');
  }

  public store(type: MemoryType, content: string, source: string) {
    const signature = computeSimHashSignature(content);
    const logicScore = calculateLogicDensity(content);
    const entropy = Math.min(content.length / 100, 1.0);
    const truthState = this.verifyTruth(content, logicScore);
    const gemValue = this.appraiseGemValue(content, logicScore, type);
    const tier = this.assignTier(gemValue, type);
    const db = type === 'IDENTITY' ? this.identityDB : type === 'USER_CONTEXT' ? this.userDB : this.worldDB;
    const isDuplicate = db.some(m => computeSimilarity(m.fdeSignature, signature) > 0.95);
    if (isDuplicate && tier !== 'CORE') return null;

    const engram: MemoryEngram = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type, content, fdeSignature: signature, timestamp: new Date(),
      source, entropy, logicScore, truthState, shared: type === 'WORLD_KNOWLEDGE', gemValue, tier
    };

    if (type === 'IDENTITY') this.identityDB.push(engram);
    else if (type === 'USER_CONTEXT') this.userDB.push(engram);
    else if (type === 'WORLD_KNOWLEDGE') this.worldDB.push(engram);
    this.saveToStorage();
    return engram;
  }

  public getStats() {
    return { identity: this.identityDB.length, user: this.userDB.length, world: this.worldDB.length, swarmTotal: this.worldDB.filter(m => m.shared).length };
  }
}
export const orchestrator = new MemoryOrchestrator();
