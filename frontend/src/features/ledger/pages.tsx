// ledger — invoices. Your own if you are an organisation; everyone's if you
// are Ops. Same endpoint, RLS decides.

import { useQuery } from "@tanstack/react-query";
import { get } from "@api/client";
import type { InvoiceRow } from "@api/types";
import { Empty, Metric, Panel, Pill, TableWrap, View } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, money } from "@shared/format";
import { invoiceStatus, statusMeta } from "@shared/status";

export function BillingPage() {
  const session = useSession();
  const isOps = session.role === "platform_admin";
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
                  <th>Amount</th><th>Issued</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const m = statusMeta(invoiceStatus, i.status);
                  return (
                    <tr key={i.id}>
                      <td className="id">{i.reference_code}</td>
                      {isOps && <td>{i.party_name ?? "—"}</td>}
                      <td className="id">{i.contract_ref ?? "—"}</td>
                      <td>{i.kind}</td>
                      <td className="num">{money(i.amount, i.currency)}</td>
                      <td className="num">{fmtDate(i.issued_on)}</td>
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
