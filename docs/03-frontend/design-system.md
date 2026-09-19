# 디자인 시스템

시각 기준은 [foundation.css](../../frontend/src/styles/foundation.css), [themeTokens](../../frontend/src/data/themeTokens.ts), [Ant Design 테마](../../frontend/src/data/appThemeConfig.ts)에서 관리합니다. 이 페이지는 구현 위치와 변경 시 확인할 계약을 설명합니다.

## 토큰

| 계열 | 대표 토큰 | 용도 |
| --- | --- | --- |
| 동작·상태 색상 | `--primary`, `--accent`, `--warning`, `--danger` | 선택·보조 강조·대기·실패 |
| 표면과 글자 | `--bg`, `--surface`, `--text`, `--muted`, `--border` | 앱 배경·카드·정보 위계 |
| 깊이와 반경 | `--shadow-sm`, `--shadow`, `--radius`, `--radius-lg` | 카드·팝오버·패널 |
| 배치 | `--layout-gap`, `--content-max`, `--sidebar-width` | 여백·최대 폭·사이드바 |

색상을 바꿀 때 CSS 변수뿐 아니라 Ant Design token과 [차트 테마](../../frontend/src/components/charts/chartTheme.ts)를 함께 확인합니다. light/dark는 같은 의미의 토큰을 서로 다른 값으로 적용합니다.

## 스타일 적용 순서

[index.css](../../frontend/src/styles/index.css)는 foundation, layout, common, 도메인별 스타일, responsive, shared, overrides, jd-chat, shared-responsive 순서로 import합니다. 뒤 파일의 selector가 앞의 선언을 덮을 수 있으므로 최종 계산 스타일을 확인해야 합니다.

[layout.css](../../frontend/src/styles/layout.css)는 AppShell과 내부 스크롤, [responsive.css](../../frontend/src/styles/responsive.css)는 주요 화면 전환, [shared-responsive.css](../../frontend/src/styles/shared-responsive.css)는 공유 화면의 작은 폭 대응을 담당합니다.

## 컴포넌트와 레이아웃

`PageTitle`, `SectionCard`, 상태 UI, `FloatingAlert`를 공통으로 사용합니다. 목록·편집 영역은 도메인 패널로 나누고, 주요 보호 화면의 `viewport-page`와 내부 스크롤을 유지합니다. 채팅 FAB와 공유 화면은 각각의 CSS 및 컴포넌트에서 크기·스크롤을 관리합니다.

주요 breakpoint는 1399·1199·991·767·420px 계열입니다. 991px 이하에서는 사이드바 대신 모바일 헤더·Drawer를 사용합니다. CSS 규칙의 존재만으로 모든 화면에서 넘침이 없다고 단정하지 않습니다.

## 변경 후 확인

버튼의 loading·disabled, 입력 오류, 빈 데이터, 긴 한국어 문자열, light/dark, 키보드 focus, 모바일 터치 영역을 확인합니다. 아이콘 버튼의 접근 가능한 이름, 선택 상태, dialog 닫기와 스크롤 복귀도 함께 봅니다.

[뷰포트 검증 스크립트](../../frontend/scripts/verify-viewport-layout.mjs)는 여러 데스크톱 크기와 390×844 화면을 다룹니다. [문서 채팅 검증](../../frontend/scripts/verify-document-chat-widget.mjs)은 FAB·패널·스크롤을 검사합니다. 실제 검사 범위와 미확인 영역은 [품질 문서](../10-quality/verification-and-limitations.md)를 기준으로 기록합니다.
