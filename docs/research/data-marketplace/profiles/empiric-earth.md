# Empiric Earth

crowd_capture · light · status: **active** · also known as Nexar, Nexar Inc., Nauto

> Rendered from `ledger/empiric-earth.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Atlas ("a search engine for the real world")” and its bespoke side “Targeted collection (legacy Nexar: "Collection On-Demand")”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c012, c013, c020, c040 | Empiric Earth/Nexar holds sub-licensable, royalty-free rights over contributor footage and shares anonymized video with AV companies itself; the data-licence contracts themselves are not published. |
| economics_model | principal_margin | c013, c014, c020 | Operator acquires footage rights royalty-free and licenses its own record; no marketplace fee exists. No data prices are published. |
| who_pays_fee | not_applicable |  | No marketplace fee: the operator sells its own data rather than intermediating third-party sales. |
| supply_models | contributor_uploads, commissioned_nonexclusive | c012, c013, c023, c061, c042, c043, c044 | Consumer dashcam users contribute anonymized road footage; Nauto fleet customers' data (collected for the paying fleet) may be anonymized, when the customer permits, for Nauto's own use. Targeted collection runs on the same network. No third-party providers seen. |
| custody_model | platform_hosted | c030, c031 | Scoped to Atlas: web access, API coming soon, CSV export. How licensed training-data sets are physically delivered is not published. |
| transaction_mode | contact_sales | c033, c057 |  |
| public_prices | none | c033, c057 | No dataset or data-access price published; only device and subscription prices (Nauto VEDR, Nexar dashcams, LTE plan) appear. |
| licence_model | unknown |  | Commercial data-licence agreements are separate, unpublished contracts (c040); the free open dataset uses the Nexar Open Data License. |
| exclusivity_offered | unknown |  |  |
| public_listing | unknown |  | No public listing of commercial datasets or Atlas records found; anonymous visitors see product pages only. The free Hugging Face dataset is gated behind accepted conditions. |
| buyer_vetting | unknown |  |  |
| sample_mechanics | sample_on_request | c034 | A demo in which the company runs a real scenario from the prospect's project; no downloadable commercial sample seen. |
| versioning | unknown |  |  |
| human_subject_consent_docs | unknown |  | Public evidence shows the model substitutes on-device de-identification (c021, c061) for consent of people depicted; what a buyer receives or is warranted is not published. |
| contributor_pay_model | none | c014, c063 | Consumer terms grant rights without payment; contributors buy their own dashcam. |
| catalogue_plus_custom | both | c027, c032, c038, c055 |  |
| erasure_after_sale | unknown |  | Consumer content licence ends on deletion, but the licence over fully anonymized content is perpetual and irrevocable; data subjects can request takedown of anonymized content by location. Obligations on buyers' copies are not published. |
| quality_evidence | operator_verified | c027, c029 | The operator is also the supplier; curation and risk ranking are its own processes (curated, filtered footage ranked by its BADAS model). |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers are AV and robotics developers, automakers, insurers, cities and researchers who want real long-tail events rather than generated ones; the unit is curated driving videos/events, with Waymo named as a recipient. Volumes sold and prices are not published. | c009, c035, c039, c050, c020 |
| Q2 | partial | Commercial data is sold only direct; Nexar used Hugging Face solely for a free 1,500-video research dataset gated behind accepted conditions and contact sharing. | c051, c054 |
| Q3 | sourced | Inventory comes from consumer dashcam users under a sub-licensable, royalty-free licence plus a perpetual licence over fully anonymized content, and from Nauto fleet customers' data anonymized only where the customer permits (under 1%). | c012, c013, c014, c020, c023, c042, c043, c044 |
| Q4 | partial | For fleet (commissioned) data Nauto acts as processor and may anonymize a small fraction only when the customer permits, then use anonymized information for any purpose. No record of after-the-fact term changes was found. | c041, c042, c043, c044 |
| Q5 | partial | The operator is licensor of record through sub-licensable grants and requires consumer contributors to indemnify it; buyer-side warranties and indemnities sit in unpublished data-licence contracts. | c012, c013, c017, c040 |
| Q6 | partial | Detection runs on the device and only the detection plus surrounding clip is uploaded; Atlas is web-hosted search with CSV export, API coming soon. Bulk delivery of licensed sets is not described. | c030, c031, c036 |
| Q7 | sourced | Capturers opt in or out in app settings depending on location; people and plates depicted are not asked but are blurred on-device before upload; any data subject may request takedown of anonymized content by location; property owners are not addressed. | c021, c022, c023, c061, c062, c025 |
| Q8 | partial | Commercial data-licence terms are unpublished; the free open dataset licence bars resale and re-identification of people or vehicles. No fingerprinting or audit terms seen. | c040, c052, c053 |
| Q9 | partial | Deals close through sales (talk to sales, schedule a call); the operator licenses its own data rather than taking a commission. | c033, c057, c013 |
| Q10 | partial | Atlas exposes curated driving videos as search results that can be organised in folders and exported to CSV; Nexar's Enricher packages annotated datasets. Revisions, orders and entitlements are not described. | c027, c031, c056 |
| Q11 | partial | Pre-purchase evidence is a demo on the prospect's scenario, natural-language search ranked by risk, a free open research dataset, and published privacy commitments. | c034, c029, c051, c060 |
| Q12 | sourced | Atlas, 'a search engine for the real world', is the ready-made side; 'targeted collection' (Nexar: 'Collection On-Demand') points the live network at conditions missing from the archive. | c028, c032, c038, c055 |

## Claims

### positioning

- **c004** Empiric Earth says its record covers more than 10 billion miles of observed driving and 60 million edge cases.  
  _number · vendor_stated · as of 2026-09-15 (page_dated)_ · **10000000000 miles of observed driving (cumulative)** (vendor-stated total record size, combined Nexar and Nauto; cumulative)
  - “more than 10 billion miles of observed driving and 60 million edge cases across 98% of US roads” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Only the vendor's own wire release and trade press relaying it (Automotive Fleet: 'more than 10 billion miles of historical driving data', attributed to the companies). No independent audit of the figures exists that could be reached without search.
    - “more than 10 billion miles of observed driving and 60 million edge cases across 98% of US roads” — PR Newswire (Empiric Earth release), <https://www.prnewswire.com/news-releases/nexar-and-nauto-are-now-empiric-earth-302878910.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the launch release and the statement is correctly framed as 'says'.
- **c011** Empiric Earth describes its driving record as de-identified and owned by no manufacturer.  
  _offer · vendor_stated · as of 2026-09-15 (page_dated)_
  - “de-identified record, owned by no manufacturer and competing with none of the systems it measures” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c005** Empiric Earth says more than 350,000 connected sensors add over 300 million new miles every month.  
  _number · vendor_stated · as of 2026-09-15 (page_dated)_ · **300000000 miles of new driving captured** (vendor-stated, combined network of connected sensors; per month)
  - “More than 350,000 connected sensors add over 300 million new miles every month” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Vendor wire release. Automotive Fleet relays the 300 million miles per month (attributed to the companies) but not the 350,000 sensors. No independent count reachable without search.
    - “More than 350,000 connected sensors add over 300 million new miles every month” — PR Newswire (Empiric Earth release), <https://www.prnewswire.com/news-releases/nexar-and-nauto-are-now-empiric-earth-302878910.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the launch release word for word.
- **c006** Nexar said before the merger that it captured more than 100 million miles of driving every month across 94% of US roads.  
  _number · vendor_stated · as of 2026-07-01 (page_dated)_ · **100000000 miles of driving captured** (vendor-stated, Nexar network only, pre-merger; per month)
  - “capturing more than 100 million miles of real-world driving every month across 94% of US roads” — Empiric Earth, <https://empiricearth.com/nexar-and-nauto-to-merge> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c007** Nauto's business was described as built on more than six billion miles of commercial driving data.  
  _number · vendor_stated · as of 2026-07-01 (page_dated)_ · **6000000000 miles of commercial fleet driving data** (vendor-stated, Nauto fleet data, cumulative; cumulative)
  - “built on more than six billion miles of commercial driving data” — Empiric Earth, <https://empiricearth.com/nexar-and-nauto-to-merge> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** Nexar's consumer terms say user content may be shared among users and integrated into CityStream products.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “shared among Users and integrated into CityStream products to enhance road safety” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Nexar's privacy policy says it shares anonymized videos with advanced driving companies to improve their models.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “we share anonymized videos with advanced driving companies to improve the accuracy” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** Nexar's privacy policy lets users choose whether to contribute anonymized content via app settings, as opt-in or opt-out depending on location.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “You can choose whether you wish to contribute anonymized content for the purposes described above via the App's settings menu” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Nexar's privacy policy says it shares anonymized camera-generated content with business partners for mapmaking.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “We share anonymized Camera-Generated Content of our Users with our business partners” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** Nexar's privacy policy defines training data as portions of content captured by both in-cabin and road-facing cameras.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “Training data is made of certain portions of Camera-Generated Content captured by both in-cabin and road-facing Cameras” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** Empiric Earth's methodology page says sensors run detection models on the device and what leaves the vehicle is the detection plus the clip around it.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “what leaves is the detection plus the clip around it” — Empiric Earth, <https://empiricearth.com/methodology> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** Empiric Earth says its data comes from sensors on vehicles making journeys their drivers were making anyway.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “350,000 active sensors on vehicles making journeys their drivers were making anyway” — Empiric Earth, <https://empiricearth.com/methodology> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** Nauto's solution privacy policy says Nauto is a processor of personal information it processes on behalf of its fleet customers.  
  _terms · legal_text · as of 2026-07-14 (page_dated) · scope: Nauto fleet solution_
  - “Nauto is a processor of any personal information it processes on behalf of Nauto's customers” — Empiric Earth, <https://empiricearth.com/legal/products-and-services> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** Nauto's solution privacy policy says that, when permitted by its customers, it may anonymize or pseudonymize a small fraction of fleet customer data.  
  _terms · legal_text · as of 2026-07-14 (page_dated) · scope: Nauto fleet solution_
  - “When permitted by our customers, we may anonymize or pseudonymize a small fraction of Customer Data” — Empiric Earth, <https://empiricearth.com/legal/products-and-services> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Nauto's own solution privacy policy. No search available; none spent.
  - verifier (scope): **scope_ok** — Quote matches the Nauto Solution Privacy Policy (effective 07/14/2026), now hosted at empiricearth.com/legal/products-and-services.
- **c043** Nauto's solution privacy policy caps that anonymized or pseudonymized fraction at less than 1% of data collected from Nauto customers.  
  _number · legal_text · as of 2026-07-14 (page_dated) · scope: Nauto fleet solution_ · **1 percent of fleet customer data collected (upper bound)** (share of Nauto fleet customer data that may be anonymized or pseudonymized for Nauto's own use, when customer permits; not stated)
  - “less than 1% of data collected and processed by the Services based on Nauto customer data” — Empiric Earth, <https://empiricearth.com/legal/products-and-services> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A cap stated in Nauto's own privacy policy; exists only on the vendor's site. WebSearch not available; no further search spent.
  - verifier (scope): **scope_ok** — The page is titled 'Nauto Solution Privacy Policy for Nauto Products and Services', effective 07/14/2026. The full clause reads 'anonymize or pseudonymize a small fraction of Customer Data (less than 1% of data collected and processed ...)', so the 1% figure does define that fraction.
- **c058** Nexar's legacy site says buyers can access over 1.2 billion visualized miles annually.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1200000000 visualized miles** (vendor-stated annual volume accessible to data customers; per year)
  - “Access over 1.2 billion visualized miles annually” — Nexar, <https://www.nexar-ai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c062** Nexar's consumer site says users can opt out of the Road Safety contribution at any time in the app's privacy settings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexar consumer dashcams_
  - “Opt out anytime in Settings” — Nexar, <https://www.getnexar.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c027** Empiric Earth says Atlas contains more than 6 million curated driving videos.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_ · **6000000 curated driving videos** (vendor-stated Atlas corpus size; cumulative)
  - “6M+ curated driving videos, filtered to usable road footage” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source for the Atlas size could be reached without search. The merger wire release (PR Newswire, 2026-09-15) does not mention Atlas or video counts; Automotive Fleet does not either. arXiv's own search for 'Nexar' (export.arxiv.org API) finds Nexar-authored papers citing much smaller labelled sets (BADAS-2.0: 178,500 labelled videos, 2.25M unlabelled), none citing 6 million curated Atlas videos.
  - verifier (scope): **scope_ok** — Quote is on the Atlas product page, as the scope says.
- **c056** Nexar's legacy site says its Enricher turns raw footage into annotated, AI-ready datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our Enricher transforms raw footage into context-rich, annotated, AI-ready datasets” — Nexar, <https://www.nexar-ai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### discovery

- **c028** Empiric Earth describes Atlas as a search engine for the real world.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Atlas is a search engine for the real world” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** Atlas lets a user describe a situation and returns matching real events ranked by how dangerous they got.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Describe a situation and it returns the real events that match, ranked by how dangerous they actually got” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c016** Nexar's consumer terms describe processing user content by de-linking, de-identifying, anonymizing and aggregating it.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “de-linking, de-identifying, anonymizing, and aggregating it” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** Nexar's privacy policy says anonymization is performed on the user's device before the information is sent to Nexar.  
  _architecture · legal_text · as of 2025-09 (page_dated)_
  - “The anonymization is performed directly on the User's device, even before the information is sent to Nexar” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what Nexar's privacy policy says. Whether anonymization really happens on-device could be tested by independent reporting or a regulator, but none could be reached without search; the Waymo/Nexar paper says only that the data was 'anonymized', not where.
  - verifier (scope): **scope_ok** — The quote is accurate (policy last updated September 2025), but on-device anonymization covers only the anonymized-content stream. The same policy's Training data section says that data includes non-anonymized content capturing pedestrians and licence plates, processed under legitimate interest. Do not read c021 as 'everything leaves the device anonymized'; see missed empiric-earth-v001.
- **c022** Nexar's privacy policy acknowledges raw camera images may capture individuals and licence plates and says identifiable elements are anonymized.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “we make sure that all identifiable elements are anonymized” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** The Atlas page offers a demo in which the company runs a real scenario from the prospect's project.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Ask for a demo where we will run a real scenario from your project” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** Nauto's solution terms define De-Identified Data as customer data de-identified including by reasonable efforts to blur identifying images.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Nauto fleet solution_
  - “Customer Data that has been de-identified, including by using reasonable efforts to blur identifying images” — Empiric Earth, <https://empiricearth.com/legal/solution-terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c048** Nexar reported that an S3 bucket exposed in an August 2025 incident held non-identifiable dashcam video recordings without user PII.  
  _event · vendor_stated · as of 2025-09-03 (page_dated)_
  - “non-identifiable video recordings. The bucket does not contain personally identifiable information” — Empiric Earth, <https://empiricearth.com/insights/report-on-a-recent-data-incident> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c049** Nexar reported that a compromised service account exported a Confluence page listing names and email addresses of CityStream users.  
  _event · vendor_stated · as of 2025-09-03 (page_dated)_
  - “The account was used to export a Confluence page containing a list of names and email addresses” — Empiric Earth, <https://empiricearth.com/insights/report-on-a-recent-data-incident> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c059** Empiric Earth's privacy hub states its position as measuring roads, not people.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We measure roads. Not people.” — Empiric Earth, <https://empiricearth.com/privacy> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** Empiric Earth's privacy hub advertises ten binding commitments on road data privacy.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Ten binding commitments on road data privacy” — Empiric Earth, <https://empiricearth.com/privacy> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c061** Nexar's consumer site says faces, licence plates and pedestrians are blurred on-device before any road data leaves the camera.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexar consumer dashcams_
  - “Before any road data leaves your camera, faces, license plates, and pedestrians are blurred on-device” — Nexar, <https://www.getnexar.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c033** The Atlas page directs buyers to talk to sales; no self-serve checkout is shown.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Talk to sales” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A button and the absence of a checkout on the vendor's own Atlas page.
  - verifier (scope): **scope_ok** — The Atlas page has no price, checkout or self-serve sign-up. Its other calls to action are 'Schedule a demo' and 'Ask for a scenario', which are consistent with contact-sales.
- **c057** Nexar's legacy data site routes buyers to schedule a call rather than a checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Schedule a call” — Nexar, <https://www.nexar-ai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c046** Nauto VEDR, a fleet video event recorder product, is listed at $25 per unit per month (a device subscription, not a dataset price).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nauto VEDR, self-install_ · **25 USD per vehicle unit** (fleet customer pays; Nauto VEDR self-install plan subscription; not a data price; per month)
  - “$25 per unit per month” — Empiric Earth, <https://empiricearth.com/products/vedr-pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c047** Nauto VEDR carries a $375 one-time upfront fee per unit.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nauto VEDR, self-install_ · **375 USD per vehicle unit** (fleet customer pays; Nauto VEDR self-install plan; not a data price; one-off)
  - “$375 upfront fee, one time per unit” — Empiric Earth, <https://empiricearth.com/products/vedr-pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c065** Nexar's consumer LTE Protection Plan is priced at $9.99 per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexar LTE Protection Plan, US_ · **9.99 USD per subscriber** (consumer pays Nexar; dashcam connectivity subscription, not a data price; per month)
  - “$9.99” — Nexar, <https://www.getnexar.com/> · pricing_page · retrieved 2026-10-01 · quote check: exact

### licence

- **c012** Nexar's consumer terms grant Nexar a non-exclusive, worldwide, transferable, sub-licensable, royalty-free licence to process users' content.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “a non-exclusive, worldwide, transferrable, sub-licensable, royalty-free permanent license to process your User Content” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** Nexar's consumer terms grant Nexar a perpetual, irrevocable, sub-licensable licence to use fully anonymized user content in any way.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “royalty-free license to use, in any way, your fully anonymized User Content” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Nexar's own consumer terms. No search available; none spent.
  - verifier (scope): **quote_incomplete** — The fact is right, but the cited quote ('royalty-free license to use, in any way, your fully anonymized User Content') shows neither 'perpetual', 'irrevocable' nor 'sub-licensable'. The words 'worldwide, perpetual, irrevocable, transferable, sub-licensable, royalty-free license' from the same grant (terms last updated February 12, 2026) would show them.
- **c017** Nexar's consumer terms require users to defend, indemnify and hold Nexar harmless from claims.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “you will defend, indemnify and hold Nexar, its officers, employees, agents or suppliers harmless from any and all claims” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c040** Empiric Earth's website terms state that data-licence agreements are separate contracts not covered by the website terms.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Product, device and data-licence agreements are separate contracts and are not replaced by them” — Empiric Earth, <https://empiricearth.com/legal/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own website terms.
  - verifier (scope): **scope_ok** — Quote is in the Website Terms of Use (last updated September 15, 2026), preceded by 'These Terms apply to this website only.'
- **c044** Nauto's solution privacy policy says Nauto may disclose or use anonymized information for any purpose.  
  _terms · legal_text · as of 2026-07-14 (page_dated) · scope: Nauto fleet solution_
  - “Nauto may disclose or use anonymized information for any purpose” — Empiric Earth, <https://empiricearth.com/legal/products-and-services> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** The Hugging Face card says the Nexar Open Data License permits free use with attribution and prohibits resale and reidentification of people or vehicles.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nexar_collision_prediction open dataset_
  - “prohibits resale, reidentification of people or vehicles” — Nexar, <https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction> · docs · retrieved 2026-10-01 · quote check: exact
- **c053** The Nexar Open Data License bars selling, sublicensing or redistributing the dataset for profit without Nexar's written consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nexar_collision_prediction open dataset_
  - “The Dataset may not be sold, sublicensed, or otherwise redistributed for profit without prior written consent” — Nexar, <https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/blob/main/LICENSE> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c030** Atlas is accessed through the web, with an API listed as coming soon.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Access: Web, and API” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Access channel shown on the vendor's own Atlas product page.
  - verifier (scope): **quote_incomplete** — The cited quote 'Access: Web, and API' does not show that the API is not yet available. The page reads 'Access: Web, and API [Coming soon]'; the quote should include 'Coming soon'.
- **c031** Atlas offers folders, threaded comments and CSV export at any size.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Folders, threaded comments, CSV export at any size” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c054** The Hugging Face dataset requires users to accept conditions and share contact information before accessing files.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: nexar_collision_prediction open dataset_
  - “accept the conditions to access its files and content” — Nexar, <https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction> · docs · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c014** Nexar's consumer terms state that its use of user content does not require payment to the user.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “without the requirement of payment to you or any other person or entity” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Nexar's own consumer terms. No search available; none spent.
  - verifier (scope): **scope_ok** — Quote is in Nexar's consumer terms (last updated February 12, 2026).
- **c063** Nexar's consumer site presents footage contribution as helping road safety and shows no payment or reward for contributing footage.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexar consumer dashcams_
  - “Your dashcam contributes to a safer road network” — Nexar, <https://www.getnexar.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Presentation and absence of a reward on the vendor's own consumer site. No search available to look for third-party reports of contributor payment.
  - verifier (scope): **scope_ok** — The absence is properly put in the statement. The footer has a 'Refer a friend' referral programme, which rewards referrals, not footage; it does not contradict the claim.
- **c064** Nexar sells the Nexar Beam GPS consumer dashcam at $129.95, so contributors pay for their capture device.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Nexar Beam GPS, US_ · **129.95 USD per dashcam** (consumer pays Nexar; hardware retail price, not a data price; one-off)
  - “$129.95” — Nexar, <https://www.getnexar.com/> · pricing_page · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c015** Nexar's consumer terms say the content licence ends when the user deletes the content or account.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “This license ends when you delete your content or your account” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** Nexar's privacy policy lets any data subject submit a takedown request for anonymized content about a specific location.  
  _terms · legal_text · as of 2025-09 (page_dated)_
  - “may submit a Takedown Request for anonymized content related to a specific location” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c032** Atlas offers targeted collection that points the live network at a condition the customer asks for.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Targeted collection points the live network at the condition you asked for” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** Empiric Earth's AV and robotics page offers commissioning targeted collection when a needed condition is not yet in the archive.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Commissioning targeted collection when a condition you need is not in the archive yet” — Empiric Earth, <https://empiricearth.com/industries/av-robotics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Nexar's public collision prediction dataset on Hugging Face contains 1,500 videos.  
  _number · vendor_stated · as of 2025-03-24 (page_dated) · scope: nexar_collision_prediction open dataset_ · **1500 driving videos** (free open dataset for a research challenge; no price; one-off)
  - “1,500 real-world driving videos, including actual collisions, near-collisions, and normal driving videos” — Empiric Earth, <https://empiricearth.com/insights/nexars-open-dataset-and-crash-prediction-challenge-pushing-the-boundaries-of-ai-driven-road-safety> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c055** Nexar's legacy site offers collection on demand, in which the customer defines edge cases and Nexar targets and delivers the data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Define the exact edge cases and we proactively target and deliver the data you need” — Nexar, <https://www.nexar-ai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.85

### changes

- **c001** Empiric Earth announced on 2026-09-15 that Nexar and Nauto now operate as Empiric Earth.  
  _status · vendor_stated · as of 2026-09-15 (page_dated)_
  - “Nexar and Nauto are now Empiric Earth.” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “have combined and now operate under a single name as of today” — PR Newswire, <https://www.prnewswire.com/news-releases/nexar-and-nauto-are-now-empiric-earth-302878910.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Trade-press editor's note on an article first published July 2026 (when the merger was signed, not closed). The PR Newswire release of 2026-09-15 (NEW YORK dateline) says the same. Found by navigation from the vendor newsroom; no search available.
    - “As of Sept. 15, 2026, the merger has been finalized, and the combined company is now operating under the name Empiric Earth” — Automotive Fleet, <https://www.automotive-fleet.com/news/nexar-nauto-merger-aims-to-give-fleets-better-safety-intelligence-through-larger-driving-dataset> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Both cited quotes match the 2026-09-15 launch release (vendor newsroom and PR Newswire, NEW YORK dateline). The blind step found an independent trade-press confirmation (Automotive Fleet editor's note), so the status no longer rests only on the vendor.
- **c002** Nexar and Nauto announced on 2026-07-01 a definitive agreement to merge.  
  _event · vendor_stated · as of 2026-07-01 (page_dated)_
  - “Nexar and Nauto today announced they have entered into a definitive agreement to merge.” — Empiric Earth, <https://empiricearth.com/nexar-and-nauto-to-merge> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.83
- **c003** Nexar's CEO Zach Greenberger was named CEO of the combined company.  
  _event · vendor_stated · as of 2026-07-01 (page_dated)_
  - “Zach Greenberger, Nexar's CEO, will be CEO of the combined company” — Empiric Earth, <https://empiricearth.com/nexar-and-nauto-to-merge> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c008** Nauto says more than 1,000 fleets worldwide use it to prevent risks.  
  _outcome · vendor_stated · as of 2026-07-01 (page_dated)_
  - “More than 1,000 fleets worldwide depend on Nauto to prevent risks” — Empiric Earth, <https://empiricearth.com/nexar-and-nauto-to-merge> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Trade press attributes the figure to the companies' merger announcement; it is not the publication's own count. The AFC partner release on the vendor newsroom gives no fleet count. No search available to find a customer-side or analyst count.
    - “used by more than 1,000 commercial fleets worldwide” — Automotive Fleet, <https://www.automotive-fleet.com/news/nexar-nauto-merger-aims-to-give-fleets-better-safety-intelligence-through-larger-driving-dataset> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is from the 'About Nauto, Inc.' boilerplate of the 2026-07-01 merger release, so it is Nauto's own figure, dated before the merger closed.
- **c009** Empiric Earth names developers, automakers, fleets, insurers and public agencies as users of its driving record.  
  _offer · vendor_stated · as of 2026-09-15 (page_dated)_
  - “Developers, automakers, fleets, insurers and public agencies use the record” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c010** Empiric Earth says its safety models have produced a 50 to 80% reduction in collision loss across enterprise fleets.  
  _outcome · vendor_stated · as of 2026-09-15 (page_dated)_
  - “50 to 80% reduction in collision loss across enterprise fleets” — Empiric Earth, <https://empiricearth.com/press-releases/empiric-earth-launches> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The wire release says the models 'supported' the reduction, which is softer than 'produced'. Automotive Fleet's merger article gives no collision-reduction figure. No customer or insurer study reachable without search.
    - “supported a 50 to 80% reduction in collision loss across enterprise fleets” — PR Newswire (Empiric Earth release), <https://www.prnewswire.com/news-releases/nexar-and-nauto-are-now-empiric-earth-302878910.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_wrong** — The statement says the models 'have produced' the reduction; the release says 'Empiric Earth safety models have supported a 50 to 80% reduction in collision loss across enterprise fleets'. 'Supported' is a weaker causal claim, and the cited quote leaves the verb out. Restate as 'supported'.
- **c035** The Atlas page lists validation leads, AV and robotics, insurers, cities and DOTs, and researchers as users.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Atlas_
  - “Validation leads, AV & Robotics, Insurers, Cities & DOTs, Researchers” — Empiric Earth, <https://empiricearth.com/products/atlas> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c039** Empiric Earth pitches filling long-tail gaps in AV training or validation sets with real events rather than generated ones.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Filling long-tail gaps in a training or validation set with real events rather than generated ones” — Empiric Earth, <https://empiricearth.com/industries/av-robotics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Nexar says it provided Waymo with what it called the largest known anonymized naturalistic driving dataset of its kind in the US.  
  _outcome · vendor_stated · as of 2024-11-11 (page_dated)_
  - “providing the largest known anonymized naturalistic driving dataset of its kind in the US” — Empiric Earth, <https://empiricearth.com/insights/paving-the-way-for-safer-roads-how-waymo-and-nexar-are-enhancing-autonomous-vehicle-safety> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Peer-reviewed paper (PMID 39485694, 2024-11-01) by Waymo LLC and Nexar authors confirms Nexar supplied anonymized dashcam data from over 500 million vehicle miles (335 video-verified VRU collisions) for Waymo's research. It does not confirm 'largest known ... of its kind'; that superlative remains Nexar's own. The publisher page (tandfonline.com) returned 403; reached via the Nexar blog's link and Europe PMC's API.
    - “video and sensor data (Global Positioning System and accelerometer) from vehicles equipped with Nexar dash cameras” — Europe PMC (record of Campolettano et al., Traffic Injury Prevention 25(sup1), 2024), <https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1080/15389588.2024.2364050&resultType=core&format=json> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is from the Nexar blog post dated 2024-11-11 and the statement keeps the superlative as Nexar's own. The underlying Waymo/Nexar paper (Traffic Injury Prevention, 2024-11-01) confirms the data use but not the superlative.

### regulation

- **c018** Nexar's consumer terms are governed by New York law.  
  _terms · legal_text · as of 2026-02-12 (page_dated)_
  - “governed and construed in accordance with the laws of the State of New York” — Nexar, <https://www.getnexar.com/terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Nexar's privacy policy says its training data, drawn from in-cabin and road-facing cameras, includes non-anonymized content.  
  _terms · legal_text · as of 2025-09 (page_dated) · scope: Nexar consumer dashcams_
  - “Despite the inclusion of non-anonymized content, we uphold the highest standards of data security” — Nexar, <https://www.getnexar.com/privacy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **v002** A 2024 peer-reviewed paper by Waymo and Nexar authors (Traffic Injury Prevention) used anonymized Nexar dashcam data from over 500 million vehicle miles, with 335 video-verified collisions involving vulnerable road users.  
  _outcome · academic · as of 2024-11-01 (publication) · scope: Nexar driving data, US_
  - “From over 500 million vehicle miles traveled, a total of 335 collision events involving VRUs were video verified” — Europe PMC (Campolettano et al., Traffic Injury Prevention 25(sup1):S94-S104), <https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1080/15389588.2024.2364050&resultType=core&format=json> · academic · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.licence_model` — not_published; tried <https://empiricearth.com/legal>, <https://empiricearth.com/legal/terms>, <https://empiricearth.com/legal/solution-terms>, <https://www.getnexar.com/terms/>, <https://empiricearth.com/products/atlas>
- `matrix.exclusivity_offered` — not_published; tried <https://empiricearth.com/legal>, <https://empiricearth.com/legal/terms>, <https://empiricearth.com/legal/solution-terms>, <https://www.getnexar.com/terms/>, <https://empiricearth.com/products/atlas>
- `matrix.public_listing` — not_published; tried <https://empiricearth.com/products/atlas>, <https://empiricearth.com/world-intelligence>, <https://empiricearth.com/sitemap.xml>
- `matrix.buyer_vetting` — not_published; tried <https://empiricearth.com/products/atlas>, <https://empiricearth.com/contact>, <https://empiricearth.com/legal>
- `matrix.versioning` — not_published; tried <https://empiricearth.com/products/atlas>, <https://empiricearth.com/insights/empiric-earth-training-data-explainer>
- `matrix.human_subject_consent_docs` — js_empty; tried <https://empiricearth.com/privacy/commitments>, <https://empiricearth.com/privacy/de-identification>, <https://empiricearth.com/legal/terms>
- `matrix.erasure_after_sale` — not_published; tried <https://www.getnexar.com/privacy/>, <https://empiricearth.com/legal/solution-terms>, <https://empiricearth.com/privacy/commitments>
- `other.data_prices` — not_published; tried <https://empiricearth.com/products/atlas>, <https://empiricearth.com/world-intelligence>, <https://www.nexar-ai.com/>, <https://empiricearth.com/products/vedr-pricing>
- `other.privacy_commitments_text` — js_empty; tried <https://empiricearth.com/privacy/commitments>, <https://empiricearth.com/privacy/de-identification>, <https://empiricearth.com/privacy/drivers>, <https://empiricearth.com/press-releases/ten-privacy-commitments>
- `other.contact_form_options` — js_empty; tried <https://empiricearth.com/contact>
- `other.solution_terms_data_rights` — not_found; tried <https://empiricearth.com/legal/solution-terms>
- `other.independent_press_2025_2026` — not_found; tried <https://techcrunch.com/tag/nexar/>, <https://www.courtlistener.com/api/rest/v4/search/?q=%22Nexar%20Inc%22>, <https://www.courtlistener.com/?q=%22Nexar%22+dashcam>

## Leads, not cited

- <https://arxiv.org/abs/2503.03848> — Nexar paper on its collision dataset; may describe collection and anonymization.
- <https://techcrunch.com/2021/11/17/nexar-is-building-a-digital-twin-of-cities-using-crowdsourced-dashcam-data/> — Independent 2021 coverage of Nexar's crowdsourced dashcam data business (Series D); no dataset-sale terms.
- <https://www.prnewswire.com/news-releases/nexar-teams-with-nvidia-to-advance-autonomous-vehicle-innovation-302403360.html> — Nexar-NVIDIA data partnership release; not fetched.
- <https://empiricearth.com/privacy/commitments> — Ten privacy commitments; page body did not render for WebFetch (JS).
- <https://empiricearth.com/insights/nexar-acquires-veniam> — Earlier M&A event; not fetched.
- <https://empiricearth.com/insights/stellantis-ventures-announces-strategic-investment-in-nauto> — Nauto investor event; not fetched.
- <https://www.kaggle.com/competitions/nexar-collision-prediction/> — Kaggle competition using the open dataset; competition rules may carry data-use terms.
