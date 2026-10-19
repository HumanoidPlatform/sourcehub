// admin/mail — the Ops mail log: every e-mail the platform sent or tried to
// (db/490 mail_outbox). Today's counts, the week, the failures with the mail
// server's own reason, and a re-send. Nothing here shows a mail's content: an
// unsent invitation's token is in it, and the API never returns it.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { MailRow, MailStats } from "@api/types";
import {
  Button,
  Callout,
  DataTable,
  Empty,
  fillDays,
  Loadable,
  Metric,
  Panel,
  Pill,
  TimeBars,
  useToast,
  View,
  type Column,
} from "@ds/primitives";
import { fmtDateTime } from "@shared/format";

type Filter = "failed" | "all" | "waiting" | "sent";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
  { key: "waiting", label: "Waiting" },
  { key: "sent", label: "Sent" },
];

/** The template names (backend platform/mail/templates) as a person reads them. */
const MAILS: Record<string, string> = {
  rfp_published: "New RFP to partners",
  rfp_awarded: "RFP awarded",
  password_reset: "Password reset",
  member_invitation: "Colleague invitation",
  onboarding_approved: "Organisation approved",
  onboarding_reminder: "Invitation reminder",
  worker_invitation: "Crowd invitation",
  task_offer: "Task offer",
  assignment_reminder: "Assignment reminder",
  public_reply: "DataHub reply",
};

const ABOUT: Record<string, string> = {
  request: "RFP",
  contract: "Contract",
  app_user: "Account",
  onboarding_request: "Onboarding",
  crowd_worker: "Crowd resource",
  task_offer_recipient: "Task offer",
  engagement_reminder: "Reminder",
  datahub_deal_message: "DataHub deal",
};

const STATE: Record<
  MailRow["state"],
  { text: string; tone: "success" | "critical" | "attention" | "neutral" }
> = {
  sent: { text: "Sent", tone: "success" },
  failed: { text: "Failed", tone: "critical" },
  // db/500: the server said "not now"; the clock tries again by itself
  retrying: { text: "Retrying", tone: "attention" },
  queued: { text: "Waiting", tone: "neutral" },
};

/** What the Reason column says: the final refusal of a failed mail, or, while
 *  a temporary refusal is being retried, the latest one and when it is next. */
function reason(r: MailRow): string {
  if (r.state === "retrying") {
    const next = r.next_attempt_at ? `, next ${fmtDateTime(r.next_attempt_at)}` : "";
    // attempts counts the tries a temporary refusal has already answered
    const tries = `${r.attempts} ${r.attempts === 1 ? "time" : "times"}`;
    return `${r.last_error ?? "refused for now"} · tried ${tries}${next}`;
  }
  return r.failure_reason ?? "—";
}

const EMPTY_HINT: Record<Filter, string> = {
  failed: "Every mail of the last 30 days left the platform.",
  all: "Nothing has been mailed yet.",
  waiting: "The queue is empty; a mail waits for a few seconds at most.",
  sent: "Nothing has been sent yet.",
};

export function MailPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("failed");
  const [error, setError] = useState<string | null>(null);

  const stats = useQuery({
    queryKey: ["mail-stats"],
    queryFn: () => get<MailStats>("/mail/stats"),
    refetchInterval: 15_000,
  });
  const rows = useQuery({
    queryKey: ["mail", filter],
    queryFn: () => get<MailRow[]>(`/mail?status=${filter}&limit=100`),
    refetchInterval: 15_000,
  });
  const resend = useMutation({
    mutationFn: (id: string) => post<{ id: string }>(`/mail/${id}/resend`),
    onSuccess: (_created, id) => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["mail"] });
      void qc.invalidateQueries({ queryKey: ["mail-stats"] });
      const to = (rows.data ?? []).find((r) => r.id === id)?.to_email ?? "The recipient";
      toast("Queued again", `${to} should have it within seconds.`, "success");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not re-send the mail"),
  });

  const s = stats.data;
  const days = s?.days ?? [];
  const sentSeries = fillDays(days.map((d) => ({ day: d.day, count: d.sent })), 7);
  const failedSeries = fillDays(days.map((d) => ({ day: d.day, count: d.failed })), 7);
  const failedToday = s?.failed_today ?? 0;
  const waiting = s?.waiting ?? 0;
  const retrying = s?.retrying ?? 0;
  const failedOpen = s?.failed_open ?? 0;

  const columns: Column<MailRow>[] = [
    {
      header: "When",
      cell: (r) => fmtDateTime(r.created_at),
      sortBy: (r) => r.created_at,
      className: "cell-primary",
    },
    {
      header: "To",
      cell: (r) => (
        <div>
          {r.to_name || "—"}
          <div className="small muted">{r.to_email}</div>
        </div>
      ),
      sortBy: (r) => r.to_email,
    },
    {
      header: "Mail",
      cell: (r) => (
        <div>
          {MAILS[r.template] ?? r.template}
          {r.label && <div className="small muted">{r.label}</div>}
        </div>
      ),
      sortBy: (r) => r.template,
    },
    {
      header: "About",
      cell: (r) => (
        <div>
          {r.entity_type ? (ABOUT[r.entity_type] ?? r.entity_type) : "—"}
          {r.org_name && <div className="small muted">{r.org_name}</div>}
        </div>
      ),
      sortBy: (r) => r.org_name,
    },
    {
      header: "Status",
      cell: (r) => <Pill tone={STATE[r.state].tone}>{STATE[r.state].text}</Pill>,
      sortBy: (r) => r.state,
    },
    { header: "Reason", cell: (r) => <span className="small">{reason(r)}</span> },
    {
      header: "Actions",
      hideHeader: true,
      className: "right",
      cell: (r) =>
        r.resent_to ? (
          <span className="small muted">Re-sent</span>
        ) : r.can_resend ? (
          <Button size="sm" disabled={resend.isPending} onClick={() => resend.mutate(r.id)}>
            Resend
          </Button>
        ) : null,
    },
  ];

  return (
    <View
      title="Mail"
      sub="Every e-mail the platform sent or tried to — invitations, resets, DataHub replies and the RFP mails to partners — a few seconds after the action that caused it. Task offers and reminders reach crowd resources in the app, not by e-mail; older ones still show here."
    >
      <div className="g4">
        <Metric label="Sent today" value={s?.sent_today ?? 0} loading={stats.isLoading} foot="since 00:00 UTC" />
        <Metric
          label="Failed today"
          value={failedToday}
          tone={failedToday > 0 ? "critical" : undefined}
          loading={stats.isLoading}
          foot={failedToday > 0 ? "the mail server's reason is on each row" : "nothing refused"}
        />
        <Metric
          label="Waiting"
          value={waiting}
          tone={waiting > 0 ? "attention" : undefined}
          loading={stats.isLoading}
          foot={
            retrying > 0
              ? `${retrying} retrying after a temporary refusal`
              : waiting > 0
                ? "leaves on the next tick, or the server is down"
                : "queue empty"
          }
        />
        <Metric
          label="Failed, not re-sent"
          value={failedOpen}
          tone={failedOpen > 0 ? "attention" : undefined}
          loading={stats.isLoading}
          foot="last 30 days"
        />
      </div>

      <div className="g2">
        <Panel title="Sent, last 7 days">
          <Loadable q={stats} what="the mail counts">
            <TimeBars data={sentSeries} unit="mails sent" />
          </Loadable>
        </Panel>
        <Panel title="Failed, last 7 days">
          <Loadable q={stats} what="the mail counts">
            <TimeBars data={failedSeries} unit="mails failed" />
          </Loadable>
        </Panel>
      </div>

      <Panel
        title="Mail log"
        sub="A re-send queues a failed mail again; a mail whose link has expired is re-sent from the account itself, which mints a fresh one."
        actions={
          <div role="group" aria-label="Show" style={{ display: "flex", gap: 6 }}>
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? "primary" : "quiet"}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        }
      >
        {error && (
          <Callout tone="critical" title="Could not re-send">
            {error}
          </Callout>
        )}
        <Loadable q={rows} what="the mail log">
          {(rows.data ?? []).length === 0 ? (
            <Empty title={filter === "failed" ? "Nothing failed" : "No mail here"} hint={EMPTY_HINT[filter]} />
          ) : (
            <DataTable
              rows={rows.data ?? []}
              rowKey={(r) => r.id}
              columns={columns}
              filter={{
                label: "Filter mail",
                placeholder: "Address, name, RFP or organisation",
                text: (r) => `${r.to_email} ${r.to_name} ${r.label} ${r.org_name ?? ""}`,
              }}
              initialSort={{ by: "When", dir: "desc" }}
            />
          )}
        </Loadable>
      </Panel>
    </View>
  );
}
