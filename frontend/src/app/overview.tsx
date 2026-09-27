// Per-persona overview — the landing view, composed from each feature's data.
// Lives in app/ because it is composition, not a module of its own.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { ActivityRow, Contract, EquipmentRow, Gate1Row, LoanRow, Proposal, QaQueueRow, Rfp, Task, WorkerRow } from "@api/types";
import { Empty, Loadable, Meter, Metric, Panel, Pill, TableWrap, View } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtAgo, fmtDate, taskTarget } from "@shared/format";
import { contractStatus, statusMeta, taskStatus } from "@shared/status";
import { AccountsPage } from "@features/admin/pages";
import { WorkerAssignmentsPage } from "@features/delivery/pages";
import { ClientOverview } from "@features/overview/client";

const SPONSOR_ACTIVITY_TYPES = new Set([
  "equipment.added",
  "equipment.status",
  "loan.requested",
  "loan.state_changed",
]);

export function OverviewPage() {
  const { role } = useSession();
  if (role === "platform_admin") return <AccountsPage />;
  if (role === "client") return <ClientOverview />;
  if (role === "tenant") return <TenantOverview />;
  if (role === "sponsor") return <SponsorOverview />;
  if (role === "worker") return <WorkerAssignmentsPage />;
  return <SupplierOverview />;
}

function TenantOverview() {
  const session = useSession();
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => get<Rfp[]>("/opportunities") });
  const mine = useQuery({ queryKey: ["proposals-mine"], queryFn: () => get<Proposal[]>("/proposals/mine") });
  const contracts = useQuery({ queryKey: ["contracts"], queryFn: () => get<Contract[]>("/contracts") });
  const queue = useQuery({ queryKey: ["qa-queue"], queryFn: () => get<QaQueueRow[]>("/qa/queue") });

  const ps = mine.data ?? [];
  const won = ps.filter((p) => p.status === "accepted").length;
  const winRate = ps.length ? Math.round((100 * won) / ps.length) : 0;
  const active = (contracts.data ?? []).filter((c) => c.status !== "completed");
  const ready = active.filter((c) => c.progress.deliverable).length;

  return (
    <View title={`Good day, ${session.org_name}`} pageTitle="Overview" sub="Bids, contracts and the QA queue at a glance.">
      <div className="g4">
        <Metric label="Open opportunities" value={opps.data?.length ?? "…"} />
        <Metric label="Win rate" value={`${winRate}%`} sub={`${won} of ${ps.length} proposals`} />
        <Metric label="QA awaiting review" value={queue.data?.length ?? "…"} />
        <Metric label="Ready to deliver" value={ready} />
      </div>
      {active.map((c) => (
        <Panel key={c.id} title={<Link to={`/contracts/${c.id}`}>{c.title ?? c.reference_code}</Link>} sub={`${c.reference_code} · ${c.client_name}`}
          actions={<Pill tone={statusMeta(contractStatus, c.status).tone}>{statusMeta(contractStatus, c.status).label}</Pill>}>
          <Meter pct={c.progress.pct} tone={c.progress.pct === 100 ? "success" : undefined} />
          <div className="small muted" style={{ marginTop: 6 }}>
            {c.progress.done} of {c.progress.total} tasks cleared · due {fmtDate(c.delivery_due_on)}
          </div>
        </Panel>
      ))}
      {active.length === 0 && (
        <Panel><Empty title="No active contracts" hint="Propose on an opportunity to win one." action={<Link to="/opportunities" className="btn" data-variant="primary">Opportunities</Link>} /></Panel>
      )}
    </View>
  );
}

function SupplierOverview() {
  const session = useSession();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<Task[]>("/tasks") });
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });
  const workers = useQuery({
    queryKey: ["workers"],
    queryFn: () => get<WorkerRow[]>("/network/workers"),
    enabled: session.org_kind === "aggregator",
  });
  const gate1 = useQuery({
    queryKey: ["gate1"],
    queryFn: () => get<Gate1Row[]>("/qa/gate1"),
    enabled: session.org_kind === "aggregator",
  });

  const ts = tasks.data ?? [];
  const openTasks = ts.filter((t) => !["qa_passed", "cancelled"].includes(t.status));
  const sentBack = ts.filter((t) => t.status === "qa_failed").length;

  return (
    <View title={`Good day, ${session.org_name}`} pageTitle="Overview" sub="Your assignments and the gear to do them with.">
      <div className="g4">
        <Metric label="Open tasks" value={openTasks.length} />
        <Metric label="Sent back for rework" value={sentBack} />
        {session.org_kind === "aggregator" ? (
          <>
            <Metric label="Awaiting your review" value={gate1.data?.length ?? "…"} sub={<Link to="/review">Gate 1 queue</Link>} />
            <Metric label="Crowd on shift" value={(workers.data ?? []).filter((w) => w.status === "on_shift").length} />
          </>
        ) : (
          <>
            <Metric label="Equipment on loan" value={(loans.data ?? []).filter((l) => ["approved", "issued"].includes(l.status)).length} />
            <Metric label="All-time tasks" value={ts.length} />
          </>
        )}
      </div>
      <Panel title="Work queue" actions={<Link className="btn" data-size="sm" to="/tasks">Open tasks</Link>}>
        {openTasks.length === 0 ? (
          <Empty title="Nothing assigned right now" />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Task</th><th>Target</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {openTasks.slice(0, 5).map((t) => {
                  const m = statusMeta(taskStatus, t.status);
                  return (
                    <tr key={t.id}>
                      <td className="cell-primary">{t.title}</td>
                      <td>{taskTarget(t)}</td>
                      <td className="num">{fmtDate(t.due_on)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </View>
  );
}

function SponsorOverview() {
  const session = useSession();
  const equipment = useQuery({ queryKey: ["equipment"], queryFn: () => get<EquipmentRow[]>("/network/equipment") });
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });
  const activity = useQuery({
    queryKey: ["activity", "sponsor-overview"],
    queryFn: () => get<ActivityRow[]>("/activity?limit=12"),
  });

  const eq = equipment.data ?? [];
  const recentActivity = (activity.data ?? [])
    .filter((e) => SPONSOR_ACTIVITY_TYPES.has(e.event_type))
    .slice(0, 6);
  const totalUnits = eq.reduce((s, e) => s + e.total_units, 0);
  const availableUnits = eq.reduce((s, e) => s + e.units_available, 0);
  const deployedUnits = eq.reduce((s, e) => s + e.units_on_loan, 0);
  const maintenanceUnits = eq
    .filter((e) => e.status === "maintenance")
    .reduce((s, e) => s + e.total_units, 0);
  const today = new Date().toISOString().slice(0, 10);
  const expiringSoon = new Date();
  expiringSoon.setDate(expiringSoon.getDate() + 30);
  const expiringBy = expiringSoon.toISOString().slice(0, 10);
  const calibrationDueUnits = eq
    .filter((e) => e.calibration_expires_on !== null && e.calibration_expires_on <= today)
    .reduce((s, e) => s + e.total_units, 0);
  const calibrationExpiringUnits = eq
    .filter((e) => e.calibration_expires_on !== null && e.calibration_expires_on > today && e.calibration_expires_on <= expiringBy)
    .reduce((s, e) => s + e.total_units, 0);
  const utilization = totalUnits ? Math.round((100 * deployedUnits) / totalUnits) : 0;
  const pendingRequests = (loans.data ?? []).filter((l) => l.status === "pending").length;
  const overdueEquipment = (loans.data ?? [])
    .filter((l) => l.status === "overdue")
    .reduce((s, l) => s + l.units, 0);

  return (
    <View title={`Good day, ${session.org_name}`} pageTitle="Overview" sub="Manage Equipment Availability, Deployment and Requests">
      <div className="g4">
        <Metric label="Total Units" value={totalUnits} />
        <Metric label="Available Units" value={availableUnits} />
        <Metric label="Units Deployed" value={deployedUnits} />
        <Metric label="Pending Requests" value={pendingRequests} />
      </div>
      <Panel title="Fleet Status">
        <div className="g4">
          <Metric label="Available" value={availableUnits} />
          <Metric label="In Use" value={deployedUnits} />
          <Metric label="Maintenance" value={maintenanceUnits} />
          <Metric label="Calibration Due" value={calibrationDueUnits} />
          <Metric label="Utilization %" value={`${utilization}%`} />
        </div>
      </Panel>
      <Panel title="Action Required">
        <div className="g4">
          <Metric label="Pending Requests" value={pendingRequests} />
          <Metric label="Overdue Equipment" value={overdueEquipment} />
          <Metric label="Calibration Expiring" value={calibrationExpiringUnits} />
          <Metric label="Maintenance Required" value={maintenanceUnits} />
        </div>
      </Panel>
      <Panel
        title="Recent Activity"
        sub="Equipment issued or returned, approvals, rejections, status and calibration updates."
      >
        <Loadable q={activity} what="recent activity" rows={4}>
          {recentActivity.length === 0 ? (
            <Empty title="No recent fleet activity" />
          ) : (
            <div className="timeline">
              {recentActivity.map((e) => (
                <div key={e.id} className="event">
                  <span className="spine" aria-hidden="true" />
                  <span className="dot" aria-hidden="true">·</span>
                  <div>
                    <div className="what">{e.summary}</div>
                    <div className="who">
                      <span>{sponsorActivityLabel(e)}</span>
                      <span>{fmtAgo(e.occurred_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Loadable>
      </Panel>
      {pendingRequests > 0 && (
        <Panel>
          <Empty
            title={`${pendingRequests} request${pendingRequests === 1 ? " is" : "s are"} waiting on you`}
            action={<Link to="/loans" className="btn" data-variant="primary">Review requests</Link>}
          />
        </Panel>
      )}
    </View>
  );
}

function sponsorActivityLabel(e: ActivityRow): string {
  if (e.event_type === "equipment.added") return "Equipment added";
  if (e.event_type === "equipment.status") return "Status change";
  if (e.event_type === "loan.requested") return "Request received";
  if (e.summary.includes("marked returned")) return "Equipment returned";
  if (e.summary.includes("approved")) return "Approved";
  if (e.summary.includes("rejected")) return "Rejected";
  return "Fleet update";
}
