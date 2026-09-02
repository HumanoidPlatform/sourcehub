"""Database-backed identity: password hashing and verification.

argon2id for every new password. bcrypt verification is retained because
db/900_seed.sql hashes the seeded users with pgcrypto's crypt() — Postgres has
no argon2 — and app_user.password_algo records which algorithm each row used.
A bcrypt row upgrades to argon2id transparently on its next successful login
(the service rewrites the hash when verify_needs_rehash says so).

This module is the Keycloak seam: app_user.external_idp_subject already exists
in the schema, unused, and swapping this adapter for keycloak.py is the whole
of that migration.
"""

from __future__ import annotations

import argon2
import bcrypt as _bcrypt

_hasher = argon2.PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)


def hash_password(plain: str) -> tuple[str, str]:
    """Returns (hash, algo)."""
    return _hasher.hash(plain), "argon2id"


def verify_password(plain: str, stored_hash: str, algo: str) -> bool:
    if algo == "argon2id":
        try:
            return _hasher.verify(stored_hash, plain)
        except argon2.exceptions.VerificationError:
            return False
    if algo == "bcrypt":
        try:
            return _bcrypt.checkpw(plain.encode(), stored_hash.encode())
        except ValueError:
            return False
    return False


def needs_rehash(algo: str, stored_hash: str) -> bool:
    """True when the stored credential should be upgraded on next login."""
    if algo != "argon2id":
        return True
    return _hasher.check_needs_rehash(stored_hash)
