# 기능 안내

기능별 입력·저장·오류·화면 경계를 정리합니다. 실제 API 필드는 [API 레퍼런스](../06-api/api-reference.md), 재현 확인은 [수동 검증](../10-quality/manual-acceptance.md)을 참고합니다.

| 기능 | 문서 | 핵심 연결 |
| --- | --- | --- |
| 채용 관리 | [워크스페이스](recruiting-workspace.md) | 회사 → JD → 체크리스트 |
| 지원서 검토 | [지원서 분석](resume-analysis.md) | 지원서 → 작업 → 리포트·질문 |
| 후속 질의 | [문서 검색 채팅](document-chat.md) | ORM 검색 + 매뉴얼 RAG |
| 설정 | [관리자와 계정](admin-and-account.md) | 계정·크레딧·키 |
| 외부 조회 | [공유 리포트](shared-report.md) | 키 허용 지원서 조회 |

문서 생성·다운로드와 결제는 현재 연결된 기능으로 설명하지 않습니다. 화면별 제한은 [구현 범위](../00-overview/current-implementation-status.md)에 있습니다.
