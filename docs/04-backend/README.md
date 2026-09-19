# 백엔드

Django의 `api` 앱이 계정·채용 데이터를 관리하고 `common` 모듈이 LLM 그래프를 실행합니다. [URL 목록](../../backend/api/urls.py), [모델](../../backend/api/models.py), [작업](../../backend/api/tasks.py)이 주요 진입점입니다.

## 문서

- [모듈 구성](modules.md): 설정·view·공통 그래프·migration
- [인증과 권한](auth-and-permissions.md): 세션, API Key, 입력 필드 경계
- [분석 파이프라인](analysis-pipeline.md): 작업 상태, 크레딧, 저장·실패 처리
- [API 레퍼런스](../06-api/api-reference.md): 실제 요청·응답 계약
- [DB 스키마](../05-database/schema-and-erd.md): 관계와 직렬화

지원서 분석과 JD 체크리스트 생성은 Celery task와 동기 경로를 공유합니다. worker 가용성 캐시와 긴 동기 요청의 제약은 [실행과 운영](../01-getting-started/run-and-operations.md)에 있습니다.
