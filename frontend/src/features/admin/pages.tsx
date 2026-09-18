// admin — the Ops console: accounts and the platform activity trail.
// (Billing reuses the ledger feature; onboarding has its own.)

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { get } from "@api/client";
import type { ActivityRow, Org } from "@api/types";
import { Callout, Empty, Metric, Panel, Pill, Skeleton, TableWrap, View } from "@ds/primitives";
import { fmtDateTime } from "@shared/format";
import { rate } from "@shared/org-profile";
import { orgStatus, statusMeta } from "@shared/status";

// status_filter=any, because the point of an operator console is to show the
// accounts that need attention, and a suspended one needs it most. The endpoint
// defaults to active — which is right for a tenant's network page and wrong
// here: suspending an account used to remove it from the only screen that could
// have reinstated it.
const ALL_STATES = "&status_filter=any";

export function AccountsPage() {
  const clients = useQuery({
    queryKey: ["orgs", "client", "any"],
    queryFn: () => get<Org[]>(`/organisations?kind=client${ALL_STATES}`),
  });
  const tenants = useQuery({
    queryKey: ["orgs", "tenant", "any"],
    queryFn: () => get<Org[]>(`/organisations?kind=tenant${ALL_STATES}`),
  });

  // The sub-network used to be three more full list fetches, summed into one
  // number and otherwise discarded — three round trips for a count with no
  // table, no drill-down and nothing else to show for them.
  const live = (q: UseQueryResult<Org[]>) => q.data?.filter((o) => o.status === "active").length;
  const needsEye = [...(clients.data ?? []), ...(tenants.data ?? [])]
    .filter((o) => o.status !== "active").length;

  return (
    <View
      title="Accounts"
      sub="The platform registers and bills clients and delivery partners only; the sub-network belongs to each partner."
    >
      <div className="g3">
        <Metric label="Clients" value={live(clients) ?? "…"} />
        <Metric label="Delivery partners" value={live(tenants) ?? "…"} />
        <Metric
          label="Not active"
          value={clients.isLoading || tenants.isLoading ? "…" : needsEye}
          sub="suspended · terminated · awaiting approval"
        />
      </div>

      <Panel title="Clients">
        <OrgTable q={clients} noun="client" cols={[
          ["Industry", (o) => (o.profile.industry as string) ?? "—"],
          ["Country", (o) => o.country ?? "—"],
          ["Plan", (o) => (o.profile.plan as string) ?? "—"],
          ["Residency", (o) => o.residency_region ?? "—"],
        ]} />
      </Panel>

      <Panel title="Delivery partners">
        <OrgTable q={tenants} noun="delivery partner" cols={[
          ["HQ", (o) => (o.profile.hq as string) ?? "—"],
          ["Plan", (o) => (o.profile.plan as string) ?? "—"],
          ["On-time", (o) => rate(o.profile.on_time_rate as number | null)],
          ["QA pass", (o) => rate(o.profile.qa_pass_rate as number | null)],
        ]} />
      </Panel>
    </View>
  );
}

function OrgTable({
  q, noun, cols,
}: {
  q: UseQueryResult<Org[]>;
  noun: string;
  cols: [string, (o: Org) => React.ReactNode][];
}) {
  const nav = useNavigate();

  // Loading and failing are not the same as empty, and this table said "None
  // yet" to all three — the bug app/overview.tsx already carries a comment
  // about having fixed for the client's request list.
  if (q.isLoading) return <Skeleton rows={4} label={`Loading ${noun}s`} />;
  if (q.isError) {
    return (
      <Callout tone="critical" title={`Could not load ${noun}s`}>
        {q.error instanceof Error ? q.error.message : "The request failed."}
      </Callout>
    );
  }

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return <Empty title={`No ${noun}s yet`} hint={`Onboarding a ${noun} from the Onboarding queue puts it here.`} />;
  }

  return (
    <TableWrap>
      <table>
        <thead>
          <tr>
            <th>Reference</th><th>Name</th>
            {cols.map(([h]) => <th key={h}>{h}</th>)}
            <th>Rating</th><th>Billing</th><th>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const m = statusMeta(orgStatus, o.status);
            return (
              // The row leads to /accounts/:id rather than a modal: it is where
              // the lifecycle actions live, and unlike a dialog it can be linked
              // to, bookmarked and reloaded.
              <tr key={o.id} className="tap" onClick={() => nav(`/accounts/${o.id}`)}>
                <td className="id">{o.reference_code}</td>
                <td className="cell-primary">
                  {o.name}
                  {/* written at suspension, returned to nobody until now */}
                  {o.suspension_reason && <div className="cell-meta">{o.suspension_reason}</div>}
                </td>
                {cols.map(([h, f]) => <td key={h}>{f(o)}</td>)}
                <td className="num">{o.rating ?? "—"}</td>
                <td>{o.billing_status ?? "—"}</td>
                <td><Pill tone={m.tone}>{m.label}</Pill></td>
                <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                  <Link to={`/accounts/${o.id}`} className="btn" data-size="sm">Open</Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function ActivityPage() {
  const activity = useQuery({
    queryKey: ["activity-all"],
    queryFn: () => get<ActivityRow[]>("/activity?limit=40"),
    refetchInterval: 15_000,
  });
  return (
    <View title="Activity" sub="The hash-chained audit trail. Append-only; tampering is detectable, not merely discouraged.">
      <Panel>
        {activity.isLoading ? (
          <Skeleton rows={6} label="Loading the activity trail" />
        ) : activity.isError ? (
          <Callout tone="critical" title="Could not load the activity trail">
            {activity.error instanceof Error ? activity.error.message : "The request failed."}
          </Callout>
        ) : (activity.data ?? []).length === 0 ? (
          <Empty title="Quiet so far" hint="Every approval, award, QA verdict and payment appears here as it happens." />
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
    </View>
  );
}
