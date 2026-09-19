// The privacy notice a worker accepts before their first assignment, and the
// record of having accepted it. Pure — no storage, no React — so it can be
// tested without a phone; consentStore.ts does the reading and writing.
//
// FOR THE PILOT THE RECORD LIVES ON THIS PHONE ONLY. There is no server table
// yet (docs/mobile-pilot-build-plan.md): the durable record is the
// acknowledgement each aggregator collects from its workers on paper or by
// email. The record below already has the shape the server will want, so when
// that table arrives the app uploads what it holds and nobody is asked twice.

import { PRODUCTION_API_URL } from "@/config";

/** Bump to ask everyone again. It travels over the air, so a corrected notice
 *  reaches every phone without a new build. */
export const PRIVACY_NOTICE_VERSION = "1";

export const POLICY_URL = `${PRODUCTION_API_URL}/privacy`;

/** Supplied by the organisation on 19 September 2026. The wording below still
 *  deserves a lawyer's eye against India's DPDP Act 2023. If any of these is
 *  ever reset to a [placeholder] the consent screen shows a DRAFT banner, so a
 *  build cannot go out with one unnoticed.
 *
 *  RETENTION IS A COMMITMENT, NOT A DESCRIPTION: nothing in the platform deletes
 *  anything after 90 days today. Until a clean-up job exists, someone has to do
 *  it by hand — see docs/mobile-pilot-build-plan.md. */
export const OPERATOR = {
  name: "Vaieon",
  contactEmail: "vaieoncosarathi@gmail.com",
  retention: "90 days",
};

export interface NoticeSection {
  heading: string;
  body: string;
}

/** Plain words, short lines: it is read on a phone, often in a second language.
 *
 * It must not promise anything the platform does not do. Nothing deletes data
 * automatically today, and the client-facing "strip GPS", "blur faces" and
 * "redact plates" options are not implemented — so this describes a contact
 * route for deletion, not an automatic process. */
export const NOTICE: { title: string; intro: string; sections: NoticeSection[] } = {
  title: "Before you start",
  intro: "Cosarathi Capture records the following while you work. Please read it once.",
  sections: [
    {
      heading: "Photos and videos you take in the app",
      body: "Including sound when you record video. They may show people who happen to be nearby.",
    },
    {
      heading: "Where and when each one was taken",
      body: "Your precise location at the moment of each capture, and the time. Location is read only while you are capturing — never in the background, and never when the app is closed.",
    },
    {
      heading: "Who you are",
      body: "Your name and email address, and which assignments you worked on.",
    },
    {
      heading: "How each capture was checked on this phone",
      body: "For example sharpness, tilt, and whether it appears to show the right subject.",
    },
    {
      heading: "Who receives it",
      body: "The organisation that assigned you the work, the delivery partner it works for, and the client who ordered the captures. It is used to fulfil that order and to review and pay for your work.",
    },
    {
      heading: "How long, and your choices",
      // Two separate facts, kept separate on purpose. Captures are written
      // straight into the CLIENT's own storage, which this platform cannot
      // reach into afterwards — so our retention period can only ever be about
      // our own records, and saying otherwise would be a promise we cannot keep.
      body: `We keep our records of your captures for ${OPERATOR.retention} after the work is completed. The client who ordered the captures keeps its own copy under its own rules. To ask what we hold about you, or to ask for it to be deleted, write to ${OPERATOR.contactEmail}. Operated by ${OPERATOR.name}.`,
    },
  ],
};

export const hasPlaceholders = (): boolean => Object.values(OPERATOR).some((v) => /^\[.*\]$/.test(v.trim()));

// --- the record -------------------------------------------------------------

export const CONSENT_DOCUMENT = "worker_privacy_notice";

/** Exactly what the server-side user_consent row will hold. Keep it that way. */
export interface ConsentRecord {
  document: typeof CONSENT_DOCUMENT;
  version: string;
  /** ISO 8601, from this phone's clock — acceptance may happen with no signal */
  accepted_at: string;
  app_version: string | null;
  platform: string;
}

export const consentKey = (userId: string): string => `consent:${userId}`;

export function makeRecord(now: Date, appVersion: string | null, platform: string): ConsentRecord {
  return {
    document: CONSENT_DOCUMENT,
    version: PRIVACY_NOTICE_VERSION,
    accepted_at: now.toISOString(),
    app_version: appVersion,
    platform,
  };
}

/** What was saved, or null for anything that is not a record — a missing key,
 *  a truncated write, a value from some future shape. Unreadable means "ask
 *  again", never "assume they agreed". */
export function parseConsent(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ConsentRecord> | null;
    if (!v || v.document !== CONSENT_DOCUMENT) return null;
    if (typeof v.version !== "string" || typeof v.accepted_at !== "string") return null;
    if (Number.isNaN(Date.parse(v.accepted_at))) return null;
    return {
      document: CONSENT_DOCUMENT,
      version: v.version,
      accepted_at: v.accepted_at,
      app_version: typeof v.app_version === "string" ? v.app_version : null,
      platform: typeof v.platform === "string" ? v.platform : "unknown",
    };
  } catch {
    return null;
  }
}

/** Accepted THIS version. An older acceptance does not carry over: the notice
 *  changed, so the question is asked again. */
export const isCurrent = (rec: ConsentRecord | null, version: string = PRIVACY_NOTICE_VERSION): boolean =>
  rec !== null && rec.version === version;
