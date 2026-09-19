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

SITE = "catch"
BASE_URL = "https://www.catch.co.kr"
API_BASE_URL = f"{BASE_URL}/api/v1.0"
MAX_JOBS = 20

DEVELOPER_WORK_CODES = [
    "0601",  # 웹개발
    "0602",  # 응용프로그램개발
    "0603",  # ERP/시스템개발/설계
    "0604",  # 네트워크/서버/보안
    "0605",  # DBA/데이터베이스
    "0608",  # HTML/퍼블리싱/UI개발
    "0609",  # QA/테스트/검증
    "0610",  # 게임
    "0612",  # 빅데이터/AI
]


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
        if tag in {"br", "p", "li", "div", "tr"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"p", "li", "div", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)

    def lines(self):
        text = unescape("".join(self.parts))
        return [" ".join(line.split()) for line in text.splitlines() if " ".join(line.split())]


def request_json(url):
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "x-is-pc": "true",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_html(url):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def html_lines(html):
    parser = TextParser()
    parser.feed(html or "")
    return parser.lines()


def normalize_title(title, depth="", assigned_task=""):
    text = f"{title or ''} {depth or ''} {assigned_task or ''}".lower()

    if any(keyword in text for keyword in ["qa", "테스트", "검증"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "유니티", "unreal", "언리얼", "그래픽"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security", "정보보호"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["ios", "android", "안드로이드", "모바일", "앱개발", "앱 개발"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "시스템운영", "시스템엔지니어", "클라우드"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "dba", "database", "빅데이터", "db"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "인공지능", "머신러닝", "llm", "딥러닝"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"

    has_frontend = any(keyword in text for keyword in ["프론트", "퍼블리싱", "ui개발", "html", "react", "vue"])
    has_backend = any(keyword in text for keyword in ["백엔드", "서버", "웹개발", "응용프로그램", "java", "spring"])

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return ""


def fetch_developer_jobs(limit):
    jobs = []
    page = 1
    params_base = {
        "pageSize": 30,
        "onRecruitYN": "Y",
        "JobCode": ",".join(DEVELOPER_WORK_CODES),
        "Sort": 0,
    }

    while len(jobs) < limit and page <= 10:
        params = dict(params_base, curpage=page)
        url = f"{API_BASE_URL}/recruit/information/getRecruitList?{urlencode(params)}"
        data = request_json(url)
        page_jobs = data.get("recruitData", [])
        if not page_jobs:
            break

        for job in page_jobs:
            normalized = normalize_title(
                job.get("RecruitTitle", ""),
                job.get("Depth", ""),
                job.get("AssignedTaskNameListString", ""),
            )
            if normalized:
                job["_normalizedTitle"] = normalized
                jobs.append(job)
            if len(jobs) >= limit:
                break
        page += 1

    return jobs


def parse_schema(html):
    for raw in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "JobPosting":
            return data
    return {}


def extract_qualifications(schema):
    items = []
    description = schema.get("description", "")
    current = False

    for raw in description.splitlines():
        line = raw.strip()
        if not line:
            continue
        compact = re.sub(r"[\[\] ]", "", line)
        if "지원자격" in compact:
            current = True
            continue
        if current and any(stop in compact for stop in ["근무지", "고용형태", "채용정보", "즉시지원"]):
            if ":" not in line:
                current = False
                continue
        if current:
            items.append(line)

    experience = schema.get("experienceRequirements")
    education = schema.get("educationRequirements")
    if isinstance(experience, list):
        experience = "/".join(experience)
    if experience:
        item = f"경력 : {experience}"
        if item not in items:
            items.insert(0, item)
    if education:
        item = f"학력 : {education}"
        if item not in items:
            items.append(item)

    return list(dict.fromkeys(items))


def extract_preferred_from_iframe(position_id):
    html = fetch_html(f"{BASE_URL}/controls/recruitDetail/{position_id}")
    lines = html_lines(html)
    preferred = []
    current = False

    for line in lines:
        compact = re.sub(r"[\[\]【】()<> ]", "", line)
        if "우대" in compact:
            current = True
            continue
        if current and any(stop in compact for stop in ["지원자격", "자격요건", "담당업무", "근무조건", "전형절차", "접수"]):
            current = False
            continue
        if current:
            item = re.sub(r"^[•·*\-ㆍ]+", "", line).strip()
            if item and item not in preferred:
                preferred.append(item)

    return preferred[:20]


def build_rows(job):
    position_id = str(job["RecruitID"])
    html = fetch_html(f"{BASE_URL}/NCS/RecruitInfoDetails/{position_id}")
    schema = parse_schema(html)
    base = {
        "site": SITE,
        "company": job.get("CompName", ""),
        "position_id": position_id,
        "title": job["_normalizedTitle"],
        "url": f"{BASE_URL}/NCS/RecruitInfoDetails/{position_id}",
    }

    rows = []
    for order, item in enumerate(extract_qualifications(schema), start=1):
        rows.append(ConditionRow(condition_type="qualification", item_order=order, condition=item, **base))

    for order, item in enumerate(extract_preferred_from_iframe(position_id), start=1):
        rows.append(ConditionRow(condition_type="preferred", item_order=order, condition=item, **base))

    return rows


def write_csv(path, rows):
    fieldnames = [
        "site",
        "company",
        "position_id",
        "title",
        "url",
        "condition_type",
        "item_order",
        "condition",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(asdict(row) for row in rows)


def main():
    jobs = fetch_developer_jobs(MAX_JOBS)
    all_rows = []

    for job in jobs:
        all_rows.extend(build_rows(job))

    qualification_rows = [row for row in all_rows if row.condition_type == "qualification"]
    preferred_rows = [row for row in all_rows if row.condition_type == "preferred"]

    write_csv(ALL_CSV, all_rows)
    write_csv(QUALIFICATION_CSV, qualification_rows)
    write_csv(PREFERRED_CSV, preferred_rows)

    print(f"developer jobs: {len(jobs)}")
    print(f"job_conditions: {len(all_rows)} rows")
    print(f"qualification_requiremnets: {len(qualification_rows)} rows")
    print(f"job_preferred_conditions: {len(preferred_rows)} rows")


if __name__ == "__main__":
    main()
