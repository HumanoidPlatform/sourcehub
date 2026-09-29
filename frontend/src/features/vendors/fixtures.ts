// Three vendors that differ in everything the directory filters and sorts by.
// Test data only; imported by the tests beside it.

import type { Expertise, Performance, Vendor } from "@api/types";

const NO_EXPERTISE: Expertise = {
  data_types: [], domains: [], languages: [], regions: [], certifications: [],
  other_certifications: null,
};

export const NO_RECORD: Performance = {
  contracts_completed: 0, on_time_pct: null, accepted_first_time_pct: null, qa_pass_pct: null,
  rating_avg: null, rating_count: 0,
};

export function vendor(over: Partial<Vendor> & { id: string; name: string }): Vendor {
  return {
    reference_code: "TN-00", country: "India", hq: null, partner_since: null,
    fair_work_attested: false, website: null, description: null, company_size: null,
    founded_year: null, years_in_business: null, registered_address: null,
    expertise: NO_EXPERTISE, logo_version: null, performance: NO_RECORD,
    ...over,
  };
}

/** Established, well rated, video and image in India and the US. */
export const NORTHSTAR = vendor({
  id: "v-ns", name: "NorthStar Delivery Partners", reference_code: "TN-01",
  hq: "Pune, India", partner_since: "2024-03-01", fair_work_attested: true,
  website: "https://northstar.example",
  description: "Field data collection across South Asia, with crews in twelve cities.",
  company_size: "51-200", founded_year: 2016, years_in_business: 10,
  registered_address: { line1: "1 MG Road", city: "Pune", country: "India" },
  expertise: {
    data_types: ["video", "image"], domains: ["retail", "automotive"], languages: ["eng", "hin"],
    regions: ["IN", "US"], certifications: ["iso_27001", "soc_2"], other_certifications: "TISAX",
  },
  performance: {
    contracts_completed: 14, on_time_pct: 94, accepted_first_time_pct: 92, qa_pass_pct: 88,
    rating_avg: 4.6, rating_count: 12,
  },
});

/** More projects, a lower rating, audio and text across South-East Asia. */
export const MERIDIAN = vendor({
  id: "v-mer", name: "Meridian Field Ops", reference_code: "TN-02",
  hq: "Singapore", country: "Singapore", partner_since: "2025-01-15",
  description: "Speech and transcription programmes for voice assistants.",
  founded_year: 2019, years_in_business: 7,
  expertise: {
    data_types: ["audio", "text"], domains: ["telecom"], languages: ["eng", "ind", "msa"],
    regions: ["SG", "ID", "MY"], certifications: ["iso_27001"], other_certifications: null,
  },
  performance: {
    contracts_completed: 31, on_time_pct: 81, accepted_first_time_pct: 65, qa_pass_pct: 90,
    rating_avg: 3.9, rating_count: 27,
  },
});

/** Joined last, nothing completed, nothing declared but one data type. */
export const HELIX = vendor({
  id: "v-hx", name: "Helix Data Collective", reference_code: "TN-03",
  hq: "Nairobi", country: "Kenya", partner_since: "2026-08-20",
  expertise: { ...NO_EXPERTISE, data_types: ["image"], regions: ["KE"] },
});

// Frozen: a function that sorted or filtered the list it was given, instead of
// a copy, would reorder it for every later test and hide its own fault.
export const ALL: readonly Vendor[] = Object.freeze([NORTHSTAR, MERIDIAN, HELIX]);
