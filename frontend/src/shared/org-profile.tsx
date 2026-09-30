// One organisation-detail dialog for every list that shows an org.
//
// Generalised from the marketplace PartnerProfileDialog: seeded from the row
// so the dialog opens named, then filled from GET /organisations/{id}. RLS
// decides whether the fetch answers at all — a 404 means "not yours to see".

import { useQuery } from "@tanstack/react-query";
import { get } from "@api/client";
import type { Org, Performance } from "@api/types";
import { Button, Callout, Dialog, Dl, Meter, Pill } from "@ds/primitives";
import { fmtDate } from "@shared/format";
import { OrgLogo } from "@shared/org-logo";
import { companyRows, draftFromOrg, expertiseRows } from "@shared/org-profile-form";
import { orgStatus, statusMeta } from "@shared/status";
import type { ReactNode } from "react";

// A percentage over its bar. <dd> is flow content, so the Meter div is valid here.
export function rate(pct?: number | null) {
  if (pct == null) return "—";
  return (
    <>
      <span className="num">{pct}%</span>
      <div style={{ marginTop: 4 }}>
        <Meter pct={pct} tone={pct >= 90 ? "success" : undefined} />
      </div>
    </>
  );
}

/** A delivery partner's record, from the figures the API calculated
 *  (partner_performance, db/260): the ones its page in the vendors directory
 *  shows, so a profile and a card can never disagree. */
export function performanceRows(p: Performance | undefined): [string, ReactNode][] {
  if (!p || (p.contracts_completed === 0 && p.rating_count === 0)) {
    return [["Track record", "No completed work yet"]];
  }
  return [
    ["Completed contracts", <span key="n" className="num">{p.contracts_completed}</span>],
    ["Rating", p.rating_avg != null
      ? <span key="r" className="num">★ {p.rating_avg.toFixed(1)} ({p.rating_count})</span>
      : "—"],
    ["On-time delivery", rate(p.on_time_pct)],
    ["Accepted first time", rate(p.accepted_first_time_pct)],
    ["QA pass at its own gate", rate(p.qa_pass_pct)],
  ];
}

// Exported so the operator's account page renders the same per-kind rows as this
// dialog rather than a second copy that drifts. The dialog itself stays as it is:
// the tenant's network page and the client's bidder profile both mount it, so it
// is a counterparty view and nothing operator-shaped belongs in it.
export function kindRows(o: Org): [string, ReactNode][] {
  const p = o.profile as Record<string, unknown>;
  const s = (k: string) => (p[k] as string | null | undefined) ?? "—";
  switch (o.kind) {
    case "tenant":
      return [
        ["Headquarters", s("hq")],
        ["Capabilities", s("capabilities")],
        ["Fair work", p.fair_work_attested ? "Attested" : "Not attested"],
        ["Partner since", fmtDate((p.since as string | null) ?? null)],
        ...performanceRows(o.performance),
      ];
    case "client":
      return [
        ["Industry", s("industry")],
        // Only when the field actually came back. _may_see_commercials strips
        // dpa_signed from a counterparty, and a stripped key is falsy — so a
        // partner reading any client saw "Not signed" stated as fact.
        ...("dpa_signed" in p
          ? [["DPA", p.dpa_signed ? `Signed ${fmtDate((p.dpa_signed_at as string | null) ?? null)}` : "Not signed"]] as [string, ReactNode][]
          : []),
        ["Client since", fmtDate((p.since as string | null) ?? null)],
        ["Residency region", o.residency_region ?? "—"],
      ];
    case "aggregator":
      return [
        ["Crowd size", <span key="c" className="num">{String(p.crowd_size ?? "—")}</span>],
        ["Region", s("region")],
        ["Focus", s("focus")],
      ];
    case "business":
      return [
        ["Specialty", s("specialty")],
        ["Capacity", s("capacity")],
      ];
    case "sponsor":
      return [
        ["Contact email", s("contact_email")],
        ["Contact phone", s("contact_phone")],
      ];
    default:
      return [];
  }
}

export function OrgProfileDialog({
  orgId,
  seedName,
  onClose,
}: {
  orgId: string;
  seedName?: string | null;
  onClose: () => void;
}) {
  const org = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => get<Org>(`/organisations/${orgId}`),
  });

  const o = org.data;
  const meta = statusMeta(orgStatus, o?.status);

  return (
    <Dialog
      title={o?.name ?? seedName ?? "Organisation"}
      // .id is a chip for the reference code alone — anything else put inside it
      // gets boxed and rendered monospace along with it
      sub={
        <>
          <span className="id">{o?.reference_code ?? "—"}</span>
          {o?.country ? ` · ${o.country}` : ""}{" "}
          {o && <Pill tone={meta.tone}>{meta.label}</Pill>}
        </>
      }
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      {org.isError ? (
        <Callout tone="critical" title="Profile not available">
          You see an organisation through what you share with it — a proposal, a
          contract, a network link. If that is gone, so is your view of them.
        </Callout>
      ) : !o ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
        {/* The public profile (db/230) is what this organisation chose to show
            the people it works with, so a counterparty sees all of it. */}
        {["client", "tenant"].includes(o.kind) && (
          <div className="orghead">
            <OrgLogo orgId={o.id} version={o.logo_version} name={o.name} size={48} />
            <div>
              <b>{o.name}</b>
              {o.legal_name && o.legal_name !== o.name && <p className="small muted">{o.legal_name}</p>}
            </div>
          </div>
        )}
        <Dl
          rows={[
            ...(["client", "tenant"].includes(o.kind) ? companyRows(draftFromOrg(o)) : []),
            ...(o.kind === "tenant" ? expertiseRows(draftFromOrg(o).expertise) : []),
            ...kindRows(o),
            // a partner's rating is in its track record, with how many gave it
            ...(o.kind === "tenant" ? [] : ([["Rating", o.rating ? `★ ${o.rating}` : "—"]] as [string, ReactNode][])),
            ...(o.billing_status ? ([["Billing", o.billing_status]] as [string, ReactNode][]) : []),
          ]}
        />
        </>
      )}
    </Dialog>
  );
}
