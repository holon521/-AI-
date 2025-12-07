
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v1.6
// [v1.6] Implemented Mathematical Retrieval (FDE Hamming Distance)

import { computeSimHashSignature, calculateLogicDensity, computeSimilarity } from './fde_logic';

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
  gemValue?: number; // [v1.6] 보석 가치 (0~1)
  tier?: 'CORE' | 'CONTEXT' | 'STREAM'; // [v1.6] 저장 계층
}

class MemoryOrchestrator {
  private identityDB: MemoryEngram[] = []; 
  private userDB: MemoryEngram[] = [];     
  private worldDB: MemoryEngram[] = [];    

  // [v1.6] Swarm Cache 초기화
  private globalSwarmCache: MemoryEngram[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.identityDB.length === 0) {
        this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'System Axiom');
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
        const i = localStorage.getItem('ZIA_IDENTITY_DB');
        const u = localStorage.getItem('ZIA_USER_DB');
        const w = localStorage.getItem('ZIA_WORLD_DB');
        
        const parser = (key: any, value: any) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        };

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

  // [v1.6] 보석 감정 알고리즘 (Gem Value Calculator)
  private appraiseGemValue(content: string, logicScore: number, type: MemoryType): number {
      let value = logicScore; 
      
      // 희소성 체크 (Novelty): 기존 기억들과 너무 비슷하면 가치 하락
      const sig = computeSimHashSignature(content);
      const db = type === 'USER_CONTEXT' ? this.userDB : this.worldDB;
      const maxSim = db.reduce((max, m) => Math.max(max, computeSimilarity(sig, m.fdeSignature)), 0);
      
      if (maxSim > 0.9) value *= 0.5; // 이미 아는 내용이면 감가상각
      if (content.length < 20) value *= 0.2; // 너무 짧으면 모래알

      return Math.min(1.0, value);
  }

  private assignTier(gemValue: number, type: MemoryType): 'CORE' | 'CONTEXT' | 'STREAM' {
      if (type === 'IDENTITY') return 'CORE';
      if (gemValue > 0.8) return 'CORE'; // 다이아몬드
      if (gemValue > 0.4) return 'CONTEXT'; // 자갈
      return 'STREAM'; // 모래
  }

  private verifyTruth(content: string, logicScore: number): TruthState {
    const currentSignature = computeSimHashSignature(content);
    // [v1.6] FDE Similarity 기반 충돌 감지
    const conflictCandidates = this.worldDB.filter(m => 
        m.truthState === 'CANONICAL' && 
        computeSimilarity(m.fdeSignature, currentSignature) > 0.8 // 80% 이상 유사한데 내용이 다르면 충돌
    );

    if (conflictCandidates.length > 0) {
        if (logicScore > 0.85) return 'PARADIGM_SHIFT'; // 논리가 탄탄하면 새로운 패러다임
        else return 'DISPUTED'; // 아니면 그냥 논쟁
    }
    return 'CANONICAL';
  }

  public async routeQuery(query: string): Promise<MemoryType[]> {
    const activeSectors: MemoryType[] = [];
    const lowerQ = query.toLowerCase();
    
    // 단순 키워드 매칭이 아니라, 쿼리의 의도에 따라 라우팅
    if (lowerQ.includes('누구') || lowerQ.includes('zía') || lowerQ.includes('system')) activeSectors.push('IDENTITY');
    if (lowerQ.includes('나 ') || lowerQ.includes('내') || lowerQ.includes('history')) activeSectors.push('USER_CONTEXT');
    
    // 기본적으로 세상 지식은 항상 참조
    activeSectors.push('WORLD_KNOWLEDGE');
    return activeSectors;
  }

  // [v1.6] Mathematical Retrieval (FDE 기반 유사도 검색)
  public retrieveRelatedMemories(query: string, limit: number = 3): string {
      const querySig = computeSimHashSignature(query);
      
      // 모든 DB를 통합하여 검색
      const allMemories = [...this.identityDB, ...this.userDB, ...this.worldDB];
      
      const scored = allMemories.map(m => ({
          memory: m,
          similarity: computeSimilarity(querySig, m.fdeSignature)
      }));
      
      // 유사도 0.6 이상인 것만 필터링하고 정렬
      const topK = scored
          .filter(item => item.similarity > 0.6)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
          
      if (topK.length === 0) return "";
      
      return topK.map(item => 
          `[MEMORY (${item.memory.type}) Sim:${item.similarity.toFixed(2)}] ${item.memory.content}`
      ).join('\n');
  }

  public retrieveUserContext(): string | null {
    if (this.userDB.length === 0) return null;
    return this.userDB
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10) 
        .map(mem => `[USER_LOG] ${mem.content}`)
        .join('\n');
  }

  public store(type: MemoryType, content: string, source: string) {
    const signature = computeSimHashSignature(content);
    const logicScore = calculateLogicDensity(content);
    const entropy = Math.min(content.length / 100, 1.0);
    const truthState = this.verifyTruth(content, logicScore);
    const gemValue = this.appraiseGemValue(content, logicScore, type);
    const tier = this.assignTier(gemValue, type);

    // [v1.6] 중복 저장 방지 (유사도 95% 이상이면 저장 안 함)
    const db = type === 'IDENTITY' ? this.identityDB : type === 'USER_CONTEXT' ? this.userDB : this.worldDB;
    const isDuplicate = db.some(m => computeSimilarity(m.fdeSignature, signature) > 0.95);
    
    if (isDuplicate && tier !== 'CORE') {
        console.log(`[Memory] Duplicate content skipped: "${content.substring(0,20)}..."`);
        return null;
    }

    const engram: MemoryEngram = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      content,
      fdeSignature: signature,
      timestamp: new Date(),
      source,
      entropy,
      logicScore,
      truthState,
      shared: type === 'WORLD_KNOWLEDGE',
      gemValue,
      tier
    };

    if (type === 'IDENTITY') this.identityDB.push(engram);
    else if (type === 'USER_CONTEXT') this.userDB.push(engram);
    else if (type === 'WORLD_KNOWLEDGE') this.worldDB.push(engram);
    
    this.saveToStorage();
    return engram;
  }

  public getStats() {
    return {
      identity: this.identityDB.length,
      user: this.userDB.length,
      world: this.worldDB.length,
      swarmTotal: this.worldDB.filter(m => m.shared).length
    };
  }
}

export const orchestrator = new MemoryOrchestrator();
