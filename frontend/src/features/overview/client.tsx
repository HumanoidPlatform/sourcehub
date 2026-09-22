// The client's landing page.
//
// What it is for: a client signs in wanting to know what needs them, how the
// work they have already paid for is going, and what it is costing. Those are
// three questions, so this is three bands, not a wall of numbers.
//
// Every figure here comes from GET /overview, which aggregates in SQL under
// the caller's own RLS context. It replaced deriving the same numbers from
// two full list payloads in the browser — which is also how the old page came
// to show "Committed spend" as the sum of EVERY contract ever signed,
// including finished ones, while Billing showed something different under a
// word that sounded the same.
//
// What is deliberately absent: partner on-time and QA pass rates. Those
// columns exist and read 96% / 94%, and nothing in the platform computes
// them — they are demo seed values. A tile is a claim, and that one would be
// false.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { ActivityRow, Overview, OverviewAttention, OverviewDelivery } from "@api/types";
import {
  Empty,
  fillDays,
  Loadable,
  Meter,
  Metric,
  Panel,
  Pill,
  TimeBars,
  View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtAgo, fmtDate, money } from "@shared/format";
import { contractStatus, requestStatus, statusMeta } from "@shared/status";

/** Stages worth a row of their own, in the order work moves through them.
 *  `cancelled` is left out until there is one — an always-zero row is noise. */
const STAGES = ["draft", "published", "proposals_received", "in_progress", "delivered", "completed"] as const;

/** Due within a week and not finished. A rule of thumb shown as a word, not a
 *  metric: the platform has no SLA field and no notion of lateness, so
 *  anything dressed up as a computed risk score would be invented. */
const AT_RISK_DAYS = 7;

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  if (Number.isNaN(then)) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((then - today) / 86_400_000);
}

function atRisk(d: OverviewDelivery): boolean {
  if (d.pct >= 100 || d.status === "completed") return false;
  const left = daysUntil(d.delivery_due_on);
  return left !== null && left <= AT_RISK_DAYS;
}

export function ClientOverview() {
  const session = useSession();
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => get<Overview>("/overview") });
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: () => get<ActivityRow[]>("/activity?limit=8"),
  });

  const d = overview.data;
  const live = (d?.deliveries ?? []).filter((x) => x.status !== "completed");
  const needs = d?.attention.length ?? 0;

  return (
    <View
      title={`Good day, ${session.org_name}`}
      pageTitle="Overview"
      sub="What needs you, and where everything stands."
      actions={<Link to="/requests/new" className="btn" data-variant="primary">New RFP</Link>}
    >
      <div className="g4">
        <Metric
          label="Needs you"
          value={needs}
          tone={needs > 0 ? "attention" : undefined}
          loading={overview.isLoading}
          foot={needs > 0 ? "nothing moves until you act" : "nothing waiting"}
        />
        <Metric
          label="Deliverables for Review"
          value={d?.delivery.live ?? 0}
          loading={overview.isLoading}
          foot={
            d && d.delivery.tasks_total > 0
              ? `${d.delivery.pct}% of ${d.delivery.tasks_total} tasks cleared QA`
              : "no tasks assigned yet"
          }
        />
        <Metric
          label="Captures accepted"
          value={d?.captures.accepted ?? 0}
          loading={overview.isLoading}
          foot={`across ${d?.deliveries.length ?? 0} contract${d?.deliveries.length === 1 ? "" : "s"}`}
        />
        <Metric
          label="Committed"
          value={money(d?.money.committed ?? 0, d?.money.currency)}
          loading={overview.isLoading}
          foot={
            d
              ? `${money(d.money.paid, d.money.currency)} paid · ${money(d.money.outstanding, d.money.currency)} outstanding`
              : undefined
          }
        />
      </div>

      <div className="g-main">
        <Panel
          title="Deliverables for Review"
          sub="Tasks that have cleared the partner's QA gate"
          actions={<Link className="btn" data-size="sm" to="/deliveries">All deliverables</Link>}
        >
          <Loadable q={overview} what="your deliverables for review">
            {live.length === 0 ? (
              <Empty
                title="No deliverables for review yet"
                hint="Award a proposal and the work appears here as it is done."
                action={<Link to="/requests" className="btn" data-variant="primary">Your RFPs</Link>}
              />
            ) : (
              <div className="stagelist">
                {live.map((c) => <DeliveryRow key={c.contract_id} c={c} />)}
              </div>
            )}
          </Loadable>
        </Panel>

        <Panel title="Waiting on you">
          <Loadable q={overview} what="your queue" rows={3}>
            {needs === 0 ? (
              <Empty title="Nothing needs you" hint="Every RFP and deliverable is with someone else." />
            ) : (
              <div className="stagelist">
                {d!.attention.map((a) => <AttentionRow key={`${a.kind}:${a.entity_id}`} a={a} />)}
              </div>
            )}
          </Loadable>
        </Panel>
      </div>

      <div className="g-main">
        <Panel
          title="Captures per day"
          sub={d ? `Accepted and in progress, last ${d.captures.days} days` : undefined}
        >
          <Loadable q={overview} what="capture history" rows={3}>
            <TimeBars
              data={fillDays(d?.captures.series ?? [], d?.captures.days ?? 30)}
              unit="captures"
            />
          </Loadable>
        </Panel>

        <Panel
          title="RFPs by stage"
          actions={<Link className="btn" data-size="sm" to="/requests">All RFPs</Link>}
        >
          <Loadable q={overview} what="your RFPs" rows={3}>
            {(d?.requests.total ?? 0) === 0 ? (
              <Empty
                title="No RFPs yet"
                hint="Describe what you need captured and every delivery partner can bid on it."
                action={<Link to="/requests/new" className="btn" data-variant="primary">New RFP</Link>}
              />
            ) : (
              <StageList counts={d!.requests.by_status} total={d!.requests.total} />
            )}
          </Loadable>
        </Panel>
      </div>

      <Panel
        title="Recent activity"
        sub="RFPs, bids and contracts. Day-to-day capture work sits with the delivery partner."
        actions={<Link className="btn" data-size="sm" to="/notifications">Notifications</Link>}
      >
        <Loadable q={activity} what="recent activity" rows={4}>
          {(activity.data ?? []).length === 0 ? (
            <Empty title="Nothing has happened yet" />
          ) : (
            <div className="timeline">
              {(activity.data ?? []).map((e) => (
                // .event is a 22px dot column plus content — without the dot
                // the summary lands in the 22px track, one word per line.
                <div key={e.id} className="event">
                  <span className="spine" aria-hidden="true" />
                  <span className="dot" aria-hidden="true">·</span>
                  <div>
                    <div className="what">{e.summary}</div>
                    <div className="who">{fmtAgo(e.occurred_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Loadable>
      </Panel>
    </View>
  );
}

function DeliveryRow({ c }: { c: OverviewDelivery }) {
  const m = statusMeta(contractStatus, c.status);
  const left = daysUntil(c.delivery_due_on);
  const risk = atRisk(c);
  // Past its date is not "due soon" — say which it is, or say neither.
  const flag = !risk ? null : left !== null && left < 0 ? "Overdue" : "Due soon";
  return (
    <div className="delivrow">
      <div className="delivrow-head">
        <span>
          <Link to={`/deliveries/${c.contract_id}`} className="id">{c.reference_code}</Link>{" "}
          <span className="muted small">{c.partner_name}</span>
        </span>
        <span className="row tight" style={{ gap: "var(--s-2)" }}>
          {flag && <Pill tone={flag === "Overdue" ? "critical" : "attention"}>{flag}</Pill>}
          <Pill tone={m.tone}>{m.label}</Pill>
        </span>
      </div>
      <Meter pct={c.pct} tone={c.pct === 100 ? "success" : risk ? "attention" : undefined} />
      <div className="small muted">
        <span className="num">{c.pct}%</span> · {c.done} of {c.total} task{c.total === 1 ? "" : "s"} cleared ·{" "}
        {c.delivery_due_on
          ? `due ${fmtDate(c.delivery_due_on)}${left !== null && left < 0 ? ` (${-left} day${left === -1 ? "" : "s"} ago)` : ""}`
          : "no delivery date set"}
      </div>
    </div>
  );
}

/** The wording and the destination live here, not in the API: the server sends
 *  facts (kind, reference, count) and the console decides how to ask. */
function AttentionRow({ a }: { a: OverviewAttention }) {
  const copy: Record<OverviewAttention["kind"], { say: string; cta: string; to: string }> = {
    publish_draft: {
      say: `${a.reference_code} is still a draft`,
      cta: "Publish",
      to: `/requests/${a.entity_id}`,
    },
    review_proposals: {
      say: `${a.count} proposal${a.count === 1 ? "" : "s"} in on ${a.reference_code}`,
      cta: "Review",
      to: `/requests/${a.entity_id}`,
    },
    approve_delivery: {
      say: `${a.reference_code} is delivered and waiting for your approval`,
      cta: "Approve",
      to: `/deliveries/${a.entity_id}`,
    },
  };
  const c = copy[a.kind];
  return (
    <div className="attnrow">
      <span>
        <span>{c.say}</span>
        {a.title && <span className="small muted"> · {a.title}</span>}
      </span>
      <Link to={c.to} className="btn" data-size="sm" data-variant="primary">{c.cta}</Link>
    </div>
  );
}

function StageList({ counts, total }: { counts: Record<string, number>; total: number }) {
  const rows = STAGES.map((s) => ({ stage: s, n: counts[s] ?? 0 })).filter(
    (r) => r.n > 0 || r.stage === "draft",
  );
  return (
    <div className="stagelist">
      {rows.map((r) => {
        const m = statusMeta(requestStatus, r.stage);
        return (
          <div className="stagerow" key={r.stage}>
            <Link to="/requests">{m.label}</Link>
            <Meter pct={total ? (100 * r.n) / total : 0} tone={m.tone === "attention" ? "attention" : undefined} />
            <span className="n">{r.n}</span>
          </div>
        );
      })}
    </div>
  );
}
