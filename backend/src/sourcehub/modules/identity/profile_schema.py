"""identity — the shape of an organisation's profile, validated in one place.

Onboarding (Ops filing a client or a partner) and editing afterwards (Ops, or
the organisation's own owner or manager) accept the same fields, so they share
these models rather than each keeping a list of keys.

extra="forbid" throughout, on purpose. The onboarding payload used to be a free
dict that approve_onboarding_request() read a handful of keys from, so a
misspelt key was silently dropped and the operator never learned the value had
gone nowhere. Now it is refused where the operator is still looking at the form.

Everything in PUBLIC_KEYS is stored in organisation.public_profile (db/230) and
is visible to whoever may see the organisation — a partner bidding on a client's
RFP, a client reviewing a partner's bid, and, for a delivery partner, every
client browsing the vendors directory (db/260). Nothing private may be added to
PublicProfileIn; that needs its own table with an Ops-or-self policy.
"""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from sourcehub.modules.identity.expertise_vocabulary import LISTS, OTHER_CERTIFICATIONS_MAX

CompanySize = Literal["1-10", "11-50", "51-200", "201-1000", "1001-5000", "5000+"]
Residency = Literal["US", "EU", "APAC"]

# A host with at least one dot, then anything that is not whitespace. Loose on
# purpose: the point is to catch "N/A" and a pasted email address, not to be a
# URL parser. No "@" before the path: "https://someone@acme.com" is an email
# address with a scheme stuck on the front, not a company's website. db/230
# carries a coarser copy of this as a CHECK.
_WEBSITE = re.compile(r"^https?://[^\s/.?#@]+\.[^\s/?#@]+(?:[/?#]\S*)?$", re.IGNORECASE)
_SCHEME = re.compile(r"^[a-z][a-z0-9+.-]*://", re.IGNORECASE)


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("*", mode="before")
    @classmethod
    def _blank_is_none(cls, v: Any) -> Any:
        # A cleared text box arrives as "", and "" is not a value worth storing:
        # it would render as an empty row everywhere the profile is shown.
        if isinstance(v, str) and not v.strip():
            return None
        return v


class AddressIn(_Strict):
    line1: str | None = Field(None, max_length=200)
    line2: str | None = Field(None, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    region: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    country: str = Field(min_length=2, max_length=100)


class ExpertiseIn(_Strict):
    """What a delivery partner says it can do, from curated lists.

    Always sent and stored whole: the five lists are one statement about the
    company, and merging a new list into an old one would keep claims the
    partner had just removed.
    """

    data_types: list[str] = Field(default_factory=list)
    domains: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    # One line for what the list does not name. Shown, never filtered on.
    other_certifications: str | None = Field(None, max_length=OTHER_CERTIFICATIONS_MAX)

    @field_validator(*LISTS, mode="before")
    @classmethod
    def _no_list_is_an_empty_one(cls, v: Any) -> Any:
        return [] if v is None else v

    @field_validator(*LISTS)
    @classmethod
    def _from_the_list(cls, v: list[str], info: Any) -> list[str]:
        allowed, most = LISTS[info.field_name]
        unknown = sorted({x for x in v if x not in allowed})
        if unknown:
            raise ValueError(f"Not on the list: {', '.join(unknown)}")
        # The same box ticked twice is one claim, not an error worth a 422.
        seen = list(dict.fromkeys(v))
        if len(seen) > most:
            raise ValueError(f"Choose at most {most}.")
        return seen

    def is_empty(self) -> bool:
        return self.other_certifications is None and not any(getattr(self, k) for k in LISTS)


class PublicProfileIn(_Strict):
    """What goes into organisation.public_profile. Never the logo keys — those
    are written by the logo endpoints alone, after the file has been checked."""

    website: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    company_size: CompanySize | None = None
    founded_year: int | None = Field(None, ge=1800, le=2100)
    registered_address: AddressIn | None = None
    # Delivery partners only; see PUBLIC_KIND_KEYS.
    expertise: ExpertiseIn | None = None

    @field_validator("website")
    @classmethod
    def _website(cls, v: str | None) -> str | None:
        if v is None:
            return None
        # "acme.com" is what people type; storing it bare would render as a
        # relative link on every page that shows it.
        if not _SCHEME.match(v):
            v = "https://" + v
        if not _WEBSITE.match(v):
            raise ValueError("Enter a web address such as https://example.com")
        # Again AFTER the scheme is added: max_length above saw the bare value,
        # and db/230's CHECK sees this one. A 250-character domain passed the
        # first and failed the second as a 500, on every approval of it.
        if len(v) > 255:
            raise ValueError("Keep the web address under 255 characters.")
        return v


class _OrgFields(_Strict):
    """Fields that live outside public_profile: on organisation itself, or on
    the kind's own profile table (client_profile / tenant_profile)."""

    legal_name: str | None = Field(None, max_length=200)
    country: str | None = Field(None, max_length=100)
    residency_region: Residency | None = None
    plan: str | None = Field(None, max_length=60)
    # client_profile
    industry: str | None = Field(None, max_length=100)
    dpa_signed: bool | None = None
    # tenant_profile
    hq: str | None = Field(None, max_length=100)
    capabilities: str | None = Field(None, max_length=500)


class OrgProfilePatch(PublicProfileIn, _OrgFields):
    """PATCH /organisations/{id}. Every field optional; only the fields sent
    are changed, and an explicit null clears one."""

    name: str | None = Field(None, min_length=2, max_length=200)


class OnboardingProfileIn(PublicProfileIn, _OrgFields):
    """The payload of a client or tenant onboarding request.

    The organisation's name is the request's proposed_name, not a payload key.
    logo_staging_key is an upload the requester made through
    /attachments/presign; it is filed into the organisation's logo folder at
    approval, once the organisation exists to own it.
    """

    logo_staging_key: str | None = Field(None, max_length=1024)


PUBLIC_KEYS: tuple[str, ...] = tuple(PublicProfileIn.model_fields)

# The account's identity and its terms with the platform. An organisation's
# owner may describe the company; changing who it legally is, where it is
# registered for tax, or what it pays is Ops' to do.
OPS_ONLY: frozenset[str] = frozenset(
    {"name", "legal_name", "country", "plan", "residency_region", "dpa_signed"}
)

# Which of the profile-table fields each kind has. Sending a partner's HQ for a
# client is a mistake in the form, not something to store.
KIND_FIELDS: dict[str, frozenset[str]] = {
    "client": frozenset({"industry", "plan", "dpa_signed"}),
    "tenant": frozenset({"hq", "capabilities", "plan"}),
}

# The same rule for what lives in public_profile. Expertise is what a delivery
# partner offers; a client has none to declare, and a directory that listed
# clients' "expertise" would be reading a field nobody meant.
PUBLIC_KIND_KEYS: dict[str, frozenset[str]] = {
    "tenant": frozenset({"expertise"}),
}
_ALL_KIND_FIELDS = frozenset().union(*KIND_FIELDS.values(), *PUBLIC_KIND_KEYS.values())

# What an onboarding request must carry before it can be submitted. The name
# and the first user are checked by the request itself.
CORE_REQUIRED: dict[str, str] = {
    "legal_name": "legal name",
    "website": "website",
    "country": "country",
    "registered_address": "registered address",
}


def foreign_kind_fields(kind: str, sent: set[str]) -> list[str]:
    """Kind-specific fields sent for a kind that does not have them."""
    own = KIND_FIELDS.get(kind, frozenset()) | PUBLIC_KIND_KEYS.get(kind, frozenset())
    return sorted((sent & _ALL_KIND_FIELDS) - own)


def missing_core(p: OnboardingProfileIn) -> list[str]:
    """Human names of the core fields an onboarding request still lacks."""
    return [label for key, label in CORE_REQUIRED.items() if getattr(p, key) is None]


def public_part(p: PublicProfileIn, only_sent: bool = True) -> dict[str, Any]:
    """The public_profile keys of a validated model, JSON-ready.

    only_sent: a PATCH changes what it names and nothing else, so an omitted
    key must not be read as "clear it". A sent null is returned as None, which
    the merge treats as removal.
    """
    keys = [k for k in PUBLIC_KEYS if not only_sent or k in p.model_fields_set]
    out: dict[str, Any] = {}
    for k in keys:
        v = getattr(p, k)
        if isinstance(v, ExpertiseIn) and v.is_empty():
            # Every box unticked is "no expertise declared", which is the
            # absence of the key, not an object of empty lists.
            v = None
        out[k] = v.model_dump(exclude_none=True) if isinstance(v, BaseModel) else v
    return out
