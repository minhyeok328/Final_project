# 현재 구현 범위

이 페이지는 저장소 코드의 연결 상태를 설명합니다. 배포·외부 모델 가동 여부나 전체 기능의 실행 성공을 의미하지 않습니다.

## 연결된 기능

| 영역 | 구현 | 근거 |
| --- | --- | --- |
| 인증·계정 | 가입, 로그인, 질문 기반 복구, 프로필 변경·탈퇴 | [계정 view](../../backend/api/views/account_endpoints.py) |
| 회사·JD | CRUD, JD 대화형 필드 반영, 체크리스트 생성 | [JD view](../../backend/api/views/job_description_endpoints.py), [채팅 view](../../backend/api/views/chat_endpoints.py) |
| 지원서·리포트 | CRUD, 분석 작업, 질문·평가·메모 저장 | [지원서 view](../../backend/api/views/resume_endpoints.py), [작업](../../backend/api/tasks.py) |
| 공유 | 허용 지원서 목록, 키 크레딧, 공유 조회 | [AuthKey view](../../backend/api/views/auth_key_endpoints.py), [공유 화면](../../frontend/src/pages/SharedReportPage.tsx) |
| AI | 분석·체크리스트·채팅 LangGraph, RunPod handler | [AI 문서](../07-ai-modeling/README.md) |
| 배포 | EC2 대상 S3·SSM 워크플로 | [배포 구성](../../.github/workflows/deploy.yml) |

## 제한된 구현

- `/recruitment-post`, `/cover-letter-template`는 메뉴에서 숨긴 미리보기입니다. 생성·다운로드 API가 없습니다.
- 관리자 크레딧 충전·구독 연장은 `account/modify`로 값을 변경합니다. 결제 승인·정산·사용량 원장과 연결되지 않습니다.
- 조직·멤버 권한과 면접방을 관리하는 별도 데이터 모델은 없습니다.
- 일반 개발 화면은 Django API를 사용합니다. `.env.example`의 `VITE_USE_MOCK_API`는 현재 코드에서 읽지 않습니다.

## 개발 시 주의할 차이

- 지원서 분석 API에는 기존 처리 중 리포트의 중복 요청 차단이나 체크리스트 존재 선검증이 없습니다. 화면의 차단 로직을 서버 보장으로 해석하면 안 됩니다.
- 큐 등록 실패는 `error:false`와 `status:fail`을 함께 반환할 수 있습니다. 성공 envelope와 작업 완료를 구분합니다.
- 리포트 조회는 단건 ID로 조회해도 배열입니다. 현재 프론트는 `getReportsForResumeRaw()`에서 Zod로 배열을 파싱합니다.
- API Key는 조회뿐 아니라 일부 수정·삭제·분석 API도 허용합니다. 읽기 전용 토큰이 아닙니다.
- 모델·인덱스·원격 서버는 저장소 밖의 자원입니다. 현재 접근 가능 여부는 이 문서 작업에서 확인하지 않았습니다.

상세 제약과 검증 절차는 [검증과 한계](../10-quality/verification-and-limitations.md)에 있습니다.
