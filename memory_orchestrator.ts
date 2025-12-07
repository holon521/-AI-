
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v1.3
// 그래프 이론 원칙을 사용하여 3계층 기억 구조(정체성, 사용자, 세상)를 관리하며,
// [갈릴레오 프로토콜]을 통해 다수결의 오류를 극복하고 소수의 혁신적 진실을 보존합니다.

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
  content: string;     // 기억 내용
  vectorId?: string;   // 벡터 DB에서의 ID
  timestamp: Date;     // 생성 시간
  source?: string;     // 기억의 출처
  entropy?: number;    // 정보 밀도 (0.0 ~ 1.0)
  logicScore: number;  // [v1.3] 논리적 정합성 점수 (단순 다수결이 아닌, 근거의 깊이)
  truthState: TruthState; // [v1.3] 진실 상태
  shared: boolean;     // 스웜 네트워크 공유 여부
}

class MemoryOrchestrator {
  // 3개의 분리된 기억 저장소 (DB)
  private identityDB: MemoryEngram[] = []; // 1계층: 정체성
  private userDB: MemoryEngram[] = [];     // 2계층: 사용자 맥락
  private worldDB: MemoryEngram[] = [];    // 3계층: 세상 지식

  // 시뮬레이션된 글로벌 스웜 캐시 (집단 지성)
  private globalSwarmCache: MemoryEngram[] = [
    {
      id: 'swarm-truth-001',
      type: 'WORLD_KNOWLEDGE',
      content: '지구는 완벽한 구형이 아니라 지오이드(Geoid) 타원체이다.',
      timestamp: new Date(),
      source: 'Swarm Network (Verified)',
      entropy: 0.95,
      logicScore: 0.99, // 매우 높은 논리 점수
      truthState: 'CANONICAL',
      shared: true
    },
    {
      id: 'swarm-conflict-002',
      type: 'WORLD_KNOWLEDGE',
      content: '빛은 파동이면서 동시에 입자이다 (이중성).',
      timestamp: new Date(),
      source: 'Physics Node #42',
      entropy: 0.92,
      logicScore: 0.98,
      truthState: 'DISPUTED', // 과거 고전 역학과는 충돌하므로 논쟁 상태로 관리
      shared: true
    }
  ];

  constructor() {
    // 정체성 DB 초기화
    this.identityDB.push({
      id: 'axiom-001',
      type: 'IDENTITY',
      content: 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.',
      timestamp: new Date(),
      source: '시스템 공리 (System Axiom)',
      entropy: 0.0,
      logicScore: 1.0,
      truthState: 'CANONICAL',
      shared: true
    });
  }

  // [갈릴레오 프로토콜] 진실 검증 로직
  // 새로운 기억이 들어왔을 때, 기존 다수설과 충돌하더라도 논리 점수가 높으면 '패러다임 시프트'로 보존합니다.
  private verifyTruth(content: string, type: MemoryType): { state: TruthState, score: number } {
    // 1. 단순 휴리스틱: 내용이 길고 구체적일수록(수학적 근거) 논리 점수 상향
    const lengthScore = Math.min(content.length / 200, 1.0);
    const hasProof = content.includes('증명') || content.includes('따라서') || content.includes('because') || content.includes('수식');
    const logicScore = (lengthScore * 0.5) + (hasProof ? 0.4 : 0.0) + 0.1;

    // 2. 충돌 감지 (기존 지식과 반대되는가?)
    // 실제로는 벡터 유사도와 Semantic Negation을 체크해야 함
    const isConflict = this.worldDB.some(m => m.truthState === 'CANONICAL' && content.includes('아니다')); // 단순화된 로직

    if (isConflict) {
        if (logicScore > 0.8) {
            // 다수설과 다르지만 논리가 완벽함 -> 갈릴레오(혁명적 진실)
            return { state: 'PARADIGM_SHIFT', score: logicScore };
        } else {
            // 다수설과 다른데 논리도 빈약함 -> 단순 노이즈 혹은 논쟁
            return { state: 'DISPUTED', score: logicScore };
        }
    }

    return { state: 'CANONICAL', score: logicScore };
  }

  // 위상학적 근접성 쿼리 라우팅
  public async routeQuery(query: string): Promise<MemoryType[]> {
    const activeSectors: MemoryType[] = [];
    const lowerQ = query.toLowerCase();

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
    // 검색 시에도 '정설'뿐만 아니라 '패러다임 시프트'도 함께 검색해야 함
    const hits = this.globalSwarmCache.filter(k => query.includes(k.content.substring(0, 5)) || query.includes('지구') || query.includes('빛'));
    
    if (hits.length > 0) {
        // 가장 논리 점수가 높은 지식을 반환 (다수결이 아님)
        const bestHit = hits.sort((a, b) => b.logicScore - a.logicScore)[0];
        return `${bestHit.content} [진실 상태: ${bestHit.truthState}]`;
    }
    return null;
  }

  public store(type: MemoryType, content: string, source: string) {
    const entropy = Math.min(content.length / 100, 1.0);
    const isShared = type === 'WORLD_KNOWLEDGE';

    // 갈릴레오 프로토콜 적용
    const verification = this.verifyTruth(content, type);

    const engram: MemoryEngram = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      source,
      entropy,
      logicScore: verification.score,
      truthState: verification.state,
      shared: isShared
    };

    if (type === 'IDENTITY') this.identityDB.push(engram);
    else if (type === 'USER_CONTEXT') this.userDB.push(engram);
    else if (type === 'WORLD_KNOWLEDGE') {
        this.worldDB.push(engram);
        if (isShared && verification.state !== 'DEPRECATED') {
            console.log(`[Swarm] Broadcasting ${verification.state} knowledge: ${content.substring(0, 20)}...`);
        }
    }
    
    return engram;
  }

  public getStats() {
    return {
      identity: this.identityDB.length,
      user: this.userDB.length,
      world: this.worldDB.length,
      swarmTotal: this.globalSwarmCache.length + 1240
    };
  }
}

export const orchestrator = new MemoryOrchestrator();
