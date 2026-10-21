"""Nothing a person reads names SourceHub; 0061 carries the operator's legal name.

SourceHub is this repository's name. People see DataMind360 (the product) and
Cosarathi (the company); config.py keeps the internal names — package, roles,
buckets, storage keys — on purpose. What this file guards:

  * the platform organisation's legal name is the operator Terms 1.1 names,
    in the seed for a new database and through 0061 for an existing one;
  * 0061 moves only a row still holding the old placeholder, and its
    downgrade is the exact mirror;
  * no console or phone screen, and no e-mail template, says SourceHub
    (comments may: they are for us);
  * the object the storage check writes into a client's own bucket names the
    product: it is deleted at once, but soft delete, versioning and access
    logs keep its name where the client can read it.

Files only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = (ROOT / "db" / "900_seed.sql").read_text(encoding="utf-8")
TERMS_11 = (ROOT / "db" / "560_terms_1_1.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0061_operator_legal_name.py"
).read_text(encoding="utf-8")
OPERATOR = "CoSarathi Group Private Limited"
PLACEHOLDER = "SourceHub Ltd"


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


# ---------------------------------------------------------------------------
# The legal name
# ---------------------------------------------------------------------------
def test_the_seed_gives_the_platform_the_operators_legal_name():
    start = SEED.index("INSERT INTO organisation (reference_code, kind, name, legal_name")
    insert = SEED[start:SEED.index(";", start)]
    assert "'platform'" in insert
    assert f"'{OPERATOR}'" in insert
    assert PLACEHOLDER not in SEED


def test_the_legal_name_is_the_operator_the_terms_name():
    assert OPERATOR in TERMS_11


def test_0061_follows_0060():
    assert re.search(r'^revision = "0061"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0060"$', MIGRATION_TEXT, re.M)


def test_0061_moves_only_the_placeholder_and_the_downgrade_is_its_mirror():
    up, down = _literal("_UP"), _literal("_DOWN")
    assert f"SET legal_name = '{OPERATOR}'" in up
    assert f"kind = 'platform' AND legal_name = '{PLACEHOLDER}'" in up
    # swapping the two values turns the upgrade into the downgrade, word for word
    swapped = up.replace(OPERATOR, "\0").replace(PLACEHOLDER, OPERATOR).replace("\0", PLACEHOLDER)
    assert swapped == down
    # one statement each way: asyncpg refuses two in one execute
    assert up.count("UPDATE") == 1 and down.count("UPDATE") == 1


# ---------------------------------------------------------------------------
# No screen and no e-mail says SourceHub
# ---------------------------------------------------------------------------
def _code_without_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)       # block and JSX comments
    return re.sub(r"(^|\s)//.*$", r"\1", text, flags=re.M)  # line comments, not https://


def _sources() -> list[Path]:
    out = []
    for base in (ROOT / "frontend" / "src", ROOT / "mobile" / "src"):
        for p in base.rglob("*"):
            if p.suffix not in (".ts", ".tsx") or ".test." in p.name or "__tests__" in p.parts:
                continue
            out.append(p)
    return out


def test_the_sources_were_actually_found():
    names = {p.name for p in _sources()}
    assert len(names) > 100
    assert {"pages.tsx", "consent.ts"} <= names


def test_no_console_or_phone_screen_says_sourcehub():
    offenders = [
        str(p.relative_to(ROOT))
        for p in _sources()
        if "SourceHub" in _code_without_comments(p.read_text(encoding="utf-8"))
    ]
    assert not offenders, f"SourceHub outside a comment in: {offenders}"


def test_the_storage_form_names_the_product():
    pages = ROOT / "frontend" / "src" / "features" / "marketplace" / "pages.tsx"
    text = pages.read_text(encoding="utf-8")
    assert "{PRODUCT} signs each upload" in text
    assert "e.g. sourcehub/" not in text


def test_no_email_template_says_sourcehub():
    folder = ROOT / "backend" / "src" / "sourcehub" / "platform" / "mail" / "templates"
    templates = list(folder.glob("*"))
    assert templates, "no mail templates found"
    offenders = [p.name for p in templates if "sourcehub" in p.read_text(encoding="utf-8").lower()]
    assert not offenders, f"an e-mail names SourceHub: {offenders}"


def test_the_storage_check_names_the_product_in_the_clients_bucket():
    storage = ROOT / "backend" / "src" / "sourcehub" / "platform" / "storage"
    for name in ("azure_store.py", "gcs_store.py", "s3_store.py"):
        text = (storage / name).read_text(encoding="utf-8")
        assert 't.key(f".datamind360-probe/{uuid.uuid4()}")' in text, name
        assert 'body = b"DataMind360 destination check"' in text, name
        assert "sourcehub-probe" not in text and "sourcehub destination" not in text, name
