# truelabel

vision_physical_ai · deep · status: **active** · also known as truelabel FZCO, truelabel.ai

> Rendered from `ledger/truelabel.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “off-the-shelf (OTS) datasets / OTS sourcing requests” and its bespoke side “net-new sourcing requests (NET_NEW; 'net-new exclusive capture')”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | mixed | c031, c036, c061, c050 | Terms cast truelabel as a venue not party to the buyer-supplier contract, but collector output is truelabel-owned work for hire, and licensed data runs under truelabel's own MSA and Order. |
| economics_model | mixed | c043, c057, c061, c019 | Terms refer to commissions on marketplace transactions (rates unpublished); workforce data is bought from collectors at a fixed fee, owned by truelabel and sold at a quoted price. |
| who_pays_fee | unknown |  | Fees and commissions are disclosed only in-product or in transaction terms. |
| supply_models | own_collection, third_party_providers | c004, c061, c002, c022, c111 | Own collector workforce (work for hire) plus 100+ vendors and buyer-introduced partners. The public /datasets directory links to public datasets but does not sell them, so public_or_scraped is not listed. No evidence that data collected for one buyer is resold to others. |
| custody_model | copy_to_buyer | c005, c109 | Delivered into the buyer's S3, GCS or Azure. |
| transaction_mode | contact_sales | c018, c019, c129, c095 |  |
| public_prices | some | c121, c122, c093 | Only indicative ranges in a blog comparison and an estimator; no listing has a price and the FAQ says there is no public rate card. |
| licence_model | negotiated | c014, c037, c015 |  |
| exclusivity_offered | yes | c112, c137, c136 |  |
| public_listing | unknown |  | The public /datasets directory lists third-party public datasets only; no OTS offer for sale was visible anonymously, and whether sale listings sit behind login could not be checked. |
| buyer_vetting | case_by_case | c042 | Terms say truelabel 'may require' identity, organisation or sanctions checks before some actions. |
| sample_mechanics | sample_on_request | c009, c007, c108 | Sample packets are produced against the buyer's spec and reviewed in a dashboard before scale-up. |
| versioning | unknown |  | Nothing published on dataset versions, updates or withdrawal. |
| human_subject_consent_docs | provided_to_buyer | c016, c113, c046 | Vendor pages say consent artifacts ship with delivery; the Terms only oblige suppliers to produce records on buyer due diligence. |
| contributor_pay_model | one_off | c057, c064, c097, c098 | Fixed fee per accepted job, quoted per approved hour; no royalty on resale. |
| catalogue_plus_custom | both | c110, c111, c004 |  |
| erasure_after_sale | takedown_only | c049, c048, c119, c073 | truelabel can pull files and listings; rights under completed transactions survive and no buyer deletion duty is stated. |
| quality_evidence | both | c060, c010, c045, c033 |  |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | truelabel names frontier model labs, embodied-AI startups, robotics OEMs and well-funded academic groups as buyers; it prices by accepted hour or per episode within programmes of USD 25k-200k (vendor-stated). Why buyers pick OTS over custom is not stated. | c020, c121, c122, c093 |
| Q2 | partial | Suppliers apply, are vetted and receive buyer specs routed by truelabel; buyers can also bring their own partners in. No page states what a supplier gains from listing versus selling direct. | c077, c009, c022, c076 |
| Q3 | sourced | Inventory comes from off-the-shelf vendor catalogues, 100+ vendors and truelabel's own collector workforce. Vendors keep ownership and grant truelabel a non-exclusive sublicensable licence; collector output is truelabel-owned work for hire. | c004, c036, c039, c061, c063 |
| Q4 | partial | Net-new collection is typically exclusive to the buyer by default, while OTS is non-exclusive unless exclusivity is paid for; collector work product is owned by truelabel and licensable onward. No after-the-fact term change or dispute was found. | c112, c137, c061, c063 |
| Q5 | sourced | The Terms make truelabel a venue not party to the buyer-supplier contract, yet data licences run under truelabel's MSA and Order. Suppliers and collectors warrant rights and consents and indemnify truelabel; truelabel does not validate them. | c031, c050, c051, c033 |
| Q6 | sourced | Data is copied into the buyer's own S3, GCS or Azure in formats such as RLDS, LeRobot or MCAP. | c005, c023, c116 |
| Q7 | sourced | Collectors must get written, documented consent and release from anyone depicted and from owners of private locations that are a subject of the capture, covering AI training and downstream licensees, kept six to ten years. Collectors assign their own rights to truelabel with no further compensation. | c065, c066, c067, c068, c069, c064 |
| Q8 | partial | The licence is set per request or order; default buyer bans include reselling raw data and re-identification. There is no published audit right over buyers, no fingerprinting, and no buyer deletion duty. | c037, c047, c048, c015 |
| Q9 | sourced | Deals close through a request form, spec, supplier matching, sample approval and a bespoke quote, not self-serve checkout. The Terms refer to commissions but publish no rate. | c018, c019, c109, c043 |
| Q10 | partial | The objects are a request or spec, a supplier bid, listing or order, sample packets and a delivery with per-sample metadata including consent and licence ids. Nothing is said about versions or what past buyers get on withdrawal. | c035, c034, c106, c083 |
| Q11 | sourced | Buyers see sample packets of 10-25 accepted samples with QA evidence, rights and metadata, and approve or reject them in a dashboard. truelabel vets partners against a quality bar and QA-checks collector footage, but disclaims validating rights. | c010, c108, c012, c100, c033 |
| Q12 | sourced | One request flow covers both: a request is typed OTS (existing supplier datasets) or NET_NEW (exclusive capture); the public /datasets directory feeds custom request specs. | c102, c110, c111, c027 |

## Narrative

### positioning

truelabel calls itself 'the data marketplace built for physical AI' [c001] for sourcing, evaluating, licensing and delivering training data [c030]. The site is live in 2026 [c131]. In practice it routes buyer specs, mostly net-new capture, to suppliers [c120]. The operating entity named is truelabel FZCO under Dubai law [c054].

### supply

Three supply routes: off-the-shelf catalogues, truelabel's own collector workforce and vendors [c004]. truelabel claims 100+ vendors [c002] in 100+ countries [c003], all vendor-stated. Buyers can bring their own named partners [c022]. Vendors keep ownership and grant truelabel a non-exclusive, sublicensable licence to pass data to buyers [c036][c039][c040]. Collector output is instead work for hire owned by truelabel [c061][c062], licensable to buyers and end clients [c063]. Partners apply and optionally declare off-the-shelf hours [c077][c080].

### object_model

A request carries protocol, format, acceptance criteria, licence scope and usage restrictions [c034]; once accepted, the request, listing, bid, order or SOW becomes the transaction terms [c035]. Buyers set provenance, rig, consent, exclusivity and QA before suppliers submit samples [c115]. Sample packages hold files, manifest, rights and QA notes [c083]; per-sample metadata includes consent_artifact_id and license_or_terms_id [c106], with a chain-of-custody record [c133]. Versioning is not described.

### listing

The only public 'listings' are directory pages for third-party public datasets, showing modality, platform, licence, commercial-use and procurement notes [c025]; for DROID the buyer is told to check the upstream licence [c026]. Per the Terms, listing metadata and sample previews may be visible to other users [c041]; no priced sale listing was reachable anonymously.

### discovery

Discovery runs through a public directory of 658 dataset pages [c127], nine modality 'marketplaces' landing pages [c132], and a rights register [c124]. Directory pages turn a public dataset into a custom request via 'Generate request spec' [c027].

### trust

Buyers get sample packets with QA evidence [c010] and review clips and metadata side by side [c007]. truelabel says rights-cleared delivery includes consent artifacts and location releases [c016][c113], and consent covers perpetual, worldwide commercial training with revocation terms [c114]. The Terms are narrower: suppliers describe consent status [c045] and produce records on due diligence [c046], and truelabel does not validate rights [c033]. Its rights register is 'not legal advice' [c126].

### transaction

Buyers submit a request, the spec is fanned to qualified partners, sample packets return, the buyer approves suppliers and scales [c009][c011][c109]. Spec to first sample takes one to three weeks (vendor-stated) [c021]. The spec-generator milestones begin with a 'Bounty lock' [c107]. truelabel disclaims being an escrow agent [c044].

### pricing

Pricing is bespoke and quoted per spec after partner matching, with no public rate card [c018][c019][c138]. Its own blog nevertheless gives indicative figures: USD 25k-200k programmes [c121] and USD 1.50-4.00 per episode [c122]; a public estimator's default shows USD 2,825-4,408 per accepted hour [c093], including a line for rights, consent and exclusivity [c094]. Commission rates are disclosed only in-product [c043].

### licence

The licence is negotiated per engagement [c014]. Buyers get only what the request, listing or order states [c037], and nothing broader passes by default [c038]. Exclusivity, retention, redistribution and resale are separate terms [c015]. Net-new data is typically exclusive by default [c112]; OTS is non-exclusive unless exclusivity is paid for [c137]. Default bans include reselling raw data [c047]. Data licences run under truelabel's MSA and Order [c050], which is not public.

### custody

Data ships straight into the buyer's S3, GCS or Azure [c005] in RLDS, LeRobot, MCAP, ROS bags, HDF5 or Parquet [c023][c116]. Public directory entries link to upstream hosts such as Hugging Face [c028].

### vetting

Supplier side: every partner is vetted against a published quality bar covering rig, calibration, capture history and consent infrastructure [c012][c013], and applications are reviewed personally [c078]. Collector footage goes through automated and human QA [c059][c100]; truelabel is sole arbiter [c060] and may audit records for two years [c074]. Buyer side: identity, organisation or sanctions checks 'may' be required [c042].

### contributor_pay

Collectors are independent contractors [c056] paid a fixed fee shown at job acceptance [c057], only for accepted submissions [c058], with no further compensation when data is licensed onward [c064]. Opportunity pages show USD 20 (US) and USD 18 (Mexico) per approved hour of usable footage [c097][c098]. A referral scheme pays USD 0.50-1.00 per referred accepted hour with caps [c085][c087][c089], and warns that most earn little [c090].

### post_sale

truelabel may suspend files and listings over a rights concern [c049], but rights under completed transactions survive termination [c048], and deletion requests leave data needed for completed transactions [c119]. A depicted person may withdraw consent [c072]; collectors must only notify truelabel [c073]. No duty on buyers to delete is published.

### catalogue_custom

A request is typed OTS or NET_NEW [c102]; it can ask for off-the-shelf data, net-new exclusive capture or an eval set [c110]. OTS means existing supplier datasets licensable quickly [c111][c134]. The site's own emphasis is net-new capture [c120]; the public directory is a lead-in to custom specs [c082][c027].

### changes

Terms of Service, Privacy Policy and Collector Services Agreement were all dated 19 June 2026 [c029][c117][c055]. The collector referral policy took effect on 4 July 2026 [c084], the newest dated event found. No funding, customer or independent press event could be found without search.

### demand

truelabel names its buyers as frontier model labs, embodied-AI startups, robotics OEMs and academic groups with industrial budgets [c020]. Volumes and named customers are not published; the traction figures available are vendor-stated only [c002][c003].

### regulation

Governing law is Dubai and UAE federal law, with Dubai courts having exclusive jurisdiction over truelabel FZCO [c054]. Collector consent must be valid under applicable law and acknowledge withdrawal rights [c072].

## Buyer journey

1. Lands on truelabel.ai, sees 'The data marketplace built for physical AI' and a 'Request data' call to action; can browse a free directory of public datasets and a rights register. [c001, c129, c127, c124]
2. Optionally uses the public spec generator or cost estimator, or clicks 'Generate request spec' from a public dataset page. [c092, c093, c027]
3. Submits a request (work email, company, data needed) choosing OTS or net-new, with provenance, rig, consent, exclusivity and QA requirements. [c102, c115, c034]
4. truelabel fans the spec to vetted partners (vendors or its own workforce); sample packets return in about one to three weeks. [c009, c004, c021]
5. Reviews samples, QA evidence and metadata in a dashboard; approves, rejects or asks for more, and approves matching suppliers. [c128, c010, c011]
6. Receives a bespoke quote; licence scope, exclusivity and resale terms are negotiated and fixed in the accepted order, under truelabel's MSA and Order. [c019, c014, c035, c050]
7. Data ships into the buyer's own S3, GCS or Azure in RLDS, LeRobot or MCAP, with rights, consent artifacts and metadata attached. [c005, c023, c016]

## Claims

### positioning

- **c001** truelabel positions itself on its homepage as a data marketplace built for physical AI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The data marketplace built for physical AI.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** The Terms describe truelabel as a marketplace for sourcing, evaluating, licensing and delivering physical AI training data.  
  _offer · legal_text · as of 2026-06-19 (page_dated)_
  - “a marketplace for sourcing, evaluating, licensing, and delivering physical AI training data” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c081** truelabel's About page describes it as where robotics, embodied-AI and VLA teams source training data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “truelabel is where robotics, embodied-AI, and VLA teams source training data.” — truelabel, <https://truelabel.ai/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c120** truelabel's own blog describes it as routing net-new commercial capture requests to candidate suppliers for sample review.  
  _offer · vendor_stated · as of 2026-05-07 (page_dated)_
  - “Truelabel routes net-new commercial capture requests to candidate suppliers for sample review” — truelabel, <https://truelabel.ai/blog/best-robotics-dataset-marketplaces-2026> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c131** truelabel's website is live in 2026 and presents itself as a physical AI data marketplace.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “© 2026 truelabel · Physical AI data marketplace” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — How the site presents itself exists only on the site. I fetched truelabel.ai on 2026-10-01 and it is live, headed as a physical AI training data marketplace; Terms and Privacy both say last updated 19 June 2026. No independent evidence that the company is trading (registry entry, press, funding, staff changes) could be found. No search available (WebSearch refused for this run). Routes tried by navigation: EDGAR full-text search for "truelabel" 2025-01-01..2026-10-01 = 0 hits; arXiv search = 1 unrelated 2012 paper; huggingface.co/truelabel 404; github.com/truelabel is an unrelated individual; truelabel.ai home, /about, /faq, /collectors and the sitemap link to no press, investor, partner or customer on another domain, and no app-store listing. The Terms name the operator as truelabel FZCO (Dubai), but the free zone is not stated, so no registry could be queried.
  - verifier (scope): **scope_ok** — Quote is the live footer ('© 2026 truelabel · Physical AI data marketplace'), confirmed on 2026-10-01. The copyright year alone does not prove operation; the status rests on retrieval today (retrieved_only). The newest dated items found are the Terms, Privacy Policy and Collector Agreement (19 June 2026) and the referral policy (4 July 2026). No dated corporate event (funding, layoffs, acquisition) was found, and without search none could be looked for.

### supply

- **c002** truelabel says on its homepage that it works with more than 100 vendors.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 vendors (lower bound)** (vendor-stated count of supply vendors on the platform, stated as 100+; as of retrieval)
  - “100+ vendors.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Traction figure stated only by the vendor ('100+ vendors' on the homepage, seen 2026-10-01). An independent count ought to exist (press, investor material) but none could be found. No search available (WebSearch refused for this run). Routes tried by navigation: EDGAR full-text search for "truelabel" 2025-01-01..2026-10-01 = 0 hits; arXiv search = 1 unrelated 2012 paper; huggingface.co/truelabel 404; github.com/truelabel is an unrelated individual; truelabel.ai home, /about, /faq, /collectors and the sitemap link to no press, investor, partner or customer on another domain, and no app-store listing. The Terms name the operator as truelabel FZCO (Dubai), but the free zone is not stated, so no registry could be queried.
  - verifier (scope): **scope_ok** — Homepage opening line reads '100+ vendors. One platform. Sourced from where the work happens.' It is a vendor-stated figure, not a verified count.
- **c003** truelabel says on its homepage that it operates in more than 100 countries.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 countries (lower bound)** (vendor-stated geographic reach, stated as 100+; as of retrieval)
  - “100+ countries.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Reach figure stated only by the vendor ('100+ countries' on the homepage, seen 2026-10-01). No independent source found. No search available (WebSearch refused for this run). Routes tried by navigation: EDGAR full-text search for "truelabel" 2025-01-01..2026-10-01 = 0 hits; arXiv search = 1 unrelated 2012 paper; huggingface.co/truelabel 404; github.com/truelabel is an unrelated individual; truelabel.ai home, /about, /faq, /collectors and the sitemap link to no press, investor, partner or customer on another domain, and no app-store listing. The Terms name the operator as truelabel FZCO (Dubai), but the free zone is not stated, so no registry could be queried.
  - verifier (scope): **scope_ok** — Homepage says 'homes in San Francisco, factories in Munich, streets in Tokyo, 100+ countries' about where data is sourced. 'Sources data from 100+ countries' would be more exact than 'operates in'. Vendor-stated.
- **c004** truelabel says it fills a buyer's request from off-the-shelf catalogs, its own workforce, or vendors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We grab from off-the-shelf catalogs, our workforce, or vendors.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Buyers can bring their own named capture partners into the marketplace, where they pass the same verification gate.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Buyers can bring named partners into the marketplace” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** As between users and truelabel, suppliers retain ownership of the dataset materials they provide.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “suppliers retain ownership of dataset materials they provide” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c061** Media, recordings, annotations and metadata a collector creates for a job are works made for hire owned by truelabel.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “are works made for hire owned by truelabel” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Collector Agreement.
  - verifier (scope): **quote_incomplete** — The quote 'are works made for hire owned by truelabel' does not name the materials. Better: 'materials you create or submit in connection with a job (collectively, "Work Product") are works made for hire owned by truelabel'. The clause lists media, recordings, annotations, metadata, derivative works, reports and feedback. The fallback assignment is covered by c062.
- **c062** Where work product is not work for hire, the collector irrevocably assigns all worldwide rights to truelabel on creation.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “you irrevocably assign to truelabel, effective upon creation, all worldwide right, title, and interest” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c063** The collector's grant covers truelabel providing the data and datasets to buyers, end clients and their service providers.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “providing data and datasets to buyers, end clients, and their service providers” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c076** Collectors may not try to identify, contact or solicit any buyer or end client.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “You will not attempt to identify, contact, or solicit any buyer or end client” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c077** truelabel invites capture companies to apply as partners on a public application page.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Apply to be a truelabel partner” — truelabel, <https://truelabel.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c034** A buyer's request can specify collection protocol, delivery format, acceptance criteria, licence scope and usage restrictions.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “collection protocol, hardware environment, annotations, metadata, delivery format, acceptance criteria, license scope” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** Once accepted, the request, listing, bid, order or written statement of work becomes part of the transaction terms.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “the applicable request, listing, bid, order, or written statement of work becomes part of the transaction terms” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c083** truelabel says a supplier sample package includes files, a manifest, rights and QA notes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A sample package includes files, manifest, rights, and QA notes” — truelabel, <https://truelabel.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c106** The spec generator's required metadata fields include a consent_artifact_id and a license_or_terms_id per sample.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “consent_artifact_id” — truelabel, <https://truelabel.ai/tools/data-spec-generator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c115** Buyers specify provenance, capture rig, location, consent, exclusivity and QA context before suppliers submit samples.  
  _architecture · vendor_stated · as of 2026-05-21 (page_dated)_
  - “Buyers specify provenance, capture rig, location, consent, exclusivity, and QA context before suppliers submit samples.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c025** Each directory row links to a page with modality, robot platform, licence, commercial-use and procurement notes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “modality, robot platform, license, commercial-use, and procurement notes” — truelabel, <https://truelabel.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c026** On a directory page for a public dataset (DROID 1.0.1), truelabel tells the buyer to review the upstream licence for commercial use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Commercial use: Review the linked license and upstream rights.” — truelabel, <https://truelabel.ai/datasets/huggingface/lerobot-droid-1-0-1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c041** Public listing metadata, sample previews and supplier names may be visible to other users.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Public listing metadata, sample previews, supplier names, organization names, and marketplace activity may be visible” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### discovery

- **c024** truelabel's /datasets page is a browsable directory of physical AI datasets rather than a priced catalogue.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every physical AI dataset, in one browsable directory.” — truelabel, <https://truelabel.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c127** truelabel's public dataset directory indexes 658 dataset pages.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **658 dataset pages** (count of third-party and public dataset pages in the directory; as of retrieval)
  - “658 dataset pages indexed” — truelabel, <https://truelabel.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The size of the vendor's own dataset directory. Context only (vendor source, not independent): truelabel.ai/sitemap.xml held about 1,050 URLs of all types on 2026-10-01; the number of dataset pages among them was not counted during the blind step.
  - verifier (scope): **scope_ok** — The directory mostly indexes third-party public datasets (Open X-Embodiment, DROID, BridgeData V2 and others). None is offered for sale on truelabel; see c024 and c027.
- **c132** truelabel's site groups its buyer landing pages under 'All 9 marketplaces', one per modality or use case.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All 9 marketplaces” — truelabel, <https://truelabel.ai/marketplaces> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c006** truelabel's homepage says rights and metadata are attached to delivered data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights and metadata attached.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c007** Before delivery, buyers review sample clips and metadata side by side and can approve, reject or request more.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Clips and metadata side-by-side. Approve, reject, request more” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c010** The FAQ says sample packets are small, labeled, rights-cleared and carry QA evidence.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “small, labeled, rights-cleared, QA evidence attached” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** The FAQ says rights-cleared delivery includes contributor consent artifacts and location releases for buyer review.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights-cleared delivery includes contributor consent artifacts, location releases where applicable” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c017** The FAQ says delivery includes per-trajectory provenance and metadata for buyer review.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “per-trajectory provenance/metadata for buyer review” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** Suppliers must accurately describe dataset provenance, collection conditions, consent status and geographic scope.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “You must accurately describe dataset provenance, collection conditions, consent status, geographic scope” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** Suppliers must keep records supporting provenance and consent claims and provide them when buyer due diligence requires.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “provide them when required by a request, buyer due diligence, or marketplace compliance review” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** Unless authorised, truelabel says it does not use private buyer or supplier data to train foundation models.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “we do not use private buyer or supplier dataset materials to train foundation models” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c065** Collectors must obtain a valid, informed, written and documented consent and release from each individual captured.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “a valid, informed, written, and documented consent, permission, and release” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c066** The consent collectors obtain must authorise use of the recording for AI and machine-learning training.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “authorizes use of the recording for artificial-intelligence and machine-learning training” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c067** The release must extend to any further-tier or downstream licensee or sublicensee of truelabel or a buyer.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “any further-tier or downstream licensee or sublicensee” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c068** Consent is also needed from the owner of a private home or location that is a subject of the capture, unless it appears only incidentally in public view.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “appears only incidentally and is in public view and whose owner is not reasonably identifiable” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** Collectors must retain each consent and release for six years after the job completes.  
  _number · legal_text · as of 2026-06-19 (page_dated)_ · **6 years** (minimum retention of each consent and release by the collector, counted from job completion; one-off)
  - “You will retain each such consent, permission, and release for six (6) years after the job completes” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Collector Agreement.
  - verifier (scope): **scope_ok**
- **c070** truelabel may extend the consent-retention period to up to ten years in total to support an active buyer engagement.  
  _number · legal_text · as of 2026-06-19 (page_dated)_ · **10 years** (maximum total consent-retention period truelabel may require of a collector; one-off)
  - “not exceeding ten (10) years in total” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Collector Agreement.
  - verifier (scope): **quote_incomplete** — The quote 'not exceeding ten (10) years in total' does not show the trigger in the statement. The clause continues 'or for such longer period ... as we notify you in writing is required to support an active buyer engagement'; quoting 'as we notify you in writing is required to support an active buyer engagement' would show it.
- **c071** On truelabel's request the collector must promptly provide a copy of a consent or release.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “at our request you will promptly provide a copy” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c091** truelabel publishes a dataset licence risk checker that triages licence, redistribution, consent, PII and takedown risk.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Triage license, model-output rights, redistribution, consent, PII, private-space, provenance, and takedown risk.” — truelabel, <https://truelabel.ai/tools> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c099** Collectors are told to keep faces, children and bystanders out of frame.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: smartphone video collector, United States_
  - “Keep faces, children, and bystanders out of frame” — truelabel, <https://truelabel.ai/collector-jobs/opportunities/smartphone-video-data-collector-united-states> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c103** The egocentric licensing guide tells buyers to require contributor releases, site permissions, a retention/deletion policy and consent artifacts.  
  _offer · vendor_stated · as of 2026-05-04 (page_dated)_
  - “Require contributor release, site/location permission, bystander handling, retention/deletion policy” — truelabel, <https://truelabel.ai/egocentric-data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c108** The spec generator's pilot packet milestone is 10 to 25 accepted samples plus rejected samples and source notes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “10-25 accepted samples, rejected samples, source notes, and parser output” — truelabel, <https://truelabel.ai/tools/data-spec-generator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c113** truelabel says each egocentric session ships with a contributor consent artifact.  
  _offer · vendor_stated · as of 2026-05-21 (page_dated)_
  - “Each egocentric session ships with a contributor consent artifact” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A vendor offer about what it ships. Only a buyer could confirm it independently; no buyer is named on the vendor's site and there is no search to find one.
  - verifier (scope): **scope_ok** — The phrase is in the FAQ-style section 'How does truelabel handle consent and licensing for egocentric data?' on /physical-ai-data-marketplace (dated May 21, 2026). It is a general promise for egocentric sessions, not tied to one listing.
- **c114** The shipped consent artifact covers commercial training use, perpetual and worldwide, with revocation terms documented.  
  _offer · vendor_stated · as of 2026-05-21 (page_dated)_
  - “commercial training use, perpetual, worldwide, with revocation terms documented” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c118** The Privacy Policy says collectors' mobile capture video, audio and motion data are used for delivery to buyers, end clients and service providers.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “delivery to buyers, end clients, and service providers” — truelabel, <https://truelabel.ai/legal/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c124** truelabel publishes a rights register sorting robotics datasets by commercial-use status.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Robotics datasets by commercial-use status” — truelabel, <https://truelabel.ai/datasets/commercial-use> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c125** The rights register reports counts of 5 allowed, 6 restricted, 25 unclear and 0 research-only datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **36 datasets reviewed in the rights register (5+6+25+0)** (sum of the register's stated status counts; as of retrieval)
  - “Current counts: 5 allowed · 6 restricted · 25 unclear · 0 research-only.” — truelabel, <https://truelabel.ai/datasets/commercial-use> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Counts on the vendor's own rights-register page.
  - verifier (scope): **scope_ok** — The counts cover 36 curated third-party robotics datasets that truelabel reviewed for commercial use. Entries show a check date of 2026-07-22. They are not truelabel's own inventory.
- **c126** truelabel says its commercial-use status is a conservative review signal, not legal advice or commercial clearance.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “no catalog verdict is legal advice or commercial clearance” — truelabel, <https://truelabel.ai/datasets/commercial-use> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c130** The homepage tells buyers to scope contributor consent artifacts and location releases with the task, not after capture.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Scope contributor consent artifacts, location releases where applicable” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c133** truelabel says each sourcing record carries a chain-of-custody record through ingestion, quality review and delivery.  
  _architecture · vendor_stated · as of 2026-05-04 (page_dated)_
  - “Each truelabel sourcing record carries a chain-of-custody record” — truelabel, <https://truelabel.ai/blog/data-provenance-physical-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c135** truelabel's glossary defines a consent artifact as a record that a contributor or site granted permission for capture and downstream use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A record showing that a contributor or site granted permission for data capture and downstream use.” — truelabel, <https://truelabel.ai/glossary> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c008** truelabel claims samples arrive in days rather than months.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Samples in days, not months.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c009** The truelabel FAQ says the spec is fanned out to qualified capture partners and sample packets come back first.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “truelabel fans the spec to qualified capture partners. Sample packets” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** The FAQ says the buyer approves the matching suppliers and then scales the order.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The buyer approves the suppliers that match, then scales.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c021** The FAQ says spec to first sample packet usually takes one to three weeks.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **3 weeks (upper end of a 1-3 week range)** (vendor-stated typical time from buyer spec to first sample packet; per engagement)
  - “Spec to first sample packet is usually one to three weeks” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A delivery-time statement in the vendor's own FAQ; no buyer-side source reachable without search.
  - verifier (scope): **scope_ok** — The FAQ sentence goes on: 'depending on rig availability and capture geography'.
- **c044** truelabel says it is not a bank, money transmitter or escrow agent.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “truelabel is not a bank, money transmitter, escrow agent, trustee, or fiduciary” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c092** truelabel publishes a data spec generator that produces a request spec including a rights route, QA, delivery and milestones.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Generate a structured request spec with objective, capture requirements, rights route, metadata, QA, delivery” — truelabel, <https://truelabel.ai/tools> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c107** The spec generator's first milestone is a 'Bounty lock' fixing the final spec, rights route and sample manifest.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Final spec, rights route, sample manifest, validation checklist, and reviewer owners.” — truelabel, <https://truelabel.ai/tools/data-spec-generator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c109** truelabel's marketplace page says buyers post a sourcing request, review matched samples and ingest data with rights and metadata attached.  
  _architecture · vendor_stated · as of 2026-05-21 (page_dated)_
  - “Buyers post a sourcing request, review matched samples, and ingest data with rights and metadata attached.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c128** truelabel's homepage says buyers review samples in their dashboard and approve, reject or request more until the spec is right.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Samples in your dashboard. Approve, reject, request more” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.67
- **c129** The homepage's two calls to action are 'Request data' for buyers and 'Become a partner' for suppliers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Become a partner” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c018** truelabel says its pricing is bespoke.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pricing is bespoke.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** truelabel quotes per spec after partner matching and does not publish a rate card.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “truelabel quotes per spec after partner matching, not from a public rate card.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A pricing practice stated in the vendor's own FAQ ('truelabel quotes per spec after partner matching, not from a public rate card').
  - verifier (scope): **scope_ok**
- **c043** The Terms publish no fee or commission rates; fees, commissions and payout timing are disclosed in-product or in transaction terms.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Fees, commissions, payout timing, refund rules, currency handling, chargeback handling, and applicable taxes are disclosed” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The absence of fee rates in the vendor's own Terms. Context only (same domain): the Terms say fees, commissions and payout timing 'are disclosed in-product or in the applicable transaction terms'.
  - verifier (scope): **quote_incomplete** — The quote stops at 'are disclosed' and does not show where. The page goes on 'in-product or in the applicable transaction terms'; quoting 'and applicable taxes are disclosed in-product or in the applicable transaction terms' shows it. The absence of rates cannot be quoted, which is acceptable.
- **c093** truelabel's cost estimator, in its default scenario, shows an expected cost of USD 2,825 to 4,408 per accepted hour.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2825 USD per accepted hour (low end of 2,825-4,408 range)** (buyer-side budget estimate from the public estimator's default inputs; the page says it is not a quote; per accepted hour)
  - “Expected cost per accepted hour: $2,825-$4,408” — truelabel, <https://truelabel.ai/tools/robotics-data-cost-estimator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Output of the vendor's own cost-estimator tool (/tools/robotics-data-cost-estimator).
  - verifier (scope): **scope_ok** — The default scenario is teleoperation, 120 accepted hours, 4 sites, a single region, net-new human capture, strict QA and exclusive commercial rights. The default budget range is $339,000–$529,000. The number means little without these inputs, and they belong in scope or basis.
- **c094** The cost estimator's default budget includes a separate line for rights, consent and exclusivity.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights, consent, and exclusivity” — truelabel, <https://truelabel.ai/tools/robotics-data-cost-estimator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c095** The estimator says a real quote still needs a sample packet, rejection rules, rights route and delivery schema.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A real quote still needs a sample packet, rejection rules, rights route, collection environment, and delivery schema” — truelabel, <https://truelabel.ai/tools/robotics-data-cost-estimator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c121** truelabel's blog comparison table lists truelabel at USD 25,000 to 200,000 programs with 60 to 90 day delivery.  
  _number · vendor_stated · as of 2026-05-07 (page_dated)_ · **25000 USD per program (low end of 25,000-200,000 range)** (vendor-stated indicative buyer spend per custom capture programme, in its own blog comparison table; per program)
  - “$25,000-$200,000 programs, 60-90 day delivery” — truelabel, <https://truelabel.ai/blog/best-robotics-dataset-marketplaces-2026> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A table in the vendor's own blog post.
  - verifier (scope): **scope_ok** — The truelabel row reads 'Net-new commercial capture, supplier review | $25,000-$200,000 programs, 60-90 day delivery'. The post was updated 2026-05-07 and is the vendor's own comparison.
- **c122** truelabel's blog gives an indicative candidate capture price of USD 1.50 to 4.00 per episode for a 5,000-episode baseline.  
  _number · vendor_stated · as of 2026-05-07 (page_dated)_ · **1.5 USD per episode (low end of 1.50-4.00 range)** (vendor-stated indicative buyer price for capture, before QA and licence overhead; per episode)
  - “Truelabel candidate capture at $1.50-$4.00 per episode” — truelabel, <https://truelabel.ai/blog/best-robotics-dataset-marketplaces-2026> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An indicative price in the vendor's own blog post.
  - verifier (scope): **scope_ok** — The full line is 'Truelabel candidate capture at $1.50-$4.00 per episode = $7,500-$20,000'. It covers capture only, before QA and licensing, for a 5,000-episode example.
- **c138** The teleoperation page says no per-episode price is published there and pricing is quote-based.  
  _terms · vendor_stated · as of 2026-07-19 (page_dated)_
  - “No per-episode price is published here” — truelabel, <https://truelabel.ai/teleoperation-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c014** The FAQ says data rights are negotiated per engagement and stated in the spec.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights are negotiated per engagement and stated in the spec.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A statement in the vendor's own FAQ.
  - verifier (scope): **scope_ok**
- **c015** The FAQ says exclusivity, retention, redistribution and resale are separate terms to review, not defaults.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “exclusivity, retention, redistribution, and resale are separate terms to review rather than assumed defaults” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c031** Unless a separate agreement says otherwise, truelabel is not a party to the underlying buyer-supplier contract.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “we are not a party to the underlying buyer-supplier contract” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Terms. Context only (same domain, not independent): truelabel.ai/legal/terms (updated 19 June 2026) reads 'Unless a separate written agreement says otherwise, we are not a party to the underlying buyer-supplier contract'.
  - verifier (scope): **quote_incomplete** — The statement includes the condition 'unless a separate agreement says otherwise', which the quote leaves out. Full words (108 chars): 'Unless a separate written agreement says otherwise, we are not a party to the underlying buyer-supplier contract'.
- **c037** Buyers receive only the licence stated in the applicable request, listing, order or written agreement.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Buyers receive only the license stated in the applicable request, listing, order, or written agreement.” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** A purchase or payout does not transfer broader rights by default.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “A purchase or payout does not transfer broader rights by default.” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c039** Users grant truelabel a non-exclusive, worldwide, sublicensable licence to host, copy, process and preview what they submit.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “non-exclusive, worldwide, sublicensable license to host, copy, process, preview, analyze” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c040** That licence lets truelabel make submitted content available to buyers, end clients and service providers under the transaction terms.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “make submitted content available to buyers, end clients, and service providers under the applicable transaction terms” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** By default buyers may not extract biometric identifiers, remove provenance or licence notices, or resell raw dataset materials.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “extract biometric identifiers, remove provenance or license notices, resell raw dataset materials” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** For data licensed through the marketplace, the truelabel Master Services Agreement and the Order govern warranties and liability.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “the truelabel Master Services Agreement and the applicable Order govern the representations, warranties, disclaimers” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c051** Every user indemnifies truelabel for claims arising from a failure to obtain required consents or releases.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “your failure to obtain required consents or releases” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c075** Buyers and end clients are intended third-party beneficiaries of the collector's confidentiality, data and IP obligations.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Buyers and end clients are intended third-party beneficiaries” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c104** The spec generator's example spec sets the rights route to exclusive net-new commercial training and evaluation rights.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights route: exclusive net-new commercial training and evaluation rights.” — truelabel, <https://truelabel.ai/tools/data-spec-generator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c105** The spec generator offers an 'Exclusive commercial rights' preset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Exclusive commercial rights” — truelabel, <https://truelabel.ai/tools/data-spec-generator> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c112** Net-new sourcing requests are collected after contract execution and are typically exclusive to the buyer by default.  
  _terms · vendor_stated · as of 2026-05-21 (page_dated)_
  - “Net-new sourcing requests are collected after contract execution and are typically exclusive to the buyer by default.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c136** truelabel's teleoperation page says net-new teleop sourcing requests can specify exclusive rights.  
  _terms · vendor_stated · as of 2026-07-19 (page_dated)_
  - “Net-new teleop sourcing requests can specify exclusive rights.” — truelabel, <https://truelabel.ai/teleoperation-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c137** truelabel says off-the-shelf datasets are typically non-exclusive unless the buyer pays for exclusivity.  
  _terms · vendor_stated · as of 2026-07-19 (page_dated)_
  - “Off-the-shelf datasets are typically non-exclusive unless the buyer pays for exclusivity.” — truelabel, <https://truelabel.ai/teleoperation-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### custody

- **c005** truelabel says data ships straight into the buyer's own S3, GCS or Azure storage.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data ships straight to your S3, GCS, or Azure.” — truelabel, <https://truelabel.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A delivery claim made by the vendor. A buyer's or cloud partner's documentation could confirm it, but none is named or linked on the vendor's site, and there is no search to find one.
  - verifier (scope): **scope_ok** — Homepage: 'Data ships straight to your S3, GCS, or Azure. Rights and metadata attached.' This is a vendor claim; which party does the copy (truelabel or the supplier) is not stated.
- **c023** truelabel delivers in RLDS, LeRobot v2, MCAP, ROS bags, HDF5, Parquet and per-buyer custom layouts.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “RLDS, LeRobot v2, MCAP, ROS 1 / ROS 2 bags, HDF5, Parquet, and per-buyer custom layouts.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** Directory pages link out to the upstream source; DROID's facts are cached from the Hugging Face API.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “source facts cached from the per-dataset Hugging Face API” — truelabel, <https://truelabel.ai/datasets/huggingface/lerobot-droid-1-0-1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c053** The service may integrate with hosting, storage, dataset hosting and repository tools.  
  _architecture · legal_text · as of 2026-06-19 (page_dated)_
  - “The service may integrate with hosting, storage, authentication, analytics, email, payment, compliance, labeling, annotation” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c116** truelabel says deliveries use LeRobotDataset v3 or RLDS so buyers can ingest without bespoke ETL.  
  _offer · vendor_stated · as of 2026-05-21 (page_dated)_
  - “Deliveries use LeRobotDataset v3 or RLDS so buyers can ingest without bespoke ETL.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c012** truelabel says every capture partner is vetted against a published quality bar before receiving specs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every partner is vetted against a published quality bar before they receive specs” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c013** The partner vetting covers rig inventory, calibration evidence, capture history and consent infrastructure.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “rig inventory, calibration evidence, capture history, consent infrastructure” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** truelabel's review of listings and files does not make it responsible for validating rights, consents or releases.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Review does not make us responsible for user content or for validating every right, consent, release” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** truelabel may require identity, organisation, sanctions, tax, payment or rights verification before enabling some marketplace actions.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “We may require identity, organization, sanctions, tax, payment, or rights verification before enabling certain marketplace” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c059** Collector submissions that fail automated or human quality review may be rejected without payment.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “Submissions that fail automated or human quality review may be rejected without payment” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c060** truelabel is the sole arbiter of whether a collector's submission meets the job standards.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “truelabel is the sole arbiter of whether a submission conforms to those standards.” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** truelabel may audit records relating to a collector's jobs for up to two years after completion.  
  _number · legal_text · as of 2026-06-19 (page_dated)_ · **2 years** (period after job completion during which truelabel may audit a collector's records; one-off)
  - “We may audit records relating to your jobs for up to two (2) years after a job completes” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Collector Agreement.
  - verifier (scope): **scope_ok**
- **c078** truelabel says its operator team reviews every partner application personally.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our operator team reviews every application personally” — truelabel, <https://truelabel.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c079** Shortlisted partner applicants receive a sample-upload link by email.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If shortlisted, you'll receive a sample-upload link by email” — truelabel, <https://truelabel.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c100** Every collector submission is checked for task completion, framing, privacy, file quality and duplicate content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every submission is checked for task completion, framing, privacy, file quality, and duplicate content.” — truelabel, <https://truelabel.ai/collector-jobs/opportunities/smartphone-video-data-collector-united-states> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c139** The teleoperation page says candidate suppliers are reviewed against the buyer's capability vector before scale-up is funded.  
  _architecture · vendor_stated · as of 2026-07-19 (page_dated)_
  - “Candidate suppliers should be reviewed against the buyer's capability vector before any scale-up is funded.” — truelabel, <https://truelabel.ai/teleoperation-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c032** The Terms say truelabel does not employ suppliers or contributors.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “we do not employ suppliers or contributors” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c056** Collectors perform jobs for truelabel as independent contractors.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “You perform as an independent contractor.” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c057** A collector's fee for a job is fixed at the amount displayed when the job is accepted.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “The fee for a job is fixed at the amount displayed when you accept it” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own Collector Agreement or job terms.
  - verifier (scope): **scope_ok** — The clause continues: 'no increase, expense reimbursement, or additional compensation is owed unless we agree in writing. We pay only for submissions that we accept' (acceptance is covered by c058).
- **c058** truelabel pays collectors only for submissions it accepts.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “We pay only for submissions that we accept.” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c064** These onward uses require no further compensation, notice or attribution to the collector.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “without any further compensation, notice, or attribution to you” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c085** A referring collector earns USD 0.50 per accepted hour the referred collector is paid for.  
  _number · legal_text · as of 2026-07-04 (page_dated)_ · **0.5 USD per accepted hour of referred collector's footage** (referral bonus paid by truelabel to a referring collector (buddy leg); per accepted hour)
  - “US$0.50 per Accepted Hour a Referred Collector is paid for” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A rate in the vendor's own referral policy; no third party restates it on any page reachable without search.
  - verifier (scope): **scope_wrong** — Stated as an unconditional rate, but the policy limits it: bonuses accrue 'only on their first 250 Accepted Hours and only for up to 12 months after they join — whichever comes first'. The USD 0.50 is also a 'general default framework value' that a program's dated Schedule A may replace. See truelabel-v001 and v003.
- **c086** The buddy referral bonus is capped at a flat USD 25 per week.  
  _number · legal_text · as of 2026-07-04 (page_dated)_ · **25 USD** (weekly cap on buddy referral bonus paid to a collector; per week)
  - “flat US$25 per Week” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A cap in the vendor's own referral policy.
  - verifier (scope): **scope_ok** — 'Flat' in the policy means the cap is not linked to the referrer's own base earnings. The policy also lets uncapped excess carry forward for up to 8 weeks before it expires. As with every amount in the policy, it is a default that a program's Schedule A may change (truelabel-v001).
- **c087** A community partner earns USD 1.00 per accepted hour an introduced collector is paid for.  
  _number · legal_text · as of 2026-07-04 (page_dated)_ · **1.0 USD per accepted hour of introduced collector's footage** (referral bonus paid by truelabel to a community partner; per accepted hour)
  - “US$1.00 per Accepted Hour an Introduced Collector is paid for” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A rate in the vendor's own referral policy.
  - verifier (scope): **scope_wrong** — USD 1.00 per accepted hour holds only for the first 30 days. The policy tapers it: 'days 1–30: 100%; 31–60: 66%; 61–90: 33%; after 90 days: $0'. It is also a default value that a program's Schedule A may replace. See truelabel-v001 and v002.
- **c088** Community partner bonuses are capped at USD 150 per introduced collector.  
  _number · legal_text · as of 2026-07-04 (page_dated)_ · **150 USD** (cap on community partner bonus per introduced collector; one-off)
  - “US$150 per Introduced Collector” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A cap in the vendor's own referral policy.
  - verifier (scope): **scope_ok** — A default value; a program's Schedule A may change it (truelabel-v001).
- **c089** Community partner bonuses are capped at USD 2,000 per calendar month across all recruits.  
  _number · legal_text · as of 2026-07-04 (page_dated)_ · **2000 USD** (monthly cap on community partner bonus across all recruits; per month)
  - “US$2,000 per calendar month across all recruits” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A cap in the vendor's own referral policy.
  - verifier (scope): **scope_ok** — A default value; a program's Schedule A may change it (truelabel-v001).
- **c090** The referral policy warns that most people will earn a small amount or nothing.  
  _terms · legal_text · as of 2026-07-04 (page_dated)_
  - “Most people will earn a small amount or nothing” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c096** truelabel's collector opportunity pages are evergreen and not guarantees of active jobs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “They are not active-job guarantees; matching depends on location, equipment, sample quality, and available collector work.” — truelabel, <https://truelabel.ai/collector-jobs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c097** A US smartphone collector opportunity pays USD 20 per approved hour of usable footage.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: smartphone video collector, United States_ · **20 USD per approved hour of usable footage** (paid by truelabel to an individual collector; United States smartphone opportunity page; per approved hour)
  - “$20 per approved hour of usable footage” — truelabel, <https://truelabel.ai/collector-jobs/opportunities/smartphone-video-data-collector-united-states> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A pay rate on the vendor's own opportunity page. A third-party job board could restate it, but none is linked from /collector-jobs or /collectors (no external links at all) and there is no search to find one.
  - verifier (scope): **scope_ok** — The page says '$20 USD per approved hour of usable footage', paid only for accepted hours after machine and human review. It is dated June 5, 2026, so as_of could be page_dated. /collector-jobs calls these evergreen pages 'not active-job guarantees' (covered by c096).
- **c098** A Mexico first-person collector opportunity pays USD 18 per approved hour of usable footage.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: first-person video collector, Mexico_ · **18 USD per approved hour of usable footage** (paid by truelabel to an individual collector; Mexico first-person opportunity page; per approved hour)
  - “$18 per approved hour of usable footage” — truelabel, <https://truelabel.ai/collector-jobs/opportunities/first-person-video-data-collector-mexico> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A pay rate on the vendor's own opportunity page. No third-party job posting is linked, and there is no search to find one.
  - verifier (scope): **scope_ok** — The page says '$18 in USD per approved hour'. It is dated June 5, 2026 and is an evergreen page, not a guaranteed job (c096).
- **c101** Collectors are paid after machine and human review of their footage.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “after machine and human review” — truelabel, <https://truelabel.ai/collector-jobs/opportunities/smartphone-video-data-collector-united-states> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c048** Rights already granted under completed transactions survive termination of an account.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “rights already granted under completed transactions” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c049** truelabel may suspend or remove accounts, files, listings or payouts, including over a rights concern.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “We may limit, suspend, or terminate access to accounts, files, listings, requests, payouts, or features” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** The Collector Agreement acknowledges a depicted person may withdraw data-protection consent as a matter of law.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “data-protection consent may be withdrawn by the individual as a matter of law” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c073** The collector must promptly notify truelabel if a consent is withdrawn or challenged.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “you will promptly notify us if any such consent is withdrawn or challenged” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c119** After an account deletion or deletion request, some information may remain where necessary for completed transactions.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “some information may remain where necessary for completed transactions” — truelabel, <https://truelabel.ai/legal/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c027** The directory page's call to action turns the public dataset into a custom data request spec rather than a purchase.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Generate request spec” — truelabel, <https://truelabel.ai/datasets/huggingface/lerobot-droid-1-0-1> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c080** The partner application asks, optionally, for the partner's off-the-shelf hours of existing data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Off-the-shelf hours (optional)” — truelabel, <https://truelabel.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c082** truelabel's sourcing hub is for buyers whose needs the public catalogue does not meet, and shows what to specify in a sourcing request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “When the public catalog doesn't have what you need, these pages show what to specify in a sourcing request” — truelabel, <https://truelabel.ai/sourcing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c102** truelabel's egocentric data licensing guide lists the request type as either OTS or NET_NEW.  
  _offer · vendor_stated · as of 2026-05-04 (page_dated)_
  - “Request type: OTS or NET_NEW” — truelabel, <https://truelabel.ai/egocentric-data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c110** A truelabel request can specify off-the-shelf data, net-new exclusive capture, or a smaller eval set.  
  _offer · vendor_stated · as of 2026-05-21 (page_dated)_
  - “A request can specify off-the-shelf data, net-new exclusive capture, or a smaller eval set.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c111** OTS sourcing requests are for existing datasets that a supplier can license quickly.  
  _offer · vendor_stated · as of 2026-05-21 (page_dated)_
  - “OTS sourcing requests are for existing datasets that a supplier can license quickly.” — truelabel, <https://truelabel.ai/physical-ai-data-marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c123** truelabel's egocentric video data page lists public datasets such as Ego4D with their own licences, e.g. a research licence, rather than priced truelabel inventory.  
  _offer · vendor_stated · as of 2026-06-11 (page_dated)_
  - “Research license” — truelabel, <https://truelabel.ai/egocentric-video-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c134** truelabel's glossary defines an off-the-shelf dataset as an existing dataset a supplier can license without a new capture program.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “An existing dataset a supplier can license without running a new capture program.” — truelabel, <https://truelabel.ai/glossary> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c029** truelabel's Terms of Service were last updated on 19 June 2026.  
  _event · legal_text · as of 2026-06-19 (page_dated)_
  - “Last updated: 2026-06-19.” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c055** truelabel's Collector Services Agreement is effective 19 June 2026.  
  _event · legal_text · as of 2026-06-19 (page_dated)_
  - “Effective June 19, 2026.” — truelabel, <https://truelabel.ai/legal/collector-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c084** The collector referral policy took effect on 4 July 2026.  
  _event · legal_text · as of 2026-07-04 (page_dated)_
  - “Effective date: July 4, 2026” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The effective date of the vendor's own referral policy exists only on its own policy page (/legal/referral-incentive-program-policy).
  - verifier (scope): **scope_ok** — Page reads 'Effective date: July 4, 2026'.
- **c117** truelabel's Privacy Policy was last updated on 19 June 2026.  
  _event · legal_text · as of 2026-06-19 (page_dated)_
  - “Last updated: 2026-06-19.” — truelabel, <https://truelabel.ai/legal/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### demand

- **c020** truelabel names its target buyers as frontier model labs, embodied-AI startups, robotics OEMs and well-funded academic groups.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Frontier foundation-model labs, embodied-AI startups, robotics OEMs, and academic groups with industrial budgets.” — truelabel, <https://truelabel.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c054** The Terms are governed by Dubai and UAE federal law, with Dubai courts having jurisdiction over truelabel FZCO.  
  _terms · legal_text · as of 2026-06-19 (page_dated)_
  - “the courts of the Emirate of Dubai having jurisdiction over truelabel FZCO have exclusive jurisdiction” — truelabel, <https://truelabel.ai/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** The referral policy's dollar rates and caps are default values that a programme's own published, dated Schedule A may replace.  
  _terms · legal_text · as of 2026-07-04 (page_dated) · scope: Referral & Incentive Program_
  - “They apply to a program unless that program's own published, dated Schedule A adopts different values” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **v002** The community partner bonus tapers to 66% of the rate in days 31-60, 33% in days 61-90, and nothing after 90 days.  
  _terms · legal_text · as of 2026-07-04 (page_dated) · scope: Referral & Incentive Program_
  - “days 1–30: 100%; 31–60: 66%; 61–90: 33%; after 90 days: $0” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **v003** Buddy referral bonuses accrue only on a referred collector's first 250 accepted hours or first 12 months, whichever ends first.  
  _terms · legal_text · as of 2026-07-04 (page_dated) · scope: Referral & Incentive Program_
  - “you earn Buddy Referral Bonuses only on their first 250 Accepted Hours and only for up to 12 months after they join” — truelabel, <https://truelabel.ai/legal/referral-incentive-program-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://truelabel.ai/legal/terms>, <https://truelabel.ai/faq>, <https://truelabel.ai/apply>, <https://truelabel.ai/physical-ai-data-marketplace>, <https://truelabel.ai/teleoperation-data-marketplace>
- `matrix.public_listing` — gated; tried <https://truelabel.ai/datasets>, <https://truelabel.ai/marketplaces>, <https://truelabel.ai/egocentric-video-data>
- `matrix.versioning` — not_published; tried <https://truelabel.ai/legal/terms>, <https://truelabel.ai/faq>, <https://truelabel.ai/blog/data-provenance-physical-ai>, <https://truelabel.ai/teleoperation-data-marketplace>
- `other.msa` — not_found; tried <https://truelabel.ai/legal/terms>, <https://truelabel.ai/sitemap.xml>
- `other.commission_rate` — not_published; tried <https://truelabel.ai/legal/terms>, <https://truelabel.ai/faq>, <https://truelabel.ai/apply>
- `other.commissioned_resale` — not_published; tried <https://truelabel.ai/legal/collector-agreement>, <https://truelabel.ai/legal/terms>, <https://truelabel.ai/physical-ai-data-marketplace>
- `other.buyer_audit_fingerprinting` — not_published; tried <https://truelabel.ai/legal/terms>, <https://truelabel.ai/faq>
- `other.independent_sources` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22truelabel%22>
- `other.collector_program_page` — js_empty; tried <https://truelabel.ai/collectors>

## Conflicts

- c019, c121: FAQ says quotes are not from a public rate card, while the blog publishes indicative programme and per-episode ranges; both kept, treated as indicative prices only. (unresolved)
- c016, c046: Marketing says consent artifacts ship with delivery; the Terms oblige suppliers only to produce records when buyer due diligence requires. Both kept; matrix follows the marketing statement, with a note. (unresolved)
- c031, c050: The Terms say truelabel is not a party to the buyer-supplier contract, yet say data licences run under truelabel's own MSA and Order; recorded as operator_role mixed. (unresolved)

## Leads, not cited

- <https://truelabel.ai/login> — The buyer dashboard where samples and listings live; gated, not fetched.
- <https://truelabel.ai/recruiters> — Recruiter programme for collectors; not fetched.
- <https://truelabel.ai/collector-jobs/opportunities/egocentric-video-data-collector-latam> — More collector pay rates by region.
- <https://truelabel.ai/robot-training-data-marketplace> — Another modality landing page; may state OTS terms.
