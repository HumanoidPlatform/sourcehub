"""An organisation's public profile: what it holds, who may change it, and the logo.

db/230 adds organisation.public_profile, one jsonb column the API validates and
writes. The risks this file guards, in the order they would hurt:

  * the logo's storage key leaking into an API answer, or a caller choosing it
    (the key must only ever be one the logo filer minted);
  * an organisation's own user changing what is Ops' to change — its legal
    name, country, plan, residency, DPA status — or any member, not only an
    owner or manager, editing at all;
  * a staged upload that is not an image, is too large, or belongs to another
    organisation being filed as someone's logo;
  * a misspelt key being dropped in silence again, which is what the free-form
    onboarding payload used to do;
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so, as in
test_equipment_sibling_scope_unit.py, SQL is read rather than executed, every
SQL assertion runs through _strip_comments, and wiring is checked on the AST or
on FastAPI's own route table, never on the file's text.

    pytest tests/test_org_public_profile_unit.py
"""

from __future__ import annotations

import ast
import json
import re
import uuid
from pathlib import Path

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1 import identity as identity_api
from sourcehub.modules.attachments import service as attachments
from sourcehub.modules.identity import service as identity
from sourcehub.modules.identity.models import Organisation
from sourcehub.modules.identity.profile_schema import (
    OPS_ONLY,
    OnboardingProfileIn,
    OrgProfilePatch,
    PublicProfileIn,
    foreign_kind_fields,
    missing_core,
    public_part,
)

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "230_org_public_profile.sql"
SEED = ROOT / "db" / "900_seed.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0025_org_public_profile.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
ONBOARDING = ROOT / "backend" / "src" / "sourcehub" / "modules" / "onboarding" / "service.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _claims(
    *,
    org_id: uuid.UUID,
    caps: set[str],
    scope: str = "owner",
    role: str = "client",
) -> AccessClaims:
    return AccessClaims(
        user_id=uuid.uuid4(),
        full_name="Test User",
        email="test@example.com",
        org_id=org_id,
        org_kind="client",
        org_name="Acme",
        role=role,
        scope=scope,
        capabilities=frozenset(caps),
        mfa_satisfied=True,
        must_change_password=False,
    )


def _org(kind: str = "client", public_profile: dict | None = None) -> Organisation:
    return Organisation(
        id=uuid.uuid4(),
        reference_code="CL-0001",
        kind=kind,
        name="Acme",
        legal_name="Acme Private Limited",
        status="active",
        country="India",
        public_profile=public_profile if public_profile is not None else {},
    )


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_new_file_is_in_the_bundle():
    # Explicit, not globbed: a file left off the list is simply absent from
    # every managed database.
    assert "230_org_public_profile" in BUNDLE.read_text(encoding="utf-8")


def test_the_column_and_its_backstops_exist():
    assert "ADD COLUMN public_profile jsonb NOT NULL DEFAULT '{}'::jsonb" in CODE
    assert "jsonb_typeof(public_profile) = 'object'" in CODE
    # The logo key may only point into the logo folder the filer writes to,
    # never at another organisation's attachments.
    assert "public_profile->>'logo_key' LIKE 'orgs/%'" in CODE
    assert re.search(r"public_profile->>'website' ~\* '\^https\?://", CODE)


def test_the_migration_adds_no_policy():
    # The column's audience is organisation_select's, by design. A policy
    # appearing here means someone is narrowing or widening that silently.
    assert "CREATE POLICY" not in CODE
    assert "DROP POLICY" not in CODE


def test_the_downgrade_removes_the_column_and_the_capability():
    down = _strip_comments(_literal("_DOWN"))
    assert "DROP COLUMN IF EXISTS public_profile" in down
    assert "DELETE FROM permission WHERE code = 'org.update'" in down


def test_ops_holds_org_update_in_the_seed_and_the_migration():
    seed = _strip_comments(SEED.read_text(encoding="utf-8"))
    assert re.search(r"\('org\.update',\s*'identity',", seed)
    grant = re.search(r"r\.code = 'platform_admin' AND p\.code IN \((.*?)\);", seed, re.S)
    assert grant, "no platform_admin grant block in the seed"
    assert "'org.update'" in grant.group(1)

    mig = _strip_comments(_literal("_SEED"))
    assert "('org.update', 'identity'" in mig
    assert "r.code = 'platform_admin'" in mig
    assert "p.code = 'org.update'" in mig


# ---------------------------------------------------------------------------
# What the API answers: never the storage key
# ---------------------------------------------------------------------------


def test_the_logo_key_is_never_returned():
    org = _org(
        public_profile={
            "website": "https://acme.example",
            "logo_key": "orgs/abc/logo/1.png",
            "logo_updated_at": "2026-09-28T10:00:00+00:00",
        }
    )
    out = identity._org_dict(org, None, None)
    assert "orgs/abc/logo/1.png" not in json.dumps(out, default=str)
    assert "logo_key" not in out["public_profile"]
    assert "logo_updated_at" not in out["public_profile"]
    assert out["logo_version"] == "2026-09-28T10:00:00+00:00"
    assert out["public_profile"] == {"website": "https://acme.example"}
    assert out["legal_name"] == "Acme Private Limited"


def test_no_key_means_no_logo_version():
    # A timestamp left behind without a key must not make the console ask for
    # a logo that is not there.
    org = _org(public_profile={"logo_updated_at": "2026-09-28T10:00:00+00:00"})
    assert identity._org_dict(org, None, None)["logo_version"] is None
    assert identity._org_dict(_org(), None, None)["logo_version"] is None


# ---------------------------------------------------------------------------
# Validation — what the payload may say
# ---------------------------------------------------------------------------


def test_a_bare_domain_becomes_a_web_address():
    assert PublicProfileIn(website="acme.com").website == "https://acme.com"
    assert PublicProfileIn(website="http://acme.com/about").website == "http://acme.com/about"


def test_the_length_limit_applies_to_what_is_stored():
    # max_length sees the bare value; db/230's CHECK sees it with https://
    # added. A 250-character domain passed the first and was a 500 at the
    # second, on every approval of the request that carried it.
    bare = "a" * 246 + ".com"  # 250 characters, 258 once https:// is added
    with pytest.raises(ValidationError):
        PublicProfileIn(website=bare)
    assert len(PublicProfileIn(website="a" * 243 + ".com").website) == 255


@pytest.mark.parametrize("bad", ["N/A", "https://", "someone@acme.com", "https://acme"])
def test_a_website_must_be_a_web_address(bad):
    with pytest.raises(ValidationError):
        PublicProfileIn(website=bad)


@pytest.mark.parametrize(
    "field,value",
    [("company_size", "10-50"), ("founded_year", 1700), ("founded_year", 2200)],
)
def test_size_and_year_are_bounded(field, value):
    with pytest.raises(ValidationError):
        PublicProfileIn(**{field: value})


def test_an_address_needs_a_city_and_a_country():
    with pytest.raises(ValidationError):
        PublicProfileIn(registered_address={"country": "India"})
    with pytest.raises(ValidationError):
        PublicProfileIn(registered_address={"city": "Pune"})
    ok = PublicProfileIn(registered_address={"city": "Pune", "country": "India"})
    assert ok.registered_address is not None


def test_unknown_keys_are_refused_not_dropped():
    with pytest.raises(ValidationError):
        OrgProfilePatch(webiste="https://acme.com")
    with pytest.raises(ValidationError):
        OnboardingProfileIn.model_validate({"industy": "Retail"})


def test_nobody_may_set_the_logo_key_through_a_patch():
    # Only file_org_logo mints logo keys, after checking the file.
    with pytest.raises(ValidationError):
        OrgProfilePatch.model_validate({"logo_key": "orgs/other/logo/x.png"})
    with pytest.raises(ValidationError):
        OnboardingProfileIn.model_validate({"logo_key": "orgs/other/logo/x.png"})


def test_a_cleared_box_is_a_null_not_an_empty_string():
    p = OrgProfilePatch.model_validate({"description": "   ", "website": ""})
    assert p.description is None
    assert p.website is None


def test_a_patch_changes_only_what_it_names():
    # An omitted key is not a request to clear it.
    assert public_part(OrgProfilePatch.model_validate({})) == {}
    assert public_part(OrgProfilePatch.model_validate({"description": None})) == {
        "description": None
    }
    full = public_part(OrgProfilePatch.model_validate({}), only_sent=False)
    assert set(full) == {
        "website",
        "description",
        "company_size",
        "founded_year",
        "registered_address",
        # db/260: what a delivery partner declares for the vendors directory
        "expertise",
    }


def test_a_submission_needs_the_core_fields():
    empty = OnboardingProfileIn.model_validate({})
    assert missing_core(empty) == ["legal name", "website", "country", "registered address"]
    complete = OnboardingProfileIn.model_validate(
        {
            "legal_name": "Acme Private Limited",
            "website": "acme.com",
            "country": "India",
            "registered_address": {"city": "Pune", "country": "India"},
        }
    )
    assert missing_core(complete) == []


def test_kind_fields_belong_to_their_kind():
    assert foreign_kind_fields("client", {"hq", "capabilities", "industry"}) == [
        "capabilities",
        "hq",
    ]
    assert foreign_kind_fields("tenant", {"industry", "dpa_signed", "hq"}) == [
        "dpa_signed",
        "industry",
    ]
    assert foreign_kind_fields("client", {"website", "plan"}) == []


# ---------------------------------------------------------------------------
# Who may change what
# ---------------------------------------------------------------------------


_TERMS = sorted({"name", "legal_name", "country", "plan", "residency_region", "dpa_signed"})


def test_the_accounts_terms_are_ops_only():
    assert set(_TERMS) <= OPS_ONLY
    # and nothing public is: an owner must be able to describe the company
    assert not OPS_ONLY & set(PublicProfileIn.model_fields)


@pytest.mark.parametrize("field", _TERMS)
def test_an_owner_cannot_change_an_ops_only_field(field):
    org = _org()
    owner = _claims(org_id=org.id, caps={"profile.manage"}, scope="owner")
    with pytest.raises(identity.ProfileForbiddenError):
        identity._check_editor(owner, org, {field})


def test_an_owner_or_manager_may_describe_their_own_company():
    org = _org()
    for scope in ("owner", "manager"):
        who = _claims(org_id=org.id, caps={"profile.manage"}, scope=scope)
        identity._check_editor(who, org, {"website", "description", "registered_address"})


def test_a_member_may_not_edit_even_with_the_capability():
    # Every member of an org holds profile.manage (one role per kind); scope is
    # what separates the people who run the account.
    org = _org()
    member = _claims(org_id=org.id, caps={"profile.manage"}, scope="member")
    with pytest.raises(identity.ProfileForbiddenError):
        identity._check_editor(member, org, {"website"})


def test_nobody_edits_another_organisations_profile_without_org_update():
    org = _org()
    partner = _claims(org_id=uuid.uuid4(), caps={"profile.manage"}, scope="owner", role="tenant")
    with pytest.raises(identity.ProfileForbiddenError):
        identity._check_editor(partner, org, {"website"})


def test_ops_edits_any_client_or_partner_including_its_terms():
    ops = _claims(org_id=uuid.uuid4(), caps={"org.update"}, scope="owner", role="platform_admin")
    for kind in ("client", "tenant"):
        identity._check_editor(ops, _org(kind), set(OPS_ONLY) | {"website"})


def test_every_kind_but_the_platform_is_editable_here():
    # db/280 keeps every kind's profile on the organisation row, so a network
    # organisation can be edited too; only the platform's own row cannot.
    ops = _claims(org_id=uuid.uuid4(), caps={"org.update"}, role="platform_admin")
    identity._check_editor(ops, _org("aggregator"), {"website"})
    with pytest.raises(identity.ProfileError):
        identity._check_editor(ops, _org("platform"), {"website"})


# ---------------------------------------------------------------------------
# The logo filer
# ---------------------------------------------------------------------------


class _FakeStorage:
    def __init__(self, size: int = 10_000, content_type: str | None = "image/png") -> None:
        self.size = size
        self.content_type = content_type
        self.copied: list[tuple[str, str]] = []
        self.deleted: list[str] = []

    def install(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from sourcehub.platform import storage

        async def stat(_t, key):
            return self.size, self.content_type

        async def copy(_t, src, dst):
            self.copied.append((src, dst))

        async def delete(_t, key):
            self.deleted.append(key)

        monkeypatch.setattr(storage, "platform_target", lambda: object())
        monkeypatch.setattr(storage, "stat", stat)
        monkeypatch.setattr(storage, "copy", copy)
        monkeypatch.setattr(storage, "delete", delete)


def _staged(org_id: uuid.UUID, name: str = "logo.png") -> str:
    return f"_staging/{org_id}/{uuid.uuid4()}/{name}"


async def test_a_logo_is_moved_into_the_orgs_logo_folder(monkeypatch):
    fake = _FakeStorage()
    fake.install(monkeypatch)
    uploader = uuid.uuid4()
    org_id = uuid.uuid4()
    key = _staged(uploader)
    final = await attachments.file_org_logo(_claims(org_id=uploader, caps=set()), key, org_id)
    assert final.startswith(f"orgs/{org_id}/logo/") and final.endswith(".png")
    assert fake.copied == [(key, final)]
    assert fake.deleted == [key]


async def test_someone_elses_upload_is_refused(monkeypatch):
    fake = _FakeStorage()
    fake.install(monkeypatch)
    me = uuid.uuid4()
    with pytest.raises(attachments.AttachmentError):
        await attachments.file_org_logo(_claims(org_id=me, caps=set()), _staged(uuid.uuid4()), me)
    assert fake.copied == []


@pytest.mark.parametrize("name", ["logo.svg", "logo.gif", "logo.pdf", "logo"])
async def test_only_raster_images_are_logos(monkeypatch, name):
    fake = _FakeStorage(content_type="image/svg+xml")
    fake.install(monkeypatch)
    me = uuid.uuid4()
    with pytest.raises(attachments.AttachmentError):
        await attachments.file_org_logo(_claims(org_id=me, caps=set()), _staged(me, name), me)
    assert fake.copied == []


async def test_a_logo_over_two_megabytes_is_refused(monkeypatch):
    fake = _FakeStorage(size=attachments.LOGO_MAX_BYTES + 1)
    fake.install(monkeypatch)
    me = uuid.uuid4()
    with pytest.raises(attachments.AttachmentError):
        await attachments.file_org_logo(_claims(org_id=me, caps=set()), _staged(me), me)
    assert fake.copied == []


@pytest.mark.parametrize("stored", [None, "text/html", "image/jpeg"])
async def test_the_stored_type_must_match_the_extension(monkeypatch, stored):
    # The type it will be SERVED with is what a browser acts on; a .png that
    # storage will serve as text/html is refused.
    fake = _FakeStorage(content_type=stored)
    fake.install(monkeypatch)
    me = uuid.uuid4()
    with pytest.raises(attachments.AttachmentError):
        await attachments.file_org_logo(_claims(org_id=me, caps=set()), _staged(me), me)
    assert fake.copied == []


def _sign_to(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    from sourcehub.platform import storage

    signed: list[str] = []

    async def presign_get(_t, key, _filename, inline=False):
        signed.append(key)
        return "https://blob.example/" + key

    monkeypatch.setattr(storage, "presign_get", presign_get)
    return signed


async def test_a_staged_preview_signs_the_requesters_own_image(monkeypatch):
    _FakeStorage().install(monkeypatch)
    signed = _sign_to(monkeypatch)
    requester = uuid.uuid4()
    key = _staged(requester)
    out = await attachments.staged_logo_url(key, requester)
    assert signed == [key] and out["url"].endswith(key)


@pytest.mark.parametrize(
    "key",
    ["orgs/abc/logo/1.png", "Acme/RFP-1/request/brief/doc.png", None],
)
async def test_a_staged_preview_is_only_signed_under_the_requesters_prefix(monkeypatch, key):
    # None: another organisation's staged upload.
    _FakeStorage().install(monkeypatch)
    signed = _sign_to(monkeypatch)
    with pytest.raises(attachments.AttachmentError):
        await attachments.staged_logo_url(key or _staged(uuid.uuid4()), uuid.uuid4())
    assert signed == []


@pytest.mark.parametrize("stored", ["text/html", None, "image/jpeg"])
async def test_a_staged_preview_is_not_signed_for_what_is_not_that_image(monkeypatch, stored):
    # An HTML file named logo.png would otherwise render, inline, on the
    # storage domain from a link this API handed out.
    _FakeStorage(content_type=stored).install(monkeypatch)
    signed = _sign_to(monkeypatch)
    requester = uuid.uuid4()
    with pytest.raises(attachments.AttachmentError):
        await attachments.staged_logo_url(_staged(requester), requester)
    assert signed == []


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------

PROFILE_ROUTES = {
    ("PATCH", "/organisations/{org_id}"),
    ("PUT", "/organisations/{org_id}/logo"),
    ("DELETE", "/organisations/{org_id}/logo"),
}


def _route(method: str, path: str) -> APIRoute:
    for r in identity_api.router.routes:
        if isinstance(r, APIRoute) and r.path == path and method in r.methods:
            return r
    raise AssertionError(f"no {method} {path}")


def test_every_profile_write_route_takes_either_capability():
    guard = identity_api._MAY_EDIT_PROFILE
    cells = [c.cell_contents for c in guard.__closure__ or ()]
    assert ("profile.manage", "org.update") in cells, cells
    for method, path in PROFILE_ROUTES:
        calls = [d.call for d in _route(method, path).dependant.dependencies]
        assert guard in calls, f"{method} {path} is not guarded by _MAY_EDIT_PROFILE"


def test_the_logo_url_route_is_a_read():
    r = _route("GET", "/organisations/{org_id}/logo-url")
    assert r.methods == {"GET"}


def _onboarding_function(name: str) -> ast.AsyncFunctionDef:
    tree = ast.parse(ONBOARDING.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> set[str]:
    out = set()
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.add(f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", ""))
    return out


def test_the_staged_preview_is_for_client_and_partner_requests_only():
    # A network request's payload is never validated, so its logo key must not
    # reach the signer; and the key is checked against the REQUESTER's prefix.
    fn = _onboarding_function("staged_logo_url")
    names = {n.id for n in ast.walk(fn) if isinstance(n, ast.Name)}
    attrs = {n.attr for n in ast.walk(fn) if isinstance(n, ast.Attribute)}
    assert "TOP_KINDS" in names
    assert "requester_org_id" in attrs


def test_approval_writes_the_profile():
    assert "apply_onboarding_profile" in _calls(_onboarding_function("_approve"))


@pytest.mark.parametrize("name", ["create_request", "update_draft", "submit_request"])
def test_every_way_into_a_request_validates_the_profile(name):
    assert "_checked_profile" in _calls(_onboarding_function(name))
