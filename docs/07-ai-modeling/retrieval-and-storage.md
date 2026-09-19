# 검색과 저장소

## 두 가지 벡터 검색

| 용도 | namespace | metadata | 조회 방식 |
| --- | --- | --- | --- |
| JD 필수 조건 | `qualify_conditions` | `condition` | 요청 수의 3/5를 올림 |
| JD 우대 조건 | `preffered_conditions` | `condition` | 나머지 개수 |
| 서비스 사용 설명서 | `user_manual` | `content` | 기본 top_k 2 |

`preffered_conditions`는 실제 코드 철자입니다. [checklist_agent](../../backend/common/checklist_agent.py)와 [chat_agent](../../backend/common/chat_agent.py)는 OpenAI `text-embedding-3-small`로 쿼리를 만들고 `PINECONE_API_KEY`, `PINECONE_HOST`로 인덱스에 접근합니다.

## JD 체크리스트

[checklist_graph](../../backend/common/checklist_graph.py)는 회사·JD와 사용자 지시로 검색 쿼리를 만들고 참고 조건을 가져옵니다. 기본 목표는 10개이며 실제 생성 요청 수는 task가 결정합니다. 검색 결과와 입력을 마스킹한 뒤 항목을 생성·복원해 DB의 Checklist로 저장합니다.

조건 임베딩을 올리는 [노트북](../../data-pipeline/crawling/pinecone/upload_query_to_pinecone_colab.ipynb)의 namespace·벡터 차원·metadata를 런타임과 맞춰야 합니다. 현재 원격 인덱스 개수는 저장된 노트북 출력만으로 판단하지 않습니다.

## 매뉴얼 RAG와 업무 데이터

매뉴얼 RAG는 Pinecone에서 문서 내용을 가져옵니다. HR 업무 검색은 [권한 helper](../../backend/api/views/utils.py)와 ORM 필터로 회사·JD·지원서·리포트를 조회합니다. 모든 업무 데이터가 벡터 DB에 적재되는 구조가 아닙니다.

매뉴얼 적재는 `PINECONE_NAMESPACE`를 바꿀 수 있지만 런타임 검색은 `user_manual`로 고정되어 있습니다. 적재 namespace만 변경하면 검색되지 않습니다. [데이터 준비](../05-database/data-collection-and-embedding.md)에서 입력 CSV와 BLOB 형식을 확인합니다.

## 실패 경계

API 키·host 오류, 누락 metadata, 임베딩·인덱스 차원 불일치, 빈 namespace는 각각 호출 실패 또는 근거 부족으로 이어집니다. 검색 결과가 있다고 답변의 사실성이 보장되는 것은 아니며, 독립된 평가 데이터의 결과는 [오프라인 평가](offline-evaluation.md)와 구분해 읽습니다.
