
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v1.4
// [Real Implementation] FDE 엔진을 탑재하여 실제 수학적 해시와 논리 밀도를 계산합니다.

import { computeSimHashSignature, calculateLogicDensity } from './fde_logic';

// 기억의 종류 정의
export type MemoryType = 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE';

// 기억의 변증법적 상태 (Dialectical State)
export type TruthState = 
  | 'CANONICAL'       // 정설 (다수가 동의함)
  | 'DISPUTED'        // 논쟁 중 (정설과 반론이 대립)
  | 'PARADIGM_SHIFT'  // 패러다임 시프트 (소수 의견이나 논리적 밀도가 압도적으로 높음 - 갈릴레오 프로토콜)
  | 'DEPRECATED';     // 폐기됨 (거짓으로 판명됨)

// 기억 흔적(Engram) 인터페이스 정의
export interface MemoryEngram {
  id: string;
  type: MemoryType;
  content: string;     
  fdeSignature: string; // [Real] FDE로 압축된 고정 차원 서명
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

  // 시뮬레이션된 글로벌 스웜 캐시 (집단 지성)
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
    },
    {
      id: 'swarm-conflict-002',
      type: 'WORLD_KNOWLEDGE',
      content: '빛은 파동이면서 동시에 입자이다 (이중성).',
      fdeSignature: computeSimHashSignature('빛은 파동이면서 동시에 입자이다 (이중성).'),
      timestamp: new Date(),
      source: 'Physics Node #42',
      entropy: 0.92,
      logicScore: 0.98,
      truthState: 'DISPUTED',
      shared: true
    }
  ];

  constructor() {
    // 정체성 DB 초기화
    this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'System Axiom');
  }

  // [갈릴레오 프로토콜] 진실 검증 로직
  private verifyTruth(content: string, logicScore: number): TruthState {
    // FDE 서명을 사용하여 유사도 충돌 감지 (실제 구현)
    const currentSignature = computeSimHashSignature(content);
    
    // 단순화: 서명의 앞 2자리가 같으면 '유사한 주제'로 간주
    const conflictCandidates = this.worldDB.filter(m => 
        m.truthState === 'CANONICAL' && 
        m.fdeSignature.substring(0, 2) === currentSignature.substring(0, 2)
    );

    const isConflict = conflictCandidates.length > 0;

    if (isConflict) {
        // 기존 정설과 유사한 주제인데, 논리 점수가 매우 높다면 -> 패러다임 시프트
        if (logicScore > 0.85) {
            return 'PARADIGM_SHIFT';
        } else {
            return 'DISPUTED';
        }
    }

    return 'CANONICAL';
  }

  // 위상학적 근접성 쿼리 라우팅
  public async routeQuery(query: string): Promise<MemoryType[]> {
    const activeSectors: MemoryType[] = [];
    const lowerQ = query.toLowerCase();

    // 키워드 매칭 외에 FDE 서명 기반 매칭 로직 추가 가능
    if (lowerQ.includes('누구') || lowerQ.includes('너') || lowerQ.includes('원칙') || lowerQ.includes('who')) {
      activeSectors.push('IDENTITY');
    }
    if (lowerQ.includes('나 ') || lowerQ.includes('내') || lowerQ.includes('기억') || lowerQ.includes('history')) {
      activeSectors.push('USER_CONTEXT');
    }
    if (lowerQ.includes('검색') || lowerQ.includes('지식') || lowerQ.includes('사실') || lowerQ.includes('fact')) {
      activeSectors.push('WORLD_KNOWLEDGE');
    }
    
    if (activeSectors.length === 0) activeSectors.push('WORLD_KNOWLEDGE');
    return activeSectors;
  }

  public searchGlobalSwarm(query: string): string | null {
    // FDE 서명 기반 검색 (근사치)
    const querySig = computeSimHashSignature(query);
    
    const hits = this.globalSwarmCache.filter(k => {
        // 해밍 거리 계산 시뮬레이션 (여기서는 단순 부분 일치)
        return k.content.includes(query.substring(0, 3)) || k.fdeSignature.substring(0, 3) === querySig.substring(0, 3);
    });
    
    if (hits.length > 0) {
        const bestHit = hits.sort((a, b) => b.logicScore - a.logicScore)[0];
        return `${bestHit.content} [진실 상태: ${bestHit.truthState}]`;
    }
    return null;
  }

  public store(type: MemoryType, content: string, source: string) {
    // 1. 실제 FDE 서명 생성
    const signature = computeSimHashSignature(content);
    
    // 2. 실제 논리 밀도 계산
    const logicScore = calculateLogicDensity(content);
    
    const entropy = Math.min(content.length / 100, 1.0);
    const isShared = type === 'WORLD_KNOWLEDGE';

    // 3. 갈릴레오 프로토콜 검증
    const truthState = this.verifyTruth(content, logicScore);

    const engram: MemoryEngram = {
      id: Date.now().toString() + Math.random().toString(36).substring(2,5),
      type,
      content,
      fdeSignature: signature,
      timestamp: new Date(),
      source,
      entropy,
      logicScore,
      truthState,
      shared: isShared
    };

    if (type === 'IDENTITY') this.identityDB.push(engram);
    else if (type === 'USER_CONTEXT') this.userDB.push(engram);
    else if (type === 'WORLD_KNOWLEDGE') {
        this.worldDB.push(engram);
        if (isShared && truthState !== 'DEPRECATED') {
            console.log(`[Swarm] Broadcasting ${truthState} knowledge: ${signature}`);
        }
    }
    
    return engram;
  }

  public getStats() {
    return {
      identity: this.identityDB.length,
      user: this.userDB.length,
      world: this.worldDB.length,
      swarmTotal: this.globalSwarmCache.length + this.worldDB.length // 동기화 수치 반영
    };
  }
}

export const orchestrator = new MemoryOrchestrator();
