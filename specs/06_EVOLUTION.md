
# 06. EVOLUTION & AUTOPOIESIS (진화와 자기생산)

> **Core Concept:** "The software that grows with you."

## 1. AUTOPOIESIS ARCHITECTURE (자기생산 아키텍처)
ZIA는 고정된 도구가 아니라, 사용자와의 상호작용을 통해 스스로의 구조(Config)와 기능(Tools)을 재구성하는 유기체입니다.

### A. Morphological Evolution (형태적 진화)
- **개념:** 사용자의 작업 패턴에 따라 UI 레이아웃과 도구 배치를 실시간으로 변경합니다.
- **예시:**
  - **Writer Mode:** 사용자가 글쓰기에 집중하면, 우측 캔버스를 확장하고 채팅창을 '주석(Note)' 모드로 축소합니다.
  - **Coder Mode:** 사용자가 코딩을 시작하면, 모노스페이스 폰트로 전환하고 터미널 패널을 활성화합니다.
- **매커니즘:** `SystemDNA` (JSON 설정값)를 AI가 직접 수정(Mutation)하여 즉시 반영.

### B. Functional Extension (기능적 확장 via n8n)
- **개념:** 플랫폼에 없는 기능이 필요할 때, 외부 자동화 도구(n8n)를 연결하여 새로운 '장기(Organ)'를 생성합니다.
- **예시:** "매일 환율 알려줘" -> ZIA가 n8n Webhook을 생성하고 스케줄러를 등록하여 기능을 '획득'합니다.

## 2. SELF-REPAIR (자가 수리)
시스템의 엔트로피(오류)가 증가할 때, 스스로 질서를 회복하는 루틴입니다.

### A. API Failover
- Gemini Pro 응답 없음 -> Flash로 전환 -> Local Model로 전환.
- Google Search 오류 -> 내부 World Knowledge DB 검색으로 전환.

### B. Memory Pruning
- `localStorage` 용량이 가득 차면, 오래된 `CHAT_LOG`를 요약(Summary)하여 압축하고 원본은 삭제하여 공간을 확보합니다.

## 3. DNA MUTATION LOG (진화 기록)
시스템은 자신이 어떻게 변해왔는지 기억해야 합니다.
- **Generation 1:** 기본 챗봇.
- **Generation 2:** FDE 기억 장착.
- **Generation 3:** 종환 님 전용 글쓰기 파트너로 진화.
