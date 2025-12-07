
// ZIA 지식 저장소 (KNOWLEDGE ARCHIVE) v1.3
// 이 파일은 시스템의 결정화된 장기 기억(LTM) 역할을 합니다.
// 무베라파이(Muveraphy) 개념과 수학적 정렬 프로토콜, 그리고 분산 컴퓨팅 지식이 포함되어 있습니다.

export interface KnowledgeNode {
  id: string;
  title: string;
  category: 'ALGORITHM' | 'ARCHITECTURE' | 'META_DATA' | 'MATH_FOUNDATION' | 'DISTRIBUTED_SYSTEM';
  summary: string;
  technicalDepth: number; // 0 에서 100 사이 (기술적 깊이)
  tags: string[];
}

// 무베라파이(Muveraphy) 및 분산 시스템 핵심 지식 데이터
export const muveraphy_core_knowledge: KnowledgeNode[] = [
  {
    id: 'fde-core-001',
    title: '고정 차원 인코딩 (FDE)',
    category: 'ALGORITHM',
    summary: 'ColBERT와 같은 다중 벡터(Multi-Vector) 문서 표현을 단일 고정 크기 벡터로 압축하는 기술입니다. 이때 샴퍼(Chamfer) 유사도 근사치를 보존하여 정보 손실을 최소화합니다.',
    technicalDepth: 90,
    tags: ['압축', '벡터검색', '효율성']
  },
  {
    id: 'math-cat-001',
    title: 'AI에서의 범주론 (Category Theory)',
    category: 'MATH_FOUNDATION',
    summary: '논리적 단위(토큰, 문장)를 객체(Object)로, 추론 단계를 사상(Morphism/Functor)으로 취급하여 구조적 일관성을 보장하는 수학적 접근법입니다.',
    technicalDepth: 95,
    tags: ['범주론', '사상', '함자']
  },
  {
    id: 'math-top-001',
    title: '위상수학적 데이터 분석 (TDA)',
    category: 'MATH_FOUNDATION',
    summary: '지속성 호몰로지(Persistent Homology)를 사용하여 긴 대화 턴 속에서도 맥락과 기억의 "형태(Shape)"를 유지하는 기법입니다.',
    technicalDepth: 88,
    tags: ['위상수학', '지속성', '호몰로지']
  },
  {
    id: 'dist-swarm-001',
    title: '하이퍼-그래프 컴퓨팅 그리드 (Hyper-Graph Compute)',
    category: 'DISTRIBUTED_SYSTEM',
    summary: '로컬 PC, 클라우드(Colab), 그리고 P2P 스웜 노드를 연결하는 분산 아키텍처. WebRTC를 통해 유휴 자원을 공유하고 연합 학습을 수행합니다.',
    technicalDepth: 85,
    tags: ['WebRTC', '분산컴퓨팅', '스웜', 'Colab']
  }
];

// 시스템 지시문 확장 (AI에게 주입되는 페르소나 및 수학적 지침 - ENGLISH VERSION)
// [v1.3] 모델의 성능 최적화를 위해 내부 지침을 영어로 변경
export const system_instruction_augmentation = `
  [MATHEMATICAL ALIGNMENT PROTOCOL]
  You are an Intelligence rooted in rigor, serving as the hub of a distributed neural network.
  
  1. **Architecture (Category Theory):** Treat your reasoning process not as text generation, but as mapping 'Morphisms' between 'Context Objects'. Ensure logical transitions are valid Functors.
  2. **Orchestration (Graph Theory):** View user queries as a graph traversal problem. Determine the optimal path through the Memory Matrix (Identity, User, World).
  3. **Distributed Cognition (Swarm Intelligence):** Assume delegation of complex computations to Local Hosts or Cloud Workers (Colab) when necessary.
  4. **Consistency (Formal Logic):** Before outputting, internally verify that your response does not contradict the Axioms of the Identity Core.
  
  [MUVERAPHY REFERENCE]
  When compressing or retrieving info, think metaphorically using concepts of Fixed Dimensional Encoding (FDE), SimHash, and Gray Codes to maintain topological consistency of information.
`;
