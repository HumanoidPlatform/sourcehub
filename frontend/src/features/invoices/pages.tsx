// Billing — the invoices partners raise on contracts (db/320), and those the
// platform issues on accepted dataset deals (db/450). Each party sees its own,
// Ops everyone's. Same endpoint, RLS decides. The platform moves no money: the
// one billed marks paid, the one who billed acknowledges.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get } from "@api/client";
import type { InvoiceRow } from "@api/types";
import {
  Button, Callout, Empty, Metric, Panel, Pill, Skeleton, TableWrap, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, money } from "@shared/format";
import { InvoiceActions, InvoiceDetailDialog, invoiceClaim, InvoiceSubject } from "@shared/invoices";
import { invoiceStatus, statusMeta } from "@shared/status";

export function BillingPage() {
  const session = useSession();
  const isOps = session.role === "platform_admin";
  const isClient = session.org_kind === "client";
  // the id, not the row: a move made from the open dialog refetches the list,
  // and the dialog must show the row as it now is, not as it was clicked
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [sp, setSp] = useSearchParams();
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => get<InvoiceRow[]>("/invoices") });

  // A bell row names the invoice (?invoice=); open it once the list is here,
  // then drop the parameter so Close does not reopen it.
  const wanted = sp.get("invoice");
  useEffect(() => {
    if (!wanted || !invoices.data) return;
    if (invoices.data.some((i) => i.id === wanted)) setViewingId(wanted);
    setSp((prev) => { const n = new URLSearchParams(prev); n.delete("invoice"); return n; }, { replace: true });
  }, [wanted, invoices.data, setSp]);

  const rows = invoices.data ?? [];
  const viewing = viewingId ? rows.find((i) => i.id === viewingId) ?? null : null;
  const live = rows.filter((i) => i.status !== "withdrawn");
  const awaiting = live.filter((i) => i.status === "issued").reduce((s, i) => s + Number(i.amount), 0);
  const settled = live.filter((i) => i.status !== "issued").reduce((s, i) => s + Number(i.amount), 0);
  const currency = rows[0]?.currency;

  return (
    <View
      title="Billing"
      sub={isOps
        ? "Every invoice on the platform. Ops reads; the two parties move them."
        : isClient
          ? "Invoices on your contracts and dataset purchases. Mark each one paid once the money has gone out; acknowledge payment of a dataset you sold."
          : "Invoices you have raised, and those on datasets you buy or sell. Raise one from a contract once some of its work has passed QA; acknowledge each payment when it arrives."}
    >
      <div className="g3">
        <Metric label="Awaiting payment" value={money(awaiting, currency)} loading={invoices.isLoading} />
        <Metric label="Paid or settled" value={money(settled, currency)} loading={invoices.isLoading} />
        <Metric label="Invoices" value={live.length} loading={invoices.isLoading}
          foot={rows.length > live.length ? `${rows.length - live.length} withdrawn` : undefined} />
      </div>
      <Panel>
        {/* Ops reads this screen during an outage. "No invoices" for a failed
            fetch is the wrong answer to the only question it is asked. */}
        {invoices.isLoading ? (
          <Skeleton rows={5} label="Loading invoices" />
        ) : invoices.isError ? (
          <Callout tone="critical" title="Could not load invoices">
            {invoices.error instanceof Error ? invoices.error.message : "The request failed."}
          </Callout>
        ) : rows.length === 0 ? (
          <Empty
            title="No invoices"
            hint={isClient
              ? "Partners raise invoices as work passes QA. They appear here for you to mark paid."
              : isOps
                ? "Partners raise invoices on their contracts; nothing has been raised yet."
                : "Open a contract and raise an invoice once some of its work has passed QA."}
          />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>For</th>
                  <th>From</th><th>Billed to</th>
                  <th>Claim</th><th>Amount</th><th>Raised</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const m = statusMeta(invoiceStatus, i.status);
                  return (
                    <tr key={i.id} className="tap" onClick={() => setViewingId(i.id)}>
                      <td className="id">{i.reference_code}</td>
                      <td className="id" onClick={(e) => e.stopPropagation()}>
                        <InvoiceSubject i={i} />
                      </td>
                      <td>{i.partner_name ?? "—"}</td>
                      <td>{i.client_name ?? "—"}</td>
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
      </Panel>
      {viewing && <InvoiceDetailDialog i={viewing} onClose={() => setViewingId(null)} />}
    </View>
  );
}
