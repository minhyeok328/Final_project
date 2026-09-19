# 디렉터리 구조

## 코드 탐색 지도

| 경로 | 책임 | 처음 읽을 파일 |
| --- | --- | --- |
| `backend/config/` | Django·Celery·DB·쿠키 설정 | [settings.py](../../backend/config/settings.py), [celery.py](../../backend/config/celery.py) |
| `backend/api/` | 데이터 모델, URL, 작업 | [models.py](../../backend/api/models.py), [urls.py](../../backend/api/urls.py), [tasks.py](../../backend/api/tasks.py) |
| `backend/api/views/` | 도메인 endpoint와 권한·필드 검사 | [utils.py](../../backend/api/views/utils.py), [columns.py](../../backend/api/views/columns.py) |
| `backend/api/migrations/` | DB 변경 이력 | [초기 migration](../../backend/api/migrations/0001_initial.py) |
| `backend/common/` | 그래프, agent, prompt, 모델 호출 | [analysis_graph.py](../../backend/common/analysis_graph.py), [chat_graph.py](../../backend/common/chat_graph.py) |
| `frontend/src/` | 앱 시작과 화면 | [main.tsx](../../frontend/src/main.tsx), [App.tsx](../../frontend/src/App.tsx) |
| `frontend/src/api/` | HTTP, 도메인 client, Zod, adapter, Query | [backendClient.ts](../../frontend/src/api/backendClient.ts), [appDataService.ts](../../frontend/src/api/appDataService.ts) |
| `frontend/src/hooks/` | 인증·데이터·선택·채팅·mutation 상태 | [useAppDataQuery.ts](../../frontend/src/hooks/useAppDataQuery.ts) |
| `frontend/src/pages/` | 라우트별 페이지 | [라우트 안내](../03-frontend/pages-and-routes.md) |
| `frontend/src/components/` | 공통·레이아웃·도메인 UI | [프론트 개요](../03-frontend/overview.md) |
| `frontend/src/styles/` | 공통·도메인·반응형 CSS | [index.css](../../frontend/src/styles/index.css) |
| `frontend/src/test/`, `frontend/tests/e2e/` | 테스트 설정과 브라우저 시나리오 | [검증 문서](../10-quality/verification-and-limitations.md) |
| `frontend/scripts/` | 독립 검증 스크립트 | [API 계약 검증](../../frontend/scripts/verify-backend-contract.mjs) |
| `data-pipeline/crawling/` | 채용 플랫폼별 수집과 조건 벡터 준비 | [수집 문서](../05-database/data-collection-and-embedding.md) |
| `data-pipeline/embedding/` | 매뉴얼 청킹·임베딩·적재 | [chunk_embedding.ipynb](../../data-pipeline/embedding/chunk_embedding.ipynb) |
| `llm/` | 학습·오프라인 평가 | [모델 문서](../07-ai-modeling/README.md) |
| `runpod/` | GPU 추론 handler·컨테이너 | [masking_handler.py](../../runpod/masking_handler.py), [star_handler.py](../../runpod/star_handler.py) |
| `.deploy/`, `.github/workflows/` | Nginx·systemd·배포 | [배포 문서](../09-deployment/deployment.md) |
| `outputs/` | 인터페이스 정의서와 미리보기 산출물 | [정의서](../../outputs/interface-definition/HumouR_인터페이스정의서.xlsx) |
| `scripts/interface-definition/` | 인터페이스 산출물 생성·검증 도구 | [생성](../../scripts/interface-definition/build_interface_definition.mjs), [검증](../../scripts/interface-definition/verify_interface_definition.mjs) |

## 계층별 변경 지점

API 필드를 바꾸면 모델·view·프론트 타입·Zod·adapter를 함께 확인합니다. 화면 선택·폼 상태는 페이지와 hook에, HTTP 인증 처리는 공통 client에 둡니다. AI 출력 형식을 바꾸면 Pydantic 모델과 prompt뿐 아니라 task의 저장 매핑도 확인합니다.

운영 입력 데이터, 모델 가중치, 원격 DB와 secret 파일은 이 디렉터리 표가 보장하는 산출물이 아닙니다. 해당 자원의 준비 상태는 [개발 환경](../01-getting-started/development-environment.md)에서 별도로 구분합니다.
