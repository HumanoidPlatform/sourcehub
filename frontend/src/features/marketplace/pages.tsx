// marketplace — the five-step request builder, requests, opportunities,
// proposal comparison and the award.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, patch, post, putFile } from "@api/client";
import type { ClientProfile, Org, Proposal, Rfp, SamplePresign, StorageTarget } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, FileField, inputCls, Panel, Pill, RowMenu,
  Skeleton, StageRail, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money, titleCase } from "@shared/format";
import {
  AttachmentList, AttachmentsField, attachmentPayload, fromServer, type AttachmentDraft,
} from "@shared/attachments";
import { OrgProfileDialog } from "@shared/org-profile";
import {
  LIFECYCLE, proposalStatus, requestStatus, statusMeta, waitingOn,
} from "@shared/status";

const CATEGORIES = [
  ["image", "Image"],
  ["video", "Video"],
  ["structured_data", "Structured data"],
  ["unstructured_data", "Unstructured data"],
  ["people_deliverable", "People-based deliverable"],
] as const;

/* --- client: requests list -------------------------------------------------- */

export function RequestsPage() {
  const [q, setQ] = useState("");
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => get<Rfp[]>("/requests") });
  const rows = (requests.data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.reference_code.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <View
      title="Requests"
      sub="Everything you have drafted, published or seen through to completion."
      actions={<Link to="/requests/new" className="btn" data-variant="primary">New request</Link>}
    >
      <input
        className={inputCls}
        placeholder="Filter by title or reference…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 360 }}
        aria-label="Filter requests"
      />
      <Panel>
        {requests.isLoading ? (
          // Without this the empty state rendered while the query was in
          // flight — "No requests yet" to a client who has ten.
          <Skeleton rows={5} label="Loading your requests" />
        ) : rows.length === 0 ? (
          q ? (
            <Empty title="Nothing matches that" hint="Clear the filter to see every request." />
          ) : (
            <Empty
              title="No requests yet"
              hint="Publish one and every delivery partner is notified."
              action={<Link to="/requests/new" className="btn" data-variant="primary">New request</Link>}
            />
          )
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>Title</th><th>Category</th><th>Budget</th>
                  <th>Status</th><th>Waiting on</th><th>Proposals</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const meta = statusMeta(requestStatus, r.status);
                  return (
                    <tr key={r.id}>
                      <td className="id">{r.reference_code}</td>
                      <td className="cell-primary">{r.title}</td>
                      <td>{titleCase(r.category)}</td>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>{money(r.budget_min)} – {money(r.budget_max)}</td>
                      <td><Pill tone={meta.tone}>{meta.label}</Pill></td>
                      <td>{waitingOn(meta, "client")}</td>
                      <td className="num">{r.proposal_count}</td>
                      <td className="right"><div className="rowactions">
                        {r.status === "draft" && (
                          <Link className="btn" data-size="sm" to={`/requests/${r.id}/edit`}>Edit</Link>
                        )}
                        <Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Open</Link>
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
    </View>
  );
}

/* --- client: the five-step builder ------------------------------------------ */

const STEPS = ["Basics", "Specification", "People", "Commercials", "Destination", "Review"] as const;

interface Draft {
  title: string; category: string; geography: string; compliance_notes: string;
  spec_format: string; spec_quantity: string; spec_quality: string; acceptance: string;
  people_headcount: string; people_training: string; people_experience: string; people_certification: string;
  budget_min: string; budget_max: string; starts_on: string; delivery_due_on: string;
  storage_target_id: string;
}

const BLANK: Draft = {
  title: "", category: "image", geography: "", compliance_notes: "",
  spec_format: "", spec_quantity: "", spec_quality: "", acceptance: "",
  people_headcount: "", people_training: "", people_experience: "", people_certification: "",
  budget_min: "", budget_max: "", starts_on: "", delivery_due_on: "",
  storage_target_id: "",
};

// Mirrors the server's rules (marketplace service) so most violations are
// caught before a byte moves. The server re-checks everything.
const MAX_SAMPLE_BYTES = 25 * 1024 * 1024;
const MAX_SAMPLES = 5;
const SAMPLE_ACCEPT =
  ".csv,.tsv,.json,.jsonl,.xml,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.mp3,.wav,.zip,.xlsx,.docx,.parquet";

interface SampleDraft {
  key: string; // storage_key once presigned; empty for files already attached
  /** already on the request — shown in the editor, never re-sent on save */
  existing?: boolean;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  status: "uploading" | "done" | "error";
}

// Doubles as the draft editor: with an :id in the path it loads that draft and
// PATCHes instead of POSTing. Same fields, same validation — a second form for
// editing would be the same form, drifting.
export function RequestNewPage() {
  const { id } = useParams();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(BLANK);
  const [samples, setSamples] = useState<SampleDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Kept out of Draft because these are uploads, not form values: they
  // exist in storage before the request row does.
  const [complianceFiles, setComplianceFiles] = useState<AttachmentDraft[]>([]);
  const [acceptanceFiles, setAcceptanceFiles] = useState<AttachmentDraft[]>([]);
  const targets = useTargets();
  const targetIsVerified = (tid: string) =>
    !!(targets.data ?? []).find((t) => t.id === tid)?.verified_at;
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const existing = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  // populate once, so typing is never overwritten by a refetch
  if (id && existing.data && !loaded) {
    const r = existing.data;
    setD({
      title: r.title ?? "", category: r.category ?? "image",
      geography: r.geography ?? "", compliance_notes: r.compliance_notes ?? "",
      spec_format: r.spec?.format ?? "", spec_quantity: r.spec?.quantity ?? "",
      spec_quality: r.spec?.quality ?? "", acceptance: r.acceptance ?? "",
      people_headcount: String(r.people?.headcount ?? ""),
      people_training: r.people?.training ?? "",
      people_experience: r.people?.experience ?? "",
      people_certification: r.people?.certification ?? "",
      budget_min: r.budget_min ?? "", budget_max: r.budget_max ?? "",
      starts_on: r.starts_on ?? "", delivery_due_on: r.delivery_due_on ?? "",
      storage_target_id: r.storage_target_id ?? "",
    });
    const files = r.attachments ?? [];
    setComplianceFiles(fromServer(files.filter((a) => a.slot === "compliance")));
    setAcceptanceFiles(fromServer(files.filter((a) => a.slot === "acceptance")));
    // files already attached, so the editor shows what the draft actually has
    setSamples(
      (r.samples ?? []).map((x) => ({
        key: "", filename: x.filename,
        content_type: x.content_type, size_bytes: x.size_bytes,
        status: "done" as const, existing: true,
      })),
    );
    setLoaded(true);
  }

  const set = (k: keyof Draft) => (e: { target: { value: string } }) =>
    // Clear the banner as soon as the person acts on it. It used to survive
    // until the next Continue, so a corrected field sat under a stale error.
    setD((x) => { if (error) setError(null); return { ...x, [k]: e.target.value }; });

  const pickSamples = (files: FileList) => {
    setError(null);
    const room = MAX_SAMPLES - samples.length;
    const picked = Array.from(files);
    if (picked.length > room) {
      setError(`At most ${MAX_SAMPLES} sample files per request.`);
      return;
    }
    for (const file of picked) {
      if (file.size > MAX_SAMPLE_BYTES) {
        setError(`${file.name} is over the 25 MB cap.`);
        continue;
      }
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!SAMPLE_ACCEPT.split(",").includes(ext)) {
        setError(`Files of type ${ext} are not accepted.`);
        continue;
      }
      const draft: SampleDraft = {
        key: "", filename: file.name, content_type: file.type || null,
        size_bytes: file.size, status: "uploading",
      };
      setSamples((xs) => [...xs, draft]);
      void (async () => {
        try {
          const p = await post<SamplePresign>("/requests/samples/presign", {
            filename: file.name, content_type: file.type || null, size_bytes: file.size,
          });
          await putFile(p.url, file);
          setSamples((xs) =>
            xs.map((s) => (s === draft ? { ...s, key: p.storage_key, filename: p.filename, status: "done" } : s)),
          );
        } catch (err) {
          setSamples((xs) => xs.map((s) => (s === draft ? { ...s, status: "error" } : s)));
          setError(err instanceof Error ? err.message : `Could not upload ${file.name}`);
        }
      })();
    }
  };

  const doneSamples = samples.filter((s) => s.status === "done");
  const newSamples = doneSamples.filter((s) => !s.existing);

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const body = {
        ...d,
        people_headcount: Number(d.people_headcount) || 0,
        budget_min: d.budget_min || null,
        budget_max: d.budget_max || null,
        starts_on: d.starts_on || null,
        delivery_due_on: d.delivery_due_on || null,
        storage_target_id: d.storage_target_id || null,
        attachments: [
          ...attachmentPayload(complianceFiles, "compliance"),
          ...attachmentPayload(acceptanceFiles, "acceptance"),
        ],
        publish,
        samples: newSamples.map((s) => ({
          storage_key: s.key, filename: s.filename,
          content_type: s.content_type, size_bytes: s.size_bytes,
        })),
      };
      if (!id) return post<Rfp>("/requests", body);

      // PATCH cannot publish. The router drops `publish` from the body and
      // update_request never reads it, so the old single call saved the draft,
      // left it a draft, notified nobody — and still toasted "published". Save
      // first, then publish through the endpoint that actually does it, which
      // is also the one that checks the destination is reachable.
      const saved = await patch<Rfp>(`/requests/${id}`, body);
      return publish ? await post<Rfp>(`/requests/${id}/publish`) : saved;
    },
    onSuccess: (r, publish) => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
      // The detail page we are about to land on reads this key, and with a
      // 15s staleTime it would otherwise render what the request said before
      // the edit.
      void qc.invalidateQueries({ queryKey: ["request", r.id] });
      toast(
        publish ? "Request published" : id ? "Draft updated" : "Draft saved",
        publish
          ? "Every delivery partner can bid on it now."
          : `${r.reference_code} is waiting in your requests.`,
        "success",
      );
      navigate(`/requests/${r.id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  // Every problem on this step, not the first one found: fixing one field and
  // being told about the next is a worse form than being told both at once.
  const validateStep = (): string[] => {
    const problems: string[] = [];
    if (step === 0 && !d.title.trim()) problems.push("Give the request a title.");
    if (step === 0 && !d.category.trim()) problems.push("Choose a category.");
    if (step === 1 && !d.spec_quantity.trim())
      problems.push("Say how much you need — partners cannot price a blank quantity.");
    if ((step === 1 || step === 5) && samples.some((s) => s.status === "uploading"))
      problems.push("Wait for sample uploads to finish.");
    if (step === 0 && complianceFiles.some((a) => a.status === "uploading"))
      problems.push("Wait for the compliance attachment to finish uploading.");
    if (step === 1 && acceptanceFiles.some((a) => a.status === "uploading"))
      problems.push("Wait for the acceptance attachment to finish uploading.");
    // Deliberately not checked here. A draft may be saved without a
    // destination — the API says so in as many words — and blocking Continue
    // meant there was no way to reach a save button without one. It is
    // enforced at publish instead, by publishProblems() below.
    if (step === 3) {
      if (d.budget_min && d.budget_max && Number(d.budget_max) < Number(d.budget_min))
        problems.push("Budget maximum must be at least the minimum.");
      if (d.starts_on && d.delivery_due_on && d.delivery_due_on < d.starts_on)
        problems.push("Delivery must be on or after the start.");
    }
    return problems;
  };

  // What publishing needs that a draft does not. Checked before the confirm
  // dialog opens, so a request cannot get six steps in and fail on the server.
  const publishProblems = (): string[] => {
    const problems: string[] = [];
    if (!d.title.trim()) problems.push("Give the request a title.");
    if (d.title.trim().length < 3) problems.push("The title needs at least three characters.");
    if (!d.spec_quantity.trim())
      problems.push("Say how much you need — partners cannot price a blank quantity.");
    if (!d.storage_target_id) problems.push("Choose where captured data should be delivered.");
    else if (!targetIsVerified(d.storage_target_id))
      problems.push("Test the connection to your delivery destination first.");
    if (samples.some((s) => s.status === "uploading"))
      problems.push("Wait for sample uploads to finish.");
    return problems;
  };

  const next = () => {
    const problems = validateStep();
    if (problems.length) return setError(problems.join(" "));
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const askToPublish = () => {
    const problems = publishProblems();
    if (problems.length) return setError(problems.join(" "));
    setError(null);
    setConfirming(true);
  };

  // Editing shows a fully interactive blank form until the GET lands, and the
  // hydration above then replaces the whole draft — so anything typed in that
  // window was silently discarded.
  if (id && existing.isLoading) {
    return (
      <View title="Loading the draft…">
        <Panel><Skeleton rows={6} label="Loading this request" /></Panel>
      </View>
    );
  }
  if (id && existing.isError) {
    return (
      <View title="Request not found">
        <Panel>
          <Callout tone="critical" title="This request could not be opened">
            It may have been published already, or belong to another organisation.
            Only a draft can be edited.
          </Callout>
          <div className="btnrow"><Button onClick={() => navigate("/requests")}>Back to requests</Button></div>
        </Panel>
      </View>
    );
  }

  return (
    <View
      title={id ? `Edit ${existing.data?.reference_code ?? "draft"}` : "New request"}
      sub="The defaults are honest — anything you skip is marked 'to be agreed', never hidden."
    >
      {/* The chip that used to live here was aria-hidden, so the only progress
          affordance on the page was invisible to assistive tech. The rail is
          what the prototype had, and this file already renders one. */}
      <Panel flush>
        <StageRail stages={STEPS} current={STEPS[step]!} />
      </Panel>
      <Panel>
        {step === 0 && (
          <div className="formgrid">
            <Field label="Request title" required span>
              {(id) => <input id={id} className={inputCls} value={d.title} onChange={set("title")} placeholder="Retail shelf imagery across 12 metro markets" />}
            </Field>
            <Field label="Category" required>
              {(id) => (
                <select id={id} className={inputCls} value={d.category} onChange={set("category")}>
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Geography">
              {(id) => <input id={id} className={inputCls} value={d.geography} onChange={set("geography")} placeholder="United States — 12 metro areas" />}
            </Field>
            <Field label="Compliance notes" span>
              {(id) => <textarea id={id} className={textareaCls} rows={3} value={d.compliance_notes} onChange={set("compliance_notes")} placeholder="No shoppers or faces in frame." />}
            </Field>
            <AttachmentsField
              label="Compliance documents"
              span
              hint="A DPA, site-access rules, a privacy notice — whatever the notes above refer to. Partners can read these while bidding."
              items={complianceFiles}
              onChange={setComplianceFiles}
            />
          </div>
        )}
        {step === 1 && (
          <div className="formgrid">
            <Field label="Deliverable format">
              {(id) => <input id={id} className={inputCls} value={d.spec_format} onChange={set("spec_format")} placeholder="JPEG, minimum 12MP" />}
            </Field>
            <Field label="Quantity" required>
              {(id) => <input id={id} className={inputCls} value={d.spec_quantity} onChange={set("spec_quantity")} placeholder="25,000 images" />}
            </Field>
            <Field label="Resolution, duration and quality bar" span>
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.spec_quality} onChange={set("spec_quality")} />}
            </Field>
            <AttachmentsField
              label="Acceptance documents"
              span
              hint="A rubric, a spec sheet, a worked example of a pass and a fail."
              items={acceptanceFiles}
              onChange={setAcceptanceFiles}
            />
            <Field label="Acceptance criteria" span hint="Frozen into the contract at award — disputes are arbitrated against this.">
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.acceptance} onChange={set("acceptance")} placeholder="95% or better pass on the automated blur check; 5% manual audit sample" />}
            </Field>
            <Field label="Sample data (optional)" span hint={`Reference material, not the deliverable — a spec sheet, a style guide, examples of what good looks like. Up to ${MAX_SAMPLES} files, 25 MB each.`}>
              {() => (
                <FileField
                  label="Attach sample files"
                  accept={SAMPLE_ACCEPT}
                  disabled={samples.length >= MAX_SAMPLES}
                  files={samples.map((s) => ({
                    name: s.filename, size: s.size_bytes, status: s.status, locked: s.existing,
                  }))}
                  onPick={pickSamples}
                  onRemove={(i) =>
                    setSamples((xs) => (xs[i]?.existing ? xs : xs.filter((_, j) => j !== i)))
                  }
                />
              )}
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="formgrid">
            <Field label="Headcount required">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.people_headcount} onChange={set("people_headcount")} />}
            </Field>
            <Field label="Certification required">
              {(id) => <input id={id} className={inputCls} value={d.people_certification} onChange={set("people_certification")} />}
            </Field>
            <Field label="Training required" span>
              {(id) => <input id={id} className={inputCls} value={d.people_training} onChange={set("people_training")} />}
            </Field>
            <Field label="Experience required" span>
              {(id) => <input id={id} className={inputCls} value={d.people_experience} onChange={set("people_experience")} />}
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="formgrid">
            <Field label="Budget minimum (USD)">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_min} onChange={set("budget_min")} />}
            </Field>
            <Field label="Budget maximum (USD)">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_max} onChange={set("budget_max")} />}
            </Field>
            <Field label="Project start">
              {(id) => <input id={id} className={inputCls} type="date" value={d.starts_on} onChange={set("starts_on")} />}
            </Field>
            <Field label="Delivery deadline">
              {(id) => <input id={id} className={inputCls} type="date" value={d.delivery_due_on} onChange={set("delivery_due_on")} />}
            </Field>
          </div>
        )}
        {step === 4 && (
          <DestinationStep
            value={d.storage_target_id}
            onChange={(v) => setD((x) => ({ ...x, storage_target_id: v }))}
          />
        )}
        {/* Every row the server will fill a default into, including the six
            that used to be missing here. The page promises that anything
            skipped is "marked 'to be agreed', never hidden" — and partners
            read these exact words in the brief, so this is the last chance to
            see them. The fallbacks mirror _DEFAULTS in the marketplace service. */}
        {step === 5 && (
          <Dl rows={[
            ["Title", d.title || "—"],
            ["Category", titleCase(d.category)],
            ["Geography", d.geography || "Not specified"],
            ["Format", d.spec_format || "To be agreed"],
            ["Quantity", d.spec_quantity || "To be agreed"],
            ["Quality bar", d.spec_quality || "Standard acceptance applies"],
            ["Acceptance", d.acceptance || "Client review on delivery"],
            ["Compliance", d.compliance_notes || "None specified"],
            ["Headcount", d.people_headcount || "0"],
            ["Certification", d.people_certification || "None"],
            ["Training", d.people_training || "None specified"],
            ["Experience", d.people_experience || "None specified"],
            ["Budget", `${money(d.budget_min || null)} – ${money(d.budget_max || null)}`],
            ["Timeline", `${fmtDate(d.starts_on || null)} → ${fmtDate(d.delivery_due_on || null)}`],
            ["Sample files", doneSamples.length ? doneSamples.map((s) => s.filename).join(", ") : "None"],
            ["Delivered to", <DestinationSummary key="dest" id={d.storage_target_id} />],
          ]} />
        )}
        {error && <Callout tone="critical" title={error} />}
      </Panel>
      <div className="btnrow">
        {step > 0 && <Button onClick={() => { setError(null); setStep((s) => s - 1); }}>Back</Button>}
        {/* Available on every step, not just the last. Everything typed lives
            in component state with no autosave and no exit control, so hiding
            the only save behind five Continues meant clicking "Requests" in
            the rail silently destroyed the lot. */}
        <Button
          onClick={() => save.mutate(false)}
          disabled={save.isPending || samples.some((s) => s.status === "uploading")}
        >
          {save.isPending && !confirming ? "Saving…" : "Save as draft"}
        </Button>
        {step < STEPS.length - 1 && <Button variant="primary" onClick={next}>Continue</Button>}
        {step === STEPS.length - 1 && (
          <Button
            variant="primary"
            onClick={askToPublish}
            disabled={save.isPending || samples.some((s) => s.status === "uploading")}
          >
            Publish to partners
          </Button>
        )}
      </div>

      {confirming && (
        <Dialog
          title="Publish to partners?"
          sub={d.title}
          busy={save.isPending}
          onClose={() => setConfirming(false)}
          foot={
            <>
              <Button onClick={() => setConfirming(false)} disabled={save.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => save.mutate(true)} disabled={save.isPending}>
                {save.isPending ? "Publishing…" : "Publish"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Every delivery partner is notified, and this cannot be undone">
            Partners start pricing against the words in this request. There is no way to
            unpublish it or edit it afterwards — only to see it through or let it lapse.
          </Callout>
        </Dialog>
      )}
    </View>
  );
}

/* --- where captured data is delivered ---------------------------------------
 *
 * The client supplies the bucket, so the credential is never taken on trust:
 * it is tested against the real endpoint before it can be saved, and a request
 * cannot be published until that test has passed. The alternative is finding
 * out a key is wrong when a worker is standing in a shop with a capture that
 * will never upload.
 *
 * Which fields appear depends on the provider, because the three do not take
 * the same kind of credential.
 */

const PROVIDERS = [
  ["s3", "S3-compatible — AWS, MinIO, R2, Wasabi, GCS interop"],
  ["gcs", "Google Cloud Storage — service account"],
  ["azure_blob", "Azure Blob Storage"],
] as const;

function useTargets() {
  return useQuery({
    queryKey: ["storage-targets"],
    queryFn: () => get<StorageTarget[]>("/storage-targets"),
  });
}

function describeTarget(t: StorageTarget): string {
  const where = t.key_prefix ? `${t.bucket}/${t.key_prefix}` : t.bucket;
  return `${where}${t.region ? ` · ${t.region}` : ""}`;
}

function DestinationSummary({ id }: { id: string }) {
  const targets = useTargets();
  // Without the loading branch this said "Not chosen" for a destination the
  // builder had just refused to let the client past without.
  if (targets.isLoading) return <>Loading…</>;
  const t = (targets.data ?? []).find((x) => x.id === id);
  if (!t) return <>Not chosen</>;
  return <>{t.label} — {describeTarget(t)}</>;
}

// POST /storage-targets/{id}/verify has existed since destinations shipped and
// nothing called it, so a destination whose credential had been revoked showed
// a red pill with no way to re-test — the only escape was creating a duplicate.
function RetestButton({ target }: { target: StorageTarget }) {
  const qc = useQueryClient();
  const toast = useToast();
  const verify = useMutation({
    mutationFn: () => post<StorageTarget>(`/storage-targets/${target.id}/verify`),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Destination reachable", `Wrote and read back a test file in ${t.bucket}.`, "success");
    },
    onError: (e) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Still not reachable", e instanceof Error ? e.message : "The test failed.", "critical");
    },
  });
  return (
    <Button size="sm" onClick={() => verify.mutate()} disabled={verify.isPending}>
      {verify.isPending ? "Testing…" : "Test again"}
    </Button>
  );
}

function DestinationStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const targets = useTargets();
  const [adding, setAdding] = useState(false);
  const rows = targets.data ?? [];

  return (
    <div className="col">
      <p className="muted">
        Captured data is written straight to your own storage. SourceHub signs each upload
        and keeps no copy.
      </p>

      {targets.isLoading && <Skeleton rows={3} label="Loading your destinations" />}

      {/* A client without storage.manage gets a 403 here. Saying so beats an
          empty step that reads as "you have none" and invites a duplicate. */}
      {targets.isError && (
        <Callout tone="critical" title="Could not load your destinations">
          {targets.error instanceof Error ? targets.error.message : "Try again in a moment."}
          {" "}You can still save this as a draft and choose a destination later.
        </Callout>
      )}

      {rows.length > 0 && (
        <TableWrap>
        <table>
          <thead>
            <tr>
              <th style={{ width: "2.5rem" }}><span className="sr">Use this destination</span></th>
              <th>Destination</th>
              <th>Where</th>
              <th>Tested</th>
              <th className="right"><span className="sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <input
                    type="radio"
                    name="destination"
                    checked={value === t.id}
                    onChange={() => onChange(t.id)}
                    aria-label={`Deliver to ${t.label}`}
                  />
                </td>
                <td>
                  <strong>{t.label}</strong>
                  <div className="small muted">{PROVIDERS.find(([v]) => v === t.provider)?.[1]}</div>
                </td>
                <td>{describeTarget(t)}</td>
                <td>
                  {t.verified_at
                    ? <Pill tone="success">Reachable</Pill>
                    : <Pill tone="critical">Not reachable</Pill>}
                  {!t.verified_at && t.verify_error && (
                    <div className="small muted">{t.verify_error}</div>
                  )}
                </td>
                <td className="right"><div className="rowactions"><RetestButton target={t} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableWrap>
      )}

      {!adding && (
        <div className="btnrow">
          <Button onClick={() => setAdding(true)}>
            {rows.length ? "Add another destination" : "Add a destination"}
          </Button>
        </div>
      )}

      {adding && (
        <NewDestination
          onCancel={() => setAdding(false)}
          onCreated={(t) => { setAdding(false); onChange(t.id); }}
        />
      )}
    </div>
  );
}

function NewDestination({
  onCancel, onCreated,
}: { onCancel: () => void; onCreated: (t: StorageTarget) => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    label: "", provider: "s3", bucket: "", endpoint: "", region: "", key_prefix: "",
    access_key_id: "", secret_access_key: "",
    service_account_json: "",
    account_name: "", account_key: "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const secretFor = (): Record<string, string> => {
    if (f.provider === "gcs") return { service_account_json: f.service_account_json };
    if (f.provider === "azure_blob") return { account_name: f.account_name, account_key: f.account_key };
    return { access_key_id: f.access_key_id, secret_access_key: f.secret_access_key };
  };

  // One button, and it does both. There is no reason to save a destination
  // that has not been proved to work.
  const create = useMutation({
    mutationFn: () => post<StorageTarget>("/storage-targets", {
      label: f.label,
      provider: f.provider,
      bucket: f.bucket,
      endpoint: f.endpoint || null,
      region: f.region || null,
      key_prefix: f.key_prefix || null,
      secret: secretFor(),
    }),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Destination ready", `Wrote and read back a test file in ${t.bucket}.`, "success");
      onCreated(t);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not reach that storage"),
  });

  return (
    <Panel title="Add a destination">
      <div className="formgrid">
        <Field label="Name" required span>
          {(id) => <input id={id} className={inputCls} value={f.label} onChange={set("label")} placeholder="Field capture, Mumbai" />}
        </Field>
        <Field label="Provider" required>
          {(id) => (
            <select id={id} className={inputCls} value={f.provider} onChange={set("provider")}>
              {PROVIDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </Field>
        <Field label={f.provider === "azure_blob" ? "Container" : "Bucket"} required>
          {(id) => <input id={id} className={inputCls} value={f.bucket} onChange={set("bucket")} placeholder="acme-field-capture" />}
        </Field>

        {f.provider === "s3" && (
          <>
            <Field label="Region">
              {(id) => <input id={id} className={inputCls} value={f.region} onChange={set("region")} placeholder="ap-south-1 — required outside us-east-1" />}
            </Field>
            <Field label="Endpoint">
              {(id) => <input id={id} className={inputCls} value={f.endpoint} onChange={set("endpoint")} placeholder="Blank for AWS; set it for MinIO, R2 or GCS interop" />}
            </Field>
            <Field label="Access key ID" required>
              {(id) => <input id={id} className={inputCls} value={f.access_key_id} onChange={set("access_key_id")} autoComplete="off" />}
            </Field>
            <Field label="Secret access key" required>
              {(id) => <input id={id} type="password" className={inputCls} value={f.secret_access_key} onChange={set("secret_access_key")} autoComplete="off" />}
            </Field>
          </>
        )}

        {f.provider === "gcs" && (
          <Field label="Service account key" required span>
            {(id) => <textarea id={id} className={textareaCls} rows={5} value={f.service_account_json} onChange={set("service_account_json")} placeholder='The whole JSON key file for an account with object read and write on this bucket' />}
          </Field>
        )}

        {f.provider === "azure_blob" && (
          <>
            <Field label="Account name" required>
              {(id) => <input id={id} className={inputCls} value={f.account_name} onChange={set("account_name")} placeholder="acmefieldcapture" />}
            </Field>
            <Field label="Account key" required>
              {(id) => <input id={id} type="password" className={inputCls} value={f.account_key} onChange={set("account_key")} autoComplete="off" />}
            </Field>
          </>
        )}

        <Field label="Folder" span>
          {(id) => <input id={id} className={inputCls} value={f.key_prefix} onChange={set("key_prefix")} placeholder="Optional — captures are written under this prefix, e.g. sourcehub/" />}
        </Field>
      </div>

      {error && (
        <Callout tone="critical" title="That storage could not be used">{error}</Callout>
      )}

      <div className="btnrow">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => { setError(null); create.mutate(); }} disabled={create.isPending}>
          {create.isPending ? "Testing the connection…" : "Test and save"}
        </Button>
      </div>
    </Panel>
  );
}

/* --- request detail: brief + proposal comparison + award --------------------- */

export function RequestDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [awarding, setAwarding] = useState<Proposal | null>(null);
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [proposing, setProposing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  const publish = useMutation({
    mutationFn: () => post<Rfp>(`/requests/${id}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["request", id] });
      // The list caches for 15s and used to keep showing Draft after this.
      void qc.invalidateQueries({ queryKey: ["requests"] });
      setPublishing(false);
      toast("Published", "Every delivery partner can bid on it now.", "success");
    },
    // There was no onError at all, so a refused publish — an unreachable
    // destination, a request already published — failed in total silence.
    onError: (e) => setPublishError(e instanceof Error ? e.message : "Could not publish"),
  });

  const award = useMutation({
    mutationFn: (proposalId: string) => post<{ id: string; reference_code: string }>(`/proposals/${proposalId}/award`),
    onSuccess: (c) => {
      toast("Contract awarded", `${c.reference_code} is open.`, "success");
      setAwarding(null);
      navigate(`/deliveries/${c.id}`);
    },
    onError: (e) => setAwardError(e instanceof Error ? e.message : "The award was refused."),
  });

  const r = request.data;
  if (!r) return <View title="Request">{request.isError ? <Callout tone="critical" title="Not found or not yours to see" /> : <p className="muted">Loading…</p>}</View>;

  const meta = statusMeta(requestStatus, r.status);
  const docs = r.attachments ?? [];
  const complianceDocs = docs.filter((a) => a.slot === "compliance");
  const acceptanceDocs = docs.filter((a) => a.slot === "acceptance");
  const isClient = session.org_kind === "client";
  const proposals = r.proposals ?? [];
  // Only badge an outright winner. On a tie every tied bid gets the chip,
  // which is the opposite of a comparison aid.
  const prices = proposals.map((p) => Number(p.price));
  const days = proposals.map((p) => p.duration_days);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const minDays = days.length ? Math.min(...days) : null;
  const lowest = prices.filter((x) => x === minPrice).length === 1 ? minPrice : null;
  const fastest = days.filter((x) => x === minDays).length === 1 ? minDays : null;
  const canAward = isClient && ["published", "proposals_received"].includes(r.status);
  // a withdrawn bid does not count: the partner may propose again, and the
  // server revives that row rather than refusing (submit_proposal).
  const alreadyMine = proposals.some(
    (p) => p.partner_org_id === session.org_id && p.status !== "withdrawn",
  );

  return (
    <View
      title={r.title}
      sub={<span className="id">{r.reference_code} · {titleCase(r.category)}</span>}
      actions={
        <>
          {isClient && r.status === "draft" && (
            <>
              <Link to={`/requests/${r.id}/edit`} className="btn">Edit</Link>
              <Button variant="primary" onClick={() => { setPublishError(null); setPublishing(true); }}>
                Publish
              </Button>
            </>
          )}
          {/* Once awarded this page becomes a read-only record with nothing
              pointing at the work it produced — the only way through was the
              rail. */}
          {isClient && ["accepted", "in_progress", "delivered", "completed"].includes(r.status) && (
            <Link to="/deliveries" className="btn" data-variant="primary">Track delivery</Link>
          )}
          {session.org_kind === "tenant" && ["published", "proposals_received"].includes(r.status) && !alreadyMine && (
            <Button variant="primary" onClick={() => setProposing(true)}>Propose</Button>
          )}
        </>
      }
    >
      {/* Labelled, not raw: the rail used to read "accepted" while the pill
          beside it read "Awarded" — two names for one state on one screen. */}
      <Panel>
        <StageRail
          stages={LIFECYCLE}
          current={r.status}
          label={(s) => requestStatus[s]?.label ?? s.replace(/_/g, " ")}
        />
      </Panel>

      <div className="g2">
        <Panel title="Specification">
          <Dl rows={[
            ["Format", r.spec.format ?? "—"],
            ["Quantity", r.spec.quantity ?? "—"],
            ["Quality bar", r.spec.quality ?? "—"],
            ["Acceptance", r.acceptance ?? "—"],
            // Shown under the prose they belong to rather than in a panel of
            // their own: a rubric is part of the acceptance criteria, not a
            // separate topic. A field with no files renders no row.
            ...(acceptanceDocs.length
              ? [["Acceptance documents", <AttachmentList key="ad" items={acceptanceDocs} />] as [string, React.ReactNode]]
              : []),
            ["Compliance", r.compliance_notes ?? "—"],
            ...(complianceDocs.length
              ? [["Compliance documents", <AttachmentList key="cd" items={complianceDocs} />] as [string, React.ReactNode]]
              : []),
            ["Geography", r.geography ?? "—"],
          ]} />
        </Panel>
        <Panel title="People, budget and timeline">
          <Dl rows={[
            ["Headcount", String(r.people.headcount)],
            ["Training", r.people.training ?? "—"],
            ["Experience", r.people.experience ?? "—"],
            ["Certification", r.people.certification ?? "—"],
            ["Budget", `${money(r.budget_min)} – ${money(r.budget_max)}`],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Status", <Pill key="s" tone={meta.tone}>{meta.label}</Pill>],
          ]} />
        </Panel>
      </div>

      {(r.samples ?? []).length > 0 && (
        <Panel title="Sample data" sub="Provided by the client to gauge the work. Download links are single-use and expire.">
          <TableWrap>
            <table>
              <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th /></tr></thead>
              <tbody>
                {(r.samples ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="cell-primary">{s.filename}</td>
                    <td className="small muted">{s.content_type ?? "—"}</td>
                    <td className="num">{(s.size_bytes / (1024 * 1024)).toFixed(s.size_bytes < 1024 * 1024 ? 2 : 1)} MB</td>
                    <td className="num">{fmtDate(s.uploaded_at)}</td>
                    <td className="right"><div className="rowactions">
                      <Button
                        size="sm"
                        onClick={() => {
                          void get<{ url: string }>(`/requests/${r.id}/samples/${s.id}/download`)
                            .then(({ url }) => window.open(url, "_blank", "noopener"))
                            .catch((e) => toast("Download failed", e instanceof Error ? e.message : "", "critical"));
                        }}
                      >
                        Download
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <Panel
        title={isClient ? "Proposals" : "Your proposal"}
        sub={isClient ? "Competitors never see each other's bids — only you compare them." : undefined}
      >
        {proposals.length === 0 ? (
          <Empty title="No proposals yet" hint={r.status === "draft" ? "Publish the request first." : "Partners have been notified."} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Partner</th><th>Price</th><th>Days</th><th>QA track record</th>
                  <th>Methodology</th><th>Status</th>{isClient && <th />}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id}>
                      <td className="cell-primary">
                        {p.partner_name ?? "—"}
                        {/* comparison, not decoration: meaningless to a partner
                            who sees only its own bid, and to a sole bid. */}
                        {isClient && proposals.length > 1 && (
                          <div className="cell-meta">
                            {Number(p.price) === lowest && <span className="chip">Lowest price</span>}{" "}
                            {p.duration_days === fastest && <span className="chip">Fastest</span>}
                          </div>
                        )}
                      </td>
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td className="num">{p.partner_qa_pass_rate != null ? `${p.partner_qa_pass_rate}% QA pass` : "—"}</td>
                      <td style={{ maxWidth: 380 }}>
                        {p.methodology}
                        {/* The document the summary stands for. Only this
                            client can open it — a rival gets a 404. */}
                        {(p.attachments ?? []).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <AttachmentList items={p.attachments ?? []} />
                          </div>
                        )}
                      </td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      {isClient && (
                        <td className="right"><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(p)}>Profile</Button>
                          {canAward && p.status === "submitted" && (
                            <Button size="sm" variant="primary" onClick={() => setAwarding(p)}>Award</Button>
                          )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {viewing && <PartnerProfileDialog proposal={viewing} onClose={() => setViewing(null)} />}

      {publishing && (
        <Dialog
          title="Publish to partners?"
          sub={r.reference_code}
          busy={publish.isPending}
          onClose={() => setPublishing(false)}
          foot={
            <>
              <Button onClick={() => setPublishing(false)} disabled={publish.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => publish.mutate()} disabled={publish.isPending}>
                {publish.isPending ? "Publishing…" : "Publish"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Every delivery partner is notified, and this cannot be undone">
            Partners start pricing against the words in this request. There is no way to
            unpublish it or edit it afterwards — only to see it through or let it lapse.
          </Callout>
          {publishError && <Callout tone="critical" title="Could not publish">{publishError}</Callout>}
        </Dialog>
      )}

      {awarding && (
        <Dialog
          title={`Award to ${awarding.partner_name}?`}
          sub={`${money(awarding.price)} · ${awarding.duration_days} days`}
          busy={award.isPending}
          onClose={() => setAwarding(null)}
          foot={
            <>
              <Button onClick={() => setAwarding(null)} disabled={award.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => { setAwardError(null); award.mutate(awarding.id); }} disabled={award.isPending}>
                {award.isPending ? "Awarding…" : "Award contract"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Awarding opens a contract and invoices milestone 1">
            Every other proposal is automatically declined and its partner notified. Half the
            value is invoiced to you and held in escrow until you approve the delivery.
          </Callout>
          {/* The failure used to toast from the far corner while this dialog
              stayed open with room to say it — every sibling dialog reports
              inline. */}
          {awardError && <Callout tone="critical" title="Could not award">{awardError}</Callout>}
        </Dialog>
      )}

      {proposing && id && (
        <ProposeDialog requestId={id} title={r.title} onClose={() => setProposing(false)} />
      )}
    </View>
  );
}

/* --- the partner behind a proposal -------------------------------------------- */

// A bidder is disclosed to the client it bids to and to nobody else — the
// database says so (org_visible_via_proposal, db/110_auth_functions.sql).
// The shared OrgProfileDialog asks for the org and lets a 404 mean "not
// yours to see"; the proposal seeds the name and QA rate.
function PartnerProfileDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <OrgProfileDialog
      orgId={proposal.partner_org_id}
      seedName={proposal.partner_name ?? "Delivery partner"}
      seedQa={proposal.partner_qa_pass_rate}
      onClose={onClose}
    />
  );
}

/* --- tenant: opportunities + propose ----------------------------------------- */

function ProposeDialog({ requestId, title, onClose }: { requestId: string; title: string; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [methodology, setMethodology] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AttachmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () =>
      post(`/requests/${requestId}/proposals`, {
        price: Number(price),
        duration_days: Number(days),
        methodology,
        notes: notes || null,
        attachments: attachmentPayload(files, "methodology"),
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Proposal submitted", "The client has been notified.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title="Submit a proposal"
      sub={title}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={
              submit.isPending || !price || !days || !methodology.trim() ||
              files.some((f) => f.status === "uploading")
            }
            onClick={() => {
              // the backend requires a real methodology (min 10 chars) — say so
              // instead of silently disabling the button
              if (methodology.trim().length < 10) {
                setError("Describe your methodology in at least 10 characters — it is the main thing the client compares.");
                return;
              }
              setError(null);
              submit.mutate();
            }}
          >
            Submit proposal
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Price (USD)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />}
        </Field>
        <Field label="Delivery time (days)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />}
        </Field>
        <Field label="Methodology" required span
          hint="At least 10 characters. Immutable once submitted — this is what the client compares."
          error={methodology.trim() && methodology.trim().length < 10 ? "A few words more — 10 characters minimum." : null}>
          {(id) => <textarea id={id} className={textareaCls} rows={4} value={methodology} onChange={(e) => setMethodology(e.target.value)} />}
        </Field>
        <AttachmentsField
          label="Method statement"
          span
          hint="The document behind the summary above — an approach note, a capability deck. Only this client sees it."
          items={files}
          onChange={setFiles}
        />
        <Field label="Notes" span>
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

export function OpportunitiesPage() {
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => get<Rfp[]>("/opportunities") });
  return (
    <View title="Opportunities" sub="Published requests you can still bid on. First proposal in moves it to 'proposals received'.">
      <Panel>
        {(opps.data ?? []).length === 0 ? (
          <Empty title="Nothing open right now" hint="You are notified the moment a client publishes." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Title</th><th>Category</th><th>Budget</th><th>Delivery</th><th /></tr></thead>
              <tbody>
                {(opps.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="id">{r.reference_code}</td>
                    <td className="cell-primary">{r.title}</td>
                    <td>{titleCase(r.category)}</td>
                    <td className="num">{money(r.budget_min)} – {money(r.budget_max)}</td>
                    <td className="num">{fmtDate(r.delivery_due_on)}</td>
                    <td className="right"><div className="rowactions"><Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Brief</Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </View>
  );
}

function ProposalDetailDialog({ p, onClose }: { p: Proposal; onClose: () => void }) {
  const pm = statusMeta(proposalStatus, p.status);
  return (
    <Dialog
      title={p.request_title ?? p.request_ref ?? "Proposal"}
      sub={<span className="id">{p.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Request", <Link key="r" to={`/requests/${p.request_id}`}>{p.request_title ?? p.request_ref ?? "Open request"}</Link>],
        ["Price", `${money(p.price, p.currency)}`],
        ["Delivery time", `${p.duration_days} days`],
        ["Methodology", p.methodology],
        ...((p.attachments ?? []).length
          ? [["Method statement", <AttachmentList key="m" items={p.attachments ?? []} />] as [string, React.ReactNode]]
          : []),
        ["Notes", p.notes ?? "—"],
        ["Status", <Pill key="s" tone={pm.tone}>{pm.label}</Pill>],
        ["Submitted", fmtDateTime(p.submitted_at)],
      ]} />
    </Dialog>
  );
}

export function MyProposalsPage() {
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [viewingBrief, setViewingBrief] = useState<Proposal | null>(null);
  const mine = useQuery({ queryKey: ["proposals-mine"], queryFn: () => get<Proposal[]>("/proposals/mine") });
  const withdraw = useMutation({
    mutationFn: (pid: string) => post(`/proposals/${pid}/withdraw`),
  });
  const qc = useQueryClient();
  const wins = useMemo(
    () => (mine.data ?? []).filter((p) => p.status === "accepted").length,
    [mine.data],
  );
  return (
    <View title="Proposals" sub={`${mine.data?.length ?? 0} submitted · ${wins} won`}>
      <Panel>
        {(mine.data ?? []).length === 0 ? (
          <Empty title="No proposals yet" hint="Open an opportunity and propose." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Request</th><th>Price</th><th>Days</th><th>Status</th><th /></tr></thead>
              <tbody>
                {(mine.data ?? []).map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id} className="tap" onClick={() => setViewing(p)}>
                      <td className="id">{p.reference_code}</td>
                      <td className="cell-primary">{p.request_title ?? p.request_ref}</td>
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                        <RowMenu
                          label={`Actions for ${p.reference_code}`}
                          items={[
                            { label: "View bid", onSelect: () => setViewing(p) },
                            { label: "View client & request", onSelect: () => setViewingBrief(p) },
                            ...(p.status === "withdrawn"
                              ? [{ label: "Propose again", onSelect: () => navigate(`/requests/${p.request_id}`) }]
                              : []),
                            ...(p.status === "submitted"
                              ? [{
                                  label: "Withdraw",
                                  tone: "danger" as const,
                                  onSelect: () => withdraw.mutate(p.id, {
                                    onSuccess: () => void qc.invalidateQueries({ queryKey: ["proposals-mine"] }),
                                  }),
                                }]
                              : []),
                          ]}
                        />
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
      {viewing && <ProposalDetailDialog p={viewing} onClose={() => setViewing(null)} />}
      {viewingBrief && (
        <ClientAndRequestDialog proposal={viewingBrief} onClose={() => setViewingBrief(null)} />
      )}
    </View>
  );
}

/* --- the client and the RFP behind one of my proposals ------------------------ */
// Distinct from ProposalDetailDialog above, which shows the bid's own terms:
// this answers "who is buying, and what did they actually ask for".

// Two independent reads, both arbitrated by RLS: request_select_bidder keeps the
// RFP visible to whoever bid on it, and Fix 9 makes the buyer visible the same
// way. Either can 404, and a 404 means exactly "not yours to see".
function ClientAndRequestDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const rfp = useQuery({
    queryKey: ["request", proposal.request_id],
    queryFn: () => get<Rfp>(`/requests/${proposal.request_id}`),
  });
  const client = useQuery({
    queryKey: ["org", proposal.client_org_id],
    queryFn: () => get<Org>(`/organisations/${proposal.client_org_id}`),
    enabled: !!proposal.client_org_id,
  });

  const r = rfp.data;
  const o = client.data;
  const cp = (o?.profile ?? {}) as Partial<ClientProfile>;
  const pm = statusMeta(proposalStatus, proposal.status);

  return (
    <Dialog
      title={proposal.request_title ?? proposal.request_ref ?? "Proposal"}
      sub={
        <>
          <span className="id">{proposal.reference_code}</span>
          {" · "}{money(proposal.price)} · {proposal.duration_days} days{" "}
          <Pill tone={pm.tone}>{pm.label}</Pill>
        </>
      }
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Panel title="Client">
        {client.isError ? (
          <Callout tone="critical" title="Client not available">
            A buyer is visible to you through your proposal. If it has been withdrawn from the
            record, so has your view of them.
          </Callout>
        ) : !o ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Name", o.name],
            ["Reference", o.reference_code],
            ["Country", o.country ?? "—"],
            ["Industry", cp.industry ?? "—"],
            ["Client since", fmtDate(cp.since)],
          ]} />
        )}
      </Panel>

      <Panel title="The request">
        {rfp.isError ? (
          <Callout tone="critical" title="Request not available" />
        ) : !r ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Reference", r.reference_code],
            ["Category", titleCase(r.category)],
            ["Format", r.spec.format ?? "—"],
            ["Quantity", r.spec.quantity ?? "—"],
            ["Quality bar", r.spec.quality ?? "—"],
            ["Acceptance", r.acceptance ?? "—"],
            ["Budget", `${money(r.budget_min)} – ${money(r.budget_max)}`],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Geography", r.geography ?? "—"],
            ["Compliance", r.compliance_notes ?? "—"],
          ]} />
        )}
      </Panel>
    </Dialog>
  );
}
