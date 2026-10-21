// storage — the client's delivery destinations, as a section of its
// Organisation profile.
//
// Until this section a destination could be added from the RFP builder and
// never changed. A rotated or revoked key read Not reachable with only Test
// again to offer, and the only way out was a duplicate. Here a client tests
// one again, replaces its key, renames it, and deletes one that nothing uses.
//
// It sits below the profile because it belongs to the organisation, not to an
// RFP, but unlike the profile it is private: partners and crowd workers never
// see it. Shown to whoever holds storage.manage, the API's only rule, which is
// every member of a client, as in the RFP builder. The profile above it is
// edited by owners and managers only.
//
// Deleting follows the server's rule (delete_problem, and db/590 in the
// database): only while no contract and no draft or published RFP names the
// destination. A contract's captures are in that bucket and are signed from
// that key whenever anyone opens them, so a used destination stays. Its key
// can still be replaced. Delete is offered only where it would succeed, and a
// refusal the list had not caught up with is shown in the dialog. The list is
// read afresh whenever the section opens, because the RFP actions that change
// what uses a destination (saving a draft, cancelling) do not refresh it.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { del, patch } from "@api/client";
import type { StorageTarget } from "@api/types";
import {
  Button, Callout, Dialog, Empty, Field, inputCls, Loadable, Panel, RowMenu, TableWrap, useToast,
} from "@ds/primitives";
import { PRODUCT } from "@shared/brand";
import {
  describeTarget, EMPTY_SECRET, NewDestination, providerLabel, Reachability, RetestButton,
  SecretFields, secretFor, TARGETS_KEY, useTargets, type SecretDraft,
} from "./destinations";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What uses a destination: its contracts, then the RFPs not yet awarded,
 *  drafts among them (a draft counts: it would be published into it). */
function UsedBy({ target: t }: { target: StorageTarget }) {
  const contracts = t.used_by?.contracts ?? [];
  const requests = t.used_by?.requests ?? [];
  const drafts = requests.filter((u) => u.status === "draft").length;
  const open = requests.length - drafts;
  const links = [
    ...contracts.map((u) => ({ ...u, to: `/deliveries/${u.id}` })),
    ...requests.map((u) => ({ ...u, to: `/requests/${u.id}` })),
  ];
  if (links.length === 0) return <span className="muted">Nothing yet</span>;
  const shown = links.slice(0, 3);
  const counts = [
    contracts.length ? plural(contracts.length, "contract", "contracts") : null,
    open ? plural(open, "open RFP", "open RFPs") : null,
    drafts ? plural(drafts, "draft", "drafts") : null,
  ].filter(Boolean).join(" · ");
  return (
    <>
      {shown.map((u, i) => (
        <span key={u.id}>
          {i > 0 && ", "}
          <Link to={u.to} title={u.title ?? undefined}>{u.reference_code}</Link>
        </span>
      ))}
      {links.length > shown.length && <span className="muted"> and {links.length - shown.length} more</span>}
      <div className="small muted">{counts}</div>
    </>
  );
}

function ReplaceKeyDialog({ target, onClose }: { target: StorageTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [secret, setSecret] = useState<SecretDraft>(EMPTY_SECRET);
  const [error, setError] = useState<string | null>(null);
  // Every field the provider's key needs, so the server is never asked to
  // name them in its own words ("needs access_key_id").
  const sent = secretFor(target.provider, secret, { replacing: true });
  const ready = Object.values(sent).every((v) => v.trim() !== "");

  // Owns its errors, as ReasonDialog does: a key that fails its test is shown
  // here, where the client can correct it, and the old key stays in use.
  const replace = useMutation({
    mutationFn: () => patch<StorageTarget>(`/storage-targets/${target.id}`, { secret: sent }),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      toast("Key replaced", `Tested first: wrote and read back a test file in ${t.bucket}.`, "success");
      onClose();
    },
    onError: (e) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      setError(e instanceof Error ? e.message : "That key could not be used.");
    },
  });

  return (
    <Dialog
      title={`Replace the key for ${target.label}`}
      sub={`The new key is tested against ${describeTarget(target)} before it replaces the old one. If the test fails, nothing changes.`}
      onClose={onClose}
      busy={replace.isPending}
      foot={
        <>
          <Button onClick={onClose} disabled={replace.isPending}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => { setError(null); replace.mutate(); }}
            disabled={!ready || replace.isPending}
            title={ready ? undefined : "Enter the new key first"}
          >
            {replace.isPending ? "Testing the new key…" : "Test and replace"}
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <SecretFields
          provider={target.provider}
          value={secret}
          onChange={(next) => { setError(null); setSecret((x) => ({ ...x, ...next })); }}
          replacing
        />
      </div>
      {target.provider === "azure_blob" && (
        <p className="small muted">The same storage account. To deliver to another account, add a new destination.</p>
      )}
      {error && <Callout tone="critical" title="That key could not be used">{error}</Callout>}
    </Dialog>
  );
}

function RenameDialog({ target, onClose }: { target: StorageTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [label, setLabel] = useState(target.label);
  const [error, setError] = useState<string | null>(null);
  const name = label.trim();

  const rename = useMutation({
    mutationFn: () => patch<StorageTarget>(`/storage-targets/${target.id}`, { label: name }),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      toast("Renamed", `${target.label} is now ${t.label}.`, "success");
      onClose();
    },
    onError: (e) => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      setError(e instanceof Error ? e.message : "It could not be renamed.");
    },
  });

  return (
    <Dialog
      title={`Rename ${target.label}`}
      sub="The name is yours alone: partners and crowd workers never see it."
      onClose={onClose}
      busy={rename.isPending}
      foot={
        <>
          <Button onClick={onClose} disabled={rename.isPending}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => { setError(null); rename.mutate(); }}
            disabled={!name || name === target.label || rename.isPending}
          >
            Rename
          </Button>
        </>
      }
    >
      <Field label="Name" required span>
        {(id) => (
          <input
            id={id}
            className={inputCls}
            value={label}
            maxLength={120}
            onChange={(e) => { setError(null); setLabel(e.target.value); }}
          />
        )}
      </Field>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

function DeleteDialog({ target, onClose }: { target: StorageTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: () => del(`/storage-targets/${target.id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      toast("Destination deleted", `${PRODUCT} no longer holds the key for ${target.label}.`, "success");
      onClose();
    },
    onError: (e) => {
      // In use after all: an RFP named it after this list was loaded.
      void qc.invalidateQueries({ queryKey: TARGETS_KEY });
      setError(e instanceof Error ? e.message : "It could not be deleted.");
    },
  });

  return (
    <Dialog
      title={`Delete ${target.label}?`}
      onClose={onClose}
      busy={remove.isPending}
      foot={
        <>
          <Button onClick={onClose} disabled={remove.isPending}>Keep it</Button>
          <Button variant="danger" onClick={() => { setError(null); remove.mutate(); }} disabled={remove.isPending}>
            Delete destination
          </Button>
        </>
      }
    >
      <p>
        {PRODUCT} deletes its copy of the key, and the destination is no longer offered for new RFPs.
        Nothing in {describeTarget(target)} is touched.
      </p>
      <p className="small muted">
        If you made this key only for {PRODUCT}, revoke it with {providerLabel(target.provider)} as well.
      </p>
      {error && <Callout tone="critical" title="It was not deleted">{error}</Callout>}
    </Dialog>
  );
}

export function DeliveryStorage({ orgName }: { orgName: string }) {
  const targets = useTargets({ fresh: true });
  const [adding, setAdding] = useState(false);
  const [replacing, setReplacing] = useState<StorageTarget | null>(null);
  const [renaming, setRenaming] = useState<StorageTarget | null>(null);
  const [deleting, setDeleting] = useState<StorageTarget | null>(null);
  const rows = targets.data ?? [];

  // Always read the live row: a dialog holding a snapshot shows stale values
  // after a change.
  const live = (t: StorageTarget) => rows.find((x) => x.id === t.id) ?? t;

  return (
    <>
      <Panel
        title="Delivery storage"
        sub={
          `Your own buckets, where captured data is written. ${PRODUCT} signs each upload and keeps no copy. ` +
          `Only people in ${orgName} see this. A destination can be deleted while no contract, ` +
          "open RFP or draft uses it."
        }
        actions={<Button onClick={() => setAdding(true)}>Add a destination</Button>}
      >
        <Loadable q={targets} what="your delivery destinations">
          {rows.length === 0 ? (
            <Empty
              title="No destinations yet"
              hint="Add the bucket captured data should go to. It is tested before it is saved, and you can also add one while writing an RFP."
            />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Where</th>
                    <th>Status</th>
                    <th>Used by</th>
                    <th className="right"><span className="sr">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-primary">
                        {t.label}
                        <div className="cell-meta">{providerLabel(t.provider)}</div>
                      </td>
                      <td>
                        {describeTarget(t)}
                        {t.endpoint && <div className="small muted">{t.endpoint}</div>}
                      </td>
                      <td><Reachability target={t} /></td>
                      <td><UsedBy target={t} /></td>
                      <td className="right">
                        <div className="rowactions">
                          <RetestButton target={t} />
                          <RowMenu
                            label={`More actions for ${t.label}`}
                            items={[
                              { label: "Replace key", onSelect: () => setReplacing(t) },
                              { label: "Rename", onSelect: () => setRenaming(t) },
                              ...(t.can_delete
                                ? [{ label: "Delete", tone: "danger" as const, onSelect: () => setDeleting(t) }]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Loadable>
      </Panel>

      {adding && (
        <NewDestination shell="dialog" onCancel={() => setAdding(false)} onCreated={() => setAdding(false)} />
      )}

      {replacing && <ReplaceKeyDialog target={live(replacing)} onClose={() => setReplacing(null)} />}
      {renaming && <RenameDialog target={live(renaming)} onClose={() => setRenaming(null)} />}
      {deleting && <DeleteDialog target={live(deleting)} onClose={() => setDeleting(null)} />}
    </>
  );
}
