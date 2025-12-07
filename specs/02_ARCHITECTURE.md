
# 02. SYSTEM ARCHITECTURE (시스템 아키텍처)

> **Design Pattern:** Client-Side Orchestration with Hyper-Graph Grid

## 1. 하이퍼-그래프 구조 (The Hyper-Graph)
시스템은 중앙 서버 없이, 사용자의 브라우저(Client)가 중심이 되어 여러 노드를 연결하는 구조입니다.

```mermaid
graph TD
    User[User Input] --> Refiner[Receptionist (Gemini Flash)]
    
    subgraph "Input Refiner Layer"
        Refiner -- "Ambiguous?" --> Question[Ask Clarification]
        Refiner -- "Clear?" --> Optimizer[Prompt Optimizer (KR->EN)]
    end
    
    Question --> User
    Optimizer --> Core[ZIA Core (Gemini Pro)]
    
    subgraph "Local Resources"
        LocalGPU[Local PC / GPU]
        LocalSto[LocalStorage / IndexedDB]
    end
    
    subgraph "Cloud Resources"
        Drive[Google Drive (Long-term Memory)]
        Colab[Google Colab (Compute Engine)]
    end
    
    Core <-->|Bridge App| LocalGPU
    Core <-->|OAuth| Drive
    Core <-->|WebSocket| Colab
```

## 2. 핵심 모듈 (Core Modules)

### 2.1. The Receptionist (접수원 프로토콜)
- **목적:** 비전문가(Non-expert) 사용자를 위한 프롬프트 자동 최적화 및 비용 절감.
- **기능:**
  - 사용자 입력의 의도(감정, 작업, 정보) 파악.
  - 모호한 입력에 대해 **역질문(Clarification Loop)** 수행.
  - 한국어 입력을 LLM 친화적인 **영어 기술 명세(Technical English)**로 변환.

### 2.2. Memory Orchestrator (기억 지휘자)
- 3계층 기억(Identity, User, World)을 관리하고 라우팅합니다.
- FDE(Fixed Dimensional Encoding)를 통해 기억을 압축 저장합니다.

### 2.3. Compute Swarm (연산 스웜)
- Docker 컨테이너를 관리하고, Python/R 코드를 실행할 최적의 노드(Local vs Colab)를 선택합니다.

## 3. 데이터 흐름 (Data Flow)
1.  **Refinement:** 사용자 입력 -> Receptionist 분석 -> (역질문) -> 최적화된 프롬프트 생성.
2.  **Process:** 최적화된 프롬프트 -> FDE 엔진 압축 -> 오케스트레이터가 관련 기억 검색(RAG) -> LLM 추론.
3.  **Output:** 답변 생성 + 기억(World Knowledge) 업데이트 -> (옵션) 스웜 공유.
