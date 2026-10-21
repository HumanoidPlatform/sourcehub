// storage — where a client's captured data is delivered.
//
// The pieces the RFP builder and the Organisation profile's Delivery storage
// section share: the list, the provider names, the key fields each provider
// asks for, and the form that adds a destination. They lived in
// marketplace/pages.tsx until destinations got a section of their own
// (db/590, section.tsx), where a client tests one again, replaces its key,
// renames it, and deletes one that nothing uses.
//
// The client supplies the bucket, so the credential is never taken on trust:
// it is tested against the real endpoint before it can be saved, and a request
// cannot be published until that test has passed. The alternative is finding
// out a key is wrong when a crowd resource is standing in a shop with a capture
// that will never upload.
//
// Which fields appear depends on the provider, because the three do not take
// the same kind of credential.
//
// This is the CLIENT's own storage, and theirs to choose. SourceHub's own
// bucket — where attachments and capture examples go — is set per environment
// on the server and never appears in these forms.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { StorageTarget } from "@api/types";
import { Button, Callout, Dialog, Field, inputCls, Panel, Pill, Skeleton, TableWrap, useToast } from "@ds/primitives";
import { PRODUCT } from "@shared/brand";

export const PROVIDERS = [
  ["azure_blob", "Azure Blob Storage"],
  ["gcs", "Google Cloud Storage"],
  ["s3", "S3-compatible — AWS, MinIO, R2, Wasabi"],
] as const;

export type Provider = StorageTarget["provider"];

export const providerLabel = (p: string): string => PROVIDERS.find(([v]) => v === p)?.[1] ?? p;

export const TARGETS_KEY = ["storage-targets"] as const;

/** `fresh` refetches on every mount, whatever the cache holds. What uses a
 *  destination changes with RFP actions elsewhere (a draft saved, an RFP
 *  cancelled), and none of them refresh this list. */
export function useTargets({ fresh = false }: { fresh?: boolean } = {}) {
  return useQuery({
    queryKey: TARGETS_KEY,
    queryFn: () => get<StorageTarget[]>("/storage-targets"),
    ...(fresh ? { refetchOnMount: "always" as const } : {}),
  });
}

export function describeTarget(t: StorageTarget): string {
  const where = t.key_prefix ? `${t.bucket}/${t.key_prefix}` : t.bucket;
  // Region only ever reads as noise on Azure, where there isn't one.
  return `${where}${t.region ? ` · ${t.region}` : ""}`;
}

export function DestinationSummary({ id }: { id: string }) {
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
//
// A failed test comes back as the destination with verify_error set, not as an
// error (db/590): the server keeps the result, where it used to roll it back
// with the refusal, so a destination that had just failed still read
// Reachable.
export function RetestButton({ target }: { target: StorageTarget }) {
  const qc = useQueryClient();
  const toast = useToast();
  const verify = useMutation({
    mutationFn: () => post<StorageTarget>(`/storage-targets/${target.id}/verify`),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      if (t.verified_at) {
        toast("Destination reachable", `Wrote and read back a test file in ${t.bucket}.`, "success");
      } else {
        toast("Still not reachable", t.verify_error ?? "The test failed.", "critical");
      }
    },
    onError: (e) => {
      // Gone, most likely: deleted in another tab. The list should say so.
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      toast("Could not test it", e instanceof Error ? e.message : "The test failed.", "critical");
    },
  });
  return (
    <Button size="sm" onClick={() => verify.mutate()} disabled={verify.isPending}>
      {verify.isPending ? "Testing…" : "Test again"}
    </Button>
  );
}

/** Reachable, or why not. */
export function Reachability({ target: t }: { target: StorageTarget }) {
  return (
    <>
      {t.verified_at
        ? <Pill tone="success">Reachable</Pill>
        : <Pill tone="critical">Not reachable</Pill>}
      {!t.verified_at && t.verify_error && (
        <div className="small muted">{t.verify_error}</div>
      )}
    </>
  );
}

export function DestinationStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const targets = useTargets();
  const [adding, setAdding] = useState(false);
  const rows = targets.data ?? [];

  return (
    <div className="col">
      <p className="muted">
        Captured data is written straight to your own storage. {PRODUCT} signs each upload
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
                  <div className="small muted">{providerLabel(t.provider)}</div>
                </td>
                <td>{describeTarget(t)}</td>
                <td><Reachability target={t} /></td>
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

/* --- the key itself ---------------------------------------------------------
 *
 * Shared by adding a destination and replacing its key. On a replacement the
 * Azure account name is not asked for: it is part of where the files are, so
 * the server keeps the one it has and refuses a key for another account.
 */

export interface SecretDraft {
  access_key_id: string;
  secret_access_key: string;
  account_name: string;
  account_key: string;
  service_account_json: string;
}

export const EMPTY_SECRET: SecretDraft = {
  access_key_id: "", secret_access_key: "",
  account_name: "", account_key: "",
  service_account_json: "",
};

export function secretFor(
  provider: Provider, s: SecretDraft, { replacing = false }: { replacing?: boolean } = {},
): Record<string, string> {
  if (provider === "azure_blob") {
    return replacing
      ? { account_key: s.account_key }
      : { account_name: s.account_name, account_key: s.account_key };
  }
  if (provider === "gcs") return { service_account_json: s.service_account_json };
  return { access_key_id: s.access_key_id, secret_access_key: s.secret_access_key };
}

export function SecretFields({
  provider, value, onChange, replacing = false,
}: {
  provider: Provider;
  value: SecretDraft;
  onChange: (next: Partial<SecretDraft>) => void;
  replacing?: boolean;
}) {
  // Which account the uploaded key belongs to — shown so the client can see
  // they picked the right file. The email is not secret; the key stays out of
  // the page.
  const [keyAccount, setKeyAccount] = useState<string | null>(null);

  const readKeyFile = async (file: File) => {
    // FileReader rather than file.text(): it reads the same in every browser
    // and in the test environment.
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    onChange({ service_account_json: text });
    try {
      const info = JSON.parse(text) as { client_email?: unknown };
      setKeyAccount(typeof info.client_email === "string" ? info.client_email : null);
    } catch {
      // The server says what is wrong with it, without echoing it back.
      setKeyAccount(null);
    }
  };

  const set = (k: keyof SecretDraft) => (e: { target: { value: string } }) => onChange({ [k]: e.target.value });

  return (
    <>
      {provider === "s3" && (
        <>
          <Field label="Access key ID" required>
            {(id) => <input id={id} className={inputCls} value={value.access_key_id} onChange={set("access_key_id")} autoComplete="off" />}
          </Field>
          <Field label="Secret access key" required>
            {(id) => <input id={id} type="password" className={inputCls} value={value.secret_access_key} onChange={set("secret_access_key")} autoComplete="off" />}
          </Field>
        </>
      )}

      {provider === "azure_blob" && (
        <>
          {!replacing && (
            <Field label="Account name" required>
              {(id) => <input id={id} className={inputCls} value={value.account_name} onChange={set("account_name")} placeholder="acmefieldcapture" />}
            </Field>
          )}
          <Field label="Account key" required span={replacing}>
            {(id) => <input id={id} type="password" className={inputCls} value={value.account_key} onChange={set("account_key")} autoComplete="off" />}
          </Field>
        </>
      )}

      {provider === "gcs" && (
        <Field
          label="Service account key"
          required
          span
          hint="The .json key of a service account with Storage Object Admin on this bucket. The bucket also needs a CORS rule letting this site PUT, GET and HEAD."
        >
          {(id) => (
            <>
              <input
                id={id}
                type="file"
                accept="application/json,.json"
                className={inputCls}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readKeyFile(file);
                }}
              />
              {keyAccount && <span className="muted">Key for {keyAccount}</span>}
            </>
          )}
        </Field>
      )}
    </>
  );
}

export function NewDestination({
  onCancel, onCreated, shell = "panel",
}: {
  onCancel: () => void;
  onCreated: (t: StorageTarget) => void;
  /** "panel" in the RFP builder, where it opens in place of its button.
   *  "dialog" on the Organisation profile, where a form below the list would
   *  open out of sight, and focus would drop to the page. */
  shell?: "panel" | "dialog";
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    label: "", provider: "azure_blob" as Provider, bucket: "", endpoint: "", region: "", key_prefix: "",
  });
  const [secret, setSecret] = useState<SecretDraft>(EMPTY_SECRET);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  // One button, and it does both. There is no reason to save a destination
  // that has not been proved to work.
  const create = useMutation({
    mutationFn: () => post<StorageTarget>("/storage-targets", {
      label: f.label,
      provider: f.provider,
      bucket: f.bucket,
      // Only the S3 fields show them. A value typed there before switching
      // provider would otherwise travel with an Azure or Google destination.
      endpoint: f.provider === "s3" ? f.endpoint || null : null,
      region: f.provider === "s3" ? f.region || null : null,
      key_prefix: f.key_prefix || null,
      secret: secretFor(f.provider, secret),
    }),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      toast("Destination ready", `Wrote and read back a test file in ${t.bucket}.`, "success");
      onCreated(t);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not reach that storage"),
  });

  const fields = (
    <>
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
          </>
        )}

        <SecretFields
          provider={f.provider}
          value={secret}
          onChange={(next) => setSecret((x) => ({ ...x, ...next }))}
        />

        <Field label="Folder" span>
          {(id) => <input id={id} className={inputCls} value={f.key_prefix} onChange={set("key_prefix")} placeholder="Optional — captures are written under this prefix, e.g. captures/" />}
        </Field>
      </div>

      {error && (
        <Callout tone="critical" title="That storage could not be used">{error}</Callout>
      )}
    </>
  );

  // Cancel waits for the test too: dismissed mid-test, the destination was
  // still created, or its refusal was lost.
  const buttons = (
    <>
      <Button onClick={onCancel} disabled={create.isPending}>Cancel</Button>
      <Button variant="primary" onClick={() => { setError(null); create.mutate(); }} disabled={create.isPending}>
        {create.isPending ? "Testing the connection…" : "Test and save"}
      </Button>
    </>
  );

  if (shell === "dialog") {
    return (
      <Dialog title="Add a destination" size="wide" onClose={onCancel} busy={create.isPending} foot={buttons}>
        {fields}
      </Dialog>
    );
  }
  return (
    <Panel title="Add a destination">
      {fields}
      <div className="btnrow">{buttons}</div>
    </Panel>
  );
}
