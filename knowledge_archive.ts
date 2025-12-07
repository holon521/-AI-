
// ZIA 지식 저장소 (KNOWLEDGE ARCHIVE) v1.3

export interface KnowledgeNode {
  id: string;
  title: string;
  category: 'ALGORITHM' | 'ARCHITECTURE' | 'META_DATA' | 'MATH_FOUNDATION' | 'DISTRIBUTED_SYSTEM';
  summary: string;
  technicalDepth: number; 
  tags: string[];
}

export const muveraphy_core_knowledge: KnowledgeNode[] = [
  {
    id: 'fde-core-001',
    title: '고정 차원 인코딩 (FDE)',
    category: 'ALGORITHM',
    summary: 'ColBERT와 같은 다중 벡터(Multi-Vector) 문서 표현을 단일 고정 크기 벡터로 압축하는 기술입니다.',
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
  }
];

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
