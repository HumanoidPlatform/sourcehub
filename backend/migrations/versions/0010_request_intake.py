"""Structured client requirements on a request, and samples folded into attachments.

RECONSTRUCTED FROM THE DEPLOYED DATABASE. Read this before changing it.

The deployed database was stamped alembic revision 0010, but revisions 0008,
0009 and 0010 exist nowhere — not on any machine, not in this repository's
object database, not in any dangling commit. Either they ran from a checkout
that was never pushed, or the DDL was applied by hand and the version row was
stamped afterwards. Nothing recoverable says which.

So this file is not those revisions. It is one migration that takes the 0007
schema to the schema the deployed database actually has, verified object by
object: columns in order, constraint definitions, index definitions, RLS
predicates, function bodies and the sourcehub_app grants.

Two consequences, both deliberate:

  * It is numbered 0010, not 0008, and 0008 and 0009 do not exist. The gap is
    the point. The deployed database says 0010, and naming this 0010 makes
    `alembic current` resolve and `alembic upgrade head` a verified no-op there
    — without writing a single row to a production version table. Do not
    "correct" the numbering.

  * It is one file, not three. Splitting it would invent two intermediate
    schemas that no database has ever been in and that nothing could verify.

Keep it in step with db/040_marketplace.sql, db/095_attachments.sql,
db/035_storage.sql and db/100_rls.sql.

Revision ID: 0010
Revises: 0007
"""

from alembic import op

revision = "0010"
down_revision = "0007"


# spec_format and spec_quantity were free text — "25,000 images", "JPEG minimum
# 12MP" — which reads well and cannot be bid against, filtered on, or checked at
# delivery. A quantity with a unit can be.
REQUIREMENTS = """
ALTER TABLE request
  DROP COLUMN spec_format,
  DROP COLUMN spec_quantity,

  ADD COLUMN objective         text,
  ADD COLUMN use_case          text CHECK (use_case IS NULL OR use_case IN
                ('ai_training','market_research','audit_compliance','monitoring_evaluation','other')),
  ADD COLUMN target_quantity   integer CHECK (target_quantity IS NULL OR target_quantity > 0),
  ADD COLUMN target_unit       text CHECK (target_unit IS NULL OR target_unit IN
                ('photos','videos','audio_clips','audio_hours','responses','records','sites','hours')),
  ADD COLUMN capture_spec      jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN countries         text[] NOT NULL DEFAULT '{}',
  ADD COLUMN sampling_frame    jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN quality_thresholds jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN rejection_policy  jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN people_in_frame   text CHECK (people_in_frame IS NULL OR people_in_frame IN
                ('none','incidental','consented')),
  ADD COLUMN minors_policy     text CHECK (minors_policy IS NULL OR minors_policy IN
                ('prohibited','with_parental_consent')),
  ADD COLUMN deidentification  text[] NOT NULL DEFAULT '{}'
                CHECK (deidentification <@ ARRAY['blur_faces','redact_plates','strip_gps']),
  ADD COLUMN regulations       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN lawful_basis      text CHECK (lawful_basis IS NULL OR lawful_basis IN
                ('consent','contract','legitimate_interest','public_task','legal_obligation','not_personal_data')),
  ADD COLUMN permitted_uses    text[] NOT NULL DEFAULT '{}'
                CHECK (permitted_uses <@ ARRAY['model_training','internal_analysis','research','audit','publication']),
  ADD COLUMN partner_reuse_allowed boolean NOT NULL DEFAULT false,
  ADD COLUMN biometric_processing  boolean NOT NULL DEFAULT false,
  ADD COLUMN location_type     text CHECK (location_type IS NULL OR location_type IN
                ('public_outdoor','retail_interior','private_premises','residential')),
  ADD COLUMN pricing_model_requested text NOT NULL DEFAULT 'fixed',
  ADD COLUMN budget_disclosed  boolean NOT NULL DEFAULT true,
  ADD COLUMN pilot_required    boolean NOT NULL DEFAULT false,
  ADD COLUMN pilot_quantity    integer CHECK (pilot_quantity IS NULL OR pilot_quantity > 0),
  ADD COLUMN pilot_due_on      date,
  ADD COLUMN milestones        jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN proposals_close_at timestamptz,
  ADD COLUMN contact_user_id   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  ADD COLUMN proposal_requirements text[] NOT NULL DEFAULT '{}'
                CHECK (proposal_requirements <@ ARRAY['method_statement','team_cv','sample_work','insurance','dpa_acceptance','references']),

  ADD CONSTRAINT request_currency_shape CHECK (currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT request_pricing_model_check
        CHECK (pricing_model_requested IN ('fixed','per_unit','milestone','open')),
  ADD CONSTRAINT request_pilot_shape
        CHECK (NOT pilot_required OR pilot_quantity IS NOT NULL),
  ADD CONSTRAINT request_close_before_delivery CHECK (
        proposals_close_at IS NULL OR delivery_due_on IS NULL
        OR (proposals_close_at AT TIME ZONE 'UTC')::date <= delivery_due_on);
"""

# Column order matters and this is why the two ADD COLUMNs are in this order:
# pg_dump emits columns in pg_attribute order, and infra/verify_schema.sh
# compares dumps. unit_price landed before unit on the deployed database.
PROPOSAL_UNIT = """
ALTER TABLE proposal
  ADD COLUMN unit_price numeric CHECK (unit_price IS NULL OR unit_price >= 0),
  ADD COLUMN unit       text;
"""

# A task's deliverable is the finished dataset rather than a supporting
# document, so it gets 500 MB where everything else keeps 25 MiB. Same
# constraint name as 0006 gave it, so it is a replace rather than an addition.
ATTACHMENT_SIZE = """
ALTER TABLE attachment ADD CONSTRAINT attachment_size_bytes_check CHECK (
  size_bytes > 0
  AND (size_bytes <= 26214400
       OR (entity_type = 'task' AND slot = 'deliverable' AND size_bytes <= 524288000)))
"""

# request_sample held the same thing attachment holds, under another name. The
# rows are carried over with storage_key untouched, so a file uploaded under
# the old scheme stays reachable at the key it was written to — the deployed
# database still has one such row, whose key ends .../samples/ rather than
# .../capture_examples/. owner_org_id comes from the request because
# request_sample never recorded one: only the buying client could insert.
SAMPLES_TO_ATTACHMENTS = """
INSERT INTO attachment (entity_type, entity_id, slot, owner_org_id, filename,
                        storage_key, content_type, size_bytes, uploaded_by, uploaded_at)
SELECT 'request', rs.request_id, 'capture_examples', r.client_org_id, rs.filename,
       rs.storage_key, rs.content_type, rs.size_bytes, rs.uploaded_by, rs.uploaded_at
FROM   request_sample rs
JOIN   request r ON r.id = rs.request_id;
"""

# Recreated verbatim from 0002 on the way down, policies and grant included.
REQUEST_SAMPLE = (
    """
    CREATE TABLE request_sample (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id    uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
      filename      text NOT NULL,
      storage_key   text NOT NULL UNIQUE,
      content_type  text,
      size_bytes    bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
      uploaded_by   uuid REFERENCES app_user(id),
      uploaded_at   timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX request_sample_request_idx ON request_sample (request_id)",
    "ALTER TABLE request_sample ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE request_sample FORCE  ROW LEVEL SECURITY",
    """
    CREATE POLICY request_sample_select ON request_sample FOR SELECT
      USING (
           is_platform_admin()
        OR EXISTS (SELECT 1 FROM request r
                    WHERE r.id = request_sample.request_id
                      AND r.deleted_at IS NULL
                      AND (r.client_org_id = current_org_id()
                        OR (r.status IN ('published','proposals_received')
                            AND current_org_kind() = 'tenant')
                        OR EXISTS (SELECT 1 FROM contract c
                                    WHERE c.request_id = r.id
                                      AND c.partner_org_id = current_org_id())))
      )
    """,
    """
    CREATE POLICY request_sample_insert ON request_sample FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM request r
                           WHERE r.id = request_sample.request_id
                             AND r.client_org_id = current_org_id()))
    """,
    "GRANT SELECT, INSERT ON request_sample TO sourcehub_app",
)


def upgrade() -> None:
    op.execute(REQUIREMENTS)
    op.execute(
        "CREATE INDEX request_close_idx ON request (proposals_close_at) "
        "WHERE status = 'published' AND deleted_at IS NULL"
    )
    op.execute(PROPOSAL_UNIT)

    op.execute("ALTER TABLE attachment DROP CONSTRAINT attachment_size_bytes_check")
    op.execute(ATTACHMENT_SIZE)
    op.execute(
        "CREATE INDEX attachment_slot_idx ON attachment (entity_type, entity_id, slot) "
        "WHERE deleted_at IS NULL"
    )

    # Deliberately not ON CONFLICT DO NOTHING. Both storage_key columns are
    # UNIQUE over disjoint key spaces, so a collision means an assumption here
    # is wrong, and DDL is transactional — failing loudly costs nothing and
    # rolls back clean, where skipping a row would lose a file silently.
    op.execute(SAMPLES_TO_ATTACHMENTS)
    op.execute("DROP TABLE request_sample")  # takes its two policies with it

    # region was here for SigV4 against an S3 bucket outside us-east-1. Client
    # destinations are Azure-only now and a container has no region to sign
    # for. The PLATFORM's own storage still needs one on S3 and keeps it in
    # settings.storage_region — a different thing entirely.
    op.execute("ALTER TABLE storage_target DROP COLUMN region")
    op.execute(
        "ALTER TABLE storage_target ADD CONSTRAINT storage_target_azure_only "
        "CHECK (provider = 'azure_blob' OR deleted_at IS NOT NULL)"
    )


def downgrade() -> None:
    """Restores the 0007 SHAPE. It does not restore content or column order.

    The attachment rows that came from request_sample are not moved back: once
    merged there is nothing that distinguishes a carried-over sample from a
    capture example uploaded natively afterwards, and guessing would be worse
    than leaving them where they are. A downgrade therefore leaves the
    request_sample table empty and those files reachable as attachments.

    Column order also does not come back. spec_format, spec_quantity and
    storage_target.region return at the END of their tables rather than where
    they were, because Postgres cannot reinsert a column at an attnum. Verified:
    after a downgrade every column, constraint, index, policy, function and
    grant matches a fresh 0007 build, and position is the only difference. It
    matters only in that a pg_dump taken after a downgrade will not diff clean
    against one taken before — see the note in db/040_marketplace.sql.
    """
    op.execute("ALTER TABLE storage_target DROP CONSTRAINT storage_target_azure_only")
    op.execute("ALTER TABLE storage_target ADD COLUMN region text")

    for stmt in REQUEST_SAMPLE:
        op.execute(stmt)

    op.execute("DROP INDEX attachment_slot_idx")
    op.execute("ALTER TABLE attachment DROP CONSTRAINT attachment_size_bytes_check")
    op.execute(
        "ALTER TABLE attachment ADD CONSTRAINT attachment_size_bytes_check "
        "CHECK (size_bytes > 0 AND size_bytes <= 26214400)"
    )

    op.execute("ALTER TABLE proposal DROP COLUMN unit, DROP COLUMN unit_price")
    op.execute("DROP INDEX request_close_idx")
    op.execute(
        "ALTER TABLE request "
        "  DROP CONSTRAINT request_close_before_delivery, "
        "  DROP CONSTRAINT request_pilot_shape, "
        "  DROP CONSTRAINT request_pricing_model_check, "
        "  DROP CONSTRAINT request_currency_shape, "
        "  DROP COLUMN proposal_requirements, DROP COLUMN contact_user_id, "
        "  DROP COLUMN proposals_close_at, DROP COLUMN milestones, "
        "  DROP COLUMN pilot_due_on, DROP COLUMN pilot_quantity, "
        "  DROP COLUMN pilot_required, DROP COLUMN budget_disclosed, "
        "  DROP COLUMN pricing_model_requested, DROP COLUMN location_type, "
        "  DROP COLUMN biometric_processing, DROP COLUMN partner_reuse_allowed, "
        "  DROP COLUMN permitted_uses, DROP COLUMN lawful_basis, "
        "  DROP COLUMN regulations, DROP COLUMN deidentification, "
        "  DROP COLUMN minors_policy, DROP COLUMN people_in_frame, "
        "  DROP COLUMN rejection_policy, DROP COLUMN quality_thresholds, "
        "  DROP COLUMN sampling_frame, DROP COLUMN countries, "
        "  DROP COLUMN capture_spec, DROP COLUMN target_unit, "
        "  DROP COLUMN target_quantity, DROP COLUMN use_case, DROP COLUMN objective, "
        "  ADD COLUMN spec_format text, ADD COLUMN spec_quantity text"
    )
