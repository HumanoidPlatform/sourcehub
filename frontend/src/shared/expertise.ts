// What a delivery partner declares its expertise from, and what a client
// filters the vendors directory by. In shared/ because two features read it:
// the organisation profile form offers these lists, and the directory
// filters on them.
//
// Curated lists, not free text: a filter only works if the partner that does
// video and the client looking for video spell it the same way. The API holds
// the same values (modules/identity/expertise_vocabulary.py) and refuses any
// other; tests/test_vendor_directory_unit.py compares the two files, because
// nothing generates one from the other.
//
// Order is presentation order: the most asked-for first.

import { COUNTRIES, countryLabel } from "@shared/countries";
import { LANGUAGES, languageLabel } from "@shared/languages";

export const DATA_TYPES = [
  ["image", "Image"],
  ["video", "Video"],
  ["audio", "Audio"],
  ["text", "Text"],
  ["structured_data", "Structured data"],
] as const;

export const DOMAINS = [
  ["retail", "Retail"],
  ["automotive", "Automotive"],
  ["healthcare", "Healthcare"],
  ["agriculture", "Agriculture"],
  ["finance", "Finance"],
  ["logistics", "Logistics"],
  ["real_estate", "Real estate"],
  ["manufacturing", "Manufacturing"],
  ["energy", "Energy"],
  ["public_sector", "Public sector"],
  ["media", "Media"],
  ["education", "Education"],
  ["telecom", "Telecom"],
  ["travel", "Travel"],
] as const;

export const CERTIFICATIONS = [
  ["iso_27001", "ISO 27001"],
  ["soc_2", "SOC 2"],
  ["iso_9001", "ISO 9001"],
  ["iso_27701", "ISO 27701"],
  ["hipaa", "HIPAA"],
  ["gdpr", "GDPR"],
] as const;

/** The five lists of an expertise, in the order a vendor page prints them. */
export type ExpertiseKey = "data_types" | "domains" | "regions" | "languages" | "certifications";

export const EXPERTISE_KEYS: readonly ExpertiseKey[] = [
  "data_types", "domains", "regions", "languages", "certifications",
];

/** How many of each a partner may claim. The API enforces the same numbers. */
export const EXPERTISE_MAX = {
  data_types: 5,
  domains: 8,
  languages: 34,
  regions: 60,
  certifications: 6,
} as const;

export const OTHER_CERTIFICATIONS_MAX = 120;

export const EXPERTISE_LABEL: Record<ExpertiseKey, string> = {
  data_types: "Data types",
  domains: "Domains",
  regions: "Regions",
  languages: "Languages",
  certifications: "Certifications",
};

type Pair = readonly [string, string];

const OPTIONS: Record<ExpertiseKey, readonly Pair[]> = {
  data_types: DATA_TYPES,
  domains: DOMAINS,
  regions: COUNTRIES,
  languages: LANGUAGES,
  certifications: CERTIFICATIONS,
};

/** Every value of a list with its label, in presentation order. */
export function optionsOf(key: ExpertiseKey): { value: string; label: string }[] {
  return OPTIONS[key].map(([value, label]) => ({ value, label }));
}

/** The label of one value. An unknown value prints as itself rather than as
 *  nothing, so a value the API learns before the console does is still shown. */
export function expertiseLabel(key: ExpertiseKey, value: string): string {
  if (key === "regions") return countryLabel(value);
  if (key === "languages") return languageLabel(value);
  const found = OPTIONS[key].find(([v]) => v === value);
  return found ? found[1] : value;
}
