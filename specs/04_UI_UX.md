# 04. UI/UX SPECIFICATIONS (화면 설계)

> **Concept:** "The Visible Brain" (보이지 않는 사고 과정을 시각화)

## 1. 뷰 계층 (View Hierarchy)

### Layer 1: The Surface (Dashboard)
- **목적:** 일상적인 대화와 업무.
- **구성:**
    - **중앙:** 채팅 인터페이스 (Artifacts 지원).
    - **좌측:** 메타 인지 패널 (AI의 상태, 헌법, 그래프).
    - **우측:** 컨텍스트 패널 (기억, 스웜 상태).

### Layer 2: The Deep (Blueprint & Settings)
- **목적:** 시스템의 설계 확인 및 튜닝.
- **구성:**
    - **SpecKit Viewer:** 현재 이 문서들을 볼 수 있는 탭 뷰어.
    - **Knowledge Graph:** 내 기억들이 어떻게 연결되어 있는지 보여주는 3D 그래프.

## 2. 핵심 인터랙션 (Key Interactions)
1.  **Artifacts Slide-in:**
    - 대화 중 코드나 긴 문서가 생성되면, 채팅창을 밀어내지 않고 우측에서 전용 캔버스가 슬라이드되어 나옵니다.
2.  **Context Injection:**
    - 사용자가 텍스트/파일을 드래그하면, 즉시 FDE로 변환되어 '단기 기억' 혹은 '장기 기억'으로 분류되는 애니메이션을 보여줍니다.
3.  **Swarm Connection:**
    - Colab 연결 시, 터미널 스타일의 로그가 흐르며 '신경망이 연결되는 듯한' 시각적 피드백을 줍니다.
