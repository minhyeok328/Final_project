# 프론트엔드

React 19·TypeScript·Vite로 구성된 SPA입니다. [App](../../frontend/src/App.tsx)이 인증·라우팅·테마를 연결하고 페이지 hook이 서버 데이터와 선택 상태를 관리합니다.

## 구현을 읽는 순서

1. [개요](overview.md): 시작점과 컴포넌트 경계
2. [페이지와 라우트](pages-and-routes.md): 인증 모드와 화면 진입
3. [상태와 API 어댑터](state-and-api-adapters.md): 캐시·응답 검증·요청 수명주기
4. [디자인 시스템](design-system.md): 토큰·레이아웃·반응형 CSS

API 모델을 화면에 직접 렌더링하지 않고 Zod 검증과 adapter 변환을 거칩니다. UI의 버튼 제한과 백엔드 권한은 별도이므로 [인증 문서](../04-backend/auth-and-permissions.md)를 함께 읽습니다.

실행은 [실행과 운영](../01-getting-started/run-and-operations.md), 검증은 [품질 문서](../10-quality/verification-and-limitations.md)와 [수동 검증](../10-quality/manual-acceptance.md)을 참고합니다.
