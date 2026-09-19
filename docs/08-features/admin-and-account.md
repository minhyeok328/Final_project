# 관리자와 계정

## API Key 관리

[AdminPage](../../frontend/src/pages/AdminPage.tsx)는 계정의 JD·지원서·크레딧 현황과 키 생성·수정·삭제를 제공합니다. 키에 허용할 지원서를 JD별로 고르고 잔여 `credit_limit`을 조정합니다.

[auth_key_endpoints](../../backend/api/views/auth_key_endpoints.py)는 발급·증액 시 계정 크레딧을 차감하고 감액·삭제 시 반환합니다. 목록은 마스킹된 키를 제공하며 전체 키는 발급 직후 화면 상태로 표시합니다.

## 크레딧과 구독

현재 관리자 화면의 충전은 `saveAccount({credit:현재값+amount})`, 구독은 `subscribe`와 한 달 뒤 `subscribe_expiration`을 저장합니다. [mutation](../../frontend/src/hooks/mutations/useAdminMutations.ts)은 계정 수정 API를 호출합니다.

결제 승인·정산·사용 이력 원장과 연결되지 않습니다. 따라서 해당 UI를 상용 결제나 관리자 전용 과금 제어로 해석하지 않습니다. 서버 계정 수정 필드의 제약은 [인증과 권한](../04-backend/auth-and-permissions.md)에 있습니다.

## 프로필과 비밀번호

[MyPage](../../frontend/src/pages/MyPage.tsx)는 이름·확인 질문, 현재/새 비밀번호 입력, 회사 요약과 계정 삭제를 제공합니다. 새 비밀번호는 `formal_password` 검증 뒤 저장하고 프론트가 다시 로그인해 세션을 갱신합니다.

가입은 [SignupPage](../../frontend/src/pages/auth/SignupPage.tsx), 세션/API Key 진입은 [LoginPage](../../frontend/src/pages/auth/LoginPage.tsx), 질문 기반 복구는 [PasswordResetPage](../../frontend/src/pages/auth/PasswordResetPage.tsx)에 있습니다. 가입 완료 후 자동 로그인되는 계약은 아닙니다.

복구 API가 비밀번호를 응답으로 반환하는 점과 계정 삭제의 하위 데이터 CASCADE는 실제 계약입니다. 수동 검증에는 테스트 계정을 사용하고 삭제 대상을 확인합니다.
