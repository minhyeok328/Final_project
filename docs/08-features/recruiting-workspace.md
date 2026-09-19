# 채용 운영 워크스페이스

## 대시보드와 회사

[DashboardPage](../../frontend/src/pages/DashboardPage.tsx)는 JD·지원서·리포트·크레딧을 조합한 현황을 표시합니다. [dashboard adapter](../../frontend/src/api/adapters/dashboard.ts)의 계산값이며 별도 운영 통계 API가 아닙니다.

[CompanyPage](../../frontend/src/pages/CompanyPage.tsx)는 회사명·인원수·팀 구성·소개·채용 성향을 수정합니다. `compinfo/get`은 회사 정보가 없으면 생성하고 `compinfo/modify`가 변경 사항을 저장합니다.

## JD와 평가 기준

[JdPage](../../frontend/src/pages/JdPage.tsx)는 JD 생성·선택·수정·삭제를 제공합니다. `prepare`, `on_going`, `closed`가 직무 상태이며, 체크리스트 작업 상태는 별도 `checklist_status`입니다.

[JdChatDrawer](../../frontend/src/components/jd/JdChatDrawer.tsx)는 회사·JD의 누락 항목을 대화로 수집합니다. `jd_chat` 응답은 `ignored_field`, `focus_field`, `end_chat`을 포함합니다. 다음 호출에서 서버가 복원하는 입력 상태는 `ignored_field`와 `focus_field`입니다. 서버에서 허용 필드를 실제 DB에 반영하므로 대화를 마친 뒤 JD·회사 캐시를 새로 읽습니다.

체크리스트는 수동 CRUD와 `jd/analyze` 생성 요청을 함께 제공합니다. 생성은 외부 검색·모델을 사용하고 실패 시 `refresh_fail`을 통해 실패 상태를 초기화할 수 있습니다. 처리 중 작업의 중복 요청과 삭제 제한은 [백엔드 작업](../04-backend/analysis-pipeline.md)을 확인합니다.

## 공고 미리보기

[RecruitmentPostPage](../../frontend/src/pages/RecruitmentPostPage.tsx)는 선택 JD와 회사 데이터를 프론트에서 조합합니다. 메뉴에는 보이지 않지만 계정으로 직접 경로에 접근할 수 있습니다. 공고 생성·PDF 버튼은 비활성이며 서버의 문서 생성 API는 없습니다.

## 확인할 상황

빈 JD 목록, 필수 필드 누락, 빈 배열 저장, 생성 작업 실패, JD 삭제 후 선택 상태를 확인합니다. 같은 JD의 진행 상태와 평가 기준 변경은 지원서 분석의 입력에 영향을 줍니다.
