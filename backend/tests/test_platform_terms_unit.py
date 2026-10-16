"""db/470 brings the Onboarding Terms & Conditions; 0051 carries it.

Nobody uses the Platform before "I Accept" (Terms §2.1): invitees accept while
setting a password, and a signed-in person with a version due reaches nothing
but the gate's own routes. What was accepted is evidence (§2.2): the version's
text is hashed and frozen once accepted, and the acceptance is never changed.
Crowd workers are not asked. A DataHub seller declares its rights on submitting
a listing (§4.4, §8.2).

Scripts and the API's own guards only; no database is opened.
"""

from __future__ import annotations

import ast
import asyncio
import re
import uuid
from pathlib import Path

import pytest
from fastapi import HTTPException

from sourcehub.api import deps
from sourcehub.api.security import AccessClaims, decode_access_token, issue_access_token

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "470_platform_terms.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0051_platform_terms.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _function(name: str) -> str:
    start = SQL_TEXT.index(f"CREATE OR REPLACE FUNCTION {name}(")
    return SQL_TEXT[start:SQL_TEXT.index("$fn$;", start)]


def _claims(**kw) -> AccessClaims:
    base = dict(
        user_id=uuid.uuid4(), full_name="A", email="a@x.example", org_id=uuid.uuid4(),
        org_kind="client", org_name="Acme", role="client", scope="owner",
        capabilities=frozenset({"catalogue.list"}), mfa_satisfied=True, must_change_password=False,
    )
    return AccessClaims(**{**base, **kw})


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0050():
    assert re.search(r'^revision = "0051"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0050"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_460_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[listed.index("470_platform_terms") - 1] == "460_datahub_name"


def test_the_downgrade_refuses_once_anybody_accepted_and_then_drops_everything():
    down = _literal("_DOWN")
    assert down.index("IF EXISTS (SELECT 1 FROM terms_acceptance)") < down.index("DROP TABLE")
    for gone in ("DROP TABLE terms_acceptance", "DROP TABLE platform_terms",
                 "DROP FUNCTION terms_due()", "DROP COLUMN rights_attested_at"):
        assert gone in down, gone


def test_the_body_is_one_statement_for_the_splitter():
    # the Terms text has semicolons in it; it is quoted with $fn$ so the
    # migration's splitter keeps the INSERT whole
    ns: dict = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0051", "exec"), ns)
    inserts = [s for s in ns["_statements"](_literal("_UP")) if "INSERT INTO platform_terms" in s]
    assert len(inserts) == 1 and inserts[0].endswith(");")


# ---------------------------------------------------------------------------
# Version 1.0 is the document
# ---------------------------------------------------------------------------
def test_version_one_holds_all_fifteen_sections_and_the_acceptance_wording():
    body = SQL_TEXT[SQL_TEXT.index("INSERT INTO platform_terms"):]
    headings = re.findall(r"^## (\d+)\. ", body, re.M)
    assert headings == [str(i) for i in range(1, 16)]
    assert "'I have read, understood and agree to be bound by the DataMind360 Onboarding Terms" in body
    declaration = body[body.index("ARRAY["):body.index("],")]
    assert declaration.count("',") + declaration.count("'\n") >= 5
    assert "'2026-10-15 00:00:00+05:30'" in body


# ---------------------------------------------------------------------------
# Evidence: hashed by the database, frozen once accepted, never changed
# ---------------------------------------------------------------------------
def test_the_hash_is_set_by_the_database_and_an_accepted_version_is_frozen():
    guard = _function("platform_terms_guard")
    assert "NEW.sha256 := encode(sha256(" in guard
    assert "EXISTS (SELECT 1 FROM terms_acceptance WHERE version = OLD.version)" in guard
    assert "BEFORE INSERT OR UPDATE OR DELETE ON platform_terms" in SQL_TEXT


def test_an_acceptance_is_never_changed_and_only_the_functions_write_one():
    assert "BEFORE UPDATE OR DELETE ON terms_acceptance" in SQL_TEXT
    assert "RAISE EXCEPTION" in _function("terms_acceptance_frozen")
    # rules would forbid terms_record's ON CONFLICT outright
    assert "CREATE RULE" not in SQL_TEXT
    assert "REVOKE ALL ON platform_terms, terms_acceptance FROM sourcehub_app;" in SQL_TEXT
    assert "GRANT SELECT ON platform_terms, terms_acceptance TO sourcehub_app;" in SQL_TEXT
    revoke = SQL_TEXT.split("terms_record(uuid, uuid, text, text, inet, text)")[1]
    assert revoke.lstrip().startswith("FROM PUBLIC, sourcehub_app;")
    assert "GRANT EXECUTE ON FUNCTION terms_record" not in SQL_TEXT


def test_only_the_version_in_effect_is_accepted():
    assert "p_version IS DISTINCT FROM terms_current_version()" in _function("terms_record")


def test_the_invitation_acceptance_must_share_the_invitations_transaction():
    assert "inv.accepted_at IS DISTINCT FROM now()" in _function("invitation_terms_accept")


def test_crowd_workers_are_not_asked():
    assert "r.code <> 'worker'" in _function("terms_due")
    assert "r.code <> 'worker'" in _function("invitation_terms_due")


# ---------------------------------------------------------------------------
# The gate on the server
# ---------------------------------------------------------------------------
def test_the_token_carries_the_version_due():
    c = _claims(terms_due="1.0")
    assert decode_access_token(issue_access_token(c)).terms_due == "1.0"
    assert decode_access_token(issue_access_token(_claims())).terms_due is None


def test_get_principal_refuses_while_the_terms_are_due():
    with pytest.raises(HTTPException) as e:
        asyncio.run(deps.get_principal(_claims(terms_due="1.0")))
    assert e.value.status_code == 403 and "Terms" in e.value.detail
    assert asyncio.run(deps.get_principal(_claims())).terms_due is None


def test_every_guard_and_the_org_session_stand_on_get_principal():
    text = (SRC / "api" / "deps.py").read_text(encoding="utf-8")
    for name in ("get_session", "require_capability", "require_any_capability",
                 "require_member_admin", "require_mfa"):
        start = text.index(f"def {name}(")
        nxt = text.find("\ndef ", start + 1)
        assert "Depends(get_principal)" in text[start:nxt if nxt > 0 else None], name


def test_only_the_gates_own_routes_skip_it():
    users: dict[str, list[str]] = {}
    for path in (SRC / "api").rglob("*.py"):
        if path.name == "deps.py":  # where get_principal itself stands on it
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for fn in (n for n in ast.walk(tree) if isinstance(n, ast.AsyncFunctionDef)):
            if "get_principal_pending_terms" in ast.unparse(fn.args):
                users.setdefault(path.name, []).append(fn.name)
    assert users == {"auth.py": ["logout", "me", "change_password"], "terms.py": ["accept"]}


# ---------------------------------------------------------------------------
# The DataHub seller's declaration
# ---------------------------------------------------------------------------
def test_a_listing_goes_to_review_only_with_the_declaration_recorded():
    service = (SRC / "modules" / "catalogue" / "service.py").read_text(encoding="utf-8")
    body = service[service.index("async def submit("):service.index("async def pull_back(")]
    assert body.index("if not attest:") < body.index("_readiness(") < body.index("_move(")
    assert '"rights_attested_at"' in body and '"rights_attested_by": claims.user_id' in body
    assert "GRANT UPDATE (rights_attested_at, rights_attested_by) ON datahub_dataset" in SQL_TEXT
