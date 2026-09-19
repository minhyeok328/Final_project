# 페이지와 라우트

라우트 선언은 [appConfig](../../frontend/src/data/appConfig.tsx), 경로 해석은 [routes](../../frontend/src/utils/routes.ts), 렌더링은 [App](../../frontend/src/App.tsx)과 [ProtectedRouteContent](../../frontend/src/components/routing/ProtectedRouteContent.tsx)가 담당합니다.

| 경로 | 화면 | 접근 |
| --- | --- | --- |
| `/login`, `/signup`, `/password-reset` | 로그인·가입·복구 | 공개 |
| `/dashboard` | 채용 현황 | 계정 |
| `/company` | 회사 프로필 | 계정 |
| `/admin` | API Key·크레딧 관리 | 계정 |
| `/mypage` | 프로필·비밀번호·탈퇴 | 계정 |
| `/jd` | JD·체크리스트 | 계정 또는 API Key |
| `/cover-letter` | 지원서 편집·분석 | 계정 또는 API Key |
| `/analysis-report` | 리포트·질문·메모 | 계정 또는 API Key |
| `/chat` | 문서·HR 채팅 | 계정 |
| `/shared` | 키 입력 기반 공유 조회 | 페이지 공개, 데이터에 키 필요 |
| `/recruitment-post` | 공고 미리보기 | 계정, 메뉴 숨김 |
| `/cover-letter-template` | 문항 가이드 미리보기 | 계정, 메뉴 숨김 |

## 인증 모드

계정 모드는 Django 쿠키로 확인합니다. API Key 모드는 [sessionStorage 유틸리티](../../frontend/src/utils/apiKeySession.ts)를 사용하며 `/jd`, `/cover-letter`, `/analysis-report`로 접근을 제한합니다. [capabilities](../../frontend/src/utils/authCapabilities.ts)는 화면 동작 허용 범위를 분리합니다. 화면의 권한 제한만으로 서버 권한을 대체하지 않습니다.

`/shared`는 일반 AppShell과 별도의 화면이며 `resumeId` 또는 `resume_id` 쿼리로 대상 ID를 받을 수 있습니다. 키는 사용자 입력으로 받습니다. 지원서 ID만으로 리포트 데이터가 공개되는 구조가 아닙니다.

## 선택과 레이아웃

리포트 선택은 `reportId` 쿼리를 우선하고 기존 `resumeId`도 처리합니다. 페이지별 선택 상태는 전용 hook에서 관리합니다. 미지정 경로는 대시보드 경로를 거쳐 인증 가드의 적용을 받습니다.

주요 업무 화면은 AppShell과 내부 스크롤을 사용하고 작은 화면에서 사이드바를 헤더·Drawer로 전환합니다. 숨긴 두 미리보기 화면은 `visibleInNav:false`, `mvpStatus:'planned'`이며 생성·다운로드가 활성화된 기능이 아닙니다.
