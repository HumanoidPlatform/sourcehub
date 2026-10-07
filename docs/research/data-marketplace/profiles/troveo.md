# Troveo

licensing_marketplace · deep · status: **active** · also known as Troveo AI, Troveo AI, Inc.

> Rendered from `ledger/troveo.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Dataset Library / "Multimodal Data" ("Explore Our Library", "off-the-shelf datasets"), browsed and assembled in Troveo Lens; business data shown as "Company Data Snapshots"” and its bespoke side “Sourcing / "custom sourcing" ("Tell us your requirements we build the dataset"; "we produce new content to your exact technical and content specifications")”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c086, c079, c042, c114, c018 | Owners license to Troveo (sublicensable through multiple tiers); Troveo licenses onward to AI developers 'under its own agreements' and buyers sign one contract with Troveo; owners are never named publicly. Troveo's business-data page also says it licenses 'on your behalf' (see conflicts). No buyer licence text is published; the owner-side terms are Troveo's own description of its business data agreement. |
| economics_model | revenue_share | c118, c074, c052, c013 | Owners receive a share of each licence fee (60% for business data, gross); Troveo keeps the rest. The video/creator royalty rate is not published. |
| who_pays_fee | seller | c074, c119 | Troveo's cut is the 40% of buyer licence fees it retains before paying the owner's 60% (business data); it says it adds no further fees or deductions. Whether buyers pay anything on top is not published. |
| supply_models | third_party_providers, contributor_uploads | c116, c003, c121, c015, c072, c009, c064 | Creators and media companies (7,000+ licensors) and companies licensing business data supply the catalogue; individual creators upload through the owner portal. Troveo also says it 'activates exclusive supply networks to capture' content for custom requests, but no evidence shows that commissioned captures are relisted, and no speculative own collection was found. |
| custody_model | copy_to_buyer | c111, c115, c101, c039, c015 | Owners transfer media into Troveo (S3 bucket, cloud transfer or physical drives); Troveo processes it and delivers copies to the buyer in the buyer's format. |
| transaction_mode | contact_sales | c012, c041, c112, c028, c114 | Listings end in 'Request full dataset'; there is no price sheet and scope, rights and timelines are negotiated per deal. Troveo also says buyers can 'browse and assemble datasets self-serve in Lens' (see conflicts), but no checkout or published price exists and Lens could not be inspected. |
| public_prices | none | c041, c010, c012 | No price on the library, on the three listings opened, or anywhere else found; Troveo states there is no public price sheet. |
| licence_model | negotiated | c112, c041, c028 | Usage rights, licence scope and exclusivity are settled per deal. No standard buyer licence is published. |
| exclusivity_offered | yes | c041, c053 | Exclusivity is named as a negotiated deal variable; Troveo says where exclusivity is part of an agreement it is time-limited and must be earned. The latter sentence sits in an owner-facing article, so its application to buyers is inferred from the deal-negotiation sentence. |
| public_listing | public_summary_gated_detail | c010, c012, c106, c018 | The multimodal dataset library and listing pages are public; full datasets are by request, company data snapshot details sit behind a shared password, and Troveo Lens is behind login. Individual owners' content is not listed publicly. |
| buyer_vetting | unknown |  | No published rule on buyer checks; 'work email' is requested on forms, but nothing states vetting. |
| sample_mechanics | sample_on_request | c113, c029, c036 | Buyers 'ask for samples against your brief'; in a deal, Troveo delivers 'submitted hours' and the buyer then chooses which clips to license (accepted hours). Listings show stats, metadata fields and still images only. |
| versioning | unknown |  | Nothing found on dataset versions, updates, or what a past buyer receives when a dataset changes. |
| human_subject_consent_docs | asserted_only | c007, c084, c071, c037 | Troveo asserts BIPA/CUBI compliance for every hour and says owners warrant consents; the per-asset licensing agreement 'can be produced per asset if anyone ever asks'. No person-level release or consent record is described as delivered to buyers, and the owner annotation template has no people/consent fields. |
| contributor_pay_model | royalty_or_revenue_share | c013, c052, c023, c116 | Creators who upload footage are paid a royalty on each use, only after the buyer pays. Rate not published for video. How any capturers in custom 'supply networks' are paid is unknown. |
| catalogue_plus_custom | both | c010, c063, c049, c043 |  |
| erasure_after_sale | takedown_only | c077, c078, c076 | Business data agreement as Troveo describes it: removal applies only to future deals, buyer agreements survive the owner's termination, and nothing can be clawed back from trained models. No buyer-side deletion clause or data-subject erasure process was found; the video owner agreement was not available. |
| quality_evidence | operator_verified | c019, c065, c101, c030 | Troveo's own pipeline clears, filters and annotates content, with programmatic classification plus human validation and a QA report on delivery. These are vendor statements; no third-party audit found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Troveo says 40+ active buyers, including 'Mag 7' firms that took 1M+ hours and 500K+ clips, buying in hours or clips against a spec; business datasets average four sales. All figures are vendor-stated; why buyers choose catalogue over custom is not documented. | c059, c107, c108, c109, c055, c004 |
| Q2 | partial | For owners, Troveo does valuation, rights work, packaging and buyer matching, keeps the owner anonymous and handles payment, which owners would otherwise build themselves. No comparison with owners selling direct is published. | c093, c016, c091, c018 |
| Q3 | sourced | Inventory comes from 7,000+ creators and media companies who sign a partnership agreement explicitly covering AI training (about 95% exclusively), plus companies licensing anonymised business data; Troveo also captures to order through 'supply networks'. | c116, c121, c070, c045, c009, c064 |
| Q4 | partial | No evidence on relisting commissioned captures. On the owner side, buyer agreements survive the owner's termination and removal is prospective only; non-exclusive owners may license elsewhere. | c076, c077, c088 |
| Q5 | sourced | Troveo takes a sublicensable licence from owners and licenses onward under its own agreements; owners warrant rights and consents and indemnify Troveo and buyers, while Troveo's indemnity to owners is optional via a Rider (per Troveo's description of its business data agreement). | c086, c079, c084, c082, c085, c058 |
| Q6 | sourced | Owners upload or ship media into Troveo's storage; Troveo processes it and delivers copies to the buyer in the buyer's format with a manifest. | c039, c015, c111, c115, c101 |
| Q7 | partial | The capturer/owner consents by signing an agreement covering AI training and warrants consents; Troveo asserts BIPA/CUBI compliance for depicted people. No place-owner consent or person-level release process is described. | c070, c084, c007, c037, c096 |
| Q8 | partial | Terms are negotiated per deal; exclusivity is time-limited; data cannot be clawed back from trained models and buyer licences outlive owner termination. No buyer audit, leakage or fingerprinting terms were found. | c112, c053, c078, c076 |
| Q9 | sourced | Deals close through negotiation with Troveo (no public prices, 'Request full dataset'); Troveo runs a revenue share: 60% of fees to business-data owners, a royalty per use for video owners, paid after the buyer pays, often 4-5 months after delivery. | c041, c012, c118, c074, c013, c023, c027 |
| Q10 | partial | Listings are named dataset families with hour counts and metadata fields; a deal delivers 'submitted hours' against a spec, of which the buyer licenses 'accepted hours'. Nothing found on versions or on withdrawal after sale. | c011, c034, c036, c105 |
| Q11 | partial | Before purchase buyers see stats and metadata fields and can ask for samples against a brief; after delivery they choose clips. Troveo offers per-asset rights documentation on request and a QA report on delivery. | c113, c029, c071, c101, c065 |
| Q12 | sourced | The library (browsed in Lens) and custom sourcing are sold side by side; even catalogue deals are spec-driven matches from the licensed pool, and new capture is used 'when off-the-shelf datasets are not enough'. | c043, c049, c063, c035, c034 |

## Narrative

### positioning

Troveo presents itself as 'the world's largest network of real-world data for AI' [c001], a broker that licenses creator and media footage to AI labs and, since 2026, business data [c047][c009]. It describes its role as identifying value, working on rights, packaging for evaluation and matching buyers [c093]. Almost every scale figure (8M+ video hours, 7,000+ licensors, 40+ buyers) is vendor-stated.

### supply

Supply is 7,000+ creators and media companies who sign a partnership agreement covering AI training [c116][c121][c070], about 95% exclusively [c045]. Owners upload raw libraries via portal, S3 or shipped drives with no organising required [c015][c030]; Troveo clears, processes and annotates every clip [c019]. Business data owners license anonymised company data [c073]. Troveo also captures to order through 'exclusive supply networks' [c064].

### object_model

Public listings are dataset families (e.g. Talking Head, 449K+ hours) with metadata fields [c097][c011]. The deal unit is hours or clips cut to a client spec: Troveo delivers 'submitted hours', the buyer licenses 'accepted hours' [c034][c036]. Business data is packaged with a manifest [c062]. Versioning is undocumented.

### listing

The library at /datasets is public, sorted by modality, with hour counts and descriptions but no prices [c010]. Listing pages show stats, metadata fields, use cases and stills, and end in 'Request full dataset' [c012]. Owners and their content are never named publicly [c018][c091]; company snapshots are password-gated [c106].

### discovery

Buyers browse the public library, or build datasets in Troveo Lens, a logged-in tool, or tell Troveo what they are training toward [c043][c048].

### trust

Troveo asserts every hour was verified for BIPA and CUBI compliance [c007] and every asset has a documented chain of rights [c069], producible per asset on request [c071]. Buyers can ask for samples against a brief [c113].

### transaction

Deals are negotiated with Troveo over rights, scope, deliverables and timelines [c112], taking weeks [c028]; buyers sign one contract [c114]. After delivery the buyer finalises which clips to license [c029].

### pricing

There is no public price sheet; price turns on volume, scarcity, exclusivity and rights scope [c041]. Troveo runs a revenue share [c118]: business-data owners get 60% of gross licence fees [c074], with no further fees [c119].

### licence

Owners grant Troveo a sublicensable licence and Troveo licenses onward under its own agreements [c079][c086]. Owners warrant non-infringement and consents and indemnify Troveo and buyers [c084][c082]; Troveo's own indemnity is Rider-only [c085]. These are Troveo's descriptions of the business data agreement; no buyer licence is public.

### custody

Media moves from owner storage into Troveo (S3 upload, cloud transfer or drives) [c039][c015], then Troveo delivers copies in the buyer's format with manifest, provenance and QA report [c111][c101].

### vetting

Troveo filters duplicates [c030], rejects artificially slowed runtime [c032], and claims programmatic plus human validation [c065]. Business data is de-identified before delivery [c089].

### contributor_pay

Owners earn a royalty on every use [c013], paid only after the buyer pays [c023], often 4-5 months after delivery [c027]; business-data payouts follow within 45 days of receipt, $500 minimum in the US [c080][c081]. Troveo cites $20M+ paid (Sept 2026) [c120] but its owner page says $50M+ [c017].

### post_sale

Owner removal is prospective only; buyer agreements outlive the owner's agreement and nothing is clawed back from trained models [c077][c076][c078].

### catalogue_custom

The library and custom sourcing sit side by side [c049]; even catalogue deals are spec-driven matches from the licensed pool [c035], and new content is produced when off-the-shelf is not enough [c063].

### changes

In May 2026 Troveo expanded from video into audio, text, agentic workflows, gameplay and robot data [c067]; by September 2026 it also sells company business data [c009].

### demand

Vendor-stated: 40+ active buyers [c059], 1M+ hours to a 'Mag 7' enterprise [c107], 500K+ clips in three weeks [c108], four sales per business dataset on average [c055].

### regulation

Troveo AI, Inc. is the entity in the privacy policy [c124]; the only regulatory claim found is the BIPA/CUBI compliance assertion [c007].

## Buyer journey

1. Lands on troveo.ai; the header splits buyers into 'Multimodal Data' (the dataset library) and 'Business Data' (company snapshots); a contact page routes to 'I need training data'. [c001, c110]
2. Browses the public dataset library by modality; each card shows a name, description and hour count, with no price. [c010, c095]
3. Opens a listing (e.g. Everyday Tasks POV): description, stats, metadata fields, use cases and stills; the only action is 'Request full dataset'. [c011, c099, c012]
4. Optionally builds a dataset in Troveo Lens (login) or submits a custom-sourcing request against a model roadmap. [c043, c048, c049, c066]
5. Asks for samples against the brief and gives Troveo detailed specifications. [c113, c034]
6. Negotiates usage rights, licence scope, deliverables, timelines and price (volume, scarcity, exclusivity) with Troveo; this takes weeks. [c112, c041, c028]
7. Signs one contract with Troveo, which licenses onward under its own agreement. [c114, c086]
8. Troveo matches its ingested content to the spec and delivers 'submitted hours' in the buyer's format, with manifest, provenance and QA report. [c035, c111, c101, c115]
9. Buyer reviews the delivery and finalises which clips it licenses ('accepted hours'); it is invoiced and pays Troveo, which then pays owners. [c029, c036, c023]
10. Rights documentation for any asset can be produced on request afterwards. [c071]

## Claims

### positioning

- **c001** Troveo's website was live on 2026-10-01, presenting itself as a network of real-world data for AI.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The world's largest network of real-world data for AI” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Homepage fetched 2026-10-01 is live with the headline 'The world's largest network of real-world data for AI'; a site's own tagline exists only on the site. Independent signs of recent operation: Techstrong.ai 2026-05-01 feature and two N.D. Cal. complaints filed 2026-08-17 and 2026-08-31 (Round Hill v. Suno; Gerencia 360 v. Suno) naming Troveo among companies that license and pay for training data.
  - verifier (scope): **scope_ok** — Tagline quote plus a live fetch on 2026-10-01; resources dated up to 2026-09-29 show the site is maintained.
- **c047** Troveo says its catalogue spans video, audio, text, gaming, robotics and enterprise workflow data.  
  _offer · vendor_stated · as of 2026-08-16 (page_dated)_
  - “The catalog spans video, audio, text, gaming, robotics, and enterprise workflow data” — Troveo, <https://www.troveo.ai/resources/troveo-vs-protege> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c093** Troveo describes its role as identifying what is valuable, working with owners on rights and scope, packaging data for evaluation and matching it with AI buyers.  
  _offer · vendor_stated · as of 2026-09-04 (page_dated)_
  - “We identify what's valuable, work with you on rights and scope, package it for evaluation, and match it with AI buyers.” — Troveo, <https://www.troveo.ai/resources/data-licensing-business-model> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c002** Troveo says 95% of its content is exclusive to Troveo and licensed directly from the source.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **95 percent of content** (vendor-stated share of library exclusive to Troveo; denominator not stated; as at retrieval)
  - “95% Exclusive to Troveo licensed direct from the source” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.86
  - verifier (blind): **unverifiable** — Exclusivity share is a vendor traction figure; no independent source found. WebSearch not available in this run (no search available); Hollywood Reporter (402) and WSJ/NY Post (fetch refused) could not be read.
  - verifier (scope): **scope_wrong** — The homepage quote '95% Exclusive to Troveo licensed direct from the source' gives no denominator. Troveo's own pages that do give one say 95 percent of LICENSORS signed exclusively (c045, c046: 'More than 7,000 licensors globally, 95 percent signed exclusively'). The statement's '95% of its content' claims a denominator the source does not support.
- **c003** Troveo says it has 7,000+ data providers in its sourcing network.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **7000 data providers** (vendor-stated count, lower bound; cumulative)
  - “7,000+ Data Providers in our global sourcing network” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.71
  - verifier (blind): **unverifiable** — Techstrong (May 2026) relays 'thousands of content owners', consistent with but not confirming 7,000+. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok**
- **c004** Troveo says its library holds 8M+ hours of video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **8000000 hours of video** (vendor-stated library size, lower bound; as at retrieval)
  - “8M+ hours Videos” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **confirmed_relayed** — Relayed vendor figure (May 2026); no independent count exists.
    - “library of eight million hours of licensed video” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Homepage stat '8M+ hours Videos'. Techstrong (May 2026) relays 'eight million hours of licensed video'; Troveo's 2026-08-05 article says 'over 8 million hours of real-world video and audio', so the 8M figure is used for both video-only and video-plus-audio.
- **c005** Troveo says its library holds 4M+ hours of audio.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **4000000 hours of audio** (vendor-stated library size, lower bound; as at retrieval)
  - “4M+ hours Audio” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c006** Troveo says it offers 350+ company (business) datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **350 company datasets** (vendor-stated count, lower bound; as at retrieval)
  - “350+ Company Datasets” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **unverifiable** — Catalogue count of company datasets on Troveo's own pages; no independent source. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok**
- **c009** Troveo now also solicits companies to license internal business data (email, chat, CRM, tickets, files) for recurring revenue.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Turn your company's email, chat, CRM, tickets, and files into recurring revenue.” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c014** Troveo tells content owners they retain full ownership of their content and earn each time it is used.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “you retain full ownership and earn every time your content is used” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 1.00
- **c015** Content owners can deliver footage by drag-and-drop upload, cloud transfer or shipping physical media, with processing said to take 1-2 weeks.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Drag & drop, cloud transfer, or ship physical media. Processing takes 1–2 weeks.” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** Troveo tells content owners it handles licensing, processing and payment on their behalf.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo handles licensing, processing, and payment” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Troveo's content-owner onboarding has four steps: tell us about your content, upload it, Troveo prepares it, get paid.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We prepare your content” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c031** Troveo prefers .MOV and .MP4 submissions in H.264 or H.265.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The ideal file formats are .MOV and .MP4. We support both H.264 and H.265 codecs.” — Troveo, <https://support.troveo.com/articles/5318194645-i-have-some-technical-questions-about-raw-footage-file-formats-transcoding-color-grading-fps-bitrate-etc> · docs · retrieved 2026-10-01 · quote check: exact
- **c033** Troveo asks owners to submit footage free of watermarks.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Please ensure all footage is free of watermarks before submission.” — Troveo, <https://support.troveo.com/articles/5318194645-i-have-some-technical-questions-about-raw-footage-file-formats-transcoding-color-grading-fps-bitrate-etc> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** Owners include a troveo.yaml file at the top level of each upload so Troveo's system can recognise and process it.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your troveo.yaml file helps Troveo's system recognize and correctly process your uploaded content.” — Troveo, <https://support.troveo.com/articles/7499248682-where-should-I-attach-troveo_yaml_file> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** Troveo says videos become eligible for licensing on receipt, regardless of their processing status in the owner portal.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every video you upload is eligible for licensing as soon as it has been received” — Troveo, <https://support.troveo.com/articles/1654766997-how-long-does-it-take-for-my-footage-to-be-processed-and-show-up-in-my-dashboard> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** Troveo says more than 7,000 licensors have signed with it, 95 percent of them exclusively.  
  _number · vendor_stated · as of 2026-07-25 (page_dated)_ · **95 percent of licensors signed exclusively with Troveo** (vendor-stated share of more than 7,000 licensors; as at 2026-07-25)
  - “More than 7,000 licensors globally, 95 percent signed exclusively” — Troveo, <https://www.troveo.ai/resources/licensed-video-data-for-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Techstrong (May 2026) relays 'thousands of content owners', consistent with but not confirming 7,000; nothing independent on the 95 percent exclusive share. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok** — Page dated July 25, 2026: 'More than 7,000 licensors globally, 95 percent signed exclusively, over $20 million paid out'.
- **c046** Troveo's glossary says 95 percent of licensors on Troveo have signed exclusively.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “On Troveo, 95 percent of licensors have signed exclusively.” — Troveo, <https://www.troveo.ai/glossary/data-exclusivity> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c064** Troveo says it activates exclusive supply networks to capture new content for custom requests.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We activate exclusive supply networks to capture and deliver high-quality, model-aligned content at scale.” — Troveo, <https://www.troveo.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c070** Troveo says its 7,000+ licensors signed licensing agreements that explicitly cover AI training.  
  _terms · vendor_stated · as of 2026-07-22 (page_dated)_
  - “have signed licensing agreements with Troveo that explicitly cover AI training” — Troveo, <https://www.troveo.ai/resources/rights-cleared-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c072** Troveo says every asset is licensed directly from its rights holder under an agreement explicitly covering AI training, with per-asset documentation.  
  _terms · vendor_stated · as of 2026-08-28 (page_dated)_
  - “Every asset is licensed directly from its rights holder under an agreement that explicitly covers AI training” — Troveo, <https://www.troveo.ai/resources/ai-data-provenance> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c100** Troveo's world-models page says it has 500K+ hours of native action-aligned gameplay.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **500000 hours of gameplay** (vendor-stated, lower bound; as at retrieval)
  - “500K+ hours” — Troveo, <https://www.troveo.ai/world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Inventory size on Troveo's own page; no independent source. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote '500K+ hours' does not show what the hours are; the page continues 'hours native action-aligned gameplay'.
- **c102** Troveo says its world-model data is rights-cleared for AI training and not scraped or re-licensed off a public set.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Not scraped, not re-licensed off a public set.” — Troveo, <https://www.troveo.ai/world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c116** Troveo says its 8M+ hours of video and audio were contributed by creators and media companies who opted in and get paid.  
  _terms · vendor_stated · as of 2026-08-05 (page_dated)_
  - “contributed by creators and media companies who opted in and get paid” — Troveo, <https://www.troveo.ai/resources/ai-training-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Techstrong relays Troveo's figures (8M hours of licensed video; payments to thousands of content owners) in May 2026; 'opted in' and audio are not in the article. No independent count exists; WebSearch not available in this run (no search available);
    - “paid out more than $20 million to thousands of content owners after building a library of eight million hours of licensed video” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows the contributors but not the volume; the page (dated 2026-08-05) also says 'over 8 million hours of real-world video and audio'. Note this counts video AND audio together, whereas the homepage gives 8M+ hours video and 4M+ hours audio separately (c004, c005).
- **c121** Troveo's content-owner onboarding requires signing a partnership agreement and answering a survey about what the owner holds.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sign the partnership agreement and answer a short survey about what you own.” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c122** Troveo's content-owner page solicits categories including scripted, documentary/reality, sports, UGC, interviews, nature, animation, advertising, wildlife and aerial footage.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Scripted Content, Documentary/Reality, Sports & Movement, New Media/UGC, Talking Person/Interview” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c123** Troveo's robotics article describes its robotics offer as licensed real-world footage from over 7,000 rights holders, not its own capture.  
  _offer · vendor_stated · as of 2026-07-28 (page_dated)_
  - “Licensed real-world footage from over 7,000 rights holders, delivered training-ready with documented rights.” — Troveo, <https://www.troveo.ai/resources/robotics-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c036** Troveo distinguishes submitted hours (delivered to a client for consideration) from accepted hours, the subset the client licenses.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Accepted hours are the subset of submitted hours that the client ultimately licenses.” — Troveo, <https://support.troveo.com/articles/1950228339-what-are-submitted-hours-in-ai-deals> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Business data is anonymised, documented in a manifest and made market-ready before sale.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_
  - “Anonymized to our standard, documented in a manifest, and made market-ready.” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c104** Troveo's gameplay data is described as frame-synced video, player inputs and game-state events captured at the source.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Frame-synced video, player inputs, and structured game-state events captured at the source.” — Troveo, <https://www.troveo.ai/world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c010** Troveo's public dataset library shows named datasets with scope metrics but no prices or purchase buttons; its only buyer CTA is 'Contact us'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Find the data your models actually need.” — Troveo, <https://www.troveo.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** The Everyday Tasks POV listing describes egocentric video of routine daily activities captured from head- or chest-mounted cameras.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Egocentric video of routine daily activities (cooking, cleaning, tool use, work, navigating spaces)” — Troveo, <https://www.troveo.ai/datasets/everyday-tasks-pov> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** Troveo tells content owners that licensing is private and direct to AI labs under strict NDAs, with no public listings of their content.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Private, direct-to-lab licensing under strict NDAs. No public listings.” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c091** Troveo tells sellers their company is never named publicly and they decide what is excluded before anything ships.  
  _terms · vendor_stated · as of 2026-08-29 (page_dated)_
  - “your company is never named publicly, and you get paid on every sale, not just the first” — Troveo, <https://www.troveo.ai/resources/sell-data-to-ai-companies> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c094** The Broadcast News listing describes daily-news-cycle output including anchor reads, packages, live field shots, interviews and raw B-roll.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “On-air and field output produced on a daily news cycle, including anchor reads, reported packages, live field shots” — Troveo, <https://www.troveo.ai/datasets/broadcast-news> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c095** Troveo lists a Broadcast News dataset of 408K+ hours.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **408000 hours** (vendor-stated listing size, lower bound; as at retrieval)
  - “408K+” — Troveo, <https://www.troveo.ai/datasets/broadcast-news> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c096** The Talking Head listing describes people speaking to camera or to an interviewer, framed tightly to isolate face and voice.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “People speaking to camera or across from an interviewer, framed tightly with controlled lighting” — Troveo, <https://www.troveo.ai/datasets/talking-head> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c097** Troveo lists a Talking Head dataset of 449K+ hours.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **449000 hours** (vendor-stated listing size, lower bound; as at retrieval)
  - “449K+” — Troveo, <https://www.troveo.ai/datasets/talking-head> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Inventory size on Troveo's own listing; no independent source. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote '449K+' alone does not show the unit or the listing; the page (title 'Talking Head') reads 'Hours449K+'.
- **c098** The Talking Head listing names avatar and digital human generation among its intended training uses; the page carries no consent, likeness or release statement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Avatar and digital human generation” — Troveo, <https://www.troveo.ai/datasets/talking-head> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c099** The Everyday Tasks POV listing states 12.4K+ hours.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **12400 hours** (vendor-stated listing size, lower bound; as at retrieval)
  - “12.4K+” — Troveo, <https://www.troveo.ai/datasets/everyday-tasks-pov> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c105** Troveo's company data snapshots each profile one operating company's licensable data, systems, trainable workflows and volumes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Company Data Snapshots_
  - “Each snapshot profiles one operating company's licensable data, the systems it runs on, the workflows it can train,” — Troveo, <https://www.troveo.ai/snapshots> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c106** Individual company data snapshot pages are gated behind a shared password.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Company Data Snapshots_
  - “Enter the shared password to view licensor snapshot profiles” — Troveo, <https://www.troveo.ai/snapshots/1739528> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### discovery

- **c043** Troveo says buyers can browse and build video datasets in Troveo Lens or contact Troveo with what they are training toward.  
  _offer · vendor_stated · as of 2026-07-25 (page_dated)_
  - “You can browse and build video datasets in Troveo Lens, or contact us and tell us what your team is training toward.” — Troveo, <https://www.troveo.ai/resources/licensed-video-data-for-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c007** Troveo's homepage asserts that every hour of content was verified for compliance with Illinois BIPA and Texas CUBI biometric privacy laws.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every hour of content was verified for full compliance with Illinois BIPA and Texas CUBI biometric privacy laws” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Homepage fetched 2026-10-01 says 'Every hour of content was verified for full compliance with Illinois BIPA and Texas CUBI biometric privacy laws.' This is an assertion; no audit, regulator or third party confirming it was found. WebSearch not available in this run (no search available); Illinois/Texas AG sites not searchable for it.
  - verifier (scope): **scope_ok** — Quote matches the homepage. It is an assertion only; no evidence of the verification is offered.
- **c050** Troveo says every asset carries its own rights documentation and is delivered in training-ready formats.  
  _offer · vendor_stated · as of 2026-08-16 (page_dated)_
  - “every asset carrying its own rights documentation and delivered in training-ready formats” — Troveo, <https://www.troveo.ai/resources/troveo-vs-protege> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c069** Troveo says every marketplace asset carries a documented chain of rights.  
  _terms · vendor_stated · as of 2026-07-22 (page_dated)_
  - “Every asset in the marketplace carries a documented chain of rights” — Troveo, <https://www.troveo.ai/resources/rights-cleared-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c071** Troveo says the licensing agreement behind each asset can be produced per asset if anyone asks, rather than being delivered by default.  
  _terms · vendor_stated · as of 2026-07-22 (page_dated)_
  - “the licensing agreement exists as a document that can be produced per asset if anyone ever asks” — Troveo, <https://www.troveo.ai/resources/rights-cleared-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c113** Troveo invites buyers to ask for samples against their brief.  
  _offer · vendor_stated · as of 2026-07-26 (page_dated)_
  - “Ask for samples against your brief.” — Troveo, <https://www.troveo.ai/resources/buy-ai-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c117** Troveo says gameplay footage is delivered cleaned and normalised, with provenance traceable to its owner.  
  _offer · vendor_stated · as of 2026-07-17 (page_dated)_
  - “Footage is cleaned, normalized, and delivered in the format a lab's pipeline expects, with provenance traceable to its owner” — Troveo, <https://www.troveo.ai/resources/gameplay-data-for-world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c012** The Everyday Tasks POV listing's call to action is 'Request full dataset'; no price, playable sample, licence terms or consent statement is shown.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request full dataset” — Troveo, <https://www.troveo.ai/datasets/everyday-tasks-pov> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing UI. Fetched https://www.troveo.ai/datasets/everyday-tasks-pov on 2026-10-01: CTA 'Request full dataset', no price, no playable sample, no licence terms, no consent statement; page shows 'Hours12.4K+'.
  - verifier (scope): **scope_ok** — The CTA quote is right; the absences cannot be quoted and were confirmed by a fetch on 2026-10-01 (page shows 'Hours12.4K+', static thumbnails only).
- **c027** Troveo says licensing deals can take 4-5 months from delivery to payout.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5 months from delivery to owner payout (upper end of 4-5)** (vendor-stated typical upper range; varies by deal; per deal)
  - “It is not uncommon for deals to take up to 4-5 months from delivery to payout.” — Troveo, <https://support.troveo.com/articles/7834088496-how-long-do-troveo-licensing-deals-take> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Troveo's own process timeline; no independent source would carry it.
  - verifier (scope): **scope_ok** — Help-centre article addressed to content owners; the 4-5 months is 'not uncommon', an upper range rather than a norm.
- **c028** Troveo negotiates deals with AI buyers, and negotiation can take several weeks, especially for larger or customised deals.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Negotiation can take several weeks, especially for larger or customized deals.” — Troveo, <https://support.troveo.com/articles/7834088496-how-long-do-troveo-licensing-deals-take> · docs · retrieved 2026-10-01 · quote check: exact
- **c029** After delivery, the buyer reviews the content and decides which clips it will license.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “After delivery, the buyer reviews the content and finalizes which clips they wish to license.” — Troveo, <https://support.troveo.com/articles/7834088496-how-long-do-troveo-licensing-deals-take> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** Troveo says labs sign one agreement, browse and build datasets in Troveo Lens, and receive cleaned footage.  
  _architecture · vendor_stated · as of 2026-07-25 (page_dated)_
  - “Labs sign one agreement, browse and build datasets in Troveo Lens, and receive footage cleaned,” — Troveo, <https://www.troveo.ai/resources/licensed-video-data-for-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c110** Troveo's contact page routes visitors to two paths: 'I need training data' or 'I want to license my data'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Whether you're training a model or want to monetize your data, we'll get you to the right team.” — Troveo, <https://www.troveo.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c114** Troveo says buyers deal with one company and sign one contract.  
  _terms · vendor_stated · as of 2026-07-26 (page_dated)_
  - “you deal with one company and sign one contract.” — Troveo, <https://www.troveo.ai/resources/buy-ai-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c041** Troveo's July 2026 video-licensing article says there is no public price sheet and deals are negotiated on volume, scarcity, exclusivity and rights scope.  
  _terms · vendor_stated · as of 2026-07-25 (page_dated)_
  - “There is no public price sheet; deals are negotiated on volume, scarcity, exclusivity, and rights scope.” — Troveo, <https://www.troveo.ai/resources/licensed-video-data-for-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c074** Troveo says business-data owners receive 60 percent of the licence fees Troveo collects from buyers for their data, counted before costs.  
  _number · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_ · **60 percent of licence fees collected from buyers** (paid to the business-data owner; gross (counted before costs); Troveo retains the remaining 40 percent; per sale)
  - “You receive 60 percent of the license fees Troveo collects from buyers for your data, and the fees are counted before any” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Term of Troveo's own business data licence agreement; WebSearch not available in this run (no search available); no partner or licensor restating it was reachable.
  - verifier (scope): **quote_incomplete** — The quote stops at 'counted before any'; the words that show 'before costs' are 'the fees are counted before any costs are taken out'. Also, the claim's value.basis says 'Troveo retains the remaining 40 percent', which the page does not say (the page states only the owner's 60 percent).
- **c118** Troveo describes itself as a data licensing marketplace operating a revenue-share model.  
  _terms · vendor_stated · as of 2026-09-29 (page_dated)_
  - “Troveo is a data licensing marketplace, which is the revenue-share model above.” — Troveo, <https://www.troveo.ai/resources/data-monetization-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Self-description. Independent sources call Troveo a content aggregator (amicus brief, 3d Cir. 2025) or 'a clearinghouse' (Techstrong.ai 2026-05-01); none states a revenue-share model. TechHQ (2025-01-15) wrote 'Troveo's turnover and the percentage it takes are unknown.' Hollywood Reporter launch story was paywalled (HTTP 402).
  - verifier (scope): **scope_ok** — Quote says Troveo is a data licensing marketplace 'which is the revenue-share model above'; page dated 2026-09-29.
- **c119** Troveo tells data owners it takes no fees and no deductions from their payouts.  
  _terms · vendor_stated · as of 2026-09-29 (page_dated)_
  - “we take no fees and no deductions from your payouts.” — Troveo, <https://www.troveo.ai/resources/data-monetization-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c051** Troveo says its marketplace is built around licensing the same data to multiple AI developers over time.  
  _terms · vendor_stated · as of 2026-09-10 (page_dated)_
  - “Troveo's marketplace is built around licensing the same data to multiple AI developers over time” — Troveo, <https://www.troveo.ai/resources/exclusive-vs-non-exclusive-data-license> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c053** Troveo says that where exclusivity is part of an agreement it is time-limited, must be earned, and has clear exit terms.  
  _terms · vendor_stated · as of 2026-09-10 (page_dated)_
  - “Where exclusivity is part of an agreement it's time-limited, has to be earned, and comes with clear exit terms.” — Troveo, <https://www.troveo.ai/resources/exclusive-vs-non-exclusive-data-license> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** Troveo says business data owners keep ownership while Troveo licenses it on their behalf under terms they sign off on.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_
  - “You do. Troveo licenses it on your behalf under terms that you sign off on; ownership never transfers.” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c061** Troveo's business-data owners agree to 'simple, standard terms' covering their licence and earnings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_
  - “Simple, standard terms covering your license and your earnings.” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c073** Under Troveo's business data licence agreement, as Troveo describes it, the owner licenses defined data to Troveo and keeps ownership.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “You license defined business data to Troveo. You keep ownership.” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c075** Troveo says the business data licence has a three-year initial term renewing in one-year periods unless either side gives 30 days' notice.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “The initial term is three years, renewing in one-year periods unless either side gives notice thirty days before a period” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c079** Troveo says the rights owners grant it are sublicensable through multiple tiers.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “sublicensable through multiple tiers” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c082** Troveo says owners indemnify Troveo and the buyers for losses from a breach of the owner's promises.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “You cover Troveo and the buyers for losses arising from a breach of those promises” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c083** Troveo says owners promise the data does not infringe anyone's rights and is not encumbered by a conflicting grant.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “You promise the data does not infringe anyone's rights and is not encumbered by a conflicting grant” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c084** Troveo says owners warrant that they own the data or have secured every consent needed.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “that you own it or have secured every consent needed” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c085** Troveo says a Rider can add a matching indemnity from Troveo to the owner and a mutual liability cap.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “The Rider can add a matching indemnity from Troveo to you, for Troveo's own breaches or misconduct” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c086** Troveo says it prepares the data and licenses it onward to AI developers under its own agreements with them.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “Troveo prepares the data and licenses it onward to AI developers under its own agreements with them.” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The contractual structure (Troveo licenses onward under its own agreements) exists only in Troveo's own descriptions. Partial corroboration of the role, not of the contract: a Nov 2025 amicus brief (3d Cir.) calls Troveo AI an aggregator 'which create portfolios of audiovisual content for licensing by AI companies', and Techstrong.ai says Troveo 'works with content providers to clean data sets before they are made available to builders of AI models'.
  - verifier (scope): **scope_ok** — Quote is the article's sentence (Troveo resource dated 2026-09-04) and is scoped to the business data agreement. Note the profile's own conflict with the 'on your behalf' wording (c058).
- **c087** Troveo says derivative works belong to whoever made them and the owner has no ownership interest in them.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “Derivative works belong to whoever made them, and you have no ownership interest” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c088** Troveo says under a non-exclusive licence the owner remains free to license the same data elsewhere.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “Under a non-exclusive license you remain free to license the same data elsewhere” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c112** Troveo and the buyer negotiate usage rights, licence scope, deliverables and timelines per deal.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo and the buyer discuss terms such as usage rights, license scope, deliverables, and timelines.” — Troveo, <https://support.troveo.com/articles/7834088496-how-long-do-troveo-licensing-deals-take> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Troveo's own description of its deal process; no independent source would carry it.
  - verifier (scope): **scope_ok** — Page says Troveo and the buyer 'discuss terms such as usage rights, license scope, deliverables, and timelines'; 'negotiate per deal' is a fair reading. Owner-facing help article.

### custody

- **c039** Owners can upload content with the AWS CLI into a Troveo-provided S3 bucket.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “s3://troveo-your-bucket-name/folder_name_here/ --recursive” — Troveo, <https://support.troveo.com/articles/8015095099-submitting-content-via-AWS-CLI> · docs · retrieved 2026-10-01 · quote check: exact
- **c101** Troveo says world-model data is delivered in the buyer's format with a schema manifest, provenance and a QA report.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Delivered in your format with a schema manifest, provenance and QA report.” — Troveo, <https://www.troveo.ai/world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c111** Troveo's help centre says that once terms are agreed, its team prepares and delivers the relevant content to the buyer.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Once terms are agreed upon, our team prepares and delivers the relevant content to the buyer.” — Troveo, <https://support.troveo.com/articles/7834088496-how-long-do-troveo-licensing-deals-take> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Help-centre process statement; exists only on Troveo's support site. Techstrong.ai (2026-05-01) independently relays that Troveo cleans data sets before they are made available, which is consistent.
  - verifier (scope): **scope_ok** — Quote matches. The help article is addressed to content owners; 'prepares and delivers' does not say where the bytes land, so it supports provider/operator delivery but not a specific custody mode on its own.
- **c115** Troveo says it delivers data cleaned, normalised and in the formats the buyer's pipeline uses.  
  _offer · vendor_stated · as of 2026-07-26 (page_dated)_
  - “We deliver the data cleaned, normalized and in the formats your pipeline uses” — Troveo, <https://www.troveo.ai/resources/buy-ai-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c019** Troveo says its pipeline clears, processes and annotates every clip for AI training.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our pipeline clears, processes, and annotates every clip for AI training.” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** Owners need not organise footage before submitting it; Troveo's system filters out duplicates and non-video files.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo's system automatically filters out duplicates and non-video files.” — Troveo, <https://support.troveo.com/articles/8650348007-do-i-need-to-organize-my-footage-before-submitting-it> · docs · retrieved 2026-10-01 · quote check: exact
- **c032** Troveo says artificially slowing footage to increase runtime will not increase licensable minutes.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “artificially slowing footage to increase runtime will not increase licensable minutes” — Troveo, <https://support.troveo.com/articles/5318194645-i-have-some-technical-questions-about-raw-footage-file-formats-transcoding-color-grading-fps-bitrate-etc> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** Troveo's owner annotation template asks for content type, title, year, country, mature-content flag and genre, and has no field for people, releases or consent.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Annotations are brief, structured descriptors that enrich your videos with context” — Troveo, <https://support.troveo.com/articles/9851996087-annotations-sheet-guide> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** Troveo says names, contact details, credentials and client identities are scrubbed from business data under one documented standard.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_
  - “People's names, contact details, credentials, and client identities are scrubbed under one documented standard” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c065** Troveo says programmatic classification plus human validation ensure taxonomy consistency and accuracy.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Programmatic classification combined with human validation ensure taxonomy consistency and measurable accuracy.” — Troveo, <https://www.troveo.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c089** Troveo says personal information is removed, redacted or de-identified before delivery of business data.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “Personal information is removed, redacted, or de-identified before delivery” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c092** Troveo says it removes names and personal details to a documented standard before any buyer sees anything.  
  _terms · vendor_stated · as of 2026-08-29 (page_dated)_
  - “We remove names and personal details to a documented standard before any buyer sees anything.” — Troveo, <https://www.troveo.ai/resources/sell-data-to-ai-companies> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c013** Troveo tells content owners that every use of their content earns them a royalty.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every use earns you a royalty.” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Content-owners page fetched 2026-10-01 says 'Every use earns you a royalty.' Own pay term; no independent source. TechHQ 2025 says the percentage Troveo takes is unknown.
  - verifier (scope): **scope_ok** — Quote matches the content-owners page, which addresses video creators; no royalty rate is stated.
- **c017** Troveo's content-owner page says it has paid $50M+ to creators globally.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **50000000 USD paid to content owners** (vendor-stated cumulative payouts to creators/rights holders, lower bound; gross or net not stated; cumulative to retrieval)
  - “$50M+$0M+ paid To creators globally” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (blind): **disputed** — The content-owners page (fetched 2026-10-01) does say '$50M+ paid to creators globally', so the statement of what the page says is accurate, but the only non-Troveo source (Techstrong, May 2026, relaying Troveo) gives more than $20 million, and Troveo's own other statements (per claims c044, c120) say more than $20 million as late as September 2026. $50M+ has no independent support and conflicts with the vendor's own figures; it should be flagged, not relied on.
    - “paid out more than $20 million to thousands of content owners” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The page does say '$50M+ paid to creators globally' (the '$0M+' in the quote is counter-animation text). The figure conflicts with Troveo's own $20M+ statements dated 2026-07-25, 2026-09-10 and 2026-09-29 and with Techstrong's relayed $20M+ (May 2026); the profile records the conflict, correctly as unresolved.
- **c020** Content owners get a personal dashboard showing how their content is used and when they will be paid.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Track everything in your personal dashboard” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c023** Troveo's help centre says owners are paid only after their content has been licensed, the client invoiced and payment received.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Payments occur only after your content has been licensed, the client has been invoiced, and payment has been received.” — Troveo, <https://support.troveo.com/articles/6852961307-how-do-payouts-work-on-troveo> · docs · retrieved 2026-10-01 · quote check: exact
- **c024** Troveo's help centre says there is no fixed payout schedule for content owners.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “There is no fixed payout schedule.” — Troveo, <https://support.troveo.com/articles/6852961307-how-do-payouts-work-on-troveo> · docs · retrieved 2026-10-01 · quote check: exact
- **c025** Troveo's payouts article says payments to owners are sent through Tipalti.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “all payments will be sent directly through Tipalti” — Troveo, <https://support.troveo.com/articles/6852961307-how-do-payouts-work-on-troveo> · docs · retrieved 2026-10-01 · quote check: exact
- **c026** Another Troveo help article names Ramp as its payment platform requiring W-9 forms from US payees.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Ramp, our payment platform, requires a W-9 form from U.S. individuals and entities receiving payments” — Troveo, <https://support.troveo.com/articles/1450601243-understanding-your-w-9-for-payments-via-ramp> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** In July 2026 Troveo said it had paid over $20 million through to rights holders.  
  _number · vendor_stated · as of 2026-07-25 (page_dated)_ · **20000000 USD paid to rights holders** (vendor-stated cumulative payouts, lower bound; cumulative to 2026-07-25)
  - “with over $20 million paid through to rights holders so far” — Troveo, <https://www.troveo.ai/resources/licensed-video-data-for-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Same figure relayed by Techstrong in May 2026; the July 2026 statement itself not independently found. WebSearch not available in this run (no search available); 
    - “paid out more than $20 million to thousands of content owners” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article dated July 25, 2026.
- **c052** Troveo says owners get paid a share each time their data licenses to an AI developer.  
  _terms · vendor_stated · as of 2026-09-10 (page_dated)_
  - “get paid a share each time the data licenses to an AI developer” — Troveo, <https://www.troveo.ai/resources/exclusive-vs-non-exclusive-data-license> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Troveo says re-licensing the same catalogue several times over an agreement's life is what paid its rights holders more than $20 million.  
  _outcome · vendor_stated · as of 2026-09-10 (page_dated)_
  - “The same catalog, licensed several times over the life of the agreement, is what has paid our rights holders more than 20” — Troveo, <https://www.troveo.ai/resources/exclusive-vs-non-exclusive-data-license> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Causal outcome claim by Troveo; the >$20M total is relayed by Techstrong (May 2026) but nothing independent attributes it to re-licensing. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote is cut at 'more than 20'; the sentence (page dated 2026-09-10) continues 'million dollars across video, audio, gaming, robotics, and now business data'. Quote the words 'is what has paid our rights holders more than 20 million dollars'.
- **c056** Troveo tells business-data owners it pays on every sale, not just the first.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_
  - “paying you on every sale, not just the first” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Troveo's business-data page says it has paid $20M+ to licensors.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **20000000 USD paid to licensors** (vendor-stated cumulative, lower bound; cumulative to retrieval)
  - “$20M+ Paid to Licensors” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c068** Techstrong.ai reported in May 2026 that Troveo had paid out more than $20 million to thousands of content owners.  
  _number · press_relayed · as of 2026-05-01 (publication)_ · **20000000 USD paid to content owners** (vendor figure relayed by press, lower bound; cumulative to 2026-05-01)
  - “it has paid out more than $20 million to thousands of content owners” — Techstrong.ai, <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Article dated May 1, 2026 confirms the report; the figure itself is Troveo's, relayed. Part 2 showed this is the profile's own source URL, so not counted as independent.
    - “paid out more than $20 million to thousands of content owners” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the 2026-05-01 article; press relaying a vendor figure.
- **c080** Troveo says owner payment follows within 45 days of Troveo receiving the buyer's fee.  
  _number · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_ · **45 days after Troveo receives buyer's fee** (maximum payment lag to owner under the business data agreement; per payment)
  - “Payment follows within 45 days of Troveo receiving the buyer's fee” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Payment term in Troveo's own agreement.
  - verifier (scope): **scope_ok** — Business data agreement article dated 2026-09-04.
- **c081** Troveo says there is a minimum payout threshold of 500 dollars for US licensors.  
  _number · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo, US_ · **500 USD minimum payout** (threshold before a US licensor is paid; per payout)
  - “with a minimum payout threshold of 500 dollars for US licensors” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Payout threshold in Troveo's own terms.
  - verifier (scope): **scope_ok** — Right for US; the same sentence continues 'and 2,500 dollars outside the US', which the profile omits (added as missed troveo-v003).
- **c090** Troveo says owners have an annual audit right over the calculation of their share.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “You have an annual audit right over the calculation of your share” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c120** In late September 2026 Troveo said it had paid rights holders more than $20 million across video, audio, gaming, robotics and business data.  
  _number · vendor_stated · as of 2026-09-29 (page_dated)_ · **20000000 USD paid to rights holders** (vendor-stated cumulative payouts across all modalities, lower bound; cumulative to 2026-09-29)
  - “we've paid rights holders more than 20 million dollars across video, audio, gaming, robotics and business data” — Troveo, <https://www.troveo.ai/resources/data-monetization-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Only a relayed version (May 2026) of the same >$20M figure was found; the September 2026 statement itself and the breakdown across video, audio, gaming, robotics and business data were not independently found. WebSearch not available in this run (no search available); 
    - “paid out more than $20 million to thousands of content owners” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the 2026-09-29 article, including the modality list.

### post_sale

- **c076** Troveo says the owner licence is irrevocable during its term and buyer agreements Troveo signs can run past the end of the owner's agreement.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “agreements Troveo signs with buyers can run past the end of your agreement, and ending your agreement does not unwind them” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c077** Troveo says the owner's removal right only keeps named files or categories out of future deals, prospectively.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “The Rider's removal right lets you name files, records, or categories to keep out of any future deal, prospectively” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c078** Troveo says owners cannot claw data back from a model that already learned from it.  
  _terms · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo_
  - “You cannot claw data back from a model that already learned from it” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c008** Troveo pitches sourcing and curation of training-ready datasets for buyers, beyond its existing library.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Source, curate, and deploy training-ready datasets with zero prep friction.” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** Before each deal Troveo receives detailed specifications from the client.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Before each deal, Troveo receives detailed specifications from the client.” — Troveo, <https://support.troveo.com/articles/1950228339-what-are-submitted-hours-in-ai-deals> · docs · retrieved 2026-10-01 · quote check: exact
- **c035** Troveo reviews ingested content to determine which hours match a client's specifications.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “determines which hours match the client's specifications” — Troveo, <https://support.troveo.com/articles/1950228339-what-are-submitted-hours-in-ai-deals> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** Troveo says buyers can browse and assemble datasets self-serve in Lens, or work with its team on custom sourcing.  
  _offer · vendor_stated · as of 2026-08-16 (page_dated)_
  - “Buyers can browse and assemble datasets self-serve in Lens” — Troveo, <https://www.troveo.ai/resources/troveo-vs-protege> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c049** Troveo offers custom sourcing work against a buyer's model roadmap.  
  _offer · vendor_stated · as of 2026-08-16 (page_dated)_
  - “or work with the team directly on custom sourcing against a model roadmap” — Troveo, <https://www.troveo.ai/resources/troveo-vs-protege> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c063** Troveo describes a custom service in which it produces new content to a buyer's technical and content specifications when off-the-shelf data is not enough.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “When off-the-shelf datasets are not enough, we produce new content to your exact technical and content specifications.” — Troveo, <https://www.troveo.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c066** Troveo's custom sourcing page states a typical response time of under 24 hours.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Typical response time: under 24 hours.” — Troveo, <https://www.troveo.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c103** For world-model buyers Troveo maps the buyer's training objective and gaps to data families and stages.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You bring the training objective and the gaps. We map them to data families and stages.” — Troveo, <https://www.troveo.ai/world-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c067** On 2026-05-01 Techstrong.ai reported that Troveo was adding five content types beyond video: audio, text, agentic workflows, gameplay data and data collected from robots.  
  _event · press_relayed · as of 2026-05-01 (publication)_
  - “audio, text, agentic workflows, gameplay data and data collected from robots” — Techstrong.ai, <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The article itself (found via techstrong.ai/post-sitemap3.xml, dated May 1, 2026, by Mike Vizard) says Troveo 'now offers' these types in addition to video; it relays a Troveo announcement. Part 2 showed this is the profile's own source URL, so it is not counted as independent. Audio expansion is independently corroborated by the Round Hill v. Suno complaint (2026-08-17), which lists Troveo among companies that 'license and pay for use of copyrighted music'.
    - “audio, text, agentic workflows, gameplay data and data collected from robots” — Techstrong.ai (Mike Vizard, 2026-05-01), <https://techstrong.ai/features/troveo-expands-types-of-licensed-content-available-for-training-ai-models/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article (Techstrong.ai, Mike Vizard, 2026-05-01). The blind step found only this same URL, so it is not independent; the article relays a Troveo announcement.

### demand

- **c021** Troveo's content-owner page says 7M+ hours of video content have been licensed.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **7000000 hours of video licensed** (vendor-stated; unclear whether hours licensed to buyers or hours signed from owners; cumulative to retrieval)
  - “7M+0M+ hours Video content licensed” — Troveo, <https://www.troveo.ai/content-owners> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (blind): **unverifiable** — Content-owners page (fetched 2026-10-01) says '7M+ hours video content licensed'. Techstrong (May 2026) relays 'eight million hours of licensed video', a different figure from the same vendor; no independent count. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok** — Quote matches (with counter text '0M+'). The value.basis rightly flags that 'licensed' is ambiguous; 7M+ also differs from the 8M+ used elsewhere.
- **c055** Troveo says business datasets average four sales per dataset.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: business data licensing_ · **4 sales per dataset** (vendor-stated average for business data; method not stated; average)
  - “4× AVG Sales Per Dataset” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Sales-per-dataset is a vendor traction figure; no independent source found. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok** — Business-data page; scope is correctly business data.
- **c059** Troveo's business-data page says it has 40+ active buyers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **40 active buyers** (vendor-stated, lower bound; scope (business data or whole marketplace) not stated; as at retrieval)
  - “40+ Active Buyers” — Troveo, <https://www.troveo.ai/business-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Buyer count is a vendor traction figure; no independent source found. WebSearch not available in this run (no search available); 
  - verifier (scope): **scope_ok** — Business-data page; the value.basis correctly flags that it is unclear whether 40+ buyers covers business data only or the whole marketplace.
- **c107** Troveo says it delivered 1M+ hours of structured footage from its licensor base to a 'Mag 7' global enterprise client.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo provided 1M+ hours of structured, de-risked footage from our global licensor base” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised 'Mag 7' case study; client unnamed, so no route to a partner or customer source. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote shows the 1M+ hours but not the client; the case-study label 'Mag 7 Global Enterprise' is outside the quoted words.
- **c108** Troveo says it delivered 500K+ video clips with custom metadata to a 'Mag 7' AI company in three weeks.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo delivered training-ready video with custom metadata in three weeks.” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised 'Mag 7' case study; client unnamed. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote shows neither the 500K+ clips nor the client; the block reads 'Mag 7 AI Company' and '500K+ video clips delivered'.
- **c109** Troveo says it isolated specific emotional expressions from long-form content and delivered 100K clips with emotion labels to an enterprise video platform.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo identified and isolated specific emotional expressions from long-form content” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised enterprise video platform case study; client unnamed. WebSearch not available in this run (no search available); 
  - verifier (scope): **quote_incomplete** — Quote shows neither the 100K clips nor the emotion labels; the block reads '100K clips of targeted content' and '...delivering clip-based packages with precise emotion labeling', client label 'Enterprise Video Platform'.

### regulation

- **c124** Troveo's privacy policy (last updated 1 January 2026) names the operating entity as Troveo AI, Inc.  
  _terms · legal_text · as of 2026-01-01 (page_dated)_
  - “Troveo AI, Inc.” — Troveo, <https://www.troveo.ai/legal/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** A copyright complaint filed on 2026-08-17 in N.D. Cal. (Round Hill Music v. Suno) names Troveo among companies that seek permission from and pay rights holders to create AI training datasets.  
  _event · court · as of 2026-08-17 (publication)_
  - “Such companies include ElevenLabs, Musical AI, Symphonic, Soundverse, GEMA (through PLAI), GCX/Rightsify, and Troveo” — Complaint, Round Hill Music LP v. Suno, Inc., N.D. Cal. No. 5:26-cv-08507, via CourtListener RECAP, <https://storage.courtlistener.com/recap/gov.uscourts.cand.476359/gov.uscourts.cand.476359.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **v002** An amicus brief filed in the Third Circuit on 2025-11-21 (Thomson Reuters v. Ross) describes Troveo AI as a content aggregator that creates portfolios of audiovisual content for licensing by AI companies.  
  _offer · court · as of 2025-11-21 (publication)_
  - “Calliope Networks and Troveo AI, which create portfolios of audiovisual content for licensing by AI companies” — Phoenix Center amicus brief, 3d Cir. No. 25-2153, Doc. 90, via CourtListener RECAP, <https://storage.courtlistener.com/recap/gov.uscourts.ca3.125346/gov.uscourts.ca3.125346.90.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **v003** Troveo says the minimum payout threshold under its business data agreement is 2,500 dollars for licensors outside the US.  
  _number · vendor_stated · as of 2026-09-04 (page_dated) · scope: business data licence agreement (owner side), as described by Troveo, outside US_ · **2500 USD minimum payout** (threshold before a non-US licensor is paid; per payout)
  - “500 dollars for US licensors and 2,500 dollars outside the US” — Troveo, <https://www.troveo.ai/resources/business-data-license-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v004** Troveo says AI buyers rarely require exclusivity.  
  _terms · vendor_stated · as of 2026-09-10 (page_dated)_
  - “Do AI buyers require exclusivity? Rarely.” — Troveo, <https://www.troveo.ai/resources/exclusive-vs-non-exclusive-data-license> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v005** Troveo's homepage, citing The Hollywood Reporter, says Troveo launched with 4.5 million dollars in seed funding.  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Troveo launches with $4.5 million in seed funding” — Troveo, <https://www.troveo.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v006** TechHQ reported in January 2025 that Troveo had distributed over 5 million dollars in licensing fees.  
  _number · press_relayed · as of 2025-01-15 (publication)_ · **5000000 USD licensing fees distributed** (cumulative payouts to content owners, lower bound; gross or net not stated; cumulative to 2025-01)
  - “Troveo AI alone distributing over $5 million in licensing fees” — TechHQ (Dashveenjit Kaur), <https://techhq.com/2025/01/content-creators-strike-gold-in-ai-content-licensing-boom/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.buyer_vetting` — not_published; tried <https://www.troveo.ai/contact>, <https://www.troveo.ai/resources/buy-ai-training-data>, <https://www.troveo.ai/datasets/everyday-tasks-pov>
- `matrix.versioning` — not_published; tried <https://www.troveo.ai/datasets>, <https://www.troveo.ai/datasets/everyday-tasks-pov>, <https://www.troveo.ai/datasets/broadcast-news>, <https://support.troveo.com/>
- `other.buyer_licence_text` — not_found; tried <https://www.troveo.ai/legal/terms-of-service>, <https://www.troveo.ai/legal/terms>, <https://www.troveo.ai/sitemap.xml>, <https://app.troveo.com/users/sign-in>
- `other.video_owner_agreement_and_royalty_rate` — not_published; tried <https://www.troveo.ai/content-owners>, <https://support.troveo.com/articles/6852961307-how-do-payouts-work-on-troveo>, <https://www.troveo.ai/resources/ai-data-licensing-deals>, <https://www.troveo.ai/resources/data-monetization-models>
- `other.troveo_lens` — js_empty; tried <https://lens.troveo.ai/>
- `other.snapshot_detail` — gated; tried <https://www.troveo.ai/snapshots/1739528>
- `other.funding_and_filings` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Troveo%22>, <https://www.sec.gov/cgi-bin/browse-edgar?company=troveo&type=&dateb=&owner=include&count=40&action=getcompany>, <https://www.troveo.ai/resources>
- `other.independent_press` — not_found; tried <https://techcrunch.com/tag/troveo/>, <https://techstrong.ai/?s=troveo>
- `other.custom_capture_pay_and_relisting` — not_published; tried <https://www.troveo.ai/sourcing>, <https://www.troveo.ai/resources/robotics-training-data>, <https://www.troveo.ai/world-models>
- `other.depicted_person_consent_records` — not_published; tried <https://support.troveo.com/articles/9851996087-annotations-sheet-guide>, <https://www.troveo.ai/datasets/talking-head>, <https://www.troveo.ai/resources/rights-cleared-training-data>, <https://www.troveo.ai/legal/privacy-policy>

## Conflicts

- c017, c120: The undated content-owner page says $50M+ paid to creators; Troveo's own articles dated up to 2026-09-29, its business-data page and the contact page say $20M+. Both are vendor figures; the $20M figure is repeated more widely and more recently dated. Treat total payouts as between $20M and $50M+, vendor-stated. (unresolved)
- c025, c026: Two live help articles name different payment platforms (Tipalti and Ramp); neither is dated, so which is current is unknown. (unresolved)
- c018, c010: Owners are told 'No public listings', yet a public dataset library exists. Likely both hold: aggregated dataset families are public while individual owners and their content are not; recorded because the wording conflicts. (unresolved)
- c048, c041: Troveo says buyers can assemble datasets 'self-serve in Lens', but no price or checkout is published and deals are negotiated; Lens could not be inspected, so transaction_mode is set to contact_sales. (unresolved)
- c058, c086: Troveo says it licenses business data 'on your behalf' but also that it licenses onward 'under its own agreements' with a sublicensable grant; the latter describes the contract structure and sets operator_role to reseller_licensor. (unresolved)

## Leads, not cited

- <https://lens.troveo.ai/> — Troveo Lens, the buyer catalogue tool; renders empty without JavaScript/login.
- <https://app.troveo.com/users/sign-in> — Owner/buyer portal; login only.
- <https://jobs.ashbyhq.com/troveo> — Job listings may describe internal pipeline and team; not fetched.
- <https://www.linkedin.com/company/troveo-ai/> — Company page; may carry funding or headcount news. Not fetched.
- <https://www.troveo.ai/msp-data-assessment> — MSP business-data programme; not fetched.
- <https://www.troveo.ai/resources/troveo-vs-protege> — Vendor comparison with Protege; useful for the Protege profile.
