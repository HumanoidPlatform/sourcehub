// can() — the capability check.
//
// Mirrors the prototype's can('rfp.create'). Reads the capability list the
// access token carries, which the database produces via
// user_capabilities(user_id, org_id) in db/020_rbac.sql.
//
// Never checks a role name. Adding a role is a database INSERT; if this file
// grows a list of role strings, that property has been lost.

import type { Session } from "@api/client";

export function can(session: Session | null, capability: string): boolean {
  // Array.isArray, not just a truthy session: a session persisted by an older
  // build can lack capabilities entirely — api/client.ts:12 says so of the
  // fields beside it — and this is now called from ProfileMenu, which renders
  // on every page. Reading .includes off undefined there would take down the
  // whole console rather than one feature, and "capability absent" is the
  // right answer for a session that cannot name any.
  return Array.isArray(session?.capabilities) && session.capabilities.includes(capability);
}

/** May this person add or remove COLLEAGUES in their own organisation?
 *
 * Capability alone cannot answer it, and that is not an oversight in the seed.
 * Capabilities come from the role, and there is exactly one role per
 * organisation kind — so every member of a client org holds user.invite,
 * user.manage and role.manage already. What separates an administrator from a
 * colleague is user_role_grant.scope, carried on the session as `scope`.
 *
 * This is not the role-name check the header forbids: scope is a fixed
 * three-value enum about authority, not an extensible list of personas. Adding
 * a role still requires no change here.
 *
 * The server decides for real (require_member_admin, api/deps.py). This only
 * decides what to render — a control nobody can use is worse than no control.
 */
export function canManagePeople(session: Session | null): boolean {
  return (
    can(session, "user.manage") &&
    (session?.scope === "owner" || session?.scope === "manager")
  );
}
