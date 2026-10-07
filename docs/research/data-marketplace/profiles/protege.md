# Protege

licensing_marketplace · deep · status: **active** · also known as Protege Health Inc., withprotege.ai, Calliope Networks (acquired)

> Rendered from `ledger/protege.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Named curated data products, e.g. 'SHOT (Selected Highlights Optimized for AI Training)' for video and 'CLERK by Protege' for healthcare admin; also 'our aggregated catalog' and 'Protege-curated dataset'” and its bespoke side “'custom datasets' assembled from the partner network ('Can datasets be customized or sourced for specific needs?'); 'Rapid sourcing and fulfillment ... From scoped request to structured dataset delivery'; evaluations are 'benchmarking work'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c005, c017, c036, c004 | Protege Health Inc. grants the buyer licence itself under a sublicensable, non-exclusive licence from each provider; providers keep ownership and licensor names are Protege confidential information. |
| economics_model | revenue_share | c056, c093, c097, c115, c122 | Providers receive a revenue share on each deal that includes their data; the split is not published. The Provider Terms themselves grant Protege a royalty-free licence and are silent on payment (see conflicts). |
| who_pays_fee | both | c002, c122, c115 | Buyers pay an Access Fee for the Platform (general Terms) on top of the SOW licence fee; Protege's margin is otherwise the part of licence revenue it keeps before paying providers' share. Amounts and split not published. |
| supply_models | third_party_providers | c033, c058, c108, c141, c131 | All evidenced inventory comes from rights-holder organisations (broadcasters, distributors, health data holders, crowd-capture firms such as Sunain) under provider agreements. Protege builds evaluations itself and says it can source new data types, but no own-collection inventory is evidenced. Legacy Calliope ran a creator 'License to Scrape'; whether it continues is unknown. |
| custody_model | copy_to_buyer | c122, c142, c026, c099, c105 | Providers upload to Protege's platform hosted on a major cloud provider; Protege then delivers the constructed dataset to the buyer, who must delete or return it at termination. |
| transaction_mode | contact_sales | c067, c074, c016, c007 | No checkout; every buyer page leads to 'Contact for Data Access' and the licence fee is set in a Statement of Work. |
| public_prices | none | c067, c002, c016 | No dataset, Access Fee or revenue-share figure is published on any page fetched. |
| licence_model | negotiated | c007, c016, c114, c037 | Two published customer templates (general Terms; Media Terms for audiovisual) set the baseline, but authorised purposes and fees are set per deal in a Statement of Work that overrides the Terms. |
| exclusivity_offered | no | c005, c017, c035 | Both customer templates are non-exclusive and Protege itself holds only a non-exclusive licence from providers. A Statement of Work could in principle differ; none is public. |
| public_listing | login_required | c137, c002, c011 | The public site shows only category pages and named products; dataset details sit on the Platform, reached after an Access Fee, and licensor names are confidential. |
| buyer_vetting | unknown |  | Sales-led with a signed SOW, but no published buyer checks. |
| sample_mechanics | sample_on_request | c149, c138, c003 | Representative samples, metadata and descriptions on request (healthcare page); the Platform also shows source, record counts, fields and criteria counts. |
| versioning | unknown |  | No terms or docs on dataset versions or updates. |
| human_subject_consent_docs | not_addressed | c152, c153, c020, c040 | Providers warrant consents to Protege, but the buyer terms give only an authority-to-contract warranty, disclaim non-infringement and grant no name/image/likeness rights; no consent evidence is described as passing to buyers. |
| contributor_pay_model | unknown |  | Protege pays organisations (revenue share). How individual capturers are paid is set by upstream providers: Sunain pays contributors 'in exchange for compensation' (form unstated); pre-acquisition Calliope proposed a volume/subscriber formula for creators. Protege's own practice for individuals is not published. |
| catalogue_plus_custom | both | c068, c151, c147, c070 | Named curated products (SHOT, CLERK) alongside custom datasets assembled per buyer from the partner network. |
| erasure_after_sale | contractual_deletion | c025, c026, c010 | Media Terms oblige the buyer to cease use on Protege's notice during the Term and to delete or return data at termination; whether cease-use requires retraining models is not stated. |
| quality_evidence | operator_verified | c145, c146, c071, c143, c100 | Protege says it evaluates all source data on onboarding and again per customer dataset; this is the vendor's own description, and the Terms disclaim accuracy. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers are AI model builders (foundation labs, healthcare AI firms) buying pre-training to evaluation data; vendor case studies cite enterprise deals with 'marquee AI companies' and a radiology model buyer. Units, volumes and prices per deal are not published. | c065, c098, c140, c107, c109 |
| Q2 | sourced | Protege pitches rights holders on existing lab relationships, legal guardrails, packaging and delivery support, and discretion, with revenue incremental to distribution; case studies claim $1M+ and $250k+ earnings. | c125, c124, c126, c062, c096, c102 |
| Q3 | sourced | Inventory comes from rights-holder organisations (100+ AV partners, healthcare data holders, Dailymotion, GrabMaps, crowd-capture firm Sunain) under Provider Terms granting Protege a non-exclusive, sublicensable licence; providers keep ownership and warrant rights and consents. | c033, c035, c039, c040, c050, c051, c058, c131, c134 |
| Q4 | partial | Protege does not resell commissioned work; its only published position on channel conflict is that AI training licences rarely conflict with distribution rights because content is not publicly exhibited. No case of terms changed after the fact was found. | c055, c062 |
| Q5 | sourced | Protege Health Inc. is licensor of record, sublicensing provider data to buyers under its own Terms. Providers warrant rights and consents and indemnify Protege, buyers indemnify Protege and its licensors, and Protege indemnifies providers only for its own misrepresentations to buyers. | c005, c036, c039, c040, c042, c043, c012, c030, c152 |
| Q6 | sourced | Providers upload to a Protege platform on a major cloud; Protege builds and delivers the dataset to the buyer (hundreds of TB in hours), who must protect, then delete or return it at termination. | c099, c105, c122, c142, c028, c026 |
| Q7 | partial | Providers warrant all necessary consents to Protege, healthcare data is de-identified with expert determination and video may get identifier removal or anonymisation. Buyers get no consent warranty or NIL rights, are barred from re-identification and digital replicas, and nothing addresses place or property owners. | c040, c052, c054, c143, c020, c021, c022, c152 |
| Q8 | sourced | Non-exclusive, non-sublicensable licence for training models, limited to SOW purposes; bans on synthetic data, redistribution, re-identification, digital replicas and verbatim scene output; audit rights and deletion on termination. No fingerprinting or leakage detection is described. | c005, c017, c018, c009, c024, c021, c023, c027, c026, c047 |
| Q9 | sourced | Sales-led: contact form, then a Statement of Work that sets the fee; the Platform also carries an Access Fee. Protege earns by keeping part of licence revenue and paying providers a revenue share on each deal. | c067, c016, c002, c056, c093, c122 |
| Q10 | partial | Datasets are constructed per buyer opportunity from qualified partners' data, and a media Licensed Dataset is audiovisual content plus metadata. After a provider leaves, existing buyers keep access 12 months (3 years for academic research); no versioning terms were found. | c015, c120, c121, c037, c044, c045, c046 |
| Q11 | sourced | Before purchase the Platform shows source, record counts, fields and criteria counts, and Protege offers descriptions, metadata and representative samples on request. Quality evidence is Protege's own onboarding and per-dataset review; the Terms disclaim accuracy. | c003, c138, c149, c145, c146, c013, c029 |
| Q12 | sourced | Both: named curated products (SHOT for video, CLERK for healthcare admin) plus custom datasets assembled per request from the partner network, including sourcing new data types; the Siemens Healthineers quote frames Protege as more than a data catalog. | c068, c151, c147, c148, c070, c066, c120 |

## Narrative

### positioning

Protege Health Inc. (New York) calls itself the trusted source for AI-ready real-world data [c063] and describes its site as a data marketplace platform [c136]. It aggregates rights holders' data into datasets for AI builders [c076], across healthcare, video, audio, and spatial/physical AI.

### supply

All evidenced supply comes from rights-holder organisations under Provider Terms: a worldwide, non-exclusive, sublicensable licence to Protege [c035][c036], with provider warranties of rights and consents [c039][c040]. Protege claims 150+ global providers [c058] and 100+ AV partners [c059]. Partners include Dailymotion [c131], GrabMaps [c089] and crowd-capture firm Sunain [c134]. Video partners must own content outright or control it under broad rights [c051].

### object_model

A Licensed Dataset is audiovisual content and related metadata [c015]. For healthcare, datasets are constructed per opportunity: Protege qualifies which partners' data fits [c120], then works on linkages and transformations to build a buyer-ready dataset [c121]. Buyers use data according to the licence type purchased [c037].

### listing

No dataset listings are public. The Platform, reached after an Access Fee [c002], lets a customer view datasets [c137]. Licensor names and data sources are Protege confidential information [c011]. Public pages list only content categories [c072].

### discovery

On the Platform customers see a dataset's source and record count [c003] and can surface how many records fit their criteria [c138]. Otherwise discovery runs through sales contact [c074].

### trust

Protege offers descriptions, metadata and representative samples before licensing [c149], and keeps healthcare benchmark test cases private [c129]. Both customer templates disclaim accuracy [c013][c029] and non-infringement [c153].

### transaction

Deals are sales-led: 'Contact for Data Access' [c067], a Statement of Work that sets the fee [c016] and overrides the Terms [c007]. Protege says it closed multiple enterprise deals for one broadcaster [c098] and advised providers during negotiations [c101][c104].

### pricing

No prices are published. Buyers pay an Access Fee for the Platform [c002] and a fee set in the SOW [c016]; packaging and licensing are decided with each provider [c114].

### licence

Protege licenses buyers itself, non-exclusively [c005][c017], for training models they own or license [c006][c018]. Media Terms grant no NIL rights [c020], ban digital replicas [c021], re-identification [c022] and verbatim scene outputs [c023]. Marketing says use is limited to training, fine-tuning, evaluation and benchmarking [c047]. Audit rights [c010][c027] and buyer indemnity [c030] apply.

### custody

Providers upload to a Protege platform on a major cloud provider [c099][c105]. Protege delivers the finished dataset to the buyer [c122] with a system moving hundreds of terabytes in hours [c142]. Buyers must secure it [c028] and delete or return it at termination [c026].

### vetting

Protege says it evaluates all source data at onboarding and again per customer dataset [c145][c146], runs expert determination on delivered healthcare data [c143], and applies identifier removal, sampling and optional anonymisation to media [c052][c053][c054].

### contributor_pay

Providers receive a revenue share on each deal including their data [c056][c093][c103]; the split is not published. Protege says it has paid tens of millions to content partners [c060]. Individuals are paid by upstream providers, e.g. Sunain's compensated contributors [c135]; legacy Calliope proposed a volume and subscriber formula for creators [c086].

### post_sale

Buyers must cease use on Protege's notice [c025] and delete or return data at termination [c026]. If a provider leaves, Protege stops new sales [c044] but existing buyers keep access for twelve months [c045], or three years for academic research [c046].

### catalogue_custom

Protege runs both: named curated products such as SHOT for video [c068] and CLERK for healthcare admin [c151], and custom datasets assembled to buyer criteria [c147], including sourcing new data types [c148]. It also designs and runs healthcare evaluations [c128].

### changes

Founded in 2024 [c112]; $10M seed in September 2024 [c111]; acquired Calliope Networks in December 2024 [c079]; $25M Series A in August 2025 [c106]; $30M round in January 2026 [c091]; Dailymotion partnership July 2026 [c131]; GrabMaps partnership September 2026 [c089].

### demand

Demand evidence is vendor-stated: a 20x business growth claim [c109], enterprise deals with AI companies [c098], and a radiology imaging buyer [c140]. Funding totals $65M [c092].

## Buyer journey

1. Lands on withprotege.ai and picks a domain page under 'For Model Builders' (healthcare, video, audio, spatial); sees categories and named products such as SHOT, but no listings or prices. [c068, c072, c067]
2. Clicks 'Contact for Data Access' and fills in the model-builder contact form; Protege's team follows up. [c067, c074]
3. Scopes requirements with Protege (modality, cohort, geography, time range); Protege may assemble a custom dataset or point to a curated product. [c147, c070, c120]
4. Evaluates before licensing: dataset descriptions, metadata and representative samples on request; on the Platform, after an Access Fee, sees each dataset's source, record count, fields and criteria counts. [c149, c002, c003, c138]
5. Signs the customer Terms (or Media Terms for audiovisual data) plus a Statement of Work that fixes the fee and the authorised purposes. [c016, c007, c014, c023]
6. Protege builds the dataset from qualified partners' data, runs privacy processing and delivers it to the buyer. [c121, c143, c122, c142]
7. Uses the data for training under the licence restrictions, subject to audit, cease-use notices and deletion or return at termination. [c018, c021, c027, c025, c026]

## Claims

### positioning

- **c063** Protege's homepage describes it as the trusted source for AI-ready, real-world data and expertise across the AI lifecycle; the site is live.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Protege is the trusted source for AI-ready, real-world data” — Protege, <https://withprotege.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Homepage fetched 2026-10-01 is live and reads 'Protege is the trusted source for AI-ready, real-world data and expertise at every stage of the AI lifecycle.' A tagline exists only on the site. Independent signs of operation: a16z investment post 2026-01-08; Protege's own article index lists dated items to 2026-09-21. No independent source newer than January 2026 found; no search available to look for layoffs or other status events.
  - verifier (scope): **scope_ok** — Homepage subheadline verified live 2026-10-01.
- **c065** Protege's homepage markets data to AI model builders as tailored to current model-building needs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data tailored to today's model-building needs” — Protege, <https://withprotege.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c076** Protege's About page says it aggregates data sources to deliver AI-ready datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “the connective tissue that aggregates data sources to deliver AI-ready datasets” — Protege, <https://withprotege.ai/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c136** Protege's privacy policy describes its website as a data marketplace platform.  
  _offer · legal_text · as of 2026-10-01 (retrieved_only)_
  - “when you visit our data marketplace platform” — Protege, <https://withprotege.ai/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### supply

- **c033** Protege's Provider Terms are an agreement between Protege Health Inc. and the provider organisation named in a Schedule.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Protege Health Inc. ("Protege"), and the organization or entity ("Provider") named in the Schedule” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Party clause of Protege's own Provider Terms. Entity 'Protege Health Inc.' not found in SEC EDGAR company search (no Form D); state registry not reachable without search.
  - verifier (scope): **scope_ok**
- **c034** Under the Provider Terms the provider supplies the initial data sets listed in the Schedule to be made available through Protege.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Provider agrees to provide the initial data sets included in the Schedule ("Data") to be available” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** Under the Provider Terms the provider grants Protege a worldwide, royalty-free, non-exclusive licence to use, reproduce and distribute the data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “worldwide, royalty-free and non-exclusive license to use, display, publish, reproduce, distribute” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c039** In the Provider Terms the provider warrants that it has ownership, control and responsibility for the data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Provider represents and warrants that Provider has ownership, control, and responsibility” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c040** The provider warrants it holds all necessary licences, rights, consents and approvals for the data; the buyer receives only this upstream assertion, not consent documents.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “all necessary licenses, registrations, rights, consents and approvals to use or disclose” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** Under the Provider Terms the provider indemnifies Protege and its affiliates.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Provider agrees to indemnify, defend, and hold harmless Protege and its affiliates” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c043** Under the Provider Terms Protege indemnifies the provider, for claims from Protege's representations to Consumers that do not match the agreement.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Protege agrees to indemnify, defend, and hold harmless Provider and its affiliates” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** Protege tells video providers that partners always retain ownership and license only limited rights for defined AI training purposes.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Yes. Partners always retain ownership. You are licensing limited rights for defined AI training purposes” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Protege says video partners typically license content they own outright or control under global all-media or similarly broad rights.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Control under global all media or similarly broad rights” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Protege tells providers that licensed content is not publicly exhibited or redistributed, so AI training licences rarely conflict with distribution deals.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “rights. Content is not publicly exhibited or redistributed, and AI uses typically” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** Protege says it builds datasets by combining content across more than 150 global providers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_ · **150 global content providers (lower bound, '150+')** (vendor-stated count of providers whose content is combined into datasets; not independently verified; cumulative to date)
  - “By combining content across 150+ global providers, we construct datasets that power multiple AI” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Provider counts are stated only by Protege; partner sites reached (autentic.com, sunain.com, calliopenetworks.ai) give no Protege-wide count. No search available.
  - verifier (scope): **scope_ok** — Video data-provider page: 'By combining content across 150+ global providers, we construct datasets that power multiple AI buyers'.
- **c059** Protege says it has 100+ producer and distributor partners for audiovisual content across six continents.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_ · **100 AV producer and distributor partners (lower bound, '100+')** (vendor-stated; number shown as '100+' next to this label; cumulative to date)
  - “Producers & distributor partners for AV content across 6 continents” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent count of audiovisual partners or continents found; Autentic's homepage news items (to 2026-09-28) do not mention Protege. No search available.
  - verifier (scope): **quote_incomplete** — The quote is only the label; the number '100+' sits in the stat block above it ('100+ Producers & distributor partners for AV content across 6 continents').
- **c061** Protege's video-provider process is presented as four steps: Discover, Structure, Prepare, Monetize.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “We assess your library and rights framework to identify high value AI training applications” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c062** Protege tells video providers that revenue from AI licensing is typically incremental to existing distribution.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “from AI licensing is typically incremental.” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c064** Protege's homepage offers data providers a way to monetise existing data assets or content while keeping rights protections and provenance.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Monetize your existing data assets or content with Protege” — Protege, <https://withprotege.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c069** Protege describes its video supply as an aggregated catalog spanning genres, languages and geographies.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “Our aggregated catalog enables both breadth and depth across genres, languages, and geographies.” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c075** Protege's contact page routes prospective data partners to a separate partner form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Interested in becoming a Protege data partner? Fill out the partner form below, and we'll be in touch.” — Protege, <https://withprotege.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c077** Protege's About page says data providers protect their data assets through standard licensing agreements and rights protections.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “protect their data assets through standard licensing agreements and rights protections” — Protege, <https://withprotege.ai/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c080** Protege said Calliope Networks licensed movies, TV series and news to generative AI developers.  
  _offer · vendor_stated · as of 2024-12-18 (publication) · scope: Calliope Networks (pre-acquisition business)_
  - “Calliope Networks aggregates and licenses media content, including movies, TV series, and news, for use by generative AI” — Protege, <https://withprotege.ai/articles/news/protege-acquires-calliope-networks-unlocking-premium-video-data-for-ai-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c081** Protege said Calliope brought hundreds of thousands of hours of TV, film, news and sports content.  
  _number · vendor_stated · as of 2024-12-18 (publication) · scope: Calliope Networks (pre-acquisition business)_ · **100000 hours of video (lower bound of 'hundreds of thousands')** (vendor-stated catalogue size brought by Calliope at acquisition; not independently verified; at December 2024)
  - “hundreds of thousands of hours of global, high-quality TV, film, news and sports content” — Protege, <https://withprotege.ai/articles/news/protege-acquires-calliope-networks-unlocking-premium-video-data-for-ai-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Calliope's own homepage and FAQ give 35,000+ hours for the TV and film catalogue only and no total across news and sports; nothing independent found. EDGAR full-text 'Protege' + 'Calliope' and CourtListener 'Calliope Networks' return 0 hits. No search available for acquisition press.
  - verifier (scope): **scope_ok** — Dated acquisition announcement (2024-12-18); stated as what Protege said. Note Calliope's own site gives 35,000+ hours for TV and film alone, so the larger figure must include news and sports or partner access.
- **c082** Protege said Calliope worked with over 70 data and content owners at acquisition.  
  _number · vendor_stated · as of 2024-12-18 (publication) · scope: Calliope Networks (pre-acquisition business)_ · **70 content owners (lower bound, 'over 70')** (vendor-stated partner count for Calliope at acquisition; at December 2024)
  - “over 70 leading data and content owners” — Protege, <https://withprotege.ai/articles/news/protege-acquires-calliope-networks-unlocking-premium-video-data-for-ai-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Calliope's homepage and FAQ give no count of content owners. No search available for acquisition coverage.
  - verifier (scope): **scope_ok**
- **c085** Calliope's site describes a 'License to Scrape', a voluntary collective licence under which creators authorise AI firms to use their videos.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Calliope Networks (pre-acquisition business)_
  - “Calliope Networks is pioneering the 'License to Scrape,' an innovative model that enables creators” — Calliope Networks, <https://calliopenetworks.ai/f/protege-acquires-calliope-networks> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c087** Calliope's site says its TV and film catalogue offers more than 35,000 hours of content including 4K and 3D formats.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Calliope Networks (pre-acquisition business)_ · **35000 hours of TV and film content (lower bound)** (vendor-stated Calliope catalogue size on its legacy site; conflicts in scale with Protege's 'hundreds of thousands of hours' figure; undated legacy page)
  - “Our industry-leading TV and film catalog offers more than 35,000 hours of diverse, high-quality, global content” — Calliope Networks, <https://calliopenetworks.ai/f/protege-acquires-calliope-networks> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about Calliope's own site, which is live on calliopenetworks.ai (different domain but the acquired company's own marketing, now marked 'Calliope is now a part of Protege!') and states 'more than 35,000 hours of diverse, high-quality, global content' 'including a broad selection of 4K and 3D formats'. No independent count exists.
  - verifier (scope): **scope_ok** — Same sentence is on calliopenetworks.ai homepage (fetched 2026-10-01). Page is undated legacy marketing; statement correctly scoped to TV and film.
- **c090** Protege says it will support a licensed path for bringing selected GrabMaps data assets to AI model builders.  
  _offer · vendor_stated · as of 2026-09-21 (publication)_
  - “Protege will support a clear, licensed path for bringing selected GrabMaps data assets to AI model builders” — Protege, <https://withprotege.ai/articles/news/protege-and-grabmaps-partner-to-bring-real-world-southeast-asian-streets-to-spatial-and-physical-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c094** Protege says it expanded its data partner network to hundreds of organisations in 2025.  
  _outcome · vendor_stated · as of 2026-01-07 (publication)_
  - “expanded its data partner network to hundreds of organizations” — Protege, <https://withprotege.ai/articles/news/protege-a16z-30million-fundraise/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent count. For context, Footwork (lead investor, 2025-08-13) wrote Protege 'works with over 100 data providers', which is consistent with growth to a larger number by year end but does not confirm 'hundreds'. No search available.
  - verifier (scope): **quote_incomplete** — The date in the statement is not in the quote; the page's words 'In 2025, Protege expanded its data partner network to hundreds of organizations' would show it.
- **c107** Protege said in August 2025 that it had access to over 300,000 hours of video and over 500,000 hours of audio.  
  _number · vendor_stated · as of 2025-08-13 (publication)_ · **300000 hours of video content accessible (lower bound)** (vendor-stated; 'access to' content held by partners, not owned inventory; audio stated as 500,000+ hours; at August 2025)
  - “access to over 300,000 hours of video content, over 500,000 hours of audio” — Protege, <https://withprotege.ai/articles/news/protege-series-a/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Footwork's Aug 2025 investor post gives no hours of video or audio. The Information's contemporaneous article (theinformation.com, 'The One-Year-Old Startup Notching Data Deals For Model Makers') is paywalled. No search available.
  - verifier (scope): **scope_ok** — Statement correctly says 'access to', which the page uses; these are partner-held hours, not owned inventory.
- **c108** Protege said in August 2025 that it had over 100 data partners across healthcare and media.  
  _number · vendor_stated · as of 2025-08-13 (publication)_ · **100 data partners (lower bound)** (vendor-stated count across healthcare and media; at August 2025)
  - “Protege has over 100 data partners across healthcare and media and boasts” — Protege, <https://withprotege.ai/articles/news/protege-series-a/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The lead investor restates the partner count on announcement day; it necessarily comes from the company, so relayed rather than independent. Note the investor lists four verticals (healthcare, media, audio and speech, motion capture), not only healthcare and media.
    - “It works with over 100 data providers across four verticals: healthcare, media, audio and speech, and motion capture data” — Footwork (Nikhil Basu Trivedi and Mike Smith, 2025-08-13), <https://nbt.substack.com/p/protege> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Matches Protege's wording ('healthcare and media'); the lead investor's same-day post names four verticals.
- **c113** Protege tells healthcare providers that they retain ownership of their data.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “You always retain ownership of your data” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c119** For healthcare, Protege reviews provider data and gets it ready for inclusion in future buyer datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “We review your data, align on quality and privacy standards, and get it ready for inclusion in future buyer datasets.” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c123** Protege says healthcare partners' data comprises 5B+ patient encounters.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_ · **5000000000 patient encounters (lower bound)** (vendor-stated aggregate across healthcare partners; label reads patient encounters; cumulative to date)
  - “5B+” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Aggregate across unnamed healthcare partners; no independent route. Segmed and HC1 are named partners but Protege's pages about them give no link to partner-published figures. No search available.
  - verifier (scope): **quote_incomplete** — Quote '5B+' alone does not show what is counted; the label on the page is 'Number of total patient encounters'.
- **c124** Protege lists 'Discretion around AI licensing activity' among reasons for providers to work with it rather than license directly.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Discretion around AI licensing activity” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c125** Protege lists established relationships with model labs among reasons providers should use it instead of licensing directly.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Established relationships with leading model labs and emerging AI companies” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c126** Protege lists operational support for packaging, delivery and compliance among reasons providers should use it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Operational support for packaging, delivery, and compliance” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c127** Protege's spatial provider page seeks egocentric video of diverse settings among other physical-AI data types.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Spatial & physical intelligence data_
  - “Egocentric video of diverse settings” — Protege, <https://withprotege.ai/data-provider/spatial> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c130** Protege's spatial buyer page claims 50k+ unique performers in its motion data offer.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Spatial & physical intelligence data_ · **50000 unique performers (lower bound)** (vendor-stated across spatial/motion datasets available through Protege; cumulative to date)
  - “50k+ Unique Performers” — Protege, <https://withprotege.ai/model-builders/spatial> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Motion-capture performer count is stated only by Protege; no named motion-data partner source reachable. No search available.
  - verifier (scope): **scope_ok** — Stat sits under the page's motion-capture block ('Broad & Diverse Motion Capture Content').
- **c132** Protege said AI builders will be able to access Dailymotion's catalogue of roughly 40 million videos through Protege.  
  _number · vendor_stated · as of 2026-07-16 (publication)_ · **40000000 videos in Dailymotion catalogue (approximate)** (vendor-stated size of partner catalogue made accessible; not a count of licensed or delivered videos; at July 2026)
  - “roughly 40 million videos” — Protege, <https://withprotege.ai/articles/news/dailymotion-protege-partnership-announcement-video/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Dailymotion's own press and news indexes (about.dailymotion.com/en/press/, /en/news/) list no Protege partnership or AI-licensing release in 2026; havas.com press page 404. No search available.
  - verifier (scope): **scope_ok** — Statement correctly says 'will be able to access'; catalogue size, not licensed or delivered volume.
- **c134** Protege says Sunain collects unscripted human behaviour through a global contributor network rather than synthetic data.  
  _offer · vendor_stated · as of 2026-02-02 (publication)_
  - “collecting real, unscripted human behavior via a global contributor network rather than relying on synthetic” — Protege, <https://withprotege.ai/articles/news/protege-and-sunain-partner-to-bring-global-scale-multimodal-human-data-to-ai-development/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c141** Protege says it works with dozens of data aggregators and healthcare providers to build its healthcare datasets.  
  _offer · vendor_stated · as of 2025-11-25 (publication) · scope: Healthcare datasets for model builders_
  - “Protege works with dozens of data aggregators and healthcare providers” — Protege, <https://withprotege.ai/articles/blog/healthcare-ai-case-study-millions-of-verified-imaging-studies-for-pre-training-in-30-days/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c144** Protege says it secures individual agreements with healthcare data providers and acts as intermediary to the end buyer.  
  _terms · vendor_stated · as of 2025-11-25 (publication) · scope: Healthcare datasets for model builders_
  - “by securing individual agreements with a broad network of healthcare data providers” — Protege, <https://withprotege.ai/articles/blog/healthcare-ai-case-study-millions-of-verified-imaging-studies-for-pre-training-in-30-days/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c015** Under the Media Terms a Licensed Dataset may include audiovisual content and related metadata, or other data the parties agree.  
  _architecture · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “audiovisual content and related metadata, or such other data as the parties may agree” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** For selected opportunities Protege works with providers on linkages and transformations to build a de-identified, buyer-ready dataset.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “we work with you on linkages and transformations to build a de-identified, buyer-ready dataset.” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c011** Dataset metadata including the licensor name, description and data sources is Protege's Confidential Information under the general Terms.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “licensor name, description, and data sources), are Confidential Information of Protege.” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** Protege's video buyer page lists content categories including Film & Television, Sports Action & Archives, News & Factual Programming and Real World / Real Life.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “Sports Action & Archives” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c137** Under the general Terms the Platform lets a customer view datasets that Protege makes available there.  
  _architecture · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Customer may use the Protege Platform ("Platform") to view datasets Protege makes available there” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### discovery

- **c003** Before purchase, customers on the Platform can see dataset information such as the dataset's source and number of records.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Customers can see information about the Datasets, such as the source of a Dataset, number” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c138** Customers can use the Platform to surface information such as how many records fit their criteria, a feasibility count before purchase.  
  _architecture · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Customer can use the Protege platform to surface additional information about the Dataset, such as how many records fit” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### trust

- **c013** The general Terms give no guarantee of accuracy, timeliness or availability of the datasets.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “with no guarantee of accuracy, timeliness, or availability.” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** The Media Terms provide the Licensed Dataset as is and as available, with no guarantee of accuracy or timeliness.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Licensed Dataset and Services are provided "as is" and "as available" with no guarantee of accuracy, timeliness” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c129** Protege says its healthcare evaluation test cases stay private and separate from model development, with contamination controls.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Test cases remain private and separate from model development with contamination controls” — Protege, <https://withprotege.ai/model-builders/healthcare-evaluation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c149** Protege says it can provide prospective buyers with dataset descriptions, metadata and representative samples before a licence is finalised.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “Our team can provide dataset descriptions, metadata, and representative samples” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c004** The general Terms describe Platform browsing as informing the customer's decision to purchase datasets from Protege, making Protege the seller.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Customers may perform these actions to inform their purchase decision for Datasets from Protege.” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c067** Protege's buyer pages offer no checkout; the call to action for model builders is 'Contact for Data Access'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contact for Data Access” — Protege, <https://withprotege.ai/model-builders> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A button label on Protege's own buyer pages.
  - verifier (scope): **scope_ok** — Absence of checkout recorded in the statement, CTA quoted, per rule 13.
- **c074** Protege's contact page routes model builders interested in data or benchmarking expertise to a contact form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Interested in Protege data or benchmarking expertise? Fill out the contact form below, and we'll be in touch.” — Protege, <https://withprotege.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c098** In the broadcaster case study Protege says it closed multiple enterprise licensing deals with AI companies using the content.  
  _outcome · vendor_stated · as of 2025-10-08 (publication)_
  - “Protege closed multiple enterprise licensing deals with marquee AI companies” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised case study; the AI-company buyers are not named. No search available.
  - verifier (scope): **scope_ok**
- **c101** In the broadcaster case study Protege says it advised the broadcaster on the negotiations with buyers.  
  _terms · vendor_stated · as of 2025-10-08 (publication)_
  - “advising the broadcaster on the negotiations” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c104** Protege says the sports distributor retained visibility throughout negotiations.  
  _terms · vendor_stated · as of 2025-10-17 (publication)_
  - “The distributor retained visibility throughout negotiations” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-sports-rights-distributor-unlocks-250k/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c002** Under the general Terms, a customer pays Protege an Access Fee before it may use the Protege Platform.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Upon payment of an Access Fee ("Access Fee") to Protege and subject to the terms” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** Under the Media Terms the customer's licence starts on payment of a Fee set in the Statement of Work.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Upon payment of a Fee, as set forth in the Statement of Work, to Protege” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** Protege says it decides with each healthcare provider how its dataset is packaged and licensed based on uniqueness, scale and applications.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “datasets. Together, we determine how your dataset should be packaged and licensed based on its” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c001** Protege's customer Terms of Service are entered into by Protege Health Inc., a Delaware corporation, and the customer accessing the Service.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “entered into by and between Protege Health Inc., a Delaware corporation” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** Protege itself grants the customer a non-exclusive, non-transferable, non-sublicensable, limited licence to the datasets under the general Terms.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Protege grants Customer a non-exclusive, non-transferable, non-sublicensable, and limited license” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Protege's own Terms; exists only on the vendor's site.
  - verifier (scope): **scope_ok**
- **c006** The general Terms licence permits training machine-learning or AI models that the customer owns or licenses.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “to train machine-learning or artificial intelligence models owned by or licensed by Customer” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c007** Where the general Terms conflict with a Statement of Work signed by Protege and the customer, the Statement of Work provision governs.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “If any provision of these Terms conflicts with a Statement of Work signed by Protege and” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Order-of-precedence clause in Protege's own Terms.
  - verifier (scope): **quote_incomplete** — Quote is cut before the rule; the page continues 'the Statement of Work supersedes and controls with respect to that provision'.
- **c008** The general Terms prohibit customers from attempting to re-identify data or records in the datasets.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Attempting to re-identify data or records in the Datasets;” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c009** The general Terms prohibit customers from creating synthetic datasets, data assets or other artifacts from the datasets.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Creating any synthetic datasets, data assets, or other artifacts from the Datasets;” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** Protege and its licensors may audit a customer on prior written notice to verify compliance with the agreement.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Protege and its licensors reserve the right to audit Customer, with prior written notice, to” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** Under the general Terms the customer indemnifies Protege and its licensors against third-party claims; no indemnity from Protege to the customer was found.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Customer shall indemnify Protege and its licensors for any third-party claims, losses, damages” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c014** Protege's Media Terms of Service are a separate customer contract between Protege Health Inc. and the entity accessing the Service, for audiovisual datasets.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Protege Health Inc., a Delaware corporation ("Protege"), and the entity or person accessing the Service ("Customer")” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** The Media Terms licence to the customer is non-exclusive, non-transferable, non-sublicensable and limited.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “non-exclusive, non-transferable, non-sublicensable, and limited license” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** Under the Media Terms, licensed audiovisual data may be used to train machine-learning or AI models owned or licensed by the customer.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “to train machine-learning or artificial intelligence models owned by or licensed by Customer” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c019** The Media Terms state that each Data Provider owns and retains all intellectual property rights in its content, not Protege.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “each applicable Data Provider owns and retains all Intellectual Property Rights in and to any and all of its” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** The Media Terms grant no name, image or likeness rights or publicity rights for individuals appearing in the licensed content.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “no 'name, image or likeness' rights or other statutory rights of publicity for individuals appearing in” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** Under the Media Terms, models trained on the data must not be used to generate digital replicas of people or characters appearing in it.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Models must not enable, power, or otherwise be used to generate digital replicas of people or characters” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** Under the Media Terms, models must not be used to re-identify persons in the Licensed Dataset.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Models must not be used to re-identify persons in the Licensed Dataset” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** Under the Media Terms, models must not output a substantial or verbatim copy of any scene or material portion of the licensed content.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Models must not provide a substantial or verbatim copy of any scene or material portion of any Licensed Content” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Under the Media Terms the licensee must not sell, sublicense, or authorise others to access, use or distribute the licensed data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Licensee must not sell, lease, sublicense, loan, assign, authorize others to access, use, disclose, distribute, or” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c027** Under the Media Terms Protege and its licensors may audit the customer within 30 days of written notice to verify compliance.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Protege and its licensors reserve the right to audit Customer within 30 days of written notice, to verify compliance” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c030** Under the Media Terms the customer defends and indemnifies Protege and its licensors against third-party claims.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Customer shall defend, indemnify, and hold harmless Protege and its licensors for any third-party” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** Under the Media Terms each party's aggregate liability is capped at amounts the customer paid under the agreement in a look-back period.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “total aggregate liability under the Agreement shall not exceed the amounts paid by Customer under the Agreement during” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c032** The Media Terms are governed by Delaware and United States law.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “Agreement will be governed by the laws of the State of Delaware and the United States without regard to conflicts” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** The provider's licence to Protege expressly includes the right to sublicense the data to Consumers, so Protege licenses buyers itself.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “This license expressly includes the right to sublicense such Data to Consumers in accordance with this Agreement.” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Under the Provider Terms, a Consumer who buys a licence may use the provider's data according to the licence type purchased.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Provider allows use of Data in accordance with the license type purchased by Consumer” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** The Provider Terms describe Consumer use as the internal business purpose of developing an algorithm or model.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “use of Data for the internal business purpose of developing an algorithm or model” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: fuzzy 0.92
- **c041** Under the Provider Terms Protege will not permit Consumers to attempt re-identification of de-identified datasets without the provider's prior approval.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Protege will not permit Consumer to: (i) attempt any re-identification of de-identified datasets” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** Protege tells video providers that licensed content is used exclusively for AI model training, fine-tuning, evaluation and benchmarking.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Licensed content is used exclusively for AI model training, fine-tuning, evaluation, and benchmarking.” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** Protege tells video providers that AI companies are generally not authorised to recreate proprietary information or original content.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “to recreate proprietary information or original content.” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c049** Protege states it does not permit Name-Image-Likeness duplication, copying or use from media companies' content.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “We do not permit Name-Image-Likeness (NIL) duplication / copying / use from media” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c118** Protege says licensing agreements define permitted uses and restrictions from the data source through to data licensees.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “how it is delivered. Third, all access is governed by clear licensing agreements that define” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c139** Protege may aggregate, anonymise or learn from data or feedback about a customer's use of the Services.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Protege may aggregate, anonymize, or otherwise learn from data or feedback relating to Customer” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c152** The only warranty in the general Terms is each party's authority to contract; no warranty of data-subject consent or releases is given to the buyer.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “Each Party represents and warrants that it has the legal right and authority to enter into the Agreement.” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Concerns the content of Protege's own Terms (warranty clause).
  - verifier (scope): **quote_incomplete** — Fact holds on the live Terms, but the quote shows only that one warranty exists, not that it is the only one; the page's 'Except as expressly provided herein, Protege makes no other warranties' shows that. An SOW could add warranties; the statement is correctly limited to the general Terms.
- **c153** The general Terms disclaim implied warranties including non-infringement.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Datasets under the general customer Terms of Service_
  - “implied warranties of merchantability, non-infringement, and fitness for a particular purpose.” — Protege, <https://withprotege.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c028** The Media Terms require the customer to maintain industry-standard technical and organisational measures to protect access to the Licensed Dataset.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “implement and maintain industry standard technical and organizational measures to protect access to the Licensed Dataset” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c099** Protege says it hosts provider content on a major cloud provider and the broadcaster uploaded its data to the Protege platform.  
  _architecture · vendor_stated · as of 2025-10-08 (publication)_
  - “Protege hosts its content on a secure major cloud provider” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c105** Protege says the sports distributor uploaded thousands of hours of content to the Protege platform, then tripled the volume as demand showed.  
  _architecture · vendor_stated · as of 2025-10-17 (publication)_
  - “uploaded thousands of hours of content to the Protege platform” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-sports-rights-distributor-unlocks-250k/> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.88
- **c117** Protege says datasets are handled through infrastructure with access controls that limit who can access the data and how it is delivered.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “infrastructure with access controls and protections that limit who can access the data and” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c122** Protege delivers the constructed dataset to the buyer and pays revenue share to the participating partner or partners.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “We deliver the dataset to the buyer and pay out revenue share to the participating partner(s).” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Protege's own description of its delivery and payout flow on its healthcare page.
  - verifier (scope): **scope_ok** — Applies to the healthcare data-provider page only ('deliver the dataset to the buyer'); it does not by itself settle custody for video, audio or spatial data.
- **c142** Protege says its delivery system transfers hundreds of terabytes and millions of files to buyers in hours.  
  _architecture · vendor_stated · as of 2025-11-25 (publication) · scope: Healthcare datasets for model builders_
  - “Protege has built a delivery system that allows for the transfer of hundreds of terabytes and millions of files” — Protege, <https://withprotege.ai/articles/blog/healthcare-ai-case-study-millions-of-verified-imaging-studies-for-pre-training-in-30-days/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c052** Protege says that, depending on dataset and jurisdiction, privacy handling may include automated detection and removal of personal identifiers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Automated detection and removal of personal identifiers” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c053** Protege lists sampling and quality assurance among the privacy steps it may apply to provider content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Sampling and quality assurance” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Protege lists optional anonymization or voice modification among the privacy steps it may apply.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Optional anonymization or voice modification” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c071** Protege says structured curation, quality control and rights verification are applied to its video datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “Structured curation, quality control, and rights verification ensure datasets meet the standards required” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c073** Protege's video preparation includes segmenting long-form content into scenes, evaluating visual quality and filtering for relevance.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “segmenting long-form content into scenes, evaluating visual quality, filtering for relevance” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c100** In the broadcaster case study Protege says it evaluated the partner's data for quality and metadata richness.  
  _offer · vendor_stated · as of 2025-10-08 (publication)_
  - “Protege evaluated the broadcaster's data for quality and metadata richness” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c116** Protege says healthcare datasets are prepared before sharing with de-identification, certification and tokenization.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “partners to prepare datasets appropriately before sharing, including de-identification,” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c143** Protege says expert determination is run on the final dataset for all Protege-delivered healthcare data.  
  _offer · vendor_stated · as of 2025-11-25 (publication) · scope: Healthcare datasets for model builders_
  - “as is the case for all Protege-delivered healthcare data” — Protege, <https://withprotege.ai/articles/blog/healthcare-ai-case-study-millions-of-verified-imaging-studies-for-pre-training-in-30-days/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c145** Protege says it evaluates all source data for completeness, metadata richness, technical quality and relevance when onboarded.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “Protege first evaluates all source data as it is onboarded into our network on generalizable factors” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c146** Protege says quality is evaluated again for each customer's specific dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “Quality is then evaluated again for each customer's specific dataset” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c150** Protege says all healthcare datasets are de-identified before being made available for AI development.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “All healthcare datasets are de-identified and processed using established privacy protection standards” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c056** Protege says video providers enter a revenue share agreement when licensing is formalised.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “We formalize licensing through a clear revenue share agreement and structure sustainable terms” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Protege says provider content is included in qualified deals and the provider receives revenue share payments.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Your content is included in qualified deals, and you receive transparent, timely revenue share” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** Protege says it has paid 'tens of millions' (currency not stated) to content partners to date.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video / audiovisual data providers_
  - “Paid to Content Partners To-Date” — Protege, <https://withprotege.ai/data-provider/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Payout totals appear only in Protege's own statements; Footwork (2025-08-13) and a16z (2026-01-08) investor posts give no payout figure. No search available.
  - verifier (scope): **quote_incomplete** — Quote is the label only; the amount on the page is the words 'Tens of Millions' directly above 'Paid to Content Partners To-Date'. Currency is indeed not stated.
- **c086** Calliope said creators in its License to Scrape would be compensated by a formula based on volume and subscriber count.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Calliope Networks (pre-acquisition business)_
  - “volume and subscriber count.” — Calliope Networks, <https://calliopenetworks.ai/f/protege-acquires-calliope-networks> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c088** Calliope says it operates on a revenue-share basis, negotiating with AI companies on behalf of rights holders and paying them most as royalties.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Calliope Networks (pre-acquisition business)_
  - “Calliope Networks operates on a revenue-share basis. We negotiate deals on behalf of our rights holders with AI companies” — Calliope Networks, <https://calliopenetworks.ai/faq> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c093** Protege says it provides revenue share payouts to data partners with each use of their data.  
  _terms · vendor_stated · as of 2026-01-07 (publication)_
  - “provides revenue share payouts to data partners with each use” — Protege, <https://withprotege.ai/articles/news/protege-a16z-30million-fundraise/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Protege's own description of its payout model; neither investor post (Footwork 2025-08-13, a16z 2026-01-08) states it. Related but different entity: Calliope Networks' FAQ (calliopenetworks.ai/faq, now part of Protege) says Calliope 'operates on a revenue-share basis' and pays 'the lion's share as royalties to the rights holders'.
  - verifier (scope): **scope_ok** — Source is the January 2026 funding announcement; the quote supports 'with each use'.
- **c096** Protege says an EMEA broadcaster earned over $1M in six months by licensing its scripted and cinematic library through Protege.  
  _outcome · vendor_stated · as of 2025-10-08 (publication)_
  - “A major EMEA-based broadcaster earned over $1M in 6 months by licensing its scripted and cinematic library” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised case study ('an EMEA broadcaster'); the counterparty is not named, so no independent route exists. No search available.
  - verifier (scope): **scope_ok**
- **c097** In the broadcaster case study Protege says the partner signed a standard revenue-share agreement based on future licensing deals.  
  _terms · vendor_stated · as of 2025-10-08 (publication)_
  - “standard revenue-share agreement based on any future licensing deals” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-broadcaster-earns-1m-in-6-months/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c102** Protege says a regional sports rights distributor earned $250,000+ in net-new revenue within months by licensing archival footage.  
  _outcome · vendor_stated · as of 2025-10-17 (publication)_
  - “This landed the distributor $250,000+ in net-new revenue in a matter of months” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-sports-rights-distributor-unlocks-250k/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised case study ('a regional sports rights distributor'); no independent route. No search available.
  - verifier (scope): **scope_ok**
- **c103** Protege says the sports distributor's revenue-share agreement covered any Protege deals that included its content.  
  _terms · vendor_stated · as of 2025-10-17 (publication)_
  - “signed a clean revenue-share agreement covering any Protege deals that included the distributor's content” — Protege, <https://withprotege.ai/articles/blog/media-partner-case-study-sports-rights-distributor-unlocks-250k/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c115** Protege tells healthcare providers that revenue is shared with them according to agreed partnership terms when developers license their data.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “shared with you according to the agreed partnership terms. This creates a new way to generate” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c135** Protege says Sunain's contributors record conversations, play games and capture activities in exchange for compensation paid by Sunain's network.  
  _terms · vendor_stated · as of 2026-02-02 (publication)_
  - “capture real-world activities in exchange for compensation” — Protege, <https://withprotege.ai/articles/news/protege-and-sunain-partner-to-bring-global-scale-multimodal-human-data-to-ai-development/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Sunain's own site (sunain.com, linked from Protege's announcement) is JS-rendered: homepage, sitemap.xml and /terms return only the tagline 'Be part of the growing AI economy', so Sunain's own description of contributor pay could not be read. No search available.
  - verifier (scope): **scope_wrong** — The statement adds a payer ('compensation paid by Sunain's network') that the page does not name. The page says Sunain operates 'The Human Data Network' where contributors 'record conversations, play games, and capture real-world activities in exchange for compensation'; who pays (Sunain, its clients or Protege) is not stated. Quote also omits that the contributors are Sunain's.

### post_sale

- **c025** Under the Media Terms a customer must cease use of a Licensed Dataset or Licensed Content during the Term if Protege gives notice to do so.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “if it receives notice from Protege that it must cease use of any Licensed Dataset or Licensed Content during the Term” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** Under the Media Terms licensed data must be fully deleted or returned upon termination or expiration.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Media (audiovisual) datasets_
  - “fully deleted or returned upon termination or expiration” — Protege, <https://withprotege.ai/media-terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c044** On termination of a provider agreement, Protege stops making the provider's data available for purchase or access by new Consumers.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Upon termination, Protege will no longer make Provider Data available for purchase or access by new Consumers” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c045** After a provider terminates, Consumers who already licensed its data keep access for an additional twelve months.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “Consumers who have previously licensed the Data have access to that Data for an additional twelve months” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** After a provider terminates, Consumers whose primary use is academic research keep access to the data for an additional three years.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Provider Terms (data providers)_
  - “enable Consumers whose primary use is academic research to have access to that Data for an additional three years” — Protege, <https://withprotege.ai/provider-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c066** A Siemens Healthineers quote on Protege's homepage says Protege helps find the data needed for a specific problem rather than simply being a data catalog.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “rather than simply being a data catalog.” — Protege, <https://withprotege.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c068** Protege's video buyer page offers SHOT (Selected Highlights Optimized for AI Training), audiovisual datasets of clipped scenes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “Selected Highlights Optimized for AI Training” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c070** Protege's video buyer page offers rapid sourcing and fulfilment aligned to AI development cycles, from a scoped request to a structured dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Video datasets for model builders_
  - “Rapid sourcing and fulfillment aligned to AI development cycles.” — Protege, <https://withprotege.ai/model-builders/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c078** Protege runs DataLab, a research team on data for AI, whose site shows research and a 'Collect Data' call to action rather than dataset listings.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “a team of research scientists committed to tackling the fundamental challenges and open questions regarding data for AI” — Protege DataLab, <https://datalab.withprotege.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c095** Protege says it aggregates data from providers via licensing agreements and also provides expertise for curating and creating datasets.  
  _offer · vendor_stated · as of 2026-01-07 (publication)_
  - “aggregates data sources from trusted data providers via licensing agreements” — Protege, <https://withprotege.ai/articles/news/protege-a16z-30million-fundraise/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c120** For each new buyer opportunity, Protege evaluates which partners' data best fits the use case, quality needs and timelines.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare data providers_
  - “For each new opportunity, we evaluate which partners' data best fits the use case, quality needs, and timelines” — Protege, <https://withprotege.ai/data-provider/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c128** Protege designs and runs real-world healthcare evaluations itself using de-identified healthcare data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Protege designs and runs real-world evaluations” — Protege, <https://withprotege.ai/model-builders/healthcare-evaluation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c147** Protege says it assembles custom datasets from its partner network to criteria such as modality, cohort, geography or time range.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “allowing us to assemble custom datasets that meet criteria such as modality, cohort characteristics, geography” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c148** Protege says it will source new data types if needed to meet a customer's requirements.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “including sourcing new data types if needed” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c151** Protege names a curated EHR and claims data product, CLERK, for training AI models on healthcare administration tasks.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Healthcare datasets for model builders_
  - “A curated EHR x Claims data product for training AI models for healthcare admin tasks” — Protege, <https://withprotege.ai/model-builders/healthcare> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c079** In December 2024 Protege announced it had acquired Calliope Networks, which aggregated media content for licensing.  
  _event · vendor_stated · as of 2024-12-18 (publication)_
  - “Protege today announced its acquisition of Calliope Networks, a leader in aggregating media content for licensing” — Protege, <https://withprotege.ai/articles/news/protege-acquires-calliope-networks-unlocking-premium-video-data-for-ai-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.93
- **c083** Calliope's CEO Davis became General Manager of Protege's media vertical after the acquisition.  
  _event · vendor_stated · as of 2024-12-18 (publication)_
  - “with Davis becoming General Manager of Protege” — Protege, <https://withprotege.ai/articles/news/protege-acquires-calliope-networks-unlocking-premium-video-data-for-ai-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c084** Calliope Networks' own site now states that Calliope is part of Protege.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Calliope Networks (pre-acquisition business)_
  - “Calliope is now a part of Protege!” — Calliope Networks, <https://calliopenetworks.ai/f/protege-acquires-calliope-networks> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c089** In September 2026 Protege announced a partnership with GrabMaps to bring Southeast Asian street data to spatial and physical AI.  
  _event · vendor_stated · as of 2026-09-21 (publication)_
  - “today announced a partnership with Grab” — Protege, <https://withprotege.ai/articles/news/protege-and-grabmaps-partner-to-bring-real-world-southeast-asian-streets-to-spatial-and-physical-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Grab's Singapore press index (grab.com/sg/press/, releases through 2026-09-23) has no Protege or GrabMaps data-licensing release; grabmaps.grab.com is JS-rendered and its sitemap's /resources list has no Protege item. No search available to find other coverage.
  - verifier (scope): **quote_incomplete** — Quote says only 'a partnership with Grab'; the statement's GrabMaps and Southeast Asian street data rest on the title. The words 'Protege and GrabMaps Partner to Bring Real-World Southeast Asian Streets' (the headline) would show it. Partnership is announced only on Protege's site; see blind note.
- **c110** In August 2025 Protege launched Audio & Speech and Motion Capture verticals.  
  _event · vendor_stated · as of 2025-08-13 (publication)_
  - “Last week, Protege launched two new verticals, Audio & Speech and Motion Capture” — Protege, <https://withprotege.ai/articles/news/protege-series-a/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c111** In September 2024 Protege announced a $10 million seed round led by CRV and the launch of its platform.  
  _event · vendor_stated · as of 2024-09-10 (publication)_
  - “The round was led by CRV” — Protege, <https://withprotege.ai/articles/news/protege-raises-10-million-and-launches-platform-for-ai-training-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c112** Protege says it was founded in 2024 by Samuels and Travis May.  
  _event · vendor_stated · as of 2024-09-10 (publication)_
  - “Protege was founded earlier in 2024 by Samuels and Travis May” — Protege, <https://withprotege.ai/articles/news/protege-raises-10-million-and-launches-platform-for-ai-training-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c131** In July 2026 Dailymotion and Protege announced a partnership making Dailymotion's video catalogue available for AI training and evaluation via Protege.  
  _event · vendor_stated · as of 2026-07-16 (publication)_
  - “Dailymotion and Protege today announced a partnership to make Dailymotion” — Protege, <https://withprotege.ai/articles/news/dailymotion-protege-partnership-announcement-video/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c133** In February 2026 Protege announced a partnership with Sunain, a supplier of multimodal human data.  
  _event · vendor_stated · as of 2026-02-02 (publication)_
  - “today announced a new partnership with Sunain” — Protege, <https://withprotege.ai/articles/news/protege-and-sunain-partner-to-bring-global-scale-multimodal-human-data-to-ai-development/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c091** In January 2026 Protege announced a $30 million Series A round led by Andreessen Horowitz.  
  _number · vendor_stated · as of 2026-01-07 (publication)_ · **30000000 USD equity raised** (vendor-announced Series A round (extension) led by a16z; one-off, January 2026)
  - “announced a $30 million Series A round led by Andreessen Horowitz (a16z)” — Protege, <https://withprotege.ai/articles/news/protege-a16z-30million-fundraise/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Found via a16z.com/announcement-sitemap.xml (lastmod 2026-01-08). The lead investor's own announcement confirms amount and lead; it calls it a '$30M round' and does not use the words 'Series A' (Protege describes it as an extension of its August 2025 Series A).
    - “leading a $30M round in Protege, the platform building the real-world data infrastructure for AI” — Andreessen Horowitz (Daisy Wolf and Eva Steinman, 2026-01-08), <https://a16z.com/announcement/investing-in-protege-ai/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Blind step found no independent source other than the investor's own post; the profile's source is Protege's own article.
- **c092** Protege says the January 2026 round brought its total funding to $65 million since its founding in 2024.  
  _number · vendor_stated · as of 2026-01-07 (publication)_ · **65000000 USD total equity raised** (vendor-stated cumulative funding since founding; cumulative to January 2026)
  - “brings total funding to $65 million since the company's founding in 2024” — Protege, <https://withprotege.ai/articles/news/protege-a16z-30million-fundraise/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Investor posts independently confirm $25M (Footwork, Aug 2025) and $30M (a16z, Jan 2026) = $55M; the remaining ~$10M implied by the $65M total (pre-Series A funding) and the 2024 founding date appear only in Protege's statement. Footwork says Protege 'launched last year' (i.e. 2024) but gives no seed amount. No Form D found on EDGAR (company search 'protege' and full-text 'Protege Health' Form D return nothing for this company). No search available to find seed-round press.
  - verifier (scope): **scope_ok**
- **c106** In August 2025 Protege announced a $25 million Series A round led by Footwork.  
  _number · vendor_stated · as of 2025-08-13 (publication)_ · **25000000 USD equity raised** (vendor-announced Series A round led by Footwork; one-off, August 2025)
  - “announced the close of a $25 million Series A funding round.” — Protege, <https://withprotege.ai/articles/news/protege-series-a/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Lead investor's own post, reached from the Protege entry on footwork.vc's portfolio list. Also names CRV, Flex Capital, Shaper Capital, Bloomberg Beta and Liquid 2 as participating existing investors.
    - “Protege's $25M Series A, led by Footwork” — Footwork (Nikhil Basu Trivedi and Mike Smith, 2025-08-13), <https://nbt.substack.com/p/protege> · third_party_docs · retrieved 2026-10-01 · quote check: fuzzy 0.83
  - verifier (scope): **quote_incomplete** — Quote gives the amount but not the lead; the page's next sentence 'The round was led by Footwork' would show it.
- **c109** Protege said it grew its business 20x (metric not stated) before the August 2025 Series A.  
  _outcome · vendor_stated · as of 2025-08-13 (publication)_
  - “After growing its business 20x in 2025, Protege will use the Series A” — Protege, <https://withprotege.ai/articles/news/protege-series-a/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: Protege's lead Series A investor Footwork said in August 2025 that Protege had grown more than 20x in GMV in 2025 compared with 2024. — The metric is stated: GMV (gross merchandise value), 2025 year-to-date vs 2024. The figure is still the company's own, relayed by its investor, not audited.
    - “Protege has grown more than 20X in GMV already in 2025 up from 2024” — Footwork (Nikhil Basu Trivedi and Mike Smith, 2025-08-13), <https://nbt.substack.com/p/protege> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Matches Protege's page, which indeed does not name the metric; the lead investor's post names it as GMV (see blind verdict).
- **c140** In a vendor case study a healthcare AI model company came to Protege for radiology imaging data to improve an imaging model.  
  _outcome · vendor_stated · as of 2025-11-25 (publication) · scope: Healthcare datasets for model builders_
  - “A leading AI model company building for healthcare AI use cases came to Protege looking to accelerate” — Protege, <https://withprotege.ai/articles/blog/healthcare-ai-case-study-millions-of-verified-imaging-studies-for-pre-training-in-30-days/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Anonymised healthcare case study; no named customer. No search available.
  - verifier (scope): **quote_incomplete** — Quote stops before the radiology and imaging model; the same sentence continues 'to accelerate their imaging model's performance, focusing on a radiology use case'.

## Added by the verifier

- **v001** Protege's lead investor a16z said in January 2026 that Protege is a core data partner to the majority of the 'MAG7' public technology companies.  
  _outcome · independent · as of 2026-01-08 (publication)_
  - “is a core data partner to the majority of MAG7 public companies, as well as many of the largest private players in AI” — Andreessen Horowitz (Daisy Wolf and Eva Steinman, 2026-01-08), <https://a16z.com/announcement/investing-in-protege-ai/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v002** Protege's lead Series A investor Footwork said in August 2025 that Protege had most of the major foundation-model companies as customers, plus many application-layer AI companies.  
  _outcome · independent · as of 2025-08-13 (publication)_
  - “Protege has landed most of the major foundational model companies as customers” — Footwork (Nikhil Basu Trivedi and Mike Smith, 2025-08-13), <https://nbt.substack.com/p/protege> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v003** Footwork said in August 2025 that Protege's GMV in 2025 had already grown more than 20 times over 2024.  
  _number · independent · as of 2025-08-13 (publication)_ · **20 times growth in GMV (lower bound, 'more than 20X')** (gross merchandise value, 2025 year-to-date vs 2024; stated by investor, figures from the company; 2025 vs 2024)
  - “Protege has grown more than 20X in GMV already in 2025 up from 2024” — Footwork (Nikhil Basu Trivedi and Mike Smith, 2025-08-13), <https://nbt.substack.com/p/protege> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.buyer_vetting` — not_published; tried <https://withprotege.ai/terms-of-service>, <https://withprotege.ai/media-terms-of-service>, <https://withprotege.ai/contact>, <https://withprotege.ai/model-builders>
- `matrix.versioning` — not_published; tried <https://withprotege.ai/terms-of-service>, <https://withprotege.ai/media-terms-of-service>, <https://withprotege.ai/provider-terms>, <https://withprotege.ai/model-builders/healthcare>
- `matrix.contributor_pay_model` — not_published; tried <https://withprotege.ai/data-provider/video>, <https://withprotege.ai/provider-terms>, <https://withprotege.ai/articles/news/protege-and-sunain-partner-to-bring-global-scale-multimodal-human-data-to-ai-development/>, <https://calliopenetworks.ai/f/protege-acquires-calliope-networks>
- `other.revenue_share_split` — not_published; tried <https://withprotege.ai/provider-terms>, <https://withprotege.ai/data-provider/video>, <https://withprotege.ai/data-provider/healthcare>, <https://calliopenetworks.ai/faq>
- `other.access_fee_and_prices` — not_published; tried <https://withprotege.ai/terms-of-service>, <https://withprotege.ai/model-builders>, <https://withprotege.ai/model-builders/video>, <https://withprotege.ai/model-builders/healthcare>
- `other.platform_listings` — gated; tried <https://app.withprotege.ai/>, <https://datalab.withprotege.ai/>, <https://withprotege.ai/sitemap.xml>
- `other.statement_of_work` — not_published; tried <https://withprotege.ai/terms-of-service>, <https://withprotege.ai/media-terms-of-service>
- `other.independent_traction` — paywalled; tried <https://www.theinformation.com/articles/one-year-old-startup-notching-data-deals-model-makers>, <https://efts.sec.gov/LATEST/search-index?q=%22Protege%20Health%22&forms=D>, <https://www.sec.gov/cgi-bin/browse-edgar?company=protege&type=D&dateb=&owner=include&count=40&action=getcompany>, <https://www.courtlistener.com/?q=%22Protege+Health%22>
- `other.web_search_unavailable` — blocked
- `other.media_buyer_delivery` — not_published; tried <https://withprotege.ai/model-builders/video>, <https://withprotege.ai/media-terms-of-service>
- `other.place_property_consent` — not_published; tried <https://withprotege.ai/provider-terms>, <https://withprotege.ai/media-terms-of-service>, <https://withprotege.ai/data-provider/spatial>

## Conflicts

- c047, c018: Marketing FAQ says use is limited to training, fine-tuning, evaluation and benchmarking; the live Media Terms grant only training of customer-owned or licensed models, with purposes set in the SOW. The legal text governs; fine-tuning/evaluation are not named in either customer template. (live_primary_wins_terms)
- c035, c056: Provider Terms grant Protege a royalty-free licence and are silent on payment, while provider pages and case studies describe a revenue-share agreement; the revenue share presumably sits in a separate Schedule or agreement that is not public. (unresolved)
- c081, c087: Protege said Calliope brought hundreds of thousands of hours; Calliope's own legacy page states 35,000+ hours for its TV and film catalogue. Different scopes or dates may explain it; neither is independently verified. (unresolved)
- c045, c025: Provider Terms promise existing buyers 12 more months of access after a provider leaves; Media Terms let Protege order a buyer to cease use during the Term. How a provider exit or takedown is handled for media buyers is not stated. (unresolved)

## Leads, not cited

- <https://www.theinformation.com/articles/one-year-old-startup-notching-data-deals-model-makers> — Independent reporting on Protege deals (Natasha Mascarenhas); paywalled.
- <https://withprotege.substack.com> — Vendor Substack with launch posts; not fetched.
- <https://withprotege.ai/articles/news/protege-and-toughdata-partner-to-unlock-human-skill-data-for-physical-ai-applications/> — Physical-AI human skill data supplier; may show capture/consent model.
- <https://withprotege.ai/articles/blog/render-ready-case-study-clothing/> — 3D asset case study; possible buyer-side delivery detail.
- <https://withprotege.ai/articles/blog/protege-ai-navigating-training-data-privacy-and-ethics/> — Vendor view on privacy and ethics of training data.
- <https://withprotege.ai/data-provider/audio-speech> — Audio provider page; likely repeats NIL/voice ban for audio.
