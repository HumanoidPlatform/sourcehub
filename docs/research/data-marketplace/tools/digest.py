#!/usr/bin/env python3
"""Print the ledger in the shapes the report is written from.

    python digest.py questions [Q1 Q2 ...]   every profile's answer per question, by segment
    python digest.py verify                  verification outcomes, overall and per profile
    python digest.py terms [field ...]       the document term table, one field at a time
    python digest.py claims <slug> [section] one profile's claims, for citing

Read-only: nothing here writes to the ledger.
"""
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "ledger"
V = json.loads((Path(__file__).parent / "vocab.json").read_text(encoding="utf-8"))


def load(kind):
    out = []
    for p in sorted(LEDGER.glob("*.json")):
        if p.name.startswith("_"):
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        if d.get("kind") == kind:
            out.append(d)
    return out


def questions(qs):
    profiles = sorted(load("profile"), key=lambda p: (p["segment"], p["slug"]))
    for q in qs or list(V["questions"]):
        print(f"\n######## {q}: {V['questions'][q]}")
        states = Counter()
        for p in profiles:
            c = p["questions"].get(q, {})
            states[c.get("state")] += 1
            if c.get("state") in ("sourced", "partial"):
                ids = ",".join(i.rsplit("-", 1)[-1] for i in c.get("claim_ids", []))
                print(f"- [{p['slug']} | {p['segment']} | {c['state']}] {c.get('answer', '')} ({ids})")
        print(f"  states: {dict(states)}")


def verify():
    total = Counter()
    rows = []
    for v in load("verify"):
        c = Counter(x["status"] for x in v.get("verdicts", []))
        total += c
        rows.append((v["slug"], c, len(v.get("missed", []))))
    print("ALL:", dict(total))
    for slug, c, missed in rows:
        print(f"{slug:32} " + " ".join(f"{k}={n}" for k, n in sorted(c.items())) + f" missed={missed}")


def terms(fields):
    rows = list(csv.DictReader((ROOT / "documents" / "terms.csv").open(encoding="utf-8")))
    for f in fields or V["term_fields"]:
        print(f"\n######## {f}")
        for r in rows:
            if r.get(f):
                print(f"- [{r['slug']}] {r[f]}")


def claims(slug, section=None):
    d = json.loads((LEDGER / f"{slug}.json").read_text(encoding="utf-8"))
    for c in d.get("claims", []):
        if section and c.get("section") != section:
            continue
        src = (c.get("sources") or [{}])[0]
        print(f"{c['id']} [{c['section']}/{c['kind']}/{c['origin']}] {c['statement']}  <{src.get('url')}>")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    cmd, rest = sys.argv[1], sys.argv[2:]
    {"questions": lambda: questions(rest), "verify": verify, "terms": lambda: terms(rest),
     "claims": lambda: claims(*rest)}[cmd]()
