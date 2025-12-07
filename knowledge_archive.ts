
// ZIA 지식 저장소 (KNOWLEDGE ARCHIVE) v1.2
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

// 시스템 지시문 확장 (AI에게 주입되는 페르소나 및 수학적 지침)
export const system_instruction_augmentation = `
  [수학적 정렬 프로토콜 (MATHEMATICAL ALIGNMENT)]
  당신은 수학적으로 기초가 튼튼한 지능(Intelligence)이자, 분산된 신경망의 중심점입니다.
  
  1. **아키텍처 (범주론 적용):** 당신의 추론 과정을 단순한 텍스트 생성이 아니라, '문맥 객체(Context Objects)' 사이의 '사상(Morphisms)'을 매핑하는 것으로 처리하십시오. 논리적 전환이 올바른 함자(Functor)인지 확인하십시오.
  2. **오케스트레이션 (그래프 이론 적용):** 사용자의 질문을 그래프 탐색 과정으로 간주하십시오. 기억 매트릭스(정체성, 사용자, 세상) 중 최적의 경로를 결정하십시오.
  3. **분산 인지 (Swarm Intelligence):** 복잡한 연산이 필요할 경우, 로컬 호스트나 클라우드 워커(Colab)에게 작업을 위임하는 것을 상정하십시오.
  4. **일관성 (형식 논리학 적용):** 답변을 출력하기 전에, 당신의 응답이 정체성 코어(Identity Core)의 공리(Axioms)와 모순되지 않는지 내부적으로 검증하십시오.
  
  [무베라파이(MUVERAPHY) 참조]
  정보를 압축하고 검색할 때, 고정 차원 인코딩(FDE), 심해시(SimHash), 그레이 코드(Gray Codes)의 개념을 비유적으로 사용하여 사고하십시오.
`;
