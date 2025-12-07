# 03. OPEN SOURCE INTEGRATION (오픈소스 연결 계획)

> **Strategy:** "Don't Reinvent, Just Connect." (만들지 말고 연결하라)

## 1. 핵심 연결 라이브러리 (Python Backend)
ZIA는 브라우저에서 무거운 연산을 하지 않고, **Google Colab**이나 **Local Docker**에서 다음 오픈소스를 실행합니다.

### A. 지식/기억 (Memory)
- **Muveraphy (FDE):** 
    - *역할:* 다중 벡터 문서 압축 및 검색.
    - *활용:* 종환 님이 제공한 파이썬 코드를 Colab에서 실행하여, 방대한 문서를 작은 벡터로 변환.
- **ChromaDB / Qdrant:**
    - *역할:* 벡터 데이터베이스.
    - *활용:* 로컬 혹은 클라우드에 영구 기억 저장소 구축.

### B. 추론/에이전트 (Reasoning)
- **LangGraph:**
    - *역할:* 복잡한 사고 과정(Chain of Thought)을 그래프로 관리.
    - *활용:* 단순 LLM 호출이 아닌, '계획->실행->반성'의 루프 구현.
- **DSPy:**
    - *역할:* 프롬프트 최적화.
    - *활용:* LLM의 출력을 더 정교하게 제어.

### C. 도구/실행 (Runtime)
- **E2B (Code Interpreter):**
    - *역할:* 안전한 샌드박스 코드 실행.
    - *활용:* 사용자가 요청한 파이썬 코드를 격리된 환경에서 실행.

## 2. 연결 프로토콜 (Pico-MCP)
- 위 라이브러리들은 **JSON-RPC** 기반의 경량 프로토콜로 ZIA 브라우저와 통신합니다.
- 예: `ZIA(Web) -> { "cmd": "fde_encode", "data": "text..." } -> Colab(Python)`
