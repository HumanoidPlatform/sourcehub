# Appen

ai_data_catalogue · light · status: **active** · also known as Appen Limited

> Rendered from `ledger/appen.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Off-the-shelf datasets (OTS datasets); AI training data catalog; earlier 'pre-labeled datasets'” and its bespoke side “custom data services; custom data collection”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c023, c022, c001, c005 | Appen presents itself as the party licensing all catalogue data, including 'Third Party Vendor' sets; no buyer contract is public, so who is licensor of record for third-party sets is not confirmed. |
| economics_model | principal_margin | c038, c010, c007 | Appen collects or acquires the data and sells at its own (unpublished) price; its ASX filing calls prebuilt datasets high-margin. Terms with 'Third Party Vendor' suppliers are not public. |
| who_pays_fee | not_applicable |  | No marketplace fee: Appen sells its own catalogue, not a venue charging buyers or sellers a fee. |
| supply_models | own_collection, third_party_providers, public_or_scraped | c010, c015, c054, c019, c021, c013, c014 | Own collection = 'Appen Global'/'Appen China' participant capture; third parties = 'Third Party Vendor', Nuance, GlobalPhone (KIT) and company data estates; public = 'Sourced from public websites' and KITTI/Cityscapes derivatives. No evidence found of client-commissioned data being relisted. |
| custody_model | copy_to_buyer | c033 | Only evidence is the 2021 statement that an OTS dataset is 'delivered'; current delivery mechanics are not published. |
| transaction_mode | contact_sales | c027, c017, c020 | No checkout or price; engagement via 'Talk to an expert', a quote-request cart, or booking a meeting. |
| public_prices | none | c017, c018 | Listings mention tiered and package pricing but publish no figures. |
| licence_model | standard_licence | c023, c016 | One stated grant: perpetual, non-exclusive commercial training rights. The licence text itself is not published. |
| exclusivity_offered | unknown | c023, c016 | Standard grant is non-exclusive; nothing says whether exclusivity can be bought. |
| public_listing | public_indexable | c049, c010 |  |
| buyer_vetting | unknown |  |  |
| sample_mechanics | sample_on_request | c035, c020 | Samples offered on request (2021 press release; 2026 Quadrant listing); no downloadable sample on listings. |
| versioning | unknown | c047 | Some dataset IDs carry '_v1' and specs list a 'refresh cadence', but what past buyers get on a refresh is not published. |
| human_subject_consent_docs | unknown | c022, c002, c012 | Appen asserts contributor consent and promises 'full provenance documentation' for legal review, but whether consent forms or releases reach the buyer is not stated; public face/selfie listings show no consent information. |
| contributor_pay_model | unknown | c053, c051, c050 | Evidence covers pay for work (hourly, local-market rates) and mentions no royalty on resale, but no source says how participants in the photo/video collections were paid. |
| catalogue_plus_custom | both | c009, c030, c041 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c025, c024 | Appen states inter-annotator agreement metrics and documentation for catalogue sets; for Appen-collected sets operator and producer are the same company. Not independently checked. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Appen pitches OTS data for tight timelines, common categories and budget limits, and as a supplement to custom data; its only public buyer case is a lexicon purchase, and its ASX filing credits prebuilt datasets with lifting Appen China margins. Unit volumes and buyer mix are not published. | c028, c029, c008, c036, c038, c033 |
| Q2 | not_applicable | Appen sells its own catalogue on its own site; it is not a provider choosing between listing elsewhere and building. |  |
| Q3 | partial | Inventory mixes Appen's own participant collections (Appen Global, Appen China), third-party vendor sets (textbooks, Nuance, GlobalPhone), company data estates and some web-sourced or derived images; the rights basis per source is not published beyond a blanket consent claim. | c010, c015, c054, c019, c021, c013, c014, c007, c044 |
| Q4 | unknown |  |  |
| Q5 | partial | Appen presents itself as licensor ('pre-licensed', 'documented licensing'); no buyer licence, warranty or indemnity text is public. | c001, c022, c023 |
| Q6 | partial | A 2021 release says OTS datasets are 'delivered', typically in a week; current delivery mechanics are not published. | c033 |
| Q7 | partial | Appen asserts contributor consent and an opt-in methodology for all datasets, but public listings of faces and bodies carry no consent text, and some image sets are web-sourced. | c003, c022, c034, c012, c046, c048, c013 |
| Q8 | partial | The stated grant is perpetual, non-exclusive commercial training rights; nothing public on audit, leakage or fingerprinting. | c023, c016 |
| Q9 | sourced | Deals close through sales ('Talk to an expert', quote cart, meetings); Appen owns the inventory and sells at unpublished, sometimes tiered, prices. | c027, c017, c018, c020, c038 |
| Q10 | partial | A listing is a spec record with a dataset ID (some suffixed _v1) and a refresh cadence; 'in development' listings stay published after their stated ready dates. Orders, entitlements and what a past buyer gets on a new version are not public. | c006, c047, c016 |
| Q11 | partial | Public spec sheets (source, annotation, volume, format, year), stated agreement metrics, security certifications and samples on request; no public price or preview. | c006, c024, c025, c026, c035, c049 |
| Q12 | sourced | The ready-made side is 'off-the-shelf datasets' / the 'data catalog'; the bespoke side is 'custom data services'. Appen offers custom collection when the catalogue lacks the data and sells OTS as a supplement to it. | c001, c009, c029, c030, c041, c043 |

## Claims

### positioning

- **c001** Appen markets off-the-shelf datasets as pre-licensed training data across speech, image, video, text and multimodal formats.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “pre-licensed training data across speech, image, video, text, and multimodal formats” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c005** Appen describes its data catalog as an index of licensed datasets for model training, evaluation and research.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “An AI training data catalog is an index of licensed datasets for model training, evaluation, and research.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c004** Appen's off-the-shelf Image & Video category covers everyday objects, documents, signage, gestures and faces captured in real-world conditions.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Everyday objects, documents, signage, gestures and faces, captured in real-world lighting and conditions” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c007** Appen says its catalog includes 596 datasets across RL tasks, code, text, speech and audio, enterprise data, image and video, and specialty datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **596 datasets listed in catalog** (vendor-stated count of catalog listings, all categories; as of retrieval)
  - “Appen's catalog includes 596 datasets across RL tasks, code, text, speech and audio, enterprise data” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Live catalogue count exists only on Appen's site. The H1 FY26 ASX presentation (slide 18) gives category scales (e.g. ~25 enterprise datasets, ~10 LLM-training book sets, ~20 journal corpora, >500 repositories) but no total count, so neither confirms nor contradicts 596. No search available.
  - verifier (scope): **scope_ok** — Live /data-catalog page carries the sentence as quoted. Vendor-stated count.
- **c010** Appen's 'Selfie image and video collection' listing (IMG_VID_SELFIE_US) is sourced from 'Appen Global' and consists of participant self-recorded photos and videos following a prompt.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_VID_SELFIE_US, US_
  - “Participant self-recorded photos/videos following a prompt” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-vid-selfie-us> · docs · retrieved 2026-10-01 · quote check: exact
- **c013** Appen's 'Baking Pictures' image listing (IMG_BAKE_CN, from Appen China) is sourced from public websites.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_BAKE_CN_
  - “(Data source: website) This dataset includes pictures of baked goods” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-bake-cn> · docs · retrieved 2026-10-01 · quote check: exact
- **c014** Appen's 'European License Plate Detection Annotations' listing is derived from the public KITTI and Cityscapes autonomous-driving datasets, annotated by Appen's in-house workforce.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LICENSE_ANNO, EU_
  - “Derived from existing public autonomous-driving datasets (KITTI, Cityscapes)” — Appen, <https://www.appen.com/data-catalog/image-video-sets/license-anno> · docs · retrieved 2026-10-01 · quote check: exact
- **c015** Appen lists academic textbook and journal corpora whose source is labelled 'Third Party Vendor'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: TEXTBOOK_PLASMA_001_v1_
  - “Third Party Vendor” — Appen, <https://www.appen.com/data-catalog/book-corpora/textbook-plasma-001-v1> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A source label on Appen's own listing. Related, not confirming: the H1 FY26 ASX presentation lists 'Book corpuses ... journals, course textbooks' (~10 LLM-training sets, ~20 academic journal corpora) as a NEW dataset category, without saying who supplies them.
  - verifier (scope): **scope_ok** — Listing TEXTBOOK_PLASMA_001_v1 shows 'Source: Third Party Vendor'. Only a textbook corpus is cited; the statement's 'journal corpora' is not shown by this listing.
- **c019** The GlobalPhone speech corpus listed by Appen was developed in collaboration with the Karlsruhe Institute of Technology.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: GlobalPhone_
  - “Developed in collaboration with the Karlsruhe Institute of Technology (KIT)” — Appen, <https://www.appen.com/data-catalog/audio-catalogue/bul-asr002> · docs · retrieved 2026-10-01 · quote check: exact
- **c020** Appen's catalog lists mobile GPS location data from Quadrant, described as an Appen company, with samples obtained by booking a meeting.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LOCATION_MOBILE_US, US_
  - “Please book a meeting to discuss your requirements and obtain a sample dataset to evaluate for your unique use case.” — Appen, <https://www.appen.com/data-catalog/other-sets/location-mobile-us> · docs · retrieved 2026-10-01 · quote check: exact
- **c021** Appen's catalog sells internal operating data (email, drive, code) of companies that operated for a limited period, such as a gold-loan fintech active 2021–2024.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: FinTech-60 (enterprise company data)_
  - “Application servers & databases; enterprise Gmail; Google Drive; Git repositories” — Appen, <https://www.appen.com/data-catalog/enterprise-company-data/fintech-60> · docs · retrieved 2026-10-01 · quote check: exact
- **c031** Appen describes its code-repository datasets as real production codebases with full commit and review history, anonymised for training use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Real production codebases with their full commit and review history, anonymised for training use.” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Appen's H1 FY26 investor presentation says its audio catalog holds ~200k raw hours across 58 language/domain lines.  
  _number · vendor_stated · as of 2026-08-27 (publication)_ · **200000 raw audio hours in catalog** (vendor-stated catalog scale, audio only, approximate; as of 2026-08)
  - “~200k raw hours across 58 language/domain lines” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126949-2A1692513?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (blind): **unverifiable** — Blind step reached only the profile own source URL (the same ASX-lodged Appen document on cdn-api.markitdigital.com), which does read as stated. (slide 18, row Audio catalog for speech models, status EXISTING). Not counted as independent; the figure is by nature company-stated and no other source was reachable (no search available).
  - verifier (scope): **scope_ok** — Slide 18 row 'Audio catalog for speech models' (call-centre/dictation audio, 15+ languages), marked EXISTING.
- **c044** Appen's physical AI page says custom task demonstrations are sourced from its global contributor network of 1M+ people across 170+ countries.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “sourced from Appen's global contributor network of 1M+ people across 170+ countries” — Appen, <https://www.appen.com/physical-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Appen's catalog lists speech datasets whose source is labelled 'Nuance', such as UK English TTS voice recordings.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: TC-STAR baseline voice (audio catalogue), UK_
  - “Nuance” — Appen, <https://www.appen.com/data-catalog/audio-catalogue/tc-star-male-baseline-voice-ian> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c006** Appen says each catalog dataset includes a spec sheet covering source, annotation, limitations, licence and refresh cadence.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each includes a spec sheet covering source, annotation, limitations, license, and refresh cadence.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** The Selfie listing states 1,403 images and 1,535 videos across 1,566 recording sessions by 70 unique participants.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_VID_SELFIE_US, US_ · **70 unique participants** (vendor-stated dataset composition on listing; one-off)
  - “There are 1403 images and 1535 videos across 1566 recording sessions, by 70 unique participants.” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-vid-selfie-us> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Per-listing counts on Appen's own catalogue page; no independent route (no search available).
  - verifier (scope): **scope_ok** — Live listing IMG_VID_SELFIE_US carries the sentence verbatim. Scope region 'US' is inferred from the identifier; the listing shows no region field.
- **c012** The public Selfie listing page, which depicts people's faces, shows no consent, release, licence or price text.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_VID_SELFIE_US_
  - “Participants took a short video and picture of themselves following a prompt making various facial expressions” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-vid-selfie-us> · docs · retrieved 2026-10-01 · quote check: exact
- **c035** In February 2021 Appen invited buyers to request an OTS dataset sample.  
  _offer · vendor_stated · as of 2021-02-25 (publication)_
  - “to request an Appen OTS dataset sample” — Appen, <https://www.appen.com/press-release/new-pre-labeled-datasets-from-appen> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c046** Appen's 'Hand gesture videos' listing says videos may include the participant's face.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: HUMAN_BODY_VID003_
  - “Videos may include the participants face or only their hand.” — Appen, <https://www.appen.com/data-catalog/image-video-sets/human-body-vid003> · docs · retrieved 2026-10-01 · quote check: exact
- **c047** Appen's 'Garments' image and video listing is marked 'in development', still says it was expected ready Q3 2025, and can be prioritised on request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_VID_GARMENTS_US, US_
  - “Data collected, QA is underway, expected to be ready Q3 2025. Can be prioritized upon request.” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-vid-garments-us> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** The Garments listing includes participant demographics and body-measurement metadata alongside videos of participants wearing the garment.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IMG_VID_GARMENTS_US, US_
  - “Metadata includes demographics, body measurements, labels for garment category” — Appen, <https://www.appen.com/data-catalog/image-video-sets/img-vid-garments-us> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c049** Appen's dataset listing pages are listed in its public sitemap and render their specification without login.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “https://www.appen.com/data-catalog/image-video-sets/img-vid-selfie-us” — Appen, <https://www.appen.com/sitemap.xml> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c002** Appen says its off-the-shelf datasets come with full provenance documentation intended for the buyer's legal and compliance teams.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “full provenance documentation, so your legal and compliance teams can approve use without ambiguity” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** Appen's catalog page says provenance documentation covers source, annotation method, collection year, coverage period and limitations.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Source, annotation method, collection year, coverage period, and limitations documented.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c026** Appen's catalog page cites SOC 2 Type II, ISO 27001, GDPR/CCPA handling and EU AI Act documentation under governance.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “SOC 2 Type II, ISO 27001, GDPR/CCPA handling, EU AI Act documentation.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c027** Appen's off-the-shelf page offers 'Talk to an expert' as the route to engage, with no checkout or cart on the page text.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Talk to an expert” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Button label and page mechanics on Appen's own site.
  - verifier (scope): **scope_ok** — /ots-datasets shows 'Talk to an expert' plus 'Explore our datasets', 'Browse the full catalog' and 'Get in touch'; no cart, checkout or price on the page.

### pricing

- **c017** The GDPVal Tasks listing says pricing is tiered by task complexity (step count), with a volume discount, but publishes no price.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: TASK_GDPVAL_001_
  - “Pricing tiered by task complexity (step count) — see Volume Discount for tier breakdown” — Appen, <https://www.appen.com/data-catalog/tasks-verifiers/task-gdpval-001> · docs · retrieved 2026-10-01 · quote check: exact
- **c018** Appen's GlobalPhone speech listings say tiered package prices are available when buying multiple languages or the full corpus.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: BUL_ASR002 (GlobalPhone)_
  - “tiered package prices available with purchase of multiple Global Phone languages or the full corpus” — Appen, <https://www.appen.com/data-catalog/audio-catalogue/bul-asr002> · docs · retrieved 2026-10-01 · quote check: exact

### licence

- **c003** Appen asserts that all its off-the-shelf datasets are collected under clear consent and licensing terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All datasets are collected under clear consent and licensing terms” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** Appen's task-verifier listings state the licence type as 'Perpetual — Non-Exclusive'.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: TASK_GDPVAL_001 and other tasks-verifiers listings_
  - “Perpetual — Non-Exclusive” — Appen, <https://www.appen.com/data-catalog/tasks-verifiers/task-gdpval-001> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Licence field on Appen's own listings.
  - verifier (scope): **scope_ok** — TASK_GDPVAL_001 shows 'Licence Type: Perpetual — Non-Exclusive'. Only one tasks-verifiers listing is cited, so 'other tasks-verifiers listings' in scope is unshown.
- **c022** Appen's catalog page states its datasets carry contributor consent and documented licensing.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contributor consent and documented licensing.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Appen's own assertion about its catalogue; no independent audit or buyer documentation reachable without search.
  - verifier (scope): **scope_ok** — Live /data-catalog 'Consent & licensing' section reads as quoted. It is an assertion, not consent documents supplied to the buyer.
- **c023** Appen's catalog page states the rights granted are perpetual, non-exclusive commercial training rights.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Perpetual, non-exclusive commercial training rights.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Appen's own statement of the rights it grants; exists only on its site.
  - verifier (scope): **scope_ok** — Live /data-catalog 'Consent & licensing' section reads as quoted. It is a catalogue-wide marketing statement, not licence text.

### custody

- **c033** In February 2021 Appen said an OTS dataset is often delivered in one week, compared with eight to twelve weeks for a new collection and annotation project.  
  _number · vendor_stated · as of 2021-02-25 (publication)_ · **1 weeks to deliver an OTS dataset (typical)** (vendor-stated typical delivery time vs 8-12 weeks for new collection; per order)
  - “An OTS dataset is often delivered in one week, for example, compared to the eight to twelve weeks for a new dataset collection” — Appen, <https://www.appen.com/press-release/new-pre-labeled-datasets-from-appen> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Delivery-time comparison (one week vs eight to twelve weeks) not in the FY20 annual report, FY20 results release or FY20 investor presentation lodged on ASX 24 Feb 2021. Trade-press coverage of a Feb 2021 announcement may exist but could not be located: no search available.
  - verifier (scope): **scope_ok** — Quote matches the Feb 2021 Appen press release. Note for matrix.custody_model: 'delivered' says nothing about where bytes land, so it does not settle copy_to_buyer; source_class should be vendor_marketing, not press_relaying_vendor.

### vetting

- **c025** Appen's catalog page says annotation quality is measured with Cohen's kappa or Krippendorff's alpha, with thresholds and adjudication protocols.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Cohen’s kappa or Krippendorff’s alpha, with thresholds and adjudication protocols.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** In February 2021 Appen said all its datasets are developed using a fully transparent, opt-in methodology.  
  _terms · vendor_stated · as of 2021-02-25 (publication)_
  - “All Appen datasets are developed using a fully transparent, opt-in methodology” — Appen, <https://www.appen.com/press-release/new-pre-labeled-datasets-from-appen> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c045** For custom physical-AI collection Appen cites participant consent, on-site data handling and privacy controls aligned to GDPR.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “participant consent, on-site data handling, and privacy controls aligned to GDPR” — Appen, <https://www.appen.com/physical-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c050** Appen runs a contributor platform, CrowdGen, through which its crowd contributors take on work.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CrowdGen is the contributor platform of Appen, a publicly traded data company” — Appen, <https://crowdgen.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Appen said in 2022 that crowd contributor pay is based on the contributor's local marketplace.  
  _terms · vendor_stated · as of 2022-06 (publication)_
  - “contributor pay is based on their local marketplace” — Appen, <https://www.appen.com/blog/ai-ethics-how-fair-pay-benefits-our-crowd-contributors> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c052** Appen's Contributor Portal Terms of Service describe Appen and the contributor as independent parties, not employer and employee.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The parties hereto are independent parties, not agents, employees or employers of the other or joint venturers” — Appen, <https://www.appen.com/ac-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** CrowdGen tells contributors their earnings accrue from hours worked at rates stated before they begin; it mentions no royalty or resale share.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Track the hours you work and see how they add up to your earnings.” — Appen, <https://crowdgen.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — CrowdGen is Appen's own contributor brand; its pay description exists only on Appen/CrowdGen pages. Independent contributor-pay reporting could not be looked for: no search available.
  - verifier (scope): **quote_incomplete** — The quote shows hours adding up to earnings but not 'rates stated before they begin'; crowdgen.com's 'Competitive rates, stated clearly before you begin.' would. The page also advertises hourly rates ('$100+/hr* Top hourly pay', pay 'based on location and skills').

### catalogue_custom

- **c009** Appen's catalog page offers to build data across 500+ locales when the right catalog dataset is not available.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If the right data is not available, Appen can build it across 500+ locales.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** Appen says off-the-shelf datasets are commonly used to supplement custom data with additional volume or class diversity.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “commonly used to supplement custom data with additional volume or class diversity” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** For proprietary demographics, specific environments or controlled protocols, Appen points buyers to its 'custom data services' instead of the catalogue.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Appen's custom data services across” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c041** Appen's H1 FY26 investor presentation lists 'Off-the-shelf datasets' as a service line: pre-built dialect, minor language, image editing, company data and coding repository sets.  
  _offer · filing · as of 2026-08-27 (publication)_
  - “Pre-built dialect, minor language, image editing, company data and coding repository sets” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126949-2A1692513?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **c043** Appen's physical AI page offers licensed off-the-shelf data 'available now or coming soon' alongside custom collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensed off-the-shelf data available now or coming soon” — Appen, <https://www.appen.com/physical-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c032** In February 2021 Appen said its OTS offering exceeded 250 datasets, with over 11,000 hours of audio, 25,000 images and 8.7 million words across 80 languages.  
  _number · vendor_stated · as of 2021-02-25 (publication)_ · **250 datasets in OTS offering** (vendor-stated count, all modalities; as of 2021-02-25)
  - “Appen’s total OTS offering includes over 250 datasets, comprising of over 11,000 hours of audio, over 25,000 images” — Appen, <https://www.appen.com/press-release/new-pre-labeled-datasets-from-appen> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Partial: the Feb 2021 ASX-lodged annual report confirms '>250 datasets across 80 languages' at that date, but not the 11,000 audio hours, 25,000 images or 8.7 million words; those three figures were found only in Appen's own material (not reached elsewhere; no search available). The FY20 investor presentation (same day) does not mention OTS datasets.
    - “provide more than 250 licensable off-the-shelf datasets across 80 languages” — ASX (Appen Limited 2020 Annual Report lodged 24 Feb 2021), <https://announcements.asx.com.au/asxpdf/20210224/pdf/44szn13hdlty6k.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Page (an Appen press release dated Feb 2021) supports the statement, but the quote stops at '25,000 images'; the words 'over 8.7 million words across 80 languages' are needed. Also the source is Appen's own press release on appen.com, so source_class should be vendor_marketing, not press_relaying_vendor.
- **c039** Appen's H1 FY26 ASX announcement says ~US$12 million of annualised operational efficiencies were identified in Appen Global, ~70% to be executed by end FY26.  
  _event · filing · as of 2026-08-27 (publication)_
  - “This focus has identified an incremental ~$12 million in operational efficiencies” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126948-2A1692509?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (blind): **unverifiable** — Blind step reached only the profile own source URL (the same ASX-lodged Appen document on cdn-api.markitdigital.com), which does read as stated. Body text: an incremental ~$12 million in operational efficiencies via AI-enabled operations, ~70% before year end, remainder in Q1 FY27. Not counted as independent. Independent press (AFR, The Australian, Market Index) could not be reached: marketindex.com.au returned 403 and no search available.
  - verifier (scope): **quote_incomplete** — Quote shows '~$12 million in operational efficiencies' but not 'annualised', 'within Appen Global' or the ~70% by end FY26. The highlights line '~$12 million annualised cost out identified within Appen Global' and '~70% of cost out will be executed before the end of the year' would. Statement also drops 'incremental' (additional to earlier cost-outs).
- **c040** Appen, listed on the ASX as APX, published its half-year results for the six months to 30 June 2026 on 27 August 2026, showing it is actively trading.  
  _status · filing · as of 2026-08-27 (publication)_
  - “is pleased to provide its half-year results for the six months ended 30 June 2026 (H1 FY26)” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126948-2A1692509?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (blind): **confirmed_independent** — The exchange own announcements index for APX records the lodgement, timestamped 2026-08-26T22:42:20Z (= 08:42 AEST 27 Aug 2026), flagged price-sensitive, with the Appendix 4D and investor presentation lodged the same minute. Followed on 2026-08-18 by a Change of Office Address notice. Shows continued listing and disclosure; the index is the exchange record, not an Appen page.
    - “H1FY26 Results and FY26 Outlook” — ASX (company announcements index), <https://asx.api.markitdigital.com/asx-research/1.0/companies/apx/announcements> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Fact right, but the quote shows only that results were provided, not the 27 August 2026 date or the ASX listing. The page header 'ASX Announcement 27 August 2026' and '(ASX: APX)' would show them.

### demand

- **c008** Appen says teams use the catalog for ready-to-license data when timelines are tight or more volume and diversity are needed.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Teams use the catalog for ready-to-license data when timelines are tight or more volume and diversity are needed.” — Appen, <https://www.appen.com/data-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** Appen positions off-the-shelf data for broad common categories, timelines that do not permit custom collection, or budgets that make bespoke data impractical.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “when development timelines do not permit a custom collection cycle” — Appen, <https://www.appen.com/ots-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** Appen's case study says buyer MediaInterface, a healthcare speech-recognition company, used Appen's pre-labeled French lexicon datasets when expanding into France.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Appen helped us out with French lexicon data.” — Appen, <https://www.appen.com/case-studies/mediainterface-expands-to-france-with-pre-labeled-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The customer's own site (mediainterface.de home and ueber-uns) confirms it sells medical speech recognition with French among its languages ('Deutsch, Französisch, Schweizer Hochdeutsch') but says nothing of Appen, France expansion or bought datasets. No press route found without search; outcome rests on Appen's case study only.
  - verifier (scope): **quote_incomplete** — 'Appen helped us out with French lexicon data' does not show pre-labeled datasets or France expansion; the page's 'MediaInterface was looking to expand to France next' and 'pre-labeled datasets' would. The engagement dates from after INTERSPEECH 2015, so as_of 2026-10-01 (retrieved_only) makes a roughly ten-year-old outcome look current.
- **c037** Appen's H1 FY26 ASX announcement reports group revenue of US$119.9 million for the six months to 30 June 2026, up 17% on the prior period.  
  _number · filing · as of 2026-08-27 (publication)_ · **119.9 USD million revenue** (group revenue, all business lines, H1 FY26 (six months to 30 June 2026); half-year)
  - “Revenue of $119.9 million, +17% vs prior corresponding period (pcp)” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126948-2A1692509?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (blind): **confirmed_independent** — Different document from the profile source: the Appendix 4D / interim financial report (KPMG-reviewed statements) lodged on ASX in the same minute. Revenue from contracts with customers 119,915 (US$000). Growth is 17.5%, rounded to 17% in the announcement. Segment split: Appen China 76,196, Appen Global 43,719 - growth is entirely China. Still company-prepared; no independent press reached (marketindex.com.au returned 403; no search available).
    - “Operating revenue increased 17.5% to $119.9 million (H1 2025: $102.1 million)” — ASX (Appen Limited Appendix 4D and Interim Financial Report), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126942-2A1692505?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (scope): **scope_ok** — Quote matches. Currency is printed as '$'; US$ is right because the same document converts cash as '$44.7 million (A$64.8 million)'.
- **c038** Appen's H1 FY26 ASX announcement attributes part of Appen China's EBITDA margin improvement to increased revenue from high-margin prebuilt datasets.  
  _outcome · filing · as of 2026-08-27 (publication)_
  - “increased revenue from high-margin prebuilt datasets” — Appen Limited (ASX: APX), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126948-2A1692509?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - verifier (blind): **unverifiable** — Blind step reached only the profile own source URL (the same ASX-lodged Appen document on cdn-api.markitdigital.com), which does read as stated. (Appen China segment paragraph, alongside a greater mix of higher-margin generative AI projects; no dataset revenue figure disclosed). Not counted as independent; no search available to find analyst or press restatement.
  - verifier (scope): **scope_ok** — Quote is from the Appen China segment paragraph, as the statement says.

## Added by the verifier

- **v001** Appen's H1 FY26 ASX announcement reports Appen Global segment revenue of US$43.7 million for the six months to 30 June 2026, down 27% on the prior period, while Appen China grew 80%.  
  _number · filing · as of 2026-08-27 (publication) · scope: Appen Global segment_ · **43.7 USD million revenue** (Appen Global segment revenue, all business lines, H1 FY26; half-year)
  - “Revenue of $43.7 million, -27% vs pcp” — Appen Limited (ASX announcement), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126948-2A1692509?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v002** Appen's H1 FY26 investor presentation gives the scale of its book-corpus dataset category as about 10 LLM-training sets and about 20 academic journal corpora.  
  _number · filing · as of 2026-08-27 (publication) · scope: Book corpuses category_ · **20 academic journal corpora** (vendor-stated approximate count in ASX-lodged investor presentation; category marked NEW; as of 2026-08)
  - “~10 LLM-training sets, ~20 academic journal corpora” — Appen Limited (ASX investor presentation), <https://cdn-api.markitdigital.com/apiman-gateway/ASX/asx-research/1.0/file/2924-03126949-2A1692513?access_token=83ff96335c2d45a094df02a206a39ff4> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed

## Unknown

- `matrix.buyer_vetting` — not_published; tried <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>, <https://www.appen.com/legal-policies>
- `matrix.erasure_after_sale` — not_published; tried <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>, <https://www.appen.com/legal-policies>, <https://www.appen.com/legal-policies/privacy-statement>
- `matrix.exclusivity_offered` — not_published; tried <https://www.appen.com/data-catalog>, <https://www.appen.com/data-catalog/tasks-verifiers/task-gdpval-001>
- `matrix.versioning` — not_published; tried <https://www.appen.com/data-catalog>, <https://www.appen.com/data-catalog/book-corpora/textbook-plasma-001-v1>
- `matrix.human_subject_consent_docs` — not_published; tried <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>, <https://www.appen.com/data-catalog/image-video-sets/img-vid-selfie-us>, <https://www.appen.com/data-catalog/image-video-sets/human-body-vid003>
- `matrix.contributor_pay_model` — not_published; tried <https://crowdgen.com/>, <https://crowdgen.com/terms-of-service>, <https://help.crowdgen.com/s/topic/0TOTR0000005UK14AM/payments>, <https://www.appen.com/ac-terms-of-service>, <https://www.appen.com/blog/ai-ethics-how-fair-pay-benefits-our-crowd-contributors>
- `questions.Q4` — not_published; tried <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>, <https://www.appen.com/legal-policies>
- `other.buyer_licence_text` — not_published; tried <https://www.appen.com/legal-policies>, <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>, <https://www.appen.com/sitemap.xml>
- `other.current_delivery_mechanics` — not_published; tried <https://www.appen.com/ots-datasets>, <https://www.appen.com/data-catalog>
- `other.crowdgen_payments_help` — js_empty; tried <https://help.crowdgen.com/s/topic/0TOTR0000005UK14AM/payments>
- `other.independent_press` — not_found

## Leads, not cited

- <https://cdn.jsdelivr.net/gh/webtenn/datasets-index@main/datasets-index.json> — Machine-readable index behind Appen's catalog (596 items with source, licenceType, volume fields); useful for counts by source, but hosted in a web agency's repo, so not cited.
- <https://cdn.jsdelivr.net/gh/webtenn/datasets-index@main/quote-cart.js> — Client-side 'Request a Quote cart' on catalog pages; confirms quote-based buying but is script, not page text.
- <https://www.appen.com/data-catalog/other-sets/location-mobile-us> — Quadrant (an Appen company) mobile GPS location data sold via the same catalogue; relevant to non-media supply and consent questions.
- <https://www.appen.com/blog/payments-update> — Not fetched; may describe contributor payment mechanics.
- <https://www.appen.com/press-release/appen-announces-crowd-code-of-ethics-to-build-better-ai> — Not fetched; crowd code of ethics may speak to consent and pay.
- <https://www.appen.com/investors/annual-reports> — FY25 annual report not read; may quantify dataset revenue.
