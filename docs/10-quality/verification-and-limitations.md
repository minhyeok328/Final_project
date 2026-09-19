# 검증과 한계

검증 도구의 존재, 저장된 모델 출력, 현재 실행한 결과는 구분합니다. 이 문서 개편에서는 코드·설정·노트북 출력과 문서 링크를 확인했으며 앱 테스트·모델 호출·학습·원격 배포는 실행하지 않았습니다.

## 프론트 검증

`frontend/`에서 실행합니다.

```bash
npm run lint
npm run build
npm run test
npm run test:coverage
npm run test:e2e
node scripts/verify-backend-contract.mjs
```

[package.json](../../frontend/package.json)에 정의된 빌드는 TypeScript 검사와 Vite 빌드입니다. Vitest·Testing Library·MSW는 응답 파싱·인증·hook·페이지 동작을 검사합니다. 테스트 mock의 응답이 현재 Django와 일치하는지는 별도로 확인해야 합니다.

[Playwright 설정](../../frontend/playwright.config.ts)은 Chromium을 사용합니다. 접근성 spec은 `E2E_PORT` 기본 5181, 인증 보안 spec은 `E2E_SECURITY_PORT` 기본 5182로 각자 Vite 서버를 띄웁니다. `PLAYWRIGHT_CHROMIUM_EXECUTABLE`로 브라우저 경로를 지정할 수 있습니다. Windows Chrome/Edge 후보가 없으면 Playwright 브라우저 설치가 필요할 수 있습니다.

[접근성 spec](../../frontend/tests/e2e/auth-accessibility.spec.ts)과 [인증 보안 spec](../../frontend/tests/e2e/auth-security.spec.ts)은 해당 브라우저 시나리오를 검사합니다. 이 결과가 서버 전체 보안 검증이나 모든 페이지 접근성 인증을 뜻하지 않습니다.

## 실제 Django 계약 검증

```bash
cd backend
python manage.py check
python manage.py test
```

현재 백엔드에 별도 Django 테스트 모듈은 확인되지 않습니다. `manage.py test`가 종료되더라도 실제 실행된 테스트 수를 확인해야 합니다. 설정 검사는 DB 권한·모델 결과·운영 배포의 정상 동작을 대신하지 않습니다.

[verify-live-django-api.mjs](../../frontend/scripts/verify-live-django-api.mjs)는 임시 SQLite와 설정 파일을 만들고 migration·Django 서버·CRUD 요청을 실행합니다. 백엔드 의존성이 설치된 Python을 지정합니다.

```powershell
Set-Location frontend
$env:PYTHON = (Resolve-Path ../backend/.venv/Scripts/python.exe).Path
node scripts/verify-live-django-api.mjs
```

LLM 단계는 `RUN_LLM_E2E=1`과 `OPENAI_API_KEY`가 있을 때만 실행됩니다. 여기에 필요한 RunPod·Pinecone 설정도 충족해야 합니다. 실행하면 외부 요청·비용이 발생할 수 있으며 일반 CRUD 검사와 구분합니다.

## 변경 범위별 스크립트

| 범위 | `frontend/scripts/`의 실행 파일 |
| --- | --- |
| API 계약 | `verify-backend-contract.mjs`, `verify-live-django-api.mjs` |
| 인증 | `verify-auth-flow.mjs`, `verify-auth-text-links.mjs` |
| 관리자·키 | `verify-admin-layout.mjs`, `verify-admin-authkey-panel.mjs` |
| JD | `verify-jd-create-flow.mjs` |
| 지원서 | `verify-cover-letter-save-flow.mjs`, `verify-cover-letter-selection-flow.mjs` |
| 리포트·공유 | `verify-analysis-report-page.mjs`, `verify-shared-route.mjs` |
| 채팅 | `verify-document-chat-widget.mjs`, `verify-chat-context-real-data.mjs` |
| 구조·레이아웃 | `verify-state-management-refactor.mjs`, `verify-viewport-layout.mjs`, `verify-qa-stability-fixes.mjs` |

개별 스크립트는 `node scripts/<파일명>`으로 실행하며 브라우저·서버·mock 여부와 생성 경로는 해당 파일을 먼저 확인합니다. 문서 채팅 검증은 `VERIFY_PORT` 기본 5176과 브라우저 실행 경로를 사용하고 `qa-screenshots/`에 화면을 저장합니다.

## 확인된 구현 제약

| 영역 | 현재 코드의 제약 | 근거 |
| --- | --- | --- |
| 계정 권한 | 계정 수정의 차단 목록이 좁아 credit·구독·AbstractUser 권한 필드도 수정 대상에 포함 | [계정 view](../../backend/api/views/account_endpoints.py), [columns](../../backend/api/views/columns.py) |
| 민감 응답·복구 | 확인 답변·계정 해시가 직렬화되고 복구 비밀번호를 응답으로 반환 | [모델](../../backend/api/models.py), [계정 view](../../backend/api/views/account_endpoints.py) |
| 키 저장 | 원문 DB 저장, 조회 시 마스킹. 읽기 전용 키가 아님 | [권한 문서](../04-backend/auth-and-permissions.md) |
| 분석 중복 | 지원서 분석에 기존 작업 검사·체크리스트 서버 선검증 없음 | [지원서 view](../../backend/api/views/resume_endpoints.py) |
| 작업 복구 | 가용성 캐시, 큐 등록 실패, 프로세스 종료·재전송 시나리오의 복구 검증 필요 | [tasks](../../backend/api/tasks.py) |
| 마스킹 | 설정 누락·전송 예외의 fallback 차이, 원문 외부 전송 | [모델 문서](../07-ai-modeling/model-pipeline.md) |
| 피드백 | 최대 횟수 후 기준 미달 결과도 다음 단계로 전달 | [feedback_graph](../../backend/common/feedback_graph.py) |
| 배포 | 빌드·check·ping 외 자동 테스트 gate와 rollback 없음 | [배포 문서](../09-deployment/deployment.md) |
| 확장성 | JD별 지원서·지원서별 리포트 요청 조합, 전체 AppData polling | [dashboardSource](../../frontend/src/api/services/dashboardSource.ts) |

## 미확인 영역

현재 외부 API·모델·adapter·Pinecone 데이터·원격 서버의 가동 상태, 브라우저 전체 흐름, 실제 모바일·스크린리더·확대 사용, 동시 요청과 장애 복구는 이 문서 작업으로 검증하지 않았습니다. [수동 확인](manual-acceptance.md)과 [오프라인 평가](../07-ai-modeling/offline-evaluation.md)는 각 검증의 범위를 따로 설명합니다.
