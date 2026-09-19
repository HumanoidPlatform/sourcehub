// legal — the public privacy policy at /privacy.
//
// Public on purpose: the phone app's first-run notice links here and opens it
// in a browser that is not signed in, and Google Play will later require this
// exact URL on the store listing.
//
// The OPERATOR values were supplied by the organisation on 19 September 2026.
// The text still deserves a lawyer's eye against India's DPDP Act 2023. If a
// value is ever reset to a [placeholder] the page says so at the top. The
// short notice in the phone app (mobile/src/consent.ts) says the same things
// in fewer words; change them together.
//
// It must not promise anything the platform does not do. Nothing deletes data
// automatically today, and the request form's "strip GPS", "blur faces" and
// "redact plates" options are not implemented — so deletion is described as a
// request to a person, which is what it is.

import { Callout } from "@ds/primitives";
import { BRAND, BRAND_FULL, BrandMark } from "@shared/brand";

const OPERATOR = {
  name: "Vaieon",
  address: "Sainik Puri, Hyderabad",
  contactEmail: "vaieoncosarathi@gmail.com",
  retention: "90 days",
};
const LAST_UPDATED = "19 September 2026";
const isDraft = Object.values(OPERATOR).some((v) => /^\[.*\]$/.test(v));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 15 }}>{title}</h2>
      <div style={{ lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ground)", padding: 24 }}>
      <div className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="panel-body">
          <BrandMark />
          <h1 style={{ margin: "14px 0 2px", fontSize: 22 }}>Privacy policy</h1>
          <p className="small muted" style={{ margin: 0 }}>
            {BRAND_FULL} and the {BRAND} Capture app · last updated {LAST_UPDATED}
          </p>

          {isDraft && (
            <div style={{ marginTop: 16 }}>
              <Callout tone="critical" title="Draft — not yet approved">
                The operator's name, address, contact and retention period have not been filled in. This page must not be
                relied on until they are.
              </Callout>
            </div>
          )}

          <Section title="Who we are">
            <p style={{ margin: 0 }}>
              {BRAND} is operated by {OPERATOR.name}, {OPERATOR.address}. For anything on this page, write to{" "}
              {OPERATOR.contactEmail}.
            </p>
          </Section>

          <Section title="If you capture photos or video with the app">
            <p style={{ marginTop: 0 }}>While you work, the {BRAND} Capture app records:</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><b>The photos and videos you take in the app</b>, including sound when you record video. They may show people who happen to be nearby.</li>
              <li><b>Your precise location at the moment of each capture</b>, and the time. Location is read only while you are capturing — never in the background, and never when the app is closed.</li>
              <li><b>Your name and email address</b>, and which assignments you worked on.</li>
              <li><b>How each capture was checked on your phone</b> — for example sharpness, tilt, and whether it appears to show the right subject. These checks run on the phone itself.</li>
              <li><b>Sign-in records</b>: when you signed in and from which internet address, kept to protect your account.</li>
            </ul>
            <p style={{ marginBottom: 0 }}>
              The app does not read your contacts, your other photos, or your location when you are not capturing, and it
              contains no advertising or tracking software.
            </p>
          </Section>

          <Section title="If you use the web console">
            <p style={{ margin: 0 }}>
              We hold your name, email address, the organisation you act for, what you do in the console (kept as an
              audit trail), and sign-in records. Documents you upload are stored with the request, proposal or task they
              belong to.
            </p>
          </Section>

          <Section title="Who receives captures">
            <p style={{ margin: 0 }}>
              A capture goes to the organisation that assigned the work, to the delivery partner it works for, and to the
              client who ordered it — and is stored in the storage location that client has chosen. Each organisation sees
              only the work that belongs to it. We do not sell personal data, and we do not use it for advertising.
            </p>
          </Section>

          <Section title="Why we use it">
            <p style={{ margin: 0 }}>
              To fulfil the client's order, to check the quality of captures, to pay for accepted work, to keep accounts
              secure, and to resolve disputes about what was delivered.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p style={{ margin: 0 }}>
              We keep our records of captures — where and when each was taken, who took it, and how it was checked —
              for {OPERATOR.retention} after the work is completed. The captures themselves are delivered into the
              storage of the client who ordered them, and that client keeps them under its own policy. Records of
              payments and of who approved what are kept for as long as the law requires.
            </p>
          </Section>

          <Section title="Your choices">
            <p style={{ margin: 0 }}>
              You can ask what we hold about you, ask us to correct it, or ask us to delete it, by writing to{" "}
              {OPERATOR.contactEmail}. A person will handle your request and tell you the outcome. Some records — for
              example of payments already made — may have to be kept, and we will tell you if that applies. You can stop
              using the app at any time; captures you have already submitted stay with the order they were made for
              unless you ask otherwise.
            </p>
          </Section>

          <Section title="People who appear in captures">
            <p style={{ margin: 0 }}>
              Captures are of places and objects, and may include people who happen to be there. If you believe you
              appear in a capture and want it reviewed or removed, write to {OPERATOR.contactEmail} with where and when it
              was taken.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p style={{ margin: 0 }}>
              When this policy changes in a way that matters, the app asks you to read and accept the new version before
              you continue.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
