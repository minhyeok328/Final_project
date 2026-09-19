# 프론트 API ID 매핑

인터페이스 산출물의 ID와 실제 URL을 연결하는 표입니다. 계약의 세부 내용은 [API 레퍼런스](api-reference.md)를 기준으로 봅니다. 별도 서버 버전이나 자동 생성 식별자가 아닙니다.

| ID | 경로 | 동작 |
| --- | --- | --- |
| OPS-001 | `/api/ping/` | 상태 확인 |
| AUTH-001 | `/api/csrf/` | CSRF 쿠키 |
| AUTH-002 | `/api/signin/` | 가입 |
| AUTH-003 | `/api/login/` | 로그인 |
| AUTH-004 | `/api/logout/` | 로그아웃 |
| AUTH-005 | `/api/checkuser/` | 아이디 확인 |
| AUTH-006 | `/api/passqestion/` | 복구 질문 |
| AUTH-007 | `/api/passreset/` | 비밀번호 복구 |
| ACC-001 / ACC-002 | `/api/account/get/`, `/api/account/modify/` | 계정 조회·수정 |
| COMP-001 / COMP-002 | `/api/compinfo/get/`, `/api/compinfo/modify/` | 회사 조회·수정 |
| KEY-001 / KEY-002 | `/api/authkey/add/`, `/api/authkey/get/` | 키 생성·조회 |
| KEY-003 / KEY-004 | `/api/authkey/modify/`, `/api/authkey/credit/` | 키 수정·잔액 |
| JD-001 / JD-002 | `/api/jd/add/`, `/api/jd/get/` | JD 생성·조회 |
| JD-003 / JD-004 | `/api/jd/modify/`, `/api/jd/analyze/` | JD 수정·체크리스트 생성 |
| CHK-001 / CHK-002 / CHK-003 | `/api/checklist/add/`, `/api/checklist/get/`, `/api/checklist/modify/` | 평가 항목 CRUD |
| RES-001 / RES-002 | `/api/resume/add/`, `/api/resume/get/` | 지원서 생성·조회 |
| RES-003 / RES-004 | `/api/resume/analyze/`, `/api/resume/modify/` | 분석·수정 |
| REP-001 / REP-002 | `/api/report/get/`, `/api/report/modify/` | 리포트 조회·수정 |
| CHAT-001 / CHAT-002 | `/api/chat/`, `/api/jd_chat/` | 문서·JD 채팅 |

프론트는 OPS·CSRF를 GET, 업무 호출을 POST로 사용합니다. 요청 구현은 [clients](../../frontend/src/api/clients/), 실제 등록 경로는 [urls.py](../../backend/api/urls.py)에 있습니다. 삭제는 각 도메인의 modify 요청에 `delete:true`를 포함합니다.
