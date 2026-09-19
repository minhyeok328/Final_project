import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = path.resolve(process.argv[2] ?? "인터페이스정의서_템플릿.xlsx");
const outputDir = fileURLToPath(new URL("../../outputs/interface-definition/", import.meta.url));
const outputPath = path.join(outputDir, "HumouR_인터페이스정의서.xlsx");
const previewDir = path.join(outputDir, "previews");
const docName = "HumouR API 인터페이스 정의서";
const docDate = "2026-06-22";
const version = "1.0";
const author = "프로젝트팀";

const apiRows = [
  ["AUTH-001", "AUTH", "인증", "CSRF 쿠키 발급", "GET/POST", "/api/csrf/", "없음", "앱 초기화/POST 선행", "csrf_token", "없음", "{error:false,message}", "docs/06-api/api-reference.md", "POST 요청 전 CSRF 쿠키 확보"],
  ["AUTH-002", "AUTH", "회원가입", "회원가입", "POST", "/api/signin/", "없음", "SignupPage", "account_signin", "username,password,name,verification_*", "{signin:true}", "frontend-api-id-map.md", "실제 API ID 기준 signin"],
  ["AUTH-003", "AUTH", "로그인", "로그인", "POST", "/api/login/", "없음", "LoginPage", "account_login", "username,password", "{login:true}", "frontend-api-id-map.md", "세션 생성"],
  ["AUTH-004", "AUTH", "로그아웃", "로그아웃", "POST", "/api/logout/", "Django Session", "AppShell/AccountMenu", "account_logout", "없음", "{logout:true}", "frontend-api-id-map.md", "세션 종료"],
  ["AUTH-005", "AUTH", "회원가입", "아이디 중복 확인", "POST", "/api/checkuser/", "없음", "SignupPage", "check_user", "username", "{valid:boolean}", "frontend-api-id-map.md", ""],
  ["AUTH-006", "AUTH", "비밀번호 재설정", "비밀번호 질문 조회", "POST", "/api/passqestion/", "없음", "PasswordResetPage", "password_question", "username", "{verification_question}", "frontend-api-id-map.md", "코드 기준 오탈자 경로 유지"],
  ["AUTH-007", "AUTH", "비밀번호 재설정", "비밀번호 재설정", "POST", "/api/passreset/", "없음", "PasswordResetPage", "password_reset", "username,verification_answer", "{password}", "frontend-api-id-map.md", ""],
  ["ACC-001", "ACC", "마이페이지/공통", "계정 정보 조회", "POST", "/api/account/get/", "Django Session", "useAppData", "account_get", "없음", "Account", "backend/api/models.py", ""],
  ["ACC-002", "ACC", "마이페이지", "계정 정보 수정/탈퇴", "POST", "/api/account/modify/", "Django Session", "AccountSettingsForm", "account_modify", "수정 필드,delete", "{error:false}", "backend/api/views/account_endpoints.py", "id/username/account_hash 수정 차단"],
  ["COMP-001", "COMP", "회사 정보", "회사 정보 조회", "POST", "/api/compinfo/get/", "Django Session", "CompanyPage/useAppData", "compinfo_get", "없음", "CompanyInfo", "backend/api/models.py", "없으면 생성 후 반환"],
  ["COMP-002", "COMP", "회사 정보", "회사 정보 수정", "POST", "/api/compinfo/modify/", "Django Session", "CompanyProfileForm", "compinfo_modify", "회사 정보 필드", "{error:false}", "backend/api/views/company_info_endpoints.py", ""],
  ["KEY-001", "KEY", "관리자/API 키", "인증키 생성", "POST", "/api/authkey/add/", "Django Session", "AdminPage", "authkey_add", "name,description,credit_limit,authorized_resume", "AuthKey", "backend/api/models.py", ""],
  ["KEY-002", "KEY", "관리자/API 키", "인증키 목록 조회", "POST", "/api/authkey/get/", "Django Session", "useAppData", "authkey_get", "없음", "AuthKey[]", "backend/api/views/auth_key_endpoints.py", "value 마스킹"],
  ["KEY-003", "KEY", "관리자/API 키", "인증키 수정/삭제", "POST", "/api/authkey/modify/", "Django Session", "AuthKeyList", "authkey_modify", "id,수정 필드,delete", "{error:false}", "backend/api/views/auth_key_endpoints.py", "authorized_resume 권한 검증"],
  ["JD-001", "JD", "JD 관리", "JD 등록", "POST", "/api/jd/add/", "Django Session", "JdEditorPanel", "jd_add", "job_name,career_level,required_skill 등", "JobDescription", "backend/api/models.py", ""],
  ["JD-002", "JD", "대시보드/JD", "JD 목록 조회", "POST", "/api/jd/get/", "Session or X-API-Key", "useAppData/SharedReportPage", "jd_get", "없음", "JobDescription[]", "backend/api/views/job_description_endpoints.py", "공유 화면은 API 키 가능"],
  ["JD-003", "JD", "JD 관리", "JD 수정/삭제", "POST", "/api/jd/modify/", "Session or X-API-Key", "JdEditorPanel", "jd_modify", "id,수정 필드,delete", "JobDescription", "backend/api/views/job_description_endpoints.py", ""],
  ["JD-004", "JD", "JD 분석", "JD 기반 체크리스트 생성", "POST", "/api/jd/analyze/", "Django Session", "JdPage", "jd_analyze", "id", "Checklist[]", "backend/common/checklist.py", "부족 항목 AI 생성"],
  ["CHK-001", "CHK", "체크리스트", "체크리스트 추가", "POST", "/api/checklist/add/", "Django Session", "JdPage", "checklist_add", "job_description_id,content", "Checklist", "backend/api/models.py", ""],
  ["CHK-002", "CHK", "체크리스트", "체크리스트 조회", "POST", "/api/checklist/get/", "Session or X-API-Key", "useJdPageData", "checklist_get", "job_description_id", "Checklist[]", "backend/api/views/checklist_endpoints.py", ""],
  ["CHK-003", "CHK", "체크리스트", "체크리스트 수정/삭제", "POST", "/api/checklist/modify/", "Session or X-API-Key", "JdPage", "checklist_modify", "id,content,delete", "Checklist", "backend/api/views/checklist_endpoints.py", ""],
  ["RES-001", "RES", "지원서", "지원서 등록", "POST", "/api/resume/add/", "Django Session", "CoverLetterPage", "resume_add", "job_description_id,지원서 필드", "Resume", "backend/api/models.py", "status/reviewed 직접 지정 불가"],
  ["RES-002", "RES", "지원서", "지원서 조회", "POST", "/api/resume/get/", "Session or X-API-Key", "useAppData/SharedReportPage", "resume_get", "job_description_id 또는 id", "Resume[]", "backend/api/views/resume_endpoints.py", ""],
  ["RES-003", "RES", "지원서 분석", "지원서 분석 요청", "POST", "/api/resume/analyze/", "Session or X-API-Key", "AnalysisReportPage", "resume_analyze", "id", "AnalysisReport", "backend/common/report.py", "OpenAI 분석 후 저장"],
  ["RES-004", "RES", "지원서", "지원서 수정/삭제", "POST", "/api/resume/modify/", "Session or X-API-Key", "CoverLetterPage", "resume_modify", "id,수정 필드,delete", "Resume", "backend/api/views/resume_endpoints.py", ""],
  ["REP-001", "REP", "분석 리포트", "분석 리포트 조회", "POST", "/api/report/get/", "Session or X-API-Key", "AnalysisReportPage/SharedReportPage", "report_get", "resume_id 또는 id", "AnalysisReport[]", "backend/api/views/analysis_report_endpoints.py", "interview_question 포함"],
  ["REP-002", "REP", "분석 리포트", "분석 리포트 수정", "POST", "/api/report/modify/", "Session or X-API-Key", "AnalysisReportPage", "report_modify", "id,수정 필드", "AnalysisReport", "backend/api/views/analysis_report_endpoints.py", "삭제 미지원"],
  ["CHAT-001", "CHAT", "AI 채팅", "문서/HR 채팅", "POST", "/api/chat/", "Session or X-API-Key", "ChatPage/DocumentChatFab", "chat", "chat:[{role,message}]", "{response:{role,message}}", "backend/common/chat_graph.py", "LangGraph + Pinecone"],
];

const apiSpecRows = apiRows.map(([id, domain, screen, apiName, method, endpoint, auth, caller, view, request, response, , note]) => [
  id,
  apiName,
  method,
  endpoint,
  "HTTPS",
  "application/json",
  auth,
  `${domain} / ${screen}`,
  view,
  caller,
  response,
  request ? note : "",
]);

const requestRows = [
  ["AUTH-001", 0, "(없음)", "-", "-", "N", "-", "CSRF 쿠키 발급 요청", "-", "account_endpoints.csrf_token", "-", ""],
  ["AUTH-002", 0, "username", "username", "string", "Y", "-", "로그인 ID", "recruiter01", "Account.username", "중복 불가", ""],
  ["AUTH-002", 0, "password", "password", "string", "Y", "-", "비밀번호", "P@ssw0rd!", "Account.password", "Django password validator", ""],
  ["AUTH-002", 0, "name", "name", "string", "Y", "-", "사용자명", "홍길동", "Account.name", "max_length=100", ""],
  ["AUTH-002", 0, "verification_question", "verification_question", "string", "Y", "-", "비밀번호 확인 질문", "내 별명은?", "Account.verification_question", "max_length=255", ""],
  ["AUTH-002", 0, "verification_answer", "verification_answer", "string", "Y", "-", "비밀번호 확인 답변", "humour", "Account.verification_answer", "max_length=255", ""],
  ["AUTH-003", 0, "username", "username", "string", "Y", "-", "로그인 ID", "recruiter01", "Account.username", "-", ""],
  ["AUTH-003", 0, "password", "password", "string", "Y", "-", "비밀번호", "P@ssw0rd!", "Account.password", "-", ""],
  ["AUTH-004", 0, "(없음)", "-", "-", "N", "-", "세션 로그아웃", "-", "account_logout", "-", ""],
  ["AUTH-005", 0, "username", "username", "string", "Y", "-", "중복 확인할 ID", "recruiter01", "Account.username", "-", ""],
  ["AUTH-006", 0, "username", "username", "string", "Y", "-", "질문 조회 대상 ID", "recruiter01", "Account.username", "-", "경로명 passqestion"],
  ["AUTH-007", 0, "username", "username", "string", "Y", "-", "재설정 대상 ID", "recruiter01", "Account.username", "-", ""],
  ["AUTH-007", 0, "verification_answer", "verification_answer", "string", "Y", "answer alias 허용", "비밀번호 확인 답변", "humour", "Account.verification_answer", "-", ""],
  ["ACC-001", 0, "(없음)", "-", "-", "N", "-", "세션 사용자 기준 조회", "-", "Account", "로그인 필요", ""],
  ["ACC-002", 0, "name", "name", "string", "N", "-", "사용자명 수정", "홍길동", "Account.name", "id/username/account_hash 제외", ""],
  ["ACC-002", 0, "formal_password", "formal_password", "string", "N", "-", "현재 비밀번호 확인", "oldpass", "Account.password", "-", ""],
  ["ACC-002", 0, "password", "password", "string", "N", "-", "신규 비밀번호", "newpass", "Account.password", "Django password hash 저장", ""],
  ["ACC-002", 0, "delete", "delete", "boolean", "N", "true/false", "계정 탈퇴 여부", true, "Account", "-", ""],
  ["COMP-001", 0, "(없음)", "-", "-", "N", "-", "세션 사용자 회사 조회", "-", "CompanyInfo", "-", ""],
  ["COMP-002", 0, "company_name", "company_name", "string", "N", "-", "회사명", "HumouR", "CompanyInfo.company_name", "max_length=100", ""],
  ["COMP-002", 0, "employee_count", "employee_count", "number", "N", "-", "직원 수", 35, "CompanyInfo.employee_count", "integer", ""],
  ["COMP-002", 0, "team_composition", "team_composition", "array", "N", "-", "팀 구성", "[\"HR\",\"Tech\"]", "CompanyInfo.team_composition", "JSONField", ""],
  ["COMP-002", 0, "company_description", "company_description", "string", "N", "-", "회사 소개", "채용 SaaS", "CompanyInfo.company_description", "TextField", ""],
  ["COMP-002", 0, "employ_style", "employ_style", "array", "N", "-", "채용 선호 스타일", "[\"협업\"]", "CompanyInfo.employ_style", "JSONField", ""],
  ["KEY-001", 0, "name", "name", "string", "Y", "-", "API 키명", "파트너 공유키", "AuthKey.name", "max_length=100", ""],
  ["KEY-001", 0, "description", "description", "string", "N", "-", "설명", "외부 공유용", "AuthKey.description", "max_length=255", ""],
  ["KEY-001", 0, "credit_limit", "credit_limit", "number", "N", "-", "사용 크레딧 한도", 100, "AuthKey.credit_limit", "integer", ""],
  ["KEY-001", 0, "authorized_resume", "authorized_resume", "number[]", "N", "resume id", "접근 허용 지원서 ID", "[1,2]", "AuthKey.authorized_resume", "권한 보유 resume 검증", ""],
  ["KEY-003", 0, "id", "id", "number", "Y", "-", "수정/삭제 대상 키 ID", 1, "AuthKey.id", "-", ""],
  ["KEY-003", 0, "delete", "delete", "boolean", "N", "true/false", "삭제 여부", true, "AuthKey", "-", ""],
  ["JD-001", 0, "job_name", "job_name", "string", "Y", "-", "직무명", "프론트엔드 개발자", "JobDescription.job_name", "max_length=100", ""],
  ["JD-001", 0, "career_level", "career_level", "string", "Y", "-", "요구 경력", "3년 이상", "JobDescription.career_level", "max_length=50", ""],
  ["JD-001", 0, "required_skill", "required_skill", "array", "Y", "-", "필수 역량", "[\"React\"]", "JobDescription.required_skill", "JSONField", ""],
  ["JD-001", 0, "preferred_skill", "preferred_skill", "array", "N", "-", "우대 역량", "[\"Django\"]", "JobDescription.preferred_skill", "JSONField", ""],
  ["JD-001", 0, "education_level", "education_level", "string", "N", "-", "학력", "학사", "JobDescription.education_level", "max_length=30", ""],
  ["JD-001", 0, "major", "major", "string", "N", "-", "전공", "컴퓨터공학", "JobDescription.major", "max_length=30", ""],
  ["JD-001", 0, "main_task", "main_task", "string", "N", "-", "주요 업무", "대시보드 개발", "JobDescription.main_task", "TextField", ""],
  ["JD-001", 0, "hiring_reason", "hiring_reason", "string", "N", "-", "채용 사유", "서비스 확장", "JobDescription.hiring_reason", "TextField", ""],
  ["JD-001", 0, "work_type", "work_type", "string", "N", "-", "근무 형태", "정규직", "JobDescription.work_type", "max_length=50", ""],
  ["JD-001", 0, "status", "status", "string", "N", "prepare,on_going,closed", "JD 상태", "prepare", "JobDescription.status", "choices", ""],
  ["JD-002", 0, "(없음)", "-", "-", "N", "-", "접근 가능한 JD 목록", "-", "JobDescription", "Session 또는 API Key", ""],
  ["JD-003", 0, "id", "id", "number", "Y", "-", "수정/삭제 대상 JD ID", 1, "JobDescription.id", "-", ""],
  ["JD-003", 0, "delete", "delete", "boolean", "N", "true/false", "삭제 여부", true, "JobDescription", "-", ""],
  ["JD-004", 0, "id", "id", "number", "Y", "-", "분석 대상 JD ID", 1, "JobDescription.id", "JD 접근 권한 필요", ""],
  ["CHK-001", 0, "job_description_id", "job_description_id", "number", "Y", "-", "연결 JD ID", 1, "Checklist.job_description_id", "-", ""],
  ["CHK-001", 0, "content", "content", "string", "Y", "-", "체크리스트 내용", "React 상태관리 경험", "Checklist.content", "TextField", ""],
  ["CHK-002", 0, "job_description_id", "job_description_id", "number", "Y", "-", "조회할 JD ID", 1, "Checklist.job_description_id", "-", ""],
  ["CHK-003", 0, "id", "id", "number", "Y", "-", "수정/삭제 대상 체크리스트 ID", 1, "Checklist.id", "-", ""],
  ["CHK-003", 0, "content", "content", "string", "N", "-", "수정 내용", "TypeScript 경험", "Checklist.content", "-", ""],
  ["CHK-003", 0, "delete", "delete", "boolean", "N", "true/false", "삭제 여부", true, "Checklist", "-", ""],
  ["RES-001", 0, "job_description_id", "job_description_id", "number", "Y", "-", "지원 JD ID", 1, "Resume.job_description_id", "-", ""],
  ["RES-001", 0, "name", "name", "string", "N", "-", "지원자명", "김지원", "Resume.name", "max_length=100", ""],
  ["RES-001", 0, "skill", "skill", "array", "N", "-", "보유 기술", "[\"React\",\"Django\"]", "Resume.skill", "JSONField", ""],
  ["RES-001", 0, "education_level", "education_level", "object", "N", "-", "학력 정보", "{\"degree\":\"학사\"}", "Resume.education_level", "JSONField", ""],
  ["RES-001", 0, "experience", "experience", "array", "N", "-", "경력", "[{\"company\":\"A\"}]", "Resume.experience", "JSONField", ""],
  ["RES-001", 0, "self_intoduction", "self_intoduction", "array", "N", "-", "자기소개 문항", "[{\"question\":\"...\"}]", "Resume.self_intoduction", "코드 오탈자 필드명 유지", ""],
  ["RES-001", 0, "certification", "certification", "array", "N", "-", "자격증", "[\"SQLD\"]", "Resume.certification", "JSONField", ""],
  ["RES-001", 0, "language", "language", "array", "N", "-", "어학", "[\"TOEIC\"]", "Resume.language", "JSONField", ""],
  ["RES-001", 0, "award", "award", "array", "N", "-", "수상", "[\"공모전\"]", "Resume.award", "JSONField", ""],
  ["RES-001", 0, "training", "training", "array", "N", "-", "교육", "[\"부트캠프\"]", "Resume.training", "JSONField", ""],
  ["RES-001", 0, "other_activity", "other_activity", "array", "N", "-", "기타 활동", "[\"동아리\"]", "Resume.other_activity", "JSONField", ""],
  ["RES-002", 0, "job_description_id", "job_description_id", "number", "N", "-", "JD별 지원서 조회", 1, "Resume.job_description_id", "id와 선택 사용", ""],
  ["RES-002", 0, "id", "id", "number", "N", "-", "단일 지원서 조회", 10, "Resume.id", "job_description_id와 선택 사용", ""],
  ["RES-003", 0, "id", "id", "number", "Y", "-", "분석 대상 지원서 ID", 10, "Resume.id", "접근 권한 필요", ""],
  ["RES-004", 0, "id", "id", "number", "Y", "-", "수정/삭제 대상 지원서 ID", 10, "Resume.id", "-", ""],
  ["RES-004", 0, "delete", "delete", "boolean", "N", "true/false", "삭제 여부", true, "Resume", "-", ""],
  ["REP-001", 0, "resume_id", "resume_id", "number", "N", "-", "지원서 기준 리포트 조회", 10, "AnalysisReport.resume_id", "id와 선택 사용", ""],
  ["REP-001", 0, "id", "id", "number", "N", "-", "단일 리포트 조회", 5, "AnalysisReport.id", "resume_id와 선택 사용", ""],
  ["REP-002", 0, "id", "id", "number", "Y", "-", "수정 대상 리포트 ID", 5, "AnalysisReport.id", "삭제 미지원", ""],
  ["REP-002", 0, "overall_grade", "overall_grade", "string", "N", "A,B,C,D,F 등", "종합 등급", "A", "AnalysisReport.overall_grade", "max_length=10", ""],
  ["REP-002", 0, "final_comment", "final_comment", "string", "N", "-", "최종 코멘트", "면접 추천", "AnalysisReport.final_comment", "TextField", ""],
  ["CHAT-001", 0, "chat", "chat", "array", "Y", "-", "대화 배열", "[{role,message}]", "chat_endpoints.chat", "list 필수", ""],
  ["CHAT-001", 1, "chat[].role", "role", "string", "Y", "user,agent", "대화 주체", "user", "BackendChatMessage.role", "허용값 검증", ""],
  ["CHAT-001", 1, "chat[].message", "message", "string", "Y", "-", "대화 내용", "이 지원자 요약해줘", "BackendChatMessage.message", "string 필수", ""],
];

const responseRows = [
  ["ALL", 0, "error", "error", "boolean", "Y", "공통", "true,false", "오류 여부", false, "BackendEnvelope", ""],
  ["ALL", 0, "message", "message", "string", "N", "공통", "-", "응답 메시지", "OK", "BackendEnvelope", ""],
  ["ALL", 0, "data", "data", "object/array", "N", "공통", "-", "도메인 데이터", "{}", "BackendEnvelope", ""],
  ["AUTH-002", 1, "signin", "signin", "boolean", "Y", "성공", "true", "회원가입 성공 여부", true, "account_signin", ""],
  ["AUTH-003", 1, "login", "login", "boolean", "Y", "성공", "true", "로그인 성공 여부", true, "account_login", ""],
  ["AUTH-004", 1, "logout", "logout", "boolean", "Y", "성공", "true", "로그아웃 성공 여부", true, "account_logout", ""],
  ["AUTH-005", 1, "valid", "valid", "boolean", "Y", "성공", "true,false", "사용 가능 여부", true, "check_user", ""],
  ["AUTH-006", 1, "verification_question", "verification_question", "string", "Y", "성공", "-", "비밀번호 확인 질문", "내 별명은?", "Account.verification_question", ""],
  ["AUTH-007", 1, "password", "password", "string", "Y", "성공", "-", "재설정된 비밀번호", "temp1234", "password_reset", "현재 구현은 평문 반환"],
  ["ACC-001", 1, "id", "id", "number", "Y", "성공", "-", "계정 ID", 1, "Account.to_dict", ""],
  ["ACC-001", 1, "username", "username", "string", "Y", "성공", "-", "로그인 ID", "recruiter01", "Account.to_dict", ""],
  ["ACC-001", 1, "name", "name", "string", "Y", "성공", "-", "사용자명", "홍길동", "Account.to_dict", ""],
  ["ACC-001", 1, "credit", "credit", "number", "Y", "성공", "-", "잔여 크레딧", 150, "Account.to_dict", ""],
  ["ACC-001", 1, "subscribe", "subscribe", "boolean", "Y", "성공", "true,false", "구독 여부", false, "Account.to_dict", ""],
  ["COMP-001", 1, "company_name", "company_name", "string", "Y", "성공", "-", "회사명", "HumouR", "CompanyInfo.to_dict", ""],
  ["COMP-001", 1, "employee_count", "employee_count", "number", "Y", "성공", "-", "직원 수", 35, "CompanyInfo.to_dict", ""],
  ["COMP-001", 1, "team_composition", "team_composition", "array", "Y", "성공", "-", "팀 구성", "[\"HR\"]", "CompanyInfo.to_dict", ""],
  ["KEY-001/002/003", 1, "id", "id", "number", "Y", "성공", "-", "인증키 ID", 1, "AuthKey.to_dict", ""],
  ["KEY-001/002/003", 1, "name", "name", "string", "Y", "성공", "-", "키 이름", "공유키", "AuthKey.to_dict", ""],
  ["KEY-001/002/003", 1, "credit_limit", "credit_limit", "number", "Y", "성공", "-", "한도", 100, "AuthKey.to_dict", ""],
  ["KEY-001/002/003", 1, "value", "value", "string", "Y", "성공", "sk_live_*", "API 키 값", "sk_live_***", "AuthKey.to_dict", "목록 조회 시 마스킹"],
  ["JD-001/002/003", 1, "id", "id", "number", "Y", "성공", "-", "JD ID", 1, "JobDescription.to_dict", ""],
  ["JD-001/002/003", 1, "job_name", "job_name", "string", "Y", "성공", "-", "직무명", "프론트엔드 개발자", "JobDescription.to_dict", ""],
  ["JD-001/002/003", 1, "required_skill", "required_skill", "array", "Y", "성공", "-", "필수 역량", "[\"React\"]", "JobDescription.to_dict", ""],
  ["JD-001/002/003", 1, "status", "status", "string", "Y", "성공", "prepare,on_going,closed", "JD 상태", "prepare", "JobDescription.to_dict", ""],
  ["JD-004", 1, "data[]", "data", "Checklist[]", "Y", "성공", "-", "생성/조회된 체크리스트", "[{id,content}]", "jd_analyze", ""],
  ["CHK-001/002/003", 1, "id", "id", "number", "Y", "성공", "-", "체크리스트 ID", 1, "Checklist.to_dict", ""],
  ["CHK-001/002/003", 1, "job_description_id", "job_description_id", "number", "Y", "성공", "-", "JD ID", 1, "Checklist.to_dict", ""],
  ["CHK-001/002/003", 1, "content", "content", "string", "Y", "성공", "-", "점검 항목", "React 경험", "Checklist.to_dict", ""],
  ["RES-001/002/004", 1, "id", "id", "number", "Y", "성공", "-", "지원서 ID", 10, "Resume.to_dict", ""],
  ["RES-001/002/004", 1, "job_description_id", "job_description_id", "number", "Y", "성공", "-", "JD ID", 1, "Resume.to_dict", ""],
  ["RES-001/002/004", 1, "name", "name", "string", "Y", "성공", "-", "지원자명", "김지원", "Resume.to_dict", ""],
  ["RES-001/002/004", 1, "status", "status", "string", "Y", "성공", "onqueue,processing,done", "분석 상태", "onqueue", "Resume.to_dict", ""],
  ["RES-003", 1, "overall_grade", "overall_grade", "string", "Y", "성공", "A,B,C,D,F 등", "종합 등급", "A", "AnalysisReport.to_dict", ""],
  ["RES-003/REP-001/002", 1, "resume_id", "resume_id", "number", "Y", "성공", "-", "지원서 ID", 10, "AnalysisReport.to_dict", ""],
  ["RES-003/REP-001/002", 1, "overall_summary", "overall_summary", "string", "Y", "성공", "-", "종합 요약", "강점이 명확함", "AnalysisReport.to_dict", ""],
  ["RES-003/REP-001/002", 1, "checklist", "checklist", "array", "Y", "성공", "-", "체크리스트 평가", "[...]", "AnalysisReport.to_dict", ""],
  ["RES-003/REP-001/002", 1, "interview_question", "interview_question", "array", "Y", "성공", "-", "면접 질문", "[{question,answer,purpose}]", "AnalysisReport.to_dict", ""],
  ["RES-003/REP-001/002", 2, "interview_question[].question", "question", "string", "Y", "성공", "-", "질문", "프로젝트 역할은?", "get_interview_question", ""],
  ["RES-003/REP-001/002", 2, "interview_question[].answer", "answer", "string", "Y", "성공", "-", "예상 답변/근거", "React 담당", "get_interview_question", ""],
  ["RES-003/REP-001/002", 2, "interview_question[].purpose", "purpose", "string", "Y", "성공", "-", "질문 목적", "역량 검증", "get_interview_question", ""],
  ["CHAT-001", 1, "response.role", "role", "string", "Y", "성공", "agent", "응답 주체", "agent", "chat_endpoints.chat", ""],
  ["CHAT-001", 1, "response.message", "message", "string", "Y", "성공", "-", "AI 답변", "지원자 요약...", "chat_endpoints.chat", ""],
];

const interfaceSpecRows = [
  ["ACC", "Model", "Django API", "users", "id", "BigAutoField", "-", "Y", "계정 PK", "Account.to_dict.id", "Account.id", ""],
  ["ACC", "Model", "Django API", "users", "username", "string", "150", "Y", "로그인 ID", "Django AbstractUser", "Account.username", ""],
  ["ACC", "Model", "Django API", "users", "account_hash", "string", "16", "Y", "API 키 prefix 생성용 해시", "generate_account_hash", "Account.account_hash", ""],
  ["COMP", "Model", "Django API", "company_info", "company_name", "string", "100", "N", "회사명", "CompanyInfo.to_dict", "CompanyInfo.company_name", ""],
  ["COMP", "Model", "Django API", "company_info", "team_composition", "JSON array", "-", "N", "팀 구성", "CompanyProfileForm -> JSONField", "CompanyInfo.team_composition", ""],
  ["KEY", "Model", "Django API", "auth_keys", "value", "string", "48", "Y", "외부 공유 API Key", "generate_auth_key_value", "AuthKey.value", "조회 시 마스킹"],
  ["KEY", "Model", "Django API", "auth_keys", "authorized_resume", "JSON number[]", "-", "N", "접근 허용 resume id", "_validate_authorized_resume", "AuthKey.authorized_resume", ""],
  ["JD", "Model", "Django API", "job_descriptions", "job_name", "string", "100", "Y", "채용 직무명", "JdEditorPanel -> jd_add", "JobDescription.job_name", ""],
  ["JD", "Model", "Django API", "job_descriptions", "required_skill", "JSON array", "-", "Y", "필수 역량", "EditableStringList -> JSONField", "JobDescription.required_skill", ""],
  ["JD", "Code", "Django API", "job_descriptions", "status", "string", "30", "Y", "JD 상태", "prepare/on_going/closed", "JobDescription.status", "공통코드 참조"],
  ["CHK", "Model", "Django API", "checklists", "content", "Text", "-", "Y", "평가 체크리스트 항목", "manual or AI checklist.py", "Checklist.content", ""],
  ["RES", "Model", "Django API", "resumes", "name", "string", "100", "N", "지원자명", "CoverLetterPage -> resume_add", "Resume.name", ""],
  ["RES", "Model", "Django API", "resumes", "self_intoduction", "JSON array", "-", "N", "자기소개서", "기존 코드 오탈자 필드명 유지", "Resume.self_intoduction", ""],
  ["RES", "Code", "Django API", "resumes", "status", "string", "30", "Y", "분석 진행 상태", "onqueue/processing/done", "Resume.status", "공통코드 참조"],
  ["REP", "Model", "Django API", "analysis_reports", "overall_grade", "string", "10", "Y", "종합 등급", "report.py result", "AnalysisReport.overall_grade", ""],
  ["REP", "Model", "Django API", "analysis_reports", "interview_question", "JSON array", "-", "N", "면접 질문", "get_interview_question", "AnalysisReport.interview_question", "question/answer/purpose"],
  ["CHAT", "Payload", "Django API", "chat request", "chat[].role", "string", "-", "Y", "대화 역할", "user/agent", "BackendChatMessage.role", ""],
  ["CHAT", "Payload", "Django API", "chat response", "response.message", "string", "-", "Y", "AI 답변", "LangGraph output", "chat response", ""],
];

const dbRows = [
  ["ACC", "SQLite(local) / MySQL(EB)", "Django default", "users", "ORM CRUD", "request 단위", "id, username, account_hash", "실시간", "세션 사용자", "Account"],
  ["COMP", "SQLite(local) / MySQL(EB)", "Django default", "company_info", "ORM CRUD", "request 단위", "id, account_id", "실시간", "세션 사용자", "CompanyInfo"],
  ["KEY", "SQLite(local) / MySQL(EB)", "Django default", "auth_keys", "ORM CRUD", "request 단위", "id, account_id, value", "실시간", "세션 사용자", "AuthKey"],
  ["JD", "SQLite(local) / MySQL(EB)", "Django default", "job_descriptions", "ORM CRUD", "request 단위", "id, account_id", "실시간", "Session/API Key", "JobDescription"],
  ["CHK", "SQLite(local) / MySQL(EB)", "Django default", "checklists", "ORM CRUD", "request 단위", "id, job_description_id", "실시간", "Session/API Key", "Checklist"],
  ["RES", "SQLite(local) / MySQL(EB)", "Django default", "resumes", "ORM CRUD", "분석 시 status 갱신", "id, job_description_id", "실시간/분석", "Session/API Key", "Resume"],
  ["REP", "SQLite(local) / MySQL(EB)", "Django default", "analysis_reports", "ORM CRUD", "분석 완료 후 생성", "id, resume_id", "실시간/분석", "Session/API Key", "AnalysisReport"],
];

const commonCodeRows = [
  ["JD_STATUS", "JD 상태", "prepare", "준비", "Y", 1, "작성 중/대기 상태", ""],
  ["JD_STATUS", "JD 상태", "on_going", "진행 중", "Y", 2, "채용 진행 상태", ""],
  ["JD_STATUS", "JD 상태", "closed", "마감", "Y", 3, "채용 마감 상태", ""],
  ["RESUME_STATUS", "지원서 분석 상태", "onqueue", "대기", "Y", 1, "분석 요청 전/대기", ""],
  ["RESUME_STATUS", "지원서 분석 상태", "processing", "분석 중", "Y", 2, "AI 분석 실행 중", ""],
  ["RESUME_STATUS", "지원서 분석 상태", "done", "완료", "Y", 3, "분석 리포트 저장 완료", ""],
  ["CHAT_ROLE", "채팅 역할", "user", "사용자", "Y", 1, "사용자 질문", ""],
  ["CHAT_ROLE", "채팅 역할", "agent", "AI 에이전트", "Y", 2, "AI 응답", ""],
  ["REPORT_GRADE", "리포트 등급", "A", "우수", "Y", 1, "overall_grade", ""],
  ["REPORT_GRADE", "리포트 등급", "B", "양호", "Y", 2, "overall_grade", ""],
  ["REPORT_GRADE", "리포트 등급", "C", "보통", "Y", 3, "overall_grade", ""],
  ["REPORT_GRADE", "리포트 등급", "D/F", "주의/부적합", "Y", 4, "overall_grade", ""],
];

const errorRows = [
  [400, "No matching data found", "200/JSON error", "조회 대상 없음", "400: No matching data found.", "요청 id/권한 확인", "Django API", "error_code.py"],
  [401, "Required field is missing", "200/JSON error", "필수 필드 누락", "401: Required field is missing.", "요청 필드 보완", "Django API", "error_code.py"],
  [402, "Invalid input value", "200/JSON error", "값 형식 오류", "402: Invalid input value.", "허용값/타입 확인", "Django API", "error_code.py"],
  [403, "Authentication is required", "200/JSON error", "미로그인/키 없음", "403: Authentication is required.", "로그인 또는 X-API-Key 확인", "Django API", "error_code.py"],
  [404, "Permission denied", "200/JSON error", "접근 권한 없음", "404: Permission denied.", "소유자/API 키 권한 확인", "Django API", "error_code.py"],
  [405, "Request method is not allowed", "200/JSON error", "허용 메서드 아님", "405: Request method is not allowed.", "POST/GET 확인", "Django API", "error_code.py"],
  [406, "Duplicate data exists", "200/JSON error", "중복 데이터", "406: Duplicate data exists.", "중복 username 등 확인", "Django API", "error_code.py"],
  [407, "Operation is not allowed", "200/JSON error", "허용되지 않은 작업", "407: Operation is not allowed.", "삭제/수정 가능 여부 확인", "Django API", "error_code.py"],
  [500, "Internal server error", "200/JSON error", "예외 발생", "500: Internal server error.", "서버 로그 확인", "Django API", "error_code.py"],
];

const securityRows = [
  ["AUTH-001,AUTH-002,AUTH-003,AUTH-005~007", "없음", "Public", "기본 보안그룹", "HTTPS 권장", "계정/비밀번호 포함", "password masking 필요", "서비스 정책", "회원가입/로그인/재설정"],
  ["AUTH-004,ACC,COMP,KEY,JD-001,JD-004,CHK-001", "Django Session + CSRF", "로그인 사용자", "기본 보안그룹", "HTTPS 권장", "개인/회사/JD 데이터", "세션/비밀번호 마스킹", "서비스 정책", "withCredentials 사용"],
  ["JD-002,JD-003,CHK-002,CHK-003,RES,REP,CHAT", "Django Session 또는 X-API-Key", "소유자 또는 허용 resume", "기본 보안그룹", "HTTPS 권장", "지원서/분석 리포트 포함", "API Key/지원자 정보 마스킹", "서비스 정책", "공유 리포트 화면 지원"],
  ["KEY-001~003", "Django Session", "키 소유자", "기본 보안그룹", "HTTPS 권장", "API Key", "value 마스킹", "서비스 정책", "authorized_resume 검증"],
];

const testRows = [
  ["TC-AUTH-001", "AUTH-003", "정상", "가입된 계정 존재", "username/password 정상", "세션 생성 및 Account 조회", "", "", "", ""],
  ["TC-AUTH-002", "AUTH-003", "오류", "가입된 계정 존재", "password 불일치", "오류 메시지 반환", "", "", "", ""],
  ["TC-JD-001", "JD-001", "정상", "로그인 상태", "필수 JD 필드 입력", "JobDescription 생성", "", "", "", ""],
  ["TC-JD-002", "JD-004", "정상", "JD 존재", "id 전달", "Checklist[] 반환/저장", "", "", "", "AI 호출 환경 필요"],
  ["TC-RES-001", "RES-001", "정상", "JD 존재", "지원서 JSON 입력", "Resume 생성", "", "", "", ""],
  ["TC-RES-002", "RES-003", "정상", "Resume 존재", "id 전달", "AnalysisReport 생성 및 Resume.status=done", "", "", "", "OpenAI 환경 필요"],
  ["TC-REP-001", "REP-001", "정상", "분석 완료", "resume_id 전달", "AnalysisReport[] 및 interview_question 확인", "", "", "", ""],
  ["TC-CHAT-001", "CHAT-001", "정상", "로그인 또는 API Key", "chat[].role=user,message 입력", "agent 메시지 반환", "", "", "", "LangGraph/Pinecone 환경 필요"],
  ["TC-KEY-001", "KEY-001", "정상", "로그인 상태", "authorized_resume=[id]", "AuthKey 생성 및 value 발급", "", "", "", ""],
  ["TC-SEC-001", "RES-002", "권한", "API Key 사용", "허용되지 않은 resume id 조회", "Permission denied 또는 빈 결과", "", "", "", ""],
];

const screenRows = [
  ["SCR-AUTH-001", "로그인", "/login", "인증", "N", "가입 사용자가 세션을 시작하는 진입 화면", "아이디/비밀번호 입력, 로그인, 회원가입/비밀번호 찾기 이동, 테마 전환", "LoginPage, AuthScreen, useAuthSession", "AUTH-001, AUTH-003, ACC-001", "username/password 입력, Account 조회 결과", "/dashboard", "미인증 사용자는 보호 화면 접근 시 로그인으로 이동", "docs/03-frontend/pages-and-routes.md"],
  ["SCR-AUTH-002", "회원가입", "/signup", "인증", "N", "신규 채용 담당자 계정을 생성하는 화면", "ID 중복 확인, 사용자 정보/비밀번호 질문 입력, 가입 완료", "SignupPage, AuthScreen", "AUTH-002, AUTH-005", "Account 생성 요청", "/login", "가입 후 로그인 플로우로 복귀", "docs/03-frontend/pages-and-routes.md"],
  ["SCR-AUTH-003", "비밀번호 찾기", "/password-reset", "인증", "N", "비밀번호 확인 질문으로 계정 접근을 복구하는 화면", "아이디 입력, 질문 조회, 답변 제출, 임시/재설정 비밀번호 확인", "PasswordResetPage, resetStep", "AUTH-006, AUTH-007", "username, verification_answer", "/login", "실제 경로명은 passqestion 유지", "docs/03-frontend/pages-and-routes.md"],
  ["SCR-MAIN-001", "대시보드", "/dashboard", "보호", "Y", "채용 운영 현황을 한눈에 보는 기본 화면", "JD/지원자/분석/크레딧 지표 확인, 지원자 검토 목록 확인, JD 생성/새로고침/분석 화면 이동", "DashboardPage, DashboardMetrics, ApplicantReviewTable, AnalysisSummaryPanel, TaskListPanel", "ACC-001, COMP-001, JD-002, RES-002, REP-001, KEY-002", "AppData dashboard view model", "/company, /jd, /cover-letter, /analysis-report", "로그인 후 기본 진입점", "docs/08-features/recruiting-workspace.md"],
  ["SCR-MAIN-002", "관리자", "/admin", "보호", "Y", "API 키와 운영 권한/지표를 관리하는 화면", "AuthKey 생성, 목록 확인, 수정, 삭제, 생성된 키 확인", "AdminPage, AuthKeyCreateForm, AuthKeyList, useAdminMutations", "KEY-001, KEY-002, KEY-003", "AuthKey, 관리자 요약 데이터", "/shared", "외부 공유용 X-API-Key 발급", "docs/03-frontend/state-and-api-adapters.md"],
  ["SCR-MAIN-003", "회사 정보", "/company", "보호", "Y", "AI 분석 기준이 되는 회사 프로필을 입력하는 화면", "회사명/직원 수/회사 소개/팀 구성/채용 스타일 입력, 완성도 확인, 저장", "CompanyPage, CompanyProfileForm, CompanyCompletionPanel", "COMP-001, COMP-002", "CompanyInfo", "/jd", "분석 품질을 위한 선행 입력 화면", "docs/08-features/recruiting-workspace.md"],
  ["SCR-MAIN-004", "JD 관리", "/jd", "보호", "Y", "직무기술서와 평가 체크리스트를 관리하는 화면", "JD 목록 선택, 신규 작성, 수정, 삭제, 체크리스트 생성/조회, 지원서 입력 화면 이동", "JdPage, JdListPanel, JdEditorPanel, useJdPageData, useJdMutations", "JD-001, JD-002, JD-003, JD-004, CHK-001, CHK-002, CHK-003", "JobDescription, Checklist", "/cover-letter, /recruitment-post", "JD 분석은 AI 체크리스트 생성과 연결", "docs/08-features/recruiting-workspace.md"],
  ["SCR-MAIN-005", "지원서 입력", "/cover-letter", "보호", "Y", "JD별 지원서를 등록하고 분석 요청까지 진행하는 화면", "JD 선택, 지원서 목록 선택, 신규 작성, 수정, 삭제, 분석 요청, 분석 후 채팅 이동", "CoverLetterPage, CoverLetterInputPanel, CoverLetterUploadPanel, useCoverLetterPageData, useResumeMutations", "RES-001, RES-002, RES-003, RES-004, JD-002", "Resume, AnalysisReport", "/analysis-report, /chat", "분석 요청 시 Resume.status가 processing/done으로 변경", "docs/08-features/resume-analysis.md"],
  ["SCR-MAIN-006", "분석 리포트", "/analysis-report", "보호", "Y", "AI 분석 결과와 면접 질문을 조회하는 화면", "지원자/리포트 선택, 리포트 탭 확인, 면접 질문 확인, resumeId 쿼리 선택 유지", "AnalysisReportPage, useAnalysisReportPageData", "REP-001, REP-002, RES-002, JD-002", "AnalysisReport, InterviewQuestion", "/chat, /shared", "interview_question JSON에서 질문/답변/목적 표시", "docs/08-features/resume-analysis.md"],
  ["SCR-MAIN-007", "마이페이지", "/mypage", "보호", "Y", "사용자 프로필/보안/회사 요약을 확인하고 수정하는 화면", "계정 정보 수정, 비밀번호 변경, 회사 요약 확인, 로그아웃 이동", "MyPage, AccountSettingsForm, SecuritySettingsForm, ProfileSummaryCard", "ACC-001, ACC-002, COMP-001", "Account, CompanyInfo summary", "/dashboard", "계정 수정 payload에서 id/username/account_hash 제외", "docs/03-frontend/state-and-api-adapters.md"],
  ["SCR-MAIN-008", "AI 채팅", "/chat", "보호", "FAB", "JD/리포트/면접 질문/사용 가이드를 문맥으로 질의하는 전체 화면 채팅", "추천 질문 확인, 메시지 전송, 대화 초기화, 분석/문서 검색 답변 확인", "ChatPage, ChatWindowPanel, DocumentChatProvider, useChatPageData", "CHAT-001, JD-002, REP-001", "chat messages, response.message", "/analysis-report", "FAB와 동일한 채팅 state 공유", "docs/08-features/document-chat.md"],
  ["SCR-MAIN-009", "문서 검색 FAB", "전역 위젯", "보호", "FAB", "현재 화면을 떠나지 않고 빠르게 HR/문서 질문을 하는 보조 UI", "위젯 열기, 범위 칩 선택, 빠른 질문 클릭, 메시지 전송", "DocumentChatFab, DocumentChatProvider, chatContextData", "CHAT-001", "chat scope, 추천 자료", "/chat", "/chat 화면에서는 FAB 미표시", "docs/08-features/document-chat.md"],
  ["SCR-PLAN-001", "모집 공고", "/recruitment-post", "후순위 MVP", "N", "복수 JD 기반 모집 공고를 미리보는 화면", "JD 복수 선택, 선택 요약 확인, 공고 미리보기, 생성/다운로드 시도", "RecruitmentPostPage, JdSelectionPanel, RecruitmentPreviewPanel", "JD-002, COMP-001", "회사/JD 기반 프론트 조합 미리보기", "-", "backend API 미구현으로 unsupportedBackendFeature 처리", "docs/08-features/recruiting-workspace.md"],
  ["SCR-PLAN-002", "자소서 문항 템플릿", "/cover-letter-template", "후순위 MVP", "N", "JD와 면접 질문 기반 문항/가이드를 표시하는 화면", "JD 요약 확인, 생성된 질문/가이드 확인, 문서 다운로드 시도", "CoverLetterTemplatePage", "REP-001, JD-002", "InterviewQuestion view model", "-", "문항 생성/다운로드 backend API 미구현", "docs/08-features/resume-analysis.md"],
  ["SCR-SHARE-001", "공유 리포트", "/shared", "공유", "N", "외부 사용자가 API 키로 특정 지원자 분석 결과를 조회하는 화면", "resumeId 확인, API Key 입력, 공유 번들 조회, 리포트/질문 확인, 공유 화면 채팅", "SharedReportPage", "JD-002, RES-002, REP-001, CHAT-001", "Resume, JobDescription, AnalysisReport, questions", "-", "AppShell/FAB 없이 독립 레이아웃, 미인증 접근 허용", "docs/03-frontend/pages-and-routes.md"],
];

const userFlowRows = [
  [1, "계정 시작", "방문자", "/login", "로그인 화면 진입", "세션 상태 확인 후 미인증이면 로그인 화면 유지", "AUTH-001, AUTH-003", "로그인 성공 시 /dashboard 이동", "실패 시 오류 메시지", "채용 담당자가 작업 공간에 진입"],
  [2, "계정 시작", "신규 사용자", "/signup", "회원가입 정보와 비밀번호 확인 질문 입력", "아이디 중복 확인 후 Account 생성", "AUTH-005, AUTH-002", "/login 복귀 또는 로그인 유도", "중복 ID/필수값 누락 처리", "서비스 사용 계정 생성"],
  [3, "계정 복구", "기존 사용자", "/password-reset", "아이디 입력 후 질문에 답변", "질문 조회 후 답변 검증 및 비밀번호 반환/재설정", "AUTH-006, AUTH-007", "/login 이동", "질문 없음/답변 불일치", "로그인 불가 상황 복구"],
  [4, "초기 로딩", "로그인 사용자", "/dashboard", "대시보드 진입", "AppData를 로드하고 account/company/JD/resume/report/key 데이터를 조합", "ACC-001, COMP-001, JD-002, RES-002, REP-001, KEY-002", "운영 지표와 작업 목록 표시", "로딩/에러 상태 표시", "전체 채용 현황 파악"],
  [5, "분석 기준 설정", "채용 담당자", "/company", "회사 프로필과 채용 기준 입력", "CompanyInfo를 저장하고 캐시 무효화 후 최신 데이터 재조회", "COMP-001, COMP-002", "회사 정보 완성도와 요약 갱신", "필수값/형식 오류", "AI 분석의 회사 맥락 확보"],
  [6, "JD 준비", "채용 담당자", "/jd", "JD를 새로 작성하거나 기존 JD 수정", "JobDescription 생성/수정/삭제", "JD-001, JD-002, JD-003", "JD 목록과 상세 패널 갱신", "권한 없음/필수값 누락", "지원자 평가 기준 작성"],
  [7, "평가 기준 생성", "채용 담당자", "/jd", "JD 분석 또는 체크리스트 생성 요청", "JD 내용을 바탕으로 체크리스트를 생성/저장", "JD-004, CHK-001, CHK-002", "Checklist[] 표시", "AI 환경 오류/접근 권한 오류", "평가 항목 자동화"],
  [8, "지원서 등록", "채용 담당자", "/cover-letter", "JD 선택 후 지원자 정보와 자기소개서 입력", "Resume 생성 또는 수정", "RES-001, RES-002, RES-004", "지원서 목록과 입력 패널 갱신", "JD 미선택/필수값 누락", "분석 대상 지원서 확보"],
  [9, "지원서 분석", "채용 담당자", "/cover-letter", "선택 지원서 분석 요청", "resume/get으로 대상 확인 후 resume/analyze 실행, 리포트 저장", "RES-002, RES-003", "AnalysisReport 생성, Resume.status=done", "OpenAI 오류/권한 오류", "지원자 평가 결과 생성"],
  [10, "결과 확인", "채용 담당자", "/analysis-report", "분석 리포트와 면접 질문 확인", "resumeId 쿼리 기준 선택 항목 유지, 리포트/질문 view model 구성", "REP-001, RES-002, JD-002", "리포트 탭과 질문 패널 표시", "리포트 없음", "면접 준비와 평가 근거 확인"],
  [11, "후속 질문", "채용 담당자", "/chat 또는 FAB", "지원자/JD/리포트에 대해 질문 입력", "대화 role 변환 후 LangGraph/Pinecone 기반 답변 생성", "CHAT-001", "agent 응답 메시지 표시", "빈 메시지/검색 실패", "분석 결과를 대화형으로 탐색"],
  [12, "공유 준비", "관리자/채용 담당자", "/admin", "공유용 API 키 생성 및 접근 resume 지정", "AuthKey 생성, authorized_resume 권한 검증", "KEY-001, KEY-002, KEY-003", "API Key 발급/마스킹 목록 표시", "권한 없는 resume id", "외부 공유 범위 제어"],
  [13, "외부 공유", "외부 검토자", "/shared?resumeId=...", "API Key 입력 후 공유 리포트 조회", "X-API-Key로 resume/JD/report bundle 조회", "JD-002, RES-002, REP-001", "공유 리포트와 질문 표시", "키 없음/권한 없음", "로그인 없이 제한된 결과 공유"],
  [14, "모집 공고 보조", "채용 담당자", "/recruitment-post", "복수 JD 선택 후 공고 미리보기 확인", "프론트에서 회사/JD 정보로 preview 조합", "COMP-001, JD-002", "모집 공고 미리보기 표시", "생성/다운로드 API 미구현", "후순위 MVP 기능 확인"],
  [15, "문항 템플릿 보조", "채용 담당자", "/cover-letter-template", "JD 기반 문항/가이드 확인", "면접 질문 view model을 문항 가이드로 표시", "REP-001, JD-002", "문항/가이드 표시", "생성/다운로드 API 미구현", "후순위 MVP 기능 확인"],
  [16, "계정 관리", "채용 담당자", "/mypage", "프로필/비밀번호/회사 요약 확인 및 수정", "Account 수정, 회사 요약 조회", "ACC-001, ACC-002, COMP-001", "마이페이지 정보 갱신", "현재 비밀번호 불일치", "사용자 계정 유지관리"],
  [17, "종료", "로그인 사용자", "AppShell", "로그아웃 클릭", "세션 종료 후 인증 상태 초기화", "AUTH-004", "/login 이동", "네트워크 오류", "작업 세션 종료"],
];

const checklistRows = [
  [1, "API ID가 frontend-api-id-map.md와 일치한다", "Y", "프로젝트팀", docDate, ""],
  [2, "실제 URL은 backend/api/urls.py 기준으로 작성했다", "Y", "프로젝트팀", docDate, ""],
  [3, "요청 필드는 backendClient.ts 타입과 Django view 검증 기준을 반영했다", "Y", "프로젝트팀", docDate, ""],
  [4, "응답 필드는 backend/api/models.py to_dict 계약을 반영했다", "Y", "프로젝트팀", docDate, ""],
  [5, "세션/CSRF/API Key 인증 방식을 구분했다", "Y", "프로젝트팀", docDate, ""],
  [6, "공통 코드와 오류 코드를 별도 시트에 정리했다", "Y", "프로젝트팀", docDate, ""],
  [7, "AI 분석/채팅처럼 외부 환경이 필요한 테스트는 비고에 표시했다", "Y", "프로젝트팀", docDate, ""],
  [8, "화면 정의 시트에 라우트, 목적, 주요 동작, 연결 API를 정리했다", "Y", "프로젝트팀", docDate, ""],
  [9, "사용자 플로우 시트에 로그인부터 분석·공유까지의 흐름을 단계별로 정리했다", "Y", "프로젝트팀", docDate, ""],
];

const noFileRows = [
  ["N/A", "현재 별도 파일 업로드 API 없음", "JSON", "UTF-8", "-", "N", "HTTPS", "/api/*", "서비스 정책", "API error envelope", "지원서 등록은 JSON 필드 기반"],
];

const noMqRows = [
  ["N/A", "미사용", "미사용", "Django API", "React Frontend", "JSON over HTTP", "request/response", "API 재호출", "미사용", "현재 메시지 브로커 없음"],
];

const batchRows = [
  ["BATCH-CRAWL", "채용공고 크롤러", "수동/필요 시", "-", "-", "data-pipeline/crawling/*_scraper.py", "스크립트 재실행", "운영 정책", "데이터 담당", "현재 API 인터페이스와 분리"],
  ["BATCH-EMBED", "문서 임베딩 업로드", "수동/필요 시", "-", "크롤링/문서 정제", "data-pipeline/embedding/*.ipynb", "노트북 재실행", "운영 정책", "AI 담당", "Pinecone namespace 사용"],
];

const approvalRows = [
  ["작성", "프로젝트팀", "SKN26", "인터페이스 정의", docDate, "", ""],
  ["검토", "", "", "백엔드/프론트 검토", "", "", ""],
  ["승인", "", "", "최종 승인", "", "", ""],
];

const sheetConfigs = [
  {
    name: "인터페이스 목록",
    headers: ["인터페이스 ID", "도메인", "화면/기능", "API명", "Method", "URL/Endpoint", "인증방식", "호출주체", "Django View", "주요 요청값", "주요 응답", "관련 문서", "비고"],
    rows: apiRows,
    widths: [92, 58, 118, 150, 76, 154, 142, 156, 132, 184, 150, 184, 190],
  },
  {
    name: "인터페이스 명세",
    headers: ["인터페이스 ID", "구분", "시스템명", "데이터저장소/API", "속성명", "데이터타입", "길이", "필수여부", "설명", "매핑규칙", "프론트 타입/모델", "비고"],
    rows: interfaceSpecRows,
    widths: [94, 74, 110, 138, 148, 112, 72, 72, 178, 178, 160, 168],
  },
  {
    name: "API 명세",
    headers: ["인터페이스 ID", "API명", "Method", "URL/Endpoint", "Protocol", "Content-Type", "인증방식", "도메인/화면", "Django View", "프론트 호출부", "성공 응답", "비고"],
    rows: apiSpecRows,
    widths: [94, 150, 80, 156, 78, 126, 142, 150, 132, 180, 164, 210],
  },
  {
    name: "요청 필드",
    headers: ["인터페이스 ID", "Depth", "필드명", "물리명", "데이터타입", "필수여부", "허용값/코드", "설명", "샘플값", "출처/모델", "검증/제약", "비고"],
    rows: requestRows,
    widths: [96, 58, 176, 156, 100, 70, 142, 190, 160, 176, 170, 160],
  },
  {
    name: "응답 필드",
    headers: ["인터페이스 ID", "Depth", "필드명", "물리명", "데이터타입", "필수여부", "성공/오류", "허용값/코드", "설명", "샘플값", "출처/모델", "비고"],
    rows: responseRows,
    widths: [110, 58, 184, 158, 108, 70, 86, 142, 190, 156, 176, 180],
  },
  {
    name: "화면 정의",
    headers: ["화면 ID", "화면명", "Route", "구분", "Nav 표시", "목적", "주요 동작", "주요 컴포넌트/훅", "연결 API", "입력/출력 데이터", "다음 이동", "상태/비고", "관련 문서"],
    rows: screenRows,
    widths: [108, 136, 136, 90, 82, 240, 310, 270, 220, 220, 170, 220, 220],
  },
  {
    name: "사용자 플로우",
    headers: ["Step", "플로우 구분", "사용자/Actor", "화면/Route", "사용자 행동", "시스템 동작", "호출 API/데이터", "결과 화면/데이터", "예외/분기", "목적"],
    rows: userFlowRows,
    widths: [60, 118, 130, 142, 240, 300, 220, 230, 190, 230],
  },
  {
    name: "파일 인터페이스",
    headers: ["인터페이스 ID", "파일명규칙", "파일유형", "인코딩", "구분자", "헤더유무", "압축/암호화", "송수신경로", "보관기간", "실패처리", "비고"],
    rows: noFileRows,
    widths: [96, 210, 92, 80, 74, 74, 110, 130, 100, 130, 210],
  },
  {
    name: "DB 인터페이스",
    headers: ["인터페이스 ID", "DBMS", "Schema", "Table/View", "접근방식", "트랜잭션", "KEY 컬럼", "처리주기", "권한", "비고"],
    rows: dbRows,
    widths: [96, 164, 118, 150, 110, 130, 170, 118, 142, 190],
  },
  {
    name: "MQ 인터페이스",
    headers: ["인터페이스 ID", "Broker", "Queue/Topic", "Producer", "Consumer", "메시지 포맷", "보장수준", "재처리정책", "DLQ", "비고"],
    rows: noMqRows,
    widths: [96, 90, 110, 122, 128, 132, 110, 130, 82, 210],
  },
  {
    name: "공통코드",
    headers: ["코드그룹ID", "코드그룹명", "코드값", "코드명", "사용여부", "정렬순서", "설명", "비고"],
    rows: commonCodeRows,
    widths: [132, 150, 120, 112, 80, 80, 230, 150],
  },
  {
    name: "오류코드",
    headers: ["오류코드", "오류명", "HTTP Status", "발생조건", "메시지", "조치방법", "담당시스템", "비고"],
    rows: errorRows,
    widths: [82, 178, 118, 154, 230, 190, 112, 142],
  },
  {
    name: "보안권한",
    headers: ["인터페이스 번호", "인증방식", "권한/Role", "IP 제한", "암호화", "개인정보여부", "로그마스킹", "보관기간", "비고"],
    rows: securityRows,
    widths: [210, 170, 140, 120, 110, 160, 170, 110, 220],
  },
  {
    name: "배치스케줄",
    headers: ["인터페이스 번호", "배치명", "실행주기", "실행시각", "선행작업", "후행작업", "재실행방법", "SLA", "담당자", "비고"],
    rows: batchRows,
    widths: [112, 160, 110, 86, 150, 190, 136, 92, 104, 220],
  },
  {
    name: "테스트케이스",
    headers: ["TC ID", "인터페이스 번호", "테스트유형", "사전조건", "입력조건", "예상결과", "실제결과", "결과(P/F)", "결함ID", "비고"],
    rows: testRows,
    widths: [112, 112, 92, 170, 210, 230, 120, 92, 86, 190],
  },
  {
    name: "승인",
    headers: ["구분", "성명", "부서", "역할", "승인일", "서명", "비고"],
    rows: approvalRows,
    widths: [84, 112, 118, 160, 110, 110, 180],
  },
  {
    name: "체크리스트",
    headers: ["No", "점검항목", "확인여부", "담당자", "일자", "비고"],
    rows: checklistRows,
    widths: [54, 390, 86, 110, 110, 190],
  },
];

function getSheet(workbook, name) {
  try {
    return workbook.worksheets.getItem(name);
  } catch {
    return workbook.worksheets.add(name);
  }
}

function writeSingle(sheet, address, value) {
  sheet.getRange(address).values = [[value]];
}

function writeBlock(sheet, startRow, startCol, rows) {
  if (!rows.length) return;
  sheet.getRangeByIndexes(startRow - 1, startCol - 1, rows.length, rows[0].length).values = rows;
}

function clearContents(sheet, cols, rows = 260) {
  sheet.getRangeByIndexes(5, 0, rows, cols).clear({ applyTo: "contents" });
}

function styleRange(range, style) {
  try {
    range.format = style;
  } catch {
    // Keep the workbook usable even if a viewer-specific style option is rejected.
  }
}

function setColumnWidths(sheet, widths, maxRows = 160) {
  widths.forEach((width, index) => {
    try {
      sheet.getRangeByIndexes(0, index, maxRows, 1).format.columnWidthPx = width;
    } catch {
      // Width is cosmetic; data correctness is more important.
    }
  });
}

function setDocHeader(sheet, colCount) {
  writeSingle(sheet, "B3", docName);
  writeSingle(sheet, "B4", version);
  if (colCount >= 7) {
    writeSingle(sheet, "G3", docDate);
    writeSingle(sheet, "G4", author);
  }
}

function formatTable(sheet, colCount, rowCount, widths) {
  const header = sheet.getRangeByIndexes(5, 0, 1, colCount);
  const body = sheet.getRangeByIndexes(6, 0, Math.max(rowCount, 1), colCount);
  styleRange(header, {
    fill: "#E2E8F0",
    font: { bold: true, color: "#111827" },
    wrapText: true,
  });
  styleRange(body, {
    fill: "#FFFFFF",
    font: { color: "#111827" },
    wrapText: true,
  });
  try {
    header.format.rowHeightPx = 34;
    body.format.rowHeightPx = 32;
  } catch {}
  setColumnWidths(sheet, widths, Math.max(rowCount + 8, 40));
  try {
    sheet.freezePanes.freezeRows(6);
  } catch {}
}

function writeConfiguredSheet(workbook, config) {
  const sheet = getSheet(workbook, config.name);
  const colCount = config.headers.length;
  clearContents(sheet, colCount);
  writeSingle(sheet, "A1", config.name);
  setDocHeader(sheet, colCount);
  writeBlock(sheet, 6, 1, [config.headers]);
  writeBlock(sheet, 7, 1, config.rows);
  formatTable(sheet, colCount, config.rows.length, config.widths);
}

function writeMainSheet(workbook) {
  const sheet = getSheet(workbook, "인터페이스 정의서");

  writeSingle(sheet, "A3", docDate);
  writeSingle(sheet, "C3", version);
  writeSingle(sheet, "E3", author);
  writeSingle(sheet, "G3", "");
  writeSingle(sheet, "I3", "프로젝트 맞춤 API 컬럼 정의");
  writeSingle(sheet, "B7", "HumouR");
  writeSingle(sheet, "H7", "채용 보조 시스템");
  writeSingle(sheet, "B8", "최종 프로젝트");
  writeSingle(sheet, "H8", docDate);
  writeSingle(sheet, "L8", version);

  writeSingle(sheet, "A13", "인터페이스\nID");
  writeSingle(sheet, "B13", "호출 정보");
  writeSingle(sheet, "F13", "전송");
  writeSingle(sheet, "H13", "처리/응답");
  writeSingle(sheet, "L13", "관련\n문서");
  writeSingle(sheet, "M13", "비고");
  sheet.getRange("B14:K14").values = [[
    "도메인",
    "API명/범위",
    "Method",
    "URL/Endpoint",
    "인증방식",
    "호출빈도",
    "프론트 호출부",
    "Django View",
    "주요 응답",
    "상태코드",
  ]];

  const summaryRows = [
    ["AUTH-001~007", "AUTH", "인증/회원가입/비밀번호", "GET/POST", "/api/csrf/, /api/login/ 등", "없음/세션", "사용자 액션", "AuthPages", "account_*", "login/signin/password", "공통 envelope", "API 문서", "passqestion 경로 유의"],
    ["ACC-001~002", "ACC", "계정 조회/수정", "POST", "/api/account/*", "Session", "앱 초기화/마이페이지", "useAppData", "account_*", "Account", "공통 envelope", "API 문서", ""],
    ["COMP-001~002", "COMP", "회사 정보", "POST", "/api/compinfo/*", "Session", "회사 페이지", "CompanyPage", "compinfo_*", "CompanyInfo", "공통 envelope", "API 문서", ""],
    ["KEY-001~003", "KEY", "인증키 관리", "POST", "/api/authkey/*", "Session", "관리자 화면", "AdminPage", "authkey_*", "AuthKey", "공통 envelope", "API 문서", "value 마스킹"],
    ["JD-001~004", "JD", "JD CRUD/분석", "POST", "/api/jd/*", "Session/API Key", "JD 화면/공유", "JdPage", "jd_*", "JobDescription/Checklist", "공통 envelope", "API 문서", ""],
    ["CHK-001~003", "CHK", "체크리스트 CRUD", "POST", "/api/checklist/*", "Session/API Key", "JD 화면", "useJdPageData", "checklist_*", "Checklist", "공통 envelope", "API 문서", ""],
    ["RES-001~004", "RES", "지원서 CRUD/분석", "POST", "/api/resume/*", "Session/API Key", "지원서/분석", "CoverLetterPage", "resume_*", "Resume/AnalysisReport", "공통 envelope", "API 문서", "AI 호출 포함"],
    ["REP-001~002", "REP", "분석 리포트", "POST", "/api/report/*", "Session/API Key", "분석/공유", "AnalysisReportPage", "report_*", "AnalysisReport", "공통 envelope", "API 문서", "interview_question 포함"],
    ["CHAT-001", "CHAT", "AI 채팅", "POST", "/api/chat/", "Session/API Key", "채팅/FAB", "ChatPage", "chat", "response.message", "공통 envelope", "API 문서", "LangGraph/Pinecone"],
  ];
  sheet.getRange("A15:M25").clear({ applyTo: "contents" });
  writeBlock(sheet, 15, 1, summaryRows);

  writeSingle(sheet, "A29", "인터페이스\nID");
  writeSingle(sheet, "B29", "요청 데이터");
  writeSingle(sheet, "G29", "처리");
  writeSingle(sheet, "H29", "응답 데이터");
  writeSingle(sheet, "M29", "비고");
  sheet.getRange("B30:L30").values = [[
    "도메인/모델",
    "필드명",
    "데이터타입",
    "필수",
    "설명",
    "Django View",
    "응답 필드",
    "데이터타입",
    "성공/오류",
    "프론트 타입",
    "시스템명",
  ]];
  const mainDetailRows = interfaceSpecRows.slice(0, 20).map((row) => [
    row[0],
    row[2],
    row[4],
    row[5],
    row[7],
    row[8],
    row[9],
    row[4],
    row[5],
    "성공",
    row[10],
    "HumouR",
    row[11],
  ]);
  sheet.getRange("A31:M50").clear({ applyTo: "contents" });
  writeBlock(sheet, 31, 1, mainDetailRows);

  setColumnWidths(sheet, [92, 82, 132, 92, 154, 126, 96, 142, 132, 154, 110, 128, 160], 55);
  styleRange(sheet.getRange("A13:M14"), { fill: "#E5E7EB", font: { bold: true, color: "#111827" }, wrapText: true });
  styleRange(sheet.getRange("A29:M30"), { fill: "#E5E7EB", font: { bold: true, color: "#111827" }, wrapText: true });
  styleRange(sheet.getRange("A15:M25"), { wrapText: true });
  styleRange(sheet.getRange("A31:M50"), { wrapText: true });
}

async function renderSheet(workbook, sheetName) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const previewPath = path.join(previewDir, `${sheetName}.png`);
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
  return previewPath;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });

  const input = await FileBlob.load(inputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);

  writeMainSheet(workbook);
  for (const config of sheetConfigs) {
    writeConfiguredSheet(workbook, config);
  }

  const docInfo = getSheet(workbook, "문서정보");
  docInfo.getRange("A6:C16").clear({ applyTo: "contents" });
  writeBlock(docInfo, 6, 1, [
    ["항목", "내용", "비고"],
    ["문서명", docName, "프로젝트 맞춤 컬럼 반영"],
    ["시스템명", "HumouR", "채용 담당자용 채용 보조 시스템"],
    ["작성일자", docDate, ""],
    ["버전", version, ""],
    ["작성자", author, ""],
    ["근거", "backend/api/urls.py, backend/api/views, frontend/src/api/backendClient.ts, frontend/src/data/backendTypes.ts", ""],
    ["범위", "Django API, 요청/응답 필드, 화면 정의, 사용자 플로우, DB/보안/오류/테스트", ""],
    ["추가 시트", "화면 정의, 사용자 플로우", "라우트/목적/동작/사용 흐름 보강"],
  ]);
  formatTable(docInfo, 3, 9, [110, 560, 300]);

  const revision = getSheet(workbook, "제개정이력");
  revision.getRange("A6:E12").clear({ applyTo: "contents" });
  writeBlock(revision, 6, 1, [
    ["날짜", "버전", "작성자", "승인자", "내용"],
    [docDate, version, author, "", "프로젝트 API 기준 컬럼, 화면 정의, 사용자 플로우 작성"],
  ]);
  formatTable(revision, 5, 2, [120, 90, 120, 120, 420]);

  const inspectList = await workbook.inspect({
    kind: "table",
    range: "인터페이스 목록!A6:M20",
    include: "values,formulas",
    tableMaxRows: 20,
    tableMaxCols: 13,
    maxChars: 8000,
  });
  console.log(inspectList.ndjson);

  const inspectReq = await workbook.inspect({
    kind: "table",
    range: "요청 필드!A6:L30",
    include: "values,formulas",
    tableMaxRows: 25,
    tableMaxCols: 12,
    maxChars: 10000,
  });
  console.log(inspectReq.ndjson);

  const inspectScreens = await workbook.inspect({
    kind: "table",
    range: "화면 정의!A6:M18",
    include: "values,formulas",
    tableMaxRows: 13,
    tableMaxCols: 13,
    maxChars: 9000,
  });
  console.log(inspectScreens.ndjson);

  const inspectFlow = await workbook.inspect({
    kind: "table",
    range: "사용자 플로우!A6:J18",
    include: "values,formulas",
    tableMaxRows: 13,
    tableMaxCols: 10,
    maxChars: 9000,
  });
  console.log(inspectFlow.ndjson);

  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "final formula error scan",
    maxChars: 4000,
  });
  console.log(formulaErrors.ndjson);

  const sheetNames = ["인터페이스 정의서", "문서정보", "제개정이력", ...sheetConfigs.map((config) => config.name)];
  const rendered = [];
  for (const sheetName of sheetNames) {
    try {
      rendered.push(await renderSheet(workbook, sheetName));
    } catch (error) {
      console.log(`RENDER_SKIPPED ${sheetName}: ${error?.message ?? error}`);
    }
  }
  console.log(`RENDERED ${rendered.length}/${sheetNames.length}`);

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  console.log(`OUTPUT ${outputPath}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
