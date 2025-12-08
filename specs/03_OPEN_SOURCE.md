
# 03. OPEN SOURCE INTEGRATION (오픈소스 연결 계획)

> **Strategy:** "Don't Reinvent, Just Connect." (만들지 말고 연결하라)

## 1. 핵심 연결 라이브러리 (Python Backend)
ZIA는 브라우저에서 무거운 연산을 하지 않고, **Google Colab**이나 **Local Docker**에서 다음 오픈소스를 실행합니다.

### A. 지식/기억 (Memory)
- **Muveraphy (FDE):** 
    - *역할:* 다중 벡터 문서 압축 및 검색.
    - *활용:* 종환 님이 제공한 파이썬 코드를 Colab에서 실행하여, 방대한 문서를 작은 벡터로 변환.
    - *Source Status:* Core Logic is mathematical and timeless. Requires `numpy` and `torch`.
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

## 3. COMPATIBILITY & VERSIONING (호환성 및 버전 관리)
사용자가 제공한 레거시 코드나 외부 자료의 시점 차이로 인한 오류를 방지하기 위해 다음 전략을 사용합니다.

### A. Dependency Locking (버전 고정)
Colab이나 Docker 실행 시, 최신 버전이 아닌 **검증된 안정 버전**을 강제로 설치합니다.
```python
# requirements_lock.txt example
numpy==1.24.3
torch>=2.0.0
langchain==0.1.0
kaggle>=1.5.12
```

### B. Adaptive Refactoring (적응형 리팩토링)
ZIA Core(Gemini Pro)는 실행 전 스크립트를 검사합니다.
1.  **Check:** 사용자가 제공한 코드(예: 2019년형 Kaggle 스크립트)를 분석.
2.  **Update:** 현재 라이브러리 문법과 다른 점(예: deprecated functions)이 있다면, **실행 직전에 코드를 최신 문법으로 자동 수정(Rewrite)**하여 Colab으로 전송합니다.
3.  **Execute:** 수정된 코드를 실행하여 오류를 사전에 차단합니다.
