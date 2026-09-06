// admin — the Ops console: accounts and the platform activity trail.
// (Billing reuses the ledger feature; onboarding has its own.)

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { get } from "@api/client";
import type { ActivityRow, Org } from "@api/types";
import { Button, Empty, Metric, Panel, Pill, TableWrap, View } from "@ds/primitives";
import { fmtDateTime } from "@shared/format";
import { OrgProfileDialog } from "@shared/org-profile";
import { orgStatus, statusMeta } from "@shared/status";

export function AccountsPage() {
  const clients = useQuery({ queryKey: ["orgs", "client"], queryFn: () => get<Org[]>("/organisations?kind=client") });
  const tenants = useQuery({ queryKey: ["orgs", "tenant"], queryFn: () => get<Org[]>("/organisations?kind=tenant") });
  const aggs = useQuery({ queryKey: ["orgs", "aggregator"], queryFn: () => get<Org[]>("/organisations?kind=aggregator") });
  const bizs = useQuery({ queryKey: ["orgs", "business"], queryFn: () => get<Org[]>("/organisations?kind=business") });
  const sponsors = useQuery({ queryKey: ["orgs", "sponsor"], queryFn: () => get<Org[]>("/organisations?kind=sponsor") });

  const networkCount = (aggs.data?.length ?? 0) + (bizs.data?.length ?? 0) + (sponsors.data?.length ?? 0);

  return (
    <View
      title="Accounts"
      sub="The platform registers and bills clients and delivery partners only; the sub-network belongs to each partner."
    >
      <div className="g3">
        <Metric label="Clients" value={clients.data?.length ?? "…"} />
        <Metric label="Delivery partners" value={tenants.data?.length ?? "…"} />
        <Metric label="Sub-network entities" value={networkCount} sub="aggregators · businesses · sponsors" />
      </div>

      <Panel title="Clients">
        <OrgTable rows={clients.data ?? []} cols={[
          ["Industry", (o) => (o.profile.industry as string) ?? "—"],
          ["Country", (o) => o.country ?? "—"],
          ["Plan", (o) => (o.profile.plan as string) ?? "—"],
          ["Residency", (o) => o.residency_region ?? "—"],
        ]} />
      </Panel>

      <Panel title="Delivery partners">
        <OrgTable rows={tenants.data ?? []} cols={[
          ["HQ", (o) => (o.profile.hq as string) ?? "—"],
          ["Plan", (o) => (o.profile.plan as string) ?? "—"],
          ["On-time", (o) => (o.profile.on_time_rate != null ? `${o.profile.on_time_rate}%` : "—")],
          ["QA pass", (o) => (o.profile.qa_pass_rate != null ? `${o.profile.qa_pass_rate}%` : "—")],
        ]} />
      </Panel>
    </View>
  );
}

function OrgTable({ rows, cols }: { rows: Org[]; cols: [string, (o: Org) => React.ReactNode][] }) {
  const [viewing, setViewing] = useState<Org | null>(null);
  if (rows.length === 0) return <Empty title="None yet" />;
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
              <tr key={o.id} className="tap" onClick={() => setViewing(o)}>
                <td className="id">{o.reference_code}</td>
                <td className="cell-primary">{o.name}</td>
                {cols.map(([h, f]) => <td key={h}>{f(o)}</td>)}
                <td className="num">{o.rating ?? "—"}</td>
                <td>{o.billing_status ?? "—"}</td>
                <td><Pill tone={m.tone}>{m.label}</Pill></td>
                <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                  <Button size="sm" onClick={() => setViewing(o)}>Details</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {viewing && <OrgProfileDialog orgId={viewing.id} seedName={viewing.name} onClose={() => setViewing(null)} />}
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
        {(activity.data ?? []).length === 0 ? (
          <Empty title="Quiet so far" />
        ) : (
          <div className="timeline">
            {(activity.data ?? []).map((a) => (
              <div key={a.id} className="event">
                <div>{a.summary}</div>
                <div className="cell-meta">
                  <span className="mono">{a.event_type}</span> · {fmtDateTime(a.occurred_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </View>
  );
}
