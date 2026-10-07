# Macgence

ai_data_catalogue · light · status: **active** · also known as Macgence Technologies, Macgence AI Data Marketplace

> Rendered from `ledger/macgence.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Data Marketplace / AI Data Marketplace; listings called Off-The-Shelf (OTS) datasets” and its bespoke side “Custom Data Sourcing ("Build Custom Datasets"); data collection services”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c010, c014 | Macgence is Licensor of record and claims ownership of the data; the catalogue is first-party. |
| economics_model | principal_margin | c014, c015, c034 | Macgence owns or compiles the data and sets its own price; no third-party sellers are shown on the marketplace. |
| who_pays_fee | not_applicable |  | First-party sales only; no intermediary fee between a provider and a buyer. |
| supply_models | own_collection, partner_licensed | c015, c025, c026, c045, c043 | partner_licensed rests only on the Data Licensing page (publisher/creator content, LLM-oriented); whether client-commissioned data is resold is unknown. |
| custody_model | copy_to_buyer | c016 | Delivered electronically or on tangible media. |
| transaction_mode | contact_sales | c006, c037, c038 | No checkout found; listings lead to a request form and terms are negotiated. |
| public_prices | some | c034, c035, c036 | Only 'from $0.10' starting prices with no unit, and a per-seat platform price; no listing shows a price. |
| licence_model | mixed | c011, c004, c007, c005 | A standard non-exclusive OTS licence is published, but the ToS says each paid dataset gets a separately negotiated licence. |
| exclusivity_offered | yes | c005 | Per deal, by written agreement. |
| public_listing | public_indexable | c050, c032 | Listing pages open without login and are in data.macgence.com/sitemap.xml; content is client-rendered. |
| buyer_vetting | unknown |  | The request form requires a company name; no verification step is described. |
| sample_mechanics | sample_on_request | c038 |  |
| versioning | unknown |  | Listings say datasets are regularly refreshed (macgence-c028); nothing on versions or what past buyers receive. |
| human_subject_consent_docs | not_addressed | c017, c027, c039 | Listings depict identifiable people; no consent or release evidence is offered and the licence disclaims all warranties; only a marketing assertion of GDPR/HIPAA compliance. |
| contributor_pay_model | unknown |  | Freelance collection roles are advertised but pay terms are not published. |
| catalogue_plus_custom | both | c042, c040, c029 |  |
| erasure_after_sale | contractual_deletion | c019, c020 | Deletion is required on termination; Macgence may terminate on 60 days' notice. |
| quality_evidence | provider_asserted | c041 | Macgence is both operator and sole provider; its quality statements are self-asserted with no independent check shown. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Only the vendor's target sectors (banking, healthcare, retail and others) are published; no buyer names, units bought or volumes. | c051 |
| Q2 | partial | Macgence built its own storefront (about 1050 listings) rather than relying on a third-party marketplace; whether it also lists elsewhere could not be checked without search. | c032 |
| Q3 | partial | Inventory is presented as Macgence-compiled and owned, made with a network of experts and freelance collectors, plus content licensed from publishers and creators; rights per source are not broken down. | c015, c014, c026, c045, c043 |
| Q4 | unknown |  |  |
| Q5 | sourced | Macgence is Licensor of record and owner; it indemnifies buyers against IP infringement claims but disclaims all other warranties, including anything on consent. | c010, c014, c018, c017 |
| Q6 | sourced | Macgence delivers copies to the buyer electronically or on tangible media. | c016 |
| Q7 | partial | Listings depict identifiable people with demographic metadata, but no consent evidence is offered for capturer, subject or place; only a marketing claim of GDPR/HIPAA compliance. | c027, c039, c017 |
| Q8 | sourced | Standard OTS licence is non-exclusive, internal-use, no redistribution, with audit rights and deletion on termination; the ToS allows exclusive licences per negotiated deal. No fingerprinting is described. | c011, c005, c013, c022, c019, c020 |
| Q9 | sourced | Deals close through contact-sales: a request form on each listing and negotiated terms; Macgence sells its own inventory at its own price. | c006, c037, c038, c014 |
| Q10 | partial | A listing is a record with type, media type, volume, format and device; datasets are said to be refreshed but no version or entitlement model is published, and termination ends access with no refund. | c050, c028, c020, c021 |
| Q11 | partial | Buyers see a spec sheet and can request a data sample through a form; quality and security claims are self-asserted. | c038, c027, c041, c048 |
| Q12 | sourced | Ready-made datasets are called Off-The-Shelf (OTS) datasets in the Data Marketplace; bespoke work is Custom Data Sourcing, and listings offer customisation as an upsell. | c030, c042, c040, c029 |

## Claims

### positioning

- **c009** The entity named at the foot of Macgence's Terms of Service is Macgence Technologies Private Limited, with a Noida, Uttar Pradesh address.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Macgence Technologies Private Limited” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### supply

- **c014** In the Data License Agreement (OTS) the licensee acknowledges that Macgence, as Licensor, owns all right, title and interest in the data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensor owns all right, title, and interest, including all intellectual property rights, in and to the Data” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The DLA says 'Licensor owns all right, title, and interest, including all intellectual property rights, in and to the Data'. A clause of the vendor's own licence.
  - verifier (scope): **quote_incomplete** — The statement says the licensee acknowledges ownership, but the quote starts at 'Licensor owns'. The words 'Licensee acknowledges that, as between Licensee and Licensor, Licensor owns all right, title, and interest' would show it.
- **c015** The Data License Agreement (OTS) recites that Macgence compiled the licensed data into its own proprietary database.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensor has compiled data into the proprietary [database/data feed] described in Exhibit A” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The recital reads 'Licensor has compiled data into the proprietary [database/data feed] described in Exhibit A'. The published text is a template whose bracketed alternative '[database/data feed]' was never resolved; Exhibit A is only partly filled, describing the data generically as digital assets for training and/or testing AI models, with no dataset named. It recites compilation of a generic 'database/data feed', not of any specific listed dataset.
  - verifier (scope): **scope_wrong** — The quote is an unresolved template recital ('[database/data feed] described in Exhibit A'), and Exhibit A names no dataset. It shows only that the boilerplate licence recites a compilation; it does not show that any listed dataset was compiled by Macgence into its own database. It is too weak to carry supply_models own_collection or economics_model principal_margin, where the profile cites it.
- **c026** Macgence says its selfie image dataset was created through collaboration with a network of experts.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “Created through collaboration with a network of experts, it captures realistic” — Macgence, <https://data.macgence.com/image-datasets/image-dataset-of-selfie-images-to-train-aiml-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c043** Macgence's Data Licensing page says it acquires licensed content directly from publishers, media houses and creators.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We acquire licensed content directly from publishers, media houses, and creators” — Macgence, <https://macgence.com/ai-training-data/data-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c028** Macgence's selfie image listing says the dataset is regularly refreshed with new images; no version history or buyer entitlement to updates is described.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “Our dataset is regularly refreshed with new Images” — Macgence, <https://data.macgence.com/image-datasets/image-dataset-of-selfie-images-to-train-aiml-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c050** A Macgence listing record carries structured fields such as dataset type, media type and volume, alongside format and capture device.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “"Datasets Type":"Video","Media Type":"Video","Volume":"5000"” — Macgence, <https://data.macgence.com/video-datasets/video-dataset-of-construction-site-for-training-ai-ml-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data

### listing

- **c027** Macgence's selfie image listing says each participant (the people pictured) comes with metadata including age, gender and location.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “Each participant is accompanied by comprehensive metadata, which includes detailed information about their age” — Macgence, <https://data.macgence.com/image-datasets/image-dataset-of-selfie-images-to-train-aiml-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c031** Macgence says its egocentric cooking activity video dataset contains 7000 hours of video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_ · **7000 hours of video** (vendor-stated total duration of one listed dataset; not applicable)
  - “Video Duration: 7000 hours” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **unverifiable** — The vendor listing does say 'Video Duration: 7000 hours' and 'The dataset contains 7000 hours'. No independent description of the dataset exists that could be reached (no Hugging Face card, no paper, no press; EDGAR, CourtListener and arXiv all return nothing for Macgence). The same listing gives 'Frame Rate: Adjustable based on project requirements' and 'Resolution: HD / Full HD / configurable', and its record has people '1', which sits oddly with 7000 finished hours; the figure should be read as vendor-stated capacity. No search available.
  - verifier (scope): **scope_ok** — Right listing, and the statement is correctly framed as 'Macgence says'. The same specification block says frame rate and resolution are adjustable to project requirements, which the profile does not mention (see macgence-v001).
- **c032** The data embedded in Macgence's marketplace home page reports 1050 active dataset listings.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_ · **1050 active dataset listings** (listing count in the page data of data.macgence.com, filter status Active; a category page built at another time showed 1061; point in time)
  - “"projectCount":1050” — Macgence, <https://data.macgence.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **vendor_only** — Checked directly: the embedded JSON on data.macgence.com has projectCount 1050 with query {status: Active} and 1050 records (908 Audio, 106 Image, 36 Video). The count exists only in the vendor's own page data.
  - verifier (scope): **quote_incomplete** — The count is right (1050), but the quote does not show that it counts active listings. The same object carries "pWhere":{"status":"Active"}, which would show the filter.
- **c033** Macgence's Data Marketplace page says it offers 700+ speech datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **700 speech datasets (lower bound)** (vendor-stated catalogue size, stated as 700+; point in time)
  - “700+ Speech Datasets” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — macgence.com/products/data-marketplace/ shows '700+ Speech Datasets' (with '5M+ Image Datasets', '200+ Languages'). It is a marketing figure on the vendor's own page; the marketplace's embedded data has 908 Audio listings, consistent with '700+'.
  - verifier (scope): **scope_ok**

### trust

- **c017** The Data License Agreement (OTS) provides the data as is and disclaims all warranties; it contains no warranty about consent or releases from people in the data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The data is provided “as is” and the licensor hereby disclaims all warranties” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The DLA says the data 'is provided "as is"' and the licensor disclaims all warranties; a read of the whole page found no mention of consent, releases, privacy or personal data. The Terms of Service are also silent on consent of people in the data. Vendor's own licence.
  - verifier (scope): **scope_ok** — The second half is an absence and cannot be quoted; the blind read of the whole agreement also found no mention of consent, releases or personal data.
- **c039** Macgence's Data Marketplace page asserts that all its datasets comply with data protection laws such as GDPR and HIPAA, without describing consent evidence.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we make sure all datasets comply with industry standards and data protection laws, such as GDPR and HIPAA” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c041** Macgence says it uses annotation tools and data curators to guarantee dataset quality; no independent quality evidence is shown.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we employ sophisticated annotation tools and knowledgeable data curators” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** Macgence's Data Marketplace page says its platform is SOC II certified.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We uphold the highest standards of security and privacy with our SOC II certified platform.” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c006** Under Macgence's Terms of Service, the exclusivity of a paid dataset licence is settled with Macgence's authorised representative during a purchase negotiation.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “in writing between Customer and Macgence's authorized representative during the purchase negotiation process” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Terms of Service section 2.1 'Paid Dataset License' says the licence 'may be either exclusive or non-exclusive as mutually agreed upon in writing' with Macgence's authorized representative during the purchase negotiation process. Note this sits against the DLA (OTS), which grants only a non-exclusive licence; exclusivity is therefore available only by separate written agreement.
  - verifier (scope): **quote_incomplete** — The quote does not contain the word exclusive, so on its own it does not show that exclusivity is what is agreed. The preceding words 'may be either exclusive or non-exclusive as mutually agreed upon' would show it.
- **c037** Macgence's pricing page says its prices are estimates and directs buyers to contact it for a quote.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “These prices are estimates and may vary by project. Contact us for an accurate quote or request one.” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c038** Macgence's dataset pages carry a 'Request Dataset' form requiring name, email and company, and access to a data sample is conditioned on accepting its Privacy Policy, Terms and Data License Agreement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “By accessing this data sample, you agree to receive communications from Maggence and accept our” — Macgence, <https://data.macgence.com/_next/static/chunks/992-9b43ca8a5fa9605c.js> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Company name is required” — Macgence, <https://data.macgence.com/_next/static/chunks/992-9b43ca8a5fa9605c.js> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c034** Macgence's pricing page says its off-the-shelf datasets start from $0.10, without stating the unit the price applies to.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **0.1 USD (unit of measure not stated)** (starting price paid by the buyer; unit not stated; marked with an asterisk; page says prices are estimates; not stated)
  - “Our pre-curated, high-quality off-the-shelf datasets start from $0.10” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The pricing page says off-the-shelf datasets 'start from $0.10' with no unit. A price on the vendor's own pricing page; no partner or marketplace restating it was found. No search available.
  - verifier (scope): **scope_ok**
- **c035** Macgence's pricing page says its data collection services start from $0.10, without stating the unit.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **0.1 USD (unit of measure not stated)** (starting price for custom collection paid by the buyer; unit not stated; asterisked; not stated)
  - “Our data collection services start from $0.10” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The pricing page says data collection services 'start from $0.10' with no unit (localisation 'start at just $0.02'). Vendor's own price; no search available.
  - verifier (scope): **scope_ok**
- **c036** Macgence's pricing page groups the Data Marketplace with its annotation, RLHF and transcription tools as platforms starting at $5 per month per seat.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5 USD per seat per month** (starting platform subscription price for the four named platforms together; what a Data Marketplace seat buys is not stated; per month)
  - “Data Marketplace, Annotation Tool, RLHF Tool, and Transcription Tool” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - “Starting at just $5 per month per seat” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The pricing page groups Data Marketplace, Annotation Tool, RLHF Tool and Transcription Tool as platforms 'starting at just $5 per month per seat'. Vendor's own price; no search available.
  - verifier (scope): **scope_ok** — The two quotes together show the grouping and the price; value.basis rightly says what a marketplace seat buys is not stated.

### licence

- **c004** Macgence's website Terms of Service say a buyer of a paid dataset receives a separate licence agreement governing its use.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Customer shall receive a separate license agreement governing the use of such datasets” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** Macgence's Terms of Service say the licence for a paid dataset may be exclusive or non-exclusive, as agreed in writing per deal.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The license granted for paid datasets may be either exclusive or non-exclusive as mutually agreed upon in writing” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c007** Macgence's Terms of Service leave permitted uses, distribution and modification rights, territory, term and sublicensing to be defined in each executed dataset licence agreement.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “shall be specifically defined in the executed dataset license agreement” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** Macgence's published Data License Agreement (OTS) names Macgence Technologies (OPC) Private Limited as Licensor and all consumers of the covered data as Licensee.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “by and between Macgence Technologies (OPC) Private Limited, An Indian company (“Licensor”), and all consumers of the data” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — macgence.com/data-license-agreement/ names 'Macgence Technologies (OPC) Private Limited' as Licensor and 'all consumers of the data covered by this license' as Licensee. The Terms of Service footer instead names 'Macgence Technologies Private Limited' (no OPC), so the two documents disagree on the entity's form; India's MCA registry, which would settle whether the one-person company was converted, is gated behind a captcha.
  - verifier (scope): **scope_ok** — The profile already records the OPC versus non-OPC entity-name conflict with macgence-c009.
- **c011** The Data License Agreement (OTS) grants a non-exclusive, non-sublicensable and non-transferable licence to use the data for the permitted use.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “grants Licensee a non-exclusive, non-sublicensable, and non-transferable (except in compliance with Section 8(f)) license” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The DLA grants a 'Non-exclusive, non-sublicensable, and non-transferable (except in compliance with Section 8(f)) license during the Term'. The statement omits the Section 8(f) exception to non-transferability and the 'during the Term' limit, which is minor.
  - verifier (scope): **scope_ok** — The quote shows the three restrictions and the Section 8(f) carve-out; the 'permitted use' part is carried by macgence-c012.
- **c012** The Data License Agreement (OTS) limits permitted use to the licensee's internal business operations.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Use of the Data for the benefit of the Licensee in the ordinary course of its internal business operations.” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** The Data License Agreement (OTS) forbids the licensee to disclose, distribute or deliver the data to any third party without Macgence's prior written consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “shall not disclose, release, distribute, or deliver the Data, or any portion thereof, to any third party” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** In the Data License Agreement (OTS), Macgence indemnifies the licensee against third-party claims that the licensee's permitted use infringes intellectual property rights.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “that Licensee’s Permitted Use of the Data infringes or misappropriates such third party’s intellectual property rights” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** The Data License Agreement (OTS) gives Macgence a right to inspect and audit the licensee's records on reasonable notice.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensor may, at its own expense, on reasonable prior notice, periodically inspect and audit Licensee’s records” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Exhibit A of the Data License Agreement (OTS) describes the licensed data as digital assets for training and/or testing AI models.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Digital assets for training and/or testing of speech, NLP, computer vision, and other AI models.” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** Macgence's egocentric cooking video listing says the dataset is exclusively curated by Macgence and available for commercial AI development, research and enterprise training.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “Exclusively curated by Macgence, this egocentric activity dataset is available for commercial AI development, research” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c049** Macgence's listing metadata points the dataset licence to data.macgence.com/terms-and-conditions, a URL that returned HTTP 404 when fetched.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “"license": "https://data.macgence.com/terms-and-conditions"” — Macgence, <https://data.macgence.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data

### custody

- **c016** Under the Data License Agreement (OTS), Macgence delivers the data electronically, on tangible media, or by other means.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensor shall deliver the Data electronically, on tangible media, or by other means.” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The DLA says 'Licensor shall deliver the Data electronically, on tangible media, or by other means'. A clause of the vendor's own licence.
  - verifier (scope): **scope_ok** — Supports a delivered copy; the clause names no delivery channel or storage target.

### contributor_pay

- **c044** Macgence's Data Licensing page says creators receive recognition and revenue for their work, without stating how or how much they are paid.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “creators receive rightful recognition and revenue for their work” — Macgence, <https://macgence.com/ai-training-data/data-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** Macgence's jobs page recruits for video data collection and image/photo collection work and offers remote and freelance arrangements; pay terms are not published.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Audio Data Collection Video Data Collection Image Labelling” — Macgence, <https://macgence.com/our-company/jobs/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Healthcare Audio Labeling Images / Photos Collection” — Macgence, <https://macgence.com/our-company/jobs/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Yes, we provide both remote and freelance work options, depending on the project and role requirements.” — Macgence, <https://macgence.com/our-company/jobs/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — macgence.com/our-company/jobs/ has an application form whose position options include 'Video Data Collection' and 'Images / Photos Collection', and an FAQ answer 'we provide both remote and freelance work options'; no pay terms. These are form options, not job postings: the job-openings sitemap (30 postings, newest 2026-03-25) has no video or photo collection role. Vendor's own page; no independent route (job boards not reachable without search).
  - verifier (scope): **scope_wrong** — The first two quotes are option labels in the jobs page's application form, not job postings; the job-openings sitemap lists 30 postings (newest 2026-03-25) and none is for video or photo collection. The page accepts applications for such work; 'recruits for' claims more than the quotes show.

### post_sale

- **c019** On termination of the Data License Agreement (OTS), the licensee must stop using the data, delete, destroy or return all copies, and certify this in writing.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Licensee shall cease using and delete, destroy, or return all copies of the Data and certify in writing” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** The Data License Agreement (OTS) lets Macgence terminate the licence on 60 days' written notice.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “the Licensor may terminate this Agreement, effective on written notice to the other Party, given a 60-day notice.” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** The Data License Agreement (OTS) says termination does not entitle the licensee to any refund.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “or entitle Licensee to any refund” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** Macgence's Return & Refund Policy treats datasets as digital products whose sale is final once delivered or access is granted.  
  _terms · legal_text · as of 2023-04-01 (page_dated)_
  - “all sales are final once the delivery has been made or access has been granted” — Macgence, <https://macgence.com/return-refund-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** Macgence's Return & Refund Policy allows a refund if a delivered dataset does not match the contract's specifications and cannot be fixed in reasonable time.  
  _terms · legal_text · as of 2023-04-01 (page_dated)_
  - “If the delivered dataset does not match the specifications agreed upon in the contract (e.g., format, volume, or language)” — Macgence, <https://macgence.com/return-refund-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c029** Macgence's listings offer customisation of a catalogue dataset, such as adjusting samples or tailoring the dataset to the buyer's criteria.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “We offer customization options such as adjusting samples and providing datasets tailored to your specific criteria and needs.” — Macgence, <https://data.macgence.com/image-datasets/image-dataset-of-selfie-images-to-train-aiml-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c030** Macgence calls its ready-made marketplace datasets Off-The-Shelf (OTS) datasets on the listing pages.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Data Marketplace (data.macgence.com)_
  - “This Off-The-Shelf (OTS) dataset provides a rich collection of real-world” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
- **c040** Macgence's Data Marketplace page says it provides bespoke data solutions adjusted to a buyer's models.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we provide bespoke data solutions that can be adjusted to your AI and ML models’ specific needs” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Macgence's pricing FAQ says it has ready-made datasets plus custom-built solutions.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have ready-made datasets and AI services, plus custom-built solutions for unique needs.” — Macgence, <https://macgence.com/pricing/> · pricing_page · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Macgence's AI Data Marketplace listing for its egocentric cooking video dataset was last updated on 2026-06-02, so the catalogue was being maintained within the last six months.  
  _status · vendor_stated · as of 2026-06-02 (page_dated) · scope: AI Data Marketplace (data.macgence.com)_
  - “"updatedAt":"2026-06-02T07:08:02.388Z"” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **unverifiable** — The timestamp itself is right on the vendor's side: the __NEXT_DATA__ JSON embedded in data.macgence.com carries updatedAt 2026-06-02T07:08:02Z for this listing, and 2026-06-02 is the newest updatedAt of all 1050 records, so nothing in the catalogue has changed for four months as of 2026-10-01. No independent evidence of current operation could be reached: EDGAR full-text search 'Macgence' 0 hits, CourtListener 0 results, arXiv 0 results, no Hugging Face datasets by or naming Macgence, and Macgence's own 'In the media' page lists only four April 2023 press releases (EIN Presswire, Issuewire, PR Log, UP 18 News). India's MCA company master data is behind a captcha (gated). WebSearch not available in this run, so no search for 2026 trade press; no search available.
  - verifier (scope): **scope_ok** — The quoted updatedAt string occurs once in the listing page's embedded data, inside the cooking listing's own record, so it is the right listing. Blind step found only this vendor page. The status inference ('catalogue maintained') rests on a CMS timestamp alone; nothing independent shows the company trading.
- **c002** Macgence added egocentric (first-person) activity video datasets, filed under a new Robotics Datasets category, with listing records created on 2026-04-26.  
  _event · vendor_stated · as of 2026-04-26 (page_dated) · scope: AI Data Marketplace (data.macgence.com)_
  - “"createdAt":"2026-04-26T06:45:40.956Z"” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **disputed** — The createdAt field of all 20 egocentric listings is 2026-04-26T06:45:40.956Z, identical to the millisecond, which looks like a bulk-assigned value rather than a record-creation time. Their MongoDB ObjectIds decode to 2026-05-25 (10 listings, 09:19-11:15 UTC, cooking first) and 2026-05-27 (10 listings, 12:07-13:44 UTC), and the 'Robotics Datasets' category record (6a1416e95d0e661f9f0d974d) decodes to 2026-05-25T09:31Z; a separate 'Robotics' top-level category decodes to the same day. Older listings show the same pattern (shared createdAt 2025-08-07, ObjectIds 2025-10-29). The evidence therefore points to the egocentric listings and the Robotics category being added on 25-27 May 2026, not 26 April. This is my reading of the vendor's own embedded data, not an independent source, so disputed rather than corrected. 19 of the 20 are also filed under Video Datasets. No independent announcement found (blog sitemap has no egocentric or robotics post; no press); no search available.
  - verifier (scope): **scope_wrong** — The quote shows only a createdAt value; it does not show the Robotics Datasets category (the string 'Robotics Datasets' does not occur on the cited listing page; the category is in data.macgence.com home-page data and sitemap as /category/robotics-datasets). And the createdAt value is shared to the millisecond by all 20 egocentric records, while their ObjectIds and the Robotics Datasets category's ObjectId decode to 25-27 May 2026, so it does not show when the records were created. The statement claims a creation date the evidence does not support; as_of 2026-04-26 is likely a month early.
- **c003** The newest item on Macgence's own In The Media page is dated April 22, 2023; the page lists no funding, acquisition or later company news.  
  _event · vendor_stated · as of 2023-04-22 (page_dated)_
  - “Macgence Transforms Data Collection And Generation With Human Intelligence. April 22, 2023” — Macgence, <https://macgence.com/our-company/in-the-media/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c051** Macgence's Data Marketplace page says the marketplace targets sectors including banking and finance, healthcare and retail; it gives no buyer names or volumes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “our marketplace caters to a wide range of sectors, including banking & finance, healthcare, retail” — Macgence, <https://macgence.com/products/data-marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c008** Macgence's website Terms of Service are governed by the laws of India.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The laws of India govern these terms and conditions” — Macgence, <https://macgence.com/macgence-terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** The Data License Agreement (OTS) is governed by Indian law with suits to be brought in the courts of India.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The laws of India will govern and interpret this Agreement” — Macgence, <https://macgence.com/data-license-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Macgence's off-the-shelf egocentric cooking video listing gives its frame rate as adjustable to the buyer's project requirements, so the listed dataset is described partly as a capture specification rather than as fixed files.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric (First-Person) Cooking Activity Recognition Video Dataset_
  - “Frame Rate: Adjustable based on project requirements” — Macgence, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact_in_data

## Unknown

- `matrix.buyer_vetting` — not_published; tried <https://data.macgence.com/_next/static/chunks/992-9b43ca8a5fa9605c.js>, <https://macgence.com/data-license-agreement/>, <https://macgence.com/macgence-terms-of-service/>
- `matrix.versioning` — not_published; tried <https://data.macgence.com/image-datasets/image-dataset-of-selfie-images-to-train-aiml-models>, <https://data.macgence.com/video-datasets/egocentric-first-person-cooking-activity-recognition-video-dataset>, <https://macgence.com/data-license-agreement/>
- `matrix.contributor_pay_model` — not_published; tried <https://macgence.com/our-company/jobs/>, <https://macgence.com/ai-training-data/data-licensing/>, <https://macgence.com/ai-training-data/crowd-as-a-service/>
- `questions.Q4` — not_published; tried <https://macgence.com/macgence-terms-of-service/>, <https://macgence.com/data-license-agreement/>, <https://macgence.com/ai-training-data/ai-data-collection-services/>
- `other.commissioned_resale` — not_published; tried <https://macgence.com/macgence-terms-of-service/>, <https://macgence.com/data-license-agreement/>, <https://macgence.com/ai-training-data/ai-data-collection-services/>
- `other.dataset_terms_page` — not_found; tried <https://data.macgence.com/terms-and-conditions>
- `other.marketplace_prices_page` — js_empty; tried <https://data.macgence.com/prices>
- `other.independent_press_and_filings` — not_found; tried <https://macgence.com/our-company/in-the-media/>, <https://macgence.com/resources/blogs/>
- `other.blog_index` — blocked; tried <https://macgence.com/resources/blogs/>, <https://macgence.com/sitemap.xml>, <https://macgence.com/sitemap_index.xml>
- `other.funding_headcount` — not_published; tried <https://macgence.com/our-company/about-us/>, <https://macgence.com/our-company/in-the-media/>

## Conflicts

- c005, c011: Both are live primary text. The published OTS licence is non-exclusive, while the ToS says a paid dataset's licence may be exclusive by written agreement; read together, exclusivity is a negotiated override of the standard licence. (unresolved)
- c009, c010: The ToS names Macgence Technologies Private Limited; the Data License Agreement names Macgence Technologies (OPC) Private Limited. Company registry records could not be checked without search. (unresolved)

## Leads, not cited

- <https://data.macgence.com/category/medical-image-datasets> — MRI listings are named glioma, meningioma, notumor and pituitary; worth checking whether these derive from a public dataset (would add public_or_scraped supply). Not verified.
- <https://www.mca.gov.in/> — Indian company registry could settle the Private Limited vs OPC Private Limited entity name and incorporation date; not reachable without a search or login.
- <https://www.prlog.org/12960964-macgence-expands-its-presence-in-india-with-the-opening-of-new-office-in-noida.html> — 2023 press release listed on the vendor's media page; press_relayed at best, not fetched.
- <https://data.macgence.com/sitemap.xml> — Full list of listing URLs by category; useful for counting video/image listings.
