# 오프라인 모델 평가

아래 값은 저장소 노트북에 남아 있는 출력입니다. 문서 개편 과정에서는 출력과 계산 맥락을 읽었으며 모델 학습·추론·평가를 재실행하지 않았습니다. 현재 배포 모델의 성능이나 전체 채용 판단 정확도를 나타내지 않습니다.

## 마스킹

| 실험 | 표본 | Exact match | micro F1 | 근거 |
| --- | --- | --- | --- | --- |
| EXAONE base | 100 | 0.03 | 0.3937 | [base](../../llm/train_star_masking/masking/exaone_base.ipynb) |
| LoRA | 100 | 0.70 | 0.9303 | [학습](../../llm/train_star_masking/masking/exaone_gen_train.ipynb) |
| LoRA + oversampling | 100 | 0.73 | 0.9518 | [oversampling](../../llm/train_star_masking/masking/oversam_exaone_gen_train.ipynb) |

oversampling 실험의 `jd_discrimination` 범주 F1은 0.3333, recall은 0.2입니다. 전체 평균이 높더라도 소수 범주의 누락을 가리지 않도록 범주별 출력을 함께 봅니다.

## STAR 구조화

[STAR epoch5 노트북](../../llm/train_star_masking/star/star_exaone_epoch5.ipynb)의 테스트 96건 base/학습 비교 출력:

| 지표 | Base | LoRA |
| --- | --- | --- |
| JSON valid | 0.708333 | 0.958333 |
| Schema valid | 0.604167 | 0.958333 |
| ROUGE-L | 0.208947 | 0.913565 |
| Semantic similarity | 0.541779 | 0.929599 |

문자·의미 유사도와 형식 유효성은 다른 지표입니다. 높은 유사도가 원문 사실의 완전한 보존이나 임의 지원서에 대한 일반화를 의미하지 않습니다. 입력 셋과 평가 함수는 노트북을 함께 확인합니다.

## 채팅과 리포트

[채팅 평가](../../llm/eval/chat_eval.ipynb)는 500개 분류 평가 문항의 저장 출력에서 Accuracy 0.9960, Macro F1 0.9961을 보입니다. 이는 질문 라우팅 평가이며 생성 답변 전체의 정확도와 다릅니다.

[단계별 리포트 평가](../../llm/eval/middle_report3_eval.ipynb)의 각 20개 사례 출력:

| 단계 | 저장된 결과 |
| --- | --- |
| 지원서 요약 | pass rate 0.80, 평균 4.70/5 |
| 체크리스트 내용 | pass rate 0.75, 평균 4.75/5 |
| 질문 Ver2 | pass rate 0.90, 평균 4.85/5 |
| 최종 리포트 Ver1 | pass rate 1.00, 등급 일치 1.00, 평균 4.40/5 |
| 최종 리포트 Ver2 | pass rate 0.50, 등급 일치 0.55, 평균 3.65/5 |

버전별 차이는 프롬프트 변경과 평가 조건을 함께 읽어야 합니다. LLM 평가 점수는 독립적인 사람 평가나 운영 품질 보증을 대신하지 않습니다.

[마스킹 품질 비교](../../llm/eval/masking_quality_eval.ipynb)에는 마스킹 입력 평균 3.806667/5, 개체 복원 3.333333/5가 남아 있습니다. 소표본 실험이므로 정보 손실 가능성을 탐색한 결과로 해석합니다.

## 학습 구성과 재현 조건

STAR epoch5 노트북은 seed 42, 학습·검증·테스트 298/106/96 분할을 사용하며 LoRA rank 16, alpha 32, dropout 0.05, epoch 5를 설정합니다. 마스킹 oversampling 노트북은 원래 학습 300건을 1006건으로 늘리고 테스트 100건을 유지합니다. 모델·출력 지표와 함께 데이터 분할과 증강 범위를 읽어야 합니다.

노트북별 데이터 경로·설치 셀·base model·adapter·seed·분할 방식·평가 모델을 먼저 확인합니다. 학습은 GPU와 외부 모델 접근권한이 필요하고 생성·judge 평가에는 API 호출이 발생할 수 있습니다. 노트북 출력이 현재 RunPod adapter와 일치하는 버전인지도 별도 확인해야 합니다.
