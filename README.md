# HumouR

회사 정보와 직무기술서, 지원서 분석, 면접 질문을 하나의 흐름으로 연결하는 AI 채용 보조 웹 애플리케이션입니다.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/assets/humour-logo-dark.png">
  <img alt="HumouR" src="frontend/public/assets/humour-logo-light.png" width="420">
</picture>

## 프로젝트 소개

HumouR는 채용 담당자가 직무별 평가 기준을 정리하고, 지원서에서 검토할 근거와 후속 질문을 찾도록 돕습니다. 회사와 JD 정보를 바탕으로 체크리스트를 만들고, 지원서 분석 결과를 리포트와 면접 질문으로 확인할 수 있습니다.

분석 과정은 개인정보 표현 추출·치환, 자기소개서 STAR 구조화, 체크리스트 판정, 면접 질문 및 리포트 생성으로 나뉩니다. 각 생성 단계에는 결과를 평가하고 보정하는 피드백 과정이 있습니다. 결과의 등급과 서술은 담당자가 원문과 함께 검토하는 참고 자료입니다.

저장소에는 웹 애플리케이션 외에도 채용 조건 수집기, 검색용 임베딩 노트북, EXAONE LoRA 학습·평가 노트북, RunPod 추론 handler, AWS 배포 설정이 포함되어 있습니다.

## 주요 기능

| 기능 | 제공 내용 |
| --- | --- |
| 회사·JD 관리 | 회사 소개, 팀 구성, 필요 역량, 채용 조건 입력과 대화형 JD 보완 |
| 평가 체크리스트 | 직무 조건 벡터 검색을 이용한 항목 생성과 수동 편집 |
| 지원서 관리 | JD에 연결된 지원자 정보, 경력, 역량, 자기소개 문항 관리 |
| AI 분석 | 마스킹·STAR 구조화와 체크리스트 기반 판정, 비동기 작업 상태 표시 |
| 리포트 검토 | 종합 등급, 분석 근거, 강점·우려점, 면접 질문, 사용자 평가와 메모 |
| 채팅 | 권한 범위의 채용 데이터 조회와 사용 설명서 검색을 결합한 응답 |
| 제한 공유 | API Key별 허용 지원서와 크레딧 설정, 별도 공유 화면 조회 |
| 계정 관리 | 세션 인증, 프로필·비밀번호 변경, 계정 삭제 |

모집 공고와 자기소개서 템플릿 화면은 읽기 전용 미리보기로 남아 있으며 생성·다운로드 기능은 연결되어 있지 않습니다. 관리자 화면의 크레딧·구독 변경은 계정 데이터 수정 기능이며 결제 시스템과 연결되지 않습니다.

## 사용 흐름

1. 계정으로 로그인하고 회사 정보를 작성합니다.
2. JD를 만들고 대화형 작성 도우미로 필요한 내용을 보완합니다.
3. 직무 평가 체크리스트를 생성하거나 직접 입력합니다.
4. JD에 지원서를 등록하고 분석을 요청합니다.
5. 대기·처리·완료·실패 상태를 확인하고 결과 리포트를 검토합니다.
6. 면접 질문과 원문 근거를 비교하고 평가·메모를 남깁니다.
7. 필요한 지원서를 API Key에 허용해 외부 검토 화면에서 조회합니다.

```mermaid
flowchart LR
  Company[회사 정보] --> JD[직무기술서]
  JD --> Checklist[평가 체크리스트]
  Checklist --> Resume[지원서]
  Resume --> Analyze[AI 분석]
  Analyze --> Report[리포트와 면접 질문]
  Report --> Review[검토와 제한 공유]
```

## 기술 구성

| 영역 | 구성 |
| --- | --- |
| 프론트엔드 | React 19, TypeScript, Vite 7, Ant Design, TanStack Query, Axios, Zod, ECharts |
| 백엔드 | Django 6, Django ORM, Gunicorn, Celery, Redis/Valkey |
| 관계형 데이터 | 로컬 SQLite, 원격 설정 시 MySQL/RDS |
| AI 처리 | LangGraph, LangChain, Pydantic, OpenAI |
| 모델 추론 | EXAONE-3.5-2.4B-Instruct 기반 LoRA, RunPod Serverless |
| 벡터 검색 | OpenAI 임베딩, Pinecone |
| 배포 구성 | GitHub Actions, AWS S3·SSM·EC2, Nginx, systemd |

일반 데이터 관리와 AI 기능의 실행 조건은 다릅니다. AI 분석·검색에는 해당 외부 서비스의 설정과 접근 가능한 모델·인덱스가 필요하며, 저장소에 배포 설정이 있다는 사실만으로 서비스가 현재 가동 중임을 뜻하지는 않습니다.

## 프로젝트 구조

```text
Final_project/
├── backend/       # Django API, 데이터 모델, 분석 작업과 그래프
├── frontend/      # React 화면, API 클라이언트, 브라우저 검증
├── data-pipeline/ # 채용 조건 수집과 검색 데이터 준비
├── llm/           # LoRA 학습과 오프라인 평가 노트북
├── runpod/        # 마스킹·STAR 추론 handler와 컨테이너 설정
├── docs/          # 개발·운영 문서
├── outputs/       # 인터페이스 정의서와 미리보기
├── scripts/       # 인터페이스 산출물 생성·검증 도구
├── .deploy/       # Nginx와 systemd 설정
└── .github/       # 배포 워크플로
```

## 문서 안내

[개발 문서 전체 보기](docs/README.md)에서 환경 설정부터 구현과 운영 제약까지 확인할 수 있습니다.

| 목적 | 문서 |
| --- | --- |
| 프로젝트 범위 이해 | [프로젝트 개요](docs/00-overview/project-overview.md) |
| 로컬 실행 준비 | [개발 환경](docs/01-getting-started/development-environment.md), [실행과 운영](docs/01-getting-started/run-and-operations.md) |
| 구현 구조 파악 | [아키텍처](docs/02-architecture/system-architecture.md), [데이터 흐름](docs/02-architecture/data-flow.md) |
| 계약 확인 | [DB 스키마](docs/05-database/schema-and-erd.md), [API 레퍼런스](docs/06-api/api-reference.md) |
| 모델과 검색 이해 | [AI 모델링](docs/07-ai-modeling/README.md) |
| 운영·검증 | [배포](docs/09-deployment/deployment.md), [검증과 한계](docs/10-quality/verification-and-limitations.md) |

## 원본 저장소

[SKN26-Final-1st/Final_project](https://github.com/SKN26-Final-1st/Final_project)
