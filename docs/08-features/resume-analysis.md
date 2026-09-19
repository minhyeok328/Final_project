# 지원서 분석

## 입력과 선택

[CoverLetterPage](../../frontend/src/pages/CoverLetterPage.tsx)는 JD와 지원서를 선택하고 지원자 정보·자기소개 문항 등을 저장합니다. [useCoverLetterPageData](../../frontend/src/hooks/useCoverLetterPageData.ts)는 선택·신규 작성 상태를 관리합니다. 수정·삭제는 [useResumeMutations](../../frontend/src/hooks/mutations/useResumeMutations.ts)가 처리합니다.

화면은 체크리스트 조회 중·오류·항목 없음, 권한과 크레딧 상태에 따라 분석 버튼을 제한합니다. 서버의 `resume_analyze`에는 같은 체크리스트 선검사와 중복 분석 차단이 없으므로 화면 제한을 API 계약으로 확대하지 않습니다.

## 작업과 비용

`resume/analyze`에 지원서 `id`를 보내면 새 리포트가 생성됩니다. 비용은 계정 또는 키에서 100 크레딧이며 세션 계정의 구독 만료 시각이 미래이면 계정 차감을 생략합니다. 실패 경로에는 환불 처리가 있습니다.

응답의 리포트 상태는 `onqueue`, `processing`, `done`, `fail`입니다. 큐 사용 시 즉시 대기 리포트를 받을 수 있고 동기 실행에서는 요청 시간이 길어집니다. queue 등록 실패의 `error:false`를 분석 성공으로 취급하지 않습니다. [저장·실패 흐름](../04-backend/analysis-pipeline.md)을 참고합니다.

## 리포트 검토

[AnalysisReportPage](../../frontend/src/pages/AnalysisReportPage.tsx)는 리포트 ID로 결과를 고르고 종합 등급·요약·체크리스트·역량·강점·우려·질문을 표시합니다. `reportId` URL 선택을 우선하며 `resumeId`도 호환합니다.

`user_feedback`과 `review_text`는 리포트 평가와 메모입니다. `Resume.reviewed`와는 별도 필드이므로 메모 저장이 지원서의 검토 완료 상태를 자동으로 변경한다고 설명하지 않습니다. 현재 지원서 수정 API는 `reviewed`와 `reviewed_at`을 차단합니다.

면접 질문은 리포트의 `{question,answer,purpose}` 배열입니다. 별도 질문 수정·삭제 API는 없고 처리 중 리포트의 수정·삭제는 거부됩니다.

## 템플릿 미리보기

[CoverLetterTemplatePage](../../frontend/src/pages/CoverLetterTemplatePage.tsx)는 질문 기반 가이드를 보여주는 숨긴 화면입니다. 문항 생성과 문서 다운로드는 비활성입니다. 학습·생성 결과의 해석은 [오프라인 평가](../07-ai-modeling/offline-evaluation.md)를 함께 읽습니다.
