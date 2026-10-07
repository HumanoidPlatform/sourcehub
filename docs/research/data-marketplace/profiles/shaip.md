# Shaip

ai_data_catalogue · light · status: **acquired** · also known as Shaip AI, Healthly.AI Data, LLC d/b/a Shaip, Shaip.AI Data (India) LLP

> Rendered from `ledger/shaip.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “AI Data Catalog & Licensing Marketplace (off-the-shelf datasets)” and its bespoke side “Fully Managed Data Collection Services ("fully customized solutions")”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c006, c009, c026, c025 | Buyers contract with Shaip under an MSA/SOW and Shaip licenses third-party footage under its own catalogue; the licence text itself is not public. |
| economics_model | principal_margin | c009, c016, c043, c026 | Shaip sells collected and licensed-in data at its own quoted price; no provider-facing marketplace or fee schedule exists. What third-party suppliers are paid is not published. |
| who_pays_fee | not_applicable |  | No marketplace fee: Shaip sells its own and licensed-in inventory as principal. |
| supply_models | own_collection, third_party_providers, partner_licensed, public_or_scraped | c041, c043, c049, c025, c026, c020, c021 | Crowd collection; vendor-collected Project Data; filmmaker and licensed video libraries; YouTube video and public-archive images. Whether client-commissioned data is relisted is not stated. |
| custody_model | copy_to_buyer | c018, c032, c051 | Datasets are delivered to the buyer in standard file formats; medical datasets are also on Databricks Marketplace, whose delivery mechanism for Shaip was not checked. |
| transaction_mode | contact_sales | c016, c006, c031 |  |
| public_prices | none | c016, c031, c052 | No price found on catalogue, custom or medical pages. |
| licence_model | negotiated | c009, c006, c052 | One-time, subscription or enterprise agreement, settled per deal under MSA/SOW; no standard licence published. |
| exclusivity_offered | unknown | c028 | Physical-AI datasets are licensable non-exclusively; whether exclusivity can be bought is not stated. |
| public_listing | public_summary_gated_detail | c047, c048, c025 | Anonymous visitors see title, size, format and a short description; detail and samples come through 'Request Data'. |
| buyer_vetting | unknown |  |  |
| sample_mechanics | sample_on_request | c010, c024, c053, c029 |  |
| versioning | unknown |  |  |
| human_subject_consent_docs | asserted_only | c022, c017, c030, c047 | Catalogue pages assert consent; the custom egocentric service advertises signed releases; no page says release documents are handed to catalogue buyers. |
| contributor_pay_model | one_off | c039, c040 | Task-based pay with weekly payouts; no royalty or share on later licensing is mentioned. |
| catalogue_plus_custom | both | c015, c027, c042, c011 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c019, c012, c049 | Quality claims are Shaip's own statements about its own validation; no third-party audit of datasets was found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Shaip sells to enterprise AI teams (it claims 100+ customers) for commercial model training; volumes are quoted in images and video hours. Why buyers choose catalogue over custom is not stated. | c035, c055, c037 |
| Q2 | partial | Shaip runs its own catalogue and also lists de-identified medical datasets on Databricks Marketplace; what that listing earns it is not stated. | c051 |
| Q3 | sourced | Inventory mixes crowd collection by task-paid contributors, vendor-collected data, filmmaker and licensed video libraries, and YouTube and public-archive content. Rights are asserted as consent or permission for some sets; no rights basis is stated for the YouTube set. | c041, c043, c049, c025, c026, c020, c021, c039 |
| Q4 | unknown |  |  |
| Q5 | partial | Buyers contract with Shaip entities (US LLC or Indian LLP) under an MSA/SOW that is not published; Shaip's vendors indemnify Shaip and its clients. | c006, c004, c005, c044 |
| Q6 | partial | Datasets are delivered to buyers as files (JSON/CSV/XML, mp4); medical sets are also listed on Databricks Marketplace. | c018, c032, c051 |
| Q7 | partial | Shaip asserts contributor consent for every catalogue dataset and signed releases for custom egocentric capture, but listings carry no consent text and YouTube/public-archive sets name no consent basis. Property-owner consent is not addressed. | c022, c030, c017, c047, c020, c046 |
| Q8 | partial | Physical-AI datasets are licensed non-exclusively; licensing is one-time, subscription or enterprise. Audit, leakage and fingerprinting terms are not published. | c028, c009 |
| Q9 | sourced | Deals close through contact-sales and quotes under MSA/SOW; Shaip sells as principal with no public prices. | c016, c006, c009, c052 |
| Q10 | partial | A public listing shows title, size, format and short description with a 'Request Data' button; orders, revisions and entitlements are not described. | c047, c048 |
| Q11 | sourced | Free samples on request before commitment, plus Shaip's own quality, de-identification and provenance claims. | c010, c053, c029, c019, c013, c054 |
| Q12 | sourced | The 'AI Data Catalog & Licensing Marketplace' sits next to 'Fully Managed Data Collection Services'; catalogue pages offer off-the-shelf or fully customised data, and physical-AI data can be licensed or commissioned. | c011, c042, c015, c027 |

## Claims

### positioning

- **c004** Shaip's website terms name the US operating entity as Healthly.AI Data, LLC d/b/a Shaip, New York.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Healthly.AI Data, LLC d/b/a Shaip 568 Broadway, Suite 601 NY NY 10012, USA.” — Shaip, <https://www.shaip.com/terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** Shaip's website terms name an Indian entity, Shaip.AI Data (India) LLP, in Ahmedabad.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Shaip.AI Data (India) LLP B-604, Wall Street” — Shaip, <https://www.shaip.com/terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** Shaip's live About page says Shaip became part of Ubiquity Global Services in February 2026.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “In February 2026, Shaip became part of Ubiquity Global Services” — Shaip, <https://www.shaip.com/about/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Found via ubiquity.com/sitemap.xml. The source is the acquirer's own news release (dateline New York, February 12, 2026), so it is the counterparty to the deal rather than neutral press. It says 'entered into an agreement to acquire' and gives no closing date or terms; Shaip's own release of Feb 22, 2026 says it 'is now part of' Ubiquity. No filing exists to check: EDGAR full-text search for "Shaip" returns 0 hits, and PR Newswire's Ubiquity and Shaip newsrooms carry no 2026 release. No search available.
    - “Ubiquity Global Services announced that it has entered into an agreement to acquire Shaip” — Ubiquity Global Services, <https://www.ubiquity.com/resources/news/ubiquity-acquires-shaip-ai> · third_party_docs · retrieved 2026-10-01 · quote check: fuzzy 0.83
  - verifier (scope): **scope_ok** — The quote matches the About page. The profile's status value 'acquired' rests on Shaip's own 'became part of' / 'is now part of' wording. The acquirer's release (Feb 12, 2026) says only 'agreement to acquire', and nobody reports a close; the profile already records this in conflicts and unknowns.
- **c036** Shaip says it has 150+ team members.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **150 employees** (vendor-stated lower bound; as of retrieval)
  - “150+ Shaip team members” — Shaip, <https://www.shaip.com/about/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Shaip says its de-identified EHR and physician dictation datasets are available on the Databricks Marketplace.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Medical Data Catalog_
  - “Shaip's de-identified EHR and physician dictation datasets are available on the Databricks Marketplace” — Shaip, <https://www.shaip.com/offerings/medical-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c014** Shaip says its catalogue includes 55k+ hours of speech data in 50+ languages.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **55000 hours of speech data** (vendor-stated catalogue size, lower bound; as of retrieval)
  - “55k+ hours of speech data (50+ languages/100+ dialects)” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent count exists that could be reached. The acquirer's release only relays 'multilingual conversational data across 60+ languages', and Shaip's own pages disagree with each other: the licensing page says '55k+ hours of speech data (50+ languages/100+ dialects)', while the speech catalogue page says '100+ Languages & Accents' and 'over 65 languages'. The language count is therefore inconsistent even on the vendor's side. No search available.
  - verifier (scope): **scope_ok** — The quote comes from the data-catalogs-licensing page and supports the statement. However, Shaip's speech catalogue page gives different language counts ('over 65 languages and regional accents', '100+ Languages & Accents'), and the acquirer relays '60+ languages'. The 50+ figure is one of several inconsistent vendor numbers; see missed shaip-v003.
- **c020** Shaip's September 2026 catalogue update lists 80,000 hours of kids' content drawn from 240,000 YouTube videos.  
  _number · vendor_stated · as of 2026-09-22 (page_dated)_ · **80000 hours of video** (vendor-stated dataset size; source YouTube; as of publication)
  - “80,000 hours of kids' content across 240,000 YouTube videos” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The number appears only in Shaip's own September 2026 blog post. No independent listing, press or academic use could be reached (arXiv search for 'Shaip' returns no results; EDGAR 0 hits). The claim that 240,000 YouTube videos underlie a sold dataset is a rights question worth flagging, but I found no source on it. No search available.
  - verifier (scope): **scope_ok** — The quote sits under the 'Video at scale' section of the Sept 22, 2026 post. The post says nothing about how the YouTube videos were licensed or obtained, which the profile correctly logs as unknown other.youtube_rights_basis.
- **c021** Shaip's September 2026 catalogue update lists 25,000 Arabic calligraphy images gathered from public archives and working calligraphers.  
  _offer · vendor_stated · as of 2026-09-22 (page_dated)_
  - “25,000 Arabic calligraphy images gathered from public archives and working calligraphers” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c023** Shaip's September 2026 catalogue update lists a 10-million-image face recognition dataset.  
  _number · vendor_stated · as of 2026-09-22 (page_dated)_ · **10000000 images** (vendor-stated dataset size; as of publication)
  - “10-million-image face recognition dataset” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The number appears only in Shaip's own blog post and catalogue. No independent source was reachable (arXiv, EDGAR and PR Newswire all have nothing). No search available.
  - verifier (scope): **scope_ok** — The quote sits under 'Facial and body part recognition' and reads 'New additions include a 10-million-image face recognition dataset'.
- **c025** Shaip lists a 'Documentary Footage Across 8 Countries' dataset of original footage from a documentary filmmaker.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “over 3,000 hours of original, high-quality footage shot across 8 countries” — Shaip, <https://www.shaip.com/offerings/others-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “documentary filmmaker collection (3,000 hours across eight countries)” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c026** Shaip lists a 'Licensed Real-World Video Library (News, Weather, Sports & Events)' dataset of 1.2M minutes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensed Real-World Video Library (News, Weather, Sports & Events)” — Shaip, <https://www.shaip.com/offerings/others-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is a catalogue listing on Shaip's own site. The AWS Marketplace search for 'shaip' rendered no listings (JS-rendered), so I could not check whether a marketplace operator shows the same listing, and I could not identify who licenses the footage.
  - verifier (scope): **quote_incomplete** — The quote gives only the title; the '1.2M minutes' in the statement is not in it. The entry's count field reads '1.2M minutes', and its description reads 'Licensed video library of 1.2 million minutes spanning news, weather, sports, live events'. The page never names a licensor or says the footage is licensed in from a third party; its heading 'Licensed Video Datasets for AI' can mean licensable to buyers. Using c026 as evidence for partner_licensed supply, for operator_role ('licenses third-party footage'), or for economics_model is therefore an inference the page does not state.
- **c037** Shaip says a single physical-AI collection programme reached 5,000 valid hours of egocentric VR motion capture per month.  
  _outcome · vendor_stated · as of 2026-08-13 (publication)_
  - “5,000 valid hours of egocentric virtual reality (VR) motion capture per month” — Shaip, <https://www.shaip.com/press-coverage/shaip-scales-single-physical-ai-collection-program-to-5000-valid-hours-per-month/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The source is Shaip's own press-room item dated Aug 13/14, 2026, which has no outbound links to a wire or to the client. No wire copy was found (PR Newswire's Shaip newsroom has nothing after 2021), and the client is not named, so there is no customer to check against. No search available.
  - verifier (scope): **scope_ok** — This is Shaip's own press-room item (dateline New York, Aug 13, 2026), correctly marked vendor_stated. It describes a custom collection programme for an unnamed client, not catalogue inventory.
- **c041** Shaip's data collection page says it has 500K+ crowd contributors.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **500000 contributors** (vendor-stated registered crowd, lower bound; cumulative, as of retrieval)
  - “500K+ Crowd-scale credentialed contributors” — Shaip, <https://www.shaip.com/offerings/data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — I checked the app-store listings linked from Shaip's data collection page. The Google Play listing (id com.shaip.contributor) returns HTTP 404, both plain and with hl=en_US. The Apple App Store 'Shaip Work' app (seller Healthly.AI Data, LLC) shows 2.6 stars from 19 ratings. Neither can confirm or refute 500K+ contributors, since contributors may also work through the web portal. No search available.
  - verifier (scope): **scope_ok** — The quote matches. The same page also says '500k vetted contributors across 150+ languages'. Using this claim for matrix.supply_models own_collection is fair.
- **c043** Shaip's vendor requirements define Project Data as voice, image or text collected or created by a vendor for Shaip, showing third-party vendors collect data for it.  
  _terms · legal_text · as of 2023-12-06 (page_dated)_
  - “the specific data (e.g., voice, image, text) collected or created by the Vendor as part of the services delivered” — Shaip, <https://www.shaip.com/vendor-privacy-notice/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about a definition in Shaip's own vendor requirements document.
  - verifier (scope): **scope_wrong** — The page is titled the 'Vendor Privacy Notice' (effective 01/01/2020, last modified 12/06/2023), not 'vendor requirements'. The definition is quoted correctly. But the same notice says the vendor acts 'as a Processor or Sub-processor on behalf of the Company' and 'has no ownership or independent rights to the Company Data'. These vendors are therefore subcontracted collectors working under Shaip's instructions, not third-party providers supplying datasets of their own. The claim does not support supply_models third_party_providers; it fits own_collection through subcontractors.
- **c049** Shaip lists 500 hours of Arabic radio and TV interviews described as obtained by permission and verified by the vendor team.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “500 hours of video and audio obtained by permission, reviewed and verified by the vendor team” — Shaip, <https://www.shaip.com/offerings/others-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Shaip's computer-vision catalogue describes its video datasets, including YouTube Kids (80K hours), as off-the-shelf and licensable.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Off-the-shelf, licensable video datasets for AI: YouTube Kids (80K hours)” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c047** Shaip's face dataset listing shows a 'Black People Face Recognition Dataset' of more than 10 million images, with no consent or release text on the listing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “large human faces dataset of more than 10 million images for face recognition models” — Shaip, <https://www.shaip.com/offerings/facial-body-part-segmentation-and-recognition-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** Shaip lists a Selfie & Official ID Photo Dataset covering more than 6,000 people and over 70,000 images.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A selfie and official ID photo dataset covering more than 6,000 people and over 70,000 images” — Shaip, <https://www.shaip.com/offerings/facial-body-part-segmentation-and-recognition-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### discovery

- **c058** Shaip's open-datasets page is a free directory of 100+ curated third-party open datasets, separate from its licensed catalogue.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “100+ curated, human-validated datasets spanning NLP, Computer Vision, Speech, and Generative AI” — Shaip, <https://www.shaip.com/offerings/open-datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c010** Shaip invites buyers to request a free sample dataset to check quality before committing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request a free sample dataset to validate quality before you commit” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c013** Shaip says it supplies de-identification records (for medical data), provenance metadata and audit-ready compliance artifacts.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “de-identification records (for medical data), data provenance metadata, and audit-ready compliance artifacts” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c017** Shaip's computer-vision catalogue FAQ asserts all datasets comply with GDPR, with de-identification and contributor consent.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “all datasets comply with global privacy standards like GDPR, ensuring ethical sourcing, de-identification of personal data” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** Shaip's catalogue update tells buyers to browse by category and request a sample of any relevant dataset.  
  _offer · vendor_stated · as of 2026-09-22 (page_dated)_
  - “request a sample of anything that looks relevant” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** Shaip says physical-AI datasets marked sample-ready can be reviewed within days.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Datasets marked sample-ready can be reviewed within days.” — Shaip, <https://www.shaip.com/offerings/physical-ai-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c044** Shaip's vendor requirements make vendors indemnify Shaip, its affiliates and its clients against claims.  
  _terms · legal_text · as of 2023-12-06 (page_dated)_
  - “The Vendor agrees to defend, indemnify, and hold harmless the Company, its affiliates, officers, and clients” — Shaip, <https://www.shaip.com/vendor-privacy-notice/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** Shaip says sample medical datasets are available before any commitment.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sample datasets are available before any commitment.” — Shaip, <https://www.shaip.com/offerings/medical-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c006** Shaip's website terms defer refund rights to the Master Services Agreement, Statement of Work or other contract the customer has with Shaip, so dataset deals run on separate contracts not published.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “governed exclusively by the applicable Master Services Agreement, Statement of Work, or other contractual arrangement” — Shaip, <https://www.shaip.com/terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about a clause in Shaip's own website terms.
  - verifier (scope): **quote_incomplete** — The quote leaves out the subject. The clause sits under '3. Payments and Refunds' and reads 'If you are a customer purchasing services from Shaip (for example, enterprise data services or subscriptions), any refund rights are' before the quoted words; those words are needed to show that it is refund rights being deferred. The inference 'dataset deals run on separate contracts not published' goes beyond the text. The clause also says nothing about who is licensor of record, so citing it for matrix.operator_role is weak; it better supports transaction_mode and licence_model.

### pricing

- **c016** Shaip's computer-vision catalogue page does not publish prices and tells buyers to contact it for a detailed quote.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contact us for a detailed quote.” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about the absence of prices on Shaip's own page.
  - verifier (scope): **scope_ok** — The quote answers the FAQ 'What is the cost of computer vision datasets?', whose answer begins 'The cost varies based on dataset size, level of customization, and licensing requirements.' No price appears on the page.
- **c031** Shaip does not publish egocentric collection prices; it says pricing depends on hours or clips, task complexity and diversity.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pricing depends on scope — hours or clips, task complexity, number of environments” — Shaip, <https://www.shaip.com/offering/egocentric-video-data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c052** Shaip says the cost of its medical datasets depends on dataset type, modality, volume, customisation and licensing terms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The cost of medical datasets depends on dataset type, modality, volume, customization requirements, licensing terms” — Shaip, <https://www.shaip.com/offerings/medical-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c007** Shaip's website terms are governed by Kentucky law (for Shaip USA, Inc.) or by Indian law with courts in Ahmedabad.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “the Commonwealth of Kentucky, USA (for Shaip USA, Inc.), or (b) India and the courts of Ahmedabad, Gujarat” — Shaip, <https://www.shaip.com/terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c009** Shaip offers catalogue data licensing as a one-time purchase, subscription access, or custom enterprise agreement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “one-time purchase, subscription access, or custom enterprise agreements” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is Shaip's own offer description. Its data-catalogs-licensing page reads 'one-time purchase, subscription access, or custom enterprise agreements'.
  - verifier (scope): **scope_ok** — The quote matches the data-catalogs-licensing page. Note that 'subscription access' sits uneasily with the profile's licence_model 'negotiated'; the profile's note covers this.
- **c028** Shaip says all physical-AI catalogue datasets are licensable on a non-exclusive basis for AI training.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Physical AI Data Catalog_
  - “All datasets are licensable on a non-exclusive basis for AI training” — Shaip, <https://www.shaip.com/offerings/physical-ai-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Shaip says its catalogue datasets are available for immediate commercial licensing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “available for immediate commercial licensing” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### custody

- **c018** Shaip's computer-vision catalogue FAQ says datasets are delivered in standard formats such as JSON, CSV or XML with metadata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The datasets are delivered in standard formats such as JSON, CSV, or XML, with detailed metadata” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about the FAQ on Shaip's own catalogue page.
  - verifier (scope): **scope_ok** — The quote answers the FAQ 'How can these datasets integrate into AI workflows?' on the computer-vision catalogue page. It shows delivery file formats, not where the bytes are handed over, so it supports copy_to_buyer only by implication.
- **c032** Shaip delivers egocentric video as .mp4 with .json metadata and keypoints, with Parquet, WebDataset or LeRobot on request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “.mp4 video, .json metadata, keypoint files; Parquet / WebDataset / LeRobot on request” — Shaip, <https://www.shaip.com/offering/egocentric-video-data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c012** Shaip says every catalogue dataset is human-labeled, ethically sourced and delivered ready-to-train.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every dataset is human-labeled, ethically sourced, and delivered ready-to-train” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** Shaip's computer-vision catalogue FAQ says quality is ensured through validation processes and expert annotation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Quality is ensured through rigorous validation processes, expert annotation” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Shaip's September 2026 catalogue update asserts every catalogue dataset is ethically sourced with contributor consent.  
  _offer · vendor_stated · as of 2026-09-22 (page_dated)_
  - “Every dataset in the catalog is ethically sourced with contributor consent” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what Shaip itself asserts. Whether contributors actually consented cannot be independently checked from any reachable source.
  - verifier (scope): **scope_wrong** — The quoted sentence appears under the heading 'How these Computer Vision datasets are built', so 'the catalog' refers to the computer-vision catalogue, not every Shaip catalogue. The statement should be narrowed to computer-vision datasets. The same post also lists a kids'-content set 'across 240,000 YouTube videos' without saying how the consent of uploaders or depicted children was obtained.
- **c030** Shaip's egocentric video collection service advertises signed commercial-use participant releases.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Signed commercial-use participant releases” — Shaip, <https://www.shaip.com/offering/egocentric-video-data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Shaip says every medical dataset ships with HIPAA Safe Harbor de-identification by default.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every Shaip medical dataset ships with HIPAA Safe Harbor de-identification by default” — Shaip, <https://www.shaip.com/offerings/medical-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Shaip says every clip in its egocentric collection service is captured under commercial-use consent.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every clip is captured under commercial-use consent and delivered in your training format” — Shaip, <https://www.shaip.com/offering/egocentric-video-data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Shaip's egocentric collection service advertises accuracy, visibility and consistency checks with retakes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Accuracy, visibility and consistency checks with retakes” — Shaip, <https://www.shaip.com/offering/egocentric-video-data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c008** Shaip's website terms say it collects no payments or fees from crowd workers, contributors or freelancers on its platform.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Shaip does not collect any payments, fees, or charges from crowd workers, contributors, freelancers” — Shaip, <https://www.shaip.com/terms-of-service/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** Shaip's contributor portal recruits remote freelancers to earn from AI data tasks including data collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Earn Remotely with the World's Leading” — Shaip, <https://collaborate.shaip.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c039** Shaip's contributor portal says payment varies by project complexity and requirements, from quick microtasks upward, with no royalty on later licensing mentioned.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Payment varies by project complexity and requirements, with opportunities ranging from quick microtasks” — Shaip, <https://collaborate.shaip.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about Shaip's own contributor portal text. The App Store description of 'Shaip Work' (written by the vendor) likewise speaks only of task earnings, e.g. 'Simple tasks to earn real money', and never of royalties.
  - verifier (scope): **scope_ok** — The full sentence on collaborate.shaip.com reads 'Payment varies by project complexity and requirements, with opportunities ranging from quick microtasks to longer-term assignments'. The page mentions no royalties, revenue share or data ownership, so the absence is correctly stated.
- **c040** Shaip's contributor portal advertises weekly payouts to contributors.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Weekly payouts” — Shaip, <https://collaborate.shaip.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c011** Shaip calls its off-the-shelf side the 'AI Data Catalog & Licensing Marketplace'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “AI Data Catalog & Licensing Marketplace” — Shaip, <https://www.shaip.com/offerings/data-catalogs-licensing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c015** Shaip's computer-vision catalogue page offers licensing of off-the-shelf datasets or fully customised solutions.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Flexible licensing options are provided, including off-the-shelf datasets or fully customized solutions” — Shaip, <https://www.shaip.com/offerings/computer-vision-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c027** Shaip's physical-AI catalogue offers to license or commission human demonstrations and robot episode data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “License or commission human demonstrations, multimodal perception data” — Shaip, <https://www.shaip.com/offerings/physical-ai-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Shaip calls its bespoke collection offering 'Fully Managed Data Collection Services'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Fully Managed Data Collection Services” — Shaip, <https://www.shaip.com/offerings/data-collection/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** On 12 February 2026 Ubiquity Global Services announced it had entered into an agreement to acquire Shaip; the announcement does not say the deal closed.  
  _event · press_relayed · as of 2026-02-12 (publication)_
  - “announced that it has entered into an agreement to acquire Shaip” — Ubiquity Global Services, <https://www.ubiquity.com/resources/news/ubiquity-acquires-shaip-ai> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c002** On 22 September 2026 Shaip announced new image and video datasets added across every category of its computer-vision catalogue.  
  _event · vendor_stated · as of 2026-09-22 (page_dated)_
  - “New image and video datasets have been added across every category in the catalog” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The only trace is Shaip's own blog post (post-sitemap.xml lists /blog/computer-vision-data-catalog-with-new-image-and-video-datasets/ with lastmod 2026-09-22). No wire release: PR Newswire's Shaip newsroom lists only a January 2021 release; Shaip's press room lists nothing after Aug 14, 2026. No search available to look for trade-press coverage.
  - verifier (scope): **scope_ok** — The blog post shows a publication date of September 22, 2026, and the sitemap lastmod is 2026-09-22. It is a vendor blog post, not a press release.
- **c003** Shaip's computer-vision catalogue update post is dated 22 September 2026, showing the company still publishing and trading.  
  _status · vendor_stated · as of 2026-09-22 (page_dated)_
  - “September 22, 2026” — Shaip, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** On 22 February 2026 Shaip announced that it is now part of Ubiquity Global Services, Inc.  
  _event · vendor_stated · as of 2026-02-22 (publication)_
  - “today announced that it is now part of Ubiquity Global Services, Inc.” — Shaip, <https://www.shaip.com/press-coverage/shaip-joins-ubiquity-to-accelerate-enterprise-ai-data-delivery-at-global-scale/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c035** Shaip says it has 100+ customers worldwide.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 customers** (vendor-stated lower bound, all services not only catalogue; cumulative, as of retrieval)
  - “100+ Customers worldwide” — Shaip, <https://www.shaip.com/about/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The acquirer's release (ubiquity.com, Feb 12, 2026) gives no customer count; it says only 'leading AI labs and enterprise customers worldwide'. Neither company files with the SEC, and CourtListener returned HTTP 403. No search available.
  - verifier (scope): **scope_ok** — The About page counter reads '100+ Customers worldwide'. It is a company-wide figure, not a count of catalogue buyers, and the value basis says so.

### regulation

- **c045** Shaip's privacy policy covers facial images, voice recordings and video that users record or upload on its platform.  
  _terms · legal_text · as of 2025-09-01 (page_dated)_
  - “any media, including facial or other images, voice recording, or video that you record/upload on the Platform” — Shaip, <https://www.shaip.com/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** Shaip's privacy policy lets users withdraw consent but does not say what happens to data already delivered to customers.  
  _terms · legal_text · as of 2025-09-01 (page_dated)_
  - “You may also decline to submit any personal information or withdraw your consent” — Shaip, <https://www.shaip.com/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Shaip recruits crowd workers through a phone app, 'Shaip Work', published on the Apple App Store by Healthly.AI Data, LLC, in which workers collect pictures, audio or video for pay.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Shaip Work app, US App Store_
  - “Select a job you like & work on tasks by collecting pictures, audio, or video using the app.” — Healthly.AI Data, LLC (Apple App Store listing), <https://apps.apple.com/us/app/shaip-work/id6447959870> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v002** The US Apple App Store listing of Shaip's contributor app 'Shaip Work' shows 19 ratings averaging 2.6 out of 5, a platform-measured figure far below the 500K+ contributors Shaip claims (ratings are not downloads, and the Google Play listing linked from Shaip's site returned HTTP 404).  
  _number · independent · as of 2026-10-01 (retrieved_only) · scope: Shaip Work app, US App Store_ · **19 App Store ratings** (count of user ratings on the US Apple App Store listing, not downloads or active contributors; cumulative, as of retrieval)
  - “2.6 out of 5 • 19 Ratings” — Apple App Store, <https://apps.apple.com/us/app/shaip-work/id6447959870> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v003** Shaip's speech data catalogue page says its datasets cover over 65 languages and regional accents, a different count from the 50+ languages on its licensing page.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: speech data catalogue_ · **65 languages and regional accents** (vendor-stated catalogue coverage, lower bound; languages and accents counted together; as of retrieval)
  - “The datasets cover over 65 languages and regional accents” — Shaip, <https://www.shaip.com/offerings/speech-data-catalog/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.shaip.com/offerings/data-catalogs-licensing/>, <https://www.shaip.com/offerings/physical-ai-data-catalog/>, <https://www.shaip.com/offerings/computer-vision-data-catalog/>, <https://www.shaip.com/terms-of-service/>
- `matrix.buyer_vetting` — not_published; tried <https://www.shaip.com/offerings/data-catalogs-licensing/>, <https://www.shaip.com/terms-of-service/>, <https://www.shaip.com/offerings/computer-vision-data-catalog/>
- `matrix.versioning` — not_published; tried <https://www.shaip.com/offerings/data-catalogs-licensing/>, <https://www.shaip.com/offerings/computer-vision-data-catalog/>, <https://www.shaip.com/offerings/others-datasets/>, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets>
- `matrix.erasure_after_sale` — not_published; tried <https://www.shaip.com/terms-of-service/>, <https://www.shaip.com/privacy-policy/>, <https://www.shaip.com/vendor-privacy-notice/>, <https://www.shaip.com/offerings/data-catalogs-licensing/>
- `questions.Q4` — not_published; tried <https://www.shaip.com/offerings/data-collection/>, <https://www.shaip.com/offering/egocentric-video-data-collection/>, <https://www.shaip.com/terms-of-service/>, <https://www.shaip.com/offerings/data-catalogs-licensing/>
- `other.dataset_licence_text` — not_published; tried <https://www.shaip.com/offerings/data-catalogs-licensing/>, <https://www.shaip.com/terms-of-service/>, <https://www.shaip.com/offerings/computer-vision-data-catalog/>, <https://www.shaip.com/offerings/physical-ai-data-catalog/>, <https://www.shaip.com/offerings/medical-data-catalog/>
- `other.youtube_rights_basis` — not_published; tried <https://www.shaip.com/offerings/others-datasets/>, <https://www.shaip.com/offerings/computer-vision-data-catalog/>, <https://www.shaip.com/blog/computer-vision-data-catalog-with-new-image-and-video-datasets>
- `other.acquisition_close_independent` — not_found; tried <https://www.ubiquity.com/resources/news/ubiquity-acquires-shaip-ai>, <https://www.shaip.com/press-coverage/shaip-joins-ubiquity-to-accelerate-enterprise-ai-data-delivery-at-global-scale/>, <https://www.shaip.com/about/>
- `other.dataset_detail_pages` — gated; tried <https://www.shaip.com/offerings/others-datasets/>, <https://www.shaip.com/offerings/facial-body-part-segmentation-and-recognition-datasets/>
- `other.india_delivery_operations` — not_published; tried <https://www.shaip.com/about/>, <https://www.shaip.com/offerings/data-collection/>, <https://www.shaip.com/terms-of-service/>

## Conflicts

- c001, c033: The 12 Feb 2026 announcement is an agreement to acquire; Shaip's 22 Feb 2026 release says it is now part of Ubiquity. Status recorded as acquired, on Shaip's own word only. (newer_wins_status)

## Leads, not cited

- <https://marketplace.databricks.com/> — Shaip's medical listings there may show a buyer-facing licence and delivery via sharing; not fetched (JS app).
- <https://www.ubiquity.com/resources/news/> — Ubiquity news index could confirm closing; no independent press found without search.
- <https://www.shaip.com/speech_datasets-sitemap.xml> — Speech dataset detail pages may carry per-listing licence or consent fields.
- <https://www.shaip.com/offering/egocentric-video-data-collection/> — Ask Shaip whether signed releases are delivered with catalogue physical-AI data (no contact allowed in this run).
