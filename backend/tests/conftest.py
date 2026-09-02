"""Shared fixtures: a real Postgres, and the three org contexts.

The build guide is explicit that infrastructure is not mocked:

    "Mocked storage cannot tell you that your pre-signed URL has the wrong
     content-type pinned, and mocked Postgres cannot tell you that your RLS
     policy has a hole. Those are precisely the two failures that would reach
     production."

The three contexts below exist to be used by tests/isolation/, which runs every
list endpoint as an owner, a sibling org of the same kind, and an unrelated org.
Written once, it covers every endpoint added afterwards automatically.

The container is built from db/*.sql — the same files docker compose mounts —
so the tests exercise the schema that actually ships.
"""

from __future__ import annotations

import pytest


@pytest.fixture(scope="session")
def postgres_container():
    """Throwaway Postgres 16, initialised from db/*.sql in filename order."""
    raise NotImplementedError


@pytest.fixture
def owner_context():
    """The organisation that owns the row under test."""
    raise NotImplementedError


@pytest.fixture
def sibling_context():
    """A different organisation OF THE SAME KIND.

    The one that catches a missing predicate. An unrelated-org test passes
    trivially against almost any policy; a sibling tenant bidding on the same
    request is the case that actually leaks.
    """
    raise NotImplementedError


@pytest.fixture
def unrelated_context():
    """An organisation with no relationship to the row at all."""
    raise NotImplementedError


@pytest.fixture
def app_role_engine():
    """An engine connected as sourcehub_app.

    Isolation tests MUST use this. Running them as postgres proves nothing — a
    superuser bypasses RLS unconditionally, so every assertion would pass while
    the policies could be entirely absent.
    """
    raise NotImplementedError
