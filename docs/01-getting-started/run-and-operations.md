# 실행과 운영

명령은 별도 터미널에서 실행합니다. 저장소 루트를 시작 위치로 가정하며, [개발 환경](development-environment.md)의 런타임과 환경 변수를 먼저 준비합니다.

## 백엔드

Windows PowerShell:

```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
Set-Location backend
python manage.py check
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

macOS/Linux에서는 가상환경 활성화 명령을 `source backend/.venv/bin/activate`로 바꿉니다. `migrate`는 DB를 변경하며, 로컬 SQLite의 기본 경로는 `backend/db.sqlite3`입니다. 새 DB에는 계정·JD·지원서가 없으므로 웹 가입과 입력 흐름으로 데이터를 준비합니다.

## 프론트엔드

저장소 루트에서 새 터미널을 열어 실행합니다.

```powershell
Set-Location frontend
npm ci
npm run dev
```

주소는 `http://127.0.0.1:5173`이며 포트가 사용 중이면 `strictPort` 설정으로 실패합니다. 브라우저와 API 주소에서 `localhost`와 `127.0.0.1`을 섞지 않는 편이 쿠키·CSRF 문제를 줄입니다. 백엔드 상태는 `GET /api/ping/`으로 확인할 수 있습니다.

## Celery worker

Redis 또는 Valkey가 `127.0.0.1:6379`에서 먼저 실행되어 있어야 합니다. 브로커 DB는 0, 결과 저장 DB는 1로 [설정에 고정](../../backend/config/settings.py)되어 있습니다.

```bash
cd backend
celery -A config worker --loglevel=info
```

운영 구성은 Linux systemd worker를 사용합니다. Windows 로컬에서 같은 worker 동작을 확인했다고 가정하지 않습니다. worker가 없으면 지원서·JD 분석은 동기 실행으로 진행하며 긴 요청이 발생할 수 있습니다.

[작업 모듈](../../backend/api/tasks.py)은 최초 worker ping 결과를 프로세스 메모리에 저장합니다. 실행 중 worker를 켜거나 끈 뒤 감지가 갱신되지 않으면 웹 프로세스를 재시작해 상태를 다시 확인합니다.

## 실패 확인

| 증상 | 확인할 위치 |
| --- | --- |
| 화면 API 연결 실패 | Vite 프록시 대상, Django 8000 포트, 브라우저 네트워크 응답 |
| CSRF 실패 | `/api/csrf/`, 쿠키 origin, secure 플래그와 HTTP/HTTPS 일치 |
| 모델 분석 실패 | RunPod 설정·응답, OpenAI 접근권한, worker 로그 |
| 검색 결과 없음 | Pinecone host, namespace 철자, metadata 필드와 적재 데이터 |
| 대기 상태 지속 | worker 가용성 캐시, 브로커, Celery 작업 상태 |
| 요청은 성공인데 작업 실패 | 응답 `data.status` 또는 `checklist_status`가 `fail`인지 확인 |

지원서 분석 실패 시 코드에는 차감분 환불 경로가 있습니다. 큐 등록 실패는 동기 재시도 없이 실패 리포트를 반환합니다. 모든 장애 상황에서 환불이 정확히 한 번 이루어진다는 검증은 별도입니다.

## 중지와 검증

로컬 dev server와 worker는 해당 터미널에서 `Ctrl+C`로 중지합니다. 데이터베이스 파일을 삭제하는 방식으로 종료하지 않습니다. lint·빌드·단위 테스트·실제 API 검증의 구분과 명령은 [검증과 한계](../10-quality/verification-and-limitations.md), 운영 서버 점검은 [배포](../09-deployment/deployment.md)를 참고합니다.

## 인터페이스 산출물 도구

생성·검증 스크립트는 [scripts/interface-definition](../../scripts/interface-definition/)에 있고 결과는 기존 [outputs/interface-definition](../../outputs/interface-definition/)에 저장합니다. 웹 애플리케이션 실행과 별개인 도구입니다.

두 스크립트는 Node에서 `@oai/artifact-tool`을 해석할 수 있는 별도 환경이 필요합니다. 이 의존성을 설치하는 루트 package manifest는 없으며 프론트 `npm ci`만으로 준비된다고 가정하지 않습니다. 생성기에 필요한 외부 XLSX 템플릿도 저장소에 포함되어 있지 않습니다.

저장소 루트에서 실제 템플릿 경로를 첫 번째 인자로 전달합니다.

```powershell
node scripts/interface-definition/build_interface_definition.mjs "<외부 XLSX 템플릿 경로>"
node scripts/interface-definition/verify_interface_definition.mjs
```

입력 인자를 생략하면 현재 작업 폴더의 `인터페이스정의서_템플릿.xlsx`를 찾습니다. 출력 경로는 스크립트 위치를 기준으로 계산하므로 다른 작업 폴더에서 실행해도 같은 저장소의 `outputs/interface-definition/`을 사용합니다. 생성 명령은 기존 XLSX·미리보기를 덮어쓸 수 있습니다. 폴더 정리 과정에서는 생성·검증 도구를 실행하거나 기존 산출물을 다시 만들지 않았습니다.
