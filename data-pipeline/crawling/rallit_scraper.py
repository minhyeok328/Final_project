import csv
import json
import re
from dataclasses import dataclass, asdict
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
ALL_CSV = BASE_DIR / "job_conditions.csv"
QUALIFICATION_CSV = BASE_DIR / "qualification_requiremnets.csv"
PREFERRED_CSV = BASE_DIR / "job_preferred_conditions.csv"

JOB_URLS = [
    "https://www.rallit.com/positions/191",
    "https://www.rallit.com/positions/2039",
    "https://www.rallit.com/positions/2315",
    "https://www.rallit.com/positions/2555",
    "https://www.rallit.com/positions/2834",
    "https://www.rallit.com/positions/2892",
    "https://www.rallit.com/positions/2955/%EA%B2%8C%EC%9E%84-%EB%B0%B1%EC%97%94%EB%93%9C-%EA%B0%9C%EB%B0%9C%EC%9E%90",
    "https://www.rallit.com/positions/2965",
    "https://www.rallit.com/positions/3109",
    "https://www.rallit.com/positions/311",
    "https://www.rallit.com/positions/3358",
    "https://www.rallit.com/positions/3462",
    "https://www.rallit.com/positions/3720/%EB%8C%84%EC%8A%A4-%EC%95%84%EC%BC%80%EC%9D%B4%EB%93%9C-%EA%B2%8C%EC%9E%84-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8-%EA%B0%9C%EB%B0%9C%EC%9E%90-unity",
    "https://www.rallit.com/positions/4004",
    "https://www.rallit.com/positions/4018",
    "https://www.rallit.com/positions/4022",
    "https://www.rallit.com/positions/4067",
    "https://www.rallit.com/positions/4070",
    "https://www.rallit.com/positions/4237",
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


class ListItemParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.current = []
        self.in_li = False

    def handle_starttag(self, tag, attrs):
        if tag == "li":
            self.in_li = True
            self.current = []

    def handle_endtag(self, tag):
        if tag == "li" and self.in_li:
            text = " ".join("".join(self.current).split())
            if text:
                self.items.append(text)
            self.current = []
            self.in_li = False

    def handle_data(self, data):
        if self.in_li:
            self.current.append(data)


def fetch_html(url):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_next_data(html):
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise ValueError("__NEXT_DATA__ not found")
    return json.loads(match.group(1))


def extract_list_items(fragment):
    if not fragment:
        return []

    parser = ListItemParser()
    parser.feed(unescape(fragment))
    if parser.items:
        return parser.items

    text = re.sub(r"<[^>]+>", " ", unescape(fragment))
    text = " ".join(text.split())
    return [text] if text else []


def normalize_title(title, jobs=None, skills=None):
    text_parts = [title or ""]
    for item in jobs or []:
        if isinstance(item, dict):
            text_parts.extend([item.get("name", ""), item.get("code", "")])
        else:
            text_parts.append(str(item))
    text_parts.extend(skills or [])

    text = " ".join(text_parts).lower()

    if any(keyword in text for keyword in ["qa", "테스트", "test engineer"]):
        return "QA 엔지니어 / 테스트 엔지니어"
    if any(keyword in text for keyword in ["게임", "unity", "unreal", "그래픽", "graphics"]):
        return "게임·그래픽스 개발자"
    if any(keyword in text for keyword in ["보안", "security"]):
        return "보안 엔지니어"
    if any(keyword in text for keyword in ["flutter", "플러터", "android", "ios", "모바일", "앱 개발자", "mobile"]):
        return "모바일 앱 개발자"
    if any(keyword in text for keyword in ["devops", "인프라", "infra", "kubernetes", "docker", "cloud", "aws", "azure"]):
        return "DevOps 엔지니어 / 인프라 엔지니어"
    if any(keyword in text for keyword in ["데이터", "data engineer", "data analyst", "분석가", "sql"]):
        return "데이터 엔지니어 / 데이터 분석가"
    if any(keyword in text for keyword in ["ai", "머신러닝", "machine learning", "ml engineer", "llm"]):
        return "AI 엔지니어 / 머신러닝 엔지니어"

    has_frontend = any(
        keyword in text
        for keyword in ["프론트", "front", "frontend", "front-end", "react", "vue", "next.js"]
    )
    has_backend = any(
        keyword in text
        for keyword in ["백엔드", "백앤드", "back", "backend", "back-end", "spring", "django", "fastapi", "node.js"]
    )

    if has_frontend and has_backend:
        return "풀스택 개발자"
    if any(keyword in text for keyword in ["풀스택", "fullstack", "full-stack", "product engineer", "웹개발자", "웹 개발자"]):
        return "풀스택 개발자"
    if has_frontend:
        return "프론트엔드 개발자"
    if has_backend:
        return "백엔드 개발자"

    return "백엔드 개발자"


def parse_position(html):
    data = extract_next_data(html)
    return data["props"]["pageProps"]["position"]


def build_rows(position):
    position_id = str(position["id"])
    base = {
        "site": "rallit",
        "company": position.get("companyName", ""),
        "position_id": position_id,
        "title": normalize_title(position.get("title", "")),
        "url": f"https://www.rallit.com/positions/{position_id}",
    }

    rows = []
    condition_fields = [
        ("qualification", position.get("basicQualifications")),
        ("preferred", position.get("preferredQualifications")),
    ]
    for condition_type, fragment in condition_fields:
        for order, item in enumerate(extract_list_items(fragment), start=1):
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
    all_rows = []
    for url in JOB_URLS:
        html = fetch_html(url)
        position = parse_position(html)
        all_rows.extend(build_rows(position))

    qualification_rows = [row for row in all_rows if row.condition_type == "qualification"]
    preferred_rows = [row for row in all_rows if row.condition_type == "preferred"]

    write_csv(ALL_CSV, all_rows)
    write_csv(QUALIFICATION_CSV, qualification_rows)
    write_csv(PREFERRED_CSV, preferred_rows)

    print(f"job_conditions: {len(all_rows)} rows")
    print(f"qualification_requiremnets: {len(qualification_rows)} rows")
    print(f"job_preferred_conditions: {len(preferred_rows)} rows")


if __name__ == "__main__":
    main()
