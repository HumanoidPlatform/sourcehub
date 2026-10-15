"""catalogue: the data marketplace is called DataHub.

People saw it as Datasets, the dataset catalogue and the public catalogue; it
is DataHub everywhere now. In the database that is the bell a public quote
request rings for the seller (datahub_public_request_create) and the
descriptions of catalogue.list and catalogue.review. Codes and names stay.

The downgrade puts back db/440's words and the old descriptions.

SQL copied verbatim from db/460_datahub_name.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0050
Revises: 0049
"""

from alembic import op

revision = "0050"
down_revision = "0049"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 460 · The data marketplace is called DataHub
--
-- What people read named it three ways: Datasets, the dataset catalogue, the
-- public catalogue. It is DataHub now, on every screen and in every message.
-- Here that is two things: the bell a public quote request rings for the
-- seller, and the descriptions of two capabilities. The capability codes
-- (catalogue.*) and every table and function name stay as they are.
-- ============================================================================

-- The one write without a session, as db/440 made it; only the bell's words differ.
CREATE OR REPLACE FUNCTION datahub_public_request_create(
  p_slug text, p_name text, p_email text, p_company text, p_intended_use text, p_message text
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_dataset uuid;
  v_owner   uuid;
  v_title   text;
  v_id      uuid;
BEGIN
  SELECT id, owner_org_id, title INTO v_dataset, v_owner, v_title
  FROM   datahub_dataset WHERE slug = p_slug AND status = 'published';
  IF v_dataset IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO datahub_dataset_deal (dataset_id, seller_org_id, channel, contact_name, contact_email,
                                    contact_company, intended_use, message)
  VALUES (v_dataset, v_owner, 'public', btrim(p_name), btrim(p_email), btrim(p_company),
          btrim(p_intended_use), nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- The seller's bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (v_owner,
          'A quote request from ' || btrim(p_company) || ' for ' || v_title
            || ' came in through the DataHub public page.',
          'catalogue_deal', jsonb_build_object('id', v_id));
  RETURN v_id;
END
$fn$;

UPDATE permission SET description = 'List own datasets in DataHub'
WHERE  code = 'catalogue.list';
UPDATE permission SET description = 'Publish or reject DataHub listings'
WHERE  code = 'catalogue.review';
"""

_DOWN = """
CREATE OR REPLACE FUNCTION datahub_public_request_create(
  p_slug text, p_name text, p_email text, p_company text, p_intended_use text, p_message text
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_dataset uuid;
  v_owner   uuid;
  v_title   text;
  v_id      uuid;
BEGIN
  SELECT id, owner_org_id, title INTO v_dataset, v_owner, v_title
  FROM   datahub_dataset WHERE slug = p_slug AND status = 'published';
  IF v_dataset IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO datahub_dataset_deal (dataset_id, seller_org_id, channel, contact_name, contact_email,
                                    contact_company, intended_use, message)
  VALUES (v_dataset, v_owner, 'public', btrim(p_name), btrim(p_email), btrim(p_company),
          btrim(p_intended_use), nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- The seller's bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (v_owner,
          'A quote request from ' || btrim(p_company) || ' for ' || v_title
            || ' came in through the public catalogue.',
          'catalogue_deal', jsonb_build_object('id', v_id));
  RETURN v_id;
END
$fn$;

UPDATE permission SET description = 'List own datasets in the catalogue'
WHERE  code = 'catalogue.list';
UPDATE permission SET description = 'Publish or reject catalogue listings'
WHERE  code = 'catalogue.review';
"""


def _statements(ddl: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_body = False
    for line in ddl.splitlines():
        if line.count("$fn$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = chr(10).join(buf).strip()
            buf = []
            lines = stmt.splitlines()
            only_comments = all(ln.strip().startswith("--") or not ln.strip() for ln in lines)
            if stmt and not only_comments:
                out.append(stmt)
    return out


def upgrade() -> None:
    for stmt in _statements(_UP):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
