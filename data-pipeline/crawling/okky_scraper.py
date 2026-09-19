import csv
import json
import re
from dataclasses import asdict, dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
ALL_CSV = BASE_DIR / "job_conditions.csv"
QUALIFICATION_CSV = BASE_DIR / "qualification_requiremnets.csv"
PREFERRED_CSV = BASE_DIR / "job_preferred_conditions.csv"

SITE = "okky"
BASE_URL = "https://jobs.okky.kr"
API_BASE_URL = f"{BASE_URL}/api/okky-web"
MAX_JOBS = 20


@dataclass(frozen=True)
class ConditionRow:
    site: str
    company: str
    position_id: str
    title: str
    url: str
    condition_type: str
    item_order: int
    condition: str


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"br", "p", "li", "div", "tr", "h1", "h2", "h3", "strong"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"p", "li", "div", "tr", "h1", "h2", "h3", "strong"}:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)

    def lines(self):
        text = unescape("".join(self.parts))
        lines = [" ".join(line.split()) for line in text.splitlines()]
        return [line for line in lines if line]


def request_json(url):
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def html_to_lines(html):
    parser = TextParser()
    parser.feed(html or "")
    return parser.lines()


def clean_text(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip(" -ㆍ•·\t\r\n")
    return value


def unique_items(items):
    result = []
    seen = set()
    for item in items:
        item = clean_text(item)
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def normalize_title(job):
    response = job.get("recruitResponse") or {}
    text = " ".join(
        str(value or "")
        for value in [
            job.get("title"),
            response.get("dutyName"),
            response.get("positionCategoryName"),
            " ".join(tag.get("name", "") for tag in response.get("tags") or []),
        ]
    ).lower()

    if any(keyword in text for keyword in ["qa", "테스트", "test", "검증"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "unreal", "그래픽", "graphics"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security", "secops"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["ios", "android", "flutter", "react native", "모바일", "앱개발"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "클라우드", "aws", "kubernetes", "k8s", "서버관리"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data", "db", "dba", "sql", "etl", "분석"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "ml", "머신러닝", "딥러닝", "llm", "인공지능"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack"]):
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["프론트", "frontend", "front-end", "react", "vue", "typescript", "javascript"]):
        return "프론트엔드 개발자"
    if any(keyword in text for keyword in ["백엔드", "backend", "back-end", "서버", "java", "spring", "node", "python"]):
        return "백엔드 개발자"
    return None


def fetch_jobs_by_type(job_type, limit):
    params = {
        "jobType": job_type,
        "page": 0,
        "size": limit,
        "sort": "ID",
        "order": "DESC",
    }
    data = request_json(f"{API_BASE_URL}/jobs/recruits?{urlencode(params)}")
    return data.get("content") or []


def fetch_developer_jobs(limit):
    jobs = []
    seen = set()
    for job_type in ["FULLTIME", "CONTRACT"]:
        for job in fetch_jobs_by_type(job_type, limit):
            position_id = str(job.get("id") or "")
            if not position_id or position_id in seen:
                continue
            title = normalize_title(job)
            if not title:
                continue
            seen.add(position_id)
            jobs.append({**job, "normalizedTitle": title})

    jobs.sort(key=lambda item: (item.get("dateCreated") or "", item.get("id") or 0), reverse=True)
    return jobs[:limit]


def fetch_detail(position_id):
    return request_json(f"{API_BASE_URL}/jobs/recruits/{position_id}/without-view-increment")


def career_text(min_career, max_career):
    if min_career in (None, ""):
        return ""
    if min_career == 99:
        return "경력 무관"
    if min_career == 0:
        return "신입"
    if max_career in (None, "", 99):
        return f"경력 {min_career}년 이상"
    return f"경력 {min_career}년 이상 ~ {max_career}년 미만"


def academic_text(value):
    labels = {
        "NONE": "학력 무관",
        "HS_GRADUATE": "고졸 이상",
        "ASSOCIATE": "전문학사 이상",
        "BACHELOR": "학사 이상",
        "MASTER": "석사 이상",
        "PHD": "박사 이상",
    }
    return labels.get(value or "", "")


def split_sections(lines):
    sections = {}
    current = "기타"
    heading_patterns = [
        (r"주요\s*업무|담당\s*업무|업무\s*내용", "주요업무"),
        (r"자격\s*요건|지원\s*자격|필수\s*요건|필수\s*사항|요구\s*사항", "자격요건"),
        (r"우대\s*사항|우대\s*조건|우대\s*요건", "우대조건"),
        (r"근무\s*조건|복지|혜택|전형|제출\s*서류", "기타"),
    ]

    for line in lines:
        compact = re.sub(r"\s+", "", line)
        matched = False
        for pattern, label in heading_patterns:
            if re.search(pattern, compact, re.I):
                current = label
                matched = True
                remainder = re.sub(pattern, "", line, flags=re.I).strip(" :-")
                if remainder:
                    sections.setdefault(current, []).append(remainder)
                break
        if not matched:
            sections.setdefault(current, []).append(line)
    return sections


def extract_conditions(detail):
    response = detail.get("recruitResponse") or {}
    positions = response.get("jobPositions") or []
    if not positions:
        return [], []

    position = positions[0]
    lines = html_to_lines(position.get("description") or "")
    sections = split_sections(lines)

    base_qualification = [
        career_text(position.get("minCareer"), position.get("maxCareer")),
        academic_text(position.get("academicBackground")),
    ]
    described_qualification = sections.get("자격요건") or []

    preferred_markers = ("우대", "우선", "가산", "경험자", "가능자")
    inline_preferred = [
        line
        for line in described_qualification
        if any(marker in line for marker in preferred_markers)
    ]
    qualification = [
        *base_qualification,
        *[line for line in described_qualification if line not in inline_preferred],
    ]

    preferred = [*(sections.get("우대조건") or []), *inline_preferred]
    if not preferred:
        preferred = [line for line in lines if "우대" in line and line not in qualification]

    return unique_items(qualification), unique_items(preferred)


def company_name_from(job, detail):
    response = job.get("recruitResponse") or {}
    company = response.get("company") or {}
    if company.get("name"):
        return company["name"]

    detail_response = detail.get("recruitResponse") or {}
    company_info = detail_response.get("companyInfo") or {}
    detail_company = company_info.get("company") or {}
    return detail_company.get("name") or ""


def make_rows():
    rows = []
    for job in fetch_developer_jobs(MAX_JOBS):
        position_id = str(job.get("id") or "")
        detail = fetch_detail(position_id)
        company = company_name_from(job, detail)
        title = job["normalizedTitle"]
        url = f"{BASE_URL}/recruits/{position_id}"
        qualification, preferred = extract_conditions(detail)

        for index, condition in enumerate(qualification, 1):
            rows.append(
                ConditionRow(SITE, company, position_id, title, url, "qualification", index, condition)
            )
        for index, condition in enumerate(preferred, 1):
            rows.append(
                ConditionRow(SITE, company, position_id, title, url, "preferred", index, condition)
            )
    return rows


def write_csv(path, rows):
    fieldnames = list(ConditionRow.__dataclass_fields__.keys())
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(asdict(row) for row in rows)


def main():
    rows = make_rows()
    qualification_rows = [row for row in rows if row.condition_type == "qualification"]
    preferred_rows = [row for row in rows if row.condition_type == "preferred"]

    write_csv(ALL_CSV, rows)
    write_csv(QUALIFICATION_CSV, qualification_rows)
    write_csv(PREFERRED_CSV, preferred_rows)

    print(f"developer jobs: {len(set(row.position_id for row in rows))}")
    print(f"job_conditions: {len(rows)} rows")
    print(f"qualification_requiremnets: {len(qualification_rows)} rows")
    print(f"job_preferred_conditions: {len(preferred_rows)} rows")


if __name__ == "__main__":
    main()
