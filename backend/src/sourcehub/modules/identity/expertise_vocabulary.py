"""identity — the curated lists a delivery partner declares its expertise from.

Curated rather than free text because the vendors directory FILTERS on them: a
client choosing "Video" must find the partner that typed "video capture", and
two spellings of one thing are two filters that each find half the partners.

The console holds the same lists with their labels
(frontend/src/shared/expertise.ts, shared/languages.ts,
shared/countries.ts). Nothing generates one from the other, so
tests/test_vendor_directory_unit.py compares them; a value added on one side
only is a 422 the console cannot explain, or a filter that matches nobody.

Order is presentation order on the console and means nothing here.
"""

from __future__ import annotations

# Kept several to a line: one value per line would make the country list two
# screens long and no easier to compare with the console's.
# fmt: off
DATA_TYPES: tuple[str, ...] = (
    "image", "video", "audio", "text", "structured_data",
)

DOMAINS: tuple[str, ...] = (
    "retail", "automotive", "healthcare", "agriculture", "finance", "logistics",
    "real_estate", "manufacturing", "energy", "public_sector", "media", "education",
    "telecom", "travel",
)

# The codes the RFP builder offers for a request's languages. Mixed two- and
# three-letter on purpose: they are what requests already store.
LANGUAGES: tuple[str, ...] = (
    "eng", "hin", "fr", "spa", "ara", "ben", "cmn", "por", "rus", "de", "jpn", "kor", "ind",
    "msa", "ita", "tur", "vie", "tha", "tam", "tel", "mar", "urd", "guj", "kan", "pan",
    "nld", "swe", "nor", "dan", "fin", "pol", "ukr", "ell", "heb",
)

# ISO 3166 alpha-2, the console's country list.
REGIONS: tuple[str, ...] = (
    "AF", "AL", "DZ", "AD", "AO", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB",
    "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "KH", "CM",
    "CA", "CL", "CN", "CO", "CR", "CI", "HR", "CY", "CZ", "DK", "DO", "EC", "EG", "SV",
    "EE", "ET", "FI", "FR", "GE", "DE", "GH", "GR", "GT", "HK", "HU", "IS", "IN", "ID",
    "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KW", "KG", "LA", "LV", "LB", "LT",
    "LU", "MY", "MV", "MT", "MU", "MX", "MD", "MA", "MZ", "MM", "NP", "NL", "NZ", "NG",
    "NO", "OM", "PK", "PA", "PE", "PH", "PL", "PT", "QA", "RO", "RU", "RW", "SA", "SN",
    "RS", "SG", "SK", "SI", "ZA", "KR", "ES", "LK", "SE", "CH", "TW", "TJ", "TZ", "TH",
    "TR", "TM", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VE", "VN", "ZM", "ZW",
)

CERTIFICATIONS: tuple[str, ...] = (
    "iso_27001", "soc_2", "iso_9001", "iso_27701", "hipaa", "gdpr",
)
# fmt: on

# What each list may hold, and how many of them one partner may claim. The caps
# are what keep a card readable and a claim meaningful: a partner that ticks
# every domain has told a client nothing.
LISTS: dict[str, tuple[tuple[str, ...], int]] = {
    "data_types": (DATA_TYPES, 5),
    "domains": (DOMAINS, 8),
    "languages": (LANGUAGES, 34),
    "regions": (REGIONS, 60),
    "certifications": (CERTIFICATIONS, 6),
}

OTHER_CERTIFICATIONS_MAX = 120
