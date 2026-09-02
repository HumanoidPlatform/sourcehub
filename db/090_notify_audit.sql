-- ============================================================================
-- 090 · Notify and audit
--
-- The prototype's activity array is an append-only trail whose scope is an
-- array of arbitrary entity ids, used as the join key by every audit panel:
--   state.activity.filter(a => a.scope.includes(c.id))
--
-- That pattern is kept — it is the right one — but as a uuid[] with a GIN
-- index, so the filter is an index scan rather than a full scan of 40 million
-- rows. A separate join table was the alternative; it doubles the write cost
-- of every audited action for a query shape that GIN already serves.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- audit_event — hash-chained, append-only.
--
-- Blueprint control: "Hash-chained audit log; tampering is detectable, not
-- merely discouraged." Each row's hash covers the previous row's hash, so
-- deleting or editing any row breaks every hash after it.
-- ---------------------------------------------------------------------------
CREATE TABLE audit_event (
  id            bigserial,
  event_type    text NOT NULL,               -- 'contract.awarded', 'onboarding.approved'
  actor_org_id  uuid REFERENCES organisation(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,

  summary       text NOT NULL,               -- the rendered line the console shows
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- every entity this event touches. The console filters on it.
  scope         uuid[] NOT NULL DEFAULT '{}',

  -- the chain
  prev_hash     text,
  row_hash      text NOT NULL,

  occurred_at   timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE audit_event_2026q3 PARTITION OF audit_event
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE audit_event_2026q4 PARTITION OF audit_event
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE audit_event_default PARTITION OF audit_event DEFAULT;

CREATE INDEX audit_event_scope_gin  ON audit_event USING gin (scope);
CREATE INDEX audit_event_actor_idx  ON audit_event (actor_org_id, occurred_at DESC);
CREATE INDEX audit_event_type_idx   ON audit_event (event_type, occurred_at DESC);
CREATE INDEX audit_event_time_brin  ON audit_event USING brin (occurred_at);

CREATE RULE audit_event_no_update AS ON UPDATE TO audit_event DO INSTEAD NOTHING;
CREATE RULE audit_event_no_delete AS ON DELETE TO audit_event DO INSTEAD NOTHING;

-- Writing an event. Computes the chain hash from the previous row.
CREATE OR REPLACE FUNCTION write_audit_event(
  p_event_type text,
  p_summary    text,
  p_scope      uuid[]  DEFAULT '{}',
  p_payload    jsonb   DEFAULT '{}'::jsonb,
  p_actor_org  uuid    DEFAULT NULL,
  p_actor_user uuid    DEFAULT NULL
) RETURNS bigint LANGUAGE plpgsql AS $fn$
DECLARE
  v_prev text;
  v_hash text;
  v_id   bigint;
  v_org  uuid := coalesce(p_actor_org,  current_org_id());
  v_user uuid := coalesce(p_actor_user, current_user_id());
BEGIN
  SELECT row_hash INTO v_prev FROM audit_event ORDER BY id DESC LIMIT 1;

  v_hash := encode(digest(
      coalesce(v_prev, '') || p_event_type || p_summary ||
      coalesce(v_org::text, '') || coalesce(v_user::text, '') ||
      p_payload::text || now()::text,
    'sha256'), 'hex');

  INSERT INTO audit_event (event_type, actor_org_id, actor_user_id,
                           summary, payload, scope, prev_hash, row_hash)
  VALUES (p_event_type, v_org, v_user, p_summary, p_payload, p_scope, v_prev, v_hash)
  RETURNING id INTO v_id;

  RETURN v_id;
END
$fn$;


-- ---------------------------------------------------------------------------
-- outbox — reliable event publication.
--
-- The blueprint publishes request.published, contract.awarded, asset.ingested
-- and the rest to subscribers. Written in the same transaction as the state
-- change, drained by a worker, so an event cannot be lost between the commit
-- and the broker.
-- ---------------------------------------------------------------------------
CREATE TABLE event_outbox (
  id            bigserial PRIMARY KEY,
  event_type    text NOT NULL,
  aggregate_id  uuid,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  attempts      smallint NOT NULL DEFAULT 0,
  last_error    text
);

CREATE INDEX event_outbox_pending_idx ON event_outbox (created_at) WHERE published_at IS NULL;


-- ---------------------------------------------------------------------------
-- notification — state.notifications in the prototype, which carries a deep
-- link (page + params) so a notification can take you to the thing it is about.
-- That is worth keeping.
-- ---------------------------------------------------------------------------
CREATE TABLE notification (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES app_user(id) ON DELETE CASCADE,  -- NULL = whole org

  channel      notification_channel NOT NULL DEFAULT 'in_app',
  body         text NOT NULL,

  -- deep link
  link_page    text,
  link_params  jsonb NOT NULL DEFAULT '{}'::jsonb,

  read_at      timestamptz,
  sent_at      timestamptz,
  failed_at    timestamptz,
  failure_reason text,

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_unread_idx ON notification (org_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notification_user_idx   ON notification (user_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- Retention, legal hold and erasure.
--
-- Blueprint: retention "default 24 months post-contract, configurable down per
-- client, with legal-hold override"; erasure "propagates through derived assets
-- and delivered bundles, with a documented 30-day window and a tombstone in the
-- chain of custody".
-- ---------------------------------------------------------------------------
CREATE TABLE retention_policy (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organisation(id) ON DELETE CASCADE,  -- NULL = platform default
  retention_months  smallint NOT NULL DEFAULT 24 CHECK (retention_months > 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id)
);

CREATE TABLE legal_hold (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid REFERENCES contract(id) ON DELETE RESTRICT,
  org_id       uuid REFERENCES organisation(id) ON DELETE RESTRICT,
  reason       text NOT NULL,
  placed_by    uuid REFERENCES app_user(id),
  placed_at    timestamptz NOT NULL DEFAULT now(),
  released_at  timestamptz,
  released_by  uuid REFERENCES app_user(id),

  CONSTRAINT legal_hold_target CHECK (contract_id IS NOT NULL OR org_id IS NOT NULL)
);

CREATE INDEX legal_hold_active_idx ON legal_hold (contract_id) WHERE released_at IS NULL;

CREATE TABLE erasure_request (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  subject_ref    text,
  scope_note     text NOT NULL,
  status         text NOT NULL DEFAULT 'received',  -- received | in_progress | completed | refused
  received_at    timestamptz NOT NULL DEFAULT now(),
  due_at         timestamptz NOT NULL DEFAULT now() + interval '30 days',
  completed_at   timestamptz,
  refusal_reason text,
  assets_erased  integer NOT NULL DEFAULT 0
);

CREATE INDEX erasure_request_due_idx ON erasure_request (due_at) WHERE status <> 'completed';
