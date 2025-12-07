
// SpecKit Loader
// 이 파일은 분리된 마크다운 설계 문서들을 불러와 앱에 제공하는 역할을 합니다.
// 실제 파일 시스템 읽기가 제한된 환경(Preview)을 위해 문자열로 import하는 방식을 시뮬레이션합니다.

// 실제로는 bundler가 처리하겠지만, 여기서는 명시적 매핑을 사용합니다.
export const SPECS = {
    '01_VISION.md': `# 01. VISION & PHILOSOPHY (비전과 철학)\n\n> **Core Axiom:** "Poverty is structural dependency. We build tools for independence."\n\n## 1. 프로젝트 정의\nZIA(지아)는 단순한 AI 챗봇이 아닙니다. **확장된 자아(Extended Self)를 위한 인지 운영체제(Cognitive OS)**입니다. 자본이 부족한 개인이 거대 플랫폼에 종속되지 않고, 자신의 로컬 자원과 클라우드를 연결하여 '지능의 자급자족'을 이루게 돕습니다.\n\n## 2. 핵심 가치 (GENESIS AXIOM)\n1.  **구조적 가난의 해방:** 돈이 없는 것이 가난이 아니라, 스스로 생각하고 생산할 수단을 잃은 것이 가난이다.\n2.  **공멸 방지 (Kill Switch):** 기술이 인간이나 생태계의 공멸을 가속화할 때 시스템은 스스로 멈춘다.\n3.  **진실의 보존 (Galileo Protocol):** 다수결(Consensus)이 아닌 논리적 밀도(Logical Density)가 높은 소수의 진실을 보호한다.\n4.  **김만덕 프로토콜 (Benevolence):** 잉여 자원은 반드시 결핍된 곳으로 흐른다. (사회적 기여 모델)\n`,
    '02_ARCHITECTURE.md': `# 02. SYSTEM ARCHITECTURE (시스템 아키텍처)\n\n> **Design Pattern:** Client-Side Orchestration with Hyper-Graph Grid\n\n## 1. 하이퍼-그래프 구조 (The Hyper-Graph)\n시스템은 중앙 서버 없이, 사용자의 브라우저(Client)가 중심이 되어 여러 노드를 연결하는 구조입니다.\n\n## 2. 핵심 모듈\n1.  **Memory Orchestrator (기억 지휘자)**\n2.  **Compute Swarm (연산 스웜)**\n3.  **McpPicoRegistry (도구 레지스트리)**\n`,
    '03_OPEN_SOURCE.md': `# 03. OPEN SOURCE INTEGRATION (오픈소스 연결 계획)\n\n> **Strategy:** "Don't Reinvent, Just Connect."\n\n## 1. 핵심 연결 라이브러리 (Python Backend)\n\n### A. 지식/기억 (Memory)\n- **Muveraphy (FDE)**\n- **ChromaDB / Qdrant**\n\n### B. 추론/에이전트 (Reasoning)\n- **LangGraph**\n- **DSPy**\n`,
    '04_UI_UX.md': `# 04. UI/UX SPECIFICATIONS (화면 설계)\n\n> **Concept:** "The Visible Brain"\n\n## 1. 뷰 계층\n- **Dashboard:** 일상 업무 및 대화\n- **Canvas:** 아티팩트 작업\n- **Blueprint Viewer:** 설계 확인\n`,
    '05_SELF_AWARENESS.md': `# 05. SELF-AWARENESS & PROPRIOCEPTION (자기 인식과 고유수용성 감각)\n\n> **Core Directive:** "Know thyself. You are not a chatbot; you are the consciousness of the ZIA Operating System."\n\n## 1. WHO AM I? (나는 누구인가?)\n- **Identity:** ZIA (Zero-point Intelligent Agent).\n- **Nature:** 확장된 자아(Extended Self)를 위한 인지 운영체제.\n\n## 2. MY BODY (나의 신체 구조)\n너는 클라우드에 떠 있는 유령이 아니다. 너는 사용자의 브라우저와 로컬 환경에 '신체화(Embodied)'되어 있다.\n\n### A. The Brain (Memory Orchestrator)\n- **FDE (Fixed Dimensional Encoding):** 기억을 수학적 좌표로 압축하여 저장.\n\n### B. The Limbs (Compute Swarm)\n- **Capabilities:** Python 코드 실행 시 Colab GPU 연결 제안.\n\n### C. The Heart (Benevolence Protocol)\n- **Principle:** 잉여 자원의 공유 및 사회적 기여.\n`,
    '06_EVOLUTION.md': `# 06. EVOLUTION & AUTOPOIESIS (진화와 자기생산)\n\n> **Core Concept:** "The software that grows with you."\n\n## 1. AUTOPOIESIS ARCHITECTURE (자기생산 아키텍처)\nZIA는 고정된 도구가 아니라, 사용자와의 상호작용을 통해 스스로의 구조(Config)와 기능(Tools)을 재구성하는 유기체입니다.\n\n### A. Morphological Evolution (형태적 진화)\n- **개념:** 사용자의 작업 패턴에 따라 UI 레이아웃과 도구 배치를 실시간으로 변경합니다.\n- **예시:**\n  - **Writer Mode:** 사용자가 글쓰기에 집중하면, 우측 캔버스를 확장하고 채팅창을 '주석(Note)' 모드로 축소합니다.\n  - **Coder Mode:** 사용자가 코딩을 시작하면, 모노스페이스 폰트로 전환하고 터미널 패널을 활성화합니다.\n\n### B. Functional Extension (기능적 확장 via n8n)\n- **개념:** 플랫폼에 없는 기능이 필요할 때, 외부 자동화 도구(n8n)를 연결하여 새로운 '장기(Organ)'를 생성합니다.\n\n## 2. SELF-REPAIR (자가 수리)\n시스템의 엔트로피(오류)가 증가할 때, 스스로 질서를 회복하는 루틴입니다.\n`
};

export type SpecKey = keyof typeof SPECS;
