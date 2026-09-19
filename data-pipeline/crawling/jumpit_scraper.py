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

SITE = "jumpit"
BASE_URL = "https://jumpit.saramin.co.kr"
API_BASE_URL = "https://jumpit-api.saramin.co.kr"
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


def normalize_title(title, job_category=""):
    text = f"{title or ''} {job_category or ''}".lower()

    if any(keyword in text for keyword in ["qa", "테스트", "test engineer"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "유니티", "unreal", "언리얼", "그래픽", "graphics"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security", "정보보안"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["flutter", "플러터", "android", "안드로이드", "ios", "모바일", "mobile", "앱 개발"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "infra", "시스템", "클라우드"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data engineer", "data analyst", "데이터 분석"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "머신러닝", "machine learning", "ml engineer", "llm", "인공지능"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"

    has_frontend = any(
        keyword in text
        for keyword in ["프론트", "front", "frontend", "front-end", "react", "vue", "next.js"]
    )
    has_backend = any(
        keyword in text
        for keyword in ["백엔드", "백앤드", "back", "backend", "back-end", "서버", "server", "spring", "node.js"]
    )

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack", "웹 개발", "웹개발"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return ""


def fetch_developer_jobs(limit):
    jobs = []
    page = 1

    while len(jobs) < limit:
        params = {
            "sort": "reg_dt",
            "page": page,
        }
        data = request_json(f"{API_BASE_URL}/api/positions?{urlencode(params)}")
        page_jobs = data.get("result", {}).get("positions", [])
        if not page_jobs:
            break

        for job in page_jobs:
            normalized = normalize_title(job.get("title"), job.get("jobCategory"))
            if normalized:
                jobs.append(job)
            if len(jobs) >= limit:
                break

        page += 1

    return jobs


def fetch_position_detail(position_id):
    data = request_json(f"{API_BASE_URL}/api/position/{position_id}")
    return data["result"]


def split_items(text):
    if not text:
        return []

    items = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        line = re.sub(r"^[•·*\-]+\s*", "", line).strip()
        if line:
            items.append(line)

    if items:
        return items

    text = " ".join(text.split())
    return [text] if text else []


def build_rows(position):
    position_id = str(position["id"])
    title = position.get("title", "")
    job_category = position.get("jobCategory") or position.get("_listJobCategory", "")
    base = {
        "site": SITE,
        "company": position.get("companyName", ""),
        "position_id": position_id,
        "title": normalize_title(title, job_category),
        "url": f"{BASE_URL}/position/{position_id}",
    }

    rows = []
    fields = [
        ("qualification", position.get("qualifications")),
        ("preferred", position.get("preferredRequirements")),
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
        detail = fetch_position_detail(item["id"])
        detail["_listJobCategory"] = item.get("jobCategory", "")
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
