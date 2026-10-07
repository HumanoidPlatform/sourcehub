# Designing the DataMind360 dataset marketplace: the decisions, and what the market shows

Written 1 October 2026 from 41 platform profiles, 24 contracts read in full, and a census of 144
platforms. Every factual statement cites the ledger claim behind it as `(platform cNNN)`, which
resolves to `profiles/<platform>.md` or `documents/index.md`, where the quote, URL and verification
verdict sit. How the evidence was gathered and checked, and what it could not reach, is in
`METHOD.md`.

**How to read the counts.** "23 of 41" means 23 of the 41 profiled platforms, not of the market.
The profiles over-represent image and video sellers on purpose, and 6 of the 41 are failures or
free government portals, so a count describes this sample. Where a decision rests on a handful of
platforms, the section says so.

**Where this stops.** It sets out options, who does what, what it cost them, and which options a fact
about DataMind360 rules out. It does not choose where the choice is business intent (supply policy,
exclusivity, price, fee), does not draft licence or consent text, and is not legal advice.

---

## The five things that matter most

1. **Nobody gives buyers consent evidence, and that is the opening.** 19 of 41 platforms only
   assert consent, 11 do not address it, and 3 hand buyers anything at all (Luel, truelabel, vAIsual).
   Across the 24 contracts, consent for the people shown is almost always a one-line warranty pushed
   onto whoever uploaded the file (Kled, Poseidon, Luel, Opendatabay, PIXTA). DataMind360 already runs
   the capture, the task, the QA gates and the worker; it is the only kind of operator that *could*
   show the evidence. Section 3.

2. **These are contact-sales businesses, not shops.** 23 of 41 close every deal through sales, 9 do
   both, and one (LDC) is a pure checkout. Where a buy button exists, image and video still go to a
   quote: most image listings on Datarade say "Pricing available upon request" (datarade c039, c056),
   and Luel sells audio on prepaid credit but lists video only as contact-sales (luel c070). Section 13.

3. **The operator is usually the licensor, not a venue.** 27 of 41 sell in their own name; the venues
   are the cloud exchanges and lead-generation sites (AWS, Snowflake, Datarade, PIXTA AI, Hugging
   Face). Being licensor is what lets the platform give one licence, one consent warranty and one
   indemnity, which is what buyers pay for. Section 5.

4. **Relisting commissioned work is where operators get hurt.** No profiled platform publishes how it
   carves resale rights out of client-commissioned work, and the after-the-fact term changes found
   all drew either litigation or press: Shutterstock's opt-out came 18 months after datasets launched,
   Wirestock auto-enrolled all new content with no opt-out, Kled switched contributors from
   non-exclusive to exclusive mid-2026. DataMind360 has told clients "partner reuse is off" and
   workers their captures "fulfil that order". Section 2.

5. **Nobody solves erasure after sale.** When a person withdraws, every contract read either keeps
   the buyer's copy (Luel, truelabel, Wirestock, Adobe) or reaches it only by terminating the licence
   (Defined.ai, Getty, Nexdata). The FTC's Everalbum order shows the remedy can reach trained models.
   DataMind360's blueprint already promises erasure that "propagates through ... delivered bundles"
   within 30 days. Section 9.

---

## Part A — Rights and supply

### 1. What gets listed, and on what rights

You chose three sources: data collected through the platform, Cosarathi's own collections, and
third-party providers. Every one exists in the market, and most operators run more than one.

| source | who does it | rights basis seen |
|---|---|---|
| Own collection by a crowd | Poseidon, Kled, Luel, FutureBeeAI, DataCluster, Bee Maps, Build AI, Nexdata | contributor grants a perpetual licence, often **exclusive for AI** (Poseidon c086, Kled c103) or work-for-hire (truelabel collector c063) |
| Commissioned work relisted | Karya (c031, c034), LDC (sponsored programmes flow into the catalogue, c060), Poseidon ("public slices", c065), Luel (completed collections feed the catalogue, c017) | stated up front in the commissioning contract where it is stated at all |
| Third-party providers | Defined.ai, Protege, Troveo, PIXTA AI, Opendatabay, Datarade, ELRA, AWS, Snowflake | provider warrants rights; operator takes a sublicensable licence (protege c036, troveo c086) or acts as venue (pixta-ai c010) |
| Contributor libraries | Shutterstock, Getty, Adobe, Wirestock, DataSeeds | non-exclusive contributor licence extended to AI use, often by a terms change |

**What it means for DataMind360.** The platform-collected lane is the distinctive one, and it is also
the one the current schema and promises block: `partner_reuse_allowed` defaults to false, captures go
to the client's bucket, and the worker notice ties captures to one order. The own-collection lane is
the cleanest: Cosarathi commissions itself, so it sets the terms before capture. The third-party lane
is the one with the weakest evidence anywhere in the market (provider-asserted throughout).

Evidence strength: strong on who does what (33 of 41 sourced on Q3). Weak on the rights terms of
commissioned work — see §2.

### 2. Relisting work a client paid for

**What the market shows.** Almost nothing in writing. 22 of 41 had only partial evidence and 14 none.
The patterns that exist:

- **Exclusive by default for commissioned work, non-exclusive for catalogue** — truelabel (c112, c137),
  FutureBeeAI (c011, c012), Getty Custom Content (c044), Nexdata ("data destroyed upon delivery", c074).
- **Resale written into the commission up front** — Karya told its client the dataset would be resold
  after the client's use (c031); LDC routes sponsored-programme data into its catalogue (c060).
- **Exclusivity sold back as a premium** — vAIsual prices custom shoots by whether the client needs
  exclusive material (vaisual c066); Macgence offers exclusive or non-exclusive per deal (macgence c005).

**What happened to those who changed terms after the fact:**

- Shutterstock launched datasets in July 2021; contributors got an opt-out only in January 2023, and
  only for future datasets (shutterstock c123, c031); the press questioned consent (c128).
- Wirestock's January 2026 terms auto-enrolled all new content in dataset deals with no opt-out
  (wirestock c025, c028).
- Kled moved contributors from a non-exclusive grant (May 2026) to an exclusive one (July 2026)
  (kled c122, c103). The profiler also saw Kled's receipt ledger still marking the May version as
  current on every receipt (kled c087), but that line was not on the page when re-checked.
- PIXTA rewrote its contributor grant in 2023 to include ML use and in 2024 began selling contributor
  stock for generative AI with a 20% pool (pixta-ai c103, c121, c127).
- Everalbum repurposed photos uploaded for storage to train face models; the FTC ordered the photos
  *and every model built from them* destroyed (everalbum c007, c008, c022).

**Ruled out or made costly by DataMind360's facts.** Relisting existing contracts without asking: every
client so far was told "Off means they collect it for you and keep no rights to it" (repo, fact 4).
The ledger has no precedent for doing that silently and several for the cost of doing so.

**The options the market supports:** (a) ask each client, with a share of each sale (the prototype's
route); (b) a non-exclusive commission tier priced lower, with resale stated at RFP time; (c) treat
past contracts as closed and list only data commissioned after the terms change.

**Unknown:** what any operator actually pays a commissioning client to relist. Needs buyer and client
interviews.

### 3. Consent for onward sale — by party

**The capturer.** Platforms get it by contract: a licence grant in the contributor terms (Poseidon,
Kled, Luel, Adobe, Wirestock), work-for-hire (truelabel collector c063), or a per-task consent in the
capture app (FutureBeeAI c082, Luel c156). Opt-out models (Shutterstock c031) and auto-enrolment
(Wirestock c028) both exist; both were added after supply already existed.

**The person shown.** This is where the market is weakest:

| what the buyer gets | platforms |
|---|---|
| Consent documents or a structured consent record | **3**: truelabel (collector must obtain written release from every identifiable person and private-location owner, kept 6–10 years; doc-truelabel-collector), Luel (a "consent projection", not forms; luel c099), vAIsual (biometric release template shown; c033) |
| A warranty from the provider that consent exists | 19 (e.g. AWS DSA §4.1 bars identifying data unless already public; Snowflake bars face geometry in public listings; Kled, Poseidon, Luel push it to the uploader) |
| Nothing | 11 |

Stock media is the partial exception: Shutterstock, Getty, Adobe and Wirestock require model releases
from contributors and *flag* release status to buyers, but do not hand the release over (shutterstock
c076, c094; getty c051; adobe c014; wirestock c049).

**The place or property owner.** Only truelabel addresses it (non-incidental private locations,
doc-truelabel-collector). Stock libraries require property releases. Nobody else.

**Where it went wrong:** IBM Diversity in Faces relied on photographers' Creative Commons licences;
the people photographed had not consented, and BIPA suits reached IBM *and* the downloaders,
Microsoft, Amazon, Google and FaceFirst (ibm-diversity-in-faces c001–c006). LAION-5B contained
children's photos taken without consent (laion-5b c022, c023).

**For DataMind360.** The capture app, the QA gates and the task spec give it what nobody else has: it
knows when a person is in frame (on-device face checks already run) and who captured each file. What
it lacks is the consent itself — `consent_artefact` exists in the schema with no code behind it, and
worker consent lives on the phone (repo, fact 5). The prototype's "release on file for every person"
promise needs that built first.

### 4. Paying the people who captured it, when it sells again

| model | platforms |
|---|---|
| One-off pay per accepted item, nothing on resale | Poseidon (doc-poseidon-terms), truelabel collectors ("without any further compensation"), Kled (discretionary tokens or fiat), Luel, FutureBeeAI, Bee Maps |
| A share of each licence | Adobe 33% images / 35% video (c050, c051); Getty 15–45%, 20–50% for contracted suppliers (c049, c011); Wirestock 50% of dataset deals (c088); PIXTA 20% of net for gen-AI datasets (c127); Troveo 60% of fees for business-data owners (c074) |
| A pooled fund, pro rata | Shutterstock, about 20% of data-licence revenue on average (c027) |
| Royalties on resale to crowd workers | Karya says workers who collected one tuberculosis speech dataset will get royalties on its future resales (karya c032; also c024); the mechanism is not published |

Only 4 of 41 pay a share on resale in a way that could be confirmed. Paying crowd capturers a share is
rare, and the one Indian example (Karya) is unconfirmed in detail. It is a positioning choice, not a
norm.

---

## Part B — The operator's legal role

### 5. Licensor of record, or venue

| role | count | examples |
|---|---|---|
| Licensor of record (sells in its own name) | 27 | Defined.ai, Protege, Troveo, Kled, Luel, Getty, Shutterstock, Adobe, FutureBeeAI, Nexdata, LDC, ELRA |
| Venue (not party to the data contract) | 5 | AWS (c074), Snowflake (c002), Datarade (c003), PIXTA AI (c010), Hugging Face |
| Mixed | 4 | truelabel says venue but licenses under its own MSA (c031) |

Licensors take the provider's warranties and indemnities upstream and then give the buyer one licence.
Venues need not handle the money (Datarade) or handle it without being party (AWS invoices and pays
out, c088).

**The fee follows the role.** Venues charge commission: AWS 3% public, 3/2/1.5% private by contract
size (c050–c054); Datarade 15–30% plus a subscription (c029–c033); Opendatabay 30% falling to 5% by
sale size (doc-opendatabay-fees). Licensors keep a margin: they pay providers or contributors a share
(Troveo, Getty, Adobe) or own the data outright (Poseidon, Nexdata, Bee Maps).

**For DataMind360.** The 9% fee in the existing ledger is a venue's commission on a services contract.
A dataset sale where Cosarathi is licensor is a different economic model, and the ledger's
contract-keyed rows have nothing for it to attach to (repo, fact 2).

### 6. Who indemnifies whom, and the caps

From the 24 contracts:

- **Providers carry the risk almost everywhere.** Uncapped provider indemnity under the AWS DSA (§7.1);
  Defined.ai suppliers capped at 2x business value; Kled, Poseidon and Luel contributors uncapped while
  the operator caps itself at USD 100.
- **Operators who indemnify buyers cap it at fees paid** (Defined.ai, Protege, Opendatabay, vAIsual).
  Adobe is the outlier with up to USD 10,000 per asset (adobe-stock c034).
- **Mutual caps**: AWS at the greater of 3x trailing spend or USD 1M; Snowflake USD 50,000.

The contributor-facing terms of the closest analogues (Kled, Poseidon, Luel) are one-sided enough —
uncapped contributor indemnities, USD 100 operator caps — that they are a reputational risk in their
own right, and a crowd workforce in India is the population least able to carry an uncapped indemnity.

---

## Part C — Custody, versions, and after the sale

### 7. Where the bytes sit

| model | count | examples |
|---|---|---|
| Copy delivered to the buyer | 22 | Luel (signed URLs, per-version download caps, c045), truelabel (into the buyer's S3/GCS/Azure, c005), Troveo (in the buyer's format with a manifest, c111), Protege (hundreds of TB in hours, c105) |
| Shared in place, no copy | 1 | Snowflake (c025) |
| Mixed | 8 | AWS: files copied, or read-only access to the provider's bucket via an access point, revoked at expiry (c014, c025, c026) |
| Platform-hosted download | 3 | Hugging Face, Bee Maps, Adobe |

Video at training scale is delivered as a copy almost everywhere. Sharing in place is a cloud-exchange
feature and depends on everyone being in one cloud.

**For DataMind360.** Delivery into the buyer's own bucket is what truelabel does, and the platform
already has verified storage destinations per client (repo, fact 3). The harder question is the
*source*: captures today sit in the original client's bucket, so relisted data must be copied out of
storage DataMind360 does not own. The platform holds the credential and signs URLs into it, so this
is possible technically; whether the client's contract allows it is §2.

### 8. What a dataset, a version and an entitlement are

The weakest-evidenced area: 32 of 41 publish nothing on versioning. What exists:

- **AWS** is the only full model: product → data set → revision → asset; finalized revisions are
  immutable; each offer states how many past and future revisions a subscriber gets; revisions can be
  revoked with a stated reason; unpublishing keeps existing subscribers (aws-data-exchange c002, c021–c024, c083).
- **Luel**: a dataset sold in portions, each a SKU with its own version id; the licence binds to the
  version bought; withdrawals revoke the affected recordings with pro-rata credit (luel c088–c093, c125).
- **Hugging Face**: versions are Git revisions; DOIs pin one (c059, c062).
- **LDC**: new editions get new catalogue numbers and the old ones stay listed (c053).
- **Snowflake**: on delisting, paid consumers keep access for a calendar month (c033).

Nothing in the DataMind360 schema groups assets other than by contract (repo, fact 2). The AWS and
Luel models are the two worth copying from; both make the version, not the dataset, the thing a buyer
is entitled to.

### 9. When content must come out after it has been sold

| what happens to copies a buyer already holds | contracts |
|---|---|
| Buyer keeps them | Luel ("cannot retrieve delivered copies", but revokes entitlements still active), truelabel, Wirestock (licences survive in perpetuity, models untouched), Adobe, PIXTA AI, Opendatabay seller terms, Kled |
| Buyer must delete only when the licence ends | AWS DSA (90 days), Defined.ai (on termination, or immediately for the affected part on a claim), Nexdata (5 days on rescission) |
| Operator can order deletion of specific items | Getty (on an infringement claim, at the licensee's cost, c022), Opendatabay licence (on written request; models may be kept if the data cannot be reconstructed) |

No contract read provides a data-subject withdrawal that reaches specific delivered copies, which is
exactly what the DataMind360 blueprint promises. The Everalbum order shows a regulator will reach
trained models when consent was missing (everalbum c007, c008). LAION's takedown notice told existing
holders nothing (laion-5b c002).

**For DataMind360.** The prototype's "delete these 14 clips within 30 days; trained models unaffected"
is a clause only Getty and Opendatabay come close to. It needs per-clip manifests (to name what to
delete) and a licence clause that survives into the buyer's contract.

---

## Part D — The licence

### 10. Standard, tiered or negotiated

| model | count | examples |
|---|---|---|
| Mixed or negotiated | 18 | Protege (SOW per deal), Troveo, Shutterstock, Wirestock |
| Provider-defined | 6 | AWS (default DSA or the provider's own), Snowflake, Datarade, Hugging Face |
| Tiered standard | 4 | ELRA (research, evaluation, commercial VAR), LDC (non-member research vs for-profit member), Adobe (Standard, Enhanced, Extended), vAIsual (generative use costs extra) |
| One standard licence | 3 | Defined.ai DLA, FutureBeeAI, Luel |

**What a training licence actually grants**, from the contracts: train, fine-tune, evaluate and ship
models; no redistribution of the data; no re-identification; usually no outputs that reproduce
recognisable people (Defined.ai: no recognisable voices or avatars; Protege: no digital replicas or
verbatim scene output; AWS: no re-identification). Buyers own their models (AWS DSA, FutureBeeAI).

**The stock-licence trap.** Getty's and Adobe's ordinary stock licences *ban* AI training
(getty-images c018; adobe-stock c028); training rights are sold separately and negotiated. A DataMind360 licence needs to be a
training licence from the start, not a media licence with a clause added.

### 11. Exclusivity

Only 5 of 41 offer it in a way that could be confirmed (FutureBeeAI, Macgence, Troveo, Getty,
truelabel); 30 publish nothing. Where it exists it is time-limited and priced (Troveo c053) or limited
to newly commissioned data (truelabel c112). The prototype's "exclusive window, on request" matches
the only pattern found.

### 12. Defending the data after it leaves

Contract only. Audit rights exist (Defined.ai, Macgence, Getty, Protege, vAIsual on 10 days' notice,
Opendatabay once a year); certified deletion at the end of the licence is common. **No platform
publishes working fingerprinting or per-buyer watermarking.** Luel says per-buyer marking is not live
(c100, c101); Poseidon's 2025 litepaper proposed it (c127); Nexdata cites URL encryption only (c069).

---

## Part E — Selling

### 13. How deals close

| mode | count |
|---|---|
| Contact sales only | 23 |
| Both: some listings self-serve, the rest quoted | 9 (AWS, Snowflake, Bee Maps, Luel, Opendatabay, ELRA, vAIsual, Adobe, Getty) |
| Self-serve checkout only | 1 (LDC) |
| Free download | 5 (government portals, LAION, Hugging Face) |

Where both exist, the self-serve side is the small, cheap, standardised unit: audio by the minute
(Luel USD 1.25/min, c074), images by the API call (Bee Maps USD 0.005/image, c005), stock by credit.
Large video and anything with people in it goes to a quote. Payment is by invoice and wire for
contact-sales (Defined.ai: USD by ACH, no refunds, c057; FutureBeeAI: bank, wire, PayPal or Payoneer,
c089). The prototype now follows this: quote by default, instant licence only where a price is listed.

### 14. What prices are published

15 of 41 publish none, 14 publish some. Every published number found, with its basis, is in
`facts.csv`. The ones a photo-and-video catalogue would be compared with:

| what | price | source |
|---|---|---|
| Street-level image, crowd dashcam | USD 0.005 per image | bee-maps c005 |
| Event video clip | USD 6 per clip | bee-maps c006 |
| Stock images for ML, by resolution | USD 0.005–1.00 per image | vaisual c042 |
| Japanese ML image set | JPY 99,000 per 1,000 images, tax incl. | pixta-ai c059, c090 |
| Image/video dataset floors on Datarade | from USD 10,000–20,000 per purchase | datarade c040, c052; nexdata c080 |
| Egocentric video, 100,000 h | from USD 100,000 (floor) | nexdata (Datarade storefront) |
| Egocentric video listing, 50,000 h | GBP 371,000 | opendatabay c151 (scope flagged by verifier) |
| Speech bundles | EUR 50,000 for 315 h to EUR 500,000 for 3,125 h (2024) | defined-ai c066–c069 |
| Custom capture, egocentric | USD 2,825–4,408 per accepted hour (estimator default) | truelabel c093 |
| Conversation audio, self-serve | USD 1.25 per minute | luel c074 |
| What crowd capturers are paid | USD 7.50–12 per hour of recording (Luel tasks); USD 5–14 per task video (Kled) | luel c145, c146; kled c072, c074 |
| Annual membership, priced catalogue | USD 34,000–40,000 (for-profit) | ldc c026, c027 |

The spread between what capturers are paid (single-digit dollars per hour or task) and what custom
egocentric capture is quoted at (thousands per accepted hour) is the margin these businesses run on.
Nearly all figures are vendor-stated.

### 15. The fee, compared with 9%

Three different economics are in play, so a single comparison is misleading:

- **Venue commission:** AWS 1.5–3%; Opendatabay 5–30% by sale size; Datarade 15–30% plus subscription.
- **Revenue share to the owner:** Troveo pays owners 60% (keeps 40%); Wirestock 50/50 on dataset
  deals; Getty keeps 55–85%; Adobe keeps 65–67%; Shutterstock pays about 20%.
- **Principal margin:** the operator owns the data and keeps the whole price (Poseidon, Nexdata,
  Bee Maps, FutureBeeAI).

A 9% fee is in the venue range. As licensor of relisted or third-party data, the market norm is a much
larger operator share.

### 16. Getting paid, as an Indian company — **not researched**

The research did not reach payment providers, merchant-of-record options, GST on dataset licences,
TDS, or cross-border collection and payout rules. The theme stage that would have covered them was not
run. Three facts surfaced on the way: AWS's eligible-jurisdiction list for data providers does not
name India (aws-data-exchange c045), although AWS India issues GST invoices for sellers in India with
the seller as seller of record (aws-data-exchange c117) — the profile records the two as a conflict;
and Snowflake's paid-listing countries do not include India for providers (snowflake-marketplace c044). Both are reasons listing on the cloud exchanges
is not a shortcut from India. **This is the largest open gap before design**; it needs a CA and a
payments provider conversation, not desk research.

---

## Part F — The surface

### 17. Public or behind a login, and who may buy

20 of 41 publish indexable public listings, 11 show a public summary with details gated, 1 (Protege)
requires login. Gating is applied to samples, metadata and prices, not to the existence of a dataset
(PIXTA: metadata and samples after sign-in, c049; Datarade: samples in exchange for contact details,
c010). Buyer vetting is mostly an account (11) or case by case (9); Datarade requires a business email
(datarade c072); AIKosh asks for a reason before a restricted download, which the contributor decides
(aikosh c014, c044); Korea AI-Hub asks for a stated purpose (korea-ai-hub c049).

The prototype was changed to a public catalogue page for this reason. DataMind360 today has no public
page and no self-signup (repo, fact 7).

### 18. Samples and quality evidence

Free downloadable samples (16) or samples on request (14) are universal. Quality evidence is almost
always the operator's own claim: 19 operator-verified, 9 provider-asserted, and only AIKosh computes a
platform score (aikosh c048, c049). The few that show more: truelabel sample packets with QA evidence
and rights metadata that the buyer approves (truelabel c010, c108); Shutterstock's sample metadata with
a release flag, age, gender and ethnicity per asset, but not the releases (shutterstock c094, c095);
Korea AI-Hub's sample data and validation-model scores (korea-ai-hub c063).

Independent evidence matters because self-assessment fails: LAION's own filters missed hundreds of
known abuse images that a Stanford audit found (laion-5b c004, c008); Amazon's evaluators found IBM's
annotations unreliable (ibm-diversity-in-faces c026).

DataMind360's gate results, per-asset device checks and reviewer verdicts are operator-verified
evidence of a kind nobody else in the sample has, because nobody else runs the capture.

### 19. Catalogue and custom together, and what to call them

30 of 41 do both. The catalogue is pitched as the fast start and custom as the gap-filler (Nexdata
c091, FutureBeeAI c140, Appen c029), and **custom is where much of the revenue goes**: Wirestock's
CEO says its library deals "turned into a lot of custom requests" (wirestock c020), DataSeeds says its
focus is custom production (dataseeds-ai c014), and
Nexdata's worked example is a buyer who took part of a catalogue set, then commissioned more (c091).
Two mechanisms tie the sides together: Luel badges some listings "Scoped to order", meaning the
collection is scoped with each buyer, so a catalogue entry doubles as a brief (luel c055, c056);
truelabel types every request OTS or NET_NEW (truelabel c110).

What they call the two sides: "Off-the-shelf datasets" / "Custom data collection" is the most common
pair (Appen, Macgence, Nexdata, FutureBeeAI, Defined.ai). Defined.ai and Luel call the catalogue a
"Marketplace" — the word DataMind360 already uses for its RFP side (repo, fact 1). The prototype uses
"Datasets" and "Commission data".

**For DataMind360**, this is the strongest structural fit in the whole study: it already has the
custom side (the RFP flow) and is adding the catalogue. The market's evidence is that the catalogue
mostly feeds the custom business, not the other way round.

### 20. Build, or list on someone else's

Listing elsewhere buys reach, billing and delivery plumbing: AWS (3% fee, c050), Snowflake (rebates
on consumer compute, c050), Datarade (15–30%), Hugging Face (free hosting). The image and video
sellers use them as **funnels, not storefronts**: Shutterstock puts a free 1,000-image sample on AWS
that routes to its sales team (c090, c092); Getty and Poseidon put gated samples on Hugging Face
(getty c036; poseidon c041); Nexdata and DataSeeds run Datarade-powered storefronts (nexdata c077;
dataseeds c023).

Two cautions for an Indian seller: the AWS and Snowflake eligibility gaps in §16, and Human Native —
a pure licensing broker that was absorbed by Cloudflare in January 2026, two years after founding
(human-native c002), which the profile reads as standalone brokering lacking distribution.

### 21. Is there demand for off-the-shelf photo and video?

The weakest-evidenced question: 39 of 41 answers are partial, nearly all vendor-stated. What can be
said:

- Buyers are AI labs, robotics and autonomous-vehicle developers, and enterprises building vision
  models (Shutterstock c018; Troveo c059; Empiric Earth c009; Poseidon c026).
- Robotics and egocentric video is the active pocket in 2026: Build AI claims a USD 100M run rate
  (c003, vendor-stated), Troveo says "Mag 7" buyers took 1M+ hours (c107), and Nexdata, Shaip, Unidata,
  CrowdWorks and Opendatabay all added egocentric listings this year.
- Revenue is lumpy and concentrated: Shutterstock's data revenue fell 26% year on year in H1 2026 and
  11% in Q2 (shutterstock c015, c014);
  DataSeeds' first six-figure order came from one repeat customer (c004); Defined.ai cut about 30% of
  staff in July 2026, reportedly after a fall in AI data sales (defined-ai v001, v002).
- Nobody publishes why a buyer chooses a ready-made set over a custom one, beyond speed.

**This is the question desk research cannot answer.** Five to ten conversations with buyers at
robotics and vision teams would settle more than another round of profiles.

---

## What went wrong elsewhere, in one place

| case | what happened | lesson for this design |
|---|---|---|
| Everalbum | photos uploaded for storage trained face models; FTC ordered photos and models destroyed (c007, c008) | consent obtained for one purpose does not stretch to another; remedies reach models |
| IBM Diversity in Faces | CC-licensed photos, no subject consent; BIPA suits reached IBM and every downloader (c001–c006) | the downloader is exposed, not just the publisher |
| LAION-5B | illegal images in an image dataset; withdrawn; takedown told past holders nothing (c002, c004) | automated filters are not evidence; plan for withdrawal before it is needed |
| TwentyBN | crowd-captured video datasets; on acquisition the licensor of record moved to Qualcomm (c002, c022) | buyers' licences depend on the licensor surviving |
| Wejo | data marketplace on a few OEM suppliers; revenue a third of projection; administration (c015, c017) | concentrated supply and thin demand |
| Human Native | licensing broker absorbed by Cloudflare after two years (c002) | brokering without distribution |
| Defined.ai | 30% staff cut, July 2026, reportedly after a fall in AI data sales (v001) | even the leaders' catalogue revenue is volatile |

---

## Open questions the design will have to answer

In dependency order — each depends on the ones above it.

1. **Which supply lane first?** Own collection is cleanest on rights; platform-collected is the
   differentiator but needs §2 settled; third-party adds the weakest evidence. *Business decision.*
2. **What do existing clients and workers get asked, and what do they get?** §2, §4. Needs counsel.
3. **Licensor or venue?** §5. Drives the fee model, tax treatment and what the ledger must record.
4. **Consent: build `consent_artefact` and worker consent on the server before listing anything with
   people in it?** §3. The prototype's core promise depends on it.
5. **Payments, tax and cross-border collection from India.** §16. Not researched; needs a CA.
6. **The object model.** Dataset, version, entitlement, manifest — independent of `contract`. §8.
7. **Erasure that reaches delivered copies.** §9. A licence clause plus per-clip manifests.
8. **Is there demand at a price that covers capture?** §14, §21. Needs buyer interviews.
