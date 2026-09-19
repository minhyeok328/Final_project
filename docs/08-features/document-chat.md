# 문서 검색 채팅

## 화면과 상태

[ChatPage](../../frontend/src/pages/ChatPage.tsx)와 [DocumentChatFab](../../frontend/src/components/chat/DocumentChatFab.tsx)은 [useDocumentChatState](../../frontend/src/hooks/useDocumentChatState.ts)의 대화 상태를 공유합니다. 페이지를 옮겨도 Provider가 유지되는 동안 대화가 이어지며 서버의 영구 대화 테이블에 저장하는 구조는 아닙니다.

JD·리포트·질문 참조 자료와 추천 질문은 [chatContextData](../../frontend/src/components/chat/chatContextData.tsx)가 조합합니다. FAB의 범위 선택은 화면 자료 필터이며 그 자체로 서버 권한을 바꾸지 않습니다.

## 요청 계약

[chatClient](../../frontend/src/api/clients/chatClient.ts)는 `{role,message}` 배열을 전송합니다. 프론트 `assistant`는 백엔드 `agent`로 변환합니다. [view](../../backend/api/views/chat_endpoints.py)는 배열·객체·role·문자열을 검사한 후 사용자의 접근 범위와 검색 함수를 그래프에 전달합니다.

[chat_graph](../../backend/common/chat_graph.py)는 의도를 분류해 HR 데이터와 앱 사용 설명서 분기로 보내고 결과를 합칩니다. [chat_agent](../../backend/common/chat_agent.py)의 `search_recruiting_data` tool은 구조화 필터로 업무 데이터를 조회하고, 매뉴얼 branch는 Pinecone `user_manual`의 문서를 사용합니다.

## 데이터 범위

HR 검색 결과는 DB의 회사·JD·지원서·리포트입니다. 이름에 `masked`가 있는 직렬화 함수만으로 실제 개인정보가 마스킹되었다고 가정하면 안 됩니다. [utils](../../backend/api/views/utils.py)의 필드 선택과 [분석 마스킹](../07-ai-modeling/model-pipeline.md)은 서로 다른 처리입니다.

API Key 공유 채팅은 허용 지원서 범위를 기반으로 동작합니다. 서버 검색 범위와 화면 참조 자료가 같은 제한을 적용하는지 별도 계정·키로 확인합니다.

## 오류와 확인

빈 메시지를 막고, 취소·초기화 후 이전 응답이 대화를 덮지 않도록 요청 수명을 관리합니다. 매뉴얼 검색에는 OpenAI·Pinecone 설정이 필요합니다. 일반 채팅의 의도 분류 성능과 실제 답변의 정확성은 구분합니다.

[FAB 검증 스크립트](../../frontend/scripts/verify-document-chat-widget.mjs)는 패널·스크롤·뷰포트를 확인합니다. 모델 호출을 포함하는 확인은 [품질 문서](../10-quality/verification-and-limitations.md)의 별도 조건을 따릅니다.
