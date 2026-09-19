# 백엔드 모듈

## 설정과 진입점

[manage.py](../../backend/manage.py)는 관리 명령, [config/urls.py](../../backend/config/urls.py)는 `/admin/`과 `/api/` 연결, [settings.py](../../backend/config/settings.py)는 커스텀 Account·DB·CORS·CSRF·Celery 설정을 담당합니다. 운영 서버는 [WSGI](../../backend/config/wsgi.py)를 Gunicorn으로 실행합니다.

## 도메인 모듈

| 파일 | 책임 |
| --- | --- |
| [account_endpoints.py](../../backend/api/views/account_endpoints.py) | 가입·인증·복구·계정 변경 |
| [company_info_endpoints.py](../../backend/api/views/company_info_endpoints.py) | 회사 정보 조회·수정 |
| [auth_key_endpoints.py](../../backend/api/views/auth_key_endpoints.py) | 키 생성·허용 지원서·크레딧 이동 |
| [job_description_endpoints.py](../../backend/api/views/job_description_endpoints.py) | JD CRUD와 체크리스트 작업 요청 |
| [checklist_endpoints.py](../../backend/api/views/checklist_endpoints.py) | 평가 항목 CRUD |
| [resume_endpoints.py](../../backend/api/views/resume_endpoints.py) | 지원서 CRUD와 리포트 요청 |
| [analysis_report_endpoints.py](../../backend/api/views/analysis_report_endpoints.py) | 리포트 조회·수정·삭제 |
| [chat_endpoints.py](../../backend/api/views/chat_endpoints.py) | 일반 채팅과 JD 작성 대화 |
| [columns.py](../../backend/api/views/columns.py) | 수정 금지·추가 허용 필드 |
| [utils.py](../../backend/api/views/utils.py) | 소유권 범위와 검색 필터 |
| [error_code.py](../../backend/api/views/error_code.py) | 응답 메시지 코드 |

view는 대부분 POST 기반 동기 함수입니다. 일반 `chat`은 async 함수지만 `resume_analyze`는 동기 함수입니다. 함수 안에서 Celery에 위임하는 것과 Django async view는 구분합니다.

## 그래프와 작업

[api/tasks.py](../../backend/api/tasks.py)는 worker 가용성을 확인하고 입력·상태·결과를 DB에 저장합니다. `common/*_graph.py`는 실행 순서, `*_agent.py`는 모델·구조화 출력·검색 호출, `*_prompt.py`는 지시문과 평가 기준을 정의합니다.

`analysis_graph`, `checklist_graph`, `chat_graph`, `jd_chat_graph`, `feedback_graph`는 용도가 다른 그래프입니다. 마스킹과 STAR의 RunPod 호출은 각각 별도 모듈에 있습니다.

## 마이그레이션

[초기 migration](../../backend/api/migrations/0001_initial.py) 이후 리포트 상태·생성 시각, 버전·사용자 평가, 검토 메모·실패 상태, JD 체크리스트 상태를 추가하는 0002~0005가 있습니다. `Resume.status`는 현재 모델에 없으며 리포트 상태를 사용합니다.

직접 SQL로 상태 필드를 추가하기보다 현재 migration과 모델을 먼저 대조합니다. [스키마 문서](../05-database/schema-and-erd.md)는 최종 모델을 설명합니다.
