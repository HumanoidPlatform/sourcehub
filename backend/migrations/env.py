"""Alembic environment.

Reads DATABASE_ADMIN_URL from config, not sqlalchemy.url in the ini: the app
role has no DDL rights, so migrations connect as the owner.
"""
