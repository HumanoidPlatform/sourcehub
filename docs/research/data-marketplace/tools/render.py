#!/usr/bin/env python3
"""Validate the claim ledger and render the readable files from it.

    python render.py validate [ledger files...]   structural checks; exit 1 on any error
    python render.py render                       profiles/, matrix.csv, facts.csv, sources.md, documents/
    python render.py gaps                         gaps.md: question x segment, and unknown matrix cells

The ledger (../ledger/*.json) is the source of truth. Everything this writes is derived and is
overwritten on every run; edit the ledger, not the output. Shapes are described in LEDGER.md and the
allowed values live in vocab.json.
"""
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
LEDGER = ROOT / "ledger"
V = json.loads((TOOLS / "vocab.json").read_text(encoding="utf-8"))

DATE = re.compile(r"^\d{4}(-\d{2}){0,2}$")
MAX_QUOTE_CHARS = 160  # 125 asked for; a little slack for copied punctuation
NEEDS_SOURCE = {"confirmed_independent", "confirmed_relayed", "corrected", "refuted"}
# UTF-8 text decoded as cp1252: an a-circumflex or A-tilde followed by a cp1252 continuation byte,
# or the Unicode replacement character. Built from code points so no editor can mangle it.
MOJIBAKE = re.compile(
    chr(0xE2) + "[" + chr(0x80) + "-" + chr(0xBF) + chr(0x201A) + "-" + chr(0x203A) + chr(0x20AC) + chr(0x2122) + "]"
    + "|" + chr(0xC3) + "[" + chr(0x80) + "-" + chr(0xBF) + "]"
    + "|" + chr(0xFFFD))


# --------------------------------------------------------------------------- validate

def check_source(src, where, errs):
    if not isinstance(src, dict):
        errs.append(f"{where}: source is not an object")
        return
    if not str(src.get("url", "")).startswith(("http://", "https://")):
        errs.append(f"{where}: url missing or not http(s)")
    cls = src.get("source_class")
    if cls in V["banned_source_classes"]:
        errs.append(f"{where}: source_class '{cls}' is a discovery lead, never a citation")
    elif cls not in V["source_classes"]:
        errs.append(f"{where}: source_class '{cls}' is not in vocab.json")
    quote = str(src.get("quote") or "").strip()
    if not quote:
        errs.append(f"{where}: no quote")
    elif len(quote) > MAX_QUOTE_CHARS:
        errs.append(f"{where}: quote is {len(quote)} characters; the limit is {MAX_QUOTE_CHARS}")
    if MOJIBAKE.search(quote):
        errs.append(f"{where}: quote contains garbled characters (e.g. 'â€' for a euro sign or dash); re-copy it")
    if not DATE.match(str(src.get("retrieved_at", ""))):
        errs.append(f"{where}: retrieved_at must be YYYY-MM-DD")
    if src.get("fetch_status") not in V["fetch_status"]:
        errs.append(f"{where}: fetch_status '{src.get('fetch_status')}' is not in vocab.json")
    if src.get("fetched_via") not in V["fetched_via"]:
        errs.append(f"{where}: fetched_via '{src.get('fetched_via')}' is not in vocab.json")
    if not src.get("publisher"):
        errs.append(f"{where}: publisher missing")


def check_claim(claim, prefix, seen, errs):
    if not isinstance(claim, dict):
        errs.append("a claim is not an object")
        return
    cid = str(claim.get("id", ""))
    where = cid or "<claim without id>"
    if not re.match(rf"^{re.escape(prefix)}\d{{3,}}$", cid):
        errs.append(f"{where}: id must look like {prefix}001")
    if cid in seen:
        errs.append(f"{where}: duplicate id")
    seen.add(cid)
    if not str(claim.get("statement", "")).strip():
        errs.append(f"{where}: statement missing")
    for key, allowed in (("kind", "claim_kinds"), ("section", "claim_sections"),
                         ("origin", "origins"), ("as_of_basis", "as_of_basis")):
        if claim.get(key) not in V[allowed]:
            errs.append(f"{where}: {key} '{claim.get(key)}' is not in vocab.json")
    if not DATE.match(str(claim.get("as_of", ""))):
        errs.append(f"{where}: as_of must be YYYY, YYYY-MM or YYYY-MM-DD")
    for q in claim.get("question_ids") or []:
        if q not in V["questions"]:
            errs.append(f"{where}: question id '{q}' does not exist")
    if claim.get("kind") == "number":
        value = claim.get("value")
        if not (isinstance(value, dict) and isinstance(value.get("num"), (int, float))
                and value.get("unit") and "basis" in value):
            errs.append(f"{where}: a number needs value {{num, unit, basis, period}}")
    sources = claim.get("sources")
    if not isinstance(sources, list) or not sources:
        errs.append(f"{where}: no sources")
        return
    for i, src in enumerate(sources):
        check_source(src, f"{where} source {i}", errs)


def check_refs(ids, seen, where, errs):
    for cid in ids or []:
        if cid not in seen:
            errs.append(f"{where}: refers to '{cid}', which is not a claim in this file")


def validate_profile(d, errs):
    slug = d.get("slug", "")
    for key in ("name", "segment", "tier", "status", "matrix", "questions", "claims"):
        if key not in d:
            errs.append(f"top level: '{key}' missing")
    if d.get("segment") not in V["segments"]:
        errs.append(f"segment '{d.get('segment')}' is not in vocab.json")
    if d.get("tier") not in V["tiers"]:
        errs.append(f"tier '{d.get('tier')}' is not in vocab.json")

    seen = set()
    for claim in d.get("claims") or []:
        check_claim(claim, f"{slug}-c", seen, errs)

    status = d.get("status") or {}
    if status.get("value") not in V["platform_status"]:
        errs.append(f"status.value '{status.get('value')}' is not in vocab.json")
    elif status.get("value") != "unknown":
        check_refs([status.get("claim_id")], seen, "status", errs)

    matrix = d.get("matrix") or {}
    for field in matrix:
        if field not in V["matrix"]:
            errs.append(f"matrix.{field}: not a field in vocab.json")
    for field, allowed in V["matrix"].items():
        cell = matrix.get(field)
        if not isinstance(cell, dict):
            errs.append(f"matrix.{field}: missing")
            continue
        value = cell.get("value")
        if field in V["matrix_list_fields"]:
            values = value if isinstance(value, list) else [value]
        else:
            values = [value]
        if values == ["unknown"]:
            continue
        if values == ["not_applicable"] and not cell.get("claim_ids"):
            if not str(cell.get("note", "")).strip():
                errs.append(f"matrix.{field}: 'not_applicable' needs a claim id or a one-line reason in note")
            continue
        for v in values:
            if v not in allowed:
                errs.append(f"matrix.{field}: '{v}' is not an allowed value")
        if not cell.get("claim_ids"):
            errs.append(f"matrix.{field}: a value other than 'unknown' needs a claim id")
        check_refs(cell.get("claim_ids"), seen, f"matrix.{field}", errs)

    questions = d.get("questions") or {}
    for q in V["questions"]:
        cell = questions.get(q)
        if not isinstance(cell, dict):
            errs.append(f"questions.{q}: missing")
            continue
        state = cell.get("state")
        if state not in V["question_states"]:
            errs.append(f"questions.{q}: state '{state}' is not in vocab.json")
        if state in ("sourced", "partial") and not cell.get("claim_ids"):
            errs.append(f"questions.{q}: '{state}' needs claim ids")
        if state == "not_applicable" and not str(cell.get("answer", "")).strip():
            errs.append(f"questions.{q}: 'not_applicable' needs a one-line reason in answer")
        check_refs(cell.get("claim_ids"), seen, f"questions.{q}", errs)

    for key in d.get("sections") or {}:
        if key not in V["claim_sections"]:
            errs.append(f"sections.{key}: not a section in vocab.json")
    for i, step in enumerate(d.get("buyer_journey") or []):
        check_refs(step.get("claim_ids"), seen, f"buyer_journey[{i}]", errs)
    for i, unknown in enumerate(d.get("unknowns") or []):
        if unknown.get("reason") not in V["unknown_reasons"]:
            errs.append(f"unknowns[{i}]: reason '{unknown.get('reason')}' is not in vocab.json")
    for i, conflict in enumerate(d.get("conflicts") or []):
        check_refs(conflict.get("claim_ids"), seen, f"conflicts[{i}]", errs)
        if conflict.get("rule_applied") not in V["conflict_rules"]:
            errs.append(f"conflicts[{i}]: rule_applied '{conflict.get('rule_applied')}' is not in vocab.json")


def validate_verify(d, errs):
    slug = d.get("slug", "")
    if not isinstance(d.get("verdicts"), list):
        errs.append("top level: 'verdicts' missing")
    for i, verdict in enumerate(d.get("verdicts") or []):
        where = f"verdicts[{i}] ({verdict.get('claim_id')})"
        if not verdict.get("claim_id"):
            errs.append(f"{where}: claim_id missing")
        if verdict.get("check") not in V["verdict_checks"]:
            errs.append(f"{where}: check '{verdict.get('check')}' is not in vocab.json")
        status = verdict.get("status")
        if status not in V["verdict_status"]:
            errs.append(f"{where}: status '{status}' is not in vocab.json")
        if status in NEEDS_SOURCE:
            if not verdict.get("independent_source"):
                errs.append(f"{where}: '{status}' needs independent_source with a quote")
            else:
                check_source(verdict["independent_source"], where, errs)
        if status == "corrected" and not verdict.get("corrected_statement"):
            errs.append(f"{where}: 'corrected' needs corrected_statement")
    seen = set()
    for claim in d.get("missed") or []:
        check_claim(claim, f"{slug}-v", seen, errs)


def validate_document(d, errs):
    slug = d.get("slug", "")
    for key in ("title", "doc_type", "url", "publisher", "retrieved_at", "terms", "claims"):
        if key not in d:
            errs.append(f"top level: '{key}' missing")
    if not slug.startswith("doc-"):
        errs.append("slug must start with 'doc-'")
    if d.get("doc_type") not in V["doc_types"]:
        errs.append(f"doc_type '{d.get('doc_type')}' is not in vocab.json")
    seen = set()
    for claim in d.get("claims") or []:
        check_claim(claim, f"{slug}-c", seen, errs)
    for field, cell in (d.get("terms") or {}).items():
        if field not in V["term_fields"]:
            errs.append(f"terms.{field}: not a term field in vocab.json")
            continue
        if not isinstance(cell, dict) or not str(cell.get("value", "")).strip():
            errs.append(f"terms.{field}: value missing")
            continue
        if not cell.get("claim_ids"):
            errs.append(f"terms.{field}: needs a claim id")
        check_refs(cell.get("claim_ids"), seen, f"terms.{field}", errs)


VALIDATORS = {"profile": validate_profile, "verify": validate_verify, "document": validate_document}


def validate_file(path):
    errs = []
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return [f"not readable as JSON: {exc}"]
    if not isinstance(d, dict):
        return ["top level is not an object"]
    kind = d.get("kind")
    if kind not in VALIDATORS:
        return [f"kind '{kind}' is not one of {sorted(VALIDATORS)}"]
    expected = {"profile": "{slug}.json", "verify": "{slug}.verify.json", "document": "{slug}.json"}[kind]
    if path.name != expected.format(slug=d.get("slug", "")):
        errs.append(f"file name should be {expected.format(slug=d.get('slug', ''))}")
    VALIDATORS[kind](d, errs)
    return errs


def ledger_files():
    return sorted(p for p in LEDGER.glob("*.json") if not p.name.startswith("_"))


def cmd_validate(args):
    paths = [Path(a) for a in args] or ledger_files()
    bad = 0
    for path in paths:
        errs = validate_file(path)
        if errs:
            bad += 1
            print(f"FAIL {path.name}  ({len(errs)})")
            for err in errs:
                print(f"  - {err}")
        else:
            print(f"ok   {path.name}")
    print(f"\n{len(paths) - bad} of {len(paths)} valid")
    return 1 if bad else 0


# --------------------------------------------------------------------------- load

def load():
    by_kind = defaultdict(list)
    for path in ledger_files():
        try:
            d = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            print(f"skipped (not JSON): {path.name}", file=sys.stderr)
            continue
        by_kind[d.get("kind")].append(d)
    qc_path = LEDGER / "_quotecheck.json"
    quotecheck = json.loads(qc_path.read_text(encoding="utf-8")) if qc_path.exists() else {}
    verify = {d["slug"]: d for d in by_kind["verify"]}
    return by_kind, verify, quotecheck


def cell(text):
    return str(text if text is not None else "").replace("|", "\\|").replace("\n", " ").strip()


def short(cid):
    return cid.rsplit("-", 1)[-1]


def qc_label(quotecheck, key):
    result = quotecheck.get(key)
    if not result:
        return "not run"
    status = result.get("status", "?")
    if status in ("fuzzy", "missing") and "score" in result:
        return f"{status} {result['score']:.2f}"
    return status


def source_line(src, quotecheck, key):
    return (f"  - \u201c{src.get('quote', '')}\u201d \u2014 {src.get('publisher', '')}, "
            f"<{src.get('url', '')}> \u00b7 {src.get('source_class', '')} \u00b7 "
            f"retrieved {src.get('retrieved_at', '')} \u00b7 quote check: {qc_label(quotecheck, key)}")


def claim_block(claim, quotecheck, verdicts):
    value = claim.get("value")
    number = ""
    if isinstance(value, dict):
        number = f" \u00b7 **{value.get('num')} {value.get('unit', '')}** ({value.get('basis', '')}; {value.get('period', '')})"
    scope = ", ".join(v for v in (claim.get("scope") or {}).values() if v)
    lines = [f"- **{short(claim['id'])}** {claim.get('statement', '')}  ",
             f"  _{claim.get('kind')} \u00b7 {claim.get('origin')} \u00b7 as of {claim.get('as_of')} "
             f"({claim.get('as_of_basis')})" + (f" \u00b7 scope: {scope}" if scope else "") + f"_{number}"]
    for i, src in enumerate(claim.get("sources") or []):
        lines.append(source_line(src, quotecheck, f"{claim['id']}#{i}"))
    for n, verdict in verdicts.get(claim["id"], []):
        line = f"  - verifier ({verdict.get('check')}): **{verdict.get('status')}**"
        if verdict.get("corrected_statement"):
            line += f" \u2014 corrected to: {verdict['corrected_statement']}"
        if verdict.get("note"):
            line += f" \u2014 {verdict['note']}"
        lines.append(line)
        if verdict.get("independent_source"):
            lines.append("  " + source_line(verdict["independent_source"], quotecheck,
                                            f"{claim['id']}#v{n}"))
    return lines


def verdict_map(verify_doc):
    out = defaultdict(list)
    for n, verdict in enumerate((verify_doc or {}).get("verdicts") or []):
        out[verdict.get("claim_id")].append((n, verdict))
    return out


# --------------------------------------------------------------------------- render

def render_profile(p, verify_doc, quotecheck):
    verdicts = verdict_map(verify_doc)
    status = p.get("status") or {}
    out = [f"# {p.get('name')}", "",
           f"{p.get('segment')} \u00b7 {p.get('tier')} \u00b7 status: **{status.get('value')}**"
           + (f" \u00b7 also known as {', '.join(p['aliases'])}" if p.get("aliases") else ""), "",
           f"> Rendered from `ledger/{p.get('slug')}.json`. Do not edit; change the ledger and re-render.", ""]
    names = p.get("names_for") or {}
    if names.get("catalogue_side") or names.get("custom_side"):
        out += [f"Calls its off-the-shelf side \u201c{names.get('catalogue_side') or 'unknown'}\u201d "
                f"and its bespoke side \u201c{names.get('custom_side') or 'unknown'}\u201d.", ""]

    out += ["## Matrix", "", "| decision | value | claims | note |", "|---|---|---|---|"]
    for field in V["matrix"]:
        c = (p.get("matrix") or {}).get(field) or {}
        value = c.get("value")
        value = ", ".join(value) if isinstance(value, list) else value
        out.append(f"| {field} | {cell(value)} | {cell(', '.join(short(i) for i in c.get('claim_ids') or []))} "
                   f"| {cell(c.get('note'))} |")

    out += ["", "## The twelve questions", "", "| | state | answer | claims |", "|---|---|---|---|"]
    for q in V["questions"]:
        c = (p.get("questions") or {}).get(q) or {}
        out.append(f"| {q} | {cell(c.get('state'))} | {cell(c.get('answer'))} "
                   f"| {cell(', '.join(short(i) for i in c.get('claim_ids') or []))} |")

    if p.get("sections"):
        out += ["", "## Narrative"]
        for key in V["claim_sections"]:
            if p["sections"].get(key):
                out += ["", f"### {key}", "", p["sections"][key]]
    if p.get("buyer_journey"):
        out += ["", "## Buyer journey", ""]
        for i, step in enumerate(p["buyer_journey"], 1):
            refs = ", ".join(short(c) for c in step.get("claim_ids") or [])
            out.append(f"{i}. {step.get('step', '')}" + (f" [{refs}]" if refs else ""))

    out += ["", "## Claims"]
    by_section = defaultdict(list)
    for claim in p.get("claims") or []:
        by_section[claim.get("section")].append(claim)
    for key in V["claim_sections"]:
        if by_section.get(key):
            out += ["", f"### {key}", ""]
            for claim in by_section[key]:
                out += claim_block(claim, quotecheck, verdicts)

    missed = (verify_doc or {}).get("missed") or []
    if missed:
        out += ["", "## Added by the verifier", ""]
        for claim in missed:
            out += claim_block(claim, quotecheck, {})
    if p.get("unknowns"):
        out += ["", "## Unknown", ""]
        for u in p["unknowns"]:
            tried = ", ".join(f"<{x}>" for x in u.get("urls_tried") or [])
            out.append(f"- `{u.get('field')}` \u2014 {u.get('reason')}" + (f"; tried {tried}" if tried else ""))
    if p.get("conflicts"):
        out += ["", "## Conflicts", ""]
        for c in p["conflicts"]:
            out.append(f"- {', '.join(short(i) for i in c.get('claim_ids') or [])}: "
                       f"{c.get('resolution', '')} ({c.get('rule_applied', '')})")
    if p.get("leads"):
        out += ["", "## Leads, not cited", ""]
        for lead in p["leads"]:
            out.append(f"- <{lead.get('url')}> \u2014 {lead.get('why', '')}")
    return "\n".join(out) + "\n"


def all_claims(by_kind):
    """Yield (owner_slug, claim, verify_doc_or_None) across profiles, verifier additions and documents."""
    for d in by_kind["profile"] + by_kind["document"]:
        for claim in d.get("claims") or []:
            yield d["slug"], claim
    for d in by_kind["verify"]:
        for claim in d.get("missed") or []:
            yield d["slug"], claim


def cmd_render(_args):
    by_kind, verify, quotecheck = load()
    profiles = sorted(by_kind["profile"], key=lambda p: (p.get("segment", ""), p.get("slug", "")))

    out_dir = ROOT / "profiles"
    out_dir.mkdir(exist_ok=True)
    for p in profiles:
        (out_dir / f"{p['slug']}.md").write_text(
            render_profile(p, verify.get(p["slug"]), quotecheck), encoding="utf-8")

    with (ROOT / "matrix.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        header = ["slug", "name", "segment", "tier", "status"]
        for field in V["matrix"]:
            header += [field, f"{field}__claims"]
        w.writerow(header)
        for p in profiles:
            row = [p["slug"], p.get("name"), p.get("segment"), p.get("tier"), (p.get("status") or {}).get("value")]
            for field in V["matrix"]:
                c = (p.get("matrix") or {}).get(field) or {}
                value = c.get("value")
                row += ["; ".join(value) if isinstance(value, list) else value,
                        "; ".join(c.get("claim_ids") or [])]
            w.writerow(row)

    verdict_status = defaultdict(list)
    for v in by_kind["verify"]:
        for verdict in v.get("verdicts") or []:
            verdict_status[verdict.get("claim_id")].append(verdict.get("status"))
    with (ROOT / "facts.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["owner", "claim_id", "statement", "num", "unit", "basis", "period", "scope", "origin",
                    "as_of", "url", "quote", "quote_check", "verdicts"])
        for owner, claim in all_claims(by_kind):
            if claim.get("kind") != "number":
                continue
            value = claim.get("value") or {}
            src = (claim.get("sources") or [{}])[0]
            w.writerow([owner, claim["id"], claim.get("statement"), value.get("num"), value.get("unit"),
                        value.get("basis"), value.get("period"),
                        ", ".join(v for v in (claim.get("scope") or {}).values() if v),
                        claim.get("origin"), claim.get("as_of"), src.get("url"), src.get("quote"),
                        qc_label(quotecheck, f"{claim['id']}#0"),
                        "; ".join(verdict_status.get(claim["id"], []))])

    by_host = defaultdict(dict)
    def note(src, cid):
        if not src or not src.get("url"):
            return
        entry = by_host[urlparse(src["url"]).netloc.removeprefix("www.")].setdefault(
            src["url"], {"src": src, "ids": []})
        entry["ids"].append(cid)
    for _owner, claim in all_claims(by_kind):
        for src in claim.get("sources") or []:
            note(src, claim["id"])
    for v in by_kind["verify"]:
        for verdict in v.get("verdicts") or []:
            note(verdict.get("independent_source"), f"{verdict.get('claim_id')} (verifier)")
    lines = ["# Sources", "",
             "Every URL cited in the ledger, grouped by site. Rendered; do not edit.", ""]
    total = 0
    for host in sorted(by_host):
        lines += [f"## {host}", ""]
        for url, entry in sorted(by_host[host].items()):
            total += 1
            src = entry["src"]
            lines.append(f"- <{url}> \u2014 {src.get('publisher', '')} \u00b7 {src.get('source_class', '')} "
                         f"\u00b7 retrieved {src.get('retrieved_at', '')} \u00b7 cited by {', '.join(entry['ids'])}")
        lines.append("")
    lines.insert(3, f"{total} URLs across {len(by_host)} sites.")
    (ROOT / "sources.md").write_text("\n".join(lines), encoding="utf-8")

    docs = sorted(by_kind["document"], key=lambda d: d.get("slug", ""))
    if docs:
        doc_dir = ROOT / "documents"
        doc_dir.mkdir(exist_ok=True)
        with (doc_dir / "terms.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["slug", "platform", "title", "doc_type", "version_or_date", "url"] + V["term_fields"])
            for d in docs:
                terms = d.get("terms") or {}
                w.writerow([d["slug"], d.get("platform_slug"), d.get("title"), d.get("doc_type"),
                            d.get("version_or_date"), d.get("url")]
                           + [(terms.get(f) or {}).get("value", "") for f in V["term_fields"]])
        lines = ["# Primary documents", "", "Rendered from the ledger; do not edit.", ""]
        for d in docs:
            lines += [f"## {d.get('title')} \u2014 {d.get('publisher')}", "",
                      f"`{d['slug']}` \u00b7 {d.get('doc_type')} \u00b7 {d.get('version_or_date') or 'undated'} "
                      f"\u00b7 <{d.get('url')}> \u00b7 retrieved {d.get('retrieved_at')}", ""]
            parties = d.get("parties") or {}
            if any(parties.values()):
                lines += [f"Licensor: {parties.get('licensor') or '?'} \u00b7 licensee: "
                          f"{parties.get('licensee') or '?'} \u00b7 operator's role: "
                          f"{parties.get('operator_role') or '?'}", ""]
            claims = {c["id"]: c for c in d.get("claims") or []}
            for field in V["term_fields"]:
                term = (d.get("terms") or {}).get(field)
                if not term:
                    continue
                lines.append(f"- **{field}** \u2014 {term.get('value')}")
                for cid in term.get("claim_ids") or []:
                    for i, src in enumerate((claims.get(cid) or {}).get("sources") or []):
                        lines.append(f"  - \u201c{src.get('quote', '')}\u201d \u00b7 quote check: "
                                     f"{qc_label(quotecheck, f'{cid}#{i}')}")
            for u in d.get("unknowns") or []:
                lines.append(f"- _unknown_: `{u.get('field')}` \u2014 {u.get('reason')}")
            lines.append("")
        (doc_dir / "index.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"{len(profiles)} profiles, {len(docs)} documents, {total} source URLs rendered")
    return 0


# --------------------------------------------------------------------------- gaps

def cmd_gaps(_args):
    by_kind, _verify, _quotecheck = load()
    profiles = by_kind["profile"]
    grid = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for p in profiles:
        for q in V["questions"]:
            state = ((p.get("questions") or {}).get(q) or {}).get("state", "missing")
            grid[q][p.get("segment")][state].append(p["slug"])
    segments = [s for s in V["segments"] if any(p.get("segment") == s for p in profiles)]
    lines = ["# Gap grid", "", "Rendered from the ledger; do not edit.", "",
             "## Questions by segment", "",
             "Each cell is sourced / partial / unknown. Not-applicable profiles are left out.", "",
             "| | " + " | ".join(segments) + " | all |", "|---|" + "---|" * (len(segments) + 1)]
    for q in V["questions"]:
        row, tot = [], [0, 0, 0]
        for seg in segments:
            c = grid[q][seg]
            counts = [len(c["sourced"]), len(c["partial"]), len(c["unknown"]) + len(c["missing"])]
            tot = [a + b for a, b in zip(tot, counts)]
            row.append("/".join(str(n) for n in counts))
        lines.append(f"| {q} | " + " | ".join(row) + f" | {'/'.join(str(n) for n in tot)} |")
    lines += ["", "## Matrix cells still unknown", "", "| decision | unknown in | profiles |", "|---|---|---|"]
    for field in V["matrix"]:
        unknown = [p["slug"] for p in profiles
                   if ((p.get("matrix") or {}).get(field) or {}).get("value") in (None, "unknown", ["unknown"])]
        lines.append(f"| {field} | {len(unknown)} of {len(profiles)} | {cell(', '.join(sorted(unknown)))} |")
    (ROOT / "gaps.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"gaps.md written for {len(profiles)} profiles")
    return 0


COMMANDS = {"validate": cmd_validate, "render": cmd_render, "gaps": cmd_gaps}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(2)
    sys.exit(COMMANDS[sys.argv[1]](sys.argv[2:]))
