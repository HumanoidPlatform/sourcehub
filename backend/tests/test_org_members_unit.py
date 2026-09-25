"""The organisation-membership schema, and the invariants it is there to hold.

Every assertion here fails if the feature is reverted, and most of them fail if
a specific safety property is quietly removed — which is the point. The
properties are ones a reviewer cannot see by reading a diff:

  * platform_admin is only ungrantable because applies_to_kind is checked by a
    trigger. Nothing else in the repo enforces it, despite db/020_rbac.sql:38
    claiming it does.
  * the owner invariant only survives a concurrent double-revoke because it
    takes FOR UPDATE on the organisation row first. Without the lock it still
    passes every single-threaded test and fails in production.
  * the live-grant index is only correct while role_id is OUT of it.

conftest.py's live-Postgres fixtures all raise NotImplementedError, so these
read the SQL rather than execute it — the same approach
test_worker_skills_unit.py takes, and for the same reason.

    pytest tests/test_org_members_unit.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "200_org_members.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0022_org_members.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _up_block() -> str:
    """The _UP literal out of the migration."""
    m = re.search(r'_UP = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, "no _UP literal in the migration"
    return m.group(1)


def _strip_comments(sql: str) -> str:
    """SQL with -- comments removed.

    Every body assertion runs through this, because the first version of these
    tests did not and two of them were satisfied by PROSE. "FOR UPDATE" appears
    in the comment explaining why the lock is there as well as in the lock
    itself, so deleting the lock left the test green. A comment must never be
    able to satisfy an assertion about code.
    """
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


def _function_body(text: str, name: str) -> str:
    """The body of one CREATE FUNCTION, between its $fn$ delimiters, code only."""
    m = re.search(
        rf"CREATE OR REPLACE FUNCTION {name}\b.*?AS \$fn\$(.*?)\$fn\$;", text, re.S
    )
    assert m, f"no {name} in the given SQL"
    return _strip_comments(m.group(1))


def test_the_migration_carries_the_sql_verbatim():
    # Hand-copying is how the two drift, and a drift means the bootstrap and
    # migration paths build different schemas — which verify-schema exists to
    # catch, but only if someone runs it.
    assert _up_block() == "\n" + SQL_TEXT


def test_the_new_file_is_in_the_bundle():
    # Explicit, not globbed (bundle_schema.sh:27). A file left off it works in
    # compose and is simply absent from every managed database — the failure
    # shows up as a missing function in production and nowhere else.
    assert "200_org_members" in BUNDLE.read_text(encoding="utf-8")


def test_the_live_grant_index_is_not_keyed_on_role():
    # With role_id in the key a role change leaves TWO live grants;
    # user_capabilities unions both permission sets and the JWT role — and so
    # is_platform_admin() — is decided by a tie-break.
    m = re.search(
        r"CREATE UNIQUE INDEX user_role_grant_live_key\s*\n?\s*ON user_role_grant \((.*?)\)",
        SQL_TEXT,
        re.S,
    )
    assert m, "no user_role_grant_live_key in the new file"
    assert [c.strip() for c in m.group(1).split(",")] == ["user_id", "org_id"]
    assert "(user_id, org_id, role_id)" not in SQL_TEXT


def test_the_role_fits_trigger_refuses_a_mismatched_kind():
    # The floor under the privilege escalation. applies_to_kind is enforced by
    # no CHECK and no service code anywhere else in the repository.
    #
    # Asserts the COMPARISON, not the column name: the name also appears in the
    # SELECT that loads it, so grepping for it passed even with the check
    # replaced by IF false.
    body = _function_body(SQL_TEXT, "user_role_grant_role_fits_org")
    assert re.search(r"v_applies\s+IS NOT NULL\s+AND\s+v_applies\s*<>\s*v_kind", body), body
    assert re.search(r"RAISE EXCEPTION[^;]*check_violation", body, re.S)
    # A custom role must belong to this organisation, not merely exist.
    assert re.search(r"v_role_org\s+IS DISTINCT FROM\s+NEW\.org_id", body)
    assert "BEFORE INSERT OR UPDATE ON user_role_grant" in _strip_comments(SQL_TEXT)


def test_the_owner_invariant_locks_the_organisation_row():
    # FOR UPDATE is the whole answer to two managers revoking each other at
    # once: write skew that no CHECK can see and that never reproduces by hand.
    #
    # Asserts the lock is on the ORGANISATION row specifically. A bare
    # "FOR UPDATE" in body check passed with the lock deleted, because the
    # comment above it says the words too.
    body = _function_body(SQL_TEXT, "assert_org_has_owner")
    assert re.search(
        r"FROM organisation WHERE id = v_org FOR UPDATE", body
    ), "the owner count must lock the organisation row first"


def test_the_owner_invariant_counts_invited_owners():
    # approve_onboarding_request (db/030_onboarding.sql:259) creates a new
    # organisation's first owner as 'invited'. Narrowing this list would make
    # every new organisation impossible to create.
    body = _function_body(SQL_TEXT, "assert_org_has_owner")
    m = re.search(r"u\.status IN \((.*?)\)", body, re.S)
    assert m, "no status filter in the owner count"
    assert "'invited'" in m.group(1)


def test_the_owner_invariant_stays_deferred():
    # IMMEDIATE would refuse a legal edit: a role change on the sole owner is
    # revoke-then-insert in one transaction, so the count passes through zero.
    # The service compensates with SET CONSTRAINTS ... IMMEDIATE before
    # returning, which is documented in the SQL file.
    assert "DEFERRABLE INITIALLY DEFERRED" in SQL_TEXT
    assert "SET CONSTRAINTS user_role_grant_keeps_an_owner IMMEDIATE" in SQL_TEXT


def test_invite_member_cannot_be_pointed_at_another_organisation():
    # The organisation comes from current_org_id(). The moment a p_org_id
    # parameter exists, RLS's WITH CHECK is the only thing left between a
    # caller and somebody else's organisation.
    m = re.search(
        r"CREATE OR REPLACE FUNCTION invite_member\((.*?)\)\s*RETURNS", SQL_TEXT, re.S
    )
    assert m, "no invite_member in the new file"
    assert not re.search(r"\bp_org", m.group(1)), m.group(1)
    assert "current_org_id()" in _function_body(SQL_TEXT, "invite_member")


def test_invite_member_takes_the_granter_from_the_session():
    # granted_by answers "who let this person in". invite_worker trusts a
    # p_invited_by parameter, which a caller could forge; this must not.
    body = _function_body(SQL_TEXT, "invite_member")
    assert "current_user_id()" in body
    m = re.search(
        r"CREATE OR REPLACE FUNCTION invite_member\((.*?)\)\s*RETURNS", SQL_TEXT, re.S
    )
    assert not re.search(r"\bp_invited_by\b", m.group(1))


def test_acceptance_never_overwrites_an_existing_password():
    # Without this, inviting an address that already has an account hands
    # whoever opens the link a password change on it, bypassing
    # change_password's current-password check.
    body = _function_body(SQL_TEXT, "invitation_accept")
    assert "password_hash IS NULL" in body


def test_invite_member_is_not_security_definer():
    # These scripts run as the superuser, who owns every table, so DEFINER on a
    # function writing app_user AND user_role_grant AND invitation would be a
    # complete RLS bypass rather than a narrow one.
    m = re.search(
        r"CREATE OR REPLACE FUNCTION invite_member\b.*?LANGUAGE (\w+)( SECURITY DEFINER)?",
        SQL_TEXT,
        re.S,
    )
    assert m, "no invite_member definition"
    assert m.group(2) is None, "invite_member must stay INVOKER"


def test_the_privileged_helpers_are_not_public():
    # Each SECURITY DEFINER helper is revoked from PUBLIC and granted only to
    # the application role, as invite_worker's own REVOKE/GRANT pair does.
    for fn in ("invite_member", "org_member_by_email", "revoke_member_sessions"):
        assert re.search(rf"REVOKE EXECUTE ON FUNCTION {fn}\(.*?\) FROM PUBLIC", SQL_TEXT)
        assert re.search(rf"GRANT\s+EXECUTE ON FUNCTION {fn}\(.*?\) TO sourcehub_app", SQL_TEXT)


# ---------------------------------------------------------------------------
# The members queries must return STAFF only.
#
# invite_worker grants every crowd resource role 'worker' with scope 'member' in
# the aggregator's OWN organisation, so a query that filters on org and
# revocation alone returns the whole crowd as colleagues. Removing one from
# there revokes the grant without touching crowd_worker.status, so they stay
# "active" on the roster and can never be offered a task again.
#
# Asserted against the module's compiled SQL, not the file's text: a comment
# mentioning applies_to_kind would satisfy a grep, and in this changeset three
# separate assertions were already satisfied by prose.
# ---------------------------------------------------------------------------

def _member_queries() -> dict[str, str]:
    """The two SQL strings, taken from the module rather than the source file."""
    import inspect
    import re as _re

    from sourcehub.modules.identity import service

    rows = str(service._MEMBER_ROWS)
    body = inspect.getsource(service._member_row)
    # the text(...) literal inside _member_row, concatenated
    lit = "".join(_re.findall(r'"([^"]*)"', body))
    return {"_MEMBER_ROWS": rows, "_member_row": lit}


def test_both_member_queries_exclude_workforce_roles():
    for name, sql in _member_queries().items():
        assert "applies_to_kind IS NOT NULL" in sql, (
            f"{name} returns crowd resources as colleagues: it must filter on "
            "r.applies_to_kind IS NOT NULL, the same discriminator db/200's "
            "role-fits trigger and assignable_roles use"
        )


def test_member_row_joins_role_so_it_can_filter():
    # _member_row originally selected g.role_id with no join to role at all, so
    # there was nothing to filter on. This is what the mutating routes resolve
    # their target through — the list being clean is not enough.
    sql = _member_queries()["_member_row"]
    assert "JOIN role" in sql, "_member_row must join role to exclude workforce grants"


def test_the_filter_is_on_the_role_not_the_grant():
    # applies_to_kind lives on `role`. Filtering the wrong table would pass a
    # substring check while doing nothing.
    for name, sql in _member_queries().items():
        assert "r.applies_to_kind IS NOT NULL" in sql, f"{name}: filter must be on the role alias"
