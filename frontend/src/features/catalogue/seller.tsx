// catalogue — a seller's listings: start one, say how many files it holds,
// add a few samples, submit for review; afterwards withdraw it from sale.
//
// Two ways a listing exists: created here (the seller gives the count and
// uploads samples), or opened as a draft when the partner lists an approved,
// non-exclusive contract (the count comes from the accepted captures, and the
// partner picks some of them as samples, which the platform copies in). The
// rest of a dataset never comes onto the platform: the seller hands over what
// a buyer agrees to take. Only Ops publishes a listing (db/390, db/420).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, del, get, patch, post, put, xhrPut } from "@api/client";
import type { ContractCapture, Dataset, PermittedUse, UploadSlot } from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Empty, Field, inputCls, Panel, Pill, selectCls,
  Skeleton, TagInput, textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDate, fmtDateTime } from "@shared/format";
import { ReasonDialog } from "@shared/reason-dialog";
import { datasetStatus, statusMeta } from "@shared/status";
import { PERMITTED_USES } from "@features/marketplace/vocabularies";
import { CatalogueTabs } from "./buyer";
import { CATEGORIES, categoryLabel, fmtBytes, Preview, SamplePreview, sizeText } from "./shared";

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
const MAX_SAMPLES = 50;

/* --- my listings ---------------------------------------------------------------- */

export function MyDatasetsPage() {
  const mine = useQuery({ queryKey: ["catalogue-mine"], queryFn: () => get<Dataset[]>("/catalogue/mine") });
  const rows = mine.data ?? [];
  const start = <Link className="btn" data-variant="primary" to="/catalogue/mine/new">List a dataset</Link>;
  return (
    <View
      title="My listings"
      sub="Datasets your organisation offers in the catalogue. Operations review each one before it goes on sale."
      actions={start}
    >
      <CatalogueTabs current="mine" />
      <Panel flush>
        {mine.isLoading ? <Skeleton rows={4} label="Loading your listings" /> : rows.length === 0 ? (
          <Empty
            title="No listings yet"
            hint="List data you already hold. A contract that was not exclusive can be listed from its page once the client approves the delivery."
            action={start}
          />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { header: "Dataset", cell: (r) => r.title, sortBy: (r) => r.title, className: "cell-primary" },
              { header: "From", cell: (r) => (r.source === "contract" ? "An approved contract" : "Your own data") },
              { header: "Files", className: "num", cell: (r) => r.file_count.toLocaleString(), sortBy: (r) => r.file_count },
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
  const [count, setCount] = useState("");
  const n = Number(count);
  const ready = title.trim() && Number.isInteger(n) && n > 0;
  const create = useMutation({
    mutationFn: () => post<Dataset>("/catalogue/datasets", { title: title.trim(), category, file_count: n }),
    onSuccess: (d) => navigate(`/catalogue/mine/${d.id}`, { replace: true }),
  });
  return (
    <View title="List a dataset" sub="Start with a name and how many files it holds. You add the description and samples next.">
      <Panel>
        <form
          className="formgrid"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) create.mutate();
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
          <Field label="Number of files" required hint="How many files the dataset holds. Buyers ask for all or part of it.">
            {(id) => <input id={id} className={inputCls} inputMode="numeric" value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))} />}
          </Field>
          <div style={{ gridColumn: "1 / -1" }} className="btnrow">
            <Button type="submit" variant="primary" disabled={!ready || create.isPending}>
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
  licence_terms: string; indicative_price_text: string; file_count: string;
}

const toDraft = (d: Dataset): Draft => ({
  title: d.title, summary: d.summary ?? "", description: d.description ?? "", category: d.category ?? "image",
  permitted_uses: d.permitted_uses, regions: d.regions, languages: d.languages, use_cases: d.use_cases,
  licence_terms: d.licence_terms ?? "", indicative_price_text: d.indicative_price_text ?? "",
  file_count: String(d.file_count ?? 0),
});

export function DatasetEditorPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const ds = useQuery({
    queryKey: ["catalogue-manage", id],
    queryFn: () => get<Dataset>(`/catalogue/datasets/${id}`),
    // picked samples are copied in the background: keep the page current while any are pending
    refetchInterval: (q) => ((q.state.data?.samples ?? []).some((s) => s.copy_status === "pending") ? 10_000 : false),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  });
  const [withdrawing, setWithdrawing] = useState(false);
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

  const d = ds.data;
  if (ds.isLoading) return <View title="Listing"><Skeleton rows={6} label="Loading the listing" /></View>;
  if (!d) return <View title="Listing"><Panel><Empty title="Listing not found" /></Panel></View>;
  if (!d.is_owner) {
    return <View title={d.title}><Panel><Empty title="This listing belongs to another organisation" action={<Link className="btn" to={`/catalogue/${d.slug}`}>View it</Link>} /></Panel></View>;
  }

  const st = statusMeta(datasetStatus, d.status);
  const editable = d.status === "draft" || d.status === "rejected";
  const pending = (d.samples ?? []).filter((s) => s.copy_status === "pending").length;

  return (
    <View
      title={d.title}
      sub={<>{d.source === "contract" ? "From an approved contract" : "Your own data"} · {categoryLabel(d.category)} · {sizeText(d.file_count, d.total_bytes)}</>}
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
        <Callout tone="neutral" title="Withdrawn from sale">{d.withdrawn_reason} Deals already agreed stand.</Callout>
      )}
      {pending > 0 && (
        <Callout tone="active" title={`Copying ${pending} sample${pending === 1 ? "" : "s"} in`}>
          The captures you picked are being copied from the client's storage into the platform's. This page updates by itself.
        </Callout>
      )}

      <DetailsPanel dataset={d} editable={editable} onSaved={(x) => { setData(x); toast("Saved"); }} />
      <SamplesPanel dataset={d} editable={editable} onChanged={setData} />

      {withdrawing && (
        <ReasonDialog
          title="Withdraw this listing from sale"
          warning="It leaves the catalogue and the public page. Buyers still negotiating are told; deals already agreed stand."
          confirmLabel="Withdraw"
          onConfirm={(reason) => post<Dataset>(`/catalogue/datasets/${id}/withdraw`, { reason }).then(setData)}
          onClose={() => setWithdrawing(false)}
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
  // a contract listing holds what the contract delivered: counted, not typed
  const counted = dataset.source === "contract";
  const n = Number(f.file_count);
  const save = useMutation({
    mutationFn: () =>
      patch<Dataset>(`/catalogue/datasets/${dataset.id}`, priceOnly
        ? { indicative_price_text: f.indicative_price_text.trim() || null }
        : {
            title: f.title.trim(),
            summary: f.summary.trim() || null,
            description: f.description.trim() || null,
            category: f.category,
            permitted_uses: f.permitted_uses,
            regions: f.regions,
            languages: f.languages,
            use_cases: f.use_cases,
            licence_terms: f.licence_terms.trim() || null,
            indicative_price_text: f.indicative_price_text.trim() || null,
            ...(counted ? {} : { file_count: Number.isInteger(n) ? n : 0 }),
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
        <Field label="Number of files" required hint={counted ? "Counted from the contract's accepted captures." : "How many files the dataset holds."}>
          {(id) => <input id={id} className={inputCls} inputMode="numeric" disabled={locked || counted} value={f.file_count}
            onChange={(e) => setF((x) => ({ ...x, file_count: e.target.value.replace(/[^0-9]/g, "") }))} />}
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
        <Field label="Licence terms" required span hint="Your terms, in your words: what buyers may and may not do with the files you hand over. The platform does not write these for you.">
          {(id) => <textarea id={id} className={textareaCls} disabled={locked} style={{ minHeight: 140 }} value={f.licence_terms} onChange={on("licence_terms")} />}
        </Field>
      </div>
    </Panel>
  );
}

/** The few files shown on the listing. Uploaded for your own data; picked
 *  from the accepted captures for a contract listing. */
function SamplesPanel({ dataset, editable, onChanged }: { dataset: Dataset; editable: boolean; onChanged: (d: Dataset) => void }) {
  const toast = useToast();
  const samples = dataset.samples ?? [];
  const [progress, setProgress] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const failed = samples.filter((s) => s.copy_status === "failed").length;
  const contract = dataset.source === "contract";

  const upload = async (files: FileList) => {
    const list = Array.from(files);
    try {
      const slots = await post<UploadSlot[]>(`/catalogue/datasets/${dataset.id}/upload-urls`, {
        files: list.map((f) => ({ filename: f.name })),
      });
      const done = [];
      for (let i = 0; i < list.length; i++) {
        const f = list[i]!;
        const s = slots[i]!;
        setProgress(`Uploading ${i + 1} of ${list.length}: ${f.name}`);
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
        done.push({ key: s.key, filename: f.name, content_type: f.type || null });
      }
      setProgress(`Recording ${list.length} sample${list.length === 1 ? "" : "s"}…`);
      onChanged(await post<Dataset>(`/catalogue/datasets/${dataset.id}/samples`, { uploads: done }));
      toast(`${list.length} sample${list.length === 1 ? "" : "s"} added`);
    } catch (e) {
      toast("Upload stopped", errText(e), "critical");
    } finally {
      setProgress(null);
      if (picker.current) picker.current.value = "";
    }
  };

  const remove = useMutation({
    mutationFn: (sampleId: string) => del<Dataset>(`/catalogue/datasets/${dataset.id}/samples/${sampleId}`),
    onSuccess: onChanged,
    onError: (e) => toast("Not removed", errText(e), "critical"),
  });
  const retry = useMutation({
    mutationFn: () => post<Dataset>(`/catalogue/datasets/${dataset.id}/retry-copies`),
    onSuccess: (d) => { onChanged(d); toast("Failed copies will be tried again"); },
    onError: (e) => toast("Not done", errText(e), "critical"),
  });

  return (
    <Panel
      title="Samples"
      sub={`What buyers see before they ask: up to ${MAX_SAMPLES} files. The rest of the dataset stays with you; you hand over what a buyer agrees to take.`}
      actions={
        <>
          {failed > 0 && editable && <Button size="sm" onClick={() => retry.mutate()} disabled={retry.isPending}>Retry {failed} failed</Button>}
          {editable && contract && <Button size="sm" variant="primary" onClick={() => setPicking(true)}>Pick from the captures</Button>}
          {editable && !contract && (
            <>
              <input ref={picker} type="file" multiple hidden accept="image/*,video/*"
                onChange={(e) => e.target.files && void upload(e.target.files)} />
              <Button size="sm" variant="primary" disabled={!!progress || samples.length >= MAX_SAMPLES} onClick={() => picker.current?.click()}>Add samples</Button>
            </>
          )}
        </>
      }
    >
      {progress && <Callout tone="active" title="Uploading">{progress}</Callout>}
      {samples.length === 0 ? (
        <Empty
          title="No samples yet"
          hint={contract ? "Pick a few of the contract's captures to show buyers." : "Upload a few files that show what the dataset holds."}
        />
      ) : (
        <div className="samplegrid">
          {samples.map((s) => (
            <figure key={s.id}>
              <SamplePreview sample={s} height={130} />
              <figcaption>
                {s.filename}
                {s.copy_status === "pending" && <> · <Pill tone="active">Copying</Pill></>}
                {s.copy_status === "failed" && <> · <span title={s.copy_error ?? ""}><Pill tone="critical">Copy failed</Pill></span></>}
                {editable && !contract && (
                  <> · <button type="button" onClick={() => remove.mutate(s.id)} disabled={remove.isPending}
                    style={{ background: "none", border: 0, padding: 0, color: "var(--accent)", cursor: "pointer" }}>Remove</button></>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {picking && <PickSamplesDialog dataset={dataset} onClose={() => setPicking(false)} onChanged={onChanged} />}
    </Panel>
  );
}

/** Pick a contract listing's samples from its accepted captures. The ones
 *  picked are copied in; the rest of the captures stay where they are. */
function PickSamplesDialog({ dataset, onClose, onChanged }: { dataset: Dataset; onClose: () => void; onChanged: (d: Dataset) => void }) {
  const toast = useToast();
  const captures = useQuery({
    queryKey: ["catalogue-captures", dataset.id],
    queryFn: () => get<ContractCapture[]>(`/catalogue/datasets/${dataset.id}/captures`),
  });
  const [picked, setPicked] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (captures.data && picked === null) setPicked(new Set(captures.data.filter((c) => c.picked).map((c) => c.asset_id)));
  }, [captures.data, picked]);
  const chosen = picked ?? new Set<string>();
  const save = useMutation({
    mutationFn: () => put<Dataset>(`/catalogue/datasets/${dataset.id}/picked-samples`, { asset_ids: Array.from(chosen) }),
    onSuccess: (d) => { onChanged(d); toast("Samples saved", "The new ones are being copied in."); onClose(); },
  });
  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s ?? []);
      if (n.has(id)) n.delete(id);
      else if (n.size < MAX_SAMPLES) n.add(id);
      return n;
    });
  const rows = captures.data ?? [];
  return (
    <Dialog
      title="Pick samples from the captures"
      sub={`${chosen.size} of up to ${MAX_SAMPLES} picked · ${rows.length.toLocaleString()} capture${rows.length === 1 ? "" : "s"} shown`}
      onClose={onClose}
      size="wide"
      busy={save.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={save.isPending || picked === null} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save samples"}
          </Button>
        </>
      }
    >
      {captures.isLoading ? <Skeleton rows={4} label="Loading the captures" /> : captures.isError ? (
        <Callout tone="critical" title="The captures could not be loaded">{errText(captures.error)}</Callout>
      ) : rows.length === 0 ? (
        <Empty title="No accepted captures" />
      ) : (
        <div className="samplegrid">
          {rows.map((c) => (
            <figure key={c.asset_id}>
              <label style={{ cursor: "pointer", display: "block" }}>
                <Preview src={c.url ?? undefined} mime={c.mime_type} name={c.filename ?? c.asset_id} height={120} />
                <figcaption>
                  <input type="checkbox" checked={chosen.has(c.asset_id)} onChange={() => toggle(c.asset_id)}
                    aria-label={`Use ${c.filename ?? "this capture"} as a sample`} />{" "}
                  {c.filename ?? "Capture"} · {fmtBytes(c.size_bytes)}
                </figcaption>
              </label>
            </figure>
          ))}
        </div>
      )}
      {save.isError && <Callout tone="critical" title="Not saved">{errText(save.error)}</Callout>}
    </Dialog>
  );
}
