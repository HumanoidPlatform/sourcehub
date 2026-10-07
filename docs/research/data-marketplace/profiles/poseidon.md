# Poseidon

vision_physical_ai · deep · status: **active** · also known as Poseidon AI, Inc., psdn.ai, Numo (its collection app)

> Rendered from `ledger/poseidon.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “"The Datasets" / "datasets" ("Browse what exists, sample it on Hugging Face"); on Numo, "public slices land in the catalog, where anyone can evaluate them"” and its bespoke side “"custom data campaigns" / "Private data collection campaigns built to your specifications", requested through the "Custom Dataset Form" (nav: "request dataset"; CTA "Need something custom?")”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c086, c085, c087, c071, c032 | Contributors grant Poseidon AI, Inc. an exclusive (for AI uses), sublicensable, perpetual licence, and Poseidon licenses data onward to business customers; listings carry a Poseidon 'Non-exclusive license'. No buyer licence text is published, and no third-party provider listings were found. |
| economics_model | principal_margin | c053, c105, c086, c090, c036 | Poseidon pays crowd contributors per accepted clip, holds an exclusive licence (with a buy-out option), and sells datasets and custom collections at unpublished prices. Its margin is not published. |
| who_pays_fee | not_applicable |  | No marketplace fee layer: Poseidon sells its own licensed data; there are no third-party sellers paying a commission. |
| supply_models | own_collection | c015, c053, c020, c046, c064 | All listed inventory is Poseidon's own collection: Numo crowd tasks, a vetted 'pro corps', workforce partners and factory relationships, and a 'commissioned collection program' for Bangla-10K (who commissioned it is not stated). A studio motion-capture set [c151] is not phone capture and its origin (own shoot or partner) is not stated. The 2025 litepaper pitched third-party (DePIN) supply [c131], but no such listings were seen. |
| custody_model | platform_hosted | c049, c041, c024 | Samples sit in Poseidon's gated Hugging Face repos; the Bangla-10K core corpus is read with R2 credentials Poseidon issues under the data-use agreement. Custom deliveries are 'in the format your pipeline expects' and the transfer mechanism is not published. |
| transaction_mode | contact_sales | c036, c069, c052, c136 | Listings end in 'Request access' to a contact form; no checkout. |
| public_prices | none | c036, c069 | No price appears on listings, the catalogue, the contact form or any page fetched. |
| licence_model | mixed | c032, c040, c047, c048 | Listings state 'Non-exclusive license'; Hugging Face samples use a custom 'poseidon-sample-preview' tag; Bangla-10K mixes a CC BY 4.0 preview with a data-use agreement for the core. The text of the paid licence is not public. |
| exclusivity_offered | unknown |  | Listings say non-exclusive; custom collections 'go to the buyer who specified them', but no source says whether that buyer gets exclusive rights. |
| public_listing | public_summary_gated_detail | c032, c035, c041, c036 | Listing pages with specs and metadata fields are public; sample files need a Hugging Face login and contact sharing; the full data needs a request. |
| buyer_vetting | unknown |  | Hugging Face gating collects contact details for samples; nothing is published on checks before a sale. |
| sample_mechanics | free_sample_download | c041, c033, c047, c062 | 2-3 clip samples downloadable free after the Hugging Face contact gate; Bangla-10K has an 849-hour CC BY preview; custom campaign buyers receive a sample dataset before committing to volume. |
| versioning | unknown |  | No version, revision or entitlement policy found. |
| human_subject_consent_docs | asserted_only | c028, c050, c096, c135 | Buyers are told data was 'Collected with consent'; contributors warrant they hold all consents; no consent or release documents are offered to buyers on any page seen. |
| contributor_pay_model | one_off | c053, c105, c109, c086, c094 | Paid per clip that passes QC (USD Confirmed Balance, paid quarterly above USD 25), plus a possible one-off buy-out; the licence is royalty-free, so no share of dataset sales. |
| catalogue_plus_custom | both | c014, c065, c017, c030 |  |
| erasure_after_sale | takedown_only | c076, c118 | Privacy Notice: withdrawal stops future publications but Poseidon 'cannot guarantee removal from datasets already downloaded by third parties'. This is stated for published data; the paid buyer licence's deletion terms are not public. A Feb 2026 blog post claims revocation can block downstream workflows [c140] (see conflicts). |
| quality_evidence | operator_verified | c021, c057, c059, c051, c137, c023 | Poseidon is both operator and sole provider; its QC claims (clip-level QC, rejection, data card, Poseidon Score) are its own and not independently audited. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Poseidon says it serves frontier AI teams, sovereign AI programmes such as Sahabat-AI and foundation model companies, starting with egocentric robotics data; it names no customers, volumes or prices. Its only reason for catalogue versus custom is that 'most engagements blend both'. | c026, c141, c010, c014, c134 |
| Q2 | partial | Poseidon runs its own site and uses Hugging Face only as a gated, free sample window. Its 2025 litepaper pitched an open marketplace for third-party suppliers, but no third-party listings were found. It also runs collection inside partner workforce platforms. | c027, c041, c123, c131, c063 |
| Q3 | sourced | Inventory is Poseidon's own collection through its Numo app (crowd and vetted 'pro corps'), workforce partners and factory relationships. Contributors grant an exclusive-for-AI, perpetual, sublicensable licence and Poseidon holds a buy-out option; Bangla-10K came from a 'commissioned collection program'. | c015, c053, c020, c064, c086, c087, c090, c046 |
| Q4 | partial | Custom collections go to the buyer who specified them; 'public slices' go into the catalogue. How resale rights are split is not published. The Aug 2026 Terms added a buy-out option and USD payouts to a 2025 text that was already exclusive. No dispute was found. | c065, c002, c004, c005, c090, c143, c120 |
| Q5 | partial | Poseidon AI, Inc. is licensee and, by inference, licensor of record: contributors warrant consents, owe no-one else anything, and indemnify Poseidon. Poseidon disclaims warranties and caps liability to users at USD 100. What it warrants to buyers is unpublished. | c079, c086, c096, c097, c117, c115, c116, c071 |
| Q6 | partial | Samples are hosted on gated Hugging Face repos. The Bangla-10K core corpus is read with R2 credentials under a data-use agreement, and custom data is delivered 'in the format your pipeline expects'. The 2025 litepaper envisioned Story IP Vault access for licence holders. | c041, c049, c024, c037, c126 |
| Q7 | partial | Capturer: exclusive licence plus a warranty of all consents. Depicted people: a ban on privacy-invasive content, plus explicit in-app consent for biometric content, which may be licensed to AI firms that extract face geometry and voiceprints. Buyers get only assertions. Property owners are not addressed. | c096, c097, c098, c073, c072, c028, c050, c061, c151 |
| Q8 | partial | Listings are non-exclusive; previews use CC BY or a custom sample tag; core data is under a data-use agreement. Poseidon registers contributions as IP on Story, and its 2025 litepaper proposed fingerprinting. No buyer licence, audit or leakage terms are public. | c032, c040, c047, c048, c011, c148, c127, c076 |
| Q9 | sourced | Every sale goes through contact sales ('Request access' to a form with no price field). Poseidon acts as principal: it pays contributors per clip that passes QC and sells at unpublished prices. The litepaper's vision of bidding on on-chain licences is not live on the site. | c036, c069, c136, c053, c104, c124 |
| Q10 | partial | A listing is a spec sheet plus a 2-3 clip Hugging Face sample. Datasets and contributions are registered as IP assets on Story, and releases bundle media, transcripts, scores and annotations. Orders, entitlements, versions and withdrawals are undocumented. | c035, c033, c011, c124, c138, c037 |
| Q11 | sourced | Before purchase buyers get small free samples (after a contact gate), a CC BY preview for Bangla-10K, and a sample dataset before committing to custom volume. Poseidon also offers per-sample metadata, a data card with rejection criteria, and its own QC and scoring claims. | c033, c041, c047, c062, c035, c023, c057, c137 |
| Q12 | sourced | The ready-made catalogue ('The Datasets') and custom collection ('custom data campaigns') run on the same Numo infrastructure. Most engagements extend a catalogue dataset to spec, custom output goes to its buyer, and 'public slices' feed the catalogue. | c014, c017, c065, c030, c033, c018 |

## Narrative

### positioning

Poseidon AI, Inc. records skilled people at work and sells the footage as physical-AI datasets [c012][c013]. It says it raised a USD 15M seed round led by a16z crypto and was incubated by Story [c006][c008]. a16z crypto lists it in its portfolio [c007]. Its live team page shows different co-founders from the 2025 announcement [c009]. Its catalogue now leans heavily to speech and also includes Indian-exam Q&A pairs [c029][c031]. It says it serves frontier AI teams and sovereign AI programmes [c026][c141], and all such claims are vendor-stated.

### supply

Supply is Poseidon's own collection via its Numo app [c015]: open tasks anyone can take, private tasks for recruited groups, and a vetted 'pro corps' [c016][c055][c064]. Contributors capture on phones or on hardware Poseidon ships [c053][c056]. Poseidon also recruits through workforce partners and factory relationships centred on Korea [c020][c067] and runs campaigns inside partner platforms [c063]. Bangla-10K came from a 'commissioned collection program' [c046]. The 2025 litepaper pitched third-party supply from DePIN networks [c131], and none was seen listed.

### object_model

A listing is a spec sheet (licence, format, frame rate, views) plus metadata fields and a 2-3 clip sample [c034][c035][c033]. Data ships in pipeline formats such as LeRobot [c037]. A voice release bundles audio, transcripts, embeddings, Poseidon Scores and annotations [c138]. Each contribution is registered as an IP asset on Story [c011][c148]. No order, entitlement or version model is published.

### listing

The public catalogue covers voice, video, 3D and paired text [c029]. Each listing states 'Non-exclusive license' and file specs and ends in 'View samples' and 'Request access' [c032][c036]. Listings name the metadata captured, including a PII-status field [c035].

### discovery

Buyers browse psdn.ai/datasets or Poseidon's Hugging Face organisation [c044]. Samples there are gated behind contact sharing [c041]. The Privacy Notice says de-identified samples are published on open data platforms [c075].

### trust

Poseidon asserts consent ('Collected with consent') and rights-clearance at source [c028][c024]. It promises a data card with distribution, hardware and rejection criteria [c023] and distribution tracking [c066]. Consent evidence is not handed to buyers; the contributor warrants all consents instead [c096][c097]. Contributors are proof-of-personhood checked via World [c142].

### transaction

No checkout exists. Buyers use 'Request access' or the Custom Dataset Form, which asks for organisation, email, modality, volume and what they are training [c036][c069]. Licensing enquiries for Bangla-10K and the voice dataset go to the same contact route [c052][c136]. The litepaper's bid-for-licence marketplace [c124] is not live on the site.

### pricing

No prices are published anywhere fetched: not on listings, the catalogue, the contact form or the blog [c036][c069]. The only published figures are on the contributor side: the USD 25 payout threshold [c104] and the USD 100 liability cap [c116].

### licence

Contributors grant Poseidon a royalty-free, sublicensable, perpetual, irrevocable licence that is exclusive for AI uses [c086][c087][c088], and Poseidon holds a buy-out option [c090][c095]. Listings are 'Non-exclusive license' [c032], previews are CC BY 4.0 or 'poseidon-sample-preview' [c047][c040], and core data goes under a data-use agreement [c048]. Poseidon disclaims warranties to users and is indemnified by them [c115][c117].

### custody

Samples are hosted on Hugging Face [c041]. The Bangla-10K core corpus is read with R2 credentials issued under the data-use agreement [c049]. Custom data is delivered in the buyer's pipeline format [c024]. The 2025 design put data in Story's IP Vault for licence holders [c126].

### vetting

Every task has acceptance criteria [c054][c081]. QC combines automated checks, human review and anti-fraud screening, and failing clips are rejected [c057][c058][c059]. Poseidon sets quality standards at its sole discretion [c108]. Speech data gets metadata, lexical-diversity and audio checks and a composite Poseidon Score [c051][c137].

### contributor_pay

Contributors are paid per clip that passes QC [c053][c060]. Pay is accrued as a USD Confirmed Balance [c105] and paid quarterly once it reaches USD 25 [c104][c106], and only where Poseidon's payment provider operates [c107]. Rates are shown in-app per task and vary by geography [c102][c103]. The licence is royalty-free [c086], so there is no share of sales, and a buy-out price is set by Poseidon [c091]. Earnings can be forfeited while the data is kept [c111][c112].

### post_sale

Deletion is weak. Poseidon need not delete contributions on account closure [c118] and cannot guarantee removal from datasets third parties have already downloaded [c076]. A February 2026 post nonetheless claims revocation can block downstream licensing [c140].

### catalogue_custom

Poseidon runs one pipeline for both sides. Buyers 'browse what exists' and have Poseidon 'extend it to your spec', and 'most engagements blend both' [c014]. Custom collections go to their buyer, while public slices enter the catalogue [c065]. Listings invite scoping of larger coverage [c033][c038], and custom buyers get a sample dataset before committing to volume [c062].

### changes

The Terms were revised on 26 August 2026, adding a buy-out option and USD payouts to a 2025 text that already had the exclusive AI licence [c002][c004][c005]. At launch in September 2025 contributors earned only non-transferable points [c143]. Numo launched in early access in April 2026 [c147]. Updated Terms take effect on posting [c120].

### demand

All demand evidence is vendor-stated: 'frontier AI teams' [c026], sovereign programmes such as Sahabat-AI [c141], and 33,000+ hours of speech collected in about three weeks [c134][c149]. The iOS app shows only 4 ratings [c150].

### regulation

The Privacy Notice (26 Aug 2026) covers GDPR, CCPA and India's DPDPA [c077]. It requires separate in-app consent for biometric content [c073], which may be licensed to AI firms that extract face geometry and voiceprints [c072], and retains that content for at most 3 years [c074]. Contributors consent to cross-border transfer [c078]. The Terms are governed by California law [c121].

## Buyer journey

1. Lands on psdn.ai: 'The Datasets' (browse, sample on Hugging Face, or extend to spec) and a 'request dataset' / 'Need something custom?' route. [c014, c001]
2. Opens the dataset catalogue: listings across voice, video, 3D and paired text, told they are 'Collected with consent, licensed for commercial use'; no prices. [c029, c028]
3. Opens a listing: specs (resolution, fps, format), 'Non-exclusive license', the metadata fields, and a note that the sample has 2-3 clips and larger coverage can be scoped. [c032, c034, c035, c033]
4. Clicks 'View samples': a gated Hugging Face repo under a 'poseidon-sample-preview' licence tag; agrees to share contact details and downloads the clips (for Bangla-10K, a CC BY 4.0 preview). [c041, c040, c047]
5. Clicks 'Request access' or fills the Custom Dataset Form: organisation, email, modality, volume, what they are training. [c036, c069]
6. For custom work, shares a spec (tasks, environments, hardware, diversity, acceptance criteria) and gets back a collection plan with QC gates; receives a sample dataset before committing to volume. [c018, c019, c062]
7. Licence and price are settled off-site. For the Bangla-10K core corpus this means a data-use agreement, and the text of any buyer licence is not published. [c048, c136]
8. Receives data: QC-passed clips only, in the pipeline's format with a data card; for Bangla-10K, R2 credentials to read full-resolution audio. [c022, c024, c023, c049]

## Claims

### positioning

- **c001** Poseidon is operating as of September 2026: its research blog published a post dated 8 September 2026 and its site offers datasets and custom collection.  
  _status · vendor_stated · as of 2026-09-08 (page_dated)_
  - “Open-Sourcing SONAR: Poseidon's Multilingual ASR Evaluation Toolkit” — Poseidon AI, Inc., <https://www.psdn.ai/blog> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - “Explore the datasets” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Operation in September 2026 is independently shown by the App Store version history (1.15, Sep 16, no year shown because it is the current year) and the Google Play page, which read 'Updated on Sep 15, 2026' when fetched with PowerShell (WebFetch returned only truncated content for Play). The blog post dated 08 Sept 2026 (SONAR open-sourcing) exists only on psdn.ai/blog and was seen there; that part is vendor-only. WebSearch not available in this run.
    - “Stability and usability improvements Minor bug fixes 1.15 Sep 16” — Apple App Store (listing for Numo by Poseidon AI, Inc.), <https://apps.apple.com/app/id6783542556> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The blog quote is the post title and does not show its date; the words '08 Sept 2026' next to the title on psdn.ai/blog would. 'Explore the datasets' shows datasets but not custom collection; 'Scope a custom data collection' on psdn.ai/numo would.
- **c006** Poseidon says it raised a USD 15M seed round led by a16z crypto, announced 22 July 2025.  
  _event · vendor_stated · as of 2025-07-22 (publication)_
  - “Poseidon is proud to announce a $15M seed round led by a16z crypto” — Poseidon AI, Inc., <https://psdn.ai/blog/poseidon-raises-15m-seed-round> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The lead investor's own announcement, dated 07.22.25, found through a16zcrypto.com/post-sitemap.xml. It also says 'Poseidon was incubated by Story, which we've also invested in'. The investor is an interested party, not a disinterested reporter. No Form D was found: EDGAR full-text search for "Poseidon AI, Inc" and the EDGAR company search for 'poseidon ai' both returned no results.
    - “leading a $15M seed round in Poseidon” — a16z crypto (Chris Dixon, Carra Wu and Connor; dated 07.22.25), <https://a16zcrypto.com/posts/article/investing-in-poseidon> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Worded as Poseidon's own statement; the lead investor's post (a16zcrypto.com, 07.22.25) says the same.
- **c007** a16z crypto lists Poseidon (psdn.ai) among its portfolio companies.  
  _status · independent · as of 2026-10-01 (retrieved_only)_
  - “Poseidon” — a16z crypto, <https://a16zcrypto.com/portfolio/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** At its July 2025 funding announcement Poseidon said it was founded by Sandeep Chinchali and Sarick Shah and incubated by Story.  
  _event · vendor_stated · as of 2025-07-22 (publication)_
  - “Founded by Sandeep Chinchali and Sarick Shah, incubated by Story” — Poseidon AI, Inc., <https://psdn.ai/blog/poseidon-raises-15m-seed-round> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c009** Poseidon's live team page lists Seung Yoon Lee and David Lee as co-founders and does not list Sandeep Chinchali or Sarick Shah.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Seung Yoon Lee” — Poseidon AI, Inc., <https://psdn.ai/team> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c010** In July 2025 Poseidon said its initial focus would be robotics training data, specifically egocentric (point-of-view) data.  
  _offer · vendor_stated · as of 2025-07-22 (publication)_
  - “Poseidon's initial focus will be on curating training data for robotics, specifically egocentric, POV data.” — Poseidon AI, Inc., <https://psdn.ai/blog/poseidon-raises-15m-seed-round> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c012** Poseidon describes its business as recording skilled people at work and refining the recordings into datasets for physical AI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “records skilled people at work and refines it into” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c013** Poseidon's datasets are described as expert demonstrations in egocentric video, manipulation and voice, collected in homes, factories and workplaces.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Expert demonstration datasets across egocentric video, manipulation, and voice, collected in real homes, factories” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c025** Poseidon's homepage says it is backed by a16z.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Backed by a16z” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c123** Poseidon's October 2025 litepaper describes subnetworks on Story's L1 that collectively form an open marketplace for AI training data.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “collectively forming an open marketplace designed to address the challenges of the supply and demand of AI training data” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c132** The litepaper says Poseidon positions itself as both infrastructure and marketplace for the data economy.  
  _offer · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “Poseidon positions itself as both infrastructure and marketplace for the emerging data economy” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c015** Numo is the collection platform behind Poseidon's datasets.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Numo is the collection platform behind Poseidon's datasets.” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The incubator's launch post and the App Store listing (seller Poseidon AI, Inc.) show Numo is Poseidon's contributor app. The post also says top contributors 'from Poseidon's first app' get multipliers in Numo, so Numo succeeded an earlier Poseidon app (the 33,000-hour voice data came from that earlier app, not Numo). Neither source says Numo supplies all of Poseidon's datasets.
    - “Today, Poseidon is launching Numo in early access, a consumer app built to help solve that problem.” — The DATA Foundation (formerly Story Foundation), 29 Apr 2026, <https://www.datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Verbatim vendor sentence. It describes the present set-up: the 33,000-hour voice dataset came from Poseidon's earlier app (Sept 2025), which Numo succeeded in April 2026 (Data Foundation post), so it does not hold for every dataset in the catalogue.
- **c016** Poseidon says anyone can pick up open tasks on Numo, capture real-world work and get paid.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Anyone can pick up open tasks, capture real-world work, and get paid.” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c020** Poseidon sources demonstrators through its contributor network, workforce partners and factory relationships across Korea, Asia and beyond.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We source demonstrators through our contributor network, workforce partners, and highly skilled factory relationships” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c039** The Hindi speech listing says the audio was recorded through a moderated contributor app.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hindi Speech: Contributor Recordings_
  - “Hindi speech recorded through a moderated contributor app” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/hindi-speech-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** Bangla-10K was recorded on consumer devices through a commissioned collection programme in sixteen delivery batches over four months in 2026.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K_
  - “through a commissioned collection program in sixteen delivery batches during a four-month collection window in 2026” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c054** Every Numo task starts as a specification of activity, environment, hardware and acceptance criteria.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every task starts as a specification: the activity, the environment, the hardware, the acceptance criteria.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Some Numo tasks are private, visible only to a recruited group and never public.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Others are private, visible only to a recruited group, and never public at all.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Poseidon ships capture devices to contributors, from phone mounts to specialised rigs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Devices ship where they are needed, from phone mounts to specialized rigs.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c063** Numo campaigns can also run inside partner platforms that already operate a workforce.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Campaigns can also run inside partner platforms where a workforce already operates” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c064** Numo has a 'pro corps', a curated, vetted and trained contributor tier for collections needing speed and reliability.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A curated contributor tier, vetted and trained, for collections that need speed and reliability over open crowdsourcing.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c067** Poseidon says its contributor base is worldwide and anchored in Korea's skilled workforces.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A contributor base across the world, anchored in Korea's skilled workforces.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c080** Contributors submit content and data in response to prompts that Poseidon makes available through the Service.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “submit information, content, data or other materials in response to prompts” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c131** The litepaper defines supply-side 'users' to include organisations such as DePIN applications and data annotation platforms, not only individuals.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “decentralized physical infrastructure network (DePIN) applications, data annotation platforms” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c139** Poseidon says integration with World, a proof-of-humanity protocol, made it the top trending AI app on the World app store.  
  _outcome · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “made Poseidon the top trending AI app on the World app store” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — World's own pages were tried: world.org/blog lists no post on Poseidon, Numo or app rankings, and world.org/ecosystem does not list Poseidon and shows no trending ranking. A ranking history for the World app store could not be reached; no search available.
  - verifier (scope): **scope_ok**
- **c146** In July 2025 Poseidon said distributed collection ran from smartphone SDKs to specialised DePIN apps.  
  _offer · vendor_stated · as of 2025-07-22 (publication)_
  - “From smartphone SDKs to specialized DePIN apps, Poseidon makes distributed collection easy.” — Poseidon AI, Inc., <https://psdn.ai/blog/poseidon-raises-15m-seed-round> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c150** Numo's iOS App Store listing ('get rewarded' for contributed content) shows only 4 ratings as of 1 October 2026.  
  _outcome · independent · as of 2026-10-01 (retrieved_only) · scope: Numo iOS app_
  - “Contribute content and get rewarded.” — Apple App Store, <https://apps.apple.com/app/id6783542556> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - “4 Ratings” — Apple App Store, <https://apps.apple.com/app/id6783542556> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — App Store showed 3.0 out of 5 from 4 Ratings on 2026-10-01; the rating count is computed by Apple. For contrast, the Google Play listing (read with PowerShell, WebFetch returned truncated content) showed '50K+ Downloads', so the four iOS ratings understate Android reach. The listing's phrase is 'Get rewarded for contributing high-quality data.'
    - “4 Ratings” — Apple App Store (listing for Numo by Poseidon AI, Inc.), <https://apps.apple.com/app/id6783542556> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Both quotes appear on the App Store listing (3.0 out of 5, 4 Ratings; version 1.15, Sep 16).
- **c151** The Motion Capture listing describes professional performances recorded on a 24-camera Vicon studio rig, and it carries no performer consent or release statement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Motion Capture: Actor Performances & 3D Objects_
  - “professional performances recorded on a 24-camera Vicon optical rig” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/motion-capture-asset-samples> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c037** The behavioural dataset ships in LeRobot format so it drops into existing robot-learning pipelines.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Behavioral Dataset: Multimodal Video, Depth & Actions_
  - “shipped in LeRobot format so they drop into existing robot-learning pipelines” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/behavioral-multimodal-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** Qualified Numo footage is annotated for the reasoning behind each action and synchronised stream by stream.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Qualified footage is annotated for the reasoning behind each action, synchronized stream by stream” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c138** The voice dataset release includes audio, transcripts, embeddings, Poseidon Scores and human annotations in one schema.  
  _offer · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “The dataset release includes audio files, transcripts, embeddings, Poseidon Scores and human annotations in a unified schema” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact

### listing

- **c029** The catalogue page spans voice, video, 3D and paired-text datasets, not only physical-AI video.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Real-world training data across voice, video, 3D, and paired text.” — Poseidon AI, Inc., <https://www.psdn.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c031** The catalogue includes a science Q&A pairs dataset aligned with Indian JEE, NEET and CET-style exams.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “aligned with JEE, NEET, and CET-style exams” — Poseidon AI, Inc., <https://www.psdn.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** A listing shows specifications such as 1080p, 60 fps and a super-wide lens for the humanoid manipulation video.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Humanoid Robot Training: Egocentric Manipulation_
  - “captured at 1080p and 60 fps through a super-wide lens” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c035** Listings document per-sample metadata fields, including a PII status field.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “sample identifiers, sample titles, media previews, duration, media type, PII status, tags, feature flags” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** The Cultural Interviews listing is third-person public interview video; broader coverage is scoped including by licensing requirements.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Cultural Interviews: Public Conversations & Perspectives_
  - “Broader coverage can be scoped by region, interview setting, topic, format, and licensing requirements.” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/cultural-interviews-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** Poseidon's Hugging Face organisation hosts its sample datasets, the Bangla-10K corpus and one model, bangla-asr.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “bangla-asr” — Poseidon AI, Inc., <https://huggingface.co/psdn-ai> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** Bangla-10K is a 10,816-hour Bengali speech corpus with 624,951 recordings from India and Bangladesh.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K_
  - “is a 10,816-hour Bengali speech corpus with 624,951 recordings from India and Bangladesh” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c041** Hugging Face samples are gated: a visitor must agree to share contact information before accessing the files.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You need to agree to share your contact information to access this dataset” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c075** Poseidon publishes anonymised or de-identified samples of contributed content on open data platforms and research repositories.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “publishing anonymized or deidentified samples of contributed content publicly on open data platforms” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### trust

- **c023** Custom deliveries come with a data card documenting distribution, hardware and rejection criteria.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “with a data card documenting distribution, hardware, and rejection criteria” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** Poseidon says delivered data is qualified only, rights-cleared at the source and delivered in the format the buyer's pipeline expects.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Qualified data only, rights cleared at the source, in the format your pipeline expects” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c027** Poseidon cites open samples on Hugging Face as part of its credibility.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Open samples on Hugging Face” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Poseidon says its samples let buyers review task structure and capture quality before scoping a larger robotics dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “capture quality before scoping a larger robotics dataset” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** Poseidon says sample metadata helps buyers judge whether the collection matches their target environment and annotation needs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “helps buyers judge whether the collection matches their target environment and annotation needs” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c050** The Bangla-10K card asserts participants consented and were fairly compensated, without publishing consent forms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K_
  - “Participants consented, were fairly compensated, and collection complied with applicable data rights and privacy laws.” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** Poseidon tells contributors that consent is built in and they choose what to share.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Consent is built in, you choose what to share, and your work is what gets processed” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c066** Poseidon tracks a dataset's distribution so its balance is measurable.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “distribution tracking so a dataset's balance is measurable, not assumed” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c073** Content collected for biometric purposes requires the contributor's explicit prior consent through a dedicated in-app consent mechanism at task time.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “obtained separately from your general consent to this Privacy Notice through a dedicated in-app consent mechanism” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c096** The contributor warrants holding all rights, licences, consents and permissions needed to submit each contribution and let Poseidon use it.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “all rights, licenses, consents, permissions, power and/or authority necessary to submit and use” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c097** The contributor warrants that no consents must be obtained from, or payments made to, any other person for Poseidon's use.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “no other licenses, permissions, consents or authorizations must be obtained from or payments made to any other person” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c098** Contributors must not submit content invasive of privacy or publicity rights.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “invasive of privacy or publicity rights” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c135** Poseidon says voice-dataset contributors consented to dataset usage for AI workflows.  
  _terms · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “Users consented to dataset usage for AI workflows” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact

### transaction

- **c036** Each listing's calls to action are 'View samples' (Hugging Face) and 'Request access' (the contact form); no price or checkout appears on the listing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request access” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/egocentric-activity-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - “View samples” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Button labels on Poseidon's own listings. psdn.ai home page seen 2026-10-01 links sample sets on huggingface.co/datasets/psdn-ai/... and a /contact 'request dataset' route; no price seen.
  - verifier (scope): **scope_ok** — Confirmed on the egocentric listing, where 'View samples Request access' sit together and no price appears. 'Each listing' is generalised from the listings seen, which is acceptable for a listing template.
- **c052** The Bangla-10K card links to the contact page to request access or licensing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K_
  - “Request access or licensing” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** The 'Custom Dataset Form' asks for organisation, email, modality, volume and what the buyer is training; it has no budget or price field.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom Dataset Form” — Poseidon AI, Inc., <https://www.psdn.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “What are you training?” — Poseidon AI, Inc., <https://www.psdn.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c124** The litepaper says a finished dataset is registered as an IP asset on Story and can be listed on an open marketplace where AI applications bid for licences.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “listed on an open marketplace, allowing AI applications to bid for licenses and gain access to the data” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c136** Poseidon routes research collaborations, commercial licensing and sample requests for its voice dataset to its team via contact.  
  _offer · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “For research collaborations, commercial licensing, or dataset samples, please contact the Poseidon team” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact

### licence

- **c011** In July 2025 Poseidon said every data point entering its network is registered as an IP asset on Story's blockchain.  
  _architecture · vendor_stated · as of 2025-07-22 (publication)_
  - “Every data point entering the Poseidon network is registered as an IP asset on Story's blockchain” — Poseidon AI, Inc., <https://psdn.ai/blog/poseidon-raises-15m-seed-round> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** Poseidon's dataset catalogue page describes its data as collected with consent and licensed for commercial use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Collected with consent, licensed for commercial use.” — Poseidon AI, Inc., <https://www.psdn.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Poseidon's own description of its catalogue. The Data Foundation post relays a similar assertion ('rights-cleared audio'; data 'registered and licensed on Story from the start'), which is not independent evidence of consent.
  - verifier (scope): **scope_ok** — psdn.ai/datasets reads 'Collected with consent, licensed for commercial use.' It is an assertion on the catalogue page; no consent documents are offered there.
- **c032** Poseidon's dataset listings state the licence as 'Non-exclusive license' (seen on the egocentric cleaning, humanoid manipulation, behavioural and Hindi speech listings).  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: psdn.ai/datasets listings_
  - “Non-exclusive license” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/egocentric-activity-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - “Non-exclusive license” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/humanoid-robot-manipulation-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - “Non-exclusive license” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/behavioral-multimodal-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - “Non-exclusive license” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/hindi-speech-samples> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Licence label on Poseidon's own listings; exists only there.
  - verifier (scope): **scope_ok** — Confirmed on the egocentric listing: 'Specifications License Non-exclusive license'.
- **c040** Poseidon's Hugging Face video samples carry a custom licence tag 'poseidon-sample-preview'.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face sample repositories_
  - “poseidon-sample-preview” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c047** Bangla-10K's preview configuration (849.4 hours) is released under CC BY 4.0.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K preview config_
  - “a 104-hour sample of the core corpus) is released under CC BY 4.0” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** The full Bangla-10K core corpus is available only under a data-use agreement.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K core corpus_
  - “The full core corpus is available under a data-use agreement.” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c083** Poseidon does not claim ownership of User Contributions unless it exercises its purchase option.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “the Company does not claim any ownership in your User Contributions” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c084** The contributor licenses Poseidon to exploit each User Contribution for any and all purposes.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “exploit your User Contribution for any and all purposes, including to provide, improve and promote the Services” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c085** The contributor licence lets Poseidon make contributions available to its service providers and partners.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “make your User Contributions available to our service providers and partners” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c086** The contributor licence to Poseidon is royalty-free, transferable, sublicensable through multiple tiers, worldwide, perpetual and irrevocable.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “royalty free, transferable, fully sub-licensable (through multiple tiers), worldwide, perpetual and irrevocable” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The grant clause of Poseidon's own Terms; exists only there.
  - verifier (scope): **scope_ok**
- **c087** The contributor licence is exclusive to Poseidon for uses related to AI and machine learning (the 'Exclusive Use').  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “such license will be exclusive to us in connection with any uses or modifications of your User Contributions” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c088** The Exclusive Use covers developing, training, testing, fine-tuning, grounding and deploying third-party AI models.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “developing, training, testing, improving, fine-tuning, grounding, improving the accuracy of, and deploying third-party AI” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c089** Contributors may not allow anyone else to use their contributions for the Exclusive Use.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “you will not allow or authorize any other person or entity to use your User Contributions for the Exclusive Use” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c090** Poseidon holds an option, exercisable at any time in its sole discretion, to buy all right, title and interest in any contribution.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “option, at any time and in its sole discretion, to purchase from you all right, title and interest” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c092** A contributor is deemed to accept a buy-out offer unless they reject it within 15 days.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “deemed to have accepted such offer unless you notify the Company of your rejection within fifteen (15) days” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c093** Rejecting a buy-out offer does not affect the licence already granted to Poseidon.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “your rejection shall not affect any license rights previously granted under Section 1.1(b)” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c095** On payment the contributor irrevocably assigns all right, title and interest in the contribution to Poseidon.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “irrevocably assign and transfer to the Company all right, title and interest in and to the applicable User Contribution” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** The Services may integrate with blockchain protocols such as the Story Protocol.  
  _architecture · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “may integrate with one or more blockchain protocols consisting of smart contracts such as the Story Protocol” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c115** Poseidon disclaims all express and implied warranties to users.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “DISCLAIM ALL WARRANTIES AND CONDITIONS, WHETHER EXPRESS OR IMPLIED” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c116** Poseidon's total liability to a user is capped at USD 100.  
  _number · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_ · **100 USD** (cap on Poseidon's total liability to a contributor or app user under the Terms; aggregate)
  - “SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100.00)” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A liability cap in Poseidon's own Terms; exists only there.
  - verifier (scope): **scope_ok** — Right, with a drafting defect worth recording: the clause reads 'SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100.00).' and names no second amount, so 'greater of' has only one limb. The cap is effectively USD 100 as written.
- **c117** The contributor must defend and indemnify Poseidon against claims, including claims arising from any User Contribution.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “defend, indemnify and hold the Company Entities harmless from and against any and all claims” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - “(d) any User Contribution, or (e) your negligence or wilful misconduct” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c125** The litepaper says datasets are licensed through Story's Programmable IP License (PIL).  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “leveraging Story's Programmable IP License (PIL)” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c127** The litepaper describes a Data Protection module that lets uploaders embed fingerprints in their data to detect leakage.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “enabling data uploaders to embed fingerprints within their data” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c148** The Data Foundation said every contribution made through Numo is registered and licensed on Story from the start.  
  _architecture · press_relayed · as of 2026-04-29 (publication)_
  - “every contribution made through Numo is registered and licensed on Story from the start” — The Data Foundation (formerly Story Foundation), <https://datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

### custody

- **c049** Full-resolution Bangla-10K audio is accessed with R2 storage credentials issued under the data-use agreement.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K core corpus_
  - “Full-resolution audio requires R2 credentials issued under the data-use agreement.” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Access mechanics for full-resolution audio are set out only by Poseidon (its own dataset card and data-use agreement).
  - verifier (scope): **scope_ok** — The dataset card reads 'their full-resolution audio requires R2 credentials issued under the data-use agreement'; the checker ignores case, so the quote matches.
- **c126** The litepaper describes Story's IP Vault, where the data becomes accessible to the licence holder on acquiring a licence.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “the data is automatically accessible by the license holder when acquiring a license to the IP” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c019** Poseidon returns a collection plan with QC gates mapped to the buyer's criteria.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “return a collection plan with QC gates mapped to your criteria” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c021** Poseidon says demonstrations are cleaned, annotated and quality-controlled clip by clip.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “cleaned, annotated, and quality-controlled clip by clip” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Poseidon says non-qualifying data never reaches the buyer.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Non-qualifying data never reaches you.” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Poseidon says every Bangla-10K audio-transcript pair passes automated metadata, lexical-diversity and audio-quality checks.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bangla-10K_
  - “passes automated metadata, lexical-diversity, and audio-quality checks” — Poseidon AI, Inc., <https://huggingface.co/datasets/psdn-ai/bangla-10k> · docs · retrieved 2026-10-01 · quote check: exact
- **c057** Numo QC runs automated checks and human review against the acceptance criteria.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Automated checks and human review run against the acceptance criteria” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** Numo anti-fraud systems screen for staged activity, duplicates and gaming.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Anti-fraud systems screen for staged activity, duplicates, and gaming” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c059** Clips that fail Numo QC are rejected.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Clips that fail are rejected.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c081** Poseidon's prompts may set specific criteria a contribution must meet to be acceptable.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “prompts for User Contributions may include specific criteria for User Contributions to be acceptable” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c082** Poseidon may screen, edit, delete, restrict, remove or reject any User Contribution at any time.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “screen, edit, delete, restrict, remove or reject any User Contribution at any time” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c101** Users must be 18 or older.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “You must be 18 years of age or older to use the Services” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c108** Quality standards that gate compensation are set by Poseidon in its sole discretion.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Quality standards are determined by us in our sole discretion” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c129** The litepaper describes consensus-based validation ('Trident consensus') by randomly assigned workers.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “Poseidon utilizes Trident consensus for validation” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c130** The litepaper says validation includes automated deduplication, normalisation and AI-powered PII removal.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “automated deduplication, normalization, and filtering with AI-powered PII removal” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c137** Poseidon scores each utterance with a composite 'Poseidon Score' of character error rate, word error rate and semantic similarity.  
  _offer · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “we compute a composite Poseidon Score combining character error rate, word error rate, and semantic similarity” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c142** Poseidon says it integrated World's proof of personhood to ensure contributors were real humans.  
  _offer · vendor_stated · as of 2026-02-10 (publication)_
  - “Poseidon integrated World's proof of personhood to ensure contributors were real humans” — Poseidon AI, Inc., <https://psdn.ai/blog/sovereign-ai-needs-verifiable-trust> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c144** At the app launch, AI-generated, low-effort, duplicate or non-compliant uploads earned no points.  
  _terms · vendor_stated · as of 2025-09-02 (publication)_
  - “AI generated, low-effort, duplicate, or non-compliant uploads will not earn points” — Poseidon AI, Inc., <https://psdn.ai/blog/live-now-poseidon-app-v1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c053** Numo contributors capture tasks on their phone or on hardware Poseidon provides and are paid for every clip that qualifies.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “get paid for every clip that qualifies” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Only the incubator restates the pay-per-eligible-contribution model; it says nothing about hardware Poseidon provides. The App Store listing (developer-written text) says 'Get rewarded for contributing high-quality data.' The hardware part is unconfirmed outside Poseidon's own pages.
    - “complete tasks, and receive rewards for eligible contributions” — The DATA Foundation (formerly Story Foundation), 29 Apr 2026, <https://www.datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows payment per qualifying clip but not the phone-or-provided-hardware part; the words 'on your phone or on hardware we provide, and get paid for every clip that qualifies' on psdn.ai/numo would.
- **c060** On Numo, payment follows quality control, after which qualified footage flows into Poseidon's processing pipeline.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Payment follows quality control and qualified footage then flows to Poseidon's processing pipeline.” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c091** The buy-out price is determined by Poseidon in its reasonable discretion.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “purchase price shall be determined by the Company in its reasonable discretion based on” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c094** The buy-out price may be paid in cash, tokens or other consideration at Poseidon's election.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “may be paid, at the Company's election, in cash, Tokens or other consideration” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c102** The form and amount of compensation for a task is shown in the app before the contributor begins it.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “amount of any compensation offered will be communicated to you through the Services before you begin a task” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c103** Compensation may vary by task type, geography, demand and applicable law.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “may vary by task type, geography, demand, and applicable law” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c104** A contributor becomes eligible for a fiat payout once their Confirmed Balance reaches USD 25.  
  _number · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_ · **25 USD** (minimum Confirmed Balance (accepted submissions) a contributor must accrue before Poseidon makes a fiat payout; per payout)
  - “once your Confirmed Balance reaches the minimum payout threshold of USD25” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A payout threshold in Poseidon's own Terms. Neither the App Store listing nor the Data Foundation's Numo launch post (2026-04-29) states a threshold; the latter says only that users 'receive rewards for eligible contributions'.
  - verifier (scope): **scope_ok** — The full sentence reads 'You become eligible for a Fiat Payout once your Confirmed Balance reaches the minimum payout threshold of USD25', so 'fiat' is supported.
- **c105** The Confirmed Balance is the accumulated USD value of a contributor's submissions that passed quality review.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “accumulated USD value of a Contributor's submissions that have successfully passed quality review” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A defined term in Poseidon's own Terms; exists only there.
  - verifier (scope): **scope_ok**
- **c106** Fiat payouts are processed quarterly, subject to change.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Payouts are processed on a quarterly basis, subject to change” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c107** Where Poseidon's payment provider does not operate in a contributor's country, no fiat payout can be made.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “If our payment provider is not available in your country, we will not be able to process a Fiat Payout to you” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c109** A submission that fails quality standards is not added to the Confirmed Balance, so it is not paid.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “If a submission does not meet quality standards, it will not be added to your Confirmed Balance” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c110** Compensation is framed as an incentive, not pay for services as an employee, contractor or agent.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “do not constitute compensation for services rendered in an employment, contractor, or agency capacity” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c111** Poseidon may withhold, adjust or forfeit a contributor's points, token eligibility or Confirmed Balance.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “We may withhold, adjust, or forfeit any or all of your Points, Token eligibility, or Confirmed Balance” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c112** After forfeiting a contributor's earnings, Poseidon may still use contributions that already passed quality review.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “we may still use any User Contributions that have already passed quality review” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c113** Poseidon does not guarantee minimum earnings or continuous availability of tasks.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “We do not guarantee any minimum level of earnings or that tasks will be continuously available” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c128** The litepaper envisions suppliers receiving automatic 'data dividend' micropayments whenever their data is used.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “micropayments whenever their data is used” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c133** The litepaper says reward values for data points are set by subnet operators and vary with data characteristics.  
  _architecture · vendor_stated · as of 2025-10 (publication) · scope: Poseidon Litepaper v1.0 (October 2025), design intent_
  - “Data points with varying characteristics may yield different reward values, which will be determined by subnet operators” — Poseidon AI and Story Foundation, <https://cdn.psdn.ai/Poseidon_Litepaper_v1.0_Oct_2025.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c143** At its September 2025 app launch, contributors earned non-transferable Poseidon points for high-quality uploads, not cash.  
  _event · vendor_stated · as of 2025-09-02 (publication)_
  - “Contributors earning Poseidon points for high-quality uploads” — Poseidon AI, Inc., <https://psdn.ai/blog/live-now-poseidon-app-v1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Points are not transferable on or off the platform.” — Poseidon AI, Inc., <https://psdn.ai/blog/live-now-poseidon-app-v1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c076** A contributor may withdraw consent for future publications, but Poseidon cannot guarantee removal from datasets already downloaded by third parties.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “we cannot guarantee removal from datasets already downloaded by third parties prior to withdrawal” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c118** On account deletion Poseidon may, but need not, delete the user's contributions.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “the Company may, but is not obligated to, delete any User Contribution” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c119** Contributions Poseidon bought before termination remain its sole and exclusive property.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “prior to termination shall remain the sole and exclusive property of the Company” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c140** A February 2026 Poseidon post says that when a contributor revokes consent, downstream training and licensing workflows can be blocked.  
  _architecture · vendor_stated · as of 2026-02-10 (publication)_
  - “When a contributor revokes consent, downstream training and licensing workflows can be blocked” — Poseidon AI, Inc., <https://psdn.ai/blog/sovereign-ai-needs-verifiable-trust> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c014** Poseidon tells buyers they can browse existing datasets, sample them on Hugging Face, or have Poseidon extend them to spec, and that most engagements blend both.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Browse what exists, sample it on Hugging Face, or have us extend it to your spec: most engagements blend both.” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c017** The same Numo infrastructure runs private enterprise collection campaigns end to end, including recruiting, device logistics, ingestion and quality control.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “runs private enterprise campaigns end to end: recruiting, device logistics, ingestion, and quality control” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** A custom engagement starts with the buyer's spec: tasks, environments, hardware and streams, diversity distribution and acceptance criteria.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Share the spec: tasks, environments, hardware and streams, diversity distribution, acceptance criteria.” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** The catalogue page invites buyers to name a modality, language or scenario for Poseidon to scope and collect.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Tell us the modality, language, or scenario, and we'll scope it with you and collect it.” — Poseidon AI, Inc., <https://www.psdn.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** The egocentric cleaning, laundry and car-wash listing's sample contains 2 clips; larger coverage is scoped by activity, location, participant profile and capture requirements.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric Video: Cleaning, Laundry & Car Wash_
  - “The sample includes 2 clips. Larger coverage can be scoped by activity, location, participant profile” — Poseidon AI, Inc., <https://www.psdn.ai/datasets/egocentric-activity-video-samples> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Buyers of private Numo campaigns receive a sample dataset before committing to volume.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “receive a sample dataset before you commit to volume” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c065** Custom collections go to the buyer who specified them, while public slices land in Poseidon's catalogue for anyone to evaluate.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom data collections go to the buyer who specified them; public slices land in the catalog, where anyone can evaluate them” — Poseidon AI, Inc., <https://www.psdn.ai/numo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c002** Poseidon's Terms of Service were last updated on 26 August 2026, replacing a version dated 18 August 2025.  
  _event · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Terms of Service Last updated August 26, 2026” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The 'last updated' dates of Poseidon's own Terms exist only on psdn.ai. The earlier version cannot be reached independently: the Wayback Machine is blocked and no search available to find third-party copies.
  - verifier (scope): **quote_incomplete** — The quote shows 'Last updated August 26, 2026' but not the replaced version; the 'Previous versions' link 'August 18, 2025' at the foot of psdn.ai/terms (to /terms/2025-08-18) would.
- **c003** The previous Terms of Service, still linked from the live Terms, are dated 18 August 2025.  
  _event · legal_text · as of 2025-08-18 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Last updated August 18, 2025” — Poseidon AI, Inc., <https://www.psdn.ai/terms/2025-08-18> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c004** The 18 August 2025 Terms already made the contributor licence exclusive to Poseidon for uses related to developing, training and deploying AI models.  
  _terms · legal_text · as of 2025-08-18 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “exclusive to us in connection with any uses or modifications of your User Contributions” — Poseidon AI, Inc., <https://www.psdn.ai/terms/2025-08-18> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** The 18 August 2025 Terms contain no option for Poseidon to purchase User Contributions and no USD 'Confirmed Balance' payout; both appear only in the 26 August 2026 version.  
  _terms · legal_text · as of 2025-08-18 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Points have no monetary value and do not constitute any currency or property of any type” — Poseidon AI, Inc., <https://www.psdn.ai/terms/2025-08-18> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — A comparison with the superseded 18 August 2025 Terms needs a copy of that version. The Wayback Machine is blocked and no search available; no independent copy was found by navigation. Whether the profile's own reading of the old version holds is checked in the scope step only. Added after Part 2: the profile cites the old version on Poseidon's own site (psdn.ai/terms/2025-08-18, linked under 'Previous versions'); no copy off Poseidon's domain was found, so in practice this is vendor-only.
  - verifier (scope): **scope_ok** — Checked psdn.ai/terms/2025-08-18 (headed 'Last updated August 18, 2025'): rewards are Points ('no monetary value') and third-party Tokens; no purchase option and no 'Confirmed Balance' were found. The live Terms contain both. The absence cannot be quoted directly, so the quote on Points is the right kind of evidence (rule 13).
- **c070** Poseidon's Privacy Notice was last updated on 26 August 2026, the same day as the Terms.  
  _event · legal_text · as of 2026-08-26 (page_dated)_
  - “Last updated August 26, 2026” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c120** Updated Terms take effect when posted.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “The updated Terms will be effective as of the time of posting” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c122** Poseidon may modify, suspend or discontinue the points, token or fiat payout programme on reasonable notice.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “modify, suspend, or discontinue any aspect of the Points, Token, or Fiat Payout program at any time upon reasonable notice” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c147** The Data Foundation (formerly Story Foundation) announced on 29 April 2026 that Poseidon was launching Numo in early access.  
  _event · press_relayed · as of 2026-04-29 (publication)_
  - “Poseidon is launching Numo in early access” — The Data Foundation (formerly Story Foundation), <https://datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

### demand

- **c026** Poseidon says its datasets have been delivered to frontier AI teams, without naming any.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Datasets delivered to frontier AI teams” — Poseidon AI, Inc., <https://www.psdn.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No customer is named anywhere reachable. The a16z crypto post (2025-07-22) and the Data Foundation Numo post (2026-04-29) name no buyer. No search available to look for customer-side mentions.
  - verifier (scope): **scope_ok**
- **c134** Poseidon says its voice dataset comprised over 33,000 hours of prompted speech collected in about three weeks from thousands of contributors.  
  _outcome · vendor_stated · as of 2026-01-28 (publication) · scope: Poseidon Voice AI Dataset_
  - “over 33,000 hours of prompted speech collected in approximately three weeks from thousands of globally distributed” — Poseidon AI, Inc., <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The only other source is Poseidon's incubator (a16z: 'Poseidon was incubated by Story'), which repeats the figure. It does not mention 'thousands of contributors'. The Data Foundation says 'rights-cleared audio' where Poseidon says 'prompted speech'. No independent measure exists; no search available.
    - “33,000+ hours of rights-cleared audio collected in three weeks across 17 languages” — The DATA Foundation (formerly Story Foundation), 29 Apr 2026, <https://www.datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Matches the 28 Jan 2026 post. The Data Foundation's 29 Apr 2026 post says these hours came from 'Poseidon's first beta app experiment', i.e. the Sept 2025 Poseidon app, not Numo.
- **c141** Poseidon says it serves sovereign AI programmes such as Sahabat-AI and international foundation model companies.  
  _outcome · vendor_stated · as of 2026-02-10 (publication)_
  - “serving both sovereign AI programs like Sahabat-AI and international foundation model companies” — Poseidon AI, Inc., <https://psdn.ai/blog/sovereign-ai-needs-verifiable-trust> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — sahabat-ai.com returned an empty (JS-rendered) page and www.sahabat-ai.com does not resolve; the GoToCompany Hugging Face organisation (Sahabat-AI's publisher) lists five text LLMs, no speech models and no public datasets, and never mentions Poseidon. No search available. Nothing independent shows Sahabat-AI as a Poseidon customer.
  - verifier (scope): **scope_ok** — The statement repeats the vendor's words, but the sentence is positioning ('Poseidon enables open crowdsourcing ... serving both sovereign AI programs like Sahabat-AI and international foundation model companies') in an essay on sovereign AI; it does not say Sahabat-AI bought data. Do not use it as evidence of a named customer for Q1.
- **c149** The Data Foundation relayed a figure of 33,000+ hours collected in three weeks across 17 languages.  
  _outcome · press_relayed · as of 2026-04-29 (publication)_
  - “33,000+ hours collected in three weeks across 17 languages” — The Data Foundation (formerly Story Foundation), <https://datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: fuzzy 1.00
  - verifier (blind): **confirmed_relayed** — The relay itself is confirmed on the Data Foundation's own blog (reached from story.foundation/blog, which 308-redirects to datafdn.org/blog; the rename was announced 25 Jun 2026). The Data Foundation is Poseidon's incubator, a related party, so the figure is relayed, not independently checked.
    - “33,000+ hours of rights-cleared audio collected in three weeks across 17 languages” — The DATA Foundation (formerly Story Foundation), 29 Apr 2026, <https://www.datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote as written does not appear on the page: it joins two sentences. The page has '33,000+ hours collected in three weeks.' and, separately, '33,000+ hours of rights-cleared audio collected in three weeks across 17 languages'; use the second.

### regulation

- **c071** The Privacy Notice lists business customers and third parties to whom Poseidon licenses submitted content as recipients who may use it for their own purposes.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “our business customers and third parties to whom we license submitted content with your authorization” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** Poseidon may license content from which biometric data may be derived to third-party AI companies, who may extract facial geometry and voiceprints to train AI.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “extract biometric identifiers including facial geometry and voiceprints” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** Poseidon retains content collected for biometric purposes for no longer than 3 years after the contributor's last interaction with the Services.  
  _number · legal_text · as of 2026-08-26 (page_dated)_ · **3 years** (maximum retention by Poseidon of content collected for biometric purposes, counted from the contributor's last interaction; copies licensed to third parties not addressed; maximum retention)
  - “We retain content collected for biometric purposes for no longer than 3 years” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A retention period in Poseidon's own privacy terms. Context, not verification: three years after the individual's last interaction is the outer limit set by the Illinois Biometric Information Privacy Act (740 ILCS 14/15(a)), so the figure looks like BIPA compliance language; not fetched in this run.
  - verifier (scope): **scope_ok** — Privacy Notice (last updated August 26, 2026): 'no longer than 3 years following your last interaction with the Services, after which it will be permanently and securely destroyed'.
- **c077** The Privacy Notice addresses India's Digital Personal Data Protection Act, 2023 among other regimes.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “India's Digital Personal Data Protection Act, 2023” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c078** By using the Services, contributors consent to cross-border transfer of their personal information to any country or region.  
  _terms · legal_text · as of 2026-08-26 (page_dated)_
  - “which may include the cross-border transfer of your information to any country or region” — Poseidon AI, Inc., <https://www.psdn.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c099** Personal information in a User Contribution may be disclosed to Poseidon's service providers and partners.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “personal information contained within or associated with your User Contribution may be disclosed to our service providers” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c100** Poseidon's partners may use such personal information for their own purposes under their own terms.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “Our partners may use such information for their own purposes, in accordance with their own terms and policies” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** The Terms are governed by California law.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “These Terms are governed by the laws of the State of California” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c145** Poseidon's app is not available to persons in sanctioned jurisdictions and uses geoblocking and wallet screening.  
  _terms · vendor_stated · as of 2025-09-02 (publication)_
  - “We use geoblocking and wallet screening as part of our compliance measures” — Poseidon AI, Inc., <https://psdn.ai/blog/live-now-poseidon-app-v1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### other

- **c079** The Website, data contribution platform and app are operated by or on behalf of Poseidon AI, Inc.  
  _terms · legal_text · as of 2026-08-26 (page_dated) · scope: Poseidon Terms of Service (contributor / app user side)_
  - “operated by or on behalf of Poseidon AI, Inc.” — Poseidon AI, Inc., <https://www.psdn.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** The Data Foundation says the 33,000+ hours were collected by Poseidon's first beta app, not by Numo, which it presents as building on those learnings.  
  _event · press_relayed · as of 2026-04-29 (publication) · scope: Poseidon first app (2025) and Numo (2026)_
  - “Poseidon's first beta app experiment already showed what distributed data collection can look like at scale” — The DATA Foundation (formerly Story Foundation), <https://www.datafdn.org/blog/introducing-numo-a-new-way-to-contribute-to-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.psdn.ai/datasets/egocentric-activity-video-samples>, <https://www.psdn.ai/numo>, <https://www.psdn.ai/contact>, <https://www.psdn.ai/>
- `matrix.buyer_vetting` — not_published; tried <https://www.psdn.ai/contact>, <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples>, <https://www.psdn.ai/terms>
- `matrix.versioning` — not_published; tried <https://huggingface.co/datasets/psdn-ai/bangla-10k>, <https://www.psdn.ai/datasets>, <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples/tree/main>
- `other.buyer_licence_text` — gated; tried <https://www.psdn.ai/terms>, <https://www.psdn.ai/privacy>, <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples/blob/main/TERMS.md>, <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples/raw/main/README.md>
- `other.dataset_prices` — not_published; tried <https://www.psdn.ai/datasets>, <https://www.psdn.ai/contact>, <https://psdn.ai/blog/introducing-the-poseidon-voice-ai-dataset>
- `other.per_clip_rates` — not_published; tried <https://www.psdn.ai/numo>, <https://www.psdn.ai/terms>, <https://apps.apple.com/app/id6783542556>, <https://play.google.com/store/apps/details?id=ai.psdn.numo>
- `other.bangla10k_commissioning_client` — not_published; tried <https://huggingface.co/datasets/psdn-ai/bangla-10k>
- `other.sec_form_d` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Poseidon%20AI%22&forms=D>, <https://efts.sec.gov/LATEST/search-index?q=%22psdn.ai%22>, <https://www.sec.gov/cgi-bin/browse-edgar?company=poseidon+ai&owner=include&action=getcompany>
- `other.independent_press` — not_found; tried <https://a16zcrypto.com/portfolio/>, <https://www.datafdn.org/blog>
- `other.founder_change` — not_published; tried <https://psdn.ai/team>, <https://psdn.ai/blog/poseidon-raises-15m-seed-round>
- `other.property_owner_consent` — not_published; tried <https://www.psdn.ai/terms>, <https://www.psdn.ai/privacy>, <https://www.psdn.ai/numo>
- `other.google_play_installs` — js_empty; tried <https://play.google.com/store/apps/details?id=ai.psdn.numo>

## Conflicts

- c140, c086: A Feb 2026 blog post says revoking consent can block downstream licensing; the live Terms (26 Aug 2026) make the licence perpetual and irrevocable, and the Privacy Notice says removal from downloaded datasets cannot be guaranteed [c076]. The Terms govern. (live_primary_wins_terms)
- c008, c009: The July 2025 announcement names Chinchali and Shah as founders; the live team page lists Seung Yoon Lee and David Lee as co-founders and omits the other two. When or why this changed was not found (no search); treat the team page as current. (newer_wins_status)
- c032, c065: Listings are 'Non-exclusive license', yet custom collections 'go to the buyer who specified them' and 'public slices' enter the catalogue; whether a custom buyer gets exclusivity, and which slices may be resold, is unpublished. (unresolved)

## Leads, not cited

- <https://play.google.com/store/apps/details?id=ai.psdn.numo> — Google Play install count for Numo would give an independent traction signal; page did not render through WebFetch.
- <https://huggingface.co/datasets/psdn-ai/egocentric-activity-video-samples/blob/main/TERMS.md> — Sample-preview licence text (321 bytes) behind the Hugging Face gate; needs a logged-in, accepted account (not done: no sign-ups).
- <https://datafdn.org/blog/Any-Company-Can-Become-a-Data-Company> — Data Foundation (Story) post that may describe Poseidon's supply or licensing model; not fetched.
- <https://psdn.ai/careers> — May show operating locations (Korea, India) and hiring for sales or ops.
- <https://huggingface.co/datasets/psdn-ai/CROWS-multilingual> — Recent dataset repo not reviewed; may carry a different licence or collection statement.
