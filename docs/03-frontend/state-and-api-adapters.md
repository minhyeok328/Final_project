# 상태와 API 어댑터

## 상태 소유 위치

| 상태 | 구현 |
| --- | --- |
| 인증 모드와 세션 수명 | [useAuthSession](../../frontend/src/hooks/useAuthSession.ts), [AuthSessionProvider](../../frontend/src/hooks/AuthSessionProvider.tsx) |
| 앱 서버 데이터 | [useAppDataQuery](../../frontend/src/hooks/useAppDataQuery.ts), [queryOptions](../../frontend/src/api/queryOptions.ts) |
| JD·지원서·리포트 선택 | `useJdPageData`, `useCoverLetterPageData`, `useAnalysisReportPageData` |
| 저장·삭제·분석 | [mutation hooks](../../frontend/src/hooks/mutations/) |
| FAB·전체 화면 대화 | [useDocumentChatState](../../frontend/src/hooks/useDocumentChatState.ts) |
| 공유 조회와 요청 취소 | [useSharedReportSession](../../frontend/src/hooks/useSharedReportSession.ts) |

인증 모드와 임의 세션 식별자를 query key에 포함합니다. API Key 원문을 캐시 이름에 포함하지 않습니다. mutation 성공 후 관련 데이터를 무효화하며 진행 중 분석이 있으면 3초마다 재조회합니다.

## API 경계

[httpClient](../../frontend/src/api/httpClient.ts)는 `/api` 기준 Axios, `withCredentials`, CSRF 쿠키 발급과 `X-CSRFToken`, 명시적인 `apiKey` 옵션을 처리합니다. HTTP 상태뿐 아니라 응답의 `error`도 검사합니다. 인증 만료를 감지하면 요청 중단과 세션 복구 흐름으로 연결합니다.

[도메인 client](../../frontend/src/api/clients/)는 요청 필드·경로를 지정하고 [Zod 스키마](../../frontend/src/api/backendSchemas.ts)로 결과를 파싱합니다. `getReportsForResumeRaw()`는 서버의 리포트 배열을 그대로 검증합니다. 형식 불일치를 빈 배열로 바꾸는 fallback으로 문서화하지 않습니다.

[dashboardSource](../../frontend/src/api/services/dashboardSource.ts)가 여러 도메인 응답을 합치고 [appDataService](../../frontend/src/api/appDataService.ts)가 adapter로 화면 모델을 조립합니다. API Key 모드의 계정·회사 표시값 중 일부는 제한 모드용 기본값이며 실제 계정 조회 응답이 아닙니다.

## 변환 규칙

- `self_intoduction`은 backend 실제 필드명입니다.
- 면접 질문은 `AnalysisReport.interview_question`에서 추출합니다. 별도 question API를 호출하지 않습니다.
- 클라이언트 메시지의 `assistant`는 전송 시 `agent`로 바꿉니다.
- 리포트 삭제는 `report/modify`에 `{id, delete:true}`를 보냅니다.
- `onqueue`/`processing`은 대기·작업 상태이며 `error:false`만으로 완료를 표시하지 않습니다.

## 경합과 오류

채팅·공유 hook에는 AbortController와 요청 식별자를 활용한 이전 응답 배제 흐름이 있습니다. 로그아웃·인증 전환 시 요청과 캐시를 정리합니다. 입력 내용과 선택 상태가 오류 후 유지되는지는 [수동 검증](../10-quality/manual-acceptance.md)과 해당 hook 테스트에서 확인합니다.
