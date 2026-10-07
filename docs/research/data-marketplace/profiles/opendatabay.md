# Opendatabay

independent_marketplace · deep · status: **active** · also known as Open Data Bay, OPENDATABAY LTD

> Rendered from `ledger/opendatabay.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Data Products on the 'Licensed Data Marketplace' (tiers include 'Premium Data' and the free 'Open Data Repository')” and its bespoke side “'Request a Dataset' / 'Request Data'; in the docs, sourcing 'bespoke data requirements'; in the fee schedule, 'bespoke brokerage or enterprise transactions'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | agent | c022, c025, c111, c136 | Opendatabay is authorised as the provider's (by default non-exclusive) broker and collects payment, but the provider is licensor of record under the provider's licence. |
| economics_model | commission | c038, c044, c037 | Sliding per-transaction commission, 30% down to 5%; no listing fee. |
| who_pays_fee | seller | c048, c055 |  |
| supply_models | third_party_providers, public_or_scraped | c056, c150, c172, c174 | public_or_scraped = free datasets republished by an account named Opendatabay Labs from public sources; no evidence of the operator's own commissioned or speculative collection. |
| custody_model | mixed | c105, c096, c107, c155 | Instant download on the platform for some listings; provider-delivered (S3, API, cloud credentials, FTP) for others. Where downloads are hosted is not stated. |
| transaction_mode | both | c167, c099, c108, c049 |  |
| public_prices | some | c151, c159, c153 | Every listing card viewed showed a price or 'Free', but larger batches and bespoke deals are unpriced. |
| licence_model | provider_defined | c024, c027, c133 | Provider picks one of two Opendatabay AI-training templates, a standard open licence or its own custom licence. |
| exclusivity_offered | unknown |  | Exclusivity in the terms is provider-to-broker only; no buyer-side exclusive licence offered or excluded. |
| public_listing | public_indexable | c062, c116 |  |
| buyer_vetting | account_only | c090, c112 | What buyer 'onboarding' involves is not published. |
| sample_mechanics | free_sample_download | c090, c127, c168 | Samples depend on the provider; the listings viewed had no sample tab. |
| versioning | unknown |  | Listings show only a last-updated date; nothing on revisions or what past buyers receive. |
| human_subject_consent_docs | asserted_only | c076, c081, c078, c156 | Consent is warranted by the provider and records stay with the provider; nothing obliges release evidence to reach the buyer. |
| contributor_pay_model | not_applicable | c119 | Only registered businesses sell; Opendatabay has no individual contributors and says nothing on how providers pay their capturers. |
| catalogue_plus_custom | both | c097, c177 |  |
| erasure_after_sale | contractual_deletion | c140, c073 | Deletion duty exists only in Opendatabay's two AI-training licences; CC-licensed or custom-licensed listings carry no such duty. |
| quality_evidence | provider_asserted | c184, c091, c157 | A 5/5 'UDTR' trust rating shows on listings, but who assigns it and how is not published. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Opendatabay claims 30k+ users and 23K+ downloads (vendor-stated) and runs a public request board, but its 'who is buying data' article is a placeholder; no buyer units or volumes are published. | c013, c014, c179, c182 |
| Q2 | partial | Listing costs nothing upfront and the operator pushes listings to search engines and LLMs and markets them; in return the provider cannot deal off-platform with introduced buyers and may grant exclusive brokerage. | c052, c116, c117, c065, c023 |
| Q3 | sourced | Inventory comes from verified registered businesses that warrant they created the data or hold all rights; an account named Opendatabay Labs also republishes public data for free. Individuals are barred as sellers, though marketing copy says otherwise. | c056, c075, c172, c119 |
| Q4 | unknown | Nothing found on carving resale rights out of commissioned work, or on retroactive term changes beyond 'continued use constitutes acceptance'. |  |
| Q5 | sourced | Opendatabay is the provider's broker and 'conduit, not the licensor'; the provider is licensor, warrants rights and lawful collection, and indemnifies Opendatabay. Liability is capped at platform fees. | c022, c111, c075, c068, c070 |
| Q6 | sourced | Mixed: instant download for some listings, and the provider delivers others by S3, API, cloud credentials or negotiated means. The docs call Opendatabay 'not a data warehouse'. | c016, c105, c096, c155 |
| Q7 | partial | The provider warrants lawful, ethical and consented collection and keeps consent records; PII must be anonymised. No clause addresses people depicted, model or property releases, or capturer consent to onward sale. | c078, c081, c079, c144 |
| Q8 | sourced | Opendatabay's AI licences are non-exclusive and perpetual, ban redistribution and watermark removal, and require deletion on request or termination; audits are limited to once a year. Listing labels (CC0, CC BY) can contradict those restrictions. | c137, c138, c139, c140, c141 |
| Q9 | sourced | Self-serve 'Buy Now' checkout at provider-set prices, plus negotiated and bespoke deals. Opendatabay takes a sliding commission of 30% down to 5% out of the seller's proceeds. | c167, c026, c038, c044, c048 |
| Q10 | partial | A listing ('data product') has licence, AI-licence, delivery, type and last-updated fields; buyers buy once or subscribe. Delisting does not affect executed sales. No revision or version model is described. | c122, c126, c100, c033 |
| Q11 | partial | Before paying, buyers see the licence, metadata, a trust rating and a provider badge, and registered users can download provider samples. Providers are KYB-verified, but listing accuracy is the provider's responsibility. | c134, c090, c157, c057, c184 |
| Q12 | sourced | The catalogue of 'data products' sits alongside 'Request a Dataset', where Opendatabay says its provider network helps find or create data, and the fee schedule allows separate terms for bespoke brokerage. | c177, c178, c097, c049 |

## Narrative

### positioning

A UK company (incorporated May 2024, one director) running a 'Licensed Data Marketplace for AI Training' [c010, c007, c008]. It calls itself 'a marketplace and commercial brokerage platform, not a data warehouse' [c016]. Claimed scale is modest: 586 products and 91 providers [c011, c012]. Its company was briefly gazetted for strike-off in April 2026 before the action was discontinued, after late accounts [c004, c005, c006].

### supply

Supply is third-party businesses only: KYC/KYB checks, and individuals barred [c056, c057, c119], although the about page and resources hub still address individuals [c019, c181]. Providers warrant they are the creator or hold all rights [c075]. An 'Opendatabay Labs' account republishes public data for free [c172, c174]. Image and video supply includes a 220K-hour egocentric video set [c150].

### object_model

The unit is a 'data product' with fields for licence, a separate AI-training licence, delivery method, dataset type and last-updated date [c122, c123, c124, c125, c126]. Pages show listed and updated dates and view counts [c162]. No revision model is described.

### listing

Profiles and listings are public [c062]. Providers must disclose limitations and biases and are told to write 'Unknown' rather than omit [c030, c129]. Opendatabay may suggest listing changes [c031].

### discovery

Opendatabay says listings are auto-indexed by search engines and exposed to LLMs, and it offers AI search with a match score [c116, c117, c118]. It may use provider names and banners in marketing [c071].

### trust

Listings show a 5/5 'Universal Data Trust Rating' and a 'Licensed LLM Data Provider' badge, but how the rating is set is unpublished [c157, c158, c161]. The terms disclaim accuracy and put it on providers [c091, c184].

### transaction

Paid listings have 'Buy Now'; purchase types are one-time, subscription, pay-per-use and managed access [c167, c099, c100, c101]. Payments go through third-party processors [c088]. Off-platform dealing with introduced buyers is banned [c065].

### pricing

Providers set prices [c026]. Commission is per transaction, 30% at GBP 1-100 sliding to 5% above GBP 250,000, deducted from seller proceeds [c038, c044, c048]. There is no listing fee, and a GBP 100 payout minimum [c052, c053]. Listed prices reach GBP 371,000 for 50,000 hours of egocentric video [c151, c152].

### licence

The provider is licensor and picks the licence: Opendatabay's General or Commercial AI-training licence, a standard licence, or its own [c024, c027, c135]. The Commercial licence is non-exclusive and perpetual and bans redistribution [c137, c138]. Listing labels can contradict this: a CC0 label beside a no-redistribution clause [c166, c183].

### custody

Custody is mixed. The docs describe provider delivery to the customer environment [c096], instant download [c160], S3 or custom delivery [c155] and cloud credentials [c107]. Providers own security and availability [c032].

### vetting

Providers pass KYB in 1-2 business days, including 'data product suitability' [c057, c120, c121]. Opendatabay may demand proof of ownership, audit sources and quality, and remove products [c082, c067, c083, c084]. Buyers face only registration [c090].

### contributor_pay

Not applicable: sellers are registered businesses and individuals cannot list [c119]. Payouts go to verified business accounts [c061].

### post_sale

Delisting does not affect executed sales, and pending sales must still be delivered [c033, c034]. The AI licences require deletion on termination or the licensor's request [c140]. Refunds are excluded once access is granted [c087]. In disputes, Opendatabay is a 'neutral intermediary' [c113].

### catalogue_custom

'Request a Dataset' sits beside the catalogue: Opendatabay says its provider network helps 'find or create' data [c177, c178], and it can set separate terms for bespoke brokerage [c049].

### changes

Terms dated 2026: Brokerage & Listing, Provider and Right to List (27 February), Terms of Service (26 July) and the fee schedule (24 August) [c086, c002]. Every document may change at any time on continued use [c051].

### demand

Only vendor figures exist: 30k+ users and 23K+ downloads [c013, c014]. A public request board lists requests from researchers, developers and businesses [c179].

### regulation

English law. The Terms of Service send disputes to arbitration, while the Listing Terms name the London courts [c094, c186]. The Commercial licence has the licensor represent GDPR compliance [c143].

## Buyer journey

1. Lands on the homepage ('Licensed Data Marketplace for AI Training and LLM Fine-Tuning') showing 586 products and 91 providers. [c010, c011]
2. Browses categories (AI training, robotics/egocentric, premium, government, synthetic) or searches in natural language with match scores; listings are public and indexed. [c149, c118, c062]
3. Opens a listing and sees the provider's 'Licensed LLM Data Provider' badge, the trust rating, price, licence, AI-training rights, delivery method, format and updated date. [c158, c161, c159, c163, c162]
4. Reads the licence before buying; to download a sample, the buyer must register and complete onboarding. [c134, c090]
5. Clicks 'Buy Now' (or 'Download' for free items), accepts the provider's licence at checkout and pays through a third-party processor; no refunds once access is granted. [c167, c135, c088, c087]
6. Receives the data by instant download, or the provider delivers it by S3, API, cloud credentials or a negotiated method. [c160, c155, c107, c096]
7. Holds a licence from the provider, not Opendatabay. Under the AI licences the buyer must not redistribute and must delete the data on request or termination. [c111, c138, c140]
8. If nothing fits: submits 'Request a Dataset' with a timeline, and Opendatabay's provider network sources or creates the data. [c177, c097]

## Claims

### positioning

- **c007** OPENDATABAY LTD (company number 15711573) is a private limited company incorporated in England and Wales on 10 May 2024.  
  _status · filing · as of 2024-05-10 (publication)_
  - “10 May 2024” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573> · filing · retrieved 2026-10-01 · quote check: exact
- **c008** Companies House lists one officer of OPENDATABAY LTD, director Justinas Kairys.  
  _status · filing · as of 2026-10-01 (retrieved_only)_
  - “KAIRYS, Justinas” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573/officers> · filing · retrieved 2026-10-01 · quote check: exact
- **c009** The operator of the marketplace is registered in England and Wales under number 15711573 with an office at 7 Hungate, Beccles.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “7 Hungate, Beccles, NR349TT, United Kingdom” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** Opendatabay describes itself as a licensed data marketplace for AI training and LLM fine-tuning.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensed Data Marketplace for AI Training and LLM Fine-Tuning” — Opendatabay, <https://www.opendatabay.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** Opendatabay says its marketplace lists 586 data products.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **586 data products listed** (vendor homepage counter, all listings free and paid; point in time)
  - “All Data Products (586)” — Opendatabay, <https://www.opendatabay.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.50
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a live catalogue listing count (586) is shown only on the vendor's homepage; no partner or press page reachable by navigation (IBM Partner Plus directory entry, partners page links) restates it.
  - verifier (scope): **scope_ok**
- **c015** Opendatabay says it is an IBM Silver Partner and is supported by Microsoft for Startups and Google for AI Startups.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “an IBM Silver Partner and APPG AI member, supported by Microsoft for Startups, Google for AI Startups” — Opendatabay, <https://www.opendatabay.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** Opendatabay's documentation calls it a marketplace and commercial brokerage platform, not a data warehouse.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay is a marketplace and commercial brokerage platform, not a data warehouse.” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c017** Opendatabay describes itself as infrastructure connecting AI demand with verified data supply.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “connecting AI demand with verified data supply” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c018** The homepage invites visitors to buy, sell or exchange AI-ready data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Buy, sell, or exchange AI-ready data in 3 simple steps” — Opendatabay, <https://www.opendatabay.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** Opendatabay's about page says individuals, researchers and enterprises can buy and sell data on it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “where individuals, researchers, and enterprises can buy and sell data easily” — Opendatabay, <https://www.opendatabay.com/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c175** Opendatabay's premium category advertises curated, labelled datasets for advanced AI training.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Top-tier, gold-standard, perfectly labeled, curated, and structured datasets for advanced AI training” — Opendatabay, <https://www.opendatabay.com/data/premium> · docs · retrieved 2026-10-01 · quote check: exact

### supply

- **c012** Opendatabay says it has 91 licensed data providers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **91 data providers** (vendor homepage counter; point in time)
  - “Licensed Data Providers (91)” — Opendatabay, <https://www.opendatabay.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.50
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a live catalogue licensed provider count (91) is shown only on the vendor's homepage; no partner or press page reachable by navigation (IBM Partner Plus directory entry, partners page links) restates it.
  - verifier (scope): **scope_ok**
- **c056** Only registered businesses, organisations or legal entities may supply data to Opendatabay.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Only registered businesses, organizations, or legal entities may supply data.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — On the Data Provider (Seller) Agreement, Last Updated 27 Feb 2026.
- **c058** A provider must own the rights to the data it lists or have permission to sell it.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “You must own the rights to the data or have permission to sell it.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c075** By listing, a provider warrants it is the original creator of the data or holds all rights and permissions to sell it.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “You are the original creator or have obtained all necessary rights and permissions to sell the data” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c076** By listing, a provider warrants the data was collected through legal and ethical means.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “The data was collected through legal and ethical means” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — Introduced on /legal/right by 'By listing data on Opendatabay, you explicitly declare and warrant that:'. A warranty only, which supports asserted_only.
- **c095** The Terms of Service limit registration as a data provider to registered businesses, legal entities or institutions.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Only registered businesses, legal entities, or institutions may register as data providers” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c119** Opendatabay accepts only registered businesses as sellers; individual and self-employed sellers cannot list data products.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Individual sellers and self-employed providers cannot list data products.” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/data-provider-onboarding.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — The quote is exact. It supports 'the platform pays no individual sellers', but not how providers pay their own capturers, as the matrix note says.
- **c149** Opendatabay's robotics category covers egocentric and first-person data, teleoperation and robot perception.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “including egocentric and first-person data, IMU and proprioception, teleoperation” — Opendatabay, <https://www.opendatabay.com/data/robotics> · docs · retrieved 2026-10-01 · quote check: exact
- **c150** Infobay.Ai lists a 220K+ hours narrated egocentric video dataset on Opendatabay.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “220K+ Hours Narrated Egocentric Video Dataset” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c171** A provider account named Opendatabay Labs publishes free datasets such as an Indian agriculture production dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Agriculture Production and Yield in India since 1997” — Opendatabay, <https://www.opendatabay.com/data/government> · docs · retrieved 2026-10-01 · quote check: missing 0.00
- **c172** The Opendatabay Labs agriculture dataset is derived from an Indian government statistics database.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The dataset is derived from the Indian government's Area Production Statistics (APS) database” — Opendatabay (listing by Opendatabay Labs), <https://www.opendatabay.com/data/government/cb9cdf12-ada1-4f69-9eb2-99a51f91c43b> · docs · retrieved 2026-10-01 · quote check: exact
- **c174** The Opendatabay Labs Nobel laureates dataset draws on the Nobel Foundation's data archives.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The primary source for this data is the Nobel Foundation's data archives.” — Opendatabay (listing by Opendatabay Labs), <https://www.opendatabay.com/data/government/151d5220-7864-4b76-b38e-f3021bcc2151> · docs · retrieved 2026-10-01 · quote check: exact
- **c176** Opendatabay's open data repository offers free or open data products.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Free or Open Data Products” — Opendatabay, <https://www.opendatabay.com/open-data-repository> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c180** The data provider landing page pitches providers to monetise data by listing and selling it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Monetise Your Data Today - List It, Sell It, and Earn Revenue as a Trusted Data Provider” — Opendatabay, <https://www.opendatabay.com/data-providers> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c181** Opendatabay's resources hub pitches selling to individuals and companies holding rare data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A guide for individuals and companies sitting on rare data who want to turn it into revenue” — Opendatabay, <https://www.opendatabay.com/resources/selling-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c122** A listing has a licence field in which the provider specifies the dataset's licence.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Specify the dataset's license (e.g., CC BY-SA 4.0)” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/listing-data-product.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c123** A listing has a separate AI training licence field.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Select the appropriate AI training license for your data product” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/listing-data-product.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c124** A listing has a delivery method field such as one-off download, API access or subscription.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Select the delivery method for your data product” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/listing-data-product.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c125** A listing declares its dataset type, such as text, images or videos.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Specify the dataset's type (e.g., Textual, Images, Videos)” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/listing-data-product.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c126** A listing records only the date of its last update, with no version field described.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Date of last update” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/listing-data-product.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c162** The thermography listing shows view count, listing date and last-updated date.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “UPDATED 24/03/2026” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c030** Listing terms require providers to disclose any known limitations or biases of a data product.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Any known limitations or biases must be disclosed.” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** Listing metadata, including publicly visible samples but excluding the actual data asset, may be used for marketing without further consent.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “including publicly visible samples (excluding the actual data asset) may be used for marketing without additional consent” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c062** Provider profiles and dataset listings on Opendatabay are public.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Your provider profile and dataset listings are public.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c127** Opendatabay's seller guide asks providers to supply sample data or a preview.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sample data or preview” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/creating-high-quality-data-products.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c128** Opendatabay's seller guide says quality, collection methods and licensing matter more than volume.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Quality, collection methods, and licensing are more important than raw volume or variety.” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/creating-high-quality-data-products.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c129** Opendatabay's seller guide tells providers to state 'Unknown' rather than omit information.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If information is unknown, explicitly state 'Unknown' rather than omitting it.” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/creating-high-quality-data-products.md> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c071** Opendatabay may use a provider's name, banners and public product information for marketing, listings and social media.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay may use your name, banners, and public product info for marketing, listings, and social media.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** Listing metadata such as provider names, product titles and descriptions may be visible to AI models and crawlers.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Metadata including provider names, product titles, and descriptions may be visible to AI models, crawlers” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c098** Buyers can search the marketplace or submit a specific data requirement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Search the marketplace or submit a specific data requirement.” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c116** Opendatabay says all listed datasets are automatically indexed by major search engines.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All listed datasets on Opendatabay are automatically indexed” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/finding-datasets.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c117** Opendatabay says its datasets are automatically exposed to all major large language models.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay datasets are automatically exposed to all major Large Language Models” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/finding-datasets.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c118** Opendatabay's platform search accepts natural-language queries and scores each result for accuracy of match.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each search result includes an accuracy score” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/finding-datasets.md> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c020** Opendatabay's docs claim its datasets reduce time spent on preprocessing by 20-40%.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Reducing time spent on preprocessing by 20” — Opendatabay, <https://docs.opendatabay.com/readme.md> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch unavailable in this run (no search available); an outcome claim of this kind would need a customer case study or independent evaluation; none linked from the vendor's pages and none reachable by navigation.
  - verifier (scope): **quote_incomplete** — Quote stops at 'by 20' and does not show the 40% upper bound. The page reads 'reducing time spent on preprocessing by 20–40%' (en dash), under 'What We Offer', as a claim about its pre-curated datasets.
- **c021** Opendatabay's docs claim every dataset comes with verifiable provenance and metadata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every dataset comes with verifiable provenance and metadata” — Opendatabay, <https://docs.opendatabay.com/readme.md> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c068** The Data Provider indemnifies Opendatabay against third-party claims arising from its listing.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “agrees to indemnify and hold harmless Opendatabay against any third-party claims” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** Opendatabay indemnifies the Data Provider against certain third-party claims.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay agrees to indemnify and hold harmless the Data Provider against third-party claims” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c070** Each party's aggregate liability under the provider agreement is capped at the platform fees paid.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “each party's total aggregate liability under this Agreement shall not exceed the total platform fees” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c085** Data Providers indemnify Opendatabay against claims, damages or losses arising from their listings.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Data Providers agree to indemnify and hold harmless Opendatabay from any claims, damages, or losses” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c090** Users must be registered and have completed onboarding to download a data sample.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “To download a data sample, users must be registered and have completed the onboarding process.” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c091** Opendatabay's terms tell users data products may come from third-party sources and it does not guarantee accuracy.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Users acknowledge that data products may come from third-party sources, and Opendatabay does not guarantee accuracy.” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c092** Content, data products and services on Opendatabay are provided 'as is'.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “are provided 'as is'” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c156** The egocentric video provider asserts its own ownership verification, licensing documentation and provenance records.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “ensures that all datasets are sourced, curated, and managed with proper ownership verification” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c157** Listings carry a 'Universal Data Trust Rating' (UDTR) label.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Universal Data Trust Rating” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: missing 0.00
- **c158** Providers on listings carry a 'Licensed LLM Data Provider' badge.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensed LLM Data Provider” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c161** The thermography listing shows a trust rating of 5 out of 5.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “TRUST 5 / 5” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact
- **c168** FixThePhoto lists a free portrait-retouching image dataset as a demonstration sample.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This dataset is provided as a demonstration sample.” — Opendatabay (listing by DGPH Outsourcing OU / FixThePhoto), <https://www.opendatabay.com/data/ai-ml/292edf15-04fc-4fca-9935-998f07e3dc36> · docs · retrieved 2026-10-01 · quote check: exact
- **c170** The free portrait dataset includes a RIGHTS_AND_PROVENANCE file with provenance and licensing information.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “provenance and licensing information” — Opendatabay (listing by DGPH Outsourcing OU / FixThePhoto), <https://www.opendatabay.com/data/ai-ml/292edf15-04fc-4fca-9935-998f07e3dc36> · docs · retrieved 2026-10-01 · quote check: exact
- **c184** Providers are responsible for the accuracy of the information displayed on their listings.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “You are responsible for the accuracy of displayed information.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact

### transaction

- **c022** By default a Data Provider authorises Opendatabay to act as a non-exclusive broker for each listed data product.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “By default, the Data Provider authorizes Opendatabay to act as a non-exclusive broker” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — Quote is on /legal/listing (Last Updated 27 Feb 2026); 'By default' is right, because the same page lets a provider elect exclusive brokerage (c023).
- **c023** A Data Provider may elect exclusive brokerage by Opendatabay for a data product, specifying channels, geographies, buyer segments and duration.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “may elect exclusive brokerage for a data product by providing written confirmation, specifying the scope” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c065** Providers may not transact directly, outside the platform, with Data Consumers introduced through Opendatabay.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “not to engage or transact directly with Data Consumers introduced through the Platform” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c066** Circumventing the platform may incur fees and legal consequences for the provider.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Violations may incur fees and legal consequences” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c087** Refunds are not available for one-off purchases of digital products once access has been granted.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Refunds are not available for one-off purchases of digital products or services once access has been granted.” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c088** Payments for data products are processed through third-party payment processors.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Payments for data products or services are processed through secure payment processors.” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c099** Opendatabay offers one-time purchases that give access to a specific dataset for a single payment.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pay once to access a specific dataset” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c100** Opendatabay offers subscriptions with a monthly or annual recurring fee for continuous access to datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pay a recurring fee (monthly or annually) for continuous access to datasets” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c104** Some data providers offer unique purchasing options specified in the dataset description.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Some data providers may offer unique purchasing options specified in the dataset description” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c135** Buyers must accept a custom licence's terms during the purchasing process.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Buyers must acknowledge and accept the terms of the custom license during the purchasing process.” — Opendatabay, <https://docs.opendatabay.com/standard-data-licenses/custom.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c167** Paid listings show a 'Buy Now' button.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Buy Now” — Opendatabay (listing by S CHAND AND COMPANY LIMITED), <https://www.opendatabay.com/data/premium/e6386607-7899-457b-bb85-5f31ae6c11fb> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — One-listing quote generalised to all paid listings; I saw 'Buy Now' on four paid listings (GBP 850, 371,000, 500,000 and 40,670,625). Nothing shows whether the button opens a card checkout or an enquiry at the larger prices.

### pricing

- **c026** The Data Provider sets the price or pricing model for each data product.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “The Data Provider sets the price or pricing model for each data product.” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** The listing terms say the fee schedule also covers payout schedules, minimum payout thresholds and responsibility for refunds or chargebacks.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “explains payment terms, payout schedules, minimum payout thresholds, and responsibility for refunds or chargebacks” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Opendatabay charges its commission on dataset sales, API calls and data access fees.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “commission structure on dataset sales, API calls, and data access fees” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok**
- **c038** Opendatabay's commission is 30% on a sale priced GBP 1 to 100, leaving the seller 70%.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **30 percent** (platform fee deducted from the seller's proceeds, percent of sale price, transactions of GBP 1-100; per transaction)
  - “£1 - £100 30% 70%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Matches the /legal/fees table row; the docs fee page repeats the same bands.
- **c039** Opendatabay's commission falls from 30% to 25% across sales priced GBP 101 to 1,000.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **25 percent** (platform fee deducted from seller proceeds; 30% at the bottom of the GBP 101-1,000 band falling to 25% at the top, applied progressively; per transaction)
  - “£101 - £1,000 30% → 25% 70% → 75%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Row matches /legal/fees. value.num records only the rate at the top of the band; the page says the rate is 'determined progressively within that range' without saying whether that is marginal or linear, which the profile lists as unknown.
- **c040** Opendatabay's commission falls from 25% to 20% across sales priced GBP 1,001 to 10,000.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **20 percent** (platform fee deducted from seller proceeds; 25% falling to 20% across the GBP 1,001-10,000 band, applied progressively; per transaction)
  - “£1,001 - £10,000 25% → 20% 75% → 80%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Row matches /legal/fees. value.num records only the rate at the top of the band; the page says the rate is 'determined progressively within that range' without saying whether that is marginal or linear, which the profile lists as unknown.
- **c041** Opendatabay's commission falls from 20% to 15% across sales priced GBP 10,001 to 25,000.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **15 percent** (platform fee deducted from seller proceeds; 20% falling to 15% across the GBP 10,001-25,000 band, applied progressively; per transaction)
  - “£10,001 - £25,000 20% → 15% 80% → 85%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Row matches /legal/fees. value.num records only the rate at the top of the band; the page says the rate is 'determined progressively within that range' without saying whether that is marginal or linear, which the profile lists as unknown.
- **c042** Opendatabay's commission falls from 15% to 10% across sales priced GBP 25,001 to 50,000.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **10 percent** (platform fee deducted from seller proceeds; 15% falling to 10% across the GBP 25,001-50,000 band, applied progressively; per transaction)
  - “£25,001 - £50,000 15% → 10% 85% → 90%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Row matches /legal/fees. value.num records only the rate at the top of the band; the page says the rate is 'determined progressively within that range' without saying whether that is marginal or linear, which the profile lists as unknown.
- **c043** Opendatabay's commission falls from 10% to 5% across sales priced GBP 50,001 to 250,000.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **5 percent** (platform fee deducted from seller proceeds; 10% falling to 5% across the GBP 50,001-250,000 band, applied progressively; per transaction)
  - “£50,001 - £250,000 10% → 5% 90% → 95%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Row matches /legal/fees. value.num records only the rate at the top of the band; the page says the rate is 'determined progressively within that range' without saying whether that is marginal or linear, which the profile lists as unknown.
- **c044** Opendatabay's commission is 5% on a sale priced GBP 250,001 or more, leaving the seller 95%.  
  _number · legal_text · as of 2026-08-24 (page_dated)_ · **5 percent** (platform fee deducted from seller proceeds, percent of sale price, transactions of GBP 250,001 and above; per transaction)
  - “£250,001 and above 5% 95%” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the vendor's own commission schedule; no partner or third-party page restating it was reachable by navigation. Read on opendatabay.com/legal/fees for context only (not independent).
  - verifier (scope): **scope_ok** — Matches the /legal/fees table row; the docs fee page repeats the same bands.
- **c045** The commission rate depends on the value of each individual transaction, not on the provider's monthly or cumulative sales.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “calculated based on the individual transaction value, not on monthly or cumulative sales” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** Within each price band the commission percentage is determined progressively.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “the applicable percentage is determined progressively within that range” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** The exact fee and resulting seller payout are shown to a provider when it sets or updates a product price.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “The exact fee and resulting seller payout are displayed when a Data Provider sets or updates a product price.” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c048** The seller bears Opendatabay's fee: the platform deducts it and pays the remaining balance to the Data Provider.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “After deducting the applicable platform fee, the remaining balance is paid to the Data Provider.” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** The fee schedule is incorporated by reference into the Brokerage & Listing Terms.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “This Schedule is incorporated by reference into the Opendatabay Brokerage & Listing Terms” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** Opendatabay charges providers no upfront listing fee; fees apply only when a transaction completes.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay does not charge upfront listing fees.” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/platform-fees-and-pricing.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c053** Opendatabay pays providers only once their total earnings reach at least GBP 100.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 GBP** (minimum accumulated seller earnings before a payout is processed; per payout)
  - “Payments are processed only when total earnings reach a minimum of £100.” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/platform-fees-and-pricing.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a payout threshold in the vendor's own provider terms/docs; not restated by any third party reachable by navigation.
  - verifier (scope): **scope_ok** — Docs page is undated; the /legal/fees schedule does not state the threshold.
- **c054** Opendatabay makes payments in GBP or USD.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All payments are made in GBP (£) or USD ($)” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/platform-fees-and-pricing.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c055** Providers receive payment after completed transactions, less Opendatabay's platform fee.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Providers receive payment after completed transactions, less the applicable Opendatabay platform fee” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** Opendatabay's fees are non-refundable to the provider.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Fees are non-refundable.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c061** Opendatabay pays sale proceeds only to verified business accounts.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Payouts are made only to verified business accounts.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c101** Opendatabay offers pay-per-use pricing based on the amount of data accessed or the number of API calls.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pay based on the amount of data accessed or the number of API calls made” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c151** The egocentric video listing is priced at GBP 371,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **371000 GBP** (buyer price for the initial batch of 50,000 hours of narrated egocentric video; list price set by the provider; one-off)
  - “£371,000” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a listing price exists only on the marketplace listing. Could not locate the egocentric listing blind: /data/robotics rendered empty placeholders and /data/premium did not show it.
  - verifier (scope): **scope_wrong** — The GBP 371,000 is not the listing's whole price. The listing ('220K+ Hours Narrated Egocentric Video Dataset', provider Infobay.Ai) prices 'the specified initial batch of 50,000 hours'; larger quantities are priced separately. The value.basis says so but the statement and the bare '£371,000' quote do not. Should read: Infobay.Ai's 220K+-hour egocentric video listing prices an initial 50,000-hour batch at GBP 371,000.
- **c152** The egocentric listing's price covers only an initial batch of 50,000 hours of video.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The listed price applies to the specified initial batch of 50,000 hours of narrated egocentric video.” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c153** Pricing for larger batches or the complete egocentric library varies and is not published on the listing.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pricing for larger batches or the complete dataset library varies depending on total video duration” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c159** The Industrial Bearing Thermography image dataset is priced at GBP 850.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **850 GBP** (buyer list price for the whole dataset (1,326 records), set by the provider; one-off)
  - “£850” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); listing price on the marketplace only. Checked the provider's own site (dira.digital, Dira Reliability S.L.): it does not mention a thermography dataset for sale, Opendatabay or a price.
  - verifier (scope): **scope_ok** — Listing by Dira Reliability S.L.; price confirmed on the live listing.
- **c165** The Multilingual Speech & Audio listing is priced at GBP 500,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **500000 GBP** (buyer list price shown on the listing, set by the provider; one-off)
  - “£500,000” — Opendatabay (listing by S CHAND AND COMPANY LIMITED), <https://www.opendatabay.com/data/premium/e6386607-7899-457b-bb85-5f31ae6c11fb> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); listing price on the marketplace only. Checked the provider S Chand and Company Ltd's FY2025-26 Annual Report (schandgroup.com): it reports AI-dataset content licensing revenue but never names Opendatabay or this listing's price.
  - verifier (scope): **scope_ok** — Listing by S CHAND AND COMPANY LIMITED; price confirmed. The same listing's licence field reads CC0, which the profile records as a conflict.

### licence

- **c024** Opendatabay's listing terms say it only facilitates listing and brokering and the licence terms are set by the Data Provider.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay only facilitates listing and brokering; the license terms are set by the Data Provider.” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok**
- **c025** The Data Provider, not Opendatabay, grants Data Consumers the rights in the licence selected for a listing.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “The Data Provider grants Data Consumers the rights specified in the license selected” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c027** Data Providers choose a listing's licence from Opendatabay's commercial or general AI training licences, other standard licences, or a custom licence.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Commercial or general Opendatabay AI and LLM Training License” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** A Data Provider whose case fits no platform licence may supply a URL or description of its own custom licence.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Custom License: If none of the above apply, provide a URL or description of your own custom license” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c077** By listing, a provider warrants it has authority to grant the licences specified in its listing.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “You have the authority to grant the licenses specified in your listing” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c089** Users must comply with the licensing or usage restrictions attached to paid data products.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Users must comply with any licensing or usage restrictions associated with paid data products” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c110** Opendatabay's buyer docs say data licences are granted directly by data providers, not by Opendatabay.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data licenses are granted directly by data providers, not by Opendatabay” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c111** Opendatabay's buyer docs describe it as the conduit, not the licensor.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We act as the conduit, not the licensor.” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c115** Opendatabay says every dataset purchase includes specific licensing terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each dataset purchase includes specific licensing terms that govern” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c131** Opendatabay provides two specialised AI training licences.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay provides two specialised AI training licenses” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/ai-licensing-overview.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c132** Opendatabay's General AI training licence is for non-commercial use only; the Commercial one gives full commercial rights for models and outputs.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Full commercial rights for models and outputs” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/ai-licensing-overview.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c133** Opendatabay lets sellers define and apply custom licences to their datasets.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “empowers data sellers to define and apply custom licenses to their datasets” — Opendatabay, <https://docs.opendatabay.com/standard-data-licenses/custom.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c134** Buyers can view a dataset's licence before deciding to purchase.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Buyers can view the associated license for each dataset before making a purchase decision.” — Opendatabay, <https://docs.opendatabay.com/standard-data-licenses/custom.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c136** In Opendatabay's Commercial AI training licence the Licensor is the party that collected, prepared and owns the Data Product.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The individual or entity that collected, prepared, and owns the Data Product and is granting this License” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c137** The Commercial AI training licence grants a non-exclusive, worldwide, perpetual right, subject to termination.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “non-exclusive, worldwide, perpetual (subject to termination rights in Section 10) right to use this Data Product” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c138** The Commercial AI training licence forbids reselling, redistributing or sublicensing the Data Product itself.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Resell, redistribute, or sublicense the Data Product itself” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c139** The Commercial licence forbids intentionally removing or altering watermarks, cryptographic signatures or provenance metadata.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Intentionally remove, obscure, or alter any digital watermarks, cryptographic signatures, or provenance metadata” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c141** Licensor compliance checks under the Commercial licence are limited to once a year with 60 days' written notice.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “no more than once per year, with sixty (60) days' advance written notice” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c142** Opendatabay is a third-party beneficiary of the Commercial licence solely to enforce the ban on off-platform transactions.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay is a third-party beneficiary of this License solely for the purposes of enforcing the prohibition on off-platform” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c143** The Commercial licence has the licensor represent that the data was collected in compliance with data protection law including GDPR.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The Data Product was collected and provided in compliance with applicable data protection and related laws” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c144** The licensor represents only that it used best practices and reasonable technical measures to filter out personal data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “used commercial best practices and reasonable technical measures to filter and exclude personal data/PII” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c145** Use of the Commercial licence outside the Opendatabay platform or without its authorisation is prohibited.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Its use outside the Opendatabay platform, or without Opendatabay's knowledge and authorisation, is strictly prohibited.” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c146** The General AI training licence permits use only for internal research, evaluation and educational purposes.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “solely for internal research, evaluation, and educational purposes” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/general-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c147** The General AI training licence forbids commercial deployment, production API use and any monetisation.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Commercial deployment, use in production API services, or any form of monetisation is NOT permitted.” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/general-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c148** The General licence warranty covers only the right to license and that the data was not obtained in violation of law.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensor warrants that it has the right to license the Data Product under this License” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/general-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c154** The GBP 371,000 egocentric video listing is labelled with a CC BY 4.0 licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CC BY 4.0 (Creative Commons Attribution 4.0 International)” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c163** The thermography listing's licence is shown as Proprietary.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “License: Proprietary” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact
- **c164** The thermography listing's AI training rights grant a non-exclusive, worldwide, perpetual right to train and evaluate models.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensee is granted a non-exclusive, worldwide, and perpetual right to” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact
- **c166** The GBP 500,000 speech listing is labelled CC0, no rights reserved.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CC0 — No Rights Reserved” — Opendatabay (listing by S CHAND AND COMPANY LIMITED), <https://www.opendatabay.com/data/premium/e6386607-7899-457b-bb85-5f31ae6c11fb> · docs · retrieved 2026-10-01 · quote check: exact
- **c169** The free portrait dataset forbids redistribution, resale or sublicensing of the image files unless authorised.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Redistribution, resale, or sublicensing of the source or target image files is not permitted unless explicitly authorized.” — Opendatabay (listing by DGPH Outsourcing OU / FixThePhoto), <https://www.opendatabay.com/data/ai-ml/292edf15-04fc-4fca-9935-998f07e3dc36> · docs · retrieved 2026-10-01 · quote check: exact
- **c173** The Opendatabay Labs agriculture dataset is free under CC0 public domain.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CC0: Public Domain” — Opendatabay (listing by Opendatabay Labs), <https://www.opendatabay.com/data/government/cb9cdf12-ada1-4f69-9eb2-99a51f91c43b> · docs · retrieved 2026-10-01 · quote check: exact
- **c183** The CC0-labelled speech listing's AI training rights forbid redistributing or sharing the data product outside licensed usage.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The data product itself may not be redistributed or shared outside licensed usage.” — Opendatabay (listing by S CHAND AND COMPANY LIMITED), <https://www.opendatabay.com/data/premium/e6386607-7899-457b-bb85-5f31ae6c11fb> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c032** The Data Provider is responsible for the security, availability and integrity of its data.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “The Data Provider is responsible for the security, availability, and integrity of the data.” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c063** Raw datasets uploaded by providers are never exposed unless explicitly made public.  
  _architecture · legal_text · as of 2026-02-27 (page_dated)_
  - “Raw datasets are never exposed unless explicitly public.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c064** Providers may deliver datasets to buyers via download, API, email or other agreed methods.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Providers may deliver datasets via download, API, email, or other agreed methods.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c096** When a transaction takes place, the Data Provider can deliver the dataset directly to the approved customer environment.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “the Data Provider can deliver the dataset directly to the approved customer environment” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c103** Managed access gives continuous access to datasets stored on cloud platforms such as AWS, Azure and Snowflake.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Continuous access to datasets stored on cloud platforms such as AWS, Azure, and Snowflake” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c105** The download delivery method gives the buyer a direct file download after purchase completion.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Direct file download after purchase completion” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); a clause, button or delivery mechanic in the vendor's own terms or UI; exists only on opendatabay.com by nature.
  - verifier (scope): **scope_ok** — Docs describe the 'Downloadable Package' method this way; the page does not say where the files are hosted, as the matrix note admits.
- **c106** The API delivery method gives real-time data access through API endpoints.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Real-time data access via API endpoints” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c107** For cloud or managed access, the provider grants the buyer access credentials to cloud storage.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Provider grants access credentials” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c108** Custom delivery is negotiated between buyer and seller and may use FTP, direct database access or physical media.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Negotiated delivery method between buyer and seller” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c109** Some listings use a provider-specified delivery method set out in the dataset description.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Unique delivery method outlined in dataset description” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c155** The egocentric listing is delivered by custom delivery or S3 rather than instant download.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CUSTOM, S3” — Opendatabay (listing by Infobay.Ai), <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca> · docs · retrieved 2026-10-01 · quote check: exact
- **c160** The thermography listing is sold by instant download.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “INSTANT DOWNLOAD” — Opendatabay (listing by Dira Reliability S.L.), <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c029** Listing terms require all data products to be accurate, complete, lawful and clearly described.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “All data products must be accurate, complete, lawful, and clearly described.” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** Opendatabay may review or suggest modifications to listings for market alignment and competitiveness.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay may review or suggest modifications to ensure market alignment and competitiveness” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c057** Opendatabay carries out KYC/KYB due diligence before approving a data provider.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay conducts due diligence (KYC/KYB) before approval.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c059** The provider agreement prohibits uploading illegal, stolen, scraped or unconsented data, without saying whose consent is required.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Uploading illegal, stolen, scraped, or unconsented data is strictly prohibited.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c067** Opendatabay may audit a provider's data sources or request documentation, and providers must cooperate.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Opendatabay may audit data sources or request documentation. Providers must cooperate with investigations.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c078** Opendatabay prohibits listing first-party data collected without explicit consent.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “First-party data collected without explicit consent” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c079** Opendatabay prohibits listing personally identifiable information without proper anonymisation.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Personally Identifiable Information (PII) without proper anonymization” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c080** Opendatabay prohibits listing data scraped from websites in violation of their terms of service.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Data scraped from websites in violation of their terms of service” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c081** Providers must keep records of consent where applicable; the terms do not require passing them to buyers.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Maintain records of consent where applicable” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c082** Providers must supply proof of data ownership on request.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Provide proof of data ownership upon request” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c083** Opendatabay reserves the right to conduct data quality audits.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Conduct data quality audits” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c112** Opendatabay's buyer compliance page describes basic verification of data provider accounts and no equivalent check on buyers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Basic verification of data provider accounts” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c120** Provider verification at onboarding takes 1-2 business days.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Timeline: 1-2 business days” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/data-provider-onboarding.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c121** Opendatabay's onboarding verification includes checking data product suitability.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data product suitability” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/data-provider-onboarding.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c130** Opendatabay's seller checklist asks providers to confirm data was collected with proper consent.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Collected with proper consent” — Opendatabay, <https://docs.opendatabay.com/for-data-providers/creating-high-quality-data-products.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c185** Providers must ensure their datasets are complete, safe and accurately described.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Ensure datasets are complete, safe, and accurately described.” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c033** A provider may revoke brokerage by delisting, but revocation does not affect sales already executed.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “revocation does not affect already executed sales or obligations” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** When brokerage for a product ends, the provider must still deliver any pending sales.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “the provider must ensure delivery of any pending sales” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c073** Datasets a provider deletes are permanently removed from Opendatabay's systems; the clause says nothing about copies buyers hold.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Deleted datasets are permanently removed from our systems” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** Provider user-account data is deleted within 48 hours of a verified deletion request.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “User account data is deleted within 48 hours of a verified deletion request” — Opendatabay, <https://www.opendatabay.com/legal/seller> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c084** Opendatabay reserves the right to remove non-compliant data products.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “Remove non-compliant data products” — Opendatabay, <https://www.opendatabay.com/legal/right> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c093** Opendatabay reserves the right to remove unauthorised or infringing content.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “Opendatabay reserves the right to remove unauthorized or infringing content.” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c113** In a dispute between a buyer and a provider, Opendatabay acts as a neutral intermediary.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Opendatabay acts as a neutral intermediary” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c114** Opendatabay's buyer docs say refunds may be considered based on the terms of service.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Refunds may be considered based on terms of service” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/compliance-and-legal.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c140** On termination or on the licensor's written request, the licensee must promptly delete or irreversibly anonymise all copies.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensee must promptly delete or irreversibly anonymise all copies of the Data Product” — Opendatabay, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c049** Opendatabay may agree different commercial terms for bespoke brokerage or enterprise transactions in a separate written agreement.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “may also agree different commercial terms for bespoke brokerage or enterprise transactions” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c097** When a required dataset is not on the marketplace, Opendatabay says it helps source bespoke data requirements.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “When a required dataset is not currently available, we help source bespoke data requirements.” — Opendatabay, <https://docs.opendatabay.com/marketplace/how-opendatabay-works.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c102** Opendatabay lists customised data reports priced per report as a purchase type.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Customised data reports tailored to specific requirements, where pricing is determined per report” — Opendatabay, <https://docs.opendatabay.com/for-data-buyers/purchase-types.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c177** Opendatabay's Request a Dataset page invites buyers who cannot find data to ask Opendatabay to help find it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request data from Opendatabay and we will help you find it” — Opendatabay, <https://www.opendatabay.com/request-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c178** Opendatabay says its network of data providers and data enthusiasts helps find or create requested data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our network of data providers and data enthusiasts are here to help you find or create the data” — Opendatabay, <https://www.opendatabay.com/request-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Opendatabay is active: its Platform Fees & Commission Schedule was last updated on 24 August 2026.  
  _status · legal_text · as of 2026-08-24 (page_dated)_
  - “Last Updated: August 24, 2026” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Companies House lists OPENDATABAY LTD (15711573) as Active, last confirmation statement dated 16 May 2026. The specific 24 August 2026 fee-schedule date is vendor-only. Note the register also shows a First Gazette compulsory strike-off notice on 14 Apr 2026, discontinued 15 Apr 2026 after accounts were filed (see missed).
    - “Company status Active” — Companies House (UK government company register), <https://find-and-update.company-information.service.gov.uk/company/15711573> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote 'Last Updated: August 24, 2026' is on /legal/fees. A vendor page date is weak status evidence; the Companies House 'Active' entry (blind verdict) is the stronger support and could be added as a second source.
- **c002** Opendatabay's Platform Fees & Commission Schedule took effect on 24 August 2026, the newest dated change found to its terms.  
  _event · legal_text · as of 2026-08-24 (page_dated)_
  - “This policy is effective as of August 24, 2026” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — WebSearch unavailable in this run (no search available); the effective date of the vendor's own fee schedule exists only on opendatabay.com/legal/fees. Newest independently dated events found: Companies House CS01 of 16 May 2026 and the strike-off notice of 14 Apr 2026 (discontinued 15 Apr 2026); neither is a terms change, so 'newest dated change to its terms' stands unchallenged.
  - verifier (scope): **scope_ok** — 'This policy is effective as of August 24, 2026' is on /legal/fees; newer than the ToS update of 26 July 2026 and the 27 Feb 2026 legal pages.
- **c003** Companies House records a confirmation statement for OPENDATABAY LTD made on 16 May 2026.  
  _status · filing · as of 2026-05-16 (publication)_
  - “Confirmation statement made on 16 May 2026 with no updates” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c004** A First Gazette notice for compulsory strike-off of OPENDATABAY LTD was filed on 14 April 2026.  
  _event · filing · as of 2026-04-14 (publication)_
  - “First Gazette notice for compulsory strike-off” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c005** The compulsory strike-off action against OPENDATABAY LTD was discontinued on 15 April 2026.  
  _event · filing · as of 2026-04-15 (publication)_
  - “Compulsory strike-off action has been discontinued” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c006** OPENDATABAY LTD filed total exemption full accounts made up to 31 May 2025 on 10 April 2026.  
  _event · filing · as of 2026-04-10 (publication)_
  - “Total exemption full accounts made up to 31 May 2025” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c051** Opendatabay may change its fee schedule at any time, with continued use counting as acceptance.  
  _terms · legal_text · as of 2026-08-24 (page_dated)_
  - “Opendatabay reserves the right to update these terms at any time; continued use constitutes acceptance.” — Opendatabay, <https://www.opendatabay.com/legal/fees> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c086** Opendatabay's Terms of Service were last updated on 26 July 2026.  
  _event · legal_text · as of 2026-07-26 (page_dated)_
  - “Last Updated: July 26, 2026” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### demand

- **c013** Opendatabay says it has more than 30,000 professionals or data users.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “30k+ Professionals / Data Users” — Opendatabay, <https://www.opendatabay.com/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch unavailable in this run (no search available); no independent audience measure reachable. IBM Partner Plus directory entry (ibm.com/partnerplus/directory/company/10041) carries no user figures. Context: the company's filed accounts to 31 May 2025 report an average of 1 employee (including directors) and GBP 1,087 cash, which neither confirms nor contradicts a registered-user count.
  - verifier (scope): **scope_ok** — Correctly framed as vendor-stated; quote is on /about.
- **c014** Opendatabay says its datasets have been downloaded more than 23,000 times.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “23K+ Downloads” — Opendatabay, <https://www.opendatabay.com/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch unavailable in this run (no search available); no independent download statistic reachable; the IBM partner directory entry and the partners page carry none. The figure appears only on opendatabay.com/about.
  - verifier (scope): **scope_ok** — Correctly framed as vendor-stated; quote is on /about.
- **c179** The Request a Dataset page shows a public list of recent dataset requests.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Discover the latest dataset requests submitted by researchers, developers, and businesses” — Opendatabay, <https://www.opendatabay.com/request-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c182** Opendatabay's article on who buys data is placeholder content, dated 31 August 2026.  
  _offer · vendor_stated · as of 2026-08-31 (page_dated)_
  - “Placeholder content. This article will profile the buyer landscape for niche data” — Opendatabay, <https://www.opendatabay.com/resources/selling-data/who-is-buying-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c094** Under the Terms of Service, disputes unresolved within 30 days go to binding arbitration.  
  _terms · legal_text · as of 2026-07-26 (page_dated)_
  - “disputes unresolved in 30 days will be submitted to binding arbitration” — Opendatabay, <https://www.opendatabay.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c186** Disputes under the Brokerage & Listing Terms go exclusively to the courts of London.  
  _terms · legal_text · as of 2026-02-27 (page_dated)_
  - “shall be resolved exclusively in the courts of London” — Opendatabay, <https://www.opendatabay.com/legal/listing> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** OPENDATABAY LTD's filed accounts for the period to 31 May 2025 report an average of 1 person employed, including directors.  
  _number · filing · as of 2025-05-31 (publication) · scope: UK_ · **1 average monthly persons employed** (including directors, first accounting period to 31 May 2025; accounting period)
  - “The average monthly number of persons (including directors) employed by the company during the period was” — Companies House (filed by OPENDATABAY LTD), <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history/MzUxNTM4NDY4M2FkaXF6a2N4/document?format=pdf&download=0> · filing · retrieved 2026-10-01 · quote check: js_empty
- **v002** OPENDATABAY LTD's balance sheet at 31 May 2025 shows negative total equity of GBP 19,166, with GBP 1,087 cash against GBP 20,253 of short-term creditors.  
  _number · filing · as of 2025-05-31 (publication) · scope: UK_ · **-19166 GBP** (total equity (net current liabilities) per filed small-company balance sheet; no profit and loss account filed; as at 31 May 2025)
  - “Total equity (19,166)” — Companies House (filed by OPENDATABAY LTD), <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history/MzUxNTM4NDY4M2FkaXF6a2N4/document?format=pdf&download=0> · filing · retrieved 2026-10-01 · quote check: js_empty

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.opendatabay.com/legal/listing>, <https://docs.opendatabay.com/ai-training-and-model-development-licenses/commercial-ai-training-and-fine-tuning-data-license.md>, <https://www.opendatabay.com/resources/selling-data/how-to-price-a-data-product>
- `matrix.versioning` — not_published; tried <https://docs.opendatabay.com/for-data-providers/listing-data-product.md>, <https://www.opendatabay.com/legal/listing>, <https://www.opendatabay.com/data/premium/c273a3ea-1c0a-4bde-8e36-2e2fdd9060b4>
- `questions.Q4` — not_published; tried <https://www.opendatabay.com/legal/seller>, <https://www.opendatabay.com/legal/right>, <https://www.opendatabay.com/legal/listing>, <https://www.opendatabay.com/legal/terms>
- `other.udtr_method` — not_published; tried <https://www.opendatabay.com/>, <https://docs.opendatabay.com/llms.txt>, <https://www.opendatabay.com/resources>, <https://docs.opendatabay.com/readme.md>
- `other.consent_of_people_depicted` — not_published; tried <https://www.opendatabay.com/legal/right>, <https://www.opendatabay.com/legal/seller>, <https://www.opendatabay.com/data/ai-ml/b265aff0-f1c6-4bb8-b0c3-a256fda10cca>, <https://www.opendatabay.com/data/ai-ml/292edf15-04fc-4fca-9935-998f07e3dc36>, <https://www.opendatabay.com/resources/creative-ai-data/sell-my-images-to-ai>
- `other.buyer_demand_and_volumes` — not_published; tried <https://www.opendatabay.com/resources/selling-data/who-is-buying-data>, <https://www.opendatabay.com/about>
- `other.independent_press_and_financials` — not_found; tried <https://www.opendatabay.com/about>, <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history>
- `other.subscription_access_after_cancel` — not_published; tried <https://docs.opendatabay.com/for-data-buyers/purchase-types.md>, <https://www.opendatabay.com/legal/terms>
- `other.where_downloads_are_hosted` — not_published; tried <https://www.opendatabay.com/legal/seller>, <https://docs.opendatabay.com/for-data-buyers/data-delivery-methods.md>
- `other.progressive_band_method` — js_empty; tried <https://www.opendatabay.com/legal/fees>, <https://docs.opendatabay.com/calculator.md>, <https://docs.opendatabay.com/for-data-providers/platform-fees-and-pricing.md>

## Conflicts

- c019, c119: Onboarding docs, provider agreement and ToS all restrict selling to registered businesses; the about-page line is marketing. (live_primary_wins_terms)
- c181, c119: Same as above: the terms bar individual sellers. (live_primary_wins_terms)
- c166, c183: The same listing shows a CC0 label and an AI-training-rights text banning redistribution; which governs is not stated. (unresolved)
- c094, c186: ToS names arbitration; the Brokerage & Listing Terms name the London courts. Different documents and parties, so both may apply. (unresolved)

## Leads, not cited

- <https://find-and-update.company-information.service.gov.uk/company/15711573/filing-history> — Total exemption accounts to 31 May 2025 (PDF) would give balance-sheet scale; not opened.
- <https://www.opendatabay.com/legal/privacy> — Platform privacy policy; not read.
- <https://www.opendatabay.com/resources/robotics-data/egocentric-data-for-robotics> — Egocentric-data article under the robotics hub; hub page itself showed only titles.
- <https://www.opendatabay.com/partners> — Partner list; not fetched.
