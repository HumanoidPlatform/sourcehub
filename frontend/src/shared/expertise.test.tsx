// A delivery partner's expertise: declared in the profile form, sent whole,
// never sent for a client, and read back wherever the partner is shown. And
// the figures beside it, which are the calculated ones or nothing.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Org, Performance } from "@api/types";
import { Dl, ToastProvider } from "@ds/primitives";
import { COUNTRIES } from "./countries";
import {
  CERTIFICATIONS, DATA_TYPES, DOMAINS, EXPERTISE_KEYS, EXPERTISE_MAX, expertiseLabel, optionsOf,
} from "./expertise";
import { LANGUAGES } from "./languages";
import { EditProfileDialog } from "./org-profile-edit";
import { performanceRows } from "./org-profile";
import {
  BLANK_EXPERTISE, BLANK_PROFILE, draftFromOrg, draftFromPayload, expertiseRows, hasExpertise,
  onboardingPayload, profilePatch, validateProfile, type ProfileDraft,
} from "./org-profile-form";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve({ url: "https://blob.example/l.png", expires_in: 900 })),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  put: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve({})),
  putFile: vi.fn((): Promise<void> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

const PARTNER: Org = {
  id: "t1", reference_code: "TN-01", kind: "tenant", name: "NorthStar", status: "active",
  parent_org_id: null, country: "India", residency_region: "APAC", billing_status: "current",
  rating: 4.6, legal_name: "NorthStar Private Limited",
  profile: { hq: "Pune", plan: "Partner Pro", capabilities: null, fair_work_attested: true, since: "2024-03-01" },
  public_profile: {
    website: "https://northstar.example",
    expertise: { data_types: ["video"], regions: ["IN"], domains: [], languages: [], certifications: [] },
  },
  logo_version: null,
};
const CLIENT: Org = {
  ...PARTNER, id: "c1", reference_code: "CL-01", kind: "client", name: "Acme",
  profile: { industry: "Retail", plan: "Enterprise", dpa_signed: true },
  public_profile: { website: "https://acme.example" },
};

const tenant = (expertise: Partial<ProfileDraft["expertise"]>): ProfileDraft => ({
  ...BLANK_PROFILE, name: "NorthStar", expertise: { ...BLANK_EXPERTISE, ...expertise },
});

function edit(org: Org, onClose = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <EditProfileDialog org={org} ops={false} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return onClose;
}

const group = (name: string) => within(screen.getByRole("group", { name }));
const box = (groupName: string, label: string) =>
  group(groupName).getByRole("checkbox", { name: label }) as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

beforeEach(() => {
  for (const f of Object.values(api)) f.mockClear();
});

describe("the lists", () => {
  it("offers every value with a label, and none twice", () => {
    for (const key of EXPERTISE_KEYS) {
      const options = optionsOf(key);
      expect(options.length).toBeGreaterThan(0);
      expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
      expect(options.every((o) => o.label.trim().length > 0)).toBe(true);
    }
    expect(optionsOf("data_types")).toHaveLength(DATA_TYPES.length);
    expect(optionsOf("domains")).toHaveLength(DOMAINS.length);
    expect(optionsOf("certifications")).toHaveLength(CERTIFICATIONS.length);
    expect(optionsOf("languages")).toHaveLength(LANGUAGES.length);
    expect(optionsOf("regions")).toHaveLength(COUNTRIES.length);
  });

  it("never caps a list above its own length", () => {
    for (const key of EXPERTISE_KEYS) expect(EXPERTISE_MAX[key]).toBeLessThanOrEqual(optionsOf(key).length);
  });

  it("prints a value it does not know as itself rather than as nothing", () => {
    expect(expertiseLabel("data_types", "video")).toBe("Video");
    expect(expertiseLabel("regions", "IN")).toBe("India");
    expect(expertiseLabel("languages", "hin")).toBe("Hindi");
    expect(expertiseLabel("certifications", "soc_2")).toBe("SOC 2");
    expect(expertiseLabel("domains", "space")).toBe("space");
  });
});

describe("what is sent", () => {
  it("sends a partner's expertise whole", () => {
    const d = tenant({ data_types: ["video", "image"], regions: ["IN"], other_certifications: "  TISAX " });
    expect(onboardingPayload(d, "tenant").expertise).toEqual({
      data_types: ["video", "image"], domains: [], regions: ["IN"], languages: [], certifications: [],
      other_certifications: "TISAX",
    });
  });

  it("sends none for a partner that has declared none", () => {
    expect("expertise" in onboardingPayload(tenant({}), "tenant")).toBe(false);
    expect(hasExpertise(BLANK_EXPERTISE)).toBe(false);
    expect(hasExpertise({ ...BLANK_EXPERTISE, other_certifications: "  " })).toBe(false);
    expect(hasExpertise({ ...BLANK_EXPERTISE, other_certifications: "TISAX" })).toBe(true);
  });

  it("never sends expertise for a client, whatever the draft holds", () => {
    const d = tenant({ data_types: ["video"] });
    expect("expertise" in onboardingPayload(d, "client")).toBe(false);
    expect("expertise" in profilePatch(BLANK_PROFILE, d, "client", { ops: true })).toBe(false);
  });

  it("patches expertise only when it changed, and as a whole", () => {
    const before = draftFromOrg(PARTNER);
    expect(profilePatch(before, before, "tenant", { ops: false })).toEqual({});
    const after = { ...before, expertise: { ...before.expertise, domains: ["retail"] } };
    expect(profilePatch(before, after, "tenant", { ops: false })).toEqual({
      expertise: {
        data_types: ["video"], domains: ["retail"], regions: ["IN"], languages: [], certifications: [],
      },
    });
  });

  it("clears it with a null when every box is unticked", () => {
    const before = draftFromOrg(PARTNER);
    const after = { ...before, expertise: BLANK_EXPERTISE };
    expect(profilePatch(before, after, "tenant", { ops: false })).toEqual({ expertise: null });
  });

  it("lets an owner change it: expertise is not the account's terms", () => {
    const before = draftFromOrg(PARTNER);
    const after = { ...before, expertise: { ...before.expertise, certifications: ["gdpr"] } };
    expect(Object.keys(profilePatch(before, after, "tenant", { ops: false }))).toEqual(["expertise"]);
  });

  it("reads it back from an organisation and from a returned request", () => {
    expect(draftFromOrg(PARTNER).expertise).toEqual({
      ...BLANK_EXPERTISE, data_types: ["video"], regions: ["IN"],
    });
    expect(draftFromOrg(CLIENT).expertise).toEqual(BLANK_EXPERTISE);
    const d = tenant({ languages: ["eng"], other_certifications: "TISAX" });
    expect(draftFromPayload("NorthStar", onboardingPayload(d, "tenant")).expertise).toEqual(d.expertise);
    // something that is not a list is no list
    expect(draftFromPayload("x", { expertise: { data_types: "video", regions: [1, "IN"] } }).expertise)
      .toEqual({ ...BLANK_EXPERTISE, regions: ["IN"] });
  });

  it("refuses a draft that arrived over a limit", () => {
    const many = DOMAINS.map(([v]) => v);
    expect(validateProfile(tenant({ domains: many }), { required: false }).expertise).toMatch(/at most 8 domains/);
    expect(validateProfile(tenant({ domains: many.slice(0, 8) }), { required: false })).toEqual({});
    expect(validateProfile(tenant({ other_certifications: "x".repeat(121) }), { required: false }).expertise)
      .toMatch(/under 120/);
    expect(validateProfile(tenant({ other_certifications: "x".repeat(120) }), { required: false })).toEqual({});
  });
});

describe("reading it back", () => {
  it("lists only what the partner declared, in words", () => {
    const rows = expertiseRows({
      ...BLANK_EXPERTISE, data_types: ["video", "image"], regions: ["IN", "US"], other_certifications: "TISAX",
    });
    render(<Dl rows={rows} />);
    expect(rows.map(([k]) => k)).toEqual(["Data types", "Regions", "Other certifications"]);
    expect(screen.getByText("Video, Image")).toBeTruthy();
    expect(screen.getByText("India, United States")).toBeTruthy();
    expect(expertiseRows(BLANK_EXPERTISE)).toEqual([]);
  });
});

describe("the editor", () => {
  it("offers the expertise section to a partner and not to a client", () => {
    edit(CLIENT);
    expect(screen.queryByRole("heading", { name: "Expertise" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Data types" })).toBeNull();
  });

  it("opens with what the partner has already declared", () => {
    edit(PARTNER);
    expect(screen.getByRole("heading", { name: "Expertise" })).toBeTruthy();
    expect(box("Data types", "Video").checked).toBe(true);
    expect(box("Data types", "Audio").checked).toBe(false);
    expect(screen.getByRole("button", { name: "Remove India" })).toBeTruthy();
  });

  it("saves the whole expertise when one box changes", async () => {
    const onClose = edit(PARTNER);
    fireEvent.click(box("Data types", "Audio"));
    fireEvent.click(box("Certifications", "ISO 27001"));
    fireEvent.change(screen.getByLabelText("Languages"), { target: { value: "hin" } });
    fireEvent.change(screen.getByLabelText("Other certifications"), { target: { value: "TISAX" } });
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith("/organisations/t1", {
      expertise: {
        data_types: ["video", "audio"], domains: [], regions: ["IN"], languages: ["hin"],
        certifications: ["iso_27001"], other_certifications: "TISAX",
      },
    });
  });

  it("adds a country from the list and takes it off the list", () => {
    edit(PARTNER);
    const select = screen.getByLabelText("Regions") as HTMLSelectElement;
    const offered = () => [...select.options].map((o) => o.value);
    expect(offered()).not.toContain("IN");
    fireEvent.change(select, { target: { value: "US" } });
    expect(screen.getByRole("button", { name: "Remove United States" })).toBeTruthy();
    expect(offered()).not.toContain("US");
    expect(select.value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Remove India" }));
    expect(offered()).toContain("IN");
  });

  it("does not take a tick past the limit", () => {
    edit({
      ...PARTNER,
      public_profile: { expertise: { domains: DOMAINS.slice(0, EXPERTISE_MAX.domains).map(([v]) => v) } },
    });
    const ninth = DOMAINS[EXPERTISE_MAX.domains]![1];
    fireEvent.click(box("Domains", ninth));
    expect(box("Domains", ninth).checked).toBe(false);
    // and unticking one makes room
    fireEvent.click(box("Domains", DOMAINS[0]![1]));
    fireEvent.click(box("Domains", ninth));
    expect(box("Domains", ninth).checked).toBe(true);
  });

  it("refreshes the partner's page in the directory after a save", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <ToastProvider><EditProfileDialog org={PARTNER} ops={false} onClose={onClose} /></ToastProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(box("Data types", "Audio"));
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const keys = invalidate.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey));
    expect(keys).toContain('["vendors"]');
    expect(keys).toContain('["vendor","t1"]');
  });
});

describe("a partner's figures on a profile", () => {
  const RECORD: Performance = {
    contracts_completed: 14, on_time_pct: 94, accepted_first_time_pct: 92, qa_pass_pct: 88,
    rating_avg: 4.6, rating_count: 12,
  };

  it("shows the calculated figures and how many ratings stand behind the average", () => {
    render(<Dl rows={performanceRows(RECORD)} />);
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByText("★ 4.6 (12)")).toBeTruthy();
    for (const pct of ["94%", "92%", "88%"]) expect(screen.getByText(pct)).toBeTruthy();
    expect(screen.getByText("Accepted first time")).toBeTruthy();
    expect(screen.getByText("QA pass at its own gate")).toBeTruthy();
  });

  it.each([undefined, { ...RECORD, contracts_completed: 0, rating_count: 0, rating_avg: null }])(
    "says there is no completed work instead of showing dashes",
    (p) => {
      expect(performanceRows(p)).toEqual([["Track record", "No completed work yet"]]);
    },
  );

  it("shows a dash for the one figure that could not be measured", () => {
    render(<Dl rows={performanceRows({ ...RECORD, on_time_pct: null, rating_avg: null, rating_count: 0 })} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("92%")).toBeTruthy();
  });
});
