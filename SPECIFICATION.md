
# 📜 ZIA: HOLON WORLD - SYSTEM SPECIFICATION (SpecKit v1.0)

> **Document Status:** Living Document (Active)  
> **Target Audience:** Architects, Developers, Users  
> **Core Philosophy:** "Poverty is structural dependency. We build tools for independence."

---

## 1. 🏗️ CONTEXT & GENESIS (맥락과 기원)

### 1.1. Core Identity (정체성)
ZIA는 단순한 챗봇이 아닙니다. **확장된 자아(Extended Self)를 위한 인지 운영체제(Cognitive OS)**입니다. 사용자의 로컬 환경, 클라우드(Drive/Colab), 그리고 P2P 네트워크를 연결하여 **개인화된 슈퍼컴퓨터**를 구축합니다.

### 1.2. Genesis Axioms (제네시스 공리 - 불변의 법칙)
다음 원칙은 코드의 효율성보다 우선합니다 (`GENESIS_AXIOM.ts`).
1.  **Anti-Fragility:** 사용자의 데이터는 시스템이 망가져도 살아남아야 한다. (Local-First & Sync)
2.  **Benevolence Protocol:** 잉여 자원은 반드시 결핍된 곳으로 흐른다. (Social Pool)
3.  **Truth Preservation:** 다수결(Consensus)이 아닌 논리적 밀도(Logical Density)가 진실을 결정한다. (Galileo Protocol)

---

## 2. 📐 SYSTEM ARCHITECTURE (시스템 아키텍처)

현재의 단일 파일(`index.tsx`) 구조는 확장 불가능합니다. 다음과 같은 **모듈형 아키텍처**로 재설계합니다.

### 2.1. Layered Structure
```mermaid
graph TD
    User[User / Local Environment] --> UI_Layer
    
    subgraph "UI Layer (React 18)"
        Landing[Landing View]
        Dash[Cognitive Dashboard]
        Canvas[Artifact Canvas]
        Settings[Config Panel]
    end
    
    subgraph "Logic Layer (TypeScript)"
        Router[Context Router]
        Orchestrator[Memory Orchestrator]
        FDE[FDE Engine (Math Core)]
    end
    
    subgraph "Infrastructure Layer (Interfaces)"
        Storage[LocalStorage / IndexedDB]
        GoogleAPI[Google Gemini API]
        DriveBridge[Google Drive OAuth]
        ColabBridge[Colab WebSocket]
    end
    
    UI_Layer --> Logic_Layer
    Logic_Layer --> Infrastructure_Layer
```

### 2.2. Directory Structure Plan
향후 리팩토링 시 다음 구조를 따릅니다.
```text
/src
  /core
    - genesis_axiom.ts (헌법)
    - fde_logic.ts (수학 엔진)
    - memory_orchestrator.ts (기억 관리)
  /services
    - google_api.ts (Gemini/Drive)
    - swarm_bridge.ts (Colab/P2P)
  /components
    /views
      - LandingView.tsx
      - DashboardView.tsx
    /widgets
      - ChatInterface.tsx
      - MetaPanel.tsx
      - ArtifactCanvas.tsx
    /shared
      - BlueprintViewer.tsx
  - index.tsx (Entry)
```

---

## 3. 💾 DATA SCHEMA (데이터 명세)

데이터의 구조를 명확히 정의하여 데이터 오염을 방지합니다.

### 3.1. Memory Engram (기억 단위)
```typescript
interface MemoryEngram {
  id: string;              // UUID
  type: 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE';
  content: string;         // 원본 텍스트
  fdeSignature: string;    // SimHash (Hex String)
  vector?: number[];       // (Optional) Embedding Vector for Semantic Search
  logicScore: number;      // 0.0 ~ 1.0 (Entropy + Logical Connectors)
  truthState: 'CANONICAL' | 'DISPUTED' | 'PARADIGM_SHIFT';
  timestamp: number;       // Unix Timestamp
  replicationCount: number;// P2P 복제 수 (MRF)
}
```

### 3.2. Swarm Node (컴퓨팅 노드)
```typescript
interface ComputeNode {
  id: string;
  type: 'LOCAL' | 'COLAB' | 'PEER';
  status: 'IDLE' | 'BUSY' | 'OFFLINE';
  specs: {
    tflops: number;
    memory: string;
  };
  metrics: {
    contributionScore: number; // 기여도 (Tit-for-Tat)
    trustLevel: number;        // 신뢰도
  };
}
```

---

## 4. 🎨 UI/UX SPECIFICATIONS (화면 설계)

사용자 경험은 **"보이지 않는 것을 보이게(Make the Invisible Visible)"** 하는 데 초점을 맞춥니다.

### 4.1. View States (뷰 상태)
앱은 다음 4가지 상태를 가집니다.

1.  **Intro (Landing):**
    *   **목적:** ZIA의 강점(FDE, Benevolence)을 시각적으로 각인.
    *   **구성:** 애니메이션 로고, 3대 강점 카드, "Initialize Core" 버튼.
    *   **동작:** 버튼 클릭 시 환경 감지(OS/Lang) 후 Dashboard로 전환.

2.  **Dashboard (Main):**
    *   **좌측 (Meta-Cognition):** AI의 사고 과정(엔트로피, 그래프) 시각화.
    *   **중앙 (Interaction):** 채팅 인터페이스. (가장 넓은 영역)
    *   **우측 (Memory & Swarm):** 현재 활성화된 기억 레이어와 연결된 컴퓨팅 노드 상태. (접이식)

3.  **Canvas (Creation):**
    *   **목적:** 긴 코드, 문서, 설계도를 별도로 띄워 작업.
    *   **동작:** 채팅 중 코드가 나오면 우측에서 슬라이드 인(Slide-in).

4.  **Settings (Config):**
    *   **목적:** API 키 관리, Google Drive 연동, 데이터 초기화.
    *   **구성:** 모달(Modal) 형태.

---

## 5. ✅ MICRO-TASK ROADMAP (상세 작업 분할)

종환 님의 제안(3가지 선택지)을 모두 수용하되, **의존성 순서**대로 배치합니다.

### Phase 1: Foundation (안정화 & 구조 잡기) - **CURRENT PRIORITY**
- [ ] **Task 1.1:** `index.tsx`를 모듈형 UI로 리팩토링 (Landing/Dashboard 분리).
- [ ] **Task 1.2:** `fde_logic.ts`와 채팅 UI의 완전한 결합 (시각적 피드백 강화).
- [ ] **Task 1.3:** `localStorage` 영속성 테스트 (새로고침 후 대화/기억 복원 완벽 검증).

### Phase 2: Connection (외부 확장)
- [ ] **Task 2.1:** Google Drive API OAuth 인증 흐름 구현 (`DriveBridge`).
- [ ] **Task 2.2:** `ZIA_MEMORY` 폴더 생성 및 텍스트 파일 저장/로드 로직 구현.
- [ ] **Task 2.3:** Colab용 Python Bridge 스크립트 작성 및 WebSocket 연결 UI 구현.

### Phase 3: Expansion (플랫폼화)
- [ ] **Task 3.1:** Artifacts Canvas 구현 (코드 블록 감지 및 렌더링).
- [ ] **Task 3.2:** Pico-MCP 레지스트리 UI 연동 (도구 관리).
- [ ] **Task 3.3:** 사회적 기여(Benevolence) 대시보드 고도화.

---

## 6. 🛠️ TECHNICAL CONSTRAINTS (기술적 제약)

1.  **React 18 Strict Mode:** `index.html` 충돌 방지를 위해 React 18 준수.
2.  **Browser Environment:** `process`, `fs` 등 Node.js 전용 모듈 사용 금지.
3.  **Token Efficiency:** 모든 내부 통신은 Pico Protocol(축약형 서명)을 사용한다.
