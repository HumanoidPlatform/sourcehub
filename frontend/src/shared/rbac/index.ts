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
  return !!session && session.capabilities.includes(capability);
}
