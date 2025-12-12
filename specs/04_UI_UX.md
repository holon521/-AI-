
# 04. UI/UX SPECIFICATIONS (화면 설계)

> **Concept:** "The Visible Brain" (보이지 않는 사고 과정을 시각화)

## 1. 뷰 계층 (View Hierarchy)

### Layer 1: The Surface (Dashboard)
- **목적:** 일상적인 대화와 업무.
- **구성:**
    - **중앙 (Agentic Deck):** 
        - 채팅 인터페이스 상단에 `Model`과 `Reasoning Strategy`를 즉시 제어하는 컨트롤 덱 위치.
        - `AUTO`, `FAST`, `PRECISE`, `DEBATE` 모드 전환 가능.
    - **좌측 (Agent Manager):** 
        - 현재 실행 중인 AI의 사고 단계(Router -> Memory -> Response)를 실시간 로그로 표시.
        - 대기 중일 때는 'Heartbeat' 애니메이션으로 시스템 생존 확인.
    - **우측 (Memory & Swarm):** 
        - 기억 노드 상태(Synced/Pending) 요약.
        - 클릭 시 `MemoryModal`이 열려 전체 토폴로지 탐색.

### Layer 2: The Workbench (Creation)
- **목적:** 코드 작성, 앱 렌더링, 긴 문서 작업.
- **진입:** 
    - 상단 헤더의 `WORKBENCH` 버튼으로 수동 토글.
    - 또는 AI가 코드를 생성하면 자동으로 슬라이드 인.
- **기능:**
    - **Code Mode:** 원본 소스 코드 확인/수정.
    - **Preview Mode:** HTML/JS 앱 실행 (Fractal Sandbox).

## 2. 핵심 인터랙션 (Key Interactions)
1.  **Dynamic Strategy Switching:**
    - 사용자가 입력창 위에서 전략을 `DEBATE`로 바꾸면, 즉시 다음 대화부터 페르소나 시뮬레이션이 적용됨.
2.  **Visual Context Injection:**
    - 이미지 업로드 시 미리보기와 함께 'Visual Context Added' 배지 표시.
3.  **Swarm Connection:**
    - Colab 연결 시, 우측 패널이 녹색으로 활성화되며 벡터 DB 카운트가 실시간 동기화됨.
