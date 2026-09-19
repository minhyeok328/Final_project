import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
ALL_CSV = BASE_DIR / "job_conditions.csv"
QUALIFICATION_CSV = BASE_DIR / "qualification_requiremnets.csv"
PREFERRED_CSV = BASE_DIR / "job_preferred_conditions.csv"

SITE = "wanted"
BASE_URL = "https://www.wanted.co.kr"
DEVELOPER_TAG_ID = 518
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


def fetch_developer_jobs(limit):
    jobs = []
    offset = 0
    page_size = min(20, limit)

    while len(jobs) < limit:
        params = {
            "tag_id": DEVELOPER_TAG_ID,
            "country": "kr",
            "job_sort": "job.latest_order",
            "years": "-1",
            "locations": "all",
            "limit": page_size,
            "offset": offset,
        }
        data = request_json(f"{BASE_URL}/api/v4/jobs?{urlencode(params)}")
        page_jobs = data.get("data", [])
        if not page_jobs:
            break

        for job in page_jobs:
            if has_developer_tag(job):
                jobs.append(job)
            if len(jobs) >= limit:
                break

        offset += page_size

    return jobs


def has_developer_tag(job):
    return any(tag.get("parent_id") == DEVELOPER_TAG_ID for tag in job.get("category_tags", []))


def fetch_job_detail(position_id):
    data = request_json(f"{BASE_URL}/api/v4/jobs/{position_id}")
    return data["job"]


def split_items(text):
    if not text:
        return []

    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        line = re.sub(r"^[•·*\-]+\s*", "", line).strip()
        if line:
            lines.append(line)

    if lines:
        return lines

    text = " ".join(text.split())
    return [text] if text else []


def normalize_title(title):
    text = (title or "").lower()

    if any(keyword in text for keyword in ["qa", "테스트", "test engineer"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "unreal", "그래픽", "graphics"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["flutter", "플러터", "android", "ios", "모바일", "app developer", "mobile"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "infra", "시스템 관리자", "system administrator"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data engineer", "data analyst", "데이터 분석가"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "머신러닝", "machine learning", "ml engineer", "llm"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"

    has_frontend = any(
        keyword in text
        for keyword in ["프론트", "front", "frontend", "front-end", "react", "vue", "next.js"]
    )
    has_backend = any(
        keyword in text
        for keyword in ["백엔드", "백앤드", "back", "backend", "back-end", "server", "서버", "spring", "node.js"]
    )

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack", "웹 개발자", "웹개발자"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return "백엔드 개발자"


def build_rows(job):
    position_id = str(job["id"])
    title = job.get("position", "")
    detail = job.get("detail") or {}
    base = {
        "site": SITE,
        "company": (job.get("company") or {}).get("name", ""),
        "position_id": position_id,
        "title": normalize_title(title),
        "url": f"{BASE_URL}/wd/{position_id}",
    }

    rows = []
    fields = [
        ("qualification", detail.get("requirements")),
        ("preferred", detail.get("preferred_points")),
    ]
    for condition_type, value in fields:
        for order, item in enumerate(split_items(value), start=1):
            rows.append(
                ConditionRow(
                    condition_type=condition_type,
                    item_order=order,
                    condition=item,
                    **base,
                )
            )
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
    list_jobs = fetch_developer_jobs(MAX_JOBS)
    all_rows = []

    for item in list_jobs:
        detail = fetch_job_detail(item["id"])
        all_rows.extend(build_rows(detail))

    qualification_rows = [row for row in all_rows if row.condition_type == "qualification"]
    preferred_rows = [row for row in all_rows if row.condition_type == "preferred"]

    write_csv(ALL_CSV, all_rows)
    write_csv(QUALIFICATION_CSV, qualification_rows)
    write_csv(PREFERRED_CSV, preferred_rows)

    print(f"developer jobs: {len(list_jobs)}")
    print(f"job_conditions: {len(all_rows)} rows")
    print(f"qualification_requiremnets: {len(qualification_rows)} rows")
    print(f"job_preferred_conditions: {len(preferred_rows)} rows")


if __name__ == "__main__":
    main()
