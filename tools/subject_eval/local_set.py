"""A hand-built test set, for when real captures are out of reach.

    python local_set.py              # downloads + generates into the data folder
    python local_set.py --no-fetch   # rebuild from the photos kept, no downloads
    SUBJECT_EVAL_DATA=... python local_set.py

On-subject photos for eight platform scenarios come from Wikimedia Commons
(freely licensed; credits.csv names each author and licence). The mistakes a
worker makes are photos too (a floor, the sky, a selfie, a pet) or are made
from the on-subject photos (smeared by motion, dark as a pocket, a finger over
the lens). Hard but GOOD captures — the subject small in frame or partly
covered — are made the same way, because a check that flags those is the
false warning workers complain about.

Writes manifest.jsonl in export.py's shape: on-subject rows are 'accepted',
mistakes 'rejected_subject', and ML Kit is 'not_run' (it exists only on a
phone). A mistake that is wrong for every scenario gets one row per scenario.
"""

from __future__ import annotations

import csv
import io
import json
import random
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402

UA = "SourceHub-subject-eval/1.0 (offline evaluation; contact via repository owner)"
API = "https://commons.wikimedia.org/w/api.php"
FREE = ("cc0", "cc by", "cc-by", "public domain", "pd")
PER_SCENARIO = 12
SEED = 20261017

SCENARIOS = {
    "retail_shelf": ({"domain": "retail shelf", "must_show": ["products", "price tags"], "must_not_show": ["person"]},
                     ["supermarket shelf products", "grocery store shelves price tags", "retail shelf products"]),
    "laptop_in_use": ({"domain": "laptop being operated", "must_show": ["keyboard", "screen", "hands"],
                       "must_not_show": ["screenshot"]},
                      ["person typing on laptop", "hands laptop keyboard", "working on laptop"]),
    "shop_fronts": ({"domain": "street-level shop fronts", "must_show": ["signboard", "entrance"], "must_not_show": []},
                    ["shop front street", "storefront signboard", "shops street India"]),
    # "traffic" alone finds accidents; congestion and busy streets find traffic
    "road_traffic": ({"domain": "road traffic", "must_show": ["vehicles", "road"], "must_not_show": []},
                     ["traffic congestion city street", "busy road traffic cars buses", "highway traffic vehicles",
                      "traffic jam street"]),
    "crop_field": ({"domain": "crop field", "must_show": ["plants", "soil"], "must_not_show": []},
                   ["crop field farm", "maize crop field", "vegetable farm field rows", "paddy field"]),
    "food_dish": ({"domain": "restaurant food dish", "must_show": ["plate", "food"], "must_not_show": []},
                  ["restaurant dish plate food", "biryani plate", "thali meal", "meal on plate"]),
    # "printed receipt" finds 18th-century trade cards in museum collections
    "receipt": ({"domain": "printed receipt", "must_show": ["paper", "text"], "must_not_show": []},
                ["supermarket till receipt", "cash register receipt", "shop receipt paper", "restaurant bill receipt"]),
    "construction": ({"domain": "construction site", "must_show": ["building", "workers"], "must_not_show": []},
                     ["construction site workers", "building construction site", "construction workers building"]),
}

# photos that are wrong for every scenario: what a phone records by mistake
MISTAKE_QUERIES = {
    "floor": ["floor tiles", "carpet floor"],
    "ceiling": ["ceiling lights room"],
    "sky": ["blue sky clouds"],
    "selfie": ["selfie portrait"],
    "pet": ["dog portrait", "cat portrait"],
    "empty_room": ["empty room white wall"],
}
# wrong for one scenario only
NEAR_MISS = {"retail_shelf": ("empty_shelf", ["empty supermarket shelves", "empty shelf store"])}


def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))
    raise AssertionError


def search(query: str, limit: int = 30) -> list[dict]:
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"filetype:bitmap {query}", "gsrlimit": limit, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 640,
    })
    pages = json.loads(_get(f"{API}?{q}")).get("query", {}).get("pages", {})
    out = []
    for p in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        if ii.get("mime") not in ("image/jpeg", "image/png") or not ii.get("thumburl"):
            continue
        if not lic.lower().startswith(FREE) or ii.get("width", 0) < 400:
            continue
        artist = (meta.get("Artist") or {}).get("value", "")
        out.append({"title": p["title"], "thumb": ii["thumburl"], "page": ii.get("descriptionurl", ""),
                    "license": lic, "artist": _strip_tags(artist)[:120]})
    return out


def _strip_tags(s: str) -> str:
    import re

    return re.sub(r"<[^>]+>", "", s).strip()


def fetch(queries: list[str], n: int, dest: Path, seen: set[str], start: int = 0) -> list[dict]:
    got: list[dict] = []
    for q in queries:
        for c in search(q):
            if len(got) >= n:
                return got
            if c["title"] in seen:
                continue
            seen.add(c["title"])
            try:
                img = Image.open(io.BytesIO(_get(c["thumb"]))).convert("RGB")
            except Exception:  # noqa: BLE001
                continue
            name = f"{dest.name}_{start + len(got):02d}.jpg"
            img.save(dest / name, quality=88)
            got.append({**c, "file": f"{dest.name}/{name}", "group": dest.name})
            time.sleep(0.3)
    return got


class Library:
    """The downloaded photos, kept across runs in credits.csv.

    Looking at the contact sheets finds photos that do not fit (a search for
    "printed receipt" returns museum trade cards); those go in drop.txt, one
    path per line, and the next run tops each group back up from the next
    search results instead of starting again.
    """

    def __init__(self, root: Path, fetch: bool = True):
        self.fetch = fetch
        self.root = root
        self.files = root / "files"
        f = root / "credits.csv"
        self.rows: list[dict] = list(csv.DictReader(f.open(encoding="utf-8"))) if f.exists() else []
        for r in self.rows:  # a first version stored the bare file name
            if "/" not in r["file"]:
                r["file"] = f"{r['group']}/{r['file']}"
        d = root / "drop.txt"
        self.drop = {ln.strip() for ln in d.read_text(encoding="utf-8").splitlines() if ln.strip()} if d.exists() else set()
        self.seen = {r["title"] for r in self.rows}

    def group(self, name: str, queries: list[str], n: int) -> list[str]:
        mine = [r for r in self.rows if r["group"] == name]
        kept = [r["file"] for r in mine if r["file"] not in self.drop and (self.files / r["file"]).exists()]
        if len(kept) < n and self.fetch:
            d = self.files / name
            d.mkdir(parents=True, exist_ok=True)
            start = 1 + max([int(Path(r["file"]).stem.rsplit("_", 1)[1]) for r in mine] or [-1])
            got = fetch(queries, n - len(kept), d, self.seen, start)
            self.rows += got
            kept += [g["file"] for g in got]
        print(f"{name}: {len(kept)} photos")
        return kept

    def save(self) -> None:
        with (self.root / "credits.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=["group", "file", "title", "license", "artist", "page"],
                               extrasaction="ignore")
            w.writeheader()
            # dropped photos stay listed, so a later run does not fetch them again
            w.writerows(self.rows)


# ---------------------------------------------------------------------------
# Made from the photos
# ---------------------------------------------------------------------------
def motion_smear(img: Image.Image) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(28))


def pocket(img: Image.Image, rng: random.Random) -> Image.Image:
    dark = ImageEnhance.Brightness(img.filter(ImageFilter.GaussianBlur(12))).enhance(0.06)
    px = dark.load()
    for _ in range(dark.width * dark.height // 40):
        x, y = rng.randrange(dark.width), rng.randrange(dark.height)
        v = rng.randrange(25)
        px[x, y] = (v, v, v)
    return dark


def finger(img: Image.Image) -> Image.Image:
    out = img.copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    d.ellipse((-w * 0.3, h * 0.05, w * 0.95, h * 1.4), fill=(214, 146, 120))
    return out.filter(ImageFilter.GaussianBlur(6))


def small_in_frame(img: Image.Image, backdrop: Image.Image, rng: random.Random) -> Image.Image:
    """The subject at a third of the frame, the rest something else: GOOD."""
    base = backdrop.resize(img.size).copy()
    s = img.resize((img.width * 2 // 5, img.height * 2 // 5))
    base.paste(s, (rng.randrange(img.width - s.width), rng.randrange(img.height - s.height)))
    return base


def partly_covered(img: Image.Image) -> Image.Image:
    """A hand over a corner of a good capture: GOOD."""
    out = img.copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    d.ellipse((w * 0.6, h * 0.45, w * 1.25, h * 1.3), fill=(205, 140, 112))
    return out


def screenshot(n: int) -> Image.Image:
    img = Image.new("RGB", (480, 960), (246, 247, 249))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    d.rectangle((0, 0, 480, 70), fill=(33, 99, 235))
    d.text((20, 26), f"Inbox ({n + 3})", fill="white", font=font)
    for i in range(12):
        y = 90 + i * 72
        d.ellipse((16, y, 56, y + 40), fill=(180, 190, 205))
        d.rectangle((70, y + 4, 400, y + 14), fill=(60, 64, 72))
        d.rectangle((70, y + 24, 330, y + 32), fill=(150, 155, 165))
    return img


def main() -> None:
    root = data_dir()
    imgs = root / "files"
    imgs.mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)
    # --no-fetch: build from the photos already kept, after the last look
    lib = Library(root, fetch="--no-fetch" not in sys.argv)
    rows: list[dict] = []

    def row(scenario: str, file: str, outcome: str, group: str) -> None:
        rows.append({"asset_id": f"{scenario}:{file}", "task_id": scenario, "task": scenario, "kind": "photo",
                     "mime_type": "image/jpeg", "duration_s": None, "outcome": outcome, "review_note": group,
                     "group": group, "subject": SCENARIOS[scenario][0],
                     "mlkit": {"measured": None, "warned": False, "forbidden_warned": False, "unscored": "not_run"},
                     "file": file})

    on: dict[str, list[str]] = {}
    for key, (_, queries) in SCENARIOS.items():
        on[key] = lib.group(key, queries, PER_SCENARIO)
        for f in on[key]:
            row(key, f, "accepted", "on_subject")

    mistakes: dict[str, list[str]] = {}
    for group, queries in MISTAKE_QUERIES.items():
        mistakes[group] = lib.group(group, queries, 4)
    for scenario, (group, queries) in NEAR_MISS.items():
        for f in lib.group(group, queries, 5):
            row(scenario, f, "rejected_subject", group)
    lib.save()

    gen = imgs / "generated"
    gen.mkdir(exist_ok=True)
    for n in range(3):
        name = f"generated/screenshot_{n}.jpg"
        screenshot(n).save(imgs / name, quality=88)
        mistakes.setdefault("screenshot", []).append(name)
    backdrops = [Image.open(imgs / f).convert("RGB") for f in mistakes.get("floor", []) + mistakes.get("empty_room", [])]
    for key, files in on.items():
        # three of each scenario's photos: two made worse, two made harder but kept good
        for i, f in enumerate(files[:3]):
            src = Image.open(imgs / f).convert("RGB")
            for group, make in (("motion_smear", lambda im: motion_smear(im)),
                                ("pocket", lambda im: pocket(im, rng)),
                                ("finger", lambda im: finger(im))):
                name = f"generated/{key}_{group}_{i}.jpg"
                make(src).save(imgs / name, quality=88)
                row(key, name, "rejected_subject", group)
            if backdrops:
                name = f"generated/{key}_small_{i}.jpg"
                small_in_frame(src, rng.choice(backdrops), rng).save(imgs / name, quality=88)
                row(key, name, "accepted", "hard_small")
            name = f"generated/{key}_covered_{i}.jpg"
            partly_covered(src).save(imgs / name, quality=88)
            row(key, name, "accepted", "hard_covered")

    for group, files in mistakes.items():
        for f in files:
            for key in SCENARIOS:
                row(key, f, "rejected_subject", group)

    with (root / "manifest.jsonl").open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r) + "\n")
    print(f"{len(rows)} rows, {len({r['file'] for r in rows})} images -> {root}")


if __name__ == "__main__":
    main()
