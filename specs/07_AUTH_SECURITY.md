
# 07. AUTHENTICATION & SECURITY (인증 및 보안 명세)

> **Core Principle:** "Zero-Trust Architecture on Client-Side"

## 1. GOOGLE DRIVE INTEGRATION (OAuth 2.0)

서버가 없는 브라우저(SPA) 환경이므로, **Google Identity Services (GIS) SDK**의 'Token Model'을 사용합니다.

### A. Auth Flow (인증 흐름)
1.  **Init:** `google.accounts.oauth2.initTokenClient` 호출.
2.  **Scopes:** 
    - `https://www.googleapis.com/auth/drive.file`: ZIA가 생성한 파일만 접근 (전체 드라이브 접근 X).
    - `https://www.googleapis.com/auth/generative-language.retriever`: Gemini RAG 기능 사용 시 필요.
3.  **Storage:** 
    - Access Token은 **절대 `localStorage`에 저장하지 않음** (XSS 취약점 방지).
    - 오직 브라우저 메모리(React State/Context)에만 유지하며, 새로고침 시 재인증을 요구하거나 Silent Refresh를 시도함.

## 2. COMPUTE SWARM CONNECTION (Colab Bridge)

직접적인 WebSocket 연결은 Colab 보안 정책상 불가능하므로, **"Drive-as-a-Bridge" 패턴**을 사용합니다.

### A. The Mailbox Pattern (우체통 패턴)
ZIA 앱과 Colab 노트북이 **Google Drive의 특정 폴더(`ZIA_SWARM_BRIDGE`)**를 공유하며 통신합니다.

1.  **Command (App -> Drive):**
    - 앱이 `cmd_task_01.json` 파일을 드라이브 폴더에 업로드.
    - 내용: `{ "id": "task_01", "action": "run_fde", "payload": "..." }`
2.  **Execution (Colab):**
    - Colab에서 실행 중인 `zia_worker.py` 스크립트가 해당 폴더를 주기적으로 폴링(Polling)하거나 변경 사항을 감지.
    - 새 명령 파일을 읽어 연산(FDE/Python) 수행 후, `result_task_01.json` 생성.
3.  **Result (Drive -> App):**
    - 앱이 결과 파일 생성을 감지하고 내용을 읽어 UI 업데이트.
    - 처리된 명령 파일은 아카이빙 폴더로 이동.

### B. Security Benefits
- **No Firewall Issues:** 방화벽이나 포트 포워딩 설정 없이도 안전하게 통신 가능.
- **Audit Trail:** 모든 명령과 결과가 파일로 남아 작업 이력 추적 용이.

## 3. KAGGLE API INTEGRATION
(Reference: Kaggle API Documentation)

### A. Credentials Management
- Kaggle은 `kaggle.json` (username, key)을 통한 인증을 사용.
- **Client-Side Proxy:** 브라우저에서 직접 Kaggle API를 호출할 경우 CORS 문제가 발생할 수 있음.
- **Solution:** 
    1.  **Colab Proxy:** Kaggle 연산이 필요한 경우, `kaggle.json` 자격 증명을 Colab Bridge를 통해 Colab 런타임에 안전하게 주입.
    2.  **Execution:** 실제 Kaggle Dataset 다운로드 및 커널 실행은 Colab 환경 내부에서 수행.

## 4. PICO-MCP SECURITY
- **Sandboxing:** 외부 도구(Python, n8n) 실행 결과는 렌더링 전 반드시 **HTML Sanitization**을 거쳐야 함.
- **Confirmation:** 파일 삭제, 전송 등 민감한 작업은 반드시 **사용자 승인(Human-in-the-loop)** 팝업을 띄움.
