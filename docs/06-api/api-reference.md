# API 레퍼런스

기준은 [URL 목록](../../backend/api/urls.py)과 [도메인 view](../../backend/api/views/)입니다. prefix는 `/api/`이며 아래 표의 경로는 prefix를 생략합니다. `ping`, `csrf` 외 업무 API는 POST JSON입니다.

## 공통 계약

성공 데이터는 주로 `{error:false,data:...}`로 반환하지만 인증 API는 `login`, `signin`, `valid` 같은 별도 필드를 사용합니다. view가 반환하는 실패는 `{error:true,message:...}`이며 일부 인증 실패는 HTTP 200으로 반환됩니다. CSRF middleware가 거부하는 403은 HTML 등 비JSON 응답일 수 있습니다. 클라이언트는 HTTP 상태와 `error`를 모두 확인해야 합니다.

세션은 쿠키, 키는 `X-API-Key` 헤더로 전달합니다. POST의 CSRF 쿠키·`X-CSRFToken` 처리도 필요합니다. 키 인증은 일부 endpoint에만 적용됩니다. `K`는 API Key 필수, `S`는 세션 필수, `S/K`는 세션 또는 API Key, `-`는 로그인 불필요입니다.

## 상태·인증·계정

| 경로 | 인증 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| `ping/` GET | - | 없음 | `{ok:true}` |
| `csrf/` GET | - | 없음 | CSRF 쿠키, `{error:false,message}` |
| `signin/` | - | `username`, `password`, `name`, `verification_question`, `verification_answer` | `{error:false,signin:true}` |
| `login/` | - | `username`, `password` | 세션 쿠키, `{error:false,login:true}` |
| `logout/` | S | 없음 | `{error:false,logout:true}` |
| `checkuser/` | - | `username` | `{error:false,valid}` |
| `passqestion/` | - | `username` | `{error:false,verification_question}` |
| `passreset/` | - | `username`, `verification_answer` 또는 `answer` | `{error:false,password}` |
| `account/get/` | S | 없음 | `data:Account` |
| `account/modify/` | S | 변경 필드 또는 `delete:true` | `{error:false}`, 탈퇴 시 `delete:true` |

비밀번호 변경은 `password`와 현재 비밀번호 `formal_password`가 필요합니다. 계정 수정에서 `id`, `username`, `account_hash`는 금지합니다. 나머지 모델 필드의 폭넓은 수정 허용과 복구 응답의 비밀번호 반환은 [권한 제약](../04-backend/auth-and-permissions.md)을 확인합니다.

## 회사·API Key

| 경로 | 인증 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| `compinfo/get/` | S | 없음 | `data:CompanyInfo`, 없으면 생성 |
| `compinfo/modify/` | S | 회사 수정 필드 | `{error:false}` |
| `authkey/add/` | S | `name`, 선택 `description`, `credit_limit`, `authorized_resume` | `data:AuthKey`, 전체 키 포함 |
| `authkey/get/` | S | 없음 | `data:AuthKey[]`, 키 마스킹 |
| `authkey/modify/` | S | `id`, 변경 필드 또는 `delete:true` | `{error:false}` |
| `authkey/credit/` | K | 없음 | `data:{credit:number}` |

키 발급·증액·감액·삭제는 계정과 키 사이 크레딧 이동을 수반합니다. 허용 지원서 목록은 중복 ID·소유권을 검사합니다.

## JD·체크리스트

| 경로 | 인증 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| `jd/add/` | S | `job_name`, `career_level`, `required_skill`, 선택 JD 필드 | `data:JobDescription` |
| `jd/get/` | S/K | 없음 | `data:JobDescription[]` |
| `jd/modify/` | S/K | `id`, 변경 필드, `delete:true` 또는 `refresh_fail:true` | `data:JobDescription` |
| `jd/analyze/` | S/K | `id`, 선택 `query`, `cnt` | `data:JobDescription` |
| `checklist/add/` | S | `job_description_id`, `content` | `data:Checklist` |
| `checklist/get/` | S/K | `job_description_id` | `data:Checklist[]` |
| `checklist/modify/` | S/K | `id`, 변경 필드 또는 `delete:true` | `data:Checklist` |

`jd/add`는 `job_name`만 선검사하지만 생성 시 `career_level`, `required_skill`도 직접 참조하므로 세 필드를 모두 전달합니다. 상태는 `prepare`, `on_going`, `closed`입니다. JD 조회는 별도 id 필터 API가 아니라 접근 가능한 목록을 반환합니다.

`jd/analyze`의 응답에는 `checklist_status`가 있습니다. 대기·처리 중 재요청을 거부하며 큐 등록 실패 시 `error:false` 안에 `fail` 상태를 반환할 수 있습니다. 체크리스트 조회는 JD가 접근 범위에 없으면 빈 배열을 반환합니다.

## 지원서·리포트

| 경로 | 인증 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| `resume/add/` | S | `job_description_id`, 지원서 필드 | `data:Resume` |
| `resume/get/` | S/K | 선택 `job_description_id`, `id` 또는 id 배열 | `data:Resume[]` |
| `resume/modify/` | S/K | `id`, 변경 필드 또는 `delete:true` | `data:Resume` |
| `resume/analyze/` | S/K | `id` | `data:AnalysisReport` |
| `report/get/` | S/K | `id` 또는 `resume_id` | `data:AnalysisReport[]` |
| `report/modify/` | S/K | `id`, 변경 필드 또는 `delete:true` | `data:AnalysisReport` |

리포트 단건 조회도 배열이며 `id`가 우선합니다. 면접 질문은 `interview_question`에 포함됩니다. 별도 `question/*` URL은 없습니다. 지원서 자기소개 필드는 `self_intoduction`입니다. 지원서의 연결 JD 변경은 금지합니다.

리포트 `processing` 상태는 수정·삭제할 수 없습니다. `status`, `version`, 연결 지원서 필드는 직접 수정하지 못합니다. 분석 요청은 차감과 새 리포트 생성을 수반하므로 단순 조회처럼 재전송하지 않습니다. 서버의 중복 분석 차단은 구현되어 있지 않습니다.

예시 요청은 실제 키·개인정보를 포함하지 않습니다.

```json
{"id": 1}
```

위 body를 `resume/analyze/`에 보내면 지원서 1을 분석하고, `report/get/`에 보내면 리포트 1을 조회합니다. ID의 도메인이 다르므로 URL과 함께 해석해야 합니다.

## 채팅

| 경로 | 인증 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| `chat/` | S/K | `chat:[{role,message}]` | `{error:false,response:{role:"agent",message}}` |
| `jd_chat/` | S/K | `job_description_id`, `chat`, 선택 `state` | `{error:false,response,state}` |

메시지 `role`은 `user` 또는 `agent`, `message`는 문자열입니다. JD 채팅은 입력 `state`의 `ignored_field`, `focus_field`를 복원합니다. 응답 `state`에는 `end_chat`도 포함되며 추출된 허용 필드를 회사·JD에 즉시 반영합니다. 조회 전용 대화가 아닙니다.

## 오류 해석

[error_code.py](../../backend/api/views/error_code.py)의 400~408·500은 메시지 내부 코드입니다. HTTP 상태와 동일하다고 가정하지 않습니다. 401은 필수 필드 누락, 402는 입력 오류, 403은 인증 필요, 407은 허용하지 않는 동작, 408은 크레딧 부족을 뜻합니다. 프론트 [httpClient](../../frontend/src/api/httpClient.ts)가 이를 사용자 오류로 정규화합니다.

필드 전체는 [모델](../../backend/api/models.py), 요청 타입은 [clientContracts](../../frontend/src/api/clients/clientContracts.ts), 응답 파싱은 [backendSchemas](../../frontend/src/api/backendSchemas.ts)를 함께 확인합니다.
