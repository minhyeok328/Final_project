# AI 모델링

AI 코드는 업무 실행 그래프, 외부 모델 추론, 검색 데이터 준비, 학습·평가 실험으로 나뉩니다. 모델 가중치가 웹 API 안에 포함되어 실행되는 구조는 아닙니다.

| 영역 | 구현 | 문서 |
| --- | --- | --- |
| 지원서 분석 | [analysis_graph](../../backend/common/analysis_graph.py) | [모델 파이프라인](model-pipeline.md) |
| JD 체크리스트 | [checklist_graph](../../backend/common/checklist_graph.py) | [검색과 저장소](retrieval-and-storage.md) |
| HR·사용 설명서 채팅 | [chat_graph](../../backend/common/chat_graph.py) | [문서 검색 채팅](../08-features/document-chat.md) |
| JD 작성 대화 | [jd_chat_graph](../../backend/common/jd_chat_graph.py) | [채용 워크스페이스](../08-features/recruiting-workspace.md) |
| LoRA 추론 | [RunPod handler](../../runpod/) | [모델 파이프라인](model-pipeline.md) |
| 학습·평가 | [llm](../../llm/) | [오프라인 평가](offline-evaluation.md) |

OpenAI·Pinecone·RunPod 설정은 [개발 환경](../01-getting-started/development-environment.md), 작업 저장·실패 처리는 [백엔드 분석](../04-backend/analysis-pipeline.md), 서비스 수준 한계는 [검증 문서](../10-quality/verification-and-limitations.md)를 참고합니다.
