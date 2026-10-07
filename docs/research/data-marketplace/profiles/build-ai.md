# Build AI

vision_physical_ai · light · status: **active** · also known as Build, builddotai, Build PBC

> Rendered from `ledger/build-ai.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “"OTS dataset" (paid, via the "Egocentric API"); open releases are named by scale: Egocentric-10K, Egocentric-100K, Egocentric-1M ...” and its bespoke side “No name found; the home page says only "or tell us what you’re looking for"”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c026, c027, c016 | First-party: Build AI licenses data it collected itself; its consent is needed to redistribute. |
| economics_model | principal_margin | c015, c016, c007 | Build pays partners and collectors and licenses the result at its own (unpublished) price; open tiers are given away free under Apache 2.0. |
| who_pays_fee | not_applicable |  | First-party sales only; no intermediary fee between a provider and a buyer. |
| supply_models | own_collection | c014, c015, c039, c041, c024 | Collected with Build's own head-mounted device through factory/business partners and individual collectors it pays; no third-party datasets found. |
| custody_model | copy_to_buyer | c035, c037 | Open tiers download from Hugging Face; the paid Egocentric API delivers downloadable hour folders. |
| transaction_mode | contact_sales | c013, c033, c051, c017 | Paid access is assigned by Build after contact; open tiers are free downloads behind a contact-info gate. |
| public_prices | none | c030, c013 | API terms make pricing confidential; no price on site. |
| licence_model | mixed | c036, c026, c017 | Apache 2.0 on open tiers; fixed non-commercial research terms on the API preview; customer agreements are negotiated. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_summary_gated_detail | c037, c049 | Applies to the open tiers on Hugging Face; the paid OTS tiers have no public listing at all. |
| buyer_vetting | case_by_case | c033, c034 | API access is assigned by Build after it confirms the account; the Hugging Face gate only collects contact details. |
| sample_mechanics | free_sample_download | c044, c036, c037 | The open Apache 2.0 tiers and ungated evaluation sets act as free samples; no sample of the paid tier itself is documented. |
| versioning | unknown |  | Scale tiers are separate, disjoint datasets (c048), but how a released dataset is revised is not documented. |
| human_subject_consent_docs | not_addressed | c047, c020 | Consent documents are internal collection paperwork; neither the dataset cards nor the API terms give buyers consent evidence or a consent warranty. |
| contributor_pay_model | one_off | c022, c015 | Collectors are paid payouts and bonuses for collection; no royalty or share of sales found. |
| catalogue_plus_custom | both | c009, c013 |  |
| erasure_after_sale | unknown |  | API terms require ceasing use on termination (c029) but say nothing about deletion or data-subject takedown; Apache 2.0 copies cannot be recalled. |
| quality_evidence | provider_asserted | c011, c045, c046, c023 | Operator and provider are the same company; all quality evidence is Build's own (in-house eval with gemini-2.5-flash, promised SLA); no third-party check found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Build targets researchers and labs with its OTS dataset and courts academics with a $1M grant pool; it claims a $100M run rate in 2026, vendor-stated only. Units, volumes and buyer names are not published. | c009, c003, c050, c051 |
| Q2 | partial | Build puts free open tiers on Hugging Face (with a contact-info gate that collects leads) and sells the larger tiers through its own gated Egocentric API; no third-party marketplace listing of the paid tiers was found. | c036, c037, c049, c033 |
| Q3 | partial | All inventory is Build's own collection, filmed on its own head-mounted device inside factories and job sites through local partners and individual collectors it pays. The rights basis is consent and worker terms Build writes itself, country by country. | c014, c015, c024, c041, c039, c020, c018 |
| Q4 | unknown | No commissioned client work is resold that we could find, so there is no carve-out to describe; Build can change its API terms at any time (c032). |  |
| Q5 | partial | Build AI is licensor of record of its own data and its consent is needed to redistribute. Who warrants worker consent and who indemnifies is not published. | c026, c027, c016, c019 |
| Q6 | sourced | Copied to the buyer: open tiers download from Hugging Face, and the Egocentric API delivers hour folders of MP4 and IMU files for download. | c035, c037 |
| Q7 | partial | Build writes its own consent and worker terms for the people it films, answered country by country, and says a factory should not wait for the paperwork. Nothing about consent reaches the buyer, and nothing covers site owners beyond partnerships. | c020, c021, c018, c047 |
| Q8 | partial | Open tiers are Apache 2.0 with no control after download. API data is non-commercial R&D only, with no redistribution, derivatives allowed, and use to stop on termination. No audit, fingerprinting or exclusivity terms were found. | c036, c026, c027, c028, c029 |
| Q9 | partial | No checkout. Paid access comes after emailing research@build.ai: Build assigns a dataset 'grant' to an API account, and pricing is confidential. Build owns the inventory, so it keeps the whole price. | c013, c033, c034, c030, c017, c051 |
| Q10 | partial | Datasets are separate, disjoint releases named by scale (10K, 100K, 1M, 10M ...) on a dated roadmap. API access is a per-account 'grant' delivered as hour folders. What a past buyer gets on a new version is not documented. | c005, c006, c048, c034, c035, c029 |
| Q11 | partial | Buyers can download free open tiers and ungated evaluation sets. Build publishes its own hand-visibility and manipulation comparison, labelled with gemini-2.5-flash, and promises an SLA on pose MPJPE, diversity and quality for the paid OTS. | c044, c045, c046, c011, c043, c010 |
| Q12 | partial | The ready-made side is called the 'OTS dataset'. Bespoke needs are handled by 'tell us what you’re looking for' by email, with no separate product name or terms found. | c009, c013 |

## Claims

### positioning

- **c001** Build AI's live website describes the company as a data hyperscaler for physical AI, showing it is trading as of 2026-10-01.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Build AI is the data hyperscaler for Physical AI.” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The tagline 'Build AI is the data hyperscaler for Physical AI.' is live on build.ai (2026-10-01). Ten roles are open on the vendor's Ashby board (jobs.ashbyhq.com/build-ai), published between 30 Aug and 20 Sep 2026, but those postings are the vendor's own text. Routes tried for an independent source of 2026 operation: TechCrunch's site search ('Build AI' egocentric; 'Eddy Xu'; build.ai) found no coverage; the portfolio pages of the named investors Pear, Costanoa, Renegade, Abstract and Deepwater do not list it; the HF0 and cyber.fund home pages do not mention it; EDGAR company and full-text searches found no Form D; OpenCorporates (Delaware) found no matching PBC. The nearest independent trace is the Sept 2026 arXiv paper 2609.24411, which uses the company's dataset but says nothing about the company's status.
  - verifier (scope): **scope_ok** — Tagline is live on build.ai on 2026-10-01; a live trading page retrieved today meets the LEDGER status rule. The profile's own source is the vendor's site; the blind step found nothing independent.
- **c002** Build AI says it is a public benefit corporation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we’re a public benefit corporation” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c007** Build AI says it is vertically integrated across hardware, manufacturing, logistics, collection and model training.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “vertically integrated across hardware, manufacturing, logistics, collection, and model training” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** Build AI says it is based in San Francisco and Shenzhen and is launching operations in further countries.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we’re based in sf and shenzhen and are actively launching countries” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c012** Build AI says its OTS dataset is collected in the wild from real workers at real businesses.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: OTS dataset, paid_
  - “in-the-wild (real workers, real businesses)” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c014** Build AI says it collects data inside working factories and job sites across a growing number of countries.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “collects data inside working factories and job sites across a growing number of countries” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **unverifiable** — No search available. The wording ('collects data inside working factories and job sites across a growing number of countries') is from the vendor's own Ashby post (Founding Legal Counsel, 2026-09-20). build.ai adds 'we're based in sf and shenzhen and are actively launching countries'. The Zeva-Ego paper independently describes Egocentric-10K as 'real factory work through wearable monocular cameras', which supports factory collection but says nothing about job sites or countries.
  - verifier (scope): **scope_ok** — Same post as c015; the quote matches the statement word for word.
- **c024** Build AI's country leads recruit collection partners through partnerships with local businessmen, politicians and enterprises.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “establishing partnerships with local businessmen, politicians, and enterprises” — Build AI, <https://jobs.ashbyhq.com/build-ai/85ed9b03-c2b2-49b9-bbe6-46fe0a5b5146> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c039** Build AI describes Egocentric-10K as the first dataset collected exclusively in real factories.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “It is the first dataset collected exclusively in real factories.” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** Egocentric-10K was recorded with a monocular head-mounted camera on Build AI's own Gen 1 device, without audio.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “Camera Type Monocular head-mounted Audio No Device Build AI Gen 1” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c010** Build AI describes its OTS dataset as monocular video at 1920x1080 and 30fps.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: OTS dataset, paid_
  - “monocular, 1920x1080p 30fps” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** The Egocentric API web app refers to assigned dataset access as a grant and tells users with several to contact Build AI.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “More than one dataset is assigned. Contact Build AI to choose which grant to use.” — Build AI, <https://www.build.ai/_next/static/chunks/0b2-ohnsga4v8.js> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** Build AI's Egocentric-10K contains 10,000 hours of video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_ · **10000 hours of video** (dataset card statistics table; one-off)
  - “Total Hours 10,000” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — A September 2026 robotics paper that trained on Egocentric-10K (it used 4,439 of the hours) describes the public release as 10,000 hours. The paper cites the Hugging Face card, so the count is the publisher's own figure restated by a user of the data, not an independent recount. Found through arXiv's own API search; WebSearch was not available.
    - “The public release totals 10,000 hours, 192,900 clips, and 1.08 billion frames at 30 Hz” — arXiv (Zeva-Ego paper authors), <https://arxiv.org/html/2609.24411v2> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The card's statistics table ('Total Hours 10,000') applies to the open Egocentric-10K release.
- **c040** Egocentric-10K is published at 1080p (1920x1080) resolution.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “Resolution 1080p (1920x1080)” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** Build AI's Egocentric-100K contains 100,405 hours of video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-100K, open_ · **100405 hours of video** (dataset card statistics table; one-off)
  - “Total Hours 100,405” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-100K> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The 100,405-hour figure appears only on the vendor's own Hugging Face card, which is the owner's docs. The arXiv API and arxiv.org search for 'Egocentric-100K' return no paper that names the dataset, and the Zeva-Ego paper (2609.24411) cites only Egocentric-10K.
  - verifier (scope): **scope_ok** — The card's statistics table ('Total Hours 100,405') applies to the open Egocentric-100K release, which is published at 256p, as c043 records.
- **c043** The open Egocentric-100K release is published at 256p (456x256) resolution.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-100K, open_
  - “Resolution 256p (456x256)” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-100K> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** A Build AI organisation member stated on Hugging Face in August 2026 that Egocentric-10K and Egocentric-100K are completely disjoint.  
  _architecture · vendor_stated · as of 2026-08-11 (page_dated) · scope: Egocentric-10K; Egocentric-100K, open_
  - “nope, they are completely disjoint!” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-100K/discussions/7> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c037** Egocentric-10K's files require a Hugging Face login and agreeing to share contact information, while the card itself is public.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “You need to agree to share your contact information to access this dataset” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
- **c049** Build AI's Hugging Face organisation lists four datasets and no Egocentric-1M, so the 1M tier is not openly published there.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-1M_
  - “models 0 None public yet datasets 4” — Build AI, <https://huggingface.co/builddotai> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c011** Build AI says its OTS dataset comes with SLA guarantees on 3D pose MPJPE, diversity and quality.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: OTS dataset, paid_
  - “SLA guarantees on 3D pose MPJPE, diversity, and quality” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** Build AI says its in-house counsel will run diligence on its data rights and provenance for customers, regulators, investors and acquirers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Run diligence on Build's data rights and provenance for customers, regulators, investors, and acquirers” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c044** Build AI publishes a 30,000-frame evaluation set for Egocentric-10K as a separate Hugging Face dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K-Evaluation, open_
  - “The complete 30,000 frame evaluation set is available at Egocentric-10K-Evaluation” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** Build AI's quality comparison samples 10k frames per dataset and labels them with gemini-2.5-flash for hand visibility and manipulation.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K-Evaluation, open_
  - “we randomly sample 10k frames from each dataset and run them through a gemini-2.5-flash” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K-Evaluation> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** Build AI claims Egocentric-10K is state-of-the-art in hand visibility and active manipulation density.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “Egocentric-10K is state-of-the-art in hand visibility and active manipulation density” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact

### transaction

- **c017** Build AI's legal role description includes drafting and negotiating customer agreements alongside partner and vendor agreements.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Draft and negotiate customer, partner, vendor, manufacturing, employment, consulting, and other commercial agreements” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c025** Build AI's Egocentric API terms say the API is in preview with no service-level agreement during the preview period.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “There is no service-level agreement (SLA) during the preview period.” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c051** Build AI's founder asks researchers who find Egocentric-1M useful to reach out for collaboration rather than download it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-1M_
  - “if Egocentric-1M is useful to your research, please reach out for collaboration” — Eddy Xu (Build AI founder), <https://eddy.build> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c030** The Egocentric API terms make its endpoints, data formats and pricing confidential during the preview.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “details of the Service — including API endpoints, data formats, pricing, and internal documentation — are confidential” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### licence

- **c016** Build AI says its commercial agreements cover two sides: partners who collect the data and customers who license it.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “the partners who collect the data and the customers who license it” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c026** Data accessed through Build AI's Egocentric API is licensed for non-commercial research and development only.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “licensed for non-commercial research and development purposes only” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A licence term of the vendor's own API. One check: I could not find the Egocentric API by navigating; build.ai links only to Hugging Face, X, Ashby and the founders' pages; docs.build.ai has an expired certificate and api.build.ai returns 404.
  - verifier (scope): **scope_ok** — build.ai/terms defines the Service as the Egocentric API ('currently in preview'), and the clause applies to 'Data accessed through the Service'. The terms do not cover the Apache-licensed Hugging Face releases, and the profile keeps the two apart (c036).
- **c027** The Egocentric API terms forbid redistributing, sublicensing or selling the raw data without Build AI's prior written consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “You may not redistribute, sublicense, sell, or make the raw data available to third parties without prior written consent” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** The Egocentric API terms permit derivative works such as trained models, embeddings and extracted features.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “Derivative works (trained models, embeddings, extracted features) are permitted.” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** Build AI publishes Egocentric-10K and Egocentric-100K on Hugging Face under the Apache 2.0 licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K; Egocentric-100K, open_
  - “Licensed under the Apache 2.0 License.” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
  - “Licensed under the Apache 2.0 License.” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-100K> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The owner sets the licence on its own Hugging Face cards, which are the owner's docs under LEDGER rules, not independent. On direct read both the Egocentric-10K and Egocentric-100K cards give the licence field 'apache-2.0' and the text 'Licensed under the Apache 2.0 License.' Both cards are gated: 'You need to agree to share your contact information to access this dataset'.
  - verifier (scope): **scope_ok** — Both cards carry the licence field apache-2.0 and the text 'Licensed under the Apache 2.0 License.' This covers the open HF releases only, not Egocentric-1M or API data.
- **c047** The Egocentric-10K dataset card's License section states only the Apache 2.0 licence; the card gives no consent or release statement for the workers filmed.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10K, open_
  - “License Licensed under the Apache 2.0 License. Citation” — Build AI, <https://huggingface.co/datasets/builddotai/Egocentric-10K> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A fact about the vendor's own card. On direct read the sections are Dataset Statistics, Camera Intrinsics, Dataset Structure, Loading the Dataset, Loading Intrinsics, License and Citation. The License section reads only 'Licensed under the Apache 2.0 License.', and nothing on the card covers consent, releases, faces or anonymisation. The Zeva-Ego paper that uses the data likewise says nothing on consent.
  - verifier (scope): **scope_ok** — The quote shows the License section running straight into Citation. The absence of consent wording is put in the statement, which rule 13 allows, and I confirmed it on a direct read of all seven card sections.

### custody

- **c035** Through the Egocentric API a user downloads hour folders each holding 20 MP4 video and raw IMU text pairs.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “Downloads hour folders containing 20 MP4 and raw IMU text pairs.” — Build AI, <https://www.build.ai/_next/static/chunks/0b2-ohnsga4v8.js> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A file layout in the vendor's own API documentation. I found no third-party description of the API: docs.build.ai has an expired certificate and api.build.ai returns 404. The open Hugging Face releases use a different layout (factory/worker folders of WebDataset TAR shards pairing MP4 with JSON metadata, no IMU), and the Zeva-Ego paper using Egocentric-10K never mentions IMU.
  - verifier (scope): **scope_ok** — The string comes from the Egocentric API dashboard bundle (on 2026-10-01 the same chunk also contains 'Egocentric API' and 'No dataset access is assigned to this account.'), so it applies to the API, not to the HF releases. Caveat: the source is a hashed Next.js chunk URL that will change on the next deploy, so the quote check may break even though the fact holds.

### vetting

- **c023** Build AI says it defines taxonomy, golden sets, acceptance criteria and audit for its collectors so data quality is measurable.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Design the taxonomy collectors actually use, plus golden sets, acceptance criteria, and audit so quality is measurable” — Build AI, <https://jobs.ashbyhq.com/build-ai/82ea03e8-3714-4fd6-a9d6-3f259eb21f5c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c033** The Egocentric API web app shows no data to a new account until Build AI confirms and assigns dataset access.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “No dataset access is assigned to this account. If you’re expecting an invitation, refresh after Build AI confirms access.” — Build AI, <https://www.build.ai/_next/static/chunks/0b2-ohnsga4v8.js> · docs · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c015** Build AI says it pays a distributed network of partners and individual collectors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “pays a distributed network of partners and individual collectors at volume” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **unverifiable** — No search available. The statement is in the vendor's own Ashby job post (Founding Legal Counsel, published 2026-09-20): 'pays a distributed network of partners and individual collectors at volume'. That is the vendor speaking on a third-party host, so it is not independent. No collector, partner or press account of the payments could be reached.
  - verifier (scope): **scope_ok** — The quote is from the vendor's own Founding Legal Counsel post on Ashby (published 2026-09-20), and the statement is framed as 'Build AI says'. The quote does not say how the collectors are paid (per task, per hour or by share), so it cannot carry contributor_pay_model alone.
- **c022** Build AI pays its collectors through marketplace mechanics that include bonuses and payouts tied to task mix and eligibility.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Design marketplace mechanics (task mix, targeting, bonuses, payouts, eligibility) so collectors produce high-value data” — Build AI, <https://jobs.ashbyhq.com/build-ai/493a31c5-edd4-4bd2-8ea3-5cbad3d38e47> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **unverifiable** — No search available. The only source is the vendor's Ashby post 'Data Scientist, Marketplace Incentives' (published 2026-08-30), which describes work the new hire will do: 'Design marketplace mechanics (task mix, targeting, bonuses, payouts, eligibility)' and 'ship incentive and payout changes into the collection product'. That shows payouts exist and that bonuses are a design goal. It does not show that collectors are paid through such mechanics today. No independent account was found.
  - verifier (scope): **scope_wrong** — The quote is a job duty for a new hire ('Data Scientist, Marketplace Incentives', published 2026-08-30): 'Design marketplace mechanics (task mix, targeting, bonuses, payouts, eligibility)'. That lists levers the hire will design. It does not describe how collectors are paid now, and it does not tie bonuses or payouts to task mix or eligibility. The statement drops the 'Build AI says' framing and turns a hiring goal into current practice. Supportable: 'Build AI is hiring to design collector incentive mechanics, including bonuses, payouts and eligibility; a sibling bullet speaks of shipping incentive and payout changes into the collection product.' It does not support contributor_pay_model = one_off, since nothing says per-task or per-hour pay and nothing excludes a share.

### post_sale

- **c029** On termination of Egocentric API access, users must cease using the data obtained, except derivative works already incorporated in research.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “you must cease use of any data obtained through the Service, except for derivative works already incorporated” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c009** Build AI offers researchers and labs training on what it calls its OTS (off-the-shelf) dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: OTS dataset, paid_
  - “we’re a partner for scaling core research bets. train on our OTS dataset” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c013** Besides the OTS dataset, Build AI invites researchers to say what data they want, pointing to a research@build.ai address rather than a price or checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “or tell us what you’re looking for research@build.ai” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — How the vendor invites contact on its own site; such a fact exists only there. build.ai links research@build.ai, and no price or checkout appears on the page.
  - verifier (scope): **scope_ok** — The quote shows the research@build.ai invitation. 'Rather than a price or checkout' is an absence stated in the statement, which LEDGER rule 13 allows; I confirmed on build.ai that no price or checkout appears.

### changes

- **c005** Build AI's website roadmap lists Egocentric-10M for November 2026, the newest dated item on the site (a planned release).  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-10M_
  - “Egocentric-10M Nov 2026” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A roadmap that exists only on build.ai. When read directly on 2026-10-01, the roadmap lists Egocentric-10M for Nov 2026, but it also lists Egocentric-100M (Oct 2027) and Egocentric-1B (Dec 2028). So Nov 2026 is the next planned date, not the newest dated item on the site, and that part of the statement is wrong.
  - verifier (scope): **scope_wrong** — The quote supports 'Egocentric-10M Nov 2026', but the statement claims more than is true. The same roadmap lists Egocentric-100M for Oct 2027 and Egocentric-1B for Dec 2028, so Nov 2026 is the next planned release, not the newest dated item on the site. A planned date is also a roadmap entry, not an event that has happened.
- **c006** Build AI's website roadmap dates Egocentric-1M to March 2026 and Egocentric-100K to December 2025.  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric-1M_
  - “Egocentric-100K Dec 2025 Egocentric-1M Mar 2026” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** Build AI reserves the right to modify the Egocentric API terms at any time.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “Build AI reserves the right to modify these terms at any time.” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### demand

- **c003** Build AI says it scaled from zero to a $100M revenue run rate in 2026.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100000000 USD revenue run rate** (company-stated annualised revenue run rate on its hiring blurb; not audited or independently reported; per year)
  - “we scaled from 0->$100M revenue run rate in 2026” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The only source found is the vendor's own homepage ('we scaled from 0->$100M revenue run rate in 2026'). No filing, investor page or press article with the figure could be reached: TechCrunch site search, the investor portfolio pages and EDGAR all came up empty (see c001). The figure must stay vendor_stated.
  - verifier (scope): **scope_ok** — The quote matches and the statement is correctly framed as 'Build AI says'. The figure appears only on the vendor's homepage.
- **c050** Build AI's founder says the company announced $1M for research and compute grants for academic researchers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1000000 USD in research/compute grants** (founder-stated grant pool for academic researchers; not stated)
  - “we recently announced $1M dedicated to research/compute grants for academic researchers.” — Eddy Xu (Build AI founder), <https://eddy.build> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The founder's own site (eddy.build) has the words '$1M dedicated to research/compute grants for academic researchers', but that page is affiliated with the vendor. No university, grantee or press page could be reached by navigation.
  - verifier (scope): **scope_ok** — The quote is the founder's own words on eddy.build, framed as 'founder says'. The page is undated, so when the grants were announced is unknown; outbound X links on the page decode to about April 2026, but that date is not quotable.

### regulation

- **c018** Build AI says its consent, data-transfer and collector-structuring questions are currently answered country by country by outside counsel.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Today those questions are answered country by country, by outside counsel across several firms” — Build AI, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c020** Build AI says it writes consent, contractor/worker terms, privacy notices and retention documents for its in-the-wild collection.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Write and maintain consent, contractor/worker terms, privacy notices, retention, and cross-border transfer docs” — Build AI, <https://jobs.ashbyhq.com/build-ai/7a9ce4ea-f908-4ef6-920c-b8117e21f99a> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c021** Build AI's compliance brief says factory operations should not pause because consent paperwork is unfinished.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Ops should not pause a factory because the paperwork is not done.” — Build AI, <https://jobs.ashbyhq.com/build-ai/7a9ce4ea-f908-4ef6-920c-b8117e21f99a> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data

### other

- **c004** Build AI says it has raised more than $30M from investors.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **30000000 USD raised (lower bound)** (company-stated cumulative funding, 'more than'; no filing found; cumulative)
  - “backed by top investors ($30M+ raised)” — Build AI, <https://www.build.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. EDGAR company search ('build ai', 'build', 'build p') and full-text search ('Build AI' Form D; 'Eddy Xu') found no Form D for the company. 'Build Intelligence Group Inc.' (CIK 2118599) is an unrelated Delaware issuer with different officers. None of the named investors whose portfolio pages loaded (Pear, Costanoa, Renegade, Abstract, Deepwater) lists Build AI. The '$30M+ raised' figure is on build.ai only.
  - verifier (scope): **scope_ok** — Quote '($30M+ raised)' matches 'more than $30M'; framed as vendor-stated.
- **c031** By creating an Egocentric API account, a user lets Build AI name them and their institution in marketing and investor communications.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Egocentric API, preview_
  - “you grant Build AI permission to reference your name, institutional affiliation” — Build AI, <https://www.build.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** An independent robotics paper from Tsinghua University's Institute for AI Industry Research (Zeva-Ego, arXiv 2609.24411) trained on 4,439 hours selected from the open Egocentric-10K release.  
  _outcome · academic · as of 2026-09 (publication) · scope: Egocentric-10K, open_
  - “We use 4,439 hours selected through task-stratified sampling.” — arXiv (Huang, Ding, Chen et al., Tsinghua AIR / Z-Trans AI), <https://arxiv.org/html/2609.24411v2> · academic · retrieved 2026-10-01 · quote check: exact
- **v002** An independent paper that used Egocentric-10K reports that the open release does not include frame-aligned hand poses or action trajectories.  
  _architecture · academic · as of 2026-09 (publication) · scope: Egocentric-10K, open_
  - “The source release does not include frame-aligned hand poses or action trajectories.” — arXiv (Huang, Ding, Chen et al., Tsinghua AIR / Z-Trans AI), <https://arxiv.org/html/2609.24411v2> · academic · retrieved 2026-10-01 · quote check: exact
- **v003** Build AI's Head of Global Expansion posting, published 2026-08-31, lists India and Shenzhen as secondary locations to San Francisco.  
  _event · vendor_stated · as of 2026-08-31 (page_dated) · scope: India_
  - “{"location":"India","address":{"postalAddress":{"addressCountry":"India"}}}” — Build AI (job board hosted by Ashby), <https://api.ashbyhq.com/posting-api/job-board/build-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.build.ai/>, <https://www.build.ai/terms>, <https://huggingface.co/datasets/builddotai/Egocentric-10K>, <https://huggingface.co/datasets/builddotai/Egocentric-100K>
- `matrix.versioning` — gated; tried <https://huggingface.co/datasets/builddotai/Egocentric-10K>, <https://huggingface.co/datasets/builddotai/Egocentric-100K>, <https://huggingface.co/api/datasets/builddotai/Egocentric-100K/commits/main>, <https://www.build.ai/terms>
- `matrix.erasure_after_sale` — not_published; tried <https://www.build.ai/terms>, <https://huggingface.co/datasets/builddotai/Egocentric-10K>, <https://www.build.ai/privacy>
- `questions.Q4` — not_published; tried <https://www.build.ai/>, <https://www.build.ai/terms>, <https://jobs.ashbyhq.com/build-ai/14a9873a-9016-476a-996c-188266281f6c>
- `other.paid_tier_licence` — gated; tried <https://www.build.ai/>, <https://www.build.ai/terms>, <https://www.build.ai/data>
- `other.privacy_policy` — not_found; tried <https://www.build.ai/privacy>, <https://www.build.ai/privacy-policy>, <https://www.build.ai/legal>
- `other.independent_press` — not_found; tried <https://arxiv.org/search/?query=Egocentric-10K&searchtype=all>, <https://efts.sec.gov/LATEST/search-index?q=%22build.ai%22>
- `other.funding_filing` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Build%20AI%22&forms=D>
- `other.egocentric_1m_release` — not_found; tried <https://huggingface.co/builddotai>, <https://www.build.ai/egocentric-1m>, <https://x.com/eddybuild/status/2041751488817774968>

## Conflicts

- c011, c025: The home page promises SLA guarantees on dataset quality for the OTS dataset, while the Egocentric API terms say there is no SLA during the preview. They may cover different channels (negotiated contract vs API preview); both kept. (unresolved)
- c040, c043, c010: Not a contradiction but a tier gap: the open 100K release is 256p while the OTS dataset is advertised at 1920x1080. The paid tier appears to be the full-resolution version, which the sources do not state outright. (unresolved)

## Leads, not cited

- <https://x.com/eddybuild/status/2041751488817774968> — Founder's post announcing Egocentric-1M (linked from eddy.build); X not fetched.
- <https://x.com/buildpbc/status/2048292663078850624> — Linked from the home page as a collaboration call; X not fetched.
- <https://huggingface.co/datasets/builddotai/Egocentric-10K/discussions/4> — A user says earlier versions of Egocentric-10K had dense action annotation; that points to annotations removed from the open tier. Third-party comment, not cited.
- <https://huggingface.co/datasets/builddotai/Egocentric-10K/discussions/2> — A 'Copyright infringement' report opened and closed 2025-11-17, content hidden.
- <https://youtu.be/cdiD-9MMpb0?t=4604> — Video linked from the home page (Karpathy on Tesla Vision); not relevant to terms.
- <https://jobs.ashbyhq.com/build-ai> — 23 open roles (2026-08/09) including Head of Data Compliance and Marketplace Incentives; more operating detail may appear there.
