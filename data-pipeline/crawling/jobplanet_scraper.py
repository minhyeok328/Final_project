import csv
import json
import re
import time
from dataclasses import asdict, dataclass
from html import unescape
from pathlib import Path
from urllib.request import HTTPCookieProcessor, Request, build_opener


BASE_DIR = Path(__file__).resolve().parent
ALL_CSV = BASE_DIR / "job_conditions.csv"
QUALIFICATION_CSV = BASE_DIR / "qualification_requiremnets.csv"
PREFERRED_CSV = BASE_DIR / "job_preferred_conditions.csv"

SITE = "jobplanet"
BASE_URL = "https://www.jobplanet.co.kr"
MAX_JOBS = 20

SEARCH_URLS = [
    f"{BASE_URL}/job/search?occupation_level2=11604",
    f"{BASE_URL}/job/search?occupation_level2=11604&page=2",
    f"{BASE_URL}/job/search?occupation_level1=11600",
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


class JobplanetClient:
    def __init__(self):
        self.opener = build_opener(HTTPCookieProcessor())
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://www.google.com/",
        }
        self.bootstrap()

    def bootstrap(self):
        self.get(f"{BASE_URL}/welcome/index", referer="https://www.google.com/")

    def get(self, url, referer=None, retries=5):
        headers = dict(self.headers)
        if referer:
            headers["Referer"] = referer

        last_error = None
        for attempt in range(retries):
            try:
                request = Request(url, headers=headers)
                with self.opener.open(request, timeout=25) as response:
                    return response.read().decode("utf-8", "replace")
            except Exception as error:
                last_error = error
                time.sleep(1 + attempt)
                if "welcome/index" not in url:
                    try:
                        self.bootstrap()
                    except Exception:
                        pass
        raise last_error


def extract_react_query_payloads(html):
    payloads = []
    marker = 'window["__RQ_R_btb_"].push('
    position = 0

    while True:
        start = html.find(marker, position)
        if start < 0:
            break

        index = start + len(marker)
        depth = 0
        in_string = False
        escaped = False

        for end in range(index, len(html)):
            char = html[end]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
            else:
                if char == '"':
                    in_string = True
                elif char == "{":
                    depth += 1
                elif char == "}":
                    depth -= 1
                    if depth == 0:
                        payloads.append(json.loads(html[index : end + 1]))
                        position = end + 1
                        break
        else:
            break

    return payloads


def iter_query_data(html):
    for payload in extract_react_query_payloads(html):
        for query in payload.get("queries", []):
            yield query.get("state", {}).get("data")


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip(" -ㆍ•·\t\r\n")


def unique_items(items):
    result = []
    seen = set()
    for item in items:
        item = clean_text(item)
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result


def absolute_url(path):
    path = unescape(path or "")
    if path.startswith("http"):
        return path
    return f"{BASE_URL}{path}"


def normalize_title(job):
    jd = job.get("jd") or {}
    text = " ".join(
        [
            jd.get("title") or "",
            " ".join(item.get("name", "") for item in jd.get("level2_occupations") or []),
            " ".join(item.get("name", "") for item in jd.get("required_skills") or []),
        ]
    ).lower()

    if any(keyword in text for keyword in ["qa", "quality", "테스트", "검증"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "vr", "unity", "unreal", "그래픽", "graphics"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security", "secops"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["ios", "android", "모바일", "앱", "flutter", "react native"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "sre", "인프라", "클라우드", "aws", "kubernetes", "네트워크"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data", "dba", "database", "sql", "bi", "분석"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "ml", "머신러닝", "딥러닝", "llm", "인공지능"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack"]):
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["프론트", "frontend", "front-end", "react", "vue", "javascript", "typescript"]):
        return "프론트엔드 개발자"
    if any(keyword in text for keyword in ["백엔드", "backend", "back-end", "서버", "java", "spring", "node", "python"]):
        return "백엔드 개발자"
    if any(keyword in text for keyword in ["웹개발", "소프트웨어 개발", "sw개발", "개발자", "개발"]):
        return "백엔드 개발자"
    return None


def education_text(education_level_id):
    labels = {
        1: "학력 무관",
        2: "고졸 이상",
        3: "전문학사 이상",
        4: "학사 이상",
        5: "학력 무관",
        6: "석사 이상",
        7: "박사 이상",
    }
    return labels.get(education_level_id)


def collect_jobs(client):
    jobs = []
    seen = set()

    for search_url in SEARCH_URLS:
        html = client.get(search_url, referer=f"{BASE_URL}/welcome/index")
        for data in iter_query_data(html):
            if not isinstance(data, dict) or "search_result" not in data:
                continue
            for job in data["search_result"].get("jobs") or []:
                position_id = str(job.get("id") or "")
                if not position_id or position_id in seen:
                    continue
                title = normalize_title(job)
                if not title:
                    continue
                seen.add(position_id)
                jobs.append({**job, "normalizedTitle": title})
                if len(jobs) >= MAX_JOBS:
                    return jobs
    return jobs


def build_conditions(job):
    jd = job.get("jd") or {}
    occupations = [item.get("name") for item in jd.get("level2_occupations") or [] if item.get("name")]
    skills = [item.get("name") for item in jd.get("required_skills") or [] if item.get("name")]
    recruitment_types = [item.get("name") for item in jd.get("recruitment_types") or [] if item.get("name")]

    qualification = [
        ", ".join(recruitment_types) if recruitment_types else None,
        education_text(jd.get("education_level_id")),
        f"직무: {', '.join(occupations)}" if occupations else None,
        f"필요 스킬: {', '.join(skills)}" if skills else None,
    ]

    preferred = []
    if any("우대" in item for item in recruitment_types):
        preferred.extend(recruitment_types)

    return unique_items(qualification), unique_items(preferred)


def make_rows():
    client = JobplanetClient()
    rows = []

    for job in collect_jobs(client):
        jd = job.get("jd") or {}
        company = (job.get("company") or {}).get("name") or ""
        position_id = str(job.get("id") or "")
        title = job["normalizedTitle"]
        url = absolute_url(jd.get("url"))
        qualification, preferred = build_conditions(job)

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
