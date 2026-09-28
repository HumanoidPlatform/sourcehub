-- ============================================================================
-- 230 · An organisation's public profile
--
-- Onboarding captured a name, an industry or HQ, a plan, a free-text country
-- and the first user — and nothing could be changed once the request was
-- approved. Clients asked, in the first demo, for the rest of what a buyer
-- expects to know about a supplier and a supplier about a buyer: a website,
-- what the company does, how big it is, where it is registered, and its logo.
--
-- ONE jsonb column rather than a column per field, deliberately:
--
--   * the shape is the API's to validate (modules/identity/profile_schema.py,
--     extra="forbid"), and it will grow — partner expertise arrives with the
--     vendors directory — without a migration per key;
--   * everything in it has ONE audience. The column is named for that audience
--     so the rule is on the tin: whoever may see the organisation may see all of
--     this. organisation_select already decides who that is (bidders, open
--     buyers, contract counterparties, the network), so no policy changes here.
--     Tax identifiers, billing details and private contacts do NOT belong in
--     this column; they need their own table with an Ops-or-self policy.
--
-- The CHECKs below are a backstop for the few invariants that matter if the API
-- is ever bypassed: it is an object, a website is a web address, and a logo key
-- points into the logo folder the API files logos under — never into another
-- organisation's attachments.
--
-- legal_name is NOT moved in here. It has been a column since 010_identity,
-- unwritten and unread; it is Ops-owned rather than self-service, and the
-- service now writes and returns it.
--
-- Additive only: a new column with a default, and three CHECKs that every
-- existing row ('{}') satisfies. The currently deployed API image reads
-- organisation through an explicit ORM column list and is unaffected.
-- ============================================================================

ALTER TABLE organisation
  ADD COLUMN public_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_object
    CHECK (jsonb_typeof(public_profile) = 'object');

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_website
    CHECK (public_profile->>'website' IS NULL
           OR (public_profile->>'website' ~* '^https?://[^ ]+$'
               AND length(public_profile->>'website') <= 255));

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_logo
    CHECK (public_profile->>'logo_key' IS NULL
           OR public_profile->>'logo_key' LIKE 'orgs/%');
