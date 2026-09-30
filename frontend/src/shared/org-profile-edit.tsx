// Editing an organisation's profile after onboarding.
//
// One dialog for two editors. Ops (org.update) edits any client or partner from
// the account page; an organisation's own owner or manager (profile.manage)
// edits their own from the Organisation profile page, and sees the fields that
// are the account's terms with the platform locked. The server applies the
// same split (update_org_profile); this only decides what to render.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { del, patch, put } from "@api/client";
import type { Org } from "@api/types";
import { Button, Callout, Dialog, useToast } from "@ds/primitives";
import { LogoPicker, OrgLogo, type LogoUpload } from "@shared/org-logo";
import {
  draftFromOrg, ProfileFields, profilePatch, validateProfile,
  type ProfileErrors, type ProfileKey, type ProfileKind, type ProfileValue,
} from "@shared/org-profile-form";

export function EditProfileDialog({ org, ops, onClose }: { org: Org; ops: boolean; onClose: () => void }) {
  const kind = org.kind as ProfileKind;
  const before = useMemo(() => draftFromOrg(org), [org]);
  const [d, setD] = useState(before);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [logo, setLogo] = useState<LogoUpload | null>(null);
  const [dropLogo, setDropLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const onField = (k: ProfileKey, v: ProfileValue) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _drop, ...rest }) => rest);
    setError(null);
  };

  const changes = profilePatch(before, d, kind, { ops });
  const logoChange = logo?.status === "done" || (dropLogo && !!org.logo_version);
  const dirty = Object.keys(changes).length > 0 || logoChange;

  const save = useMutation({
    mutationFn: async () => {
      // Profile first, logo second: a refused logo then leaves the text saved
      // and says so, rather than losing both.
      if (Object.keys(changes).length) await patch<Org>(`/organisations/${org.id}`, changes);
      if (logo?.status === "done") {
        await put<Org>(`/organisations/${org.id}/logo`, { storage_key: logo.key });
      } else if (dropLogo && org.logo_version) {
        await del<Org>(`/organisations/${org.id}/logo`);
      }
    },
    onSuccess: () => {
      // ["org", id] is the account page and every counterparty dialog;
      // ["org-me"] the organisation's own page and the rail; ["orgs"] the lists.
      void qc.invalidateQueries({ queryKey: ["org", org.id] });
      void qc.invalidateQueries({ queryKey: ["org-me"] });
      void qc.invalidateQueries({ queryKey: ["orgs"] });
      void qc.invalidateQueries({ queryKey: ["activity", org.id] });
      // a partner's page in the vendors directory is made of this profile
      void qc.invalidateQueries({ queryKey: ["vendors"] });
      void qc.invalidateQueries({ queryKey: ["vendor", org.id] });
      toast("Profile saved", `${d.name.trim() || org.name} is up to date.`, "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save the profile"),
  });

  const submit = () => {
    const found = validateProfile(d, { required: false });
    setErrors(found);
    const n = Object.keys(found).length;
    if (n) return setError(n === 1 ? "One field needs attention." : `${n} fields need attention.`);
    if (logo?.status === "uploading") return setError("Wait for the logo to finish uploading.");
    if (logo?.status === "error") return setError("The logo did not upload. Choose it again or remove it.");
    save.mutate();
  };

  return (
    <Dialog
      title={`Edit ${org.name}`}
      sub={<span className="id">{org.reference_code}</span>}
      size="wide"
      busy={save.isPending}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!dirty || save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </>
      }
    >
      {/* Not a Field: there is no single control for a label to point at, and
          the picker reports its own problems. */}
      <h3 className="eyebrow formsection">Logo</h3>
      <div className="logofield">
        {!logo && org.logo_version && !dropLogo && (
          <div className="logofield-current">
            <OrgLogo orgId={org.id} version={org.logo_version} name={org.name} size={56} />
            <Button size="sm" variant="quiet" onClick={() => setDropLogo(true)}>Remove logo</Button>
          </div>
        )}
        {dropLogo && !logo && (
          <p className="small muted">
            The logo will be removed when you save.{" "}
            <Button size="sm" variant="quiet" onClick={() => setDropLogo(false)}>Keep it</Button>
          </p>
        )}
        <LogoPicker
          value={logo}
          onChange={(next) => { setLogo(next); setError(null); }}
          label={org.logo_version ? "Replace logo" : "Upload logo"}
        />
        <p className="small muted">Shown on the profile, to this organisation's counterparties, and in its own sidebar.</p>
      </div>

      <h3 className="eyebrow formsection">Company</h3>
      <ProfileFields section="company" d={d} kind={kind} errors={errors} onField={onField} ops={ops} />

      {kind === "tenant" && (
        <>
          <h3 className="eyebrow formsection">Expertise</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Shown on this partner's page in the vendors directory. Clients filter the directory by
            these, so list what the company can deliver today.
          </p>
          <ProfileFields section="expertise" d={d} kind={kind} errors={errors} onField={onField} ops={ops} />
        </>
      )}

      <h3 className="eyebrow formsection">Registered address</h3>
      <ProfileFields section="address" d={d} kind={kind} errors={errors} onField={onField} ops={ops} />

      {/* The plan is withheld from anyone but Ops and the organisation itself,
          and both of those are the only people who reach this dialog. */}
      <h3 className="eyebrow formsection">Plan and terms</h3>
      <ProfileFields section="terms" d={d} kind={kind} errors={errors} onField={onField} ops={ops} />

      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
