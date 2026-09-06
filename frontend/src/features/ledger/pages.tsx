// ledger — invoices. Your own if you are an organisation; everyone's if you
// are Ops. Same endpoint, RLS decides.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { InvoiceRow } from "@api/types";
import { Button, Dialog, Dl, Empty, Metric, Panel, Pill, TableWrap, View } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money } from "@shared/format";
import { invoiceStatus, statusMeta } from "@shared/status";

function InvoiceDetailDialog({ i, isOps, onClose }: { i: InvoiceRow; isOps: boolean; onClose: () => void }) {
  const m = statusMeta(invoiceStatus, i.status);
  return (
    <Dialog
      title={`Invoice ${i.reference_code}`}
      sub={i.contract_ref ? <span className="id">{i.contract_ref}</span> : undefined}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ...(isOps ? ([["Party", i.party_name ?? "—"]] as [string, React.ReactNode][]) : []),
        ["Kind", i.kind],
        ["Amount", money(i.amount, i.currency)],
        ["Issued", fmtDate(i.issued_on)],
        ["Paid", i.paid_at ? fmtDateTime(i.paid_at) : "Not yet"],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
        ["Contract", i.contract_id
          ? <Link key="c" to={`/contracts/${i.contract_id}`}>{i.contract_ref ?? "Open contract"}</Link>
          : i.contract_ref ?? "—"],
      ]} />
    </Dialog>
  );
}

export function BillingPage() {
  const session = useSession();
  const isOps = session.role === "platform_admin";
  const [viewing, setViewing] = useState<InvoiceRow | null>(null);
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => get<InvoiceRow[]>("/invoices") });

  const rows = invoices.data ?? [];
  const outstanding = rows
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + Number(i.amount), 0);
  const paid = rows.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <View
      title="Billing"
      sub={isOps
        ? "Every invoice on the platform. The double-entry ledger behind these reconciles to zero, always."
        : "Milestones are held in escrow at award and settle when the delivery is approved."}
    >
      <div className="g3">
        <Metric label="Outstanding" value={money(outstanding)} />
        <Metric label="Settled to date" value={money(paid)} />
        <Metric label="Invoices" value={rows.length} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No invoices" hint="Awarding a contract raises the first milestone invoice." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>{isOps && <th>Party</th>}<th>Contract</th><th>Kind</th>
                  <th>Amount</th><th>Issued</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const m = statusMeta(invoiceStatus, i.status);
                  return (
                    <tr key={i.id} className="tap" onClick={() => setViewing(i)}>
                      <td className="id">{i.reference_code}</td>
                      {isOps && <td>{i.party_name ?? "—"}</td>}
                      <td className="id" onClick={(e) => e.stopPropagation()}>
                        {i.contract_id
                          ? <Link to={`/contracts/${i.contract_id}`}>{i.contract_ref ?? "Open"}</Link>
                          : i.contract_ref ?? "—"}
                      </td>
                      <td>{i.kind}</td>
                      <td className="num">{money(i.amount, i.currency)}</td>
                      <td className="num">{fmtDate(i.issued_on)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="rowactions" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" onClick={() => setViewing(i)}>Details</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
      {viewing && <InvoiceDetailDialog i={viewing} isOps={isOps} onClose={() => setViewing(null)} />}
    </View>
  );
}
