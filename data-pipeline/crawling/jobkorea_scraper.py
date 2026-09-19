import csv
import json
import re
from dataclasses import asdict, dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
ALL_CSV = BASE_DIR / "job_conditions.csv"
QUALIFICATION_CSV = BASE_DIR / "qualification_requiremnets.csv"
PREFERRED_CSV = BASE_DIR / "job_preferred_conditions.csv"

SITE = "jobkorea"
BASE_URL = "https://www.jobkorea.co.kr"
LIST_URL = f"{BASE_URL}/recruit/joblist?menucode=duty&duty=10031"
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


def fetch_html(url):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def html_lines(html):
    parser = TextParser()
    parser.feed(html)
    return parser.lines()


def clean_text(value):
    value = unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return " ".join(value.split())


def normalize_title(title, description=""):
    text = f"{title or ''} {description or ''}".lower()

    if any(keyword in text for keyword in ["qa", "테스트", "검증"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "유니티", "unreal", "언리얼", "그래픽"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security", "정보보호"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["ios", "android", "안드로이드", "모바일", "앱 개발", "app"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "클라우드", "시스템엔지니어"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data", "dba", "sql"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "인공지능", "머신러닝", "llm", "딥러닝"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"

    has_frontend = any(keyword in text for keyword in ["프론트", "front", "react", "vue", "next.js"])
    has_backend = any(keyword in text for keyword in ["백엔드", "서버", "backend", "back-end", "server", "java", "spring"])

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "웹개발", "웹 개발"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return ""


def fetch_job_ids():
    ids = []
    seen = set()
    for page in range(1, 6):
        url = f"{LIST_URL}&Page_No={page}"
        html = fetch_html(url)
        for match in re.findall(r"/Recruit/GI_Read/(\d+)", html):
            if match not in seen:
                seen.add(match)
                ids.append(match)
    return ids


def parse_job_schema(html):
    for raw in re.findall(
        r'<script type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.S,
    ):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "JobPosting":
            return data
    return {}


def extract_qualification_items(html, schema):
    items = []

    experience = schema.get("experienceRequirements")
    education = schema.get("educationRequirements")
    if experience:
        items.append(f"경력: {experience}")
    if education:
        items.append(f"학력: {education}")

    # React-rendered support block usually contains label/value pairs.
    for label, value in re.findall(
        r'<span class="min-w-\[80px\]">([^<]+)</span>.*?<span class="font-bold text-\[#0057ff\]">([^<]+)</span>',
        html,
        re.S,
    ):
        label = clean_text(label)
        if label not in {"경력", "학력"}:
            continue
        item = f"{label}: {clean_text(value)}"
        if item not in items:
            items.append(item)

    description = schema.get("description")
    if description and len(items) < 3:
        items.append(description)

    return items


def extract_preferred_items(html):
    # JobKorea does not expose preferred conditions as a stable structured field
    # in the server HTML. Returning an empty list avoids mixing recommendation UI
    # and script text into the dataset.
    return []


def build_rows(position_id, html):
    schema = parse_job_schema(html)
    title = schema.get("title", "")
    description = schema.get("description", "")
    normalized = normalize_title(title, description)
    if not normalized:
        return []

    company = ""
    hiring_org = schema.get("hiringOrganization")
    if isinstance(hiring_org, dict):
        company = hiring_org.get("name", "")

    base = {
        "site": SITE,
        "company": company,
        "position_id": position_id,
        "title": normalized,
        "url": f"{BASE_URL}/Recruit/GI_Read/{position_id}",
    }

    rows = []
    for order, item in enumerate(extract_qualification_items(html, schema), start=1):
        rows.append(ConditionRow(condition_type="qualification", item_order=order, condition=item, **base))

    for order, item in enumerate(extract_preferred_items(html), start=1):
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
    all_rows = []
    developer_jobs = 0

    for position_id in fetch_job_ids():
        html = fetch_html(f"{BASE_URL}/Recruit/GI_Read/{position_id}")
        rows = build_rows(position_id, html)
        if not rows:
            continue
        all_rows.extend(rows)
        developer_jobs += 1
        if developer_jobs >= MAX_JOBS:
            break

    qualification_rows = [row for row in all_rows if row.condition_type == "qualification"]
    preferred_rows = [row for row in all_rows if row.condition_type == "preferred"]

    write_csv(ALL_CSV, all_rows)
    write_csv(QUALIFICATION_CSV, qualification_rows)
    write_csv(PREFERRED_CSV, preferred_rows)

    print(f"developer jobs: {developer_jobs}")
    print(f"job_conditions: {len(all_rows)} rows")
    print(f"qualification_requiremnets: {len(qualification_rows)} rows")
    print(f"job_preferred_conditions: {len(preferred_rows)} rows")


if __name__ == "__main__":
    main()
