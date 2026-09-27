"""Sibling equipment visibility must be gated on WHO is asking, not only on WHOSE.

The bug this guards against shipped, and was found in production. Fix 7
(db/110_auth_functions.sql) opened sibling equipment so a supplier could see
what it may borrow, with the predicate:

    USING (org_is_my_network_sibling(sponsor_org_id))

which asks whether the OWNER is a sibling and never who is asking. A device
sponsor is itself a child of a tenant, so every other sponsor under that tenant
is its sibling; permissive policies OR together, so this overrode the own-org
clause in equipment_select for exactly the party that must not have it. A newly
onboarded sponsor opened Inventory and saw its two competitors' unit counts and
calibration dates under the heading "Your fleet".

conftest.py's sibling_context fixture — "The one that catches a missing
predicate" — raises NotImplementedError, so the harness built for precisely this
leak does not exist. These read the SQL instead, as test_org_members_unit.py
does, and for the same reason.

Two disciplines carried over from that file, both learned the hard way here:

  * every SQL assertion runs through _strip_comments. The words "aggregator",
    "business" and "sponsor" all appear in db/210's header prose, so an
    unstripped grep would pass with the gate deleted.
  * every Python assertion goes through the AST, never the file's text. The new
    predicate's own comment contains a double-quoted phrase, so a regex over
    string literals would scoop it up.

    pytest tests/test_equipment_sibling_scope_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "220_equipment_sibling_scope.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0024_equipment_sibling_scope.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "network" / "service.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
TREE = ast.parse(SERVICE.read_text(encoding="utf-8"))


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _up_block() -> str:
    m = re.search(r'_UP = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, "no _UP literal in the migration"
    return m.group(1)


def _policy_using(sql: str) -> str:
    """The USING(...) body of the CREATE POLICY, code only."""
    m = re.search(
        r"CREATE POLICY equipment_select_siblings ON equipment FOR SELECT\s*USING\s*\((.*?)\);",
        sql,
        re.S,
    )
    assert m, "no equipment_select_siblings CREATE POLICY in the given SQL"
    return m.group(1)


def _function(name: str) -> ast.AsyncFunctionDef:
    for node in ast.walk(TREE):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in {SERVICE.name}")


def _sql_of(name: str) -> str:
    """The text(...) literal inside a service function, via the AST.

    Adjacent string literals are folded by the parser into ONE Constant, so this
    returns the whole query — and cannot pick up a comment, which is the point.
    """
    for node in ast.walk(_function(name)):
        if (
            isinstance(node, ast.Call)
            and getattr(node.func, "id", None) == "text"
            and node.args
            and isinstance(node.args[0], ast.Constant)
            and isinstance(node.args[0].value, str)
        ):
            return node.args[0].value
    raise AssertionError(f"no text(...) query found in {name}")


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    # Hand-copying is how the two drift, and a drift means the bootstrap and
    # migration paths build different schemas.
    assert _up_block() == "\n" + SQL_TEXT


def test_the_new_file_is_in_the_bundle():
    # Explicit, not globbed (bundle_schema.sh). A file left off it works in
    # compose and is simply absent from every managed database — so the policy
    # would stay wide open exactly where it matters.
    assert "220_equipment_sibling_scope" in BUNDLE.read_text(encoding="utf-8")


def test_the_downgrade_restores_the_old_predicate():
    m = re.search(r'_DOWN = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, "no _DOWN literal"
    assert "org_is_my_network_sibling(sponsor_org_id)" in _strip_comments(m.group(1))


# ---------------------------------------------------------------------------
# The policy itself
# ---------------------------------------------------------------------------


def test_the_policy_gates_on_the_callers_kind():
    # The regression guard. Without this clause the policy is the one that
    # leaked, and it reads identically in a diff to anyone not looking for it.
    using = _policy_using(CODE)
    assert "current_org_kind()" in using, using
    assert "org_is_my_network_sibling(sponsor_org_id)" in using, using


def test_the_two_clauses_are_a_conjunction():
    """AND, not OR.

    Asserted separately because `OR current_org_kind() IN (...)` would satisfy
    every other assertion in this file while leaving the policy strictly WIDER
    than the one being fixed.
    """
    using = _policy_using(CODE)
    assert re.search(
        r"current_org_kind\(\)\s+IN\s*\([^)]*\)\s+AND\s+org_is_my_network_sibling", using, re.S
    ), using
    assert not re.search(r"\bOR\b", using), f"the gate must not be OR-ed: {using}"


def test_only_the_borrowing_kinds_are_admitted():
    # aggregator and business are the kinds holding equipment.request
    # (db/900_seed.sql). sponsor holds equipment.manage/decide and must not be
    # here — that is the entire defect. tenant reaches its own network through
    # org_in_my_network in equipment_select and does not need this policy.
    m = re.search(r"current_org_kind\(\)\s+IN\s*\((.*?)\)", _policy_using(CODE), re.S)
    assert m, "the kind gate must be an IN list"
    kinds = {k.strip().strip("'") for k in m.group(1).split(",")}
    assert kinds == {"aggregator", "business"}, kinds


def test_the_old_policy_is_dropped_first():
    # Without this the file fails on a fresh bootstrap, where db/110 created the
    # broad version moments earlier, and the narrow one never lands.
    assert re.search(r"DROP POLICY IF EXISTS equipment_select_siblings ON equipment;", CODE), CODE
    assert CODE.index("DROP POLICY") < CODE.index("CREATE POLICY")


def test_the_write_policy_is_left_alone():
    # equipment_write was always correctly own-org. A file that touched it would
    # be changing who may EDIT inventory, which is not what this fixes.
    assert "equipment_write" not in CODE


def test_nothing_else_is_widened():
    # organisation_select_siblings has the same shape and is deliberately out of
    # scope; this file must not quietly alter it either way.
    assert "organisation_select_siblings" not in CODE
    assert CODE.count("CREATE POLICY") == 1


# ---------------------------------------------------------------------------
# Defence in depth in the service
# ---------------------------------------------------------------------------


def test_list_equipment_scopes_the_sponsor_case():
    """The query must not rely on the policy alone.

    "All one query — RLS is the filter" is what the docstring used to say, and
    it is why nothing in Python caught the leak.
    """
    sql = _sql_of("list_equipment")
    assert "current_org_kind()" in sql, sql
    assert re.search(
        r"current_org_kind\(\)\s*<>\s*'sponsor'\s+OR\s+e\.sponsor_org_id\s*=\s*current_org_id\(\)",
        sql,
    ), sql


def test_the_sponsor_predicate_is_anded_onto_the_where():
    # As its own OR-group. Dropped into the WHERE without the parentheses it
    # would widen the query instead of narrowing it.
    sql = _sql_of("list_equipment")
    assert re.search(r"AND\s*\(\s*current_org_kind\(\)\s*<>\s*'sponsor'", sql), sql


def test_the_predicate_does_not_check_a_role_name_in_python():
    # shared/rbac/index.ts: "Never checks a role name. Adding a role is a
    # database INSERT." The question is asked in SQL with the same helpers the
    # policies use, so a new borrowing kind needs no Python change.
    src = ast.unparse(_function("list_equipment"))
    assert "claims.role" not in src, src


# ---------------------------------------------------------------------------
# The phantom status write
# ---------------------------------------------------------------------------


def test_set_equipment_status_loads_only_its_own_row():
    """equipment_write refused the UPDATE; that was never enough.

    An UPDATE matching zero rows is not an error, so the foreign row loaded
    through the SELECT policy, was mutated, wrote an equipment.status audit
    line, and the caller was told it worked. Asserted on the AST so the comment
    above the call cannot satisfy it.
    """
    fn = _function("set_equipment_status")
    wheres = [
        ast.unparse(n)
        for n in ast.walk(fn)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "where"
    ]
    assert wheres, "set_equipment_status must filter its select"
    assert any("sponsor_org_id" in w and "claims.org_id" in w for w in wheres), wheres


def test_a_miss_is_still_a_lookup_error():
    # The route maps LookupError to 404 (api/v1/network.py). Narrowing the
    # select only helps if the None case still raises.
    src = ast.unparse(_function("set_equipment_status"))
    assert "LookupError" in src, src
