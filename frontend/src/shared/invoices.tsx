// Partner-raised invoices (db/320): the dialogs, the row actions and the
// detail view shared by the contract page and the Billing page.
//
// Who may do what is decided twice — here, so the button only appears for the
// party whose move it is, and in the database, whose transition trigger refuses
// anyone else. The platform moves no money: "paid" is the client's word, and
// "settled" the partner's acknowledgement that it arrived.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { post } from "@api/client";
import type { Contract, InvoiceRow } from "@api/types";
import { Button, Callout, Dialog, Dl, Field, inputCls, Pill, textareaCls, useToast } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDateTime, money } from "@shared/format";
import { estimatedTotal, FRACTIONAL_UNITS, quantityWords, unitWords } from "@shared/pricing";
import { can } from "@shared/rbac";
import { invoiceStatus, statusMeta } from "@shared/status";

/** "39 photos at $2,900 per 1,000 photos", or what a fixed-price claim is. */
export function invoiceClaim(i: InvoiceRow): string {
  if (i.quantity === null || i.rate === null) return "Fixed-price claim";
  return `${quantityWords(i.quantity, i.unit)} at ${money(i.rate, i.currency)} per ${unitWords(i.unit, i.block)}`;
}

function describeError(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/* --- raise -------------------------------------------------------------------- */

export function RaiseInvoiceDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const p = contract.pricing;
  const perUnit = p?.basis === "per_unit";
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const accepted = contract.progress?.assets_accepted ?? 0;
  const invoicedQty = Number(contract.invoicing?.invoiced_quantity ?? 0);
  const invoicedAmt = Number(contract.invoicing?.invoiced_total ?? 0);
  const fractional = FRACTIONAL_UNITS.has(p?.unit ?? "");
  const computed = perUnit && quantity
    ? estimatedTotal("per_unit", contract.value, p?.block, Number(quantity))
    : null;
  const left = Number(contract.value) - invoicedAmt;

  const raise = useMutation({
    mutationFn: () =>
      post<InvoiceRow>(`/contracts/${contract.id}/invoices`, {
        quantity: perUnit ? Number(quantity) : null,
        amount: perUnit ? null : Number(amount),
        note: note.trim() || null,
      }),
    onSuccess: (i) => {
      void qc.invalidateQueries();
      toast("Invoice raised", `${i.reference_code} for ${money(i.amount, i.currency)} is with the client.`, "success");
      onClose();
    },
    onError: (e) => setError(describeError(e, "Could not raise the invoice")),
  });

  const ready = perUnit ? Number(quantity) > 0 : Number(amount) > 0;
  return (
    <Dialog
      title="Raise an invoice"
      sub={<span className="id">{contract.reference_code} · {contract.client_name}</span>}
      busy={raise.isPending}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose} disabled={raise.isPending}>Cancel</Button>
          <Button variant="primary" disabled={!ready || raise.isPending} onClick={() => { setError(null); raise.mutate(); }}>
            {raise.isPending ? "Raising…" : "Raise invoice"}
          </Button>
        </>
      }
    >
      <Callout tone="neutral" title={perUnit
        ? `Priced at ${money(contract.value, contract.currency)} per ${unitWords(p?.unit, p?.block)}`
        : `Fixed price ${money(contract.value, contract.currency)}`}>
        {perUnit
          ? `Gate 2 has accepted ${accepted.toLocaleString("en-US")} captures on this contract and ${invoicedQty.toLocaleString("en-US")} are already invoiced. The client sees both figures beside your claim.`
          : `${money(invoicedAmt, contract.currency)} is already invoiced, so up to ${money(Math.max(left, 0), contract.currency)} can be claimed now.`}
      </Callout>
      <div className="formgrid" style={{ marginTop: 12 }}>
        {perUnit ? (
          <Field
            label={`Quantity (${unitWords(p?.unit, 2).split(" ").slice(1).join(" ") || "units"})`}
            required
            hint={fractional ? "Hours are never measured by the platform; the client checks them against the delivery." : "Whole units only."}
          >
            {(id) => (
              <input id={id} className={inputCls} type="number" min={fractional ? 0.01 : 1}
                step={fractional ? 0.01 : 1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            )}
          </Field>
        ) : (
          <Field label={`Amount (${contract.currency})`} required>
            {(id) => <input id={id} className={inputCls} type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />}
          </Field>
        )}
        <Field label="Amount claimed">
          {(id) => (
            <p id={id} className="num" style={{ margin: "6px 0", fontWeight: 600 }}>
              {perUnit ? (computed === null ? "—" : money(computed, contract.currency)) : amount ? money(amount, contract.currency) : "—"}
            </p>
          )}
        </Field>
        <Field label="Note to the client" span hint="Which work this covers, where to find it, anything the client needs to match it to the delivery.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- the three moves ----------------------------------------------------------- */

function PayInvoiceDialog({ i, onClose }: { i: InvoiceRow; onClose: () => void }) {
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const pay = useMutation({
    mutationFn: () => post<InvoiceRow>(`/invoices/${i.id}/pay`, { payment_reference: reference.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Marked paid", `${i.partner_name ?? "The partner"} has been asked to acknowledge it.`, "success");
      onClose();
    },
    onError: (e) => setError(describeError(e, "Could not mark it paid")),
  });
  return (
    <Dialog
      title={`Mark ${i.reference_code} as paid?`}
      sub={`${money(i.amount, i.currency)} to ${i.partner_name ?? "the partner"}`}
      busy={pay.isPending}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose} disabled={pay.isPending}>Cancel</Button>
          <Button variant="primary" disabled={pay.isPending} onClick={() => { setError(null); pay.mutate(); }}>
            {pay.isPending ? "Saving…" : "Mark paid"}
          </Button>
        </>
      }
    >
      <Callout tone="attention" title="This records that the money has gone out">
        The platform does not move it. The partner is told, and settles the invoice by acknowledging
        that the payment arrived. This cannot be undone.
      </Callout>
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Payment reference" span hint="Your bank's reference or the transfer number, so the partner can match it.">
          {(id) => <input id={id} className={inputCls} value={reference} maxLength={200} onChange={(e) => setReference(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

function WithdrawInvoiceDialog({ i, onClose }: { i: InvoiceRow; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => post<InvoiceRow>(`/invoices/${i.id}/withdraw`, { reason: reason.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Withdrawn", `${i.reference_code} no longer counts. Raise another when you are ready.`, "attention");
      onClose();
    },
    onError: (e) => setError(describeError(e, "Could not withdraw it")),
  });
  return (
    <Dialog
      title={`Withdraw ${i.reference_code}?`}
      sub={money(i.amount, i.currency)}
      busy={withdraw.isPending}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose} disabled={withdraw.isPending}>Cancel</Button>
          <Button variant="danger" disabled={withdraw.isPending} onClick={() => { setError(null); withdraw.mutate(); }}>
            {withdraw.isPending ? "Withdrawing…" : "Withdraw invoice"}
          </Button>
        </>
      }
    >
      <Callout tone="attention" title="A withdrawn invoice counts for nothing">
        The client is told. The work it covered can be invoiced again on a new invoice.
      </Callout>
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Reason" span hint="Optional, shown to the client.">
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/** The buttons for whichever party's move it is, or nothing. */
export function InvoiceActions({ i, size }: { i: InvoiceRow; size?: "sm" }) {
  const session = useSession();
  const [paying, setPaying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();
  const isClient = session.org_id === i.client_org_id;
  const isPartner = session.org_id === i.partner_org_id;

  const acknowledge = useMutation({
    mutationFn: () => post<InvoiceRow>(`/invoices/${i.id}/acknowledge`),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Settled", `${i.reference_code} is acknowledged as paid.`, "success");
    },
    onError: (e) => toast("Could not acknowledge", describeError(e, ""), "critical"),
  });

  const buttons: ReactNode[] = [];
  if (isClient && i.status === "issued" && can(session, "invoice.pay")) {
    buttons.push(<Button key="pay" size={size} variant="primary" onClick={() => setPaying(true)}>Mark paid</Button>);
  }
  if (isPartner && can(session, "invoice.acknowledge")) {
    if (i.status === "paid") {
      buttons.push(
        <Button key="ack" size={size} variant="success" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>
          {acknowledge.isPending ? "Saving…" : "Acknowledge payment"}
        </Button>,
      );
    }
    if (i.status === "issued") {
      buttons.push(<Button key="wd" size={size} onClick={() => setWithdrawing(true)}>Withdraw</Button>);
    }
  }
  return (
    <>
      {buttons}
      {paying && <PayInvoiceDialog i={i} onClose={() => setPaying(false)} />}
      {withdrawing && <WithdrawInvoiceDialog i={i} onClose={() => setWithdrawing(false)} />}
    </>
  );
}

/* --- detail ------------------------------------------------------------------- */

export function InvoiceDetailDialog({ i, onClose }: { i: InvoiceRow; onClose: () => void }) {
  const m = statusMeta(invoiceStatus, i.status);
  const rows: [string, ReactNode][] = [
    ["Contract", <Link key="c" to={`/contracts/${i.contract_id}`}>{i.contract_ref ?? "Open contract"}</Link>],
    ["Raised by", i.partner_name ?? "—"],
    ["Billed to", i.client_name ?? "—"],
    ["Claim", invoiceClaim(i)],
    ["Amount", money(i.amount, i.currency)],
    ...(i.accepted_assets_at_issue !== null
      ? ([["Captures accepted when raised", i.accepted_assets_at_issue.toLocaleString("en-US")]] as [string, ReactNode][])
      : []),
    ...(i.note ? ([["Note", i.note]] as [string, ReactNode][]) : []),
    ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
    ["Raised", fmtDateTime(i.issued_at)],
    ["Marked paid", i.paid_at
      ? `${fmtDateTime(i.paid_at)}${i.payment_reference ? ` · ref ${i.payment_reference}` : ""}`
      : "Not yet"],
    ...(i.acknowledged_at ? ([["Acknowledged", fmtDateTime(i.acknowledged_at)]] as [string, ReactNode][]) : []),
    ...(i.withdrawn_at
      ? ([["Withdrawn", `${fmtDateTime(i.withdrawn_at)}${i.withdrawn_reason ? ` · ${i.withdrawn_reason}` : ""}`]] as [string, ReactNode][])
      : []),
  ];
  return (
    <Dialog
      title="Invoice"
      sub={<span className="id">{i.reference_code}{i.request_title ? ` · ${i.request_title}` : ""}</span>}
      onClose={onClose}
      foot={<><InvoiceActions i={i} /><Button onClick={onClose}>Close</Button></>}
    >
      <Dl rows={rows} />
    </Dialog>
  );
}
