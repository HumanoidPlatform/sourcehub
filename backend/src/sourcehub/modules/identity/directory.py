"""identity — the vendors directory, and the one source of a partner's figures.

Two things live here.

performance_for() is how ANY screen learns a delivery partner's record. The
record is made of other clients' contracts, gate-2 reviews and ratings, which
RLS hides from the reader, so it comes from partner_performance() (db/260): a
SECURITY DEFINER function that returns numbers and nothing else. Until it
existed the console printed organisation.rating and two seeded rate columns,
which the seed files wrote and nothing ever calculated (db/280 dropped them).

list_vendors() and get_vendor() are what a client browsing the directory is
given. They are written as a WHITELIST: a vendor row is built key by key from
what is public, rather than by taking the organisation and deleting what is
not. A column added to organisation tomorrow is therefore absent from the
directory until someone decides it belongs there.
"""

from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from sqlalchemy import select, text

from sourcehub.modules.identity.models import Organisation

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping

    from sqlalchemy.ext.asyncio import AsyncSession

    from sourcehub.api.security import AccessClaims

# The capability that opens the whole directory. Without it a caller may read
# one vendor page: its own, as clients see it.
BROWSE = "vendor.read"

# What public_profile contributes to a vendor row. Named one by one: the logo's
# storage key is in that column too, and must never be in an answer.
_PUBLIC = ("website", "description", "company_size", "founded_year", "registered_address")

_EXPERTISE_LISTS = ("data_types", "domains", "languages", "regions", "certifications")


@dataclass(frozen=True, slots=True)
class Performance:
    """A delivery partner's record, as numbers.

    A percentage is None when there is nothing to divide by. "No completed work
    yet" and "0% on time" are different statements, and the console prints a
    new partner as new rather than as a partner with a record of zero.
    """

    contracts_completed: int = 0
    on_time_pct: int | None = None
    accepted_first_time_pct: int | None = None
    qa_pass_pct: int | None = None
    rating_avg: float | None = None
    rating_count: int = 0
    rating_distribution: tuple[int, int, int, int, int] = (0, 0, 0, 0, 0)

    def summary(self) -> dict[str, Any]:
        return {
            "contracts_completed": self.contracts_completed,
            "on_time_pct": self.on_time_pct,
            "accepted_first_time_pct": self.accepted_first_time_pct,
            "qa_pass_pct": self.qa_pass_pct,
            "rating_avg": self.rating_avg,
            "rating_count": self.rating_count,
        }

    def detail(self) -> dict[str, Any]:
        """The summary, plus how many clients gave each score, 5 first."""
        return {
            **self.summary(),
            "rating_distribution": [
                {"score": score, "count": self.rating_distribution[score - 1]}
                for score in (5, 4, 3, 2, 1)
            ],
        }


NO_RECORD = Performance()


def _pct(v: Any) -> int | None:
    return None if v is None else int(v)


def shape(row: Mapping[Any, Any]) -> Performance:
    """One row of partner_performance() as a Performance."""
    count = int(row["rating_count"] or 0)
    avg = row["rating_avg"]
    return Performance(
        contracts_completed=int(row["contracts_completed"] or 0),
        on_time_pct=_pct(row["on_time_pct"]),
        accepted_first_time_pct=_pct(row["accepted_first_time_pct"]),
        qa_pass_pct=_pct(row["qa_pass_pct"]),
        # No ratings is no average, whatever avg() of nothing came back as.
        rating_avg=round(float(avg), 1) if count and avg is not None else None,
        rating_count=count,
        rating_distribution=(
            int(row["rating_1"] or 0),
            int(row["rating_2"] or 0),
            int(row["rating_3"] or 0),
            int(row["rating_4"] or 0),
            int(row["rating_5"] or 0),
        ),
    )


async def performance_for(
    session: AsyncSession, org_ids: Iterable[uuid.UUID]
) -> dict[uuid.UUID, Performance]:
    """The record of each delivery partner in org_ids, in ONE call.

    Pass ids already read under the caller's own policies. An id that is not a
    delivery partner is simply absent from the answer; read with
    .get(id, NO_RECORD).
    """
    ids = list(dict.fromkeys(org_ids))
    if not ids:
        return {}
    rows = (
        (
            await session.execute(
                text("SELECT * FROM partner_performance(CAST(:ids AS uuid[]))"), {"ids": ids}
            )
        )
        .mappings()
        .all()
    )
    return {r["partner_org_id"]: shape(r) for r in rows}


def years_in_business(founded_year: Any, today: dt.date | None = None) -> int | None:
    if not isinstance(founded_year, int):
        return None
    years = (today or dt.datetime.now(dt.UTC).date()).year - founded_year
    return years if years >= 0 else None


def expertise_of(org: Organisation) -> dict[str, Any]:
    """Expertise in one shape whether or not the partner has declared any, so
    the console's filters never meet a missing list."""
    stored = (org.public_profile or {}).get("expertise")
    stored = stored if isinstance(stored, dict) else {}
    out: dict[str, Any] = {
        k: [x for x in stored.get(k) or [] if isinstance(x, str)] for k in _EXPERTISE_LISTS
    }
    other = stored.get("other_certifications")
    out["other_certifications"] = other if isinstance(other, str) and other.strip() else None
    return out


def vendor_dict(
    org: Organisation,
    performance: Performance | None,
    *,
    detail: bool = False,
    today: dt.date | None = None,
) -> dict[str, Any]:
    """A delivery partner as the directory shows it: who they are, what they
    say they do, and what their record amounts to. Never their terms with the
    platform — plan, DPA, billing, suspension — and never the legal name or
    residency, which are the account's and not the company's public face."""
    stored = org.public_profile or {}
    record = performance or NO_RECORD
    has_logo = bool(stored.get("logo_key"))
    return {
        "id": org.id,
        "reference_code": org.reference_code,
        "name": org.name,
        "country": org.country,
        # db/280: hq lives in organisation.profile, the attestation is a typed
        # column, and "since" is the day the partner was onboarded
        "hq": (org.profile or {}).get("hq"),
        "partner_since": org.onboarded_at.date() if org.onboarded_at else None,
        "fair_work_attested": bool(org.fair_work_attested),
        **{k: stored.get(k) for k in _PUBLIC},
        "years_in_business": years_in_business(stored.get("founded_year"), today),
        "expertise": expertise_of(org),
        "logo_version": stored.get("logo_updated_at") if has_logo else None,
        "performance": record.detail() if detail else record.summary(),
    }


def _listed() -> Any:
    """Every active delivery partner the caller's policies admit."""
    return select(Organisation).where(
        Organisation.kind == "tenant",
        Organisation.status == "active",
        Organisation.deleted_at.is_(None),
    )


def may_browse(claims: AccessClaims) -> bool:
    return BROWSE in claims.capabilities


async def list_vendors(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    """The whole directory, in name order. RLS decides who is in it for this
    caller (organisation_select_directory for a client, everything for Ops);
    the console filters and sorts what comes back, so a filter is instant and
    costs no round trip."""
    orgs = list((await session.execute(_listed().order_by(Organisation.name))).scalars())
    record = await performance_for(session, [org.id for org in orgs])
    return [vendor_dict(org, record.get(org.id)) for org in orgs]


async def get_vendor(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID
) -> dict[str, Any]:
    """One vendor page. A caller who cannot browse may open only its own —
    which is how a partner sees itself as clients do — and is told "not found"
    about any other, as RLS would have told it."""
    if not may_browse(claims) and org_id != claims.org_id:
        raise LookupError("vendor not found")
    org = (await session.execute(_listed().where(Organisation.id == org_id))).scalar_one_or_none()
    if org is None:
        raise LookupError("vendor not found")
    record = await performance_for(session, [org.id])
    return vendor_dict(org, record.get(org.id), detail=True)
