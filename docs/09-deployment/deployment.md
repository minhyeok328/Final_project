# 배포

저장소에는 프론트·백엔드를 서로 다른 EC2에 배포하는 설정이 있습니다. 이 문서는 구성된 절차를 설명하며 현재 서버·도메인·RunPod endpoint의 가동 상태를 확인한 결과는 아닙니다.

## 구성과 사전 조건

[deploy.yml](../../.github/workflows/deploy.yml)은 `dev` 브랜치의 지정 경로 push 또는 수동 실행으로 동작합니다. 프론트·백엔드 job은 각각 S3 artifact와 SSM 명령을 사용합니다. 같은 ref의 이전 배포를 취소하는 concurrency 설정이 있습니다.

AWS 계정·S3 bucket·대상 EC2·SSM 연결·IAM 권한·서버 네트워크는 미리 준비해야 합니다. 이 워크플로는 인프라 전체를 생성하는 IaC가 아닙니다.

워크플로 secret 이름은 `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_KEY`, `AWS_ACCESS_REGION`, `S3_DEPLOY_BUCKET`, `AWS_FRONTEND_INSTANCE_ID`, `AWS_BACKEND_INSTANCE_ID`입니다. 실제 값은 문서나 저장소에 넣지 않습니다.

## 프론트 배포

Node 20에서 `npm ci`, `npm run build`를 실행해 `frontend/dist`를 S3에 올립니다. SSM이 `/var/www/app/frontend`로 동기화하고 [frontend.conf](../../.deploy/frontend.conf)를 설치한 뒤 `nginx -t`와 reload를 수행합니다.

정적 경로는 `index.html` fallback을 사용합니다. `/api/`는 설정 파일에 고정된 백엔드 사설 주소로 전달하며 read/send timeout은 180초입니다. 새 환경에서는 사설 upstream 주소가 맞는지 확인해야 합니다. `VITE_API_PROXY_TARGET`은 개발 서버 설정이므로 운영 Nginx를 바꾸지 않습니다.

## 백엔드 배포

backend 소스와 [Nginx](../../.deploy/backend.conf), [Gunicorn unit](../../.deploy/gunicorn.service), [Celery unit](../../.deploy/celery.service)을 S3·SSM으로 설치합니다. 소스 업로드에서 `.venv`, 캐시, SQLite DB, `.env`를 제외합니다.

서버에서는 Python 3.14 가상환경·requirements 설치, Django `check`, `migrate`, `collectstatic`, Valkey·Celery·Gunicorn·Nginx 재시작을 수행합니다. 마지막 확인은 로컬 `/api/ping/` 요청입니다. Django 테스트, 프론트 lint·Vitest·브라우저 테스트를 배포 gate로 실행하는 구성은 아닙니다.

## 프로세스와 환경

| 대상 | 설정 |
| --- | --- |
| Gunicorn | `myapp-gunicorn`, worker 3, `127.0.0.1:8000`, timeout 120초 |
| Celery | `myapp-celery`, `celery -A config worker --loglevel=info`, `valkey.service` 의존 |
| 작업 경로 | `/var/www/app/backend` |
| 환경 파일 | `/etc/secrets.env` |
| 백엔드 Nginx | localhost 8000 프록시, read/send 150초, body 20M |

[환경 변수](../01-getting-started/development-environment.md)를 Gunicorn과 Celery에 동일하게 공급합니다. `IS_REMOTE_HOST`가 설정되면 RDS 연결을 사용합니다. 현재 설정 파일 자체는 HTTP 80을 수신하므로 외부 TLS 종료와 쿠키 secure 정책은 실제 인프라에서 별도 확인해야 합니다.

## 점검과 장애 대응

운영 호스트의 읽기 점검 예시:

```bash
systemctl status myapp-gunicorn myapp-celery valkey nginx --no-pager
journalctl -u myapp-gunicorn -n 100 --no-pager
journalctl -u myapp-celery -n 100 --no-pager
curl -f http://127.0.0.1/api/ping/
```

ping 성공은 DB·OpenAI·Pinecone·RunPod 전체 정상 여부를 확인하지 않습니다. 분석 지연은 작업 상태와 worker 로그를 함께 확인합니다. 동기 분석에서는 RunPod 600초 timeout보다 Gunicorn 120초가 짧아 요청이 먼저 중단될 수 있습니다.

소스 sync와 migration은 운영 상태를 바꿉니다. 워크플로에는 자동 DB 백업·schema rollback·무중단 전환이 없으므로 배포 전 복구 가능한 DB 백업과 이전 artifact를 준비해야 합니다. 이 저장소 설정만으로 복구 가능성을 검증한 것은 아닙니다.

## RunPod 별도 배포

GPU handler는 웹 EC2 workflow에서 배포하지 않습니다. 컨테이너의 build context는 `runpod/`입니다.

```bash
docker build -f runpod/masking_docker -t humour-masking:local runpod
docker build -f runpod/star_docker -t humour-star:local runpod
```

이미지 빌드에는 네트워크·컨테이너 환경이 필요하고 실제 추론에는 GPU와 모델 접근권한이 필요합니다. 레지스트리 push·RunPod endpoint 생성·API 변수 연결은 별도 구성입니다. 현재 가중치와 endpoint 이용 가능 여부는 확인하지 않았습니다.
