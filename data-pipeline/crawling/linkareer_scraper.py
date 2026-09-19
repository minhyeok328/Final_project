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

SITE = "linkareer"
BASE_URL = "https://linkareer.com"
GRAPHQL_URL = "https://api.linkareer.com/graphql"
MAX_JOBS = 20

IT_CATEGORY_ID = "58"


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
        if tag in {"p", "br", "li", "div"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"p", "li", "div"}:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)

    def text(self):
        text = unescape("".join(self.parts))
        lines = []
        for raw in text.splitlines():
            line = " ".join(raw.split())
            if line:
                lines.append(line)
        return lines


def request_json(url, payload):
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_html(url):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def normalize_title(title, categories=None):
    text = " ".join([title or ""] + [category.get("name", "") for category in categories or []]).lower()

    if any(keyword in text for keyword in ["게임", "unity", "유니티", "unreal", "언리얼", "그래픽"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["ios", "android", "안드로이드", "모바일", "앱개발", "앱 개발"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "클라우드", "인프라", "시스템/erp", "시스템"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["ai", "인공지능", "머신러닝", "llm", "nlp"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data", "dba"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["qa", "테스트", "검증", "기술지원"]):
        return "QA 엔지니어 / 테스트 엔지니어"

    has_frontend = any(keyword in text for keyword in ["프론트", "frontend", "front-end", "react", "vue"])
    has_backend = any(keyword in text for keyword in ["백엔드", "서버", "backend", "back-end", "server"])

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "웹개발", "웹 개발"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return ""


def fetch_recruit_list(page):
    query = """
    query RecruitList($filterBy: ActivityFilter, $orderBy: ActivityOrder, $pagination: Pagination) {
      activities(filterBy: $filterBy, orderBy: $orderBy, pagination: $pagination) {
        totalCount
        nodes {
          id
          title
          organizationName
          categories { id name }
        }
      }
    }
    """
    payload = {
        "query": query,
        "variables": {
            "filterBy": {
                "activityTypeID": "5",
                "categoryIDs": [IT_CATEGORY_ID],
                "status": "OPEN",
            },
            "orderBy": {"direction": "DESC", "field": "RECENT"},
            "pagination": {"page": page, "pageSize": 20},
        },
    }
    data = request_json(GRAPHQL_URL, payload)
    return data["data"]["activities"]["nodes"]


def fetch_developer_jobs(limit):
    jobs = []
    page = 1

    while len(jobs) < limit:
        nodes = fetch_recruit_list(page)
        if not nodes:
            break

        for node in nodes:
            title = normalize_title(node.get("title"), node.get("categories"))
            if title:
                node["_normalizedTitle"] = title
                jobs.append(node)
            if len(jobs) >= limit:
                break

        page += 1

    return jobs


def load_activity_detail(activity_id):
    html = fetch_html(f"{BASE_URL}/activity/{activity_id}")
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise ValueError(f"__NEXT_DATA__ not found: {activity_id}")

    state = json.loads(match.group(1))["props"]["pageProps"]["__APOLLO_STATE__"]
    activity = state[f"Activity:{activity_id}"]
    text_ref = activity.get("detailText", {}).get("__ref")
    text_html = state.get(text_ref, {}).get("text", "") if text_ref else ""
    return activity, text_html


def html_to_lines(html):
    parser = TextParser()
    parser.feed(html or "")
    return parser.text()


def clean_item(line):
    line = re.sub(r"^[•·*\-ㆍ]+", "", line).strip()
    line = re.sub(r"^\d+[\).]\s*", "", line).strip()
    return line


def classify_heading(line):
    compact = re.sub(r"[\[\]【】()<> ]", "", line).lower()
    if any(keyword in compact for keyword in ["우대", "preferred"]):
        return "preferred"
    if any(
        keyword in compact
        for keyword in ["자격", "지원자격", "필요역량", "필수", "요건", "qualification", "requirement"]
    ):
        return "qualification"
    if any(keyword in compact for keyword in ["수행직무", "담당업무", "전형절차", "근무조건", "복리후생", "접수"]):
        return "other"
    return None


def extract_conditions(text_html):
    lines = html_to_lines(text_html)
    buckets = {"qualification": [], "preferred": []}
    current = None

    for line in lines:
        heading = classify_heading(line)
        if heading:
            current = heading
            continue

        item = clean_item(line)
        if not item or len(item) < 2:
            continue
        if current in buckets:
            buckets[current].append(item)

    if not buckets["qualification"]:
        for line in lines:
            item = clean_item(line)
            if item and not classify_heading(item):
                buckets["qualification"].append(item)
            if len(buckets["qualification"]) >= 5:
                break

    return buckets


def build_rows(job):
    activity, text_html = load_activity_detail(job["id"])
    conditions = extract_conditions(text_html)
    position_id = str(job["id"])
    base = {
        "site": SITE,
        "company": activity.get("organizationName", job.get("organizationName", "")),
        "position_id": position_id,
        "title": job["_normalizedTitle"],
        "url": f"{BASE_URL}/activity/{position_id}",
    }

    rows = []
    for condition_type, items in conditions.items():
        for order, item in enumerate(items, start=1):
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
