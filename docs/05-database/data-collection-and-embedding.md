# 데이터 수집과 임베딩

이 영역은 서비스 DB migration과 분리된 오프라인 데이터 준비 코드입니다. 웹을 시작해도 수집·임베딩·Pinecone 적재가 자동으로 실행되지 않습니다.

## 채용 조건 수집

[crawling](../../data-pipeline/crawling/)에는 Catch, JobKorea, Jobplanet, Jumpit, Linkareer, OKKY, Rallit, Wanted별 Python 수집기가 있습니다. API·HTML·JSON-LD·Next.js payload 등 사이트별 구조를 해석합니다. 외부 사이트의 현재 응답과 수집 성공 여부는 별도 확인이 필요합니다.

공통 `ConditionRow`는 `site`, `company`, `position_id`, `title`, `url`, `condition_type`, `item_order`, `condition`을 기록합니다. 출력은 `job_conditions.csv`, `qualification_requiremnets.csv`, `job_preferred_conditions.csv`입니다. 가운데 파일명은 실제 코드의 오탈자를 유지합니다.

각 수집기의 `normalize_title()`은 개발·데이터·AI·인프라·QA 등 직무명을 정리합니다. 규칙이 파일별로 중복되어 있어 새 분류를 추가할 때 전체 수집기를 함께 대조해야 합니다.

## 검색 데이터 준비

[조건 CSV 생성](../../data-pipeline/crawling/pinecone/create_hire_query_csv.ipynb)과 [조건 적재](../../data-pipeline/crawling/pinecone/upload_query_to_pinecone_colab.ipynb)는 JD 체크리스트용 데이터를 준비합니다. 런타임은 `qualify_conditions`, `preffered_conditions` namespace의 `metadata.condition`을 사용합니다.

[매뉴얼 임베딩](../../data-pipeline/embedding/chunk_embedding.ipynb)은 입력 CSV의 `content`, `feature`를 읽습니다. 문자 1000개, 겹침 120개 기준으로 청킹하고 OpenAI `text-embedding-3-small`로 임베딩합니다. 배치는 100이며 float32 벡터를 base64 BLOB로 저장해 `result.csv`를 만듭니다.

[매뉴얼 적재](../../data-pipeline/embedding/pinecone_uploader.ipynb)는 `content`, `feature`, `index`, `blob` 열을 읽고 벡터 ID를 `{feature}_{index}`로 만듭니다. metadata에는 BLOB 외 열을 저장합니다. `PINECONE_NAMESPACE` 기본값은 `user_manual`입니다.

## 실행 위치

수집기는 각 파일의 `__file__` 기준으로 같은 `data-pipeline/crawling/` 디렉터리에 CSV를 저장합니다. 매뉴얼 임베딩·적재 노트북은 `Path.cwd()` 기준이므로 `data-pipeline/embedding/`을 작업 디렉터리로 열고 `input.csv` 또는 `result.csv`를 준비합니다. 폴더 이동으로 입력 데이터나 원격 인덱스가 생성되지는 않습니다.

## 실행 전 확인

입력 CSV, 노트북의 설치 셀과 경로, OpenAI/Pinecone 환경 변수, 대상 인덱스·namespace를 먼저 확인합니다. 노트북에 보존된 출력·개수는 과거 실행 산출물이며 현재 원격 인덱스 상태를 나타내지 않습니다. 입력 데이터와 모델 가중치가 모두 저장소에 포함되어 있다고 가정하지 않습니다.

임베딩은 외부 호출 비용을 발생시키고 upsert는 원격 벡터를 추가·덮어씁니다. 개발 서버 기동 절차에 섞지 않고 필요한 데이터 준비 작업으로 별도 수행합니다. [검색 계약](../07-ai-modeling/retrieval-and-storage.md)을 기준으로 metadata와 namespace를 맞춥니다.
