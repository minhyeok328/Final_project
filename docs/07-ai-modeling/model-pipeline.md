# 모델 파이프라인

## 분석 순서

[analysis_graph.py](../../backend/common/analysis_graph.py)는 아래 단계를 연결합니다.

1. 회사·JD·지원서·체크리스트에서 민감 표현을 추출하고 토큰으로 치환합니다.
2. 자기소개 문항을 STAR의 상황·과제·행동·결과로 구조화하고 `original_quality`를 기록합니다.
3. 체크리스트별 충족 여부를 생성하고 피드백으로 보정합니다.
4. 면접 질문·예상 답변·의도를 생성하고 보정합니다.
5. 최종 리포트를 생성하고 보정합니다.
6. 마스킹 토큰을 복원해 반환합니다. task가 버전과 결과를 DB에 저장합니다.

[analysis_agent.py](../../backend/common/analysis_agent.py)는 Pydantic과 `with_structured_output()`을 사용합니다. 적합도·평가에는 `gpt-4o-mini`, 질문·최종 리포트 생성에는 `gpt-4.1`을 지정합니다. [analysis_prompt.py](../../backend/common/analysis_prompt.py)가 분석 버전과 평가 기준을 정의합니다.

## 피드백 종료 조건

[feedback_graph.py](../../backend/common/feedback_graph.py)의 평가기는 `corrected_output`을 반환합니다. 출력이 바뀌지 않고 `is_stable`이며 점수가 기준 이상일 때 통과합니다. 적합도·리포트 기준은 95, 질문 기준은 85이고 각 단계의 최대 평가는 3회입니다.

최대 횟수에 도달해도 마지막 출력을 반환합니다. 분석 그래프는 최종 `is_stable`이 false인지 확인해 전체 작업을 실패시키지 않습니다. 따라서 이 점수는 외부 성능 지표나 저장 전 필수 통과 보장이 아닙니다.

## 마스킹과 STAR 호출

| 경로 | RunPod 실패 처리 |
| --- | --- |
| [masking.py](../../backend/common/masking.py) | HTTP 비정상·JSON/output/result 누락은 OpenAI 경로로 이동. endpoint 미설정 선검사와 전송 예외 처리는 없음 |
| [star_analysis.py](../../backend/common/star_analysis.py) | 설정 미비·전송 예외·비정상 응답에서 OpenAI로 이동. 결과 형태 정규화 포함 |

두 경로의 HTTP timeout은 600초입니다. RunPod 마스킹 응답의 존재 여부만으로 모든 범주가 올바르게 추출되었다고 보장하지 않습니다. 원본 텍스트는 마스킹 대상을 찾는 모델 호출에 먼저 전달됩니다. 마스킹 폴백도 OpenAI에 원문을 보내므로 개인정보가 외부로 전혀 나가지 않는 처리로 설명하면 안 됩니다.

## LoRA 추론 자산

[masking_handler](../../runpod/masking_handler.py)와 [star_handler](../../runpod/star_handler.py)의 기본 base model은 `LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct`입니다. 기본 adapter는 각각 `dlfp22/exaone-masking-lora-best`, `dlfp22/exaone-star-lora-best`입니다. 모델과 adapter는 외부 저장소에서 로드하며 현재 접근 가능 여부는 확인하지 않았습니다.

설정 변수는 `MODEL_NAME`, `ADAPTER_NAME`, `HF_TOKEN`, `DEFAULT_MAX_NEW_TOKENS`, `USE_4BIT`입니다. 기본 생성 길이는 마스킹 512, STAR 1024입니다. 4-bit NF4·double quantization 설정과 CUDA 환경을 사용합니다.

[컨테이너 파일](../../runpod/masking_docker)은 CUDA 12.8.1 기반 이미지에 Torch 2.8.0 cu128 계열을 설치합니다. 웹 백엔드 requirements와 GPU requirements를 혼합하지 않습니다. 컨테이너 작성과 실제 endpoint 배포는 별도 작업입니다.

학습 노트북과 저장된 지표는 [오프라인 평가](offline-evaluation.md)에 있습니다.
