"""db/560 brings Terms & Conditions version 1.1; 0060 carries it.

Version 1.0 (db/470) went live with bracketed values Legal had not filled in,
and an accepted version can never change, so the complete text is a new
version. 1.1 is 1.0 word for word except for the edits agreed on 20 October
2026 (db/560's header lists them). What this file guards:

  * 1.1 holds no [placeholder], so the console stops calling it a draft;
  * nothing else changed: the same title, checkbox and declaration, and only
    the agreed clauses differ from 1.0;
  * no clause points at the grievance contact or the arbitration clause that
    were removed;
  * the Terms, the console's Privacy Policy and the phone's privacy notice
    name the same operator;
  * the migration carries the SQL verbatim and its downgrade never removes an
    accepted version.

Files only; no database is opened.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL_10 = (ROOT / "db" / "470_platform_terms.sql").read_text(encoding="utf-8").replace("\r\n", "\n")
SQL_11 = (ROOT / "db" / "560_terms_1_1.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (ROOT / "backend" / "migrations" / "versions" / "0060_terms_1_1.py").read_text(
    encoding="utf-8"
)
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
OPERATOR = "CoSarathi Group Private Limited"


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _insert(sql: str) -> str:
    start = sql.index("INSERT INTO platform_terms")
    return sql[start:sql.index("$fn$\n);", start)]


def _body(sql: str) -> str:
    ins = _insert(sql)
    return ins[ins.index("$fn$") + 4:]


def _head(sql: str) -> str:
    """Everything the INSERT says before the body: version, title, date, checkbox, declaration."""
    ins = _insert(sql)
    return ins[:ins.index("$fn$")]


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_11


def test_the_migration_follows_0059():
    assert re.search(r'^revision = "0060"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0059"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_550_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[listed.index("560_terms_1_1") - 1] == "550_offer_push"


def test_the_text_is_one_statement_for_the_splitter():
    ns: dict = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0060", "exec"), ns)
    up = ns["_statements"](_literal("_UP"))
    assert len(up) == 1 and "INSERT INTO platform_terms" in up[0] and up[0].endswith(");")


def test_the_downgrade_never_removes_an_accepted_version():
    down = _literal("_DOWN")
    guard = down.index("IF EXISTS (SELECT 1 FROM terms_acceptance WHERE version = '1.1')")
    assert guard < down.index("DELETE FROM platform_terms WHERE version = '1.1'")
    assert "version = '1.0'" not in down


# ---------------------------------------------------------------------------
# Version 1.1 is complete, and otherwise 1.0
# ---------------------------------------------------------------------------
def test_version_one_one_takes_effect_when_migrated():
    head = _head(SQL_11)
    assert "'1.1'," in head and "  now()," in head


def test_no_placeholder_is_left():
    # the console marks the Terms a draft while the body holds any [..]
    # (frontend/src/features/legal/terms.tsx hasPlaceholders)
    assert re.findall(r"\[[^\]]+\]", _body(SQL_11)) == []


def test_the_title_checkbox_and_declaration_are_unchanged():
    def strip(h: str) -> str:
        return re.sub(r"'1\.[01]',|'2026-10-15 00:00:00\+05:30',|now\(\),", "", h)

    assert strip(_head(SQL_11)) == strip(_head(SQL_10))


def test_all_fifteen_sections_remain():
    assert re.findall(r"^## (\d+)\. ", _body(SQL_11), re.M) == [str(i) for i in range(1, 16)]
    assert "## 13. Disputes and governing law" in _body(SQL_11)


def test_only_the_agreed_clauses_differ_from_one_zero():
    old, new = _body(SQL_10).splitlines(), _body(SQL_11).splitlines()
    added = [ln for ln in new if ln not in old]
    removed = [ln for ln in old if ln not in new]
    changed_from = ("- Platform:", "6.4 ", "6.7 ", "7.1 ", "7.6 ", "7.7 ", "9.7 ", "11.4 ",
                    "13.2 ", "13.3 Arbitration.", "13.4 Governing law and courts.", "13.5 Urgent",
                    "14.6 ", "14.9 Grievance contact.", "The registration page shows")
    changed_to = ("- Platform:", "6.4 ", "6.7 ", "7.1 ", "7.6 ", "7.7 ", "9.7 ", "11.4 ",
                  "13.2 ", "13.3 Governing law.", "13.4 Urgent relief.", "14.6 ",
                  "The registration page shows")
    assert [ln for ln in removed if not ln.startswith(changed_from)] == []
    assert [ln for ln in added if not ln.startswith(changed_to)] == []
    assert len(removed) == len(changed_from) and len(added) == len(changed_to)


def test_the_agreed_wording():
    body = _body(SQL_11)
    for line in (
        f"operated by {OPERATOR} (",
        "7.7 Overdue amounts. We may set off amounts you owe us against any amount we hold "
        "for you.",
        "will not exceed the fees you paid to DataMind360 in the 12 months before the claim arose.",
        "13.3 Governing law. These Terms are governed by the laws of India.",
        "14.6 Notices. We may give notice through the Platform or by email to the address on your "
        "account. Notices are treated as received 24 hours after they are sent.",
    ):
        assert line in body, line


def test_nothing_points_at_a_removed_clause():
    body = _body(SQL_11)
    assert "grievance" not in body.lower()
    assert "Arbitration" not in body and "Section 13.3" not in body and "Section 14" not in body
    assert "13.5" not in body and "14.9" not in body


# ---------------------------------------------------------------------------
# One operator across the Terms, the Privacy Policy and the phone's notice
# ---------------------------------------------------------------------------
def test_the_privacy_policy_and_the_phone_notice_name_the_same_operator():
    for path in (ROOT / "frontend" / "src" / "features" / "legal" / "pages.tsx",
                 ROOT / "mobile" / "src" / "consent.ts"):
        assert f'name: "{OPERATOR}"' in path.read_text(encoding="utf-8"), path.name
