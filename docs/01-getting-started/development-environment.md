# 개발 환경

## 런타임과 의존성

백엔드 기준은 [requirements](../../backend/requirements.txt), 프론트 기준은 [package.json](../../frontend/package.json)과 [lockfile](../../frontend/package-lock.json)입니다. 루트 requirements는 백엔드 파일을 참조합니다.

- Python: Django 6을 실행할 수 있는 Python 3.12 이상이 필요합니다. 배포 스크립트는 `python3.14`를 사용하지만 모든 로컬 플랫폼의 설치 성공을 보장하지 않습니다.
- Node: lockfile의 Vite 관련 엔진 조건을 만족하는 Node 20.19 이상 또는 22.12 이상을 사용합니다. CI는 Node 20 계열입니다.
- 백엔드: Django 6.0.5, Gunicorn 26.0.0, django-cors-headers 4.9.0, OpenAI 2.41.0, Pinecone 9.1.0, mysqlclient 2.2.8, LangGraph 1.2.4, Celery 5.6.3, Redis 클라이언트 8.0.1 등이 고정되어 있습니다.
- `mysqlclient`는 SQLite 실행에서도 requirements에 포함됩니다. 플랫폼에 맞는 wheel이 없으면 MySQL/MariaDB 개발 라이브러리와 컴파일 도구가 필요합니다.
- 마스킹·STAR 모듈은 `requests`를 import하지만 직접 의존성으로 선언되어 있지 않습니다. 설치 후 import 오류가 발생하면 의존성 선언을 먼저 검토합니다.
- RunPod의 GPU 의존성은 [별도 requirements](../../runpod/requirements.txt)와 컨테이너 파일에서 관리합니다. 웹 API 환경과 동일한 환경으로 보지 않습니다.

## 백엔드 환경 변수

| 변수 | 사용 지점 |
| --- | --- |
| `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` | Django 기본·호스트 설정 |
| `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS` | 쉼표 구분 브라우저 origin 목록 |
| `DJANGO_CSRF_COOKIE_SECURE`, `DJANGO_SESSION_COOKIE_SECURE` | HTTPS 쿠키 설정, 문자열 `true`일 때 활성 |
| `IS_REMOTE_HOST` | 비어 있지 않으면 MySQL 및 원격 오류 표시 경로 선택 |
| `RDS_HOSTNAME`, `RDS_PORT`, `RDS_USERNAME`, `RDS_PASSWORD`, `RDS_DB_NAME` | 원격 DB 연결, 기본 포트 3306 |
| `OPENAI_API_KEY` | 분석·생성·임베딩 |
| `PINECONE_API_KEY`, `PINECONE_HOST` | 체크리스트와 사용 설명서 검색 |
| `RUNPOD_API_KEY`, `RUNPOD_MASKING_ENDPOINT_ID`, `RUNPOD_STAR_ENDPOINT_ID` | LoRA 모델 추론 호출 |

[Django 설정](../../backend/config/settings.py)은 프로세스 환경을 직접 읽습니다. DB·호스트·보안 변수는 실행 전에 설정합니다. `IS_REMOTE_HOST=false`처럼 문자열을 넣어도 비어 있지 않으므로 원격 DB로 전환됩니다. SQLite를 쓰려면 이 변수를 설정하지 않습니다.

[load_env](../../backend/common/utils.py)는 로컬에서 `OPENAI_API_KEY`가 아직 없을 때만 `backend/.env`를 읽습니다. 이미 OpenAI 키가 프로세스에 있으면 파일의 Pinecone·RunPod 변수도 자동 로드되지 않습니다. 한 방식으로 필요한 값을 모두 공급해야 합니다.

키를 실제로 출력하거나 문서에 붙여 넣지 않고 로컬 비공개 환경 또는 운영 secret 저장소에 설정합니다. 기본 CRUD는 외부 모델 호출 없이 사용할 수 있지만 AI 기능에는 각 서비스의 유효한 설정이 필요합니다.

## 프론트 환경

[Vite 설정](../../frontend/vite.config.ts)은 `/api`를 기본 `http://127.0.0.1:8000`으로 전달합니다. 다른 서버를 사용할 때만 `VITE_API_PROXY_TARGET`을 지정합니다. 예제 파일의 `http://0.0.0.0`을 그대로 복사하지 말고 접근 가능한 주소를 사용합니다.

`VITE_USE_MOCK_API`는 사용되지 않습니다. API Key는 빌드 환경에 넣지 않으며 화면 입력을 필요한 요청의 `X-API-Key`로 전달합니다.

## 기능별 추가 준비

| 기능 | 필요한 자원 |
| --- | --- |
| 기본 계정·회사·JD·지원서 관리 | Django DB 마이그레이션 |
| 분석 | OpenAI, 정상 RunPod 마스킹 endpoint 또는 마스킹 폴백 제약을 검토한 환경 |
| JD 체크리스트 | OpenAI, Pinecone 조건 namespace, 마스킹 호출 조건 |
| 사용 설명서 검색 | OpenAI 임베딩, Pinecone `user_manual` 데이터 |
| 작업 큐 | 로컬 6379 포트의 Redis/Valkey, Celery worker |
| LoRA 직접 추론 | CUDA GPU, 모델·adapter 접근권한, RunPod 컨테이너 환경 |

마스킹은 endpoint 미설정·전송 예외를 STAR처럼 처리하지 않습니다. 따라서 OpenAI 키 하나만으로 전체 분석이 안정적으로 동작한다고 가정하지 않습니다. [모델 파이프라인](../07-ai-modeling/model-pipeline.md)을 함께 확인합니다.
