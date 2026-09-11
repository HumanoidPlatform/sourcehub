// Per-persona overview — the landing view, composed from each feature's data.
// Lives in app/ because it is composition, not a module of its own.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { Contract, EquipmentRow, Gate1Row, LoanRow, Proposal, QaQueueRow, Rfp, Task, WorkerRow } from "@api/types";
import { Empty, Meter, Metric, Panel, Pill, Skeleton, TableWrap, View } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, money } from "@shared/format";
import { contractStatus, requestStatus, statusMeta, taskStatus, waitingOn } from "@shared/status";
import { AccountsPage } from "@features/admin/pages";
import { WorkerAssignmentsPage } from "@features/delivery/pages";

export function OverviewPage() {
  const { role } = useSession();
  if (role === "platform_admin") return <AccountsPage />;
  if (role === "client") return <ClientOverview />;
  if (role === "tenant") return <TenantOverview />;
  if (role === "sponsor") return <SponsorOverview />;
  if (role === "worker") return <WorkerAssignmentsPage />;
  return <SupplierOverview />;
}

function ClientOverview() {
  const session = useSession();
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => get<Rfp[]>("/requests") });
  const contracts = useQuery({ queryKey: ["contracts"], queryFn: () => get<Contract[]>("/contracts") });

  const rs = requests.data ?? [];
  const cs = contracts.data ?? [];
  const open = rs.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
  const waiting = rs.filter((r) => statusMeta(requestStatus, r.status).owner === "client").length;
  const inDelivery = cs.filter((c) => c.status !== "completed").length;
  const committed = cs.reduce((s, c) => s + Number(c.value), 0);

  return (
    <View title={`Good day, ${session.org_name}`} sub="What needs you, and where everything stands.">
      <div className="g4">
        <Metric label="Open requests" value={open} />
        <Metric label="Awaiting your decision" value={waiting} />
        <Metric label="In delivery" value={inDelivery} />
        <Metric label="Committed spend" value={money(committed)} />
      </div>
      <Panel title="Recent requests" actions={<Link className="btn" data-size="sm" to="/requests">All requests</Link>}>
        {requests.isLoading ? (
          // The metrics above read 0 while loading too, but they settle in
          // place. This panel used to tell a returning client to "Publish your
          // first request" every time they landed.
          <Skeleton rows={4} label="Loading your requests" />
        ) : rs.length === 0 ? (
          <Empty
            title="Publish your first request"
            hint="Describe what you need captured and every delivery partner can bid on it."
            action={<Link to="/requests/new" className="btn" data-variant="primary">New request</Link>}
          />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Title</th><th>Status</th><th>Waiting on</th><th>Proposals</th></tr></thead>
              <tbody>
                {rs.slice(0, 5).map((r) => {
                  const m = statusMeta(requestStatus, r.status);
                  return (
                    <tr key={r.id}>
                      <td className="id"><Link to={`/requests/${r.id}`}>{r.reference_code}</Link></td>
                      <td className="cell-primary">{r.title}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td>{waitingOn(m, "client")}</td>
                      <td className="num">{r.proposal_count}</td>
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
    <View title={`Good day, ${session.org_name}`} sub="Bids, contracts and the QA queue at a glance.">
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
    <View title={`Good day, ${session.org_name}`} sub="Your assignments and the gear to do them with.">
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
                      <td>{t.target ?? "—"}</td>
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

  const eq = equipment.data ?? [];
  const pending = (loans.data ?? []).filter((l) => l.status === "pending").length;
  const deployed = eq.reduce((s, e) => s + e.units_on_loan, 0);

  return (
    <View title={`Good day, ${session.org_name}`} sub="Your fleet, and who is asking for it.">
      <div className="g4">
        <Metric label="Equipment types" value={eq.length} />
        <Metric label="Total units" value={eq.reduce((s, e) => s + e.total_units, 0)} />
        <Metric label="Units deployed" value={deployed} />
        <Metric label="Awaiting your decision" value={pending} />
      </div>
      {pending > 0 && (
        <Panel>
          <Empty
            title={`${pending} request${pending === 1 ? " is" : "s are"} waiting on you`}
            action={<Link to="/loans" className="btn" data-variant="primary">Review requests</Link>}
          />
        </Panel>
      )}
    </View>
  );
}
