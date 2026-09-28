// Importing a crowd roster from a spreadsheet.
//
// Three stages in one dialog. Upload: a template to fill and a file to pick;
// the browser parses it (import-parse.ts) and asks the server to judge every
// row, writing nothing. Preview: each row's verdict, so the person sees what
// will happen before it does. Import: the rows they agreed to, sent in
// batches of fifty — each batch its own request, transaction and mail
// connection — with the progress shown, then the counts and an error report
// for whatever was not imported.

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { post } from "@api/client";
import {
  Button, Callout, DataTable, Dialog, Meter, Pill, StageRail, useToast,
} from "@ds/primitives";
import { labelsOf } from "@features/marketplace/vocabularies";
import type { Tone } from "@shared/status";
import {
  downloadBlob, IMPORT_BATCH, ImportFileError, normaliseRows, parseCsv, parseXlsx, readBuffer,
  readText, reportRows, templateRows, toCsv, xlsxBlob,
  type CheckResult, type ImportResult, type ImportResultRow, type ImportRow, type Verdict,
} from "./import-parse";
import { SKILLS } from "./vocabularies";

const STAGES = ["Upload", "Preview", "Import"] as const;

const VERDICT: Record<Verdict["status"], { label: string; tone: Tone }> = {
  ready: { label: "Ready", tone: "success" },
  warning: { label: "Warning", tone: "attention" },
  error: { label: "Error", tone: "critical" },
  skipped: { label: "Already on roster", tone: "neutral" },
};

const EMPTY_TOTALS = { added: 0, invited: 0, skipped: 0, invitation_failures: 0 };

export function ImportCrowdDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<ImportResultRow[]>([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [finished, setFinished] = useState(false);

  const importable = useMemo(
    () => (check?.rows ?? []).filter((v) => v.status === "ready" || v.status === "warning"),
    [check],
  );

  const pick = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (ext !== "csv" && ext !== "xlsx") throw new ImportFileError("Choose a .csv or .xlsx file.");
      const grid = ext === "xlsx" ? await parseXlsx(await readBuffer(file)) : parseCsv(await readText(file));
      const rows: ImportRow[] = normaliseRows(grid);
      const judged = await post<CheckResult>("/network/workers/import/check", { rows });
      setFileName(file.name);
      setCheck(judged);
      setStage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setError(null);
    setStage(2);
    setBusy(true);
    const toSend = importable.map((v) => v.normalized);
    const all: ImportResultRow[] = [];
    const sum = { ...EMPTY_TOTALS };
    setProgress({ done: 0, total: toSend.length });
    try {
      for (let i = 0; i < toSend.length; i += IMPORT_BATCH) {
        const r = await post<ImportResult>("/network/workers/import", { rows: toSend.slice(i, i + IMPORT_BATCH) });
        all.push(...r.rows);
        sum.added += r.added;
        sum.invited += r.invited;
        sum.skipped += r.skipped;
        sum.invitation_failures += r.invitation_failures;
        setResults([...all]);
        setTotals({ ...sum });
        setProgress({ done: Math.min(i + IMPORT_BATCH, toSend.length), total: toSend.length });
      }
      toast(
        "Import finished",
        `${sum.added + sum.invited} added to the roster, ${sum.invited} invited.`,
        "success",
      );
    } catch (e) {
      // what landed before the failure stays landed: say how far it got
      setError(
        (e instanceof Error ? e.message : "The import stopped.")
        + ` ${all.length} of ${toSend.length} rows were processed before it stopped; the rest were not sent.`,
      );
    } finally {
      setBusy(false);
      setFinished(true);
      // the roster, and the assignment pickers that read the same list
      void qc.invalidateQueries({ queryKey: ["workers"] });
    }
  };

  const downloadTemplate = async (kind: "csv" | "xlsx") => {
    try {
      if (kind === "csv") {
        downloadBlob(new Blob([toCsv(templateRows())], { type: "text/csv" }), "crowd-template.csv");
      } else {
        downloadBlob(await xlsxBlob(templateRows()), "crowd-template.xlsx");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the template.");
    }
  };

  const downloadReport = () => {
    if (!check) return;
    downloadBlob(
      new Blob([toCsv(reportRows(check.rows, results))], { type: "text/csv" }),
      "crowd-import-report.csv",
    );
  };

  const notImported = check
    ? check.rows.filter((v) => v.status === "error" || v.status === "skipped").length
      + results.filter((r) => r.outcome === "skipped").length
    : 0;
  const reportable = notImported > 0 || totals.invitation_failures > 0;

  const foot = stage === 0 ? (
    <Button onClick={onClose} disabled={busy}>Cancel</Button>
  ) : stage === 1 ? (
    <>
      <Button onClick={() => { setCheck(null); setFileName(""); setError(null); setStage(0); }}>
        Choose another file
      </Button>
      <Button variant="primary" onClick={run} disabled={importable.length === 0 || busy}>
        Import {importable.length} crowd resource{importable.length === 1 ? "" : "s"}
      </Button>
    </>
  ) : (
    <>
      {finished && reportable && <Button onClick={downloadReport}>Download error report</Button>}
      <Button variant="primary" onClick={onClose} disabled={busy}>{busy ? "Importing…" : "Done"}</Button>
    </>
  );

  return (
    <Dialog
      title="Import crowd resources"
      sub={fileName ? <span className="id">{fileName}</span> : "From a CSV or Excel file, up to 1,000 rows."}
      size="wide"
      busy={busy}
      onClose={onClose}
      foot={foot}
    >
      <StageRail stages={STAGES} current={STAGES[stage]!} />

      {stage === 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginTop: 0 }}>
            One row per person: <b>name</b> (required), email, phone, skills and trained. A row with an
            email is invited to the capture app; one without stays on the roster only and cannot be
            offered work until invited.
          </p>
          <div className="btnrow">
            <Button onClick={() => void downloadTemplate("csv")}>Download template (CSV)</Button>
            <Button onClick={() => void downloadTemplate("xlsx")}>Download template (Excel)</Button>
          </div>
          <div className="btnrow" style={{ marginTop: 16 }}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              hidden
              aria-label="Roster file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pick(f);
                e.target.value = "";
              }}
            />
            <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? "Reading…" : "Choose file"}
            </Button>
          </div>
        </div>
      )}

      {stage === 1 && check && (
        <div style={{ marginTop: 16 }}>
          <p className="small muted" style={{ marginTop: 0 }}>
            {check.counts.ready} ready · {check.counts.warning} with warnings · {check.counts.error} errors ·{" "}
            {check.counts.skipped} already on your roster. Ready and warning rows are imported; nothing has
            been written yet.
          </p>
          <DataTable
            rows={check.rows}
            rowKey={(v) => String(v.row)}
            filter={{
              label: "Filter rows",
              placeholder: "Filter by name, email or reason…",
              text: (v) => `${v.normalized.display_name} ${v.normalized.email ?? ""} ${v.reasons.join(" ")}`,
            }}
            columns={[
              { header: "Row", cell: (v) => v.row, sortBy: (v) => v.row, className: "num" },
              { header: "Name", cell: (v) => v.normalized.display_name || "—", sortBy: (v) => v.normalized.display_name, className: "cell-primary" },
              { header: "Email", cell: (v) => v.normalized.email ?? "—", sortBy: (v) => v.normalized.email ?? "" },
              { header: "Phone", cell: (v) => v.normalized.phone ?? "—" },
              { header: "Skills", cell: (v) => labelsOf(SKILLS, v.normalized.skills) },
              { header: "Trained", cell: (v) => (v.normalized.trained ? "Yes" : "No") },
              {
                header: "Status",
                sortBy: (v) => VERDICT[v.status].label,
                cell: (v) => (
                  <>
                    <Pill tone={VERDICT[v.status].tone}>{VERDICT[v.status].label}</Pill>
                    {v.reasons.length > 0 && <div className="cell-meta">{v.reasons.join(" ")}</div>}
                  </>
                ),
              },
            ]}
          />
        </div>
      )}

      {stage === 2 && (
        <div style={{ marginTop: 16 }}>
          {progress && (
            <>
              <Meter pct={progress.total ? Math.round((progress.done / progress.total) * 100) : 100} tone={finished ? "success" : "active"} />
              <p className="small muted">{progress.done} of {progress.total} rows processed{busy ? "…" : "."}</p>
            </>
          )}
          {finished && (
            <div className="g4" style={{ marginTop: 12 }}>
              <Stat label="Invited" value={totals.invited} />
              <Stat label="Roster only" value={totals.added} />
              <Stat label="Not imported" value={notImported} />
              <Stat label="Invitations not sent" value={totals.invitation_failures} />
            </div>
          )}
          {finished && totals.invitation_failures > 0 && (
            <Callout tone="attention" title="Some invitations did not go out">
              Those people are on the roster; use Resend invite on their row when the mail server is back.
            </Callout>
          )}
          {finished && reportable && (
            <p className="small muted">The error report lists every row that was not imported, with the reason.</p>
          )}
        </div>
      )}

      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="eyebrow">{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
