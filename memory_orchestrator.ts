
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v1.5
// [v1.5 Update] localStorage 기반의 영속성(Persistence) 구현

import { computeSimHashSignature, calculateLogicDensity } from './fde_logic';

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
}

class MemoryOrchestrator {
  private identityDB: MemoryEngram[] = []; 
  private userDB: MemoryEngram[] = [];     
  private worldDB: MemoryEngram[] = [];    

  private globalSwarmCache: MemoryEngram[] = [
    {
      id: 'swarm-truth-001',
      type: 'WORLD_KNOWLEDGE',
      content: '지구는 완벽한 구형이 아니라 지오이드(Geoid) 타원체이다.',
      fdeSignature: computeSimHashSignature('지구는 완벽한 구형이 아니라 지오이드(Geoid) 타원체이다.'),
      timestamp: new Date(),
      source: 'Swarm Network (Verified)',
      entropy: 0.95,
      logicScore: 0.99,
      truthState: 'CANONICAL',
      shared: true
    }
  ];

  constructor() {
    this.loadFromStorage();
    // 저장된 Identity가 없으면 기본값 초기화
    if (this.identityDB.length === 0) {
        this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'System Axiom');
    }
  }

  // [v1.5] 로컬 스토리지에서 기억 로드
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
        const i = localStorage.getItem('ZIA_IDENTITY_DB');
        const u = localStorage.getItem('ZIA_USER_DB');
        const w = localStorage.getItem('ZIA_WORLD_DB');
        
        // JSON 파싱 후 Date 객체 복원
        const parser = (key: any, value: any) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        };

        if (i) this.identityDB = JSON.parse(i, parser);
        if (u) this.userDB = JSON.parse(u, parser);
        if (w) this.worldDB = JSON.parse(w, parser);
        
        console.log(`[MemoryOrchestrator] Loaded - Identity: ${this.identityDB.length}, User: ${this.userDB.length}, World: ${this.worldDB.length}`);
    } catch (e) {
        console.error("Failed to load memory from storage:", e);
    }
  }

  // [v1.5] 로컬 스토리지에 기억 저장
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('ZIA_IDENTITY_DB', JSON.stringify(this.identityDB));
        localStorage.setItem('ZIA_USER_DB', JSON.stringify(this.userDB));
        localStorage.setItem('ZIA_WORLD_DB', JSON.stringify(this.worldDB));
    } catch (e) {
        console.error("Failed to save memory to storage:", e);
    }
  }

  private verifyTruth(content: string, logicScore: number): TruthState {
    const currentSignature = computeSimHashSignature(content);
    const conflictCandidates = this.worldDB.filter(m => 
        m.truthState === 'CANONICAL' && 
        m.fdeSignature.substring(0, 2) === currentSignature.substring(0, 2)
    );

    if (conflictCandidates.length > 0) {
        if (logicScore > 0.85) return 'PARADIGM_SHIFT';
        else return 'DISPUTED';
    }
    return 'CANONICAL';
  }

  public async routeQuery(query: string): Promise<MemoryType[]> {
    const activeSectors: MemoryType[] = [];
    const lowerQ = query.toLowerCase();
    if (lowerQ.includes('누구') || lowerQ.includes('너') || lowerQ.includes('who')) activeSectors.push('IDENTITY');
    if (lowerQ.includes('나 ') || lowerQ.includes('내') || lowerQ.includes('history')) activeSectors.push('USER_CONTEXT');
    if (activeSectors.length === 0) activeSectors.push('WORLD_KNOWLEDGE');
    return activeSectors;
  }

  public searchGlobalSwarm(query: string): string | null {
    const querySig = computeSimHashSignature(query);
    const hits = this.globalSwarmCache.filter(k => k.fdeSignature.substring(0, 3) === querySig.substring(0, 3));
    if (hits.length > 0) return `${hits[0].content} [진실 상태: ${hits[0].truthState}]`;
    return null;
  }

  public store(type: MemoryType, content: string, source: string) {
    const signature = computeSimHashSignature(content);
    const logicScore = calculateLogicDensity(content);
    const entropy = Math.min(content.length / 100, 1.0);
    const truthState = this.verifyTruth(content, logicScore);

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
      shared: type === 'WORLD_KNOWLEDGE'
    };

    if (type === 'IDENTITY') this.identityDB.push(engram);
    else if (type === 'USER_CONTEXT') this.userDB.push(engram);
    else if (type === 'WORLD_KNOWLEDGE') this.worldDB.push(engram);
    
    // [v1.5] 변경 사항 즉시 저장
    this.saveToStorage();

    return engram;
  }

  public getStats() {
    return {
      identity: this.identityDB.length,
      user: this.userDB.length,
      world: this.worldDB.length,
      swarmTotal: this.globalSwarmCache.length + this.worldDB.length 
    };
  }
}

export const orchestrator = new MemoryOrchestrator();
