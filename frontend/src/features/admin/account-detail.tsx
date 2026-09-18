// admin — one account, and the only screen that can change its lifecycle.
//
// The three lifecycle endpoints existed before this page did, which meant the
// operator held org.suspend and had no button: suspending an account was
// possible only with a terminal. Everything here is already on the server —
// GET /organisations/{id}, the three POSTs, GET /activity?scope_id= (which had
// never had a caller) and GET /invoices, whose rows already carry party_org_id.
//
// Deliberately NOT built on OrgProfileDialog. That dialog is also mounted by the
// tenant's network page and by the client's view of a bidder, and it has no slot
// to scope anything — operator actions added there would appear on both. It
// stays a counterparty view; this is the operator one. The per-kind rows are
// shared through kindRows() so the two cannot drift.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, post } from "@api/client";
import type { ActivityRow, InvoiceRow, Org } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, Panel, Pill, Skeleton, TableWrap,
  textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money } from "@shared/format";
import { kindRows } from "@shared/org-profile";
import { can } from "@shared/rbac";
import { invoiceStatus, orgStatus, statusMeta } from "@shared/status";

type Action = "suspend" | "reinstate";

// Mirrors _LIFECYCLE in modules/identity/service.py. Kept in step deliberately:
// offering a move the server will refuse turns a 409 into the operator's problem,
// and the server remains the authority either way.
//
// terminated offers nothing because nothing can reach it — there is no terminate
// route. An account that is never coming back stays suspended, which is the true
// statement: the platform switches accounts off, it does not wind them up.
const OFFERED: Record<string, Action[]> = {
  active: ["suspend"],
  suspended: ["reinstate"],
  pending_approval: ["suspend", "reinstate"],
  terminated: [],
};

const COPY: Record<Action, { verb: string; past: string; warn: string; tone: "danger" | "primary" }> = {
  suspend: {
    verb: "Suspend",
    past: "Suspended",
    warn: "Everyone in this organisation stops being able to sign in, and an open session dies at its next token refresh. Reversible — reinstating gives them their workspace back.",
    tone: "danger",
  },
  reinstate: {
    verb: "Reinstate",
    past: "Reinstated",
    warn: "The organisation becomes active again and its people can sign in. The suspension stays in the activity trail.",
    tone: "primary",
  },
};

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const session = useSession();
  const [acting, setActing] = useState<Action | null>(null);

  const org = useQuery({ queryKey: ["org", id], queryFn: () => get<Org>(`/organisations/${id}`) });
  const activity = useQuery({
    queryKey: ["activity", id],
    // scope is the audit trail's visibility key, so this is already the org's own
    // history — the endpoint has supported it since day one with no caller.
    queryFn: () => get<ActivityRow[]>(`/activity?scope_id=${id}&limit=25`),
  });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => get<InvoiceRow[]>("/invoices") });

  const o = org.data;
  const mayAct = can(session, "org.suspend");
  const offered = o ? (OFFERED[o.status] ?? []) : [];
  const meta = statusMeta(orgStatus, o?.status);
  const mine = (invoices.data ?? []).filter((i) => i.party_org_id === id);

  if (org.isLoading) {
    return <View title="Account"><Panel><Skeleton rows={6} label="Loading the account" /></Panel></View>;
  }
  if (org.isError || !o) {
    return (
      <View title="Account">
        <Panel>
          <Callout tone="critical" title="Account not available">
            {org.error instanceof Error ? org.error.message : "This organisation could not be loaded."}
          </Callout>
        </Panel>
      </View>
    );
  }

  return (
    <View
      title={o.name}
      sub={<><span className="id">{o.reference_code}</span> · {o.kind}{o.country ? ` · ${o.country}` : ""}</>}
      actions={
        <div className="rowactions">
          <Link to="/accounts" className="btn" data-size="sm">All accounts</Link>
          {mayAct && offered.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={COPY[a].tone}
              onClick={() => setActing(a)}
            >
              {COPY[a].verb}
            </Button>
          ))}
        </div>
      }
    >
      <Panel
        title="Status"
        actions={<Pill tone={meta.tone}>{meta.label}</Pill>}
      >
        {/* Not a StageRail: that component is linear, and suspended is a
            reversible detour from active rather than a step toward terminated.
            Rendering the four states in a row would read as progress. */}
        {o.status === "suspended" && (
          <Callout tone="critical" title={`Suspended${o.suspended_at ? ` on ${fmtDate(o.suspended_at)}` : ""}`}>
            {o.suspension_reason ?? "No reason was recorded."}
          </Callout>
        )}
        {o.status === "terminated" && (
          <Callout tone="neutral" title="Terminated">
            {o.suspension_reason ?? "No reason was recorded."} This is terminal; nothing in the product reverses it.
          </Callout>
        )}
        {o.status === "active" && <p className="muted small">Active. Its people can sign in and work.</p>}
        {o.status === "pending_approval" && (
          <Callout tone="attention" title="Awaiting approval">
            This organisation exists but nobody in it can sign in yet.
          </Callout>
        )}
        {!mayAct && (
          <p className="muted small" style={{ marginTop: 8 }}>
            You are viewing this account. Changing its status needs the org.suspend capability.
          </p>
        )}
      </Panel>

      <Panel title="Profile">
        <Dl
          rows={[
            ...kindRows(o),
            ["Rating", o.rating ? `★ ${o.rating}` : "—"],
            ["Billing", o.billing_status ?? "—"],
            ["Onboarded", fmtDate(o.onboarded_at ?? null)],
          ]}
        />
      </Panel>

      <Panel title="Invoices" sub="Raised against this account by the platform.">
        {invoices.isLoading ? (
          <Skeleton rows={3} label="Loading invoices" />
        ) : invoices.isError ? (
          // "No invoices" for a failed fetch states the opposite of the truth —
          // the same bug this page's own OrgTable was fixed for.
          <Callout tone="critical" title="Could not load invoices">
            {invoices.error instanceof Error ? invoices.error.message : "The request failed."}
          </Callout>
        ) : mine.length === 0 ? (
          <Empty title="No invoices" hint="Awarding a contract raises the first milestone invoice." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Kind</th><th>Amount</th><th>Issued</th><th>Status</th></tr></thead>
              <tbody>
                {mine.map((i) => {
                  const m = statusMeta(invoiceStatus, i.status);
                  return (
                    <tr key={i.id}>
                      <td className="id">{i.reference_code}</td>
                      <td>{i.kind}</td>
                      <td className="num">{money(i.amount, i.currency)}</td>
                      <td className="num">{fmtDate(i.issued_on)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Activity" sub="Everything the trail records against this organisation.">
        {activity.isLoading ? (
          <Skeleton rows={4} label="Loading this account's activity" />
        ) : activity.isError ? (
          <Callout tone="critical" title="Could not load this account's activity">
            {activity.error instanceof Error ? activity.error.message : "The request failed."}
          </Callout>
        ) : (activity.data ?? []).length === 0 ? (
          <Empty title="Nothing recorded yet" />
        ) : (
          <div className="timeline">
            {(activity.data ?? []).map((a) => (
              <div key={a.id} className="event">
                <span className="spine" aria-hidden="true" />
                <span className="dot" aria-hidden="true">·</span>
                <div>
                  <div className="what">{a.summary}</div>
                  <div className="who">
                    <span className="mono">{a.event_type}</span>
                    <span>{fmtDateTime(a.occurred_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {acting && <LifecycleDialog org={o} action={acting} onClose={() => setActing(null)} />}
    </View>
  );
}

function LifecycleDialog({ org, action, onClose }: { org: Org; action: Action; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const copy = COPY[action];

  const run = useMutation({
    mutationFn: () => post(`/organisations/${org.id}/${action}`, { reason: reason.trim() }),
    onSuccess: () => {
      // ["orgs"] is a prefix and catches both Accounts lists; the singular
      // ["org", id] is this page, and the trail gains an event either way.
      void qc.invalidateQueries({ queryKey: ["orgs"] });
      void qc.invalidateQueries({ queryKey: ["org", org.id] });
      void qc.invalidateQueries({ queryKey: ["activity", org.id] });
      void qc.invalidateQueries({ queryKey: ["activity-all"] });
      // copy.past, not verb + "d" — that produced "Suspendd".
      toast(copy.past, `${org.name} is now ${action === "reinstate" ? "active" : "suspended"}.`,
        action === "reinstate" ? "success" : "neutral");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : `Could not ${action} this account`),
  });

  return (
    <Dialog
      title={`${copy.verb} ${org.name}`}
      sub={<span className="id">{org.reference_code}</span>}
      onClose={onClose}
      busy={run.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={copy.tone}
            disabled={run.isPending}
            onClick={() => {
              // The server requires three characters; catching it here means the
              // operator is told by the form rather than by a 422.
              if (reason.trim().length < 3) {
                return setError("Give a reason — at least a few words, and it goes on the record.");
              }
              run.mutate();
            }}
          >
            {copy.verb}
          </Button>
        </>
      }
    >
      <Callout tone={action === "reinstate" ? "attention" : "critical"} title="What this does">
        {copy.warn}
      </Callout>

      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Reason" required span hint="Recorded on the activity trail, and shown on the account.">
          {(id) => (
            <textarea id={id} className={textareaCls} rows={2} value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }} />
          )}
        </Field>
      </div>

      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
