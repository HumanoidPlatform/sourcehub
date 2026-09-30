// identity — an organisation's own profile, as its people see it.
//
// Reached from the account menu, like Manage users: it is about the account,
// not the day's work. Everyone in the organisation can read it; an owner or
// manager can edit the company's details and logo. The account's terms with
// the platform (legal name, country, plan, residency, DPA) are shown but are
// Ops' to change, and the edit dialog says so beside each one.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { Org } from "@api/types";
import { Button, Callout, Dl, Panel, Skeleton, View } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate } from "@shared/format";
import { OrgLogo } from "@shared/org-logo";
import { kindRows } from "@shared/org-profile";
import { EditProfileDialog } from "@shared/org-profile-edit";
import { companyRows, draftFromOrg, expertiseRows, hasExpertise } from "@shared/org-profile-form";
import { canEditOrgProfile } from "@shared/rbac";

export function OrganisationProfilePage() {
  const session = useSession();
  const [editing, setEditing] = useState(false);
  const org = useQuery({ queryKey: ["org-me"], queryFn: () => get<Org>("/organisations/me") });

  const o = org.data;
  const profiled = !!o && ["client", "tenant"].includes(o.kind);
  const partner = o?.kind === "tenant";
  const mayEdit = profiled && canEditOrgProfile(session);

  if (org.isLoading) {
    return <View title="Organisation profile"><Panel><Skeleton rows={6} label="Loading your organisation" /></Panel></View>;
  }
  if (org.isError || !o) {
    return (
      <View title="Organisation profile">
        <Panel>
          <Callout tone="critical" title="Your organisation could not be loaded">
            {org.error instanceof Error ? org.error.message : "Try again in a moment."}
          </Callout>
        </Panel>
      </View>
    );
  }

  return (
    <View
      title="Organisation profile"
      sub="What the organisations you work with see about you."
      actions={
        <>
          {/* its page in the vendors directory, exactly as a client opens it */}
          {partner && <Link className="btn" to={`/vendors/${o.id}`}>See how clients see you</Link>}
          {mayEdit && <Button variant="primary" onClick={() => setEditing(true)}>Edit profile</Button>}
        </>
      }
    >
      {partner && !hasExpertise(draftFromOrg(o).expertise) && (
        <Callout tone="attention" title="Your expertise is not listed yet">
          Clients filter the vendors directory by data type, domain, region, language and
          certification. Until you list yours, those filters leave you out.
          {mayEdit ? " Add it from Edit profile." : " An owner or manager can add it."}
        </Callout>
      )}
      <Panel>
        <div className="orghead">
          <OrgLogo orgId={o.id} version={o.logo_version} name={o.name} size={64} />
          <div>
            <b>{o.name}</b>
            <p className="small muted"><span className="id">{o.reference_code}</span></p>
          </div>
        </div>
        <Dl
          rows={[
            ...(profiled ? companyRows(draftFromOrg(o)) : []),
            ...(partner ? expertiseRows(draftFromOrg(o).expertise) : []),
            ...kindRows(o),
            ["Onboarded", fmtDate(o.onboarded_at ?? null)],
          ]}
        />
        {profiled && !mayEdit && (
          <p className="muted small" style={{ marginTop: 12 }}>
            An owner or manager of {o.name} can update this profile.
          </p>
        )}
      </Panel>

      {editing && <EditProfileDialog org={o} ops={false} onClose={() => setEditing(false)} />}
    </View>
  );
}
