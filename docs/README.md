# HumouR 개발 문서

[프로젝트 소개](../README.md) · [원본 저장소](https://github.com/SKN26-Final-1st/Final_project)

현재 저장소의 코드·설정·포함 자료를 기준으로 개발에 필요한 구조와 실행 조건을 설명합니다.

## 문서 구성

| 구분 | 문서 | 내용 |
| --- | --- | --- |
| 00. 개요 | [프로젝트 개요](00-overview/project-overview.md) | 목적·기능 범위·구현 경계 |
| 01. 개발 환경과 실행 | [개발 환경](01-getting-started/development-environment.md) | 런타임·의존성·환경변수·준비 자료 |
| 01. 개발 환경과 실행 | [실행과 운영](01-getting-started/run-and-operations.md) | 실행 순서·초기 데이터·장애 확인 |
| 02. 아키텍처 | [시스템 구조](02-architecture/system-architecture.md) | 구성 요소·의존성·처리 경계 |
| 02. 아키텍처 | [디렉터리 구조](02-architecture/directory-structure.md) | 주요 파일과 수정 위치 |
| 02. 아키텍처 | [데이터 흐름](02-architecture/data-flow.md) | 입력·가공·저장·조회 흐름 |
| 03. 프런트엔드 | [화면과 상태](03-frontend/README.md) | 화면 구성·사용자 입력·상태 관리 |
| 04. 백엔드 | [처리 모듈](04-backend/README.md) | 서버 또는 프로세스 내부 처리 |
| 05. 데이터 | [스키마와 관계](05-database/schema-and-erd.md) | 테이블·필드·관계·데이터 조건 |
| 06. API | [인터페이스](06-api/api-reference.md) | HTTP 또는 Python 호출 계약 |
| 07. AI·모델링 | [모델과 처리 규칙](07-ai-modeling/README.md) | 계산식·학습 모델·검색·생성 중 구현된 방식 |
| 08. 기능 | [기능 명세](08-features/README.md) | 입력·처리·결과·예외 |
| 09. 배포 | [배포와 운영 조건](09-deployment/deployment.md) | 제공 구성·외부 자원·운영 제약 |
| 10. 품질 | [검증과 한계](10-quality/verification-and-limitations.md) | 검증 절차·평가 범위·알려진 한계 |

## 읽는 순서

1. 프로젝트 개요에서 목적과 구현 범위를 확인합니다.
2. 개발 환경과 실행 문서에서 의존성·설정·데이터 준비 조건을 확인합니다.
3. 시스템 구조와 데이터 흐름을 읽고 변경할 기능의 상세 문서로 이동합니다.
4. 데이터·인터페이스 계약을 대조한 뒤 검증 방법과 배포 조건을 확인합니다.

## 프로젝트별 상세 문서

- 개요: [현재 구현 범위](00-overview/current-implementation-status.md)
- 프런트엔드: [디자인 시스템](03-frontend/design-system.md), [프론트엔드 구성](03-frontend/overview.md), [페이지와 라우트](03-frontend/pages-and-routes.md), [상태와 API 어댑터](03-frontend/state-and-api-adapters.md)
- 백엔드: [분석 작업과 저장](04-backend/analysis-pipeline.md), [인증과 권한](04-backend/auth-and-permissions.md), [백엔드 모듈](04-backend/modules.md)
- 데이터: [데이터 수집과 임베딩](05-database/data-collection-and-embedding.md)
- API: [프론트 API ID 매핑](06-api/frontend-api-id-map.md)
- AI·모델링: [모델 파이프라인](07-ai-modeling/model-pipeline.md), [오프라인 모델 평가](07-ai-modeling/offline-evaluation.md), [검색과 저장소](07-ai-modeling/retrieval-and-storage.md)
- 기능: [관리자와 계정](08-features/admin-and-account.md), [문서 검색 채팅](08-features/document-chat.md), [채용 운영 워크스페이스](08-features/recruiting-workspace.md), [지원서 분석](08-features/resume-analysis.md), [공유 리포트](08-features/shared-report.md)
- 품질: [수동 기능 검증](10-quality/manual-acceptance.md)
- 기존 문서 경로: [문서 개편 작업 참고 기록](superpowers/plans/2026-07-14-readme-evaluator.md), [문서 구조 변경 참고 기록](superpowers/specs/2026-07-14-readme-evaluator-design.md)
- 프런트 실행 안내: [frontend README](../frontend/README.md)
- 별도 산출물: [인터페이스 정의서](../outputs/interface-definition/HumouR_인터페이스정의서.xlsx). 요청 필드·권한·상태는 현재 코드와 API 문서를 함께 확인합니다.

## 문서 기준

- 프로젝트에 실제로 있는 기능과 처리 방식을 설명합니다. 별도 서버나 AI 모델이 없는 경우 해당 문서에서 내부 함수·계산 규칙을 안내합니다.
- 실행 명령은 문서에 적힌 작업 디렉터리에서 수행합니다. 환경변수는 이름과 용도를 설명하며 인증정보 값은 기록하지 않습니다.
- 소스·설정·테스트 파일의 존재와 실행 성공은 구분합니다. 과거 평가 수치는 해당 데이터와 측정 조건 안에서 해석합니다.
- 기능·스키마·설정을 바꾸면 연결된 문서와 검증 항목을 함께 갱신합니다.
