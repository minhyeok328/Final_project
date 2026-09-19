# 프론트엔드 구성

## 시작점

[main.tsx](../../frontend/src/main.tsx)는 Error Boundary, Query Provider, BrowserRouter를 연결합니다. [App.tsx](../../frontend/src/App.tsx)는 인증 확인, 보호 라우트, 테마와 전역 알림·문서 채팅을 구성합니다.

[package.json](../../frontend/package.json)의 주요 UI 의존성은 React, React Router, Ant Design, Ant Design X, ECharts입니다. 서버 상태는 TanStack Query, 전송은 Axios, 런타임 응답 검증은 Zod가 담당합니다.

## 구성 경계

| 위치 | 책임 |
| --- | --- |
| `pages/` | 라우트별 화면과 사용자 동작 연결 |
| `components/layout/` | AppShell, SidebarNav, 인증 레이아웃 |
| `components/common/` | 제목, 카드, 오류·빈 상태, 알림 |
| `components/chat/` | FAB, 채팅 창, 참조 데이터·추천 질문 |
| `components/charts/` | ECharts 래퍼와 테마 |
| 도메인별 components | 회사·JD·지원서·리포트·관리자 폼과 패널 |
| `hooks/` | 페이지 데이터, 선택, 인증, 채팅 상태 |
| `hooks/mutations/` | 저장·삭제·분석 요청과 캐시 갱신 |
| `api/` | 전송, 계약, 조합 조회, 화면 모델 변환 |
| `styles/` | 토큰·공통·도메인·반응형 스타일 |

공개 API 진입점 [backendClient](../../frontend/src/api/backendClient.ts)는 도메인 client를 합칩니다. endpoint 구현은 [clients](../../frontend/src/api/clients/), 화면 변환은 [adapters](../../frontend/src/api/adapters/)에서 찾습니다.

## 데이터·오류 처리

일반 실행에는 Django가 필요합니다. MSW는 [테스트 설정](../../frontend/src/test/server.ts)에 사용되며 제품의 mock 모드와 다릅니다. 스키마 오류·서버 오류·인증 만료는 [httpClient](../../frontend/src/api/httpClient.ts), [backendSchemas](../../frontend/src/api/backendSchemas.ts), 인증 hook에서 처리합니다.

라우트별 권한과 숨긴 기능은 [페이지와 라우트](pages-and-routes.md), 캐시 세부 사항은 [상태와 API](state-and-api-adapters.md)에 정리되어 있습니다.
