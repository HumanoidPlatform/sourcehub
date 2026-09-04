from __future__ import annotations

from cosaarthi_mobile.db.models import User

SUPPORTED_PERSONAS: tuple[str, ...] = (
    "platform",
    "client",
    "tenant",
    "aggregator",
    "qa",
    "partner",
    "sponsor",
    "crowd",
    "ide",
    "builder",
)

ROLE_TO_PERSONA = {
    "crowd_worker": "crowd",
}

PERSONA_TO_ROLE = {
    "crowd": "crowd_worker",
}

PERSONA_ORDER = {persona: index for index, persona in enumerate(SUPPORTED_PERSONAS)}


def permission_codes(user: User) -> set[str]:
    return {permission.code for role in user.roles for permission in role.permissions}


def role_to_persona(role_code: str) -> str:
    return ROLE_TO_PERSONA.get(role_code, role_code)


def persona_to_role_code(persona: str) -> str:
    return PERSONA_TO_ROLE.get(persona, persona)


def normalize_persona(persona: str) -> str:
    normalized = persona.strip().lower()
    if normalized not in SUPPORTED_PERSONAS:
        raise ValueError(f"Unsupported persona: {persona}")
    return normalized


def primary_persona(user: User) -> str:
    return available_personas(user)[0]


def available_personas(user: User) -> list[str]:
    personas = {
        role_to_persona(role.code)
        for role in user.roles
        if role_to_persona(role.code) in SUPPORTED_PERSONAS
    }
    if not personas:
        return ["crowd"]
    return sorted(personas, key=lambda persona: PERSONA_ORDER[persona])


def user_has_persona(user: User, persona: str) -> bool:
    return normalize_persona(persona) in available_personas(user)
