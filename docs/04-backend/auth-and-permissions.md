# 인증과 권한

## 세션과 CSRF

Django 로그인은 세션 쿠키를 발급합니다. [csrf_token](../../backend/api/views/account_endpoints.py)은 CSRF 쿠키를 만들고 프론트 [httpClient](../../frontend/src/api/httpClient.ts)는 POST 전 쿠키를 확보해 헤더로 전달합니다. API Key가 있는 POST도 CSRF middleware를 우회하는 별도 설정은 없습니다.

회사·키 관리, JD·지원서·체크리스트 추가는 계정 세션을 요구합니다. 공유·제한 모드에서 사용할 수 있는 API는 [API 표](../06-api/api-reference.md)의 인증 열을 확인합니다.

## API Key

[AuthKey](../../backend/api/models.py)는 소유 계정, 키 값, 잔여 `credit_limit`, `authorized_resume` ID 배열을 저장합니다. 발급 응답은 전체 키를 제공하고 목록 API는 마스킹합니다. 발급·증액은 계정 크레딧을 키로 옮기고 감액·삭제는 잔여분을 돌려줍니다.

[권한 helper](../../backend/api/views/utils.py)는 키에 허용된 지원서가 연결된 JD를 고릅니다. 지원서·리포트 view는 키 소유 계정과 허용 ID를 확인합니다. 키는 읽기 전용이 아니며 접근 가능한 JD·지원서·리포트의 일부 수정·삭제·분석에도 사용됩니다.

세션과 키가 함께 전달되면 여러 view는 `request.user.is_authenticated`를 먼저 확인합니다. 공유 권한을 시험할 때 로그인 쿠키가 없는 별도 브라우저 컨텍스트도 확인해야 합니다.

## 필드 경계

[columns.py](../../backend/api/views/columns.py)는 소유 관계·상태·버전 등의 수정을 제한합니다. 지원서의 연결 JD 변경도 금지합니다. 다만 계정 수정은 허용 목록이 아니라 모델 필드에서 일부 차단 항목을 빼는 구조입니다.

현재 `ACCOUNT_BLOCKED_FIELDS`는 `id`, `username`, `account_hash`뿐입니다. `account_modify`가 `AbstractUser`의 권한 필드와 `credit`, `subscribe`, `subscribe_expiration` 등을 별도 관리자 권한 없이 수정 가능한 필드로 계산한다는 점은 운영 제약입니다. 화면이 해당 입력을 숨긴다고 서버 권한이 제한되지는 않습니다.

## 저장과 복구의 제약

- `AuthKey.value`는 DB에 원문으로 저장됩니다. 목록 마스킹은 저장 시 암호화나 해시 처리가 아닙니다.
- `Account.to_dict()`는 확인 답변과 계정 해시를 응답에 포함합니다. 프론트에서 사용하지 않는다고 네트워크 비노출이 보장되지는 않습니다.
- 질문 기반 비밀번호 복구는 새 비밀번호를 응답으로 직접 반환합니다.
- 로컬 상세 오류 노출은 `DJANGO_DEBUG`가 아니라 `IS_REMOTE_HOST`의 존재 여부로 결정됩니다.

이 문서는 현재 계약을 설명합니다. 운영 접근제어와 민감 응답 필드 검증 항목은 [검증과 한계](../10-quality/verification-and-limitations.md)에 정리되어 있습니다.
