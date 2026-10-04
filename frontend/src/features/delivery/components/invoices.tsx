// The invoices on one contract, on its detail page (db/320). The partner raises
// one here once some work has passed gate 2; the client marks it paid; the
// partner acknowledges or withdraws. The Billing page shows the same rows
// across every contract.

import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import type { Contract, InvoiceRow } from "@api/types";
import { Button, Callout, Empty, Panel, Pill, Skeleton, TableWrap } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, money } from "@shared/format";
import { InvoiceActions, InvoiceDetailDialog, invoiceClaim, RaiseInvoiceDialog } from "@shared/invoices";
import { can } from "@shared/rbac";
import { invoiceStatus, statusMeta } from "@shared/status";

const INVOICEABLE = new Set(["active", "in_qa", "delivered", "completed"]);

export function ContractInvoicesPanel({ c, invoices }: { c: Contract; invoices: UseQueryResult<InvoiceRow[]> }) {
  const session = useSession();
  const [raising, setRaising] = useState(false);
  // the id, not the row: a move made from the open dialog refetches the list,
  // and the dialog must show the row as it now is, not as it was clicked
  const [viewingId, setViewingId] = useState<string | null>(null);
  const isPartner = session.org_id === c.partner_org_id;
  const isClient = session.org_id === c.client_org_id;
  const accepted = c.progress?.assets_accepted ?? 0;
  const mayRaise = isPartner && can(session, "invoice.raise") && INVOICEABLE.has(c.status);
  const rows = invoices.data ?? [];
  const viewing = viewingId ? rows.find((i) => i.id === viewingId) ?? null : null;
  const inv = c.invoicing;

  return (
    <Panel
      title="Invoices"
      sub={isClient
        ? "What the partner has claimed for work that passed QA. Mark each invoice paid once the money has gone out."
        : isPartner
          ? "Claim payment for work that has passed gate 2. The client marks each invoice paid; you acknowledge when it arrives."
          : "Raised by the partner, paid by the client."}
      actions={mayRaise ? (
        <Button
          variant="primary"
          size="sm"
          // an invoice follows the work on either basis; the server refuses
          // one before any gate-2 pass, so say so here instead of a 409
          disabled={accepted === 0}
          title={accepted === 0 ? "Nothing has passed gate 2 yet" : undefined}
          onClick={() => setRaising(true)}
        >
          Raise invoice
        </Button>
      ) : undefined}
    >
      {inv && (
        <p className="muted small" style={{ marginTop: 0 }}>
          {money(inv.invoiced_total, c.currency)} invoiced · {money(inv.paid_total, c.currency)} paid or settled ·{" "}
          {money(inv.outstanding_total, c.currency)} awaiting payment
          {c.pricing?.basis === "per_unit" && ` · ${Number(inv.invoiced_quantity).toLocaleString("en-US")} of ${accepted.toLocaleString("en-US")} accepted captures invoiced`}
        </p>
      )}
      {invoices.isLoading ? (
        <Skeleton rows={2} label="Loading invoices" />
      ) : invoices.isError ? (
        <Callout tone="critical" title="Could not load the invoices">
          {invoices.error instanceof Error ? invoices.error.message : "The request failed."}
        </Callout>
      ) : rows.length === 0 ? (
        <Empty
          title="No invoices yet"
          hint={isPartner
            ? accepted > 0
              ? "Some work has passed QA. Raise an invoice for it."
              : "An invoice follows the work: raise one once a submission has passed gate 2."
            : "The partner raises invoices as work passes QA."}
        />
      ) : (
        <TableWrap>
          <table>
            <thead><tr><th>Reference</th><th>Claim</th><th>Amount</th><th>Raised</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((i) => {
                const m = statusMeta(invoiceStatus, i.status);
                return (
                  <tr key={i.id} className="tap" onClick={() => setViewingId(i.id)}>
                    <td className="id">{i.reference_code}</td>
                    <td>{invoiceClaim(i)}</td>
                    <td className="num">{money(i.amount, i.currency)}</td>
                    <td className="num">{fmtDate(i.issued_at)}</td>
                    <td><Pill tone={m.tone}>{m.label}</Pill></td>
                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      <div className="rowactions">
                        <InvoiceActions i={i} size="sm" />
                        <Button size="sm" onClick={() => setViewingId(i.id)}>Details</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
      {raising && <RaiseInvoiceDialog contract={c} onClose={() => setRaising(false)} />}
      {viewing && <InvoiceDetailDialog i={viewing} onClose={() => setViewingId(null)} />}
    </Panel>
  );
}
