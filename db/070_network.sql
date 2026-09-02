-- ============================================================================
-- 070 · Network — equipment, loans, crowd roster
--
-- The prototype nests devices inside deviceSponsors and treats qty as a
-- type-level count with NO stock arithmetic anywhere. "On loan" is recomputed
-- ad hoc in the view:
--   state.deviceRequests.filter(r => r.deviceId===d.id && r.status==='Approved')
--                       .reduce((s,r)=>s+r.qty,0)
-- so nothing stops a sponsor approving 200 units of a 120-unit type.
--
-- Equipment stays a TYPE with a unit count rather than individual serial rows:
-- the prototype's own data is type-level ("Helmet camera, 4K", qty 120), and
-- nothing in the product tracks an individual camera. Availability becomes a
-- real constraint via a trigger instead of a comment.
-- ============================================================================

CREATE TABLE equipment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- DV-01
  sponsor_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  equipment_type  text NOT NULL,             -- "Helmet camera, 4K"
  total_units     integer NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  status          equipment_status NOT NULL DEFAULT 'available',

  -- Blueprint: "Calibration expiry blocks new loans."
  calibrated_on   date,
  calibration_expires_on date,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES app_user(id),
  updated_by      uuid REFERENCES app_user(id),
  deleted_at      timestamptz
);

CREATE INDEX equipment_sponsor_idx ON equipment (sponsor_org_id) WHERE deleted_at IS NULL;
CREATE INDEX equipment_status_idx  ON equipment (status) WHERE deleted_at IS NULL;

CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- asset.equipment_id, deferred from 050 until equipment existed.
ALTER TABLE asset
  ADD CONSTRAINT asset_equipment_fkey
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- loan — the chain of custody. state.deviceRequests in the prototype.
--
-- requesterType/requesterId collapse to one FK now that aggregators and
-- businesses are both organisations.
-- ---------------------------------------------------------------------------
CREATE TABLE loan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    text UNIQUE NOT NULL,    -- EQR-01
  equipment_id      uuid NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  sponsor_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  requester_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  task_id           uuid REFERENCES task(id) ON DELETE SET NULL,

  units             integer NOT NULL CHECK (units > 0),
  status            loan_status NOT NULL DEFAULT 'pending',
  needed_by         date,
  note              text,

  decided_at        timestamptz,
  decided_by        uuid REFERENCES app_user(id),
  decision_reason   text,
  issued_at         timestamptz,
  returned_at       timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_by        uuid REFERENCES app_user(id),

  CONSTRAINT loan_rejected_needs_reason CHECK (
    status <> 'rejected' OR (decision_reason IS NOT NULL AND length(btrim(decision_reason)) > 0)
  )
);

CREATE INDEX loan_equipment_idx ON loan (equipment_id);
CREATE INDEX loan_sponsor_idx   ON loan (sponsor_org_id);
CREATE INDEX loan_requester_idx ON loan (requester_org_id);
-- the sponsor's decision queue
CREATE INDEX loan_pending_idx   ON loan (sponsor_org_id, created_at) WHERE status = 'pending';

CREATE TRIGGER loan_updated_at BEFORE UPDATE ON loan
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- Availability, as an actual constraint.
--
-- units_on_loan = sum of approved and issued loans. A sponsor cannot approve
-- more units than exist, and cannot lend equipment whose calibration has
-- expired. Neither rule exists in the prototype.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION equipment_units_on_loan(p_equipment_id uuid)
RETURNS integer LANGUAGE sql STABLE AS $fn$
  SELECT coalesce(sum(units), 0)::integer
  FROM   loan
  WHERE  equipment_id = p_equipment_id
    AND  status IN ('approved','issued','overdue')
$fn$;

CREATE OR REPLACE FUNCTION check_loan_availability() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  v_total     integer;
  v_on_loan   integer;
  v_expires   date;
BEGIN
  IF NEW.status NOT IN ('approved','issued') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT total_units, calibration_expires_on
    INTO v_total, v_expires
  FROM equipment WHERE id = NEW.equipment_id;

  IF v_expires IS NOT NULL AND v_expires < current_date THEN
    RAISE EXCEPTION 'equipment % calibration expired on %', NEW.equipment_id, v_expires
      USING ERRCODE = 'check_violation';
  END IF;

  v_on_loan := equipment_units_on_loan(NEW.equipment_id);
  IF TG_OP = 'UPDATE' AND OLD.status IN ('approved','issued','overdue') THEN
    v_on_loan := v_on_loan - OLD.units;
  END IF;

  IF v_on_loan + NEW.units > v_total THEN
    RAISE EXCEPTION 'equipment % has % units, % already on loan, % requested',
      NEW.equipment_id, v_total, v_on_loan, NEW.units
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END
$fn$;

CREATE TRIGGER loan_availability BEFORE INSERT OR UPDATE ON loan
  FOR EACH ROW EXECUTE FUNCTION check_loan_availability();

CREATE VIEW equipment_availability AS
SELECT e.id AS equipment_id, e.sponsor_org_id, e.equipment_type,
       e.total_units,
       equipment_units_on_loan(e.id)                  AS units_on_loan,
       e.total_units - equipment_units_on_loan(e.id)  AS units_available,
       e.calibration_expires_on,
       (e.calibration_expires_on IS NOT NULL
        AND e.calibration_expires_on < current_date)  AS calibration_expired
FROM   equipment e
WHERE  e.deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- crowd_worker — an aggregator's roster.
--
-- NOT platform users. Blueprint: "Aggregator crowd workers authenticate
-- through their aggregator, not through the platform." No credential, no
-- user_role_grant, no login. They are records about people, not principals.
-- ---------------------------------------------------------------------------
CREATE TABLE crowd_worker (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    text UNIQUE NOT NULL,    -- WKR-01
  aggregator_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,

  display_name      text NOT NULL,
  skill             text,
  status            worker_status NOT NULL DEFAULT 'on_shift',
  trained           boolean NOT NULL DEFAULT false,
  rating            numeric(2,1) CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE INDEX crowd_worker_aggregator_idx ON crowd_worker (aggregator_org_id) WHERE deleted_at IS NULL;

CREATE TRIGGER crowd_worker_updated_at BEFORE UPDATE ON crowd_worker
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- rating — bidirectional, on a completed contract.
--
-- fromType/fromId/toType/toId collapse to two org FKs.
-- ---------------------------------------------------------------------------
CREATE TABLE rating (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,
  from_org_id   uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  to_org_id     uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  score         smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment       text NOT NULL,               -- the prototype refuses a blank one
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES app_user(id),

  CONSTRAINT rating_comment_present CHECK (length(btrim(comment)) > 0),
  CONSTRAINT rating_not_self CHECK (from_org_id <> to_org_id),
  UNIQUE (contract_id, from_org_id, to_org_id)
);

CREATE INDEX rating_to_org_idx ON rating (to_org_id);
