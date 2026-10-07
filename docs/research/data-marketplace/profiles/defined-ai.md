# Defined.ai

ai_data_catalogue · deep · status: **active** · also known as DefinedCrowd, DefinedCrowd Corporation

> Rendered from `ledger/defined-ai.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Marketplace / Data Marketplace ("off-the-shelf (OTS)" or "ready-to-use" datasets); speech bundles sold as the Data Access Plan” and its bespoke side “Custom data collection ("custom collection", "custom request"; also custom-packaged subsets of catalogue data)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c007, c015, c033 | DefinedCrowd Corporation is Licensor on the single standard Data License Agreement covering all datasets, including partner-supplied ones; the DLA says the Licensor owns the data. |
| economics_model | mixed | c070, c015, c022, c088 | Own crowd-collected data sold as principal; third-party partners earn 'licensing fees from data marketplace sales'. The split or percentage is not published. |
| who_pays_fee | unknown |  | No fee schedule for buyers or providers is published. |
| supply_models | own_collection, third_party_providers, partner_licensed | c070, c048, c031, c046, c055, c077 | Own crowd (Neevo) collections; third-party partners admitted via the Supplier Program; Getty Images content under a strategic engagement. No evidence found that client-commissioned custom collections are relisted. |
| custody_model | copy_to_buyer | c019, c039 | DLA: Licensor delivers data electronically or on tangible media; FAQ: delivered after payment clears. |
| transaction_mode | contact_sales | c036, c057, c063, c064, c037 | Every listing checked shows 'Get a quote'; no prices or cart; payment by ACH transfer. FAQ still refers to 'standard buying options' and 2021 rebrand mentioned one-off purchases and subscriptions (see conflicts). |
| public_prices | some | c057, c066, c069 | No prices on the catalogue or on the four listings opened; the only published prices are the 2024 Data Access Plan speech bundles in a press release. |
| licence_model | standard_licence | c033, c008 | FAQ: all datasets under the standard licence agreement. The partner page mentions 'agreed use cases', so per-deal variation is possible but undocumented. |
| exclusivity_offered | unknown |  | Standard DLA is non-exclusive; no page says whether exclusive licences are offered on request. |
| public_listing | public_indexable | c005, c063, c064, c065 | Catalogue and listing pages load without login and appear in web search. |
| buyer_vetting | unknown |  | Quote-based sales imply some screening, but no published buyer-vetting rule was found. |
| sample_mechanics | sample_on_request | c036, c064, c035 | Live listings show 'Request a Sample'; the FAQ's 'instantly download free samples' conflicts (see conflicts). |
| versioning | unknown |  | DLA and listings are silent on versions, updates or corrections. |
| human_subject_consent_docs | asserted_only | c024, c071, c072, c061, c016 | Consent is asserted and provenance records are said to be kept, but no source says consent records are handed to buyers, and the DLA disclaims all warranties. |
| contributor_pay_model | one_off | c050, c051 | Crowd contributors are paid task rates (at least minimum wage). Third-party data partners are paid licensing fees from sales (c022), which is a provider, not contributor, arrangement. |
| catalogue_plus_custom | both | c002, c004, c043, c058 |  |
| erasure_after_sale | not_addressed | c014 | The DLA's deletion duty is triggered only by termination of the licence; its Data Protection section says nothing about data-subject withdrawal after delivery. |
| quality_evidence | both | c023, c047, c053 | Defined.ai reviews and tests partner data; suppliers must document provenance and quality. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Defined.ai (vendor-stated only) says demand is strongest for multimodal data for robotics, computer vision and healthcare, with 65% revenue growth in 2025; it sells by hours or file counts with volume and academic discounts. No independent source on who the buyers are was found. | c089, c032, c091, c041, c042 |
| Q2 | partial | Providers get Defined.ai's enterprise buyer reach and sales handling in return for licensing fees and a non-circumvention clause; Defined.ai also resells through Crowdworks in Korea. Partner earnings figures are vendor-stated only. | c022, c029, c030, c031, c090, c088, c092 |
| Q3 | sourced | Inventory comes from Defined.ai's own Neevo crowd collections, third-party partners admitted through a staged Supplier Program that requires consent, documentation and the right to commercialise, and licensed content such as Getty Images. All are sold under Defined.ai's own licence. | c070, c048, c031, c046, c055, c024, c077, c079, c080 |
| Q4 | unknown | No source says whether custom-collected client data is ever relisted, or how resale rights are carved out. |  |
| Q5 | sourced | DefinedCrowd Corporation is licensor of record and claims ownership of the data. It indemnifies buyers against US IP and data-protection claims, capped at fees paid, while suppliers indemnify Defined.ai up to twice the business value. | c007, c015, c017, c018, c083, c084, c085 |
| Q6 | partial | Data is copied to the buyer: delivered electronically or on physical media after payment clears. Mechanism (download link, bucket transfer) is not published. | c019, c039, c040 |
| Q7 | partial | Contributor consent is asserted (platform ToU/Privacy consent) and suppliers must warrant consent and privacy/publicity rights, but buyers get no consent records and the DLA disclaims warranties. Nothing addresses property or store owners, e.g. for in-store retail imagery. | c049, c024, c083, c071, c072, c065, c016 |
| Q8 | sourced | The standard DLA is non-exclusive, internal-use, non-transferable and forbids resale, but allows commercial models trained on the data; Defined.ai may audit and requires certified deletion on termination. No fingerprinting or leakage controls were found. | c008, c009, c010, c011, c012, c013, c014, c020, c034 |
| Q9 | sourced | Deals close through sales: every listing is 'Get a quote', payment is USD by ACH with no refunds, and 2024 speech bundles were published at EUR 50k-500k. Provider revenue share is not published; suppliers' payment terms sit in a separate agreement. | c036, c057, c037, c038, c066, c069, c022, c078 |
| Q10 | partial | A listing is a dataset page with type, amount, duration, format and domain; buyers can have custom subsets packaged. Nothing published on revisions, orders or what past buyers get on updates or withdrawal. | c063, c064, c045, c082 |
| Q11 | partial | Buyers see listing metadata and can request a sample (FAQ says free instant download). Defined.ai says it reviews and tests partner data and keeps provenance and bias records. | c035, c036, c059, c023, c047, c072 |
| Q12 | sourced | The off-the-shelf side is the 'Marketplace' of 'ready-to-use' datasets; the bespoke side is 'custom data collection'. Buyers who cannot find data are routed to a custom collection or the planned quarterly pipeline. | c002, c003, c004, c043, c044, c058, c062 |

## Narrative

### positioning

Defined.ai (formerly DefinedCrowd, renamed 2021 [c075]) pitches 'ready-to-use' AI training datasets across speech, text, image and video [c003] next to custom collection and annotation [c004], calling itself an ethical AI data marketplace 'alongside custom services' [c002]. Growth and partner-earnings figures are all vendor-stated [c032][c031][c030].

### supply

Three supply streams: its own crowd (Neevo, 1.6M+ claimed contributors) [c070][c006]; third-party data partners, whose datasets it says grew 1,200% in 2025 [c031][c046]; and licensed content such as Getty Images [c055]. Contributors are recruited through own channels, ads and local partners [c048].

### listing

Listings show type, content type, amount, duration, subtype, domain and file format plus use cases, with 'Get a quote' and 'Request a Sample' [c036][c063][c064]. No price and no third-party provider name appeared on the four listings opened.

### trust

Defined.ai asserts full contributor consent and keeps provenance records [c071][c072][c060], but the DLA provides the data 'as is' [c016]; its indemnity covers US IP and data-protection claims [c017].

### transaction

Purchase is quote-led [c036][c057]. Payment is USD by ACH, PO/SOW on request, no refunds [c037][c038]; delivery follows cleared funds, typically 2-3 business days [c039][c040]. Suppliers may not bypass Defined.ai with referred customers [c088].

### pricing

No list prices on the catalogue [c057]. The 2024 Data Access Plan sold speech hours in bundles from EUR 50,000 for 315 h to EUR 500,000 for 3,125 h [c066][c069]. Volume and academic discounts are quoted [c041][c042].

### licence

One standard DLA for all datasets [c033]: DefinedCrowd Corporation licenses non-exclusive, non-transferable, internal-use rights [c007][c008][c009]; models trained on the data may be commercialised, the data itself may not [c010][c011][c012]. Washington law [c021]. The FAQ calls it perpetual; the DLA runs until terminated [c034][c020].

### custody

Data is copied to the buyer, electronically or on physical media [c019], after payment clears [c039].

### vetting

Suppliers pass four stages: Enrolment (company policy appraisal) [c081], Clearance (sign Defined.ai's supplier DLA and dataset-level Ethical Questionnaires) [c079][c080], Onboarding, and Maintenance, with every new sample set re-vetted [c082]. Suppliers warrant IP, privacy and publicity rights [c083], indemnify Defined.ai up to 2x business value [c084][c085], and accept yearly audits [c086]. Data must carry consent, documentation and commercial rights [c024].

### contributor_pay

Crowd contributors are paid task rates of at least minimum wage [c050][c051]. Data partners earn licensing fees from marketplace sales [c022]; the split is not published and supplier obligations sit in a separate agreement [c078].

### post_sale

Licensee must delete, destroy or return data and certify on termination [c014]; Defined.ai may audit licensee records [c013]. No provision on data-subject erasure after delivery.

### catalogue_custom

Buyers who cannot find data can order a custom collection or wait for planned catalogue releases [c043][c044]; catalogue subsets are custom-packaged [c045]. Custom work is sold via 'Talk to a data expert' [c062].

### changes

Operating as of April 2026 [c001]. At the 2021 rebrand, buyers could purchase by subscription or one-off and developers could sell as third-party vendors [c074]; today's listings are quote-only [c036].

### demand

Vendor-stated: 65% revenue growth and 143% NRR in 2025, with strongest demand for multimodal robotics, vision and healthcare data [c032][c091][c089]. Crowdworks AI resells the catalogue in Korea [c092].

## Buyer journey

1. Lands on defined.ai, which pitches ready-to-use datasets and custom collection side by side. [c003, c004]
2. Clicks 'Browse Marketplace' to /datasets: filters by type, language and domain across 819 datasets; no prices are shown and 'Get in touch' is offered if nothing fits. [c005, c057]
3. Opens a listing: sees type, amount (hours or files), duration, domain, file format and use cases; the only actions are 'Get a quote' and 'Request a Sample'. [c036, c063, c064]
4. Requests a sample; the FAQ describes an instant free download and the website terms license samples for limited use. [c035, c056]
5. Requests a quote; volume and academic discounts and custom-packaged subsets (by age, gender, accent) are negotiated with sales. [c041, c042, c045]
6. Accepts the standard Data License Agreement with DefinedCrowd Corporation: non-exclusive, internal-use, no resale, models may be commercialised. [c033, c007, c008, c010, c012]
7. Pays in USD by ACH bank transfer (PO/SOW available); no refunds. [c037, c038]
8. Receives the data once funds clear, generally 2-3 business days, delivered electronically or on physical media. [c039, c040, c019]
9. If the data is not listed, orders a custom collection or waits for planned catalogue releases. [c043, c044, c058]
10. After purchase: subject to audit of its records, and must delete and certify destruction if the licence terminates. [c013, c014]

## Claims

### positioning

- **c003** Defined.ai's home page presents ready-to-use AI training datasets across speech, text, image, video and multimodal.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The largest selection of ready-to-use AI training datasets across speech, text, image, video, and multimodal” — Defined.ai, <https://defined.ai/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c076** Defined.ai's Supplier Program terms describe Defined.ai as building a marketplace for ethical AI training data.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Defined.ai is building the ultimate marketplace for ethical, high-quality AI training data” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact

### supply

- **c006** Defined.ai says it has a crowd of more than 1.6 million contributors in over 150 countries.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **1600000 crowd contributors** (vendor-stated lower bound of crowd size, not verified; point in time)
  - “Tap into a crowd of 1.6M+ global experts spanning 150+ countries” — Defined.ai, <https://defined.ai/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The 1.6M+/150+ figure appears only on defined.ai and on bios or event pages that repeat it. The only independent figure found is older and company-attributed: The Seattle Times (31 Jul 2019, via Tech Xplore) says DefinedCrowd 'says' 130,000 people across 60 countries had worked on its tasks. That does not contradict a 2026 figure.
  - verifier (scope): **scope_ok** — The quote matches and the statement is correctly framed as 'says'. The quote says '1.6M+ global experts', and the statement's 'contributors' is a fair gloss.
- **c031** Defined.ai says third-party partner datasets on its marketplace grew 1,200% in 2025.  
  _number · vendor_stated · as of 2026-01-27 (publication)_ · **1200 percent increase in third-party partner datasets** (vendor-stated, calendar 2025; per year)
  - “In 2025, the Defined.ai Data Marketplace saw a 1,200% increase in third-party partner datasets” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Appears only in the Jan 2026 release and its wire copies (press_relayed). No independent report repeats the 1,200% figure.
  - verifier (scope): **scope_ok** — The quote says the NUMBER of third-party partner datasets grew 1,200%, not sales. The statement matches that.
- **c046** Defined.ai's FAQ says data owners can sell quality AI training data on its marketplace.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “If you own quality AI training data, we would be happy to help you sell it” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c048** Defined.ai's FAQ says it recruits contributors via its own channels, third-party advertising platforms and local partnerships.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “self-owned channels, 3rd party advertisement platforms, and partnerships” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c055** Defined.ai announced in January 2025 that datasets incorporating Getty Images content would be available on its marketplace.  
  _event · vendor_stated · as of 2025-01-08 (publication)_
  - “will be accessible on Defined.ai's Marketplace” — Defined.ai, <https://defined.ai/press-room/strategic-engagement-with-getty-images> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Only the vendor release and its wire copies (newswire.com, accessnewswire, Yahoo Finance) were found. Getty's newsroom returned nothing on Defined.ai, a PYMNTS piece on Getty's GenAI strategy does not mention it, and EDGAR full-text search for "Defined.ai" returns no filings, including none from Getty Images. The wire copy says Getty datasets are available 'through Defined.ai's sales team' (a lead for the scope check).
  - verifier (scope): **scope_ok** — The quote supports it (8 Jan 2025). The same release also says Getty datasets are 'now available through Defined.ai's sales team', which matters for matrix.transaction_mode: they are sold through contact-sales, not self-serve checkout (see v004).
- **c070** Defined.ai says its Data Access Plan speech datasets are sourced from its own crowd platform, Neevo.  
  _offer · vendor_stated · as of 2024-09-26 (publication)_
  - “provides the source for these high-quality datasets” — Defined.ai, <https://defined.ai/press-room/defined-ai-launches-data-access-plan-dap-allowing-access-to-speech-datasets-at-affordable-prices> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c077** Under the Supplier Program terms, an applicant grants Defined.ai a free, worldwide, non-exclusive licence to share its data samples with Defined.ai's customers.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “grants Defined.ai a worldwide, free, non-exclusive and unencumbered license to share the data samples” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c087** The Supplier Program terms are non-exclusive for both parties.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “The GT&C are non-exclusive, and nothing in the GT&C prevents either Party from entering into the same or similar” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c090** Defined.ai says it has become a preferred monetization channel for organisations holding proprietary data.  
  _outcome · vendor_stated · as of 2026-01-27 (publication)_
  - “Defined.ai has emerged as a preferred monetization channel for organizations holding valuable proprietary data assets.” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### listing

- **c035** Defined.ai's FAQ says buyers can instantly download free samples from the website.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Sure, you can instantly download free samples from the website.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c036** Defined.ai's listing page for its Stock Videos dataset offers 'Get a quote' and 'Request a Sample' buttons.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Get a quote” — Defined.ai, <https://defined.ai/datasets/stock-videos> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “Request a Sample” — Defined.ai, <https://defined.ai/datasets/stock-videos> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — UI elements of a vendor listing page can only be evidenced by that page.
  - verifier (scope): **scope_ok** — The live page shows 'Get a quote' (twice, within the listing) and 'Request a Sample', with no price and no cart or buy button. That supports contact_sales for this listing only.
- **c056** Defined.ai's website Terms of Use grant visitors a limited non-exclusive licence to use dataset samples.  
  _terms · legal_text · as of 2023-09-20 (page_dated)_
  - “limited, non-exclusive, non-transferable license to use the dataset samples” — Defined.ai, <https://defined.ai/terms-of-use> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c063** Defined.ai's Meeting Recordings listing describes 99.5K hours of meeting video with audio, transcripts and metadata, and offers 'Get a quote'.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “99.5K hours” — Defined.ai, <https://defined.ai/datasets/meeting-recordings> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “Get a quote” — Defined.ai, <https://defined.ai/datasets/meeting-recordings> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c064** Defined.ai's Dental X-ray listing describes 10,000 CBCT studies in DICOM format and offers 'Get a quote' and 'Request a Sample'.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “10,000 dental X-ray studies in DICOM format of 10,000 individuals” — Defined.ai, <https://defined.ai/datasets/medical-imaging-dental-xrays> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “Request a Sample” — Defined.ai, <https://defined.ai/datasets/medical-imaging-dental-xrays> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c065** Defined.ai's Retail Imaging listing describes over a million in-store images from grocery retailers in six countries.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “over a million real world, in-store images showcasing fixtures, signage, displays, product adjacencies” — Defined.ai, <https://www.defined.ai/datasets/retail-images> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### discovery

- **c005** Defined.ai's public dataset catalogue page listed 819 datasets when retrieved.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **819 datasets listed** (count shown on the public catalogue page, all modalities; point in time)
  - “Showing 10 of 819 datasets” — Defined.ai, <https://defined.ai/datasets> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — A live catalogue count exists only on the vendor's own catalogue page; no independent source counts it. Search snippets gave other counts (700+, 817) from listicle-type pages, which are banned as citations and are no basis for correcting it.
  - verifier (scope): **scope_ok** — 'Showing 10 of 819 datasets' is a point-in-time count at retrieval, and the statement says so.
- **c059** Defined.ai's blog describes buyers browsing the marketplace and reviewing free samples before larger sourcing decisions.  
  _offer · vendor_stated · as of 2026-03-25 (publication)_
  - “they can review free samples to assess fit before making larger sourcing decisions” — Defined.ai, <https://defined.ai/blog/future-ai-marketplace> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### trust

- **c016** The Data License Agreement provides the data 'as is' and disclaims all warranties.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “AND LICENSOR HEREBY DISCLAIMS ALL WARRANTIES” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c049** Defined.ai's FAQ says contributors must consent to its Terms of Use and Privacy Policy before using its platform.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “they need to give their consent before start using our platform.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c060** Defined.ai's marketplace explainer says it sources all its data with explicit contributor consent.  
  _offer · vendor_stated · as of 2025-03-16 (publication)_
  - “We source all our data ethically, with explicit consent from contributors.” — Defined.ai, <https://defined.ai/blog/data-marketplace-explainer> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c061** Defined.ai's custom data collection page says every dataset is fully consented, copyright-cleared and privacy-compliant.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Every dataset is fully consented, copyright-cleared, and privacy-compliant, meeting GDPR and HIPAA requirements.” — Defined.ai, <https://defined.ai/solutions/data-collection> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c071** Defined.ai's AI governance page says all its data is sourced with contributor consent and no scraping.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “All data is sourced with 100% contributor consent” — Defined.ai, <https://defined.ai/about-us/ai-governance> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c072** Defined.ai's AI governance page says it documents provenance for every dataset, including contributor consent records.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “contributor consent, data lineage, demographic coverage and bias assessment records” — Defined.ai, <https://defined.ai/about-us/ai-governance> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### transaction

- **c037** Defined.ai's FAQ says it accepts payment in USD by ACH bank transfer.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “We accept USD via ACH bank transfer.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c038** Defined.ai's FAQ says it does not offer refunds.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Unfortunately, we do not offer refunds.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c039** Defined.ai's FAQ says standard purchases are delivered once payment is received.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “For standard buying options, we deliver the datasets as soon as we” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c040** Defined.ai's FAQ says ACH-paid orders are delivered once funds clear, generally in 2-3 business days.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **3 business days (upper bound)** (time for ACH funds to clear before delivery of a standard purchase; range 2-3; per order)
  - “This generally takes 2-3 business days.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Checkout/payment mechanics appear only in the vendor FAQ. No independent source describes them.
  - verifier (scope): **scope_ok** — The cited quote alone ('This generally takes 2-3 business days.') does not mention ACH or delivery. The sentence just before it on the live FAQ does: 'ACH bank transfer orders will be delivered once funds are cleared.' The statement is correct, but a quotecheck on the cited words alone would not show the ACH scope.
- **c062** Defined.ai's custom data collection page invites buyers to talk to a data expert rather than order online.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Talk to a data expert” — Defined.ai, <https://defined.ai/solutions/data-collection> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c088** Supplier Program terms entitle Defined.ai to all fees arising if a supplier circumvents it to deal directly with a referred customer.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Defined.ai shall immediately be entitled to any and all fees arising from the breach of the non-circumvention” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact

### pricing

- **c041** Defined.ai's FAQ offers volume discounts on a quotation basis.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Yes, we do offer discounts depending on the volume of data that you purchase.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c042** Defined.ai's FAQ offers datasets to academia at significant discounts or free.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Yes, we offer datasets for Academia with significant discounts” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c057** Defined.ai's public catalogue page shows no prices and points buyers who cannot find a dataset to 'Get in touch'.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Get in touch” — Defined.ai, <https://defined.ai/datasets> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c066** Defined.ai's Data Access Plan Standard tier offered 315 hours of off-the-shelf speech data for EUR 50,000.  
  _number · vendor_stated · as of 2024-09-26 (publication)_ · **50000 EUR per plan (315 hours of speech)** (price paid by buyer for Standard Data Access Plan; stated as 30% discount on list; implies ~EUR 159 per hour; not stated)
  - “315 hours of speech data for €50,000 (30% discount)” — Defined.ai, <https://defined.ai/press-room/defined-ai-launches-data-access-plan-dap-allowing-access-to-speech-datasets-at-affordable-prices> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — DAP tier prices appear only on defined.ai (press room, blog, data-access-plan page, and resources.defined.ai, which is the same organisation). No independent report or partner page found.
  - verifier (scope): **scope_ok** — The statement correctly scopes this to the 26 Sep 2024 release in the past tense, and the page does say 'off-the-shelf (OTS) speech datasets'. DEFECT: the cited quote is mojibake ('â‚¬50,000'). The page reads 'Standard Plan: 315 hours of speech data for €50,000 (30% discount)', so the quote will fail a verbatim string match until the euro sign is repaired.
- **c067** Defined.ai's Data Access Plan Premium tier offered 625 hours of speech data for EUR 100,000.  
  _number · vendor_stated · as of 2024-09-26 (publication)_ · **100000 EUR per plan (625 hours of speech)** (price paid by buyer for Premium Data Access Plan; stated as 40% discount; not stated)
  - “625 hours of speech data for €100,000 (40% discount)” — Defined.ai, <https://defined.ai/press-room/defined-ai-launches-data-access-plan-dap-allowing-access-to-speech-datasets-at-affordable-prices> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c068** Defined.ai's Data Access Plan Ultimate tier offered 1,565 hours of speech data for EUR 250,000.  
  _number · vendor_stated · as of 2024-09-26 (publication)_ · **250000 EUR per plan (1,565 hours of speech)** (price paid by buyer for Ultimate Data Access Plan; stated as 50% discount; not stated)
  - “1,565 hours for €250,000 (50% discount)” — Defined.ai, <https://defined.ai/press-room/defined-ai-launches-data-access-plan-dap-allowing-access-to-speech-datasets-at-affordable-prices> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c069** Defined.ai's Data Access Plan Elite tier offered 3,125 hours of speech data for EUR 500,000.  
  _number · vendor_stated · as of 2024-09-26 (publication)_ · **500000 EUR per plan (3,125 hours of speech)** (price paid by buyer for Elite Data Access Plan; stated as 55% discount; implies EUR 160 per hour; not stated)
  - “3,125 hours for €500,000 (55% discount)” — Defined.ai, <https://defined.ai/press-room/defined-ai-launches-data-access-plan-dap-allowing-access-to-speech-datasets-at-affordable-prices> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — As for c066: Elite tier figures appear only on Defined.ai's own sites.
  - verifier (scope): **scope_ok** — Correct tier and date. Same DEFECT as c066: the quote holds 'â‚¬500,000' where the page says '€500,000' ('Elite Plan: 3,125 hours for €500,000 (55% discount)').

### licence

- **c007** Defined.ai's Data License Agreement names DefinedCrowd Corporation as the Licensor.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “DefinedCrowd Corporation” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The licence text is vendor-hosted only. NVIDIA NGC's Defined.ai collection links to getdata.defined.ai/default/data-license-agreement-standard (vendor domain) without naming the licensor. The AWS Marketplace seller profile is titled 'DefinedCrowd, Corp.', which corroborates the legal entity name but not its role as Licensor.
  - verifier (scope): **scope_wrong** — The cited quote 'DefinedCrowd Corporation' is only the party name and does not show that it is the Licensor. The statement is TRUE, but the quote says less than it claims. The live DLA (effective 30 Nov 2022) reads 'DefinedCrowd Corporation ("Licensor") with its registered address at 1201 3rd Avenue, STE 2200, Seattle WA 98101, USA'. Re-quote e.g. 'DefinedCrowd Corporation ("Licensor")'.
- **c008** Defined.ai's Data License Agreement grants the buyer a non-exclusive, non-sublicensable, non-transferable licence for the Term.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “non-exclusive, non-sublicensable, and non-transferable license during the Term” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: missing 0.78
- **c009** The Data License Agreement limits use of the data to the licensee's internal business operations.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “Use is solely for the benefit of Licensee in the ordinary course of its internal business operations” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c010** The Data License Agreement permits commercial exploitation of models trained, tested or benchmarked on the licensed data.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “commercial exploitation of models based that have used the Data for training, testing or bench-marking purposes” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c011** The Data License Agreement excludes commercialisation of the data itself, paid or free.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “excludes commercialization of the Data itself, whether free of charge or paid” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c012** The Data License Agreement forbids the licensee to sell, sublicense or distribute the data.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “rent, lease, lend, sell, sublicense, assign, distribute, publish, transfer, or otherwise make available” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c013** The Data License Agreement lets the Licensor periodically inspect and audit the licensee's records.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “periodically inspect and audit Licensee's records with respect to matters covered by this Agreement” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c015** The Data License Agreement states that the Licensor owns all rights, title and interest in the data.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “Licensor owns all rights, title, and interest, including all intellectual property rights, in and to the Data” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c017** The Data License Agreement has the Licensor indemnify the licensee against third-party claims that permitted use infringes US IP or data protection rights.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “Licensee's Permitted Use of the Data infringes or misappropriates such third party's US intellectual property rights” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c018** The Data License Agreement caps the Licensor's aggregate liability at the total amounts paid to it under the agreement.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “EXCEED THE TOTAL AMOUNTS PAID TO LICENSOR UNDER THIS AGREEMENT” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c020** The Data License Agreement's licence runs from the Effective Date until terminated.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “The term of this License begins on the Effective Date and will continue in effect until terminated” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c021** The Data License Agreement is governed by the laws of the State of Washington, USA.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “governed by and interpreted in accordance with the laws of the state of Washington” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c025** Defined.ai says usage of partner data is governed by defined licensing terms and agreed use cases.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Data usage is governed by clearly defined licensing terms and agreed use cases” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c033** Defined.ai's FAQ says all its datasets are covered by its standard licence agreement.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “All Defined.ai datasets are covered by our standard license agreement” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Vendor FAQ statement. NVIDIA NGC's Defined.ai sample pages say 'By downloading and using this dataset, you accept the terms and conditions of the license', linking to Defined.ai's standard DLA. That fits the claim but covers only NGC samples, not all datasets.
  - verifier (scope): **scope_ok** — The quote matches the FAQ. For matrix.licence_model it sits uneasily with the partner page's 'Commercial terms depend on the dataset type, usage, and customer needs, and are always aligned with and approved by the partner' (v003). The profile's 'All are sold under Defined.ai's own licence' may overstate uniformity for partner datasets.
- **c034** Defined.ai's FAQ describes the data licence as perpetual.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The license agreement is perpetual and allows for the” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact

### custody

- **c019** Under the Data License Agreement the Licensor delivers the data electronically, on tangible media or by other means.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “Licensor shall deliver the Data electronically, on tangible media, or by other means” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The licence clause is published only on defined.ai. No independent copy exists (not on EDGAR).
  - verifier (scope): **scope_ok** — The clause is verbatim from the DLA effective 30 Nov 2022. It is generic and permits any delivery means, so on its own it does not settle custody_model beyond 'provider delivers'.

### vetting

- **c023** Defined.ai says partner datasets go through a review for quality, relevance and compliance.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Datasets go through a review process focused on quality, relevance, and compliance.” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c024** Defined.ai requires partner data to be ethically sourced with consent, documentation and the right to commercialise it.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “All data must be ethically sourced, including proper consent, documentation, and the right to commercialize” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The partner sourcing requirement appears only on defined.ai partner pages. No independent source states what Defined.ai requires of partners.
  - verifier (scope): **scope_ok** — The quote matches. It is a stated requirement, which supports human_subject_consent_docs 'asserted_only' at most, not 'provided_to_buyer'.
- **c026** Defined.ai sets no fixed minimum dataset size for data partners.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “There is no fixed minimum. Requirements depend on the dataset type, domain, and expected use cases.” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c027** Defined.ai's partner onboarding runs through steps named Account Creation, Industry Contacts, Data Expertise and AI Ethics and Compliance.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AI Ethics and Compliance” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “Data Expertise” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c047** Defined.ai's FAQ says it asks about and tests the quality of data offered by would-be sellers.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “prepared that we ask about and test the quality of your data.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c052** Defined.ai's Supplier Code of Conduct requires suppliers to collect data only with informed consent.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Collect data only with informed consent, respecting all privacy laws.” — Defined.ai, <https://defined.ai/supplier-code-of-conduct> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c053** Defined.ai's Supplier Code of Conduct requires suppliers to document data provenance and quality.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Provide accurate documentation of data provenance and quality.” — Defined.ai, <https://defined.ai/supplier-code-of-conduct> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c054** Defined.ai's Supplier Code of Conduct requires suppliers to cooperate in audits.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Cooperate in audits and provide required documentation.” — Defined.ai, <https://defined.ai/supplier-code-of-conduct> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c073** Defined.ai's AI governance page describes a Partner Vetting Process for organisations it works with.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Our Partner Vetting Process ensures that every organization we work with adheres to” — Defined.ai, <https://defined.ai/about-us/ai-governance> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c079** Supplier Program Stage 2 (Clearance) requires executing Defined.ai's Data License Agreement & Provision of Services.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “execution of Defined.ai's Data License Agreement & Provision of Services” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c080** Supplier Program Clearance requires dataset-level Ethical Questionnaire Forms.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “full completion of Defined.ai's Dataset-level Ethical Questionnaire Forms” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c081** Supplier Program Stage 1 (Enrolment) is an appraisal of the applicant company's compliance standards.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “overarching appraisal of Applicant Company's compliance standards” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c082** Under the Supplier Program terms, each new set of data samples is re-vetted under Stage 2.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “each new set of Data samples submitted by Supplier are subject to Stage 2 of the Vetting Process” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c083** Supplier Program applicants warrant that samples do not infringe third-party IP, privacy or publicity rights.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “including any intellectual property rights, privacy rights, publicity rights” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c084** Supplier Program applicants must defend and indemnify Defined.ai against claims.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Applicant Company agrees to defend, indemnify and hold harmless Defined.ai” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c085** The supplier's indemnity under the Supplier Program terms is capped at two times the value of business between the parties.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “two (2) times the total value of business conducted between the parties” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c086** Defined.ai may audit Supplier Program applicants no more than once a year unless a material breach is suspected.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “Such audits shall be conducted no more than once per calendar year, unless a material breach is suspected” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact

### contributor_pay

- **c022** Defined.ai's partner programme pays data partners licensing fees from data marketplace sales.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Licensing fees from data marketplace sales” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The partner-programme economics appear only on defined.ai partner pages and in wire copies of the Jan 2026 release. No partner's own documentation found.
  - verifier (scope): **scope_ok** — On the page the quote is the revenue model listed for Data Partners. The statement leaves out that the page also says commercial terms are 'aligned with and approved by the partner' (see v003).
- **c029** Defined.ai's partner page claims average partner revenue of more than USD 600,000.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **600000 USD per partner** (vendor-stated average revenue earned by data partners, period and gross/net not stated; not stated)
  - “Average partner revenue” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “$600K+” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Partner-page marketing figure; searches found it only on defined.ai. No independent source.
  - verifier (scope): **scope_ok** — '$600K+' and 'Average partner revenue' are adjacent as number and label on the page. The figure spans the page's general partner programmes, which include AI Service Suppliers as well as data partners. The profile files the claim under contributor_pay, which could read it as data-partner earnings only; the page does not say which partners. No period is given, and the value basis already says so.
- **c030** Defined.ai says several partners generate more than USD 1 million a year licensing datasets through its marketplace.  
  _number · vendor_stated · as of 2026-01-27 (publication)_ · **1000000 USD per partner per year** (vendor-stated lower bound for 'several' partners' annual licensing revenue, gross/net not stated; per year)
  - “Several partners now generate more than $1 million annually by licensing proprietary datasets through the marketplace.” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Appears in the Jan 2026 release and its wire copies (newswire.com, Yahoo Finance), which are press_relayed, not independent. The ECO report of 30 Jul 2026 does not repeat it.
  - verifier (scope): **scope_ok** — The quote matches the statement, including 'annually'. The partner page gives a related variant: '$1M+ Revenue for 5+ partners'.
- **c050** Defined.ai's FAQ says it pays contributors at least minimum wage under a fair pay policy.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “We have a fair pay policy, ensuring at least minimum wage payment” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Independent reporting from 31 Jul 2019, attributed to a DefinedCrowd spokesperson, confirms a minimum-wage-based pay policy. Pay is set from the local minimum hourly rate and the ESTIMATED task time, so the 'at least minimum wage' floor applies to estimated rather than actual time worked. The report is from 2019 and says nothing about the current FAQ wording. The seattletimes.com original returned 403.
    - “calculating payment based on the minimum hourly rate of the country where the job is aimed” — Tech Xplore (The Seattle Times, Melissa Hellmann, via Tribune Content Agency), <https://techxplore.com/news/2019-07-crowdworking-humans-artificial-intelligence.html> · independent_press · retrieved 2026-09-30 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The quote matches. The FAQ sentence goes on: 'and in some countries and locales we are required to pay "living wages"'.
- **c051** Defined.ai's FAQ says contributor pay rates are set by the ability to attract contributors to complete tasks.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Pay rate is determined based on ability to attract contributors to” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c078** The Supplier Program terms defer Defined.ai's obligations to suppliers to a separate Data License Agreement.  
  _terms · legal_text · as of 2026-09-30 (retrieved_only)_
  - “shall be addressed separately in a Data License Agreement” — Defined.ai, <https://defined.ai/supplier-program> · legal_terms · retrieved 2026-09-30 · quote check: exact

### post_sale

- **c014** On termination the Data License Agreement requires the licensee to delete, destroy or return all copies of the data and certify it in writing.  
  _terms · legal_text · as of 2022-11-30 (page_dated)_
  - “cease using and delete, destroy, or return all copies of the Data and certify in writing” — Defined.ai, <https://defined.ai/data-license-agreement> · legal_terms · retrieved 2026-09-30 · quote check: exact

### catalogue_custom

- **c002** Defined.ai describes itself as offering an ethical AI data marketplace alongside custom services.  
  _offer · vendor_stated · as of 2026-04-28 (publication)_
  - “offering the world's biggest ethical AI data marketplace alongside custom services” — Defined.ai, <https://defined.ai/press-room/defined-ai-awarded-iso-42001-certification> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c004** Defined.ai offers custom data collection, annotation and evaluation services alongside its datasets.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Custom data collection and annotation to evaluation, we support your entire AI lifecycle” — Defined.ai, <https://defined.ai/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c043** Defined.ai's FAQ says buyers whose data is not listed can order a custom collection or wait for it to appear in the marketplace.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “You can either order a custom collection, or you can” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c044** Defined.ai's FAQ invites buyers to ask what data is planned for the quarter, implying a planned pipeline of catalogue releases.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Contact us to learn about what” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c045** Defined.ai's FAQ says it will package custom subsets of catalogue data by age, gender and accent on request.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “will package your custom dataset for you.” — Defined.ai, <https://defined.ai/faq> · docs · retrieved 2026-09-30 · quote check: exact
- **c058** Defined.ai's blog says that when off-the-shelf data is not enough, buyers can scope a custom request.  
  _offer · vendor_stated · as of 2026-03-25 (publication)_
  - “When off-the-shelf data is not enough, businesses can scope a custom request tailored to their specific needs.” — Defined.ai, <https://defined.ai/blog/future-ai-marketplace> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### changes

- **c001** Defined.ai was operating and issuing company announcements on 28 April 2026, when it said it had been awarded ISO 42001 certification.  
  _status · vendor_stated · as of 2026-04-28 (publication)_
  - “announced that it has been awarded the ISO 42001 certification” — Defined.ai, <https://defined.ai/press-room/defined-ai-awarded-iso-42001-certification> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The 28 Apr 2026 ISO 42001 announcement appears only on defined.ai and on wire copies (accessnewswire), which relay the vendor. The release names no certification body, so no certifier registry could be checked. The company's operating status is independently confirmed later: ECO (eco.sapo.pt, 30 Jul 2026) and Jornal de Negocios report a restructuring with about a 30% staff cut while the company continues operating (see defined-ai-v001). A status built on c001 should cite that newer report too.
  - verifier (scope): **scope_ok** — The quote supports the 28 Apr 2026 announcement. For the profile's status, the newer independent report (ECO, 30 Jul 2026) of a restructuring that cut about 30% of staff should sit beside it (see v001). Status 'active' still holds.
- **c074** At its 2021 rebrand Defined.ai said developers could buy datasets by subscription or one-off, sell datasets as third-party vendors, or request custom datasets.  
  _event · vendor_stated · as of 2021-11-19 (publication)_
  - “sell their own datasets as third-party vendors, or request highly specialized, custom datasets built by the Defined.ai team” — Defined.ai, <https://defined.ai/press-room/definedcrowd-rebrands-as-defined-ai-reflecting-expanded-position-as-a-developer-platform-for-artificial-intelligence> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c075** DefinedCrowd renamed itself Defined.ai in 2021.  
  _event · vendor_stated · as of 2021-11-19 (publication)_
  - “DefinedCrowd Rebrands as Defined.ai” — Defined.ai, <https://defined.ai/press-room/definedcrowd-rebrands-as-defined-ai-reflecting-expanded-position-as-a-developer-platform-for-artificial-intelligence> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### demand

- **c028** Defined.ai's partner page claims 319% year-on-year growth in dataset sales.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **319 percent YoY growth** (vendor-stated growth in dataset sales, period not stated; per year)
  - “YoY growth in dataset sales” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “319%” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Partner-page marketing figure; searches found it only on defined.ai. No independent reporting or filing states it. EDGAR full-text search for "Defined.ai" returns no filings.
  - verifier (scope): **scope_ok** — The two split quotes ('319%' and 'YoY growth in dataset sales') are adjacent as number and label on the live page, so they belong together. The block sits in the general Partnership Programs section, covering Data Partners and AI Service Suppliers, and no period is given. The statement does not over-claim.
- **c032** Defined.ai reported 65% year-on-year revenue growth in its January 2026 announcement.  
  _number · vendor_stated · as of 2026-01-27 (publication)_ · **65 percent YoY revenue growth** (vendor-stated company-wide revenue, unaudited; per year)
  - “The company reported 65% Year-over-Year revenue growth” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Independent press confirms that the company reported 65% growth in January. It does not audit the figure, which is still vendor-stated. The same article reports a 30% staff cut in July 2026 that ECO's sources tie to a sharp fall in AI training data sales.
    - “Em janeiro, a empresa reportava um crescimento anual de 65% das receitas” — ECO (eco.sapo.pt), <https://eco.sapo.pt/2026/07/30/defined-ai-avanca-com-reestruturacao-e-corta-em-30-o-numero-de-trabalhadores/> · independent_press · retrieved 2026-09-30 · quote check: fuzzy 0.90
  - verifier (scope): **scope_ok** — The quote matches. Independent press (ECO) confirms the report.
- **c089** Defined.ai says demand has been particularly strong for multimodal data for robotics, computer vision and healthcare.  
  _outcome · vendor_stated · as of 2026-01-27 (publication)_
  - “Demand has been particularly strong for multimodal data, including datasets supporting robotics, computer vision” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c091** Defined.ai reported a net revenue retention of 143% in its January 2026 announcement.  
  _number · vendor_stated · as of 2026-01-27 (publication)_ · **143 percent net revenue retention** (vendor-stated, company-wide, unaudited; per year)
  - “achieved a Net Revenue Retention (NRR) of 143%” — Defined.ai, <https://defined.ai/press-room/defined-ai-reports-sixty-five-percent-revenue-growth> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — 143% NRR appears only in the Jan 2026 release and its wire copies (press_relayed). ECO's July 2026 piece repeats the 65% growth but not the NRR.
  - verifier (scope): **scope_ok** — The quote matches.
- **c092** Defined.ai announced in June 2025 that Crowdworks AI would resell Defined.ai datasets to South Korean clients through Crowdworks' marketplace.  
  _event · vendor_stated · as of 2025-06-17 (publication)_
  - “Crowdworks AI will offer Defined.ai's ethically sourced datasets to its local client base through its AI data marketplace” — Defined.ai, <https://defined.ai/press-room/defined-ai-crowdworks-ai-partnership> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

## Added by the verifier

- **v001** Portuguese business press reported on 30 July 2026 that Defined.ai had restructured its global operations, cutting about 30% of its staff, mainly in Europe.  
  _event · independent · as of 2026-07-30 (publication) · scope: global, mainly Europe_
  - “redução de cerca de 30% do número de trabalhadores” — ECO (eco.sapo.pt), <https://eco.sapo.pt/2026/07/30/defined-ai-avanca-com-reestruturacao-e-corta-em-30-o-numero-de-trabalhadores/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - “redução de aproximadamente 30% do número total de colaboradores” — Jornal de Negócios, <https://www.jornaldenegocios.pt/empresas/tecnologias/detalhe/defined-ai-despede-30-dos-trabalhadores-em-reestruturacao> · independent_press · retrieved 2026-09-30 · quote check: exact
- **v002** ECO reported, from information it gathered, that Defined.ai's July 2026 restructuring followed a significant fall in its sales of data for AI model training.  
  _outcome · independent · as of 2026-07-30 (publication)_
  - “quebra significativa das vendas de dados para o treino de modelos de inteligência artificial” — ECO (eco.sapo.pt), <https://eco.sapo.pt/2026/07/30/defined-ai-avanca-com-reestruturacao-e-corta-em-30-o-numero-de-trabalhadores/> · independent_press · retrieved 2026-09-30 · quote check: exact
- **v003** Defined.ai's partner page says commercial terms for partner datasets depend on dataset type, usage and customer needs, and are always approved by the partner.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Data Partner programme_
  - “are always aligned with and approved by the partner” — Defined.ai, <https://defined.ai/partnership-programs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **v004** Defined.ai's January 2025 release says datasets featuring Getty Images content are available through its sales team.  
  _offer · vendor_stated · as of 2025-01-08 (publication) · scope: Getty Images-derived datasets_
  - “Datasets featuring visual content from Getty Images are now available through Defined.ai's sales team.” — Defined.ai, <https://defined.ai/press-room/strategic-engagement-with-getty-images> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://defined.ai/partnership-programs>, <https://defined.ai/supplier-program>, <https://defined.ai/faq>, <https://defined.ai/data-license-agreement>
- `matrix.exclusivity_offered` — not_published; tried <https://defined.ai/data-license-agreement>, <https://defined.ai/faq>, <https://defined.ai/datasets/stock-videos>, <https://defined.ai/datasets/meeting-recordings>, <https://defined.ai/datasets/medical-imaging-dental-xrays>, <https://www.defined.ai/datasets/retail-images>
- `matrix.buyer_vetting` — not_published; tried <https://defined.ai/faq>, <https://defined.ai/data-license-agreement>, <https://defined.ai/terms-of-use>
- `matrix.versioning` — not_published; tried <https://defined.ai/data-license-agreement>, <https://defined.ai/faq>, <https://defined.ai/datasets/stock-videos>, <https://defined.ai/datasets/meeting-recordings>, <https://defined.ai/datasets/medical-imaging-dental-xrays>, <https://www.defined.ai/datasets/retail-images>
- `Q4` — not_published; tried <https://defined.ai/solutions/data-collection>, <https://defined.ai/data-license-agreement>, <https://defined.ai/faq>, <https://defined.ai/supplier-program>
- `provider revenue share percentage and who sets partner dataset prices` — not_published; tried <https://defined.ai/partnership-programs>, <https://defined.ai/supplier-program>, <https://defined.ai/faq>, <https://defined.ai/blog/data-marketplace-explainer>
- `supplier-side 'Data License Agreement & Provision of Services' text` — gated; tried <https://defined.ai/supplier-program>, <https://defined.ai/partnership-programs>
- `delivery mechanism (download link, cloud bucket, API)` — js_empty; tried <https://defined.ai/data-license-agreement>, <https://defined.ai/faq>, <https://developers.definedcrowd.com/>
- `whether listings disclose the third-party provider behind a dataset` — not_published; tried <https://defined.ai/datasets/stock-videos>, <https://defined.ai/datasets/meeting-recordings>, <https://defined.ai/datasets/medical-imaging-dental-xrays>, <https://www.defined.ai/datasets/retail-images>
- `https://defined.ai/terms-of-service (lead given in brief)` — not_found; tried <https://defined.ai/terms-of-service>

## Conflicts

- c034, c020: FAQ calls the licence perpetual; the DLA says it runs until terminated. The DLA (legal text) governs; both kept. (live_primary_wins_terms)
- c035, c036: FAQ says samples download instantly; every live listing opened shows 'Request a Sample'. Listings taken as current mechanics. (live_primary_wins_terms)
- c074, c036: 2021 rebrand described subscriptions and one-off purchases; current listings are quote-only. Current listings taken as current mode. (newer_wins_status)

## Leads, not cited

- <https://www.newswire.com/news/defined-ai-reports-65-revenue-growth-as-global-demand-for-ai-training-data> — Wire copy of the Jan 2026 growth release; press_relayed, not independent.
- <https://defined.ai/press-room/defined-ai-reinforces-physical-ai-data-for-robotics> — Physical-AI / robotics video data push; not fetched.
- <https://defined.ai/press-room/definedcrowd-launches-portfolio-of-ai-training-data-products> — Origin of the off-the-shelf catalogue; not fetched.
- <https://defined.ai/privacy-policy> — Contributor-facing privacy terms that the FAQ says contributors consent to; not fetched.
- <https://defined.ai/datasets/wound-skin-image> — Another image listing (medical) to check consent statements; not fetched.
- <https://www.sec.gov/cgi-bin/browse-edgar?company=definedcrowd> — Possible Form D filings for funding; not fetched.
