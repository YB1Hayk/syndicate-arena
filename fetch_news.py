import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

SOURCES = [
    {"url": "https://rssexport.rbc.ru/rbcnews/news/30/full.rss", "name": "РБК"},
    {"url": "https://www.bfm.ru/export/rss.xml",                 "name": "Business FM"},
    {"url": "https://lenta.ru/rss/articles/economics",            "name": "Lenta.ru"},
    {"url": "https://tass.ru/rss/v2.xml",                        "name": "ТАСС"},
]

KEYWORDS = {
    "XAU":  ["золото", "xau", "gold", "слитки", "драгметалл"],
    "OIL":  ["нефть", "wti", "brent", "opec", "опек", "баррель", "нефтян"],
    "GAS":  ["газ", "природный газ", "lng", "спг", "газпром"],
    "FED":  ["фрс", "федрезерв", "пауэлл", "powell", "ставка сша", "fed "],
    "CPI":  ["инфляция", "cpi", "индекс цен", "потребительские цены"],
    "EUR":  ["евро", "eur", "ecb", "ецб", "еврозона", "лагард"],
    "GBP":  ["фунт", "gbp", "банк англии"],
    "USD":  ["доллар", "usd", "dxy", "индекс доллара", "курс доллара"],
    "RUB":  ["рубль", "рублей", "курс рубля", "цб рф", "банк России"],
}

def detect_tag(text):
    low = text.lower()
    for tag, words in KEYWORDS.items():
        if any(w in low for w in words):
            return tag
    return "NEWS"

def time_ago(dt):
    now  = datetime.now(timezone.utc)
    diff = int((now - dt).total_seconds())
    if diff < 60:    return "только что"
    if diff < 3600:  return f"{diff // 60} мин назад"
    if diff < 86400: return f"{diff // 3600} ч назад"
    return f"{diff // 86400} д назад"

def fetch_source(src):
    items = []
    try:
        req = urllib.request.Request(
            src["url"],
            headers={"User-Agent": "Mozilla/5.0 (compatible; SyndicateArenaBot/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()

        root = ET.fromstring(content)
        ns   = {"media": "http://search.yahoo.com/mrss/"}

        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link  = (item.findtext("link")  or item.findtext("guid") or "").strip()
            pub   = item.findtext("pubDate") or ""
            desc  = (item.findtext("description") or "").strip()

            if not title or not link:
                continue

            try:
                dt = parsedate_to_datetime(pub) if pub else datetime.now(timezone.utc)
            except Exception:
                dt = datetime.now(timezone.utc)

            tag = detect_tag(title + " " + desc)
            items.append({
                "title":   title,
                "link":    link,
                "date":    dt.isoformat(),
                "timeAgo": time_ago(dt),
                "source":  src["name"],
                "tag":     tag,
            })
    except Exception as e:
        print(f"[WARN] {src['name']}: {e}")
    return items

all_items = []
for src in SOURCES:
    fetched = fetch_source(src)
    print(f"[OK] {src['name']}: {len(fetched)} новостей")
    all_items.extend(fetched)

# Дедупликация по заголовку + сортировка по дате
seen   = set()
unique = []
for n in all_items:
    if n["title"] not in seen:
        seen.add(n["title"])
        unique.append(n)

unique.sort(key=lambda x: x["date"], reverse=True)
unique = unique[:60]

output = {
    "updated":  datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC"),
    "count":    len(unique),
    "items":    unique,
}

with open("news.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"[DONE] Сохранено {len(unique)} новостей в news.json")
