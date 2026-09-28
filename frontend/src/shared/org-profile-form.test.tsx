// The profile form's rules and the bodies it sends. The server refuses a key it
// does not know and anything Ops-only from anyone else, so these pin that the
// console sends only the server's keys, only what changed, and never an
// Ops-only field on an owner's behalf.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Org } from "@api/types";
import { Dl } from "@ds/primitives";
import {
  BLANK_PROFILE, companyRows, draftFromOrg, draftFromPayload, formatAddress, onboardingPayload,
  profilePatch, validateProfile, type ProfileDraft,
} from "./org-profile-form";

const FULL: ProfileDraft = {
  ...BLANK_PROFILE,
  name: "Meridian Grocery Group",
  legal_name: "Meridian Grocery Group Private Limited",
  website: "meridian.example",
  country: "India",
  city: "Pune",
  address_country: "India",
};

const ORG: Org = {
  id: "o1", reference_code: "CL-0001", kind: "client", name: "Meridian", status: "active",
  parent_org_id: null, country: "India", residency_region: "APAC", billing_status: "current",
  rating: null, legal_name: "Meridian Private Limited",
  profile: { industry: "Retail", plan: "Enterprise", dpa_signed: true },
  public_profile: {
    website: "https://meridian.example",
    company_size: "51-200",
    registered_address: { line1: "1 MG Road", city: "Pune", country: "India" },
  },
  logo_version: null,
};

describe("validation", () => {
  it("requires the core fields when onboarding", () => {
    const e = validateProfile({ ...BLANK_PROFILE, name: "Acme" }, { required: true });
    expect(Object.keys(e).sort()).toEqual(["address_country", "city", "country", "legal_name", "website"]);
  });

  it("requires none of them when editing, but half an address is not one", () => {
    expect(validateProfile({ ...BLANK_PROFILE, name: "Acme" }, { required: false })).toEqual({});
    const e = validateProfile({ ...BLANK_PROFILE, name: "Acme", line1: "1 MG Road" }, { required: false });
    expect(Object.keys(e).sort()).toEqual(["address_country", "city"]);
  });

  it.each(["N/A", "someone@acme.com", "acme", "https://"])("refuses %s as a website", (website) => {
    expect(validateProfile({ ...FULL, website }, { required: true }).website).toBeTruthy();
  });

  it("accepts a bare domain, which the server completes", () => {
    expect(validateProfile(FULL, { required: true })).toEqual({});
  });

  it("checks only the fields a step names", () => {
    const e = validateProfile(BLANK_PROFILE, { required: true, only: ["city", "address_country"] });
    expect(Object.keys(e).sort()).toEqual(["address_country", "city"]);
  });

  it("bounds the founding year", () => {
    expect(validateProfile({ ...FULL, founded_year: "1700" }, { required: true }).founded_year).toBeTruthy();
    expect(validateProfile({ ...FULL, founded_year: "20x2" }, { required: true }).founded_year).toBeTruthy();
    expect(validateProfile({ ...FULL, founded_year: "2012" }, { required: true }).founded_year).toBeUndefined();
  });
});

describe("the onboarding payload", () => {
  it("sends the server's keys, the address assembled, and no empties", () => {
    const body = onboardingPayload({ ...FULL, industry: "Retail", founded_year: "2012" }, "client");
    expect(body).toEqual({
      legal_name: "Meridian Grocery Group Private Limited",
      website: "meridian.example",
      country: "India",
      founded_year: 2012,
      industry: "Retail",
      registered_address: { city: "Pune", country: "India" },
    });
  });

  it("never sends the other kind's fields", () => {
    const partner = onboardingPayload({ ...FULL, industry: "Retail", hq: "Pune" }, "tenant");
    expect(partner).not.toHaveProperty("industry");
    expect(partner).toHaveProperty("hq", "Pune");
    const client = onboardingPayload({ ...FULL, hq: "Pune", capabilities: "Imagery" }, "client");
    expect(client).not.toHaveProperty("hq");
    expect(client).not.toHaveProperty("capabilities");
  });

  it("round-trips through a returned request", () => {
    const again = draftFromPayload(FULL.name, onboardingPayload(FULL, "client"));
    expect(again).toEqual(FULL);
  });
});

describe("the edit patch", () => {
  it("sends only what changed, and a cleared field as null", () => {
    const before = draftFromOrg(ORG);
    const after = { ...before, company_size: "", description: "Grocery retail across India." };
    expect(profilePatch(before, after, "client", { ops: false })).toEqual({
      company_size: null,
      description: "Grocery retail across India.",
    });
  });

  it("sends an address as a whole object when any part of it changes", () => {
    const before = draftFromOrg(ORG);
    expect(profilePatch(before, { ...before, postal_code: "411001" }, "client", { ops: false })).toEqual({
      registered_address: { line1: "1 MG Road", city: "Pune", country: "India", postal_code: "411001" },
    });
  });

  it("never sends an Ops-only field for an owner, but does for Ops", () => {
    const before = draftFromOrg(ORG);
    const after = { ...before, legal_name: "Meridian Retail Limited", plan: "Growth", website: "https://m.example" };
    expect(profilePatch(before, after, "client", { ops: false })).toEqual({ website: "https://m.example" });
    expect(profilePatch(before, after, "client", { ops: true })).toEqual({
      legal_name: "Meridian Retail Limited",
      plan: "Growth",
      website: "https://m.example",
    });
  });

  it("is empty when nothing changed", () => {
    const d = draftFromOrg(ORG);
    expect(profilePatch(d, { ...d }, "client", { ops: true })).toEqual({});
  });
});

describe("reading it back", () => {
  it("formats an address on one line", () => {
    expect(formatAddress({ line1: "1 MG Road", city: "Pune", region: "MH", postal_code: "411001", country: "India" }))
      .toBe("1 MG Road, Pune, MH 411001, India");
  });

  it("links the website in a new tab without handing it the opener", () => {
    render(<Dl rows={companyRows(draftFromOrg(ORG))} />);
    const link = screen.getByRole("link", { name: "meridian.example" });
    expect(link.getAttribute("href")).toBe("https://meridian.example");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
