// catalogue — a seller's listings: start one, upload files, pick the public
// samples, submit for review; afterwards withdraw a file or the listing.
//
// Two ways a listing exists: uploaded here, or opened as a draft when a
// non-exclusive contract was delivered (its files are copied in by the
// platform, and the page shows how far that has got). Either way only Ops
// publishes it (db/350).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, get, patch, post, put, del, xhrPut } from "@api/client";
import type { Dataset, DatasetItem, PermittedUse, UploadSlot } from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Dl, Empty, Field, inputCls, Panel, Pill, selectCls,
  Skeleton, TagInput, textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDate, fmtDateTime } from "@shared/format";
import { ReasonDialog } from "@shared/reason-dialog";
import { datasetStatus, statusMeta } from "@shared/status";
import { PERMITTED_USES } from "@features/marketplace/vocabularies";
import { CatalogueTabs } from "./buyer";
import { CATEGORIES, categoryLabel, fmtBytes, ItemPreview, sizeText } from "./shared";

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/* --- my listings ---------------------------------------------------------------- */

export function MyDatasetsPage() {
  const mine = useQuery({ queryKey: ["catalogue-mine"], queryFn: () => get<Dataset[]>("/catalogue/mine") });
  const rows = mine.data ?? [];
  const start = <Link className="btn" data-variant="primary" to="/catalogue/mine/new">List a dataset</Link>;
  return (
    <View
      title="My listings"
      sub="Datasets your organisation sells in the catalogue. Operations review each one before it goes on sale."
      actions={start}
    >
      <CatalogueTabs current="mine" />
      <Panel flush>
        {mine.isLoading ? <Skeleton rows={4} label="Loading your listings" /> : rows.length === 0 ? (
          <Empty
            title="No listings yet"
            hint="List data you already hold. Captures from contracts that were not exclusive appear here as drafts when the contract is delivered."
            action={start}
          />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { header: "Dataset", cell: (r) => r.title, sortBy: (r) => r.title, className: "cell-primary" },
              { header: "From", cell: (r) => (r.source === "contract" ? "A delivered contract" : "Uploaded") },
              {
                header: "Status",
                sortBy: (r) => r.status,
                cell: (r) => {
                  const m = statusMeta(datasetStatus, r.status);
                  return <>
                    <Pill tone={m.tone}>{m.label}</Pill>
                    {!!r.pending_copies && <> <Pill tone="active">Copying {r.pending_copies}</Pill></>}
                    {!!r.open_requests && <> <Pill tone="attention">{r.open_requests} quote request{r.open_requests === 1 ? "" : "s"}</Pill></>}
                  </>;
                },
              },
              { header: "Updated", cell: (r) => fmtDate(r.updated_at), sortBy: (r) => r.updated_at ?? "" },
              { header: "Actions", hideHeader: true, className: "right", cell: (r) => <Link className="btn" data-size="sm" to={`/catalogue/mine/${r.id}`}>Open</Link> },
            ]}
          />
        )}
      </Panel>
    </View>
  );
}

/* --- start a listing ----------------------------------------------------------- */

export function DatasetNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("image");
  const create = useMutation({
    mutationFn: () => post<Dataset>("/catalogue/datasets", { title: title.trim(), category }),
    onSuccess: (d) => navigate(`/catalogue/mine/${d.id}`, { replace: true }),
  });
  return (
    <View title="List a dataset" sub="Start with a name. You add the description, files and samples next.">
      <Panel>
        <form
          className="formgrid"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) create.mutate();
          }}
        >
          <Field label="Title" required span hint="What a buyer would search for: subject, place, scale.">
            {(id) => <input id={id} className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <Field label="Category" required>
            {(id) => (
              <select id={id} className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
          </Field>
          <div style={{ gridColumn: "1 / -1" }} className="btnrow">
            <Button type="submit" variant="primary" disabled={!title.trim() || create.isPending}>
              {create.isPending ? "Creating…" : "Create draft"}
            </Button>
            <Link className="btn" to="/catalogue/mine">Cancel</Link>
          </div>
          {create.isError && <div style={{ gridColumn: "1 / -1" }}><Callout tone="critical" title="Not created">{errText(create.error)}</Callout></div>}
        </form>
      </Panel>
    </View>
  );
}

/* --- manage a listing ------------------------------------------------------------ */

interface Draft {
  title: string; summary: string; description: string; category: string;
  permitted_uses: PermittedUse[]; regions: string[]; languages: string[]; use_cases: string[];
  licence_terms: string; indicative_price_text: string;
}

const toDraft = (d: Dataset): Draft => ({
  title: d.title, summary: d.summary ?? "", description: d.description ?? "", category: d.category ?? "image",
  permitted_uses: d.permitted_uses, regions: d.regions, languages: d.languages, use_cases: d.use_cases,
  licence_terms: d.licence_terms ?? "", indicative_price_text: d.indicative_price_text ?? "",
});

export function DatasetEditorPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const ds = useQuery({
    queryKey: ["catalogue-manage", id],
    queryFn: () => get<Dataset>(`/catalogue/datasets/${id}`),
    // relisted files arrive in the background: keep the page current while any are pending
    refetchInterval: (q) => ((q.state.data?.items ?? []).some((i) => i.copy_status === "pending") ? 10_000 : false),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawItem, setWithdrawItem] = useState<DatasetItem | null>(null);
  const setData = (d: Dataset) => {
    qc.setQueryData(["catalogue-manage", id], d);
    void qc.invalidateQueries({ queryKey: ["catalogue-mine"] });
  };
  // One mutation per move, each named in full so the route scan
  // (backend tests/test_frontend_calls_exist_unit.py) can read its URL.
  const submit = useMutation({
    mutationFn: () => post<Dataset>(`/catalogue/datasets/${id}/submit`),
    onSuccess: (d) => { setData(d); toast("Submitted for review"); },
    onError: (e) => toast("Not submitted", errText(e), "critical"),
  });
  const pullBack = useMutation({
    mutationFn: () => post<Dataset>(`/catalogue/datasets/${id}/pull-back`),
    onSuccess: (d) => { setData(d); toast("Back to draft"); },
    onError: (e) => toast("Not done", errText(e), "critical"),
  });
  const retry = useMutation({
    mutationFn: () => post<Dataset>(`/catalogue/datasets/${id}/retry-copies`),
    onSuccess: (d) => { setData(d); toast("Failed copies will be tried again"); },
    onError: (e) => toast("Not done", errText(e), "critical"),
  });

  const d = ds.data;
  if (ds.isLoading) return <View title="Listing"><Skeleton rows={6} label="Loading the listing" /></View>;
  if (!d) return <View title="Listing"><Panel><Empty title="Listing not found" /></Panel></View>;
  if (!d.is_owner) {
    return <View title={d.title}><Panel><Empty title="This listing belongs to another organisation" action={<Link className="btn" to={`/catalogue/${d.slug}`}>View it</Link>} /></Panel></View>;
  }

  const st = statusMeta(datasetStatus, d.status);
  const editable = d.status === "draft" || d.status === "rejected";
  const version = d.versions?.[d.versions.length - 1];
  const open = version?.status === "open";
  const items = d.items ?? [];
  const pending = items.filter((i) => i.copy_status === "pending").length;
  const failed = items.filter((i) => i.copy_status === "failed").length;

  return (
    <View
      title={d.title}
      sub={<>{d.source === "contract" ? "Relisted from a delivered contract" : "Uploaded"} · {categoryLabel(d.category)} · {sizeText(items.length, items.reduce((n, i) => n + (i.size_bytes ?? 0), 0))}</>}
      actions={
        <>
          <Pill tone={st.tone}>{st.label}</Pill>
          {d.status === "published" && <Link className="btn" to={`/datasets/${d.slug}`}>Public page</Link>}
          {editable && (
            <Button variant="primary" onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          )}
          {d.status === "in_review" && <Button onClick={() => pullBack.mutate()} disabled={pullBack.isPending}>Pull back to edit</Button>}
          {d.status === "published" && <Button variant="danger" onClick={() => setWithdrawing(true)}>Withdraw from sale</Button>}
        </>
      }
    >
      <CatalogueTabs current="mine" />
      {d.status === "rejected" && d.review_note && (
        <Callout tone="critical" title="Operations sent this back">{d.review_note}</Callout>
      )}
      {d.status === "in_review" && (
        <Callout tone="attention" title="With operations for review">
          Submitted {fmtDateTime(d.submitted_at)}. Pull it back if you need to change something.
        </Callout>
      )}
      {d.status === "withdrawn" && (
        <Callout tone="neutral" title="Withdrawn from sale">{d.withdrawn_reason} Licences already issued are unaffected.</Callout>
      )}
      {pending > 0 && (
        <Callout tone="active" title={`Copying ${pending} file${pending === 1 ? "" : "s"} in`}>
          The captures are being copied from the client's storage into the platform's. This page updates by itself.
        </Callout>
      )}
      {version?.notes && <Callout tone="attention" title="Left out">{version.notes}</Callout>}

      <DetailsPanel dataset={d} editable={editable} onSaved={(x) => { setData(x); toast("Saved"); }} />

      <FilesPanel
        dataset={d}
        open={open}
        editable={editable}
        failed={failed}
        onRetry={() => retry.mutate()}
        onChanged={setData}
        onWithdrawItem={setWithdrawItem}
      />

      {withdrawing && (
        <ReasonDialog
          title="Withdraw this listing from sale"
          warning="It leaves the catalogue and the public page. Buyers who already hold a licence keep it and are told."
          confirmLabel="Withdraw"
          onConfirm={(reason) => post<Dataset>(`/catalogue/datasets/${id}/withdraw`, { reason }).then(setData)}
          onClose={() => setWithdrawing(false)}
        />
      )}
      {withdrawItem && (
        <ReasonDialog
          title={`Withdraw ${withdrawItem.filename}`}
          warning="The file stays listed as withdrawn, with your reason, and stops downloading. Every organisation holding a licence on this version is told which file and why."
          confirmLabel="Withdraw the file"
          onConfirm={(reason) => post<Dataset>(`/catalogue/items/${withdrawItem.id}/withdraw`, { reason }).then(setData)}
          onClose={() => setWithdrawItem(null)}
        />
      )}
    </View>
  );
}

function DetailsPanel({ dataset, editable, onSaved }: { dataset: Dataset; editable: boolean; onSaved: (d: Dataset) => void }) {
  const [f, setF] = useState<Draft>(() => toDraft(dataset));
  const base = useRef(JSON.stringify(toDraft(dataset)));
  useEffect(() => {
    // a fresh copy from the server (after a save, a submit) resets the form
    const next = JSON.stringify(toDraft(dataset));
    if (next !== base.current) {
      base.current = next;
      setF(toDraft(dataset));
    }
  }, [dataset]);
  const dirty = JSON.stringify(f) !== base.current;
  const priceOnly = dataset.status === "published";
  const save = useMutation({
    mutationFn: () =>
      patch<Dataset>(`/catalogue/datasets/${dataset.id}`, priceOnly
        ? { indicative_price_text: f.indicative_price_text.trim() || null }
        : {
            ...f,
            title: f.title.trim(),
            summary: f.summary.trim() || null,
            description: f.description.trim() || null,
            licence_terms: f.licence_terms.trim() || null,
            indicative_price_text: f.indicative_price_text.trim() || null,
          }),
    onSuccess: onSaved,
  });
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setF((x) => ({ ...x, [k]: v }));
  const on = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  const locked = !editable;
  return (
    <Panel
      title="What buyers read"
      sub={editable ? "Shown on the catalogue and public pages once published." : priceOnly ? "Published: only the price note can change." : "Locked while in review."}
      foot={(editable || priceOnly) ? (
        <div className="btnrow">
          <Button variant="primary" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          {save.isError && <span className="small" style={{ color: "var(--t-critical)" }}>{errText(save.error)}</span>}
        </div>
      ) : undefined}
    >
      <div className="formgrid">
        <Field label="Title" required span>{(id) => <input id={id} className={inputCls} disabled={locked} value={f.title} onChange={on("title")} />}</Field>
        <Field label="One-line summary" required span hint="The line under the title in the catalogue.">
          {(id) => <input id={id} className={inputCls} disabled={locked} maxLength={400} value={f.summary} onChange={on("summary")} />}
        </Field>
        <Field label="Description" span hint="What is in it, how it was collected, how it is labelled, what it is good for.">
          {(id) => <textarea id={id} className={textareaCls} disabled={locked} style={{ minHeight: 120 }} value={f.description} onChange={on("description")} />}
        </Field>
        <Field label="Category">
          {(id) => (
            <select id={id} className={selectCls} disabled={locked} value={f.category} onChange={on("category")}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Price note" hint="E.g. “From USD [x] per 1,000 images”, or leave blank for “on request”.">
          {(id) => <input id={id} className={inputCls} disabled={locked && !priceOnly} value={f.indicative_price_text} onChange={on("indicative_price_text")} />}
        </Field>
        <Field label="Regions" hint="Country codes or place names.">
          {(id) => <TagInput id={id} value={f.regions} onChange={set("regions")} placeholder={locked ? "" : "Add a region"} />}
        </Field>
        <Field label="Languages">
          {(id) => <TagInput id={id} value={f.languages} onChange={set("languages")} placeholder={locked ? "" : "Add a language"} />}
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <CheckGroup label="Buyers may use it for" options={PERMITTED_USES} value={f.permitted_uses}
            onChange={locked ? () => {} : set("permitted_uses")} columns={3} />
        </div>
        <Field label="Licence terms" required span hint="Your terms, in your words: what buyers may and may not do, and what they must do with a file you later withdraw. The platform does not write these for you.">
          {(id) => <textarea id={id} className={textareaCls} disabled={locked} style={{ minHeight: 140 }} value={f.licence_terms} onChange={on("licence_terms")} />}
        </Field>
      </div>
    </Panel>
  );
}

/** The browser's own SHA-256 of a file, for the buyer's manifest. Skipped for
 *  very large files, which would have to be read whole into memory. */
async function sha256(file: File): Promise<string | null> {
  if (!crypto?.subtle || file.size > 256 * 1024 * 1024) return null;
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function FilesPanel({
  dataset, open, editable, failed, onRetry, onChanged, onWithdrawItem,
}: {
  dataset: Dataset;
  open: boolean;
  editable: boolean;
  failed: number;
  onRetry: () => void;
  onChanged: (d: Dataset) => void;
  onWithdrawItem: (i: DatasetItem) => void;
}) {
  const toast = useToast();
  const items = dataset.items ?? [];
  const [samples, setSamples] = useState<Set<string>>(() => new Set(items.filter((i) => i.is_sample).map((i) => i.id)));
  useEffect(() => {
    setSamples(new Set((dataset.items ?? []).filter((i) => i.is_sample).map((i) => i.id)));
  }, [dataset.items]);
  const [progress, setProgress] = useState<string | null>(null);
  const [preview, setPreview] = useState<DatasetItem | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const samplesDirty = items.some((i) => i.is_sample !== samples.has(i.id));

  const upload = async (files: FileList) => {
    const list = Array.from(files);
    try {
      for (let start = 0; start < list.length; start += 50) {
        const batch = list.slice(start, start + 50);
        const slots = await post<UploadSlot[]>(`/catalogue/datasets/${dataset.id}/upload-urls`, {
          files: batch.map((f) => ({ filename: f.name })),
        });
        const done = [];
        for (let i = 0; i < batch.length; i++) {
          const f = batch[i]!;
          const s = slots[i]!;
          setProgress(`Uploading ${start + i + 1} of ${list.length}: ${f.name}`);
          const r = await xhrPut(s.url, f, { ...s.headers, ...(f.type ? { "Content-Type": f.type } : {}) });
          // Status 0 is the browser refusing before storage answered: almost always
          // a storage account whose CORS rules do not list this site's origin.
          if (r.status === 0) {
            throw new Error(
              `${f.name} did not upload: the browser could not reach storage. Check the connection, and that the ` +
              `storage account allows uploads from ${window.location.origin} (CORS).`,
            );
          }
          if (r.status < 200 || r.status >= 300) throw new Error(`${f.name} did not upload (${r.status})`);
          done.push({ key: s.key, filename: f.name, content_type: f.type || null, sha256: await sha256(f) });
        }
        setProgress(`Recording ${list.length} file${list.length === 1 ? "" : "s"}…`);
        onChanged(await post<Dataset>(`/catalogue/datasets/${dataset.id}/items`, { uploads: done }));
      }
      toast(`${list.length} file${list.length === 1 ? "" : "s"} added`);
    } catch (e) {
      toast("Upload stopped", errText(e), "critical");
    } finally {
      setProgress(null);
      if (picker.current) picker.current.value = "";
    }
  };

  const saveSamples = useMutation({
    mutationFn: () => put<Dataset>(`/catalogue/datasets/${dataset.id}/samples`, { item_ids: Array.from(samples) }),
    onSuccess: (d) => { onChanged(d); toast("Samples saved"); },
    onError: (e) => toast("Samples not saved", errText(e), "critical"),
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => del<Dataset>(`/catalogue/datasets/${dataset.id}/items/${itemId}`),
    onSuccess: onChanged,
    onError: (e) => toast("Not removed", errText(e), "critical"),
  });
  const toggle = (itemId: string) =>
    setSamples((s) => {
      const n = new Set(s);
      if (n.has(itemId)) n.delete(itemId);
      else n.add(itemId);
      return n;
    });

  return (
    <Panel
      title="Files"
      sub={open ? "Tick the files the public may see as samples. Everything else is only for buyers who hold a licence." : "This version is final: what buyers licensed."}
      actions={
        <>
          {failed > 0 && open && <Button size="sm" onClick={onRetry}>Retry {failed} failed</Button>}
          {open && editable && (
            <>
              <input ref={picker} type="file" multiple hidden onChange={(e) => e.target.files && void upload(e.target.files)} />
              <Button size="sm" variant="primary" disabled={!!progress} onClick={() => picker.current?.click()}>Add files</Button>
            </>
          )}
          {open && editable && samplesDirty && (
            <Button size="sm" variant="primary" disabled={saveSamples.isPending} onClick={() => saveSamples.mutate()}>Save samples</Button>
          )}
        </>
      }
      flush
    >
      {progress && <div style={{ padding: 12 }}><Callout tone="active" title="Uploading">{progress}</Callout></div>}
      {items.length === 0 ? (
        <Empty title="No files yet" hint={dataset.source === "contract" ? "They are being copied in." : "Add the files buyers will license."} />
      ) : (
        <DataTable
          rows={items}
          rowKey={(r) => r.id}
          filter={{ label: "Filter files", placeholder: "Filter by name…", text: (r) => r.filename }}
          columns={[
            {
              header: "Sample",
              cell: (r) => (
                <input type="checkbox" aria-label={`${r.filename} is a public sample`} checked={samples.has(r.id)}
                  disabled={!open || !editable || r.copy_status !== "copied"} onChange={() => toggle(r.id)} />
              ),
            },
            {
              header: "File",
              className: "cell-primary",
              sortBy: (r) => r.filename,
              cell: (r) => (
                <button type="button" onClick={() => setPreview(r)} disabled={r.copy_status !== "copied"}
                  style={{ background: "none", border: 0, padding: 0, color: "var(--accent)", cursor: "pointer", textAlign: "left" }}>
                  {r.filename}
                </button>
              ),
            },
            { header: "Size", className: "num", cell: (r) => fmtBytes(r.size_bytes), sortBy: (r) => r.size_bytes ?? 0 },
            { header: "Captured", cell: (r) => fmtDate(r.captured_at) },
            {
              header: "State",
              cell: (r) =>
                r.withdrawn_at ? <Pill tone="neutral">Withdrawn</Pill>
                  : r.copy_status === "pending" ? <Pill tone="active">Copying</Pill>
                  : r.copy_status === "failed" ? <span title={r.copy_error ?? ""}><Pill tone="critical">Copy failed</Pill></span>
                  : <Pill tone="success">Ready</Pill>,
            },
            {
              header: "Actions",
              hideHeader: true,
              className: "right",
              cell: (r) => (
                <div className="rowactions">
                  {open && editable && (
                    <Button size="sm" onClick={() => remove.mutate(r.id)} disabled={remove.isPending}>Remove</Button>
                  )}
                  {!open && !r.withdrawn_at && (
                    <Button size="sm" variant="danger" onClick={() => onWithdrawItem(r)}>Withdraw</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      {preview && (
        <Dialog title={preview.filename} onClose={() => setPreview(null)} size="wide" foot={<Button onClick={() => setPreview(null)}>Close</Button>}>
          <ItemPreview item={preview} height={420} />
          <Dl rows={[
            ["Size", fmtBytes(preview.size_bytes)],
            ["SHA-256", <span key="h" className="mono small" style={{ overflowWrap: "anywhere" }}>{preview.sha256 ?? "—"}</span>],
            ["Captured", fmtDateTime(preview.captured_at)],
            ...(preview.withdrawn_at ? [["Withdrawn", `${fmtDate(preview.withdrawn_at)} — ${preview.withdrawn_reason}`] as [string, string]] : []),
          ]} />
        </Dialog>
      )}
    </Panel>
  );
}
