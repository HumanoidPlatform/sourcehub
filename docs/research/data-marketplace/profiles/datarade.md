# Datarade

independent_marketplace · light · status: **active** · also known as Datarade.ai, Monda Labs GmbH

> Rendered from `ledger/datarade.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “AI-Ready Data Products / Datasets on the Datarade Marketplace ('Products' in its ToS)” and its bespoke side “Data requests ('Post your data request', 'postings' in its ToS) answered by providers' proposals, plus free sourcing advice from its data acquisition specialists”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | venue | c003, c004, c006, c014 | Monda Labs is not a party to buyer-seller contracts and neither buys nor sells data; each Seller is licensor. |
| economics_model | mixed | c024, c029, c030, c031, c032, c033, c008 | Provider subscription ($0, $6,000 or $12,000 a year) plus a 15-30% commission; the commission's base is not published. |
| who_pays_fee | seller | c024, c013, c029, c063 | Buyers pay nothing to Datarade; the provider pays membership and commission. |
| supply_models | third_party_providers | c020, c061, c007, c026 | Only incorporated companies list; Datarade collects nothing itself. Some providers source from their own photographer or consumer platforms. |
| custody_model | provider_delivers | c066, c044, c069 | Datarade hosts only sample previews; full data goes from the provider to the buyer by the methods the provider lists (S3, SFTP, API, email, GCS). |
| transaction_mode | contact_sales | c005, c056, c047, c019, c074 | No checkout seen, even on fixed-price listings; buyers contact the provider or request pricing. |
| public_prices | some | c040, c052, c039, c030 | Some listings show provider-set starting prices; most image/video listings say 'Pricing available upon request'. Provider plan prices are public. |
| licence_model | provider_defined | c014, c003, c069 | No platform licence for data; terms are in each buyer-seller agreement, which is not published on listings. |
| exclusivity_offered | unknown |  | Nothing on the ToS, policies or listings fetched says whether exclusivity can be bought. |
| public_listing | public_summary_gated_detail | c039, c046, c010, c068 | Listing pages and prices were readable without an account; data previews need sign-in and contact details. |
| buyer_vetting | account_only | c012, c067, c072 | Business email required and business use only; the operator may ask for evidence of business capacity at its discretion. Sellers qualify their own leads. |
| sample_mechanics | preview_in_browser | c010, c046, c018, c041 | Previews on Datarade in exchange for contact details, with personal-data columns redacted; some listings instead offer a sample on request. |
| versioning | unknown |  | Listings show update frequency but nothing on revisions or what a past buyer keeps. |
| human_subject_consent_docs | asserted_only | c015, c060, c042, c045 | Policies require consent and listings assert it; no consent or release documents are shown to buyers on the platform. |
| contributor_pay_model | not_applicable | c020 | Datarade admits only companies as providers and pays no individual capturers; how providers such as DataSeeds.AI pay their photographers is not disclosed. |
| catalogue_plus_custom | both | c076, c062, c064, c025, c059 | Datarade brokers both: listed products and buyer data requests answered by providers; it collects nothing itself. |
| erasure_after_sale | unknown |  | Takedown can remove a listing ([datarade-c065], [datarade-c070]) but whether buyers must delete copies depends on unpublished buyer-seller agreements. |
| quality_evidence | provider_asserted | c006, c017, c043, c009 | Product pages are written only by Sellers; the operator reviews provider applications and shows a 'Verified Data Provider' badge, but quality figures (e.g. '97% Accuracy') are the provider's. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers must be businesses (business email, no private use); Datarade claims 120k monthly visitors and lists 718 AI-training datasets. Image/video is sold per purchase with listed starts of $10,000-$20,000; why buyers choose catalogue over custom is not published. | c072, c012, c027, c055, c038, c040, c052 |
| Q2 | partial | Listing buys reach (vendor-stated 120k monthly visitors), qualified leads, buyer intent insights and access to a pool of buyer data requests, for $0-$12,000 a year plus 15-30% commission. | c027, c035, c036, c028, c029, c030, c032, c051 |
| Q3 | sourced | All inventory comes from incorporated third-party providers under a separate Seller Agreement, which must hold the rights, licences or consent to distribute; web data only if publicly sourced. Providers' own sourcing varies (photographer competitions, own consumer platform). | c020, c061, c007, c060, c016, c023, c058, c048 |
| Q4 | unknown |  |  |
| Q5 | sourced | Venue: Monda Labs is not a party to buyer-seller contracts and neither buys nor sells data, so the Seller is licensor. Sellers commit to rights and consent via the Seller Agreement and Publishing Policies; each Customer indemnifies the operator for IP claims over Content it posts. | c003, c004, c014, c007, c060, c071 |
| Q6 | partial | Datarade says it does not host or deliver data; providers deliver by the methods they list (S3, SFTP, APIs, email, Google Cloud Storage). Only sample previews sit on Datarade. | c066, c044, c010 |
| Q7 | partial | Policies ban personal data without legal authority and valid consent and require documentation of collection; listings only assert consent or model/property releases. Capturer consent is not addressed. | c015, c022, c021, c060, c042, c045, c048 |
| Q8 | partial | Data licence terms live in the unpublished buyer-seller agreement. Platform terms bar copying outside Datarade unless agreed with a Seller and allow removal of reported content; nothing on exclusivity, audit or fingerprinting. | c069, c065, c070, c014 |
| Q9 | sourced | Contact-sales: buyers contact providers, chat or request pricing, even on fixed-price listings. Datarade is free to buyers and earns a provider subscription plus 15-30% commission. | c005, c056, c047, c019, c024, c029, c031, c033, c013 |
| Q10 | partial | Objects are Seller-published product pages (declaring pricing models such as one-off, monthly, yearly, usage-based), provider profiles and buyer postings. No order or entitlement object is visible; revisions and withdrawals are not addressed. | c006, c057, c008, c011, c054 |
| Q11 | sourced | Registered buyers preview samples in exchange for contact details, with personal-data columns redacted and samples required to be representative. Trust signals are a 'Verified Data Provider' badge, reviews and curated listings; quality figures are provider-written. | c010, c018, c017, c043, c073, c009, c053, c041 |
| Q12 | sourced | The catalogue side is 'AI-Ready Data Products'; the custom side is free buyer data requests ('Post your data request') answered by providers within 24-48 hours, plus free sourcing advice. Providers such as DataSeeds.AI offer custom collection on their listings. | c076, c062, c064, c011, c036, c025, c059 |

## Claims

### positioning

- **c001** Datarade's terms page carried a 2026 copyright notice for Datarade, Monda Labs GmbH when fetched on 2026-10-01, showing the marketplace is live.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “©2026 Datarade, Monda Labs GmbH” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Confirms the 'live marketplace' part only: a June 2026 academic paper treats Datarade as an operating marketplace and crawled 4,396 of its products (Table I; crawl date not stated). The 2026 copyright line itself is by nature vendor-only (seen on datarade.ai/company/legal-notice and /terms-of-service as '©2026 Datarade, Monda Labs GmbH'). Company-register data relayed by North Data (northdata.com, Monda Labs GmbH, Amtsgericht Charlottenburg HRB 199191 B) shows the entity was formerly Datarade GmbH (still so named on 9 Oct 2024), filed its 2024 annual accounts on 29 Dec 2025, and shows no insolvency or liquidation entry. No search available: no press, layoffs, funding or acquisition news could be looked for; EDGAR full-text search for 'Datarade' returns 0 hits; the HTGF portfolio page for Datarade gives no status. Note also that the old datarade.ai/terms URL now 404s; the ToS lives at /company/terms-of-service.
    - “giving rise to many data marketplaces, e.g., AWS Marketplace, Databricks, and Datarade” — Sun et al., DaDaDa: A Dataset for Data Pricing in Data Marketplaces (arXiv, 13 Jun 2026), <https://arxiv.org/html/2607.08785v1> · academic · retrieved 2026-10-01 · quote check: exact
- **c005** Datarade's ToS describe the platform's features as supporting search, communication and lead generation.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “various functional features supporting search, communication, and lead generation” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Datarade says it launched the Datarade Marketplace in 2020.  
  _event · vendor_stated · as of 2020 (page_dated)_
  - “Launch of Datarade Marketplace” — Datarade (Monda Labs GmbH), <https://datarade.ai/company> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c049** Datarade says it passed $1M+ ARR and its Data Commerce Cloud's 500th customer in 2023 (vendor-stated).  
  _number · vendor_stated · as of 2023 (page_dated)_ · **1000000 USD annual recurring revenue (at least)** (vendor-stated company ARR, all products; not independently verified; per year)
  - “Celebrating $1M+ ARR and DCC's 500th customer” — Datarade (Monda Labs GmbH), <https://datarade.ai/company> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Datarade says it raised a EUR 1.2M pre-seed round from Techstars, High-Tech Gruenderfonds and HPI Seed Fund (dated 2019 on its company page).  
  _event · vendor_stated · as of 2019 (page_dated)_
  - “1.2M pre-seed funding from Techstars” — Datarade (Monda Labs GmbH), <https://datarade.ai/company> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c075** Datarade's legal notice gives the operator Monda Labs GmbH's registration as Amtsgericht Charlottenburg, HRB 199191 B.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Amtsgericht Charlottenburg, HRB 199191 B” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/legal-notice> · legal_terms · retrieved 2026-10-01 · quote check: exact

### supply

- **c020** Datarade's Publishing Policies define a provider as an incorporated, active company publishing listings for products it offers.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “An incorporated, active company that publishes Listings on Datarade referring to Products offered by the company.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A definition in Datarade's own Publishing Policies; by nature vendor-only.
- **c023** Datarade's Publishing Policies prohibit products containing web data unless it is sourced from publicly available sources.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Contain Web Data unless it is sourced from publicly available sources” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** Datarade says buyers can compare data products from 2700+ data providers (vendor-stated count).  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “find and compare data products from 2700+ trusted data providers worldwide, for free” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** Datarade's search for 'image datasets' returned 137 product results on 2026-10-01.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **137 product listings** (search result count for the query 'image datasets'; includes non-image products; snapshot)
  - “137 product results” — Datarade (Monda Labs GmbH), <https://datarade.ai/search/products/image-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** Woilo's Indonesian UGC image and video listing on Datarade says the content comes from its own consumer platform, with no consent statement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “our own consumer platform” — Woilo (listing on Datarade), <https://datarade.ai/data-products/large-scale-indonesian-ugc-image-video-dataset-for-ai-training-woilo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Datarade says 500 data providers use its B2B SaaS product (vendor-stated).  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “500 Data providers using our B2B SaaS product” — Datarade (Monda Labs GmbH), <https://datarade.ai/company> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Datarade's AI training data category listed 718 datasets on 2026-10-01.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **718 dataset listings** (category count shown on the AI training data category page, all modalities; snapshot)
  - “718 AI Training Data Datasets” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-categories/ai-ml-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** DataSeeds.AI's image listing on Datarade says its images are collected through a gamified competition platform for photographers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Images are collected through a proprietary gamified platform for photographers.” — DataSeeds.AI (listing on Datarade), <https://datarade.ai/data-products/15m-images-ai-training-data-annotated-imagery-data-for-a-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c061** Datarade's provider FAQ says legally registered businesses of all sizes may list on the Datarade Marketplace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We welcome legally registered businesses of all sizes to list on the Datarade Marketplace.” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Eligibility wording in Datarade's own provider FAQ; by nature vendor-only.

### object_model

- **c057** Datarade listings such as Xverum's declare which pricing models a product supports, including a yearly licence alongside one-off, monthly and usage-based options.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Yearly License” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/ai-search-data-global-coverage-real-time-xverum> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c006** Under Datarade's ToS product pages are published exclusively by Sellers, not by the operator.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Product pages are published exclusively by Sellers.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c068** Datarade's ToS list viewing and purchasing Products, interacting with Sellers and submitting Reviews as registration-based services.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “viewing and purchasing Products, interacting with Sellers and submitting Reviews” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### discovery

- **c009** Under Datarade's ToS search listing pages of Sellers and Products may be curated algorithmically and/or manually by the operator.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Such listings may be curated algorithmically and/or manually by Platform Operator.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### trust

- **c010** Under Datarade's ToS registered buyers can preview data samples only in exchange for providing their contact information.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Registered Customers may access previews of data samples in exchange for providing their contact information.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Datarade's Publishing Policies require data sample previews to be representative of the actual data quality and completeness.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Be representative of the actual Data quality and completeness” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** Datarade's Publishing Policies say Datarade automatically redacts sample-preview columns that potentially contain Personal Data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Datarade will automatically redact any columns that potentially contain Personal Data” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c041** Nexdata's Face Anti-spoofing listing on Datarade offers a 'Request Data Sample' button rather than a download.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request Data Sample” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Nexdata's listing on Datarade asserts in its own description that its anti-spoofing data was collected with consent; no consent documents are shown.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All the anti-spoofing data is collected with consent” — Nexdata (listing on Datarade), <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** Nexdata's Datarade listing carries a 'Verified Data Provider' badge.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Verified Data Provider” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c046** M-ART's listing on Datarade gates its data preview behind sign-in ('Sign In To Preview Data').  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sign In To Preview Data” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c053** Datarade's video-data category page says many providers offer free samples for buyers to evaluate.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Many providers offer free samples, allowing you to evaluate the suitability of Video Data for your needs.” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-categories/video-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c073** Under Datarade's ToS users may submit Reviews relating to Sellers.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Users may submit Reviews relating to Sellers” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### transaction

- **c003** Under Datarade's ToS the platform operator is not a party to any contract between buyers and sellers (both are 'Customers').  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Platform Operator is not a party to any contractual relationships between Customers.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Datarade's own ToS. Seen on datarade.ai/company/terms-of-service: 'Platform Operator is not a party to any contractual relationships between Customers.' No independent restatement expected.
- **c004** Under Datarade's ToS the operator does not sell or buy any data Products and acts only as an intermediary service provider.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Platform Operator does not sell or buy any Products; it solely acts as an intermediary service provider” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c014** Under Datarade's ToS payment for data Products is owed under the separate agreement between the buyer and the Seller.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “obligation to pay for Products in accordance with the respective agreements between Customer and a Seller remains unaffected” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Datarade's own ToS. Seen on datarade.ai/company/terms-of-service: 'Customer's obligation to pay for Products in accordance with the respective agreements between Customer and a Seller remains unaffected.'
- **c035** Datarade providers receive buyer inquiries and qualified leads and manage deals through the sales pipeline in the Datarade Provider Studio.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Receive and accept qualified leads, communicate with buyers, and move deals through the sales pipeline” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c047** M-ART's listing on Datarade offers 'Contact Provider' as the primary action and no checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contact Provider” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Even Xverum's fixed-price listing on Datarade offers 'Request detailed pricing' and 'Contact Provider' rather than a buy button.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request detailed pricing” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/ai-search-data-global-coverage-real-time-xverum> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Button labels on a Datarade listing page. Xverum's own homepage (xverum.com) does not mention Datarade or prices; it offers 'Start free' and 'Get in touch'.
- **c074** Under Datarade's ToS registered buyers may message Sellers through an instant messaging or chat function.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Registered Customers may send messages to and communicate with Sellers via an instant messaging or chat functionality” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### pricing

- **c008** Under Datarade's ToS Sellers can publish and maintain their own provider profile pages only while they hold an active subscription.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “provided that the respective Seller holds an active subscription” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** Under Datarade's ToS a Customer owes the operator no remuneration for its Services.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Customer owes no remuneration for Platform Operator's Services” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c019** Datarade's Publishing Policies let providers withhold exact prices, in which case buyers contact the provider for a quote.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “If you do not want to disclose exact numbers, Users can contact you for a quote.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Datarade tells buyers its service is free to them and that it is paid by the provider if the buyer makes a purchase.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our service is free for you. We're paid by the provider in case you make a purchase.” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what Datarade tells buyers. The ToS separately says 'Customer owes no remuneration for Platform Operator's Services'. The June 2026 DaDaDa paper (arXiv 2607.08785) describes Datarade's price modes but says nothing on who pays Datarade. No search available for a provider or journalist describing the fee flow.
- **c029** Datarade's Commission-only provider plan carries a 30% commission with a $0 annual fee.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Provider Studio, Commission-only_ · **30 percent** (commission paid by the provider; what it is levied on is not stated on the page; per deal)
  - “30% commission” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available, and no partner, provider or press page restating Datarade's provider plan table could be reached by navigation (provider help centre has no fee article; EDGAR 0 hits; arXiv DaDaDa paper silent on fees). The vendor page providers.datarade.ai/apply, fetched 2026-10-01, shows 'Commission-only' at '$0 / year' and '30% commission' with no small print on what the commission is charged on.
- **c030** Datarade's Bronze provider plan costs $6,000 per year.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Provider Studio, Bronze_ · **6000 USD** (membership fee paid by the provider; per year)
  - “$6,000 / year” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available; no independent restatement reachable (same routes as c029). Vendor page providers.datarade.ai/apply shows Bronze at '$6,000 / year'.
- **c031** Datarade's Bronze provider plan carries a 20% commission on top of its annual fee.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Provider Studio, Bronze_ · **20 percent** (commission paid by the provider; base not stated; per deal)
  - “20% commission” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available; no independent restatement reachable (same routes as c029). Vendor page shows Bronze '20% commission'; the page does not say what revenue the commission applies to.
- **c032** Datarade's Silver provider plan costs $12,000 per year.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Provider Studio, Silver_ · **12000 USD** (membership fee paid by the provider; per year)
  - “$12,000 / year” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c033** Datarade's Silver provider plan carries a 15% commission on top of its annual fee.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Provider Studio, Silver_ · **15 percent** (commission paid by the provider; base not stated; per deal)
  - “15% commission” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available; no independent restatement reachable (same routes as c029). Vendor page shows Silver at '$12,000 / year' and '15% commission'.
- **c039** Most listings on Datarade's 'image datasets' results page show 'Pricing available upon request' instead of a price.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pricing available upon request” — Datarade (Monda Labs GmbH), <https://datarade.ai/search/products/image-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c040** Nexdata's Face Anti-spoofing listing on Datarade shows a provider-set price starting at $10,000 per purchase.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexdata Face Anti-spoofing Data, One-off purchase_ · **10000 USD per purchase** (provider-listed starting price paid by the buyer to the provider, one-off purchase; one-off)
  - “Starts at $10,000 / purchase” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Nexdata's own storefront (a nexdata.ai subdomain, 'Powered by Datarade') shows the '200,000 ID' Face Anti-spoofing product at 'Starts at $10K', one-off, with monthly, yearly and usage-based licences 'Not available' and a 'Request Information' button. It is the same provider-entered data served by Datarade's software, so it only shows the price is stated consistently. nexdata.ai itself publishes no prices. The claim does not say which of Nexdata's face anti-spoofing listings it means.
    - “Starts at $10K” — Nexdata (storefront powered by Datarade), <https://data.nexdata.ai/products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **c052** Nexdata's Multimodal Video Data (500,000 person) listing on Datarade shows a provider-set price starting at $20,000 per purchase.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexdata Multimodal Video Data | 500,000 Person_ · **20000 USD per purchase** (provider-listed starting price paid by the buyer to the provider; one-off)
  - “Starts at $20,000 / purchase” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-categories/video-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Nexdata's Datarade-powered storefront shows the 500,000-person Multimodal Video Data at 'Starts at $20K' (one-off; monthly, yearly and usage-based 'Not available'; button 'Request Information'). Same provider-entered data on Datarade's software, so relayed rather than independent.
    - “Starts at $20K” — Nexdata (storefront powered by Datarade), <https://data.nexdata.ai/products/nexdata-multimodal-video-data-500-000-person-nexdata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **c054** Datarade's video-data category page says pricing models may include one-off purchases, subscriptions or usage-based fees, set by factors such as size and customisation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The cost of Video Data depends on factors like the datasets size, scope, update frequency, and customization” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-categories/video-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c063** Datarade describes posting a data request as free of charge for buyers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Free of charge” — Datarade (Monda Labs GmbH), <https://datarade.ai/postings/new> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c016** Datarade's Publishing Policies require providers to ensure they have the right to use and distribute the Data they list.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “ensure you have the right to use and distribute the Data” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c045** M-ART's drone video listing on Datarade claims its content is 100% rights-cleared with model and property releases.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “100% rights-cleared with model and property releases” — M-ART (listing on Datarade), <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c069** Under Datarade's ToS copying any component of Datarade outside the platform is prohibited unless agreed with a Seller.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “unless such download or copy is agreed upon with a Seller” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c071** Under Datarade's ToS each Customer indemnifies the operator against alleged third-party IP infringement due to Content it made available.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “alleged infringement of a third party's intellectual property rights due to Content” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c044** Nexdata's Datarade listing lists delivery methods including S3 Bucket, SFTP, Email and REST API.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “S3 Bucket” — Datarade (Monda Labs GmbH), <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c066** A Datarade blog article (16 Sep 2025) says Datarade does not host or deliver data and focuses on discovery, comparability and transparency.  
  _architecture · vendor_stated · as of 2025-09-16 (page_dated)_
  - “Datarade doesn't host or deliver data, instead, it focuses on discovery, comparability, and transparency.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/blog/ai-ready-data-marketplaces> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim reports what a Datarade blog article says. Circumstantial support that the provider, not Datarade, delivers: Nexdata's Datarade-powered storefront (data.nexdata.ai) ends every product page in 'Request Information' rather than a download. No independent description of Datarade's custody model was found (no search available).

### vetting

- **c007** Under Datarade's ToS a Seller must accept Seller Commitments, including Datarade's Publishing Policies, in a separate Seller Agreement.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Essential Seller Commitments will include, but are not limited to, the Publishing Policies” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** Under Datarade's ToS registration requires a business email address; private accounts such as gmail.com are not permitted.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “trashmail addresses and private accounts (gmail.com, etc.) are not permitted” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** Datarade's Publishing Policies forbid listing Personal Data unless the provider is legally authorised and has valid consent to collect, process and share it.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Personal Data unless you are legally authorized and have obtained valid consent to collect, process, and share this Data.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A rule in Datarade's own Publishing Policies; by nature vendor-only.
- **c021** Datarade's Publishing Policies say listings are removed if inadequate documentation is provided.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Listings will be removed from the platform if inadequate documentation is provided” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** Datarade's Publishing Policies require providers listing personal data to document how it is collected and used.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Provide detailed documentation on how the Personal Data is collected and used.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/publishing-policies> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** Datarade says its team reviews provider applications for quality and marketplace fit, most within 1-2 business days.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our team reviews your application to ensure quality and marketplace fit.” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** Datarade's provider FAQ says a provider's business must hold the necessary rights, licences or consent to distribute the data.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your business must hold the necessary rights, licenses, or consent to distribute the data.” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c067** Under Datarade's ToS the operator may at its discretion request evidence of a Customer's business capacity at any time.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Platform Operator may, at its reasonable discretion, request additional information and evidence at any time” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** Datarade's ToS prohibit any use of Datarade for private or other non-business purposes.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Any use of Datarade for private or other non-business purposes is prohibited” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c065** Datarade's IP infringement report form says a report could lead to removal of the reported product or information.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This could involve removing the product or information you've reported.” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/ip-infringement-report-form> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c070** Datarade's ToS define content moderation to include demotion, demonetisation, disabling of access to, or removal of content.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “demotion, demonetization, disabling of access to, or removal thereof” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c025** Datarade offers buyers complimentary sourcing advice from its own data acquisition specialists.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get complimentary sourcing advice by our team of data acquisition specialists.” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** Datarade providers can respond to buyers' data requests from Datarade's posting pool.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Proactively respond to data requests from our posting pool” — Datarade (Monda Labs GmbH), <https://providers.datarade.ai/apply> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c059** DataSeeds.AI's image listing on Datarade offers custom datasets sourced on demand within 72 hours.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom datasets can be sourced on-demand within 72 hours” — DataSeeds.AI (listing on Datarade), <https://datarade.ai/data-products/15m-images-ai-training-data-annotated-imagery-data-for-a-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c062** Datarade's buyer data-request form is headed 'Post your data request!'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Post your data request!” — Datarade (Monda Labs GmbH), <https://datarade.ai/postings/new> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c064** Datarade tells buyers who post a data request that they receive multiple offers in 24-48 hours.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Receive multiple offers in 24-48 hours” — Datarade (Monda Labs GmbH), <https://datarade.ai/postings/new> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c076** Datarade's footer calls its off-the-shelf side 'AI-Ready Data Products' within its 'AI Data Marketplace'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “AI-Ready Data Products” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c002** Datarade's Terms of Service were last updated on 9 January 2026.  
  _event · legal_text · as of 2026-01-09 (page_dated)_
  - “Last updated on January 9, 2026” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The update date of Datarade's own ToS exists only on its own page. Seen there on 2026-10-01: 'Last updated on January 9, 2026' (datarade.ai/company/terms-of-service). No search spent.

### demand

- **c011** Under Datarade's ToS registered buyers may publish postings describing their data needs to receive proposals from Sellers.  
  _terms · legal_text · as of 2026-01-09 (page_dated)_
  - “Registered Customers may publish postings describing data needs or requirements” — Datarade (Monda Labs GmbH), <https://datarade.ai/company/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c027** Datarade tells providers that listing reaches 120k monthly visitors (vendor-stated).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **120000 visitors** (vendor-stated monthly visitors to the marketplace; per month)
  - “List your data on our global B2B platform to reach 120k monthly visitors” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** Datarade tells providers they get B2B intent insights on data buyers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get B2B intent insights on data buyers” — Datarade (Monda Labs GmbH), <https://datarade.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://datarade.ai/company/terms-of-service>, <https://datarade.ai/company/publishing-policies>, <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata>, <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art>, <https://datarade.ai/data-products/large-scale-indonesian-ugc-image-video-dataset-for-ai-training-woilo>, <https://datarade.ai/data-products/15m-images-ai-training-data-annotated-imagery-data-for-a-data-seeds>
- `matrix.versioning` — not_published; tried <https://datarade.ai/company/terms-of-service>, <https://datarade.ai/company/publishing-policies>, <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata>, <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art>, <https://datarade.ai/data-products/ai-search-data-global-coverage-real-time-xverum>
- `matrix.erasure_after_sale` — not_published; tried <https://datarade.ai/company/terms-of-service>, <https://datarade.ai/company/publishing-policies>, <https://datarade.ai/company/ip-infringement-report-form>
- `questions.Q4` — not_published; tried <https://datarade.ai/company/terms-of-service>, <https://datarade.ai/company/publishing-policies>, <https://providers.datarade.ai/apply>, <https://datarade.ai/postings/new>
- `other.commission_base` — not_published; tried <https://providers.datarade.ai/apply>, <https://providers.datarade.ai/>
- `other.seller_agreement_text` — gated; tried <https://datarade.ai/company/terms-of-service>, <https://providers.datarade.ai/apply>
- `other.buyer_licence_text` — not_published; tried <https://datarade.ai/data-products/nexdata-face-anti-spoofing-data-200-000-id-image-video-nexdata>, <https://datarade.ai/data-products/m-art-5-000-drone-view-datasets-4k-video-content-commerc-m-art>, <https://datarade.ai/data-products/large-scale-indonesian-ugc-image-video-dataset-for-ai-training-woilo>, <https://datarade.ai/data-products/ai-search-data-global-coverage-real-time-xverum>, <https://datarade.ai/data-products/15m-images-ai-training-data-annotated-imagery-data-for-a-data-seeds>
- `other.sourcing_guide` — gated; tried <https://datarade.ai/company/successful-data-sourcing>
- `other.independent_traction` — not_found; tried <https://datarade.ai/company>, <https://www.htgf.de/en/portfolio/>
- `other.white_label_marketplace` — not_found; tried <https://datarade.ai/features/white-label-data-marketplace>

## Conflicts

- c068, c039: The ToS list viewing Products as a registration-based service, yet listing pages with prices and descriptions were readable without an account on 2026-10-01; only data previews were gated. (unresolved)

## Leads, not cited

- <https://providers.datarade.ai/apply/basics> — Provider application form; not submitted (no sign-ups).
- <https://datarade.ai/platforms> — Datarade's own data-marketplace directory; a discovery source for other marketplaces, not citable as evidence about them.
- <https://datarade.ai/chat> — 'AI Chat' discovery feature in the header; not examined.
- <https://datarade.ai/company/careers> — Could show current headcount or hiring as a status signal.
