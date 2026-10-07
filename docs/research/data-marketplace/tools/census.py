#!/usr/bin/env python3
"""Merge the census scouts' results into census.csv and events.csv, deduplicating by alias and domain.

    python census.py <workflow journal.jsonl> [--decisions decisions.json]

Each scout returned candidate rows. The same platform turns up under several names ("Nexdata" and
"Datatang", "Quandl" and "Nasdaq Data Link") and from several scouts, so rows are merged when they
share a normalised name, an alias or a homepage domain. The merge keeps every scout's view: the first
non-empty value wins for scalar fields, and lists (aliases, docs, supply models) are unioned.

--decisions applies the orchestrator's selection ({slug: {"depth": ..., "reason": ..., "why": ...}})
on top of the scouts' recommendations, so census.csv records what was actually done and why.
"""
import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
GENERIC_HOSTS = {"github.com", "huggingface.co", "medium.com", "linkedin.com", "wikipedia.org",
                 "aws.amazon.com", "amazon.com", "google.com", "cloud.google.com", "microsoft.com",
                 "azure.microsoft.com", "learn.microsoft.com"}


def slugify(name):
    name = re.sub(r"\(.*?\)", "", name)
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def norm(name):
    name = re.sub(r"\(.*?\)", "", name.lower())
    name = re.sub(r"\b(inc|ltd|llc|gmbh|corp|corporation|technologies|technology|the|ai|data|datasets?)\b", " ", name)
    return re.sub(r"[^a-z0-9]+", "", name)


def host(url):
    h = urlparse(url or "").netloc.lower().removeprefix("www.")
    return "" if not h or h in GENERIC_HOSTS else h


def load_results(journal):
    out = []
    for line in Path(journal).read_text(encoding="utf-8").splitlines():
        rec = json.loads(line)
        if rec.get("type") != "result":
            continue
        res = rec.get("result")
        if isinstance(res, dict) and "candidates" in res:
            out.append((rec.get("label") or res.get("scout") or "?", res))
    return out


def main(argv):
    journal = argv[0]
    decisions = {}
    if "--decisions" in argv:
        decisions = json.loads(Path(argv[argv.index("--decisions") + 1]).read_text(encoding="utf-8"))

    groups = []  # each: {"keys": set, "rows": [(scout, row)]}
    events = []
    for scout, res in load_results(journal):
        for ev in res.get("events") or []:
            events.append({**ev, "scout": scout})
        for row in res.get("candidates") or []:
            keys = {("n", norm(row["name"]))} | {("n", norm(a)) for a in row.get("aliases") or [] if norm(a)}
            if host(row.get("homepage")):
                keys.add(("h", host(row["homepage"])))
            keys.discard(("n", ""))
            hit = [g for g in groups if g["keys"] & keys]
            if hit:
                g = hit[0]
                for other in hit[1:]:
                    g["keys"] |= other["keys"]
                    g["rows"] += other["rows"]
                    groups.remove(other)
            else:
                g = {"keys": set(), "rows": []}
                groups.append(g)
            g["keys"] |= keys
            g["rows"].append((scout, row))

    merged = []
    for g in groups:
        rows = [r for _, r in g["rows"]]
        first = lambda k: next((r.get(k) for r in rows if r.get(k)), "")
        docs = {}
        for r in rows:
            for d in r.get("primary_docs") or []:
                docs.setdefault(d["url"], d["kind"])
        depths = [r.get("recommended_depth") for r in rows]
        best = min(depths, key=["deep", "light", "paragraph", "cut"].index)
        name = rows[0]["name"]
        merged.append({
            "slug": slugify(name),
            "name": name,
            "aliases": sorted({a for r in rows for a in [r["name"], *(r.get("aliases") or [])]} - {name}),
            "homepage": first("homepage"),
            "segment": first("segment"),
            "status": first("status"),
            "status_date": first("status_date"),
            "status_url": first("status_url"),
            "status_quote": first("status_quote"),
            "newest_event": first("newest_event"),
            "sells": first("sells"),
            "image_video": "yes" if any(r.get("image_video_catalogue") == "yes" for r in rows) else first("image_video_catalogue"),
            "supply_models": sorted({s for r in rows for s in r.get("supply_models") or []}),
            "primary_docs": docs,
            "mechanism": first("transferable_mechanism"),
            "scout_depth": best,
            "scout_depths": depths,
            "reason_code": next((r["reason_code"] for r in rows if r.get("recommended_depth") == best), ""),
            "why": " | ".join(dict.fromkeys(r.get("why", "") for r in rows if r.get("why"))),
            "scouts": sorted({s for s, _ in g["rows"]}),
        })

    order = ["deep", "light", "paragraph", "cut"]
    merged.sort(key=lambda m: (order.index(m["scout_depth"]), m["segment"], m["slug"]))

    with (ROOT / "census.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["slug", "name", "aliases", "segment", "status", "status_date", "status_url", "status_quote",
                    "newest_event", "sells", "image_video", "supply_models", "primary_doc_count",
                    "scout_depth", "depth", "reason_code", "why", "scouts", "homepage"])
        for m in merged:
            dec = decisions.get(m["slug"]) or (
                {"depth": "paragraph", "reason": "not_selected"} if decisions and m["scout_depth"] != "cut"
                else {"depth": "cut" if decisions else ""})
            w.writerow([m["slug"], m["name"], "; ".join(m["aliases"]), m["segment"], m["status"], m["status_date"],
                        m["status_url"], m["status_quote"], m["newest_event"], m["sells"], m["image_video"],
                        "; ".join(m["supply_models"]), len(m["primary_docs"]), m["scout_depth"],
                        dec.get("depth", ""), dec.get("reason", m["reason_code"]),
                        dec.get("why") or m["why"], "; ".join(m["scouts"]), m["homepage"]])

    with (ROOT / "events.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["date", "type", "parties", "summary", "url", "quote", "scout"])
        seen = set()
        for ev in sorted(events, key=lambda e: e.get("date", ""), reverse=True):
            key = (ev.get("date"), ev.get("url"))
            if key in seen:
                continue
            seen.add(key)
            w.writerow([ev.get("date"), ev.get("type"), "; ".join(ev.get("parties") or []), ev.get("summary"),
                        ev.get("url"), ev.get("quote", ""), ev.get("scout")])

    (ROOT / "ledger" / "_census.json").write_text(json.dumps(merged, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"{sum(len(g['rows']) for g in groups)} rows -> {len(merged)} platforms; {len(seen)} events")
    for depth in order:
        rows = [m for m in merged if m["scout_depth"] == depth]
        print(f"\n== scouts suggest {depth}: {len(rows)}")
        for m in rows:
            print(f"  {m['slug'][:28]:28} {m['segment'][:22]:22} {m['status'][:8]:8} iv={m['image_video'][:3]:3} "
                  f"docs={len(m['primary_docs']):2} x{len(m['scouts'])} | {m['sells'][:95]}")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
