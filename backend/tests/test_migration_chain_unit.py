"""The migrations form one chain, and every schema file reaches the bundle.

Two people added a migration on the same day and both called it 0023. Alembic
warned — "Revision 0023 is present more than once" — and reported two heads,
which is a state in which `alembic upgrade head` refuses to run at all. Nothing
noticed: `make revision` takes the number by hand, there is no CI, and 181 tests
passed because none of them read the migration directory as a whole.

The same pull left db/210_asset_review.sql out of infra/bundle_schema.sh, whose
STRUCTURE list is explicit by design. A file missing from it works in compose,
where db/ is mounted wholesale, and is simply absent from every database built
from the bundle — the failure is a missing column in production and nowhere
else.

Both are properties of the set of files, not of any one file, so they need a
test that looks at the set. Scripts only; no database is opened.

    pytest tests/test_migration_chain_unit.py
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
VERSIONS = BACKEND / "migrations" / "versions"
DB = ROOT / "db"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

MIGRATIONS = sorted(p for p in VERSIONS.glob("*.py") if p.name != "__init__.py")
SCHEMA_FILES = sorted(DB.glob("*.sql"))


def _ids() -> list[tuple[str, str, str | None]]:
    """(file, revision, down_revision) read off the source, not through alembic.

    Read directly because alembic's revision map keys on the id and so holds
    ONE entry for a duplicated id — the collision this guards against would be
    invisible to it. get_heads() does surface it; this is the second witness.
    """
    out = []
    for p in MIGRATIONS:
        text = p.read_text(encoding="utf-8")
        rev = re.search(r'^revision\s*=\s*"([^"]+)"', text, re.M)
        down = re.search(r'^down_revision\s*=\s*(None|"([^"]+)")', text, re.M)
        assert rev and down, f"{p.name}: no revision/down_revision at column 0"
        out.append((p.name, rev.group(1), down.group(2)))
    return out


def _bundle_lists() -> tuple[list[str], list[str]]:
    """STRUCTURE and SEED as the shell script will expand them.

    Parsed out of the assignments rather than grepped, so a file named only in
    a comment ("910_seed_demo is deliberately absent") does not count as bundled.
    """
    text = BUNDLE.read_text(encoding="utf-8")
    lists = {}
    for name in ("STRUCTURE", "SEED"):
        m = re.search(rf'^{name}="([^"]*)"', text, re.M)
        assert m, f"no {name}= assignment in {BUNDLE.name}"
        lists[name] = m.group(1).split()
    return lists["STRUCTURE"], lists["SEED"]


# ---------------------------------------------------------------------------
# Anti-vacuous. Every assertion below is over a glob; an empty glob passes.
# ---------------------------------------------------------------------------


def test_the_files_were_actually_found():
    assert len(MIGRATIONS) >= 15, f"only {len(MIGRATIONS)} migrations under {VERSIONS}"
    assert len(SCHEMA_FILES) >= 20, f"only {len(SCHEMA_FILES)} files under {DB}"


# ---------------------------------------------------------------------------
# One chain
# ---------------------------------------------------------------------------


def test_exactly_one_alembic_head():
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(VERSIONS.parent))
    # alembic.ini predates path_separator; set it here so the check runs warning-free
    cfg.set_main_option("path_separator", "os")
    heads = ScriptDirectory.from_config(cfg).get_heads()
    assert len(heads) == 1, (
        f"alembic sees {len(heads)} heads {heads}: two migrations share a revision id "
        "or branch from the same parent. `alembic upgrade head` will refuse to run."
    )


def test_no_two_migrations_share_a_revision_id():
    dupes = {k: v for k, v in Counter(rev for _, rev, _ in _ids()).items() if v > 1}
    assert not dupes, (
        f"revision ids used more than once: {dupes}. The higher-numbered file that "
        "is not yet deployed should renumber."
    )


def test_the_chain_is_linear_and_unbroken():
    ids = _ids()
    known = {rev for _, rev, _ in ids}
    roots = [f for f, _, down in ids if down is None]
    assert len(roots) == 1, f"expected one root migration, found {roots}"
    dangling = [(f, down) for f, _, down in ids if down is not None and down not in known]
    assert not dangling, f"down_revision points at nothing: {dangling}"
    # Two files revising the same parent is a fork, even with distinct ids.
    forks = {k: v for k, v in Counter(down for _, _, down in ids if down).items() if v > 1}
    assert not forks, f"more than one migration revises the same parent: {forks}"


# ---------------------------------------------------------------------------
# db/*.sql and the bundle
# ---------------------------------------------------------------------------


def test_no_two_schema_files_share_a_number():
    numbers = Counter(p.name[:3] for p in SCHEMA_FILES)
    dupes = {k: v for k, v in numbers.items() if v > 1}
    assert not dupes, (
        f"db/ numbers used more than once: {dupes}. Bootstrap order is by filename, so "
        "this still runs — but one change, one number, and the bundle lists them by name."
    )


def test_every_structure_file_is_in_the_bundle():
    structure, _ = _bundle_lists()
    # 9xx files are seed data and are listed under SEED (or deliberately not at
    # all, as 910_seed_demo is); everything below that is schema and must ship.
    schema = [p.stem for p in SCHEMA_FILES if not p.name.startswith("9")]
    missing = sorted(set(schema) - set(structure))
    assert not missing, (
        f"in db/ but not in bundle_schema.sh STRUCTURE: {missing}. Compose runs it; "
        "every database built from the bundle will silently lack it."
    )


def test_the_bundle_names_no_file_that_does_not_exist():
    structure, seed = _bundle_lists()
    stems = {p.stem for p in SCHEMA_FILES}
    stale = sorted(set(structure + seed) - stems)
    assert not stale, f"bundle_schema.sh lists files that are not in db/: {stale}"


def test_structure_is_listed_in_apply_order():
    structure, _ = _bundle_lists()
    assert structure == sorted(structure), (
        "STRUCTURE must be in filename order — it is the order the entrypoint applies db/*.sql"
    )
