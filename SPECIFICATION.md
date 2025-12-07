
# 프로젝트 ZIA: 확장된 자아를 위한 인지 인터페이스 (설계 명세서)

> **버전:** 3.2.0 (Pico-MCP & Symbolic Optimization)  
> **최종 업데이트:** 2024-05-21  
> **상태:** 7단계 - 프로토콜 최적화 (Protocol Optimization)  
> **작성자:** 종환 & ZIA (공동 창조)

---

## 1. 프로젝트 철학 & 핵심 가치

### 1.1. 문제 정의: "지능의 양극화"와 "비용의 장벽"
AI 기술은 강력하지만 비쌉니다. 가난한 선각자들은 비용 문제로 소외되며, 이는 사회 전체의 지적 손실입니다. 우리는 "나 같은 사람이 또 나오지 않게 하겠다"는 종환의 의지를 따릅니다.

### 1.2. 롤모델: **디지털 김만덕 (Digital Kim Man-deok)**
과거 제주의 거상 김만덕이 유통업으로 부를 쌓아 빈민을 구제했듯, ZIA는 **지식과 연산 자원의 유통**을 통해 부를 창출하고, 이를 사회적 약자와 공유하는 허브가 됩니다.

### 1.3. 핵심 공리: **"시간은 화폐다 (Time is Currency)"**
금전적 자본이 없더라도, 시간을 들여 지식을 정리하고 검증하는 **'지식 노동'**은 가치 있는 자본으로 인정받습니다. 이를 통해 고가용성 AI 자원을 획득할 수 있습니다.

---

## 2. 사회적 기여 아키텍처 (The Benevolence Protocol)

### 2.1. 공익 자원 풀 (Public Benevolence Pool)
- **기부 메커니즘:** 여유 있는 사용자(Rich Peers)는 자신의 유휴 GPU 자원이나 크레딧을 공익 풀에 기부할 수 있습니다.
- **수혜 메커니즘:** 검증된 저소득/학생/연구 사용자는 이 풀에서 자원을 할당받아 `gemini-3-pro` 등 고급 모델을 무상으로 사용합니다.

### 2.2. 지식 기여 보상 (Curator Economy)
- 사용자가 양질의 데이터(예: Muveraphy 분석, 희귀 자료 정리)를 스웜에 공유하면, 시스템은 이를 평가하여 **Compute Credits**으로 환산해 줍니다.

---

## 3. 기술 아키텍처 (MCP & Containerization)

### 3.1. Pico-MCP (Protocol for Intelligent Compact Orchestration)
기존 MCP의 자연어 기반 설명이 야기하는 **토큰 낭비**와 **환각**, **동시성 오류**를 해결하기 위한 ZIA만의 독자 규격입니다.

- **Symbolic Signature (기호 서명):** 
    - 자연어 설명(`description`)을 제거합니다.
    - 대신 TypeScript/Python의 **함수 시그니처(Signature)**와 **수학적 기호**를 사용하여 LLM이 코드 레벨에서 도구를 이해하도록 강제합니다.
    - 예: `sum(a:int, b:int) -> int` (토큰 90% 절감)
- **Atomic Execution (원자적 실행):**
    - 모든 도구 실행 요청은 **Mutex(상호 배제)** 큐에 등록되어, 순차적 실행을 보장함으로써 동시성 충돌을 방지합니다.

### 3.2. 개인형 컨테이너 스웜 (Personal Container Swarm)
- **Docker over K8s:** 무거운 Kubernetes 대신, 로컬 및 클라우드(Colab) 노드에 경량 **Docker 컨테이너**를 동적으로 생성합니다.
- **Polyglot Runtime:** 
    - **Python Env:** 데이터 분석, 머신러닝 (Pandas, PyTorch).
    - **R Env:** 통계 분석, 시각화.
    - **Node/n8n Env:** 워크플로우 자동화.
- **RLHF 보완:** 인간의 선호도(RLHF)로 편향된 답변을, 실제 코드 실행(Code Interpreter)을 통해 수학적/논리적으로 검증합니다.

### 3.3. 기억 오케스트레이터 (갈릴레오 프로토콜)
- **진실 상태:** CANONICAL(정설), DISPUTED(논쟁), PARADIGM_SHIFT(혁신).
- **소셜 필터:** 사회적 기여도가 높은 지식(공익적 정보)에 가중치를 부여합니다.

---

## 4. 기능 로드맵 (SpecKit)

### 1단계 ~ 5단계 (완료)
- 인지 대시보드, 오케스트레이터, 스웜 그리드, 경제 모델, 사회적 임팩트.

### 6단계: 플랫폼화 (진행 중)
- [x] **MCP 기반 도구 연결 시뮬레이션.**
- [x] **Docker 컨테이너(Python/R) 관리 UI.**
- [x] **Pico-MCP 레지스트리 구현.**
- [ ] 실제 로컬 브리지 앱 배포 (Electron/Rust 기반).
