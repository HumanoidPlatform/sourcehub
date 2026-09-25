// identity — the people in your own organisation.
//
// Reached from the account menu rather than the rail: adding a colleague is an
// account concern, not a workspace one, and it sits beside Change password
// where someone already goes to manage themselves.
//
// The page renders nothing an unauthorised viewer could use. can() alone is not
// the gate — every member of a client org already holds user.manage, because
// capabilities come from the role and there is one role per organisation kind.
// canManagePeople() adds the scope half; the server enforces the same rule in
// require_member_admin, and this only decides what to draw.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, patch, post } from "@api/client";
import type { AssignableRole, MemberRow, MemberScope } from "@api/types";
import {
  Button, Dialog, Empty, Field, inputCls, Loadable, Metric, Panel, Pill,
  selectCls, TableWrap, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate } from "@shared/format";
import { can, canManagePeople } from "@shared/rbac";
import { ReasonDialog } from "@shared/reason-dialog";
import { invitationStatus, statusMeta } from "@shared/status";

/** What each level may do, in the words the person reading it would use.
 *  Mirrors may_manage (modules/identity/members.py) — the server decides. */
const SCOPES: { value: MemberScope; label: string; hint: string }[] = [
  { value: "owner", label: "Owner", hint: "Full access, and can manage everyone including other owners." },
  { value: "manager", label: "Manager", hint: "Full access, and can add or remove colleagues — but not owners." },
  { value: "member", label: "Member", hint: "Full access to the product. Cannot manage people." },
];

const scopeLabel = (s: string) => SCOPES.find((x) => x.value === s)?.label ?? s;

/** An owner may set any scope; a manager may not create an owner. */
function settableScopes(mine: string): typeof SCOPES {
  return mine === "owner" ? SCOPES : SCOPES.filter((s) => s.value !== "owner");
}

function InviteDialog({ roles, onClose }: { roles: AssignableRole[]; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const session = useSession();
  const canPickRole = can(session, "role.manage");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleCode, setRoleCode] = useState(roles[0]?.code ?? "");
  const [scope, setScope] = useState<MemberScope>("member");

  const invite = useMutation({
    mutationFn: () =>
      post("/members", { email: email.trim(), full_name: fullName.trim(), role_code: roleCode, scope }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["members"] });
      // Says what happened, now that a refusal is a 409 the user can read. The
      // hedged wording this replaced ("if they can be added…") existed because
      // the server answered identically whatever happened — which also meant an
      // address that already had an account reported success and did nothing.
      const sent = (res as { invited?: boolean } | undefined)?.invited !== false;
      toast(
        sent ? "Invitation sent" : "Colleague added",
        sent
          ? `${email.trim()} will get a link to set a password.`
          : `${email.trim()} already has a password and can sign in now.`,
        "success",
      );
      onClose();
    },
    onError: (e) => toast("Could not invite", e instanceof Error ? e.message : "", "critical"),
  });

  const missing = !email.trim() ? "Enter their email" : !fullName.trim() ? "Enter their name" : undefined;

  return (
    <Dialog
      title="Invite a colleague"
      sub="They receive a link to set their own password. Nobody here ever sees it."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!!missing || invite.isPending} title={missing}
            onClick={() => invite.mutate()}>
            Send invitation
          </Button>
        </>
      }
    >
      <Field label="Email" required span>
        {(id) => (
          <input id={id} type="email" className={inputCls} value={email} autoComplete="off"
            onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" />
        )}
      </Field>
      <Field label="Full name" required span>
        {(id) => (
          <input id={id} className={inputCls} value={fullName} maxLength={120}
            onChange={(e) => setFullName(e.target.value)} placeholder="Priya Raman" />
        )}
      </Field>
      {/* Hidden, not disabled, where the organisation does not hold role.manage:
          aggregator, business and sponsor may invite but not choose a role
          (db/900_seed.sql). One role fits their kind anyway, so a picker would
          offer a choice of one. */}
      {canPickRole && roles.length > 0 && (
        <Field label="Role" span hint="What they can do with the product.">
          {(id) => (
            <select id={id} className={selectCls} value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
              {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          )}
        </Field>
      )}
      <Field label="Access level" span hint={SCOPES.find((s) => s.value === scope)?.hint}>
        {(id) => (
          <select id={id} className={selectCls} value={scope}
            onChange={(e) => setScope(e.target.value as MemberScope)}>
            {settableScopes(session.scope).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </Field>
    </Dialog>
  );
}

function ChangeAccessDialog({ member, onClose }: { member: MemberRow; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const session = useSession();
  const [scope, setScope] = useState<MemberScope>(member.scope);

  const change = useMutation({
    mutationFn: () => patch(`/members/${member.user_id}`, { scope }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["members"] });
      toast("Access level changed", `${member.full_name} is now ${scopeLabel(scope).toLowerCase()}.`, "success");
      onClose();
    },
    onError: (e) => toast("Could not change access", e instanceof Error ? e.message : "", "critical"),
  });

  return (
    <Dialog
      title={`Access level for ${member.full_name}`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={scope === member.scope || change.isPending}
            onClick={() => change.mutate()}>Save</Button>
        </>
      }
    >
      <Field label="Access level" span hint={SCOPES.find((s) => s.value === scope)?.hint}>
        {(id) => (
          <select id={id} className={selectCls} value={scope}
            onChange={(e) => setScope(e.target.value as MemberScope)}>
            {settableScopes(session.scope).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </Field>
    </Dialog>
  );
}

export function UsersPage() {
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);
  const [changing, setChanging] = useState<MemberRow | null>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);

  const admin = canManagePeople(session);
  const members = useQuery({ queryKey: ["members"], queryFn: () => get<MemberRow[]>("/members") });
  const roles = useQuery({
    queryKey: ["members", "roles"],
    queryFn: () => get<AssignableRole[]>("/members/roles"),
    enabled: admin,
  });

  const resend = useMutation({
    mutationFn: (id: string) => post(`/members/${id}/resend-invitation`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["members"] });
      toast("Invitation sent again", "The previous link no longer works.", "success");
    },
    onError: (e) => toast("Could not resend", e instanceof Error ? e.message : "", "critical"),
  });

  // No onError: ReasonDialog shows the failure inline and stays open so they
  // can correct it. Toasting here as well would report the same failure twice.
  const revoke = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      post(`/members/${vars.id}/revoke`, { reason: vars.reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["members"] });
      setRemoving(null);
    },
  });

  const rows = members.data ?? [];
  // Owners who could actually sign in today. An organisation reading 0 here is
  // one password reset away from nobody being able to administer it, and
  // nothing else in the console would say so.
  const activeOwners = rows.filter((m) => m.scope === "owner" && m.invitation_status === "accepted").length;
  const pending = rows.filter((m) => m.invitation_status !== "accepted").length;

  // Always read the live row: a dialog holding a snapshot shows stale values
  // after a change, and re-saving would write them back.
  const live = (m: MemberRow) => rows.find((x) => x.user_id === m.user_id) ?? m;

  return (
    <View
      title="Manage users"
      sub={`People who can sign in to ${session.org_name}. Everyone here can use the product; the access level decides who can add and remove colleagues.`}
      actions={
        admin && (
          <Button variant="primary" onClick={() => setInviting(true)}>Invite a colleague</Button>
        )
      }
    >
      <div className="g4">
        <Metric label="People" value={rows.length} loading={members.isLoading} />
        <Metric label="Owners who can sign in" value={activeOwners} loading={members.isLoading} />
        <Metric label="Invited, not yet signed in" value={pending} loading={members.isLoading} />
      </div>

      {activeOwners === 0 && !members.isLoading && rows.length > 0 && (
        <Panel>
          <Empty
            title="No owner can sign in"
            hint="Every owner here is still on an unaccepted invitation. Resend it, or ask platform operations for help before the last active session ends."
          />
        </Panel>
      )}

      <Panel>
        <Loadable q={members} what="the people in your organisation">
          {rows.length === 0 ? (
            <Empty title="Nobody else yet" hint="Invite a colleague by email; they set their own password." />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Access</th>
                    <th>Sign-in</th><th>Added</th>{admin && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const inv = statusMeta(invitationStatus, m.invitation_status);
                    const isMe = m.user_id === session.user_id;
                    // A manager may not act on an owner; the server refuses it
                    // either way, and a button that always fails is worse than
                    // no button.
                    const mayTouch = admin && (session.scope === "owner" || m.scope !== "owner");
                    return (
                      <tr key={m.user_id}>
                        <td className="cell-primary">
                          {m.full_name}
                          {isMe && <div className="cell-meta">You</div>}
                        </td>
                        <td className="small">{m.email}</td>
                        <td>{m.role_name}</td>
                        <td><Pill tone={m.scope === "owner" ? "active" : "neutral"}>{scopeLabel(m.scope)}</Pill></td>
                        <td><Pill tone={inv.tone}>{inv.label}</Pill></td>
                        <td className="num">{fmtDate(m.granted_at)}</td>
                        {admin && (
                          <td className="right"><div className="rowactions">
                            {m.invitation_status !== "accepted" && mayTouch && (
                              <Button size="sm" disabled={resend.isPending}
                                onClick={() => resend.mutate(m.user_id)}>Resend invite</Button>
                            )}
                            {mayTouch && (
                              <Button size="sm" onClick={() => setChanging(live(m))}>Access</Button>
                            )}
                            {mayTouch && (
                              <Button size="sm" variant="danger" onClick={() => setRemoving(live(m))}>
                                Remove
                              </Button>
                            )}
                          </div></td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Loadable>
      </Panel>

      {inviting && <InviteDialog roles={roles.data ?? []} onClose={() => setInviting(false)} />}
      {changing && <ChangeAccessDialog member={live(changing)} onClose={() => setChanging(null)} />}
      {removing && (
        <ReasonDialog
          title={`Remove ${live(removing).full_name}?`}
          warning={
            <>
              They lose access to {session.org_name} immediately and any sessions they have open
              end now. An invitation they have not accepted stops working.
              {live(removing).user_id === session.user_id && " This is your own account."}
            </>
          }
          confirmLabel="Remove"
          onConfirm={(reason) => revoke.mutateAsync({ id: live(removing).user_id, reason })}
          onClose={() => setRemoving(null)}
        />
      )}
    </View>
  );
}
