// admin — the Ops console: accounts and the platform activity trail.
// (Billing reuses the ledger feature; onboarding has its own.)

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { get } from "@api/client";
import type { ActivityRow, Org } from "@api/types";
import {
  Callout, DataTable, Empty, Metric, Panel, Pill, Skeleton, View, type Column,
} from "@ds/primitives";
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
          profileCol("Industry", "industry"),
          { header: "Country", cell: (o) => o.country ?? "—", sortBy: (o) => o.country },
          profileCol("Plan", "plan"),
          { header: "Residency", cell: (o) => o.residency_region ?? "—", sortBy: (o) => o.residency_region },
        ]} />
      </Panel>

      <Panel title="Delivery partners">
        <OrgTable q={tenants} noun="delivery partner" cols={[
          profileCol("HQ", "hq"),
          profileCol("Plan", "plan"),
          rateCol("On-time", "on_time_rate"),
          rateCol("QA pass", "qa_pass_rate"),
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
  cols: Column<Org>[];
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
    <DataTable
      rows={rows}
      rowKey={(o) => o.id}
      filter={{
        label: `Filter ${noun}s`,
        placeholder: "Filter by name or reference…",
        text: (o) => `${o.name} ${o.reference_code}`,
      }}
      // The row leads to /accounts/:id rather than a modal: it is where the
      // lifecycle actions live, and unlike a dialog it can be linked to,
      // bookmarked and reloaded.
      rowProps={(o) => ({ className: "tap", onClick: () => nav(`/accounts/${o.id}`) })}
      columns={[
        { header: "Reference", cell: (o) => o.reference_code, sortBy: (o) => o.reference_code, className: "id" },
        {
          header: "Name",
          sortBy: (o) => o.name,
          className: "cell-primary",
          cell: (o) => (
            <>
              {o.name}
              {/* written at suspension, returned to nobody until now */}
              {o.suspension_reason && <div className="cell-meta">{o.suspension_reason}</div>}
            </>
          ),
        },
        ...cols,
        { header: "Rating", cell: (o) => o.rating ?? "—", sortBy: (o) => num(o.rating), className: "num" },
        { header: "Billing", cell: (o) => o.billing_status ?? "—", sortBy: (o) => o.billing_status },
        {
          header: "Status",
          sortBy: (o) => statusMeta(orgStatus, o.status).label,
          cell: (o) => {
            const m = statusMeta(orgStatus, o.status);
            return <Pill tone={m.tone}>{m.label}</Pill>;
          },
        },
        {
          header: "Actions",
          hideHeader: true,
          className: "right",
          // stopPropagation: the row's own click would navigate a second time
          cell: (o) => (
            <div className="rowactions" onClick={(e) => e.stopPropagation()}>
              <Link to={`/accounts/${o.id}`} className="btn" data-size="sm">Open</Link>
            </div>
          ),
        },
      ]}
    />
  );
}

/** A text field from the organisation's profile, as a sortable column. */
function profileCol(header: string, field: string): Column<Org> {
  const value = (o: Org) => (o.profile[field] as string | undefined) ?? null;
  return { header, cell: (o) => value(o) ?? "—", sortBy: value };
}

/** A percentage from the profile, drawn as a meter and sorted as a number. */
function rateCol(header: string, field: string): Column<Org> {
  const value = (o: Org) => (o.profile[field] as number | null | undefined) ?? null;
  return { header, cell: (o) => rate(value(o)), sortBy: value };
}

const num = (v: string | null) => (v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

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
