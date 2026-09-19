# 공유 리포트

[/shared 화면](../../frontend/src/pages/SharedReportPage.tsx)은 계정 로그인 없이 열 수 있지만 실제 데이터는 입력한 API Key로 조회합니다. URL에는 `resumeId` 또는 `resume_id`를 지정할 수 있으며 키 자체를 쿼리로 전달하는 계약은 아닙니다.

## 조회 흐름

1. 키와 대상 지원서 ID를 입력합니다.
2. [getSharedResumeBundle](../../frontend/src/api/clients/chatClient.ts)이 `resume/get`으로 지원서를 확인합니다.
3. `jd/get`, `report/get`을 조회해 JD·리포트·질문 묶음을 만듭니다.
4. 화면에서 리포트와 질문을 검토하고 해당 문맥으로 채팅합니다.

질문은 리포트의 `interview_question`에서 추출합니다. 키의 `authorized_resume`에 대상 지원서가 있어야 합니다. 키 자체는 다른 API의 수정·분석에도 사용 가능한 권한일 수 있으므로 이 화면의 조회 중심 UI와 토큰 전체 권한은 구분합니다.

## 상태와 오류

[useSharedReportSession](../../frontend/src/hooks/useSharedReportSession.ts)은 요청 취소와 이전 응답 배제, 로컬 인증 실패를 다룹니다. 공유 키 오류를 일반 계정 세션의 전역 로그아웃과 동일하게 처리하지 않습니다.

허용되지 않은 지원서, 삭제된 지원서, 리포트가 없는 지원서, 만료되거나 삭제된 키를 각각 확인합니다. 세션 쿠키가 있는 경우 서버가 세션을 우선하는 view가 있으므로 비로그인 브라우저에서도 확인합니다.

[공유 화면 테스트](../../frontend/src/pages/SharedReportPage.test.tsx)와 [검증 스크립트](../../frontend/scripts/verify-shared-route.mjs)는 화면 계약 확인용입니다. 모든 키 권한의 서버 검증을 대신하지는 않습니다.
