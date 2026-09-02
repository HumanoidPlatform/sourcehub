"""Initial schema.

Must produce EXACTLY what db/*.sql builds — 56 tables, 82 policies. The two
paths diverging on day one is the failure mode this file exists to avoid, so
the verification step is: build one database from db/*.sql, another from
`alembic upgrade head`, and diff the schemas.

RLS policies are hand-written here, copied from db/100_rls.sql. Autogenerate
does not see them.

Revision ID: 0001
"""

revision = "0001"
down_revision = None
