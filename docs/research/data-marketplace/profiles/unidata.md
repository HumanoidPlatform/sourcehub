# Unidata

ai_data_catalogue · light · status: **active** · also known as Unidata L.L.C-FZ, UniDataPro, unidata.pro

> Rendered from `ledger/unidata.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Datasets / ready-made datasets ("70+ Datasets")” and its bespoke side “Data Collection Services / custom data collection”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c022, c016, c003 | Unidata sells its own datasets as licensor; no third-party providers are listed. |
| economics_model | principal_margin | c022, c011, c013 | Unidata collects the data itself (crowdsourcing platforms, Prolific) and sells it at its own, unpublished price. |
| who_pays_fee | not_applicable |  | No marketplace fee: Unidata sells only its own inventory. |
| supply_models | own_collection | c011, c012, c013, c014, c049 | Only own collection is evidenced; whether bespoke client collections are relisted is not stated. |
| custody_model | copy_to_buyer | c017, c030 | Datasets are held on Unidata's AWS storage and 'delivered' to the buyer after signing; delivery channel not named. |
| transaction_mode | contact_sales | c016, c017, c018 |  |
| public_prices | none | c010, c018 | No dataset prices on catalogue or listings; blog cost figures are generic market estimates. |
| licence_model | mixed | c022, c023, c024 | Free samples under CC BY-NC-ND 4.0; full datasets under a commercial licence signed per deal whose text is not published. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c008, c009, c010 |  |
| buyer_vetting | unknown |  |  |
| sample_mechanics | free_sample_download | c032, c033, c022 |  |
| versioning | unknown |  |  |
| human_subject_consent_docs | asserted_only | c025, c026, c027 | Releases and GDPR compliance are asserted on public pages; no evidence buyers receive release documents. Purchase contract not seen. |
| contributor_pay_model | unknown |  | Contributors come via crowdsourcing platforms and Prolific; how they are paid is not published. |
| catalogue_plus_custom | both | c035, c039, c002 |  |
| erasure_after_sale | unknown |  | Buyer licence not published; privacy policy covers only Unidata's own retention. |
| quality_evidence | unknown |  | Unidata is both operator and supplier; no independent or operator-verification statement on listings. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Unidata sells mainly biometric/anti-spoofing and robotics data to corporate clients (it claims 200+); its blog pitches buying for speed. Units and volumes bought are not published. | c006, c007, c044, c045 |
| Q2 | partial | Unidata builds its own catalogue and also pushes free samples to Hugging Face; it runs no listing programme for other providers. | c035, c015, c033 |
| Q3 | partial | Inventory is Unidata's own collection via crowdsourcing platforms, Prolific and paid capture teams; rights come from participant releases per Unidata. | c011, c012, c013, c014, c025 |
| Q4 | unknown | Unidata does not say whether client-commissioned collections are later sold from the catalogue. |  |
| Q5 | partial | Unidata L.L.C-FZ (Dubai) sells its own datasets under signed documents; who warrants consent and indemnifies in the contract is not published. | c003, c016, c022 |
| Q6 | partial | Datasets sit on Unidata's AWS storage and are delivered to the buyer within 3-10 days after signing and payment. | c030, c017, c031 |
| Q7 | partial | For egocentric video Unidata says every participant signs a commercial-use release; elsewhere it asserts GDPR compliance. A children's selfie set exists with no consent statement on its card. | c025, c026, c027, c028, c029 |
| Q8 | partial | Samples are CC BY-NC-ND 4.0 and have been relisted by GTS.ai; full-dataset licence terms (exclusivity, audit, deletion) are not published. | c023, c022, c036, c048 |
| Q9 | sourced | Contact-sales only: request, document signing, payment, delivery; Unidata owns the inventory and sets unpublished prices. | c016, c017, c018, c010 |
| Q10 | partial | A listing is a dataset page with headline stats, format and FAQ; revisions, orders and entitlements are not described. | c008, c009, c034 |
| Q11 | partial | Buyers see listing statistics and can download a free sample (Google Drive, Hugging Face preview); trust rests on Unidata's own GDPR and ISO statements. | c032, c033, c027, c038 |
| Q12 | sourced | Unidata sells both ready-made 'Datasets' and custom 'Data Collection' services and cross-promotes them on the same pages. | c035, c039, c040, c042 |

## Claims

### positioning

- **c002** Unidata says its dataset catalogue holds more than 70 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **70 datasets (lower bound, '70+')** (vendor-stated count of catalogue datasets; as of retrieval)
  - “70+ Datasets” — Unidata, <https://unidata.pro/datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Datarade's provider profile (text written by Unidata) and the UniDataPro Hugging Face organisation page ('provide 70+ datasets and custom data collection services across 19+ industries') repeat the vendor's figure. For comparison, the Hugging Face API lists 98 public UniDataPro sample datasets, and Datarade shows only 6 priced Unidata products. No independent count of the sellable catalogue exists.
    - “70+ ready-to-use datasets” — Datarade, <https://datarade.ai/data-providers/unidata/profile> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — '70+ Datasets' sits in the ready-made datasets block ('Finance, IT, E-commerce, Retail, Healthcare and 14+ Industries'), so it refers to the catalogue. Note that the Hugging Face organisation lists 98 sample datasets.
- **c003** Unidata's privacy policy names the operating entity as Unidata L.L.C-FZ, based in Dubai.  
  _offer · legal_text · as of 2026-01-20 (page_dated)_
  - “Unidata L.L.C-FZ” — Unidata, <https://unidata.pro/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c004** Unidata says it was founded in 2016.  
  _event · vendor_stated · as of 2016 (retrieved_only)_
  - “Founded in 2016” — Unidata, <https://unidata.pro/about-us/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c005** Unidata says it has more than 1,100 labelers and AI experts.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1100 labelers and AI experts (lower bound)** (vendor-stated headcount; as of retrieval)
  - “1,100+ Labelers & AI Experts” — Unidata, <https://unidata.pro/about-us/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c007** Unidata's iBeta dataset category positions its catalogue around iBeta certification, anti-spoofing and facial recognition.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “High-quality ML datasets for iBeta certification, anti-spoofing, and facial recognition.” — Unidata, <https://unidata.pro/datasets/dataset-type/ibeta/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c011** Unidata's Selfie with ID listing says the data was collected via crowdsourcing platforms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Selfie with ID Dataset_
  - “Data was collected via crowdsourcing platforms.” — Unidata, <https://unidata.pro/datasets/selfie-with-id/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Unidata's Datarade listing for the same product (69,435 images of 4,629 people from 85 countries; $10,000 one-off) repeats the crowdsourcing statement. It is vendor-authored. Independent support that Unidata collects through a crowdsourcing platform in general (not this dataset specifically) comes from Prolific's case study; see unidata-c013. The Datarade profile words it as 'in-house production and managed crowdsourcing'.
    - “crowdsourcing platforms using a wide range of consumer smartphones” — Datarade, <https://datarade.ai/data-products/selfie-with-id-dataset-69-435-images-for-re-identification-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is under 'Technical Characteristics' of the Selfie with ID listing: 'Source and collection methodology: Data was collected via crowdsourcing platforms.'
- **c012** Unidata's Hugging Face card for its face anti-spoofing sample says the underlying collection was produced through crowdsourcing platforms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The underlying collection was produced through crowdsourcing platforms.” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing> · docs · retrieved 2026-10-01 · quote check: exact
- **c013** Unidata's datasets page says data is collected on the Prolific platform.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data is collected on the Prolific platform, which offers a diverse pool of participants” — Unidata, <https://unidata.pro/datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Found through prolific.com/sitemap.xml. Prolific's customer story (George Denison, 16 Dec 2025) quotes Alexander Voytovich, account executive manager at Unidata: 'Prolific has become our main tool for international data collection projects'. It describes the work as 'audio and images to video and text' and does not name any dataset, so it confirms that Unidata collects on Prolific, not that a given catalogue dataset came from there. It is a partner's marketing piece, so not a neutral audit.
    - “Unidata chose Prolific after carefully evaluating partners” — Prolific, <https://www.prolific.com/resources/how-unidata-made-human-data-collection-for-ai-easy-fast-and-global> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is under the /datasets/ heading 'Trusted Data Collection' and goes on '...allows customizations by gender, age, location, or professional background, while ensuring participant consent ... aligns precisely with client requirements'. It is a general statement about how Unidata collects, leaning to client projects; it is not tied to any one catalogue dataset. It supports own_collection via a crowd platform and says nothing more specific.
- **c014** Unidata's egocentric collection page says its egocentric recordings come from hundreds of contributors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Mixed age and gender across hundreds of contributors.” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c015** Unidata's 'become a partner' page invites partners to distribute Unidata's solutions and does not describe any programme for third parties to list datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Grow your business by distributing our cutting-edge solutions” — Unidata, <https://unidata.pro/become-a-partner/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c049** Unidata's case study on a child and teen facial dataset says it used established crowd platforms and tested new sources.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Leveraged established crowd platforms and tested new sources to expand geographic coverage” — Unidata, <https://unidata.pro/cases/child-teen-facial-dataset-for-recognition-systems/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c008** Unidata's Anti-Spoofing Real Videos listing states the dataset covers 43,670 people.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Anti-Spoofing Real Videos Dataset_ · **43670 people depicted** (vendor-stated listing statistic for the full dataset; as of retrieval)
  - “43,670” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Unidata's own Datarade listing gives a rounded 43,700 people, with 87,340 videos and selfies from 170 countries, '2 files in a set' (87,340 / 2 = 43,670, consistent with the claim), priced at a $15,000 one-off purchase. The text is vendor-authored; no independent count exists. A GTS.ai relisting of an 'Anti-Spoofing Real' dataset gives older, different figures (44,832 files, 37,980 individuals), which shows the dataset keeps growing and a count is only true as of a date. The unidata.pro page for this product is titled '98,000 Images & Videos', which does not fit 43,670 people at 2 files each; see unidata-c034.
    - “43,700 people” — Datarade, <https://datarade.ai/data-products/anti-spoofing-real-videos-dataset-87-340-files-for-facial-r-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The page is the right product: unidata.pro/datasets/face-anti-spoofing/ has the H1 'Anti-Spoofing Real Videos Dataset'. But the bare quote '43,670' does not show what is counted; the page reads 'People 43,670'. The same page's title says '98,000 Images & Videos', which is inconsistent with it (see c034).
- **c009** Unidata's Egocentric Video Dataset listing states 4,050 hours of video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric Video Dataset_ · **4050 hours of egocentric video** (vendor-stated size of the ready-made dataset; as of retrieval)
  - “4,050 hours” — Unidata, <https://unidata.pro/datasets/egocentric-video/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** Unidata's Hugging Face card states the full face anti-spoofing dataset has 98,000 videos and selfies from 170 countries.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: face-anti-spoofing (Hugging Face card)_ · **98000 videos and selfies** (vendor-stated full-dataset size on the Hugging Face sample card; as of retrieval)
  - “The dataset consists of 98,000 videos and selfies from 170 countries” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **disputed** — The same product is described differently on different pages. The Hugging Face card face-anti-spoofing and the unidata.pro page for it (H1 'Anti-Spoofing Real Videos Dataset', whose title reads '98,000 Images & Videos') say 98,000. Unidata's own Datarade listing of that product says 87,340 videos and selfies, 43,700 people and '2 files in a set'. The unidata.pro page's own 'People 43,670' figure also implies 87,340 files at two per person, not 98,000. The Hugging Face card also gives 179 countries lower down. All of these are vendor-authored, so nothing independent settles the number, but 98,000 is not consistent with the vendor's own people count. No search available.
    - “The dataset contains 87,340 videos and selfies of faces from 170 countries” — Datarade, <https://datarade.ai/data-products/anti-spoofing-real-videos-dataset-87-340-files-for-facial-r-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The card does say 'The dataset consists of 98,000 videos and selfies from 170 countries' and calls itself 'a limited preview of the data', so 98,000 refers to the full dataset. The number is disputed on the evidence (see the blind verdict), and the card elsewhere gives 179 countries.

### trust

- **c032** Unidata's dataset listings offer a 'Download sample' button linking to a free sample.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Download sample” — Unidata, <https://unidata.pro/datasets/selfie-with-id/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** Unidata's Hugging Face sample cards describe themselves as a limited preview of the full dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This is a limited preview of the data.” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** Unidata's quality control department says it validates the previous or current day's data every day.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “validate the data from the previous or current day every day” — Unidata, <https://unidata.pro/quality-control-department/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** Unidata advertises AWS ISO 27001/27701 certification.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “AWS ISO 27001/27701” — Unidata, <https://unidata.pro/about-us/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c016** Unidata's listing FAQ says a purchase starts with a request, after which Unidata reviews details and completes documents with the buyer.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Once you submit a request, we will reach out to review the details and complete the necessary documents” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's own description of its purchase flow. Nothing independent describes it beyond a Datarade buyer review (IdentifAI Labs) calling the procurement process 'seamless thanks to their customer service'. Datarade itself routes Unidata listings through its request flow, with 'One-off purchase' prices shown.
  - verifier (scope): **scope_ok** — The quote matches the FAQ: 'Once you submit a request, we will reach out to review the details and complete the necessary documents.'
- **c017** Unidata's listing FAQ says the dataset is delivered within 3 to 10 days after signing and payment.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “After signing and payment, the dataset will be delivered within 3-10 days” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A delivery term in Unidata's own FAQ. Unidata's Datarade listings give no delivery time, only the delivery method 'S3 Bucket' and frequency 'on-demand' (egocentric listing).
  - verifier (scope): **scope_ok** — The FAQ on the Anti-Spoofing Real Videos page reads 'After signing and payment, the dataset will be delivered within 3-10 days'. It is quoted from one listing's FAQ; the statement's generic wording ('the dataset') fits that FAQ.
- **c019** Unidata's Selfie with ID listing says 87% of datasets are delivered in 3 to 10 days.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **87 percent of datasets delivered within 3-10 days** (vendor-stated delivery performance; not stated)
  - “87% of datasets delivered in 3–10 days” — Unidata, <https://unidata.pro/datasets/selfie-with-id/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An internal delivery-performance statistic that only Unidata could publish; it is also on the vendor's datasets page ('87% of datasets delivered in 3-10 days'). Unidata's Datarade listing for Selfie with ID does not repeat it and states no delivery time. Datarade buyer reviews speak of delivery only qualitatively (Fermatix AI: 'Everything was delivered as agreed and fully within scope'). Untested outcome claim.
  - verifier (scope): **scope_ok** — The statement correctly says the listing claims this about 'datasets' in general. The phrase sits in a site-wide 'Why Companies Trust Unidata's Datasets' strip that is also on /datasets/. It is not a Selfie with ID delivery term, and should not be read as one.

### pricing

- **c010** Unidata's dataset listings carry a 'Commercial' label and no price; the catalogue page displays no prices.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Commercial” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** Unidata's Hugging Face samples direct readers to contact Unidata to discuss requirements and pricing for the full dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “To access the full dataset, please contact us at https://unidata.pro to discuss your requirements and pricing options.” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing> · docs · retrieved 2026-10-01 · quote check: exact
- **c020** Unidata's become-a-partner page offers startups a 15% discount on all projects.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: startup partners_ · **15 percent discount** (discount off Unidata's price for startups in its partner programme; list price not stated; not stated)
  - “15% discount on all projects” — Unidata, <https://unidata.pro/become-a-partner/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c022** Unidata's listing FAQ describes a dual licensing model: free evaluation samples, and the full dataset only by purchase.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “evaluation samples are provided for free, while the full dataset is accessible only by purchase” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Same model restated by Unidata on another domain: Hugging Face cards are free previews, and the full data is sold separately. On Datarade, Unidata's listings offer only 'One-off purchase' (e.g. $15,000 for Anti-Spoofing Real Videos; monthly, yearly and usage-based licences 'Not available'), with the profile saying datasets run 'from $1,000 / purchase to $30,000 / purchase'. That the FAQ calls it 'dual licensing' is vendor wording only.
    - “This is a limited preview of the data. To access the full dataset, please contact us” — Unidata (on Hugging Face), <https://huggingface.co/datasets/UniDataPro/egocentric-video> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The FAQ on the Anti-Spoofing Real Videos page begins 'Unidata datasets follow a dual licensing model', so it is a general statement, not specific to one listing.
- **c023** Unidata publishes its Hugging Face dataset samples under the CC BY-NC-ND 4.0 licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face sample (face-anti-spoofing), free sample_
  - “cc-by-nc-nd-4.0” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: Unidata publishes most of its Hugging Face samples (93 of 98 on 2026-10-01) under CC BY-NC-ND 4.0, but five, including the egocentric-video sample, are under CC BY-ND 4.0, which does not forbid commercial use. — Counted from the Hugging Face API (huggingface.co/api/datasets?author=UniDataPro&full=true, fetched 2026-10-01): 93 datasets tagged license:cc-by-nc-nd-4.0 and 5 tagged license:cc-by-nd-4.0 (medical-masks-image-dataset, men-hair-loss-dataset, poland-license-plate-dataset, age-difference-dataset, egocentric-video). This is the owner's own licence metadata on a host platform, not an independent source class, and the orchestrator should read it as such. It is also the same domain as the likely original source. The face datasets named in this ledger (Selfie-with-ID, face-anti-spoofing, latex-mask-attack, kids-and-teens-selfie-dataset) are all CC BY-NC-ND 4.0.
    - “cc-by-nd-4.0” — Unidata (on Hugging Face), <https://huggingface.co/datasets/UniDataPro/egocentric-video> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_wrong** — The claim's scope names one card (face-anti-spoofing), which is CC BY-NC-ND 4.0, but the statement generalises to all of Unidata's Hugging Face samples. On 2026-10-01 the Hugging Face API showed 93 of 98 UniDataPro datasets tagged cc-by-nc-nd-4.0 and 5 tagged cc-by-nd-4.0, including egocentric-video, which does not bar commercial use. The matrix note for licence_model ('Free samples under CC BY-NC-ND 4.0') inherits the overgeneralisation.
- **c024** Unidata's egocentric collection page says its base egocentric dataset is available under a commercial license.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The base dataset is available under a commercial license” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### custody

- **c030** Unidata says it stores all datasets on AWS's cloud platform.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Unidata secures all datasets within AWS's cloud platform” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · docs · retrieved 2026-10-01 · quote check: exact
- **c031** Unidata's standard delivery for egocentric collection includes .mp4 video, .rrd files, .json metadata and pose keypoint files.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Standard delivery includes .mp4 video, .rrd (Rerun) for visualization, .json metadata and annotation files” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c025** Unidata says every participant in its egocentric recordings signs a commercial-use release before recording.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: egocentric video_
  - “Every participant signs a commercial-use release before recording.” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's assertion about its own consent process. No release form or participant-facing text could be reached. The only other-domain wording is Unidata's own Datarade egocentric listing, which says less: 'All recordings were collected under informed consent from participants. The dataset complies with GDPR'. It mentions no commercial-use release. The Hugging Face egocentric card says nothing about consent. Prolific's Unidata case study does not mention consent or releases.
  - verifier (scope): **scope_ok** — The quote is in the FAQ of the egocentric collection page: 'Every participant signs a commercial-use release before recording. Faces, voices, and home interiors are cleared for use'. It is a vendor assertion with nothing about giving releases to buyers, which fits human_subject_consent_docs = asserted_only. Unidata's own Datarade egocentric listing says only 'informed consent'.
- **c026** Unidata says every egocentric recording is consented and licensed for commercial use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every recording is consented and licensed for commercial use.” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c027** Unidata's listing FAQ asserts that each dataset follows GDPR guidelines and applicable data-protection laws.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each dataset follows GDPR guidelines and complies with applicable data protection laws.” — Unidata, <https://unidata.pro/datasets/face-anti-spoofing/> · docs · retrieved 2026-10-01 · quote check: exact
- **c028** Unidata's Hugging Face sample card describes a dataset of 6,000 facial images of 300 children and teenagers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kids and Teens Selfie Dataset_ · **300 people depicted (children and teenagers)** (vendor-stated size of the full Kids and Teens Selfie dataset; as of retrieval)
  - “6,000 high-quality facial images from 300 people (children and teenagers)” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/kids-and-teens-selfie-dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No relisting of the Kids and Teens Selfie dataset was found: it is not among Unidata's Datarade products (Datarade product search for it returns none), and the GTS.ai dataset sitemap has no kids or teens selfie page. The only source is Unidata's own Hugging Face card (UniDataPro/kids-and-teens-selfie-dataset, CC BY-NC-ND 4.0, last modified 2026-08-20), which is the claim's own source class. No search available.
  - verifier (scope): **scope_ok** — The quote matches the card: 'The dataset consists of 6,000 high-quality facial images from 300 people (children and teenagers)'. The card calls itself a limited preview, so this is the full dataset. The card makes no parental or guardian consent statement.
- **c029** The same Kids and Teens Selfie sample card gives the subjects' age range as 5 to 15 years old.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kids and Teens Selfie Dataset_
  - “from 5 to 15 years old” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/datasets/UniDataPro/kids-and-teens-selfie-dataset> · docs · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c036** GTS.ai relists Unidata's Latex Mask Attack sample on its own site and credits Kaggle as the source.  
  _outcome · independent · as of 2026-10-01 (retrieved_only)_
  - “This dataset is sourced from Kaggle” — GTS.ai, <https://gts.ai/dataset-download/latex-mask-attack-11100-videos/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Found through gts.ai/dataset-download-sitemap.xml. The GTS page links the source as kaggle.com/datasets/unidatapro/latex-mask-attack, names no licence, and describes '11,100+ video recordings' (the full dataset's size, though what Kaggle carries is Unidata's sample). GTS relists other Unidata attack datasets the same way (silicone masks, 2D masks with eyeholes, printed 3D masks).
    - “This dataset is sourced from Kaggle” — GTS.ai (Globose Technology Solutions Pvt Ltd), <https://gts.ai/dataset-download/latex-mask-attack-11100-videos/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote 'This dataset is sourced from Kaggle' shows the Kaggle credit but not that the dataset is Unidata's. That link is only in the page's source link, kaggle.com/datasets/unidatapro/latex-mask-attack, not in the visible text. The GTS page also describes '11,100+ video recordings', the full dataset's size, while what Kaggle carries is Unidata's sample; 'relists the sample' is an inference.
- **c048** Unidata's privacy policy says personal information is deleted after the applicable retention periods; it does not address copies already delivered to buyers.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “After expiry of the applicable retention periods, your personal information will be deleted.” — Unidata, <https://unidata.pro/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c021** Unidata's datasets page claims its custom collection is up to 70% cheaper than doing it in-house.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **70 percent cheaper (upper bound)** (vendor claim comparing its custom collection with in-house cost; no base price stated; not stated)
  - “Up to 70% cheaper than in-house” — Unidata, <https://unidata.pro/datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Marketing comparison with no stated basis; exists only on unidata.pro/datasets ('Up to 70% cheaper than in-house'). Neither Unidata's Datarade profile nor Prolific's Unidata case study repeats it. One Datarade buyer review (IdentifAI Labs) says the opposite in tone: 'Although the investment was significant'. Untested.
  - verifier (scope): **scope_ok** — The context is 'Custom Dataset Solutions: No manual collection needed from your side; we handle everything. Up to 70% cheaper than in-house', so it is about custom collection, as stated.
- **c035** Unidata's Hugging Face organisation says it provides 70+ datasets and custom data collection services.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We provide 70+ datasets and custom data collection services across 19+ industries.” — Unidata (UniDataPro on Hugging Face), <https://huggingface.co/UniDataPro> · docs · retrieved 2026-10-01 · quote check: exact
- **c039** Unidata's catalogue page pitches custom dataset collection in which Unidata handles all collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “No manual collection needed from your side; we handle everything” — Unidata, <https://unidata.pro/datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c040** Unidata's robotics page offers custom collection of training data from the client's own equipment.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We collect training data from your equipment” — Unidata, <https://unidata.pro/robotics-training-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c041** Unidata's egocentric collection page says most custom projects start delivering within two weeks.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Most projects start delivering within two weeks.” — Unidata, <https://unidata.pro/data-collection/egocentric-video-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Unidata describes a custom egocentric collection project for an unnamed humanoid robot developer.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The client, a humanoid robot developer, needed training data that captures real first-person human” — Unidata, <https://unidata.pro/cases/egocentric-data-collection-for-humanoid-robot-training/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** Unidata describes a tailored iBeta Level 1 dataset built for a client with 50 actors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A tailored Level 1 dataset with 50 actors across a wide ethnic range” — Unidata, <https://unidata.pro/cases/ethnic-coverage-expansion-for-ibeta-level-1-certification/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Unidata's blog published a new post dated 28 September 2026, showing the organisation still operating.  
  _status · vendor_stated · as of 2026-09-28 (page_dated)_
  - “Robot Training Data: A Practical Guide to Collection, Annotation, and Pipelines” — Unidata, <https://unidata.pro/blog/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.11
  - verifier (blind): **vendor_only** — That a blog post is dated 28 Sep 2026 exists only on unidata.pro (blog index re-fetched 2026-10-01: newest post 'What Is the Open X-Embodiment Dataset?' dated 28.09.2026). Other-domain signals of operation are owner-authored: the Hugging Face API lists 98 UniDataPro datasets, newest lastModified 2026-09-15; Datarade shows a live Unidata provider profile with priced listings. No independent corporate event (funding, layoffs, acquisition) could be looked for: no search available; EDGAR full-text search for 'unidata.pro' and 'Unidata L.L.C' returns 0 hits; the Meydan Free Zone register (Unidata L.L.C-FZ, Dubai) was not reachable by navigation; LinkedIn needs login.
  - verifier (scope): **scope_wrong** — The fact is right but the cited quote is not. The quote 'Robot Training Data: A Practical Guide to Collection, Annotation, and Pipelines' does not appear anywhere in unidata.pro/blog/ as fetched and downloaded on 2026-10-01. The post dated 28.09.2026 (time datetime 2026-09-28) is 'What Is the Open X-Embodiment Dataset?' (/blog/open-x-embodiment-dataset-guide/). Even if that title had been on the page, it carries no date, so it could not show a 28 September post. A working quote would be the post title plus '28.09.2026'.
- **c046** In a post dated 24 July 2026 Unidata says it has captured 10,255 hours of egocentric data to date.  
  _number · vendor_stated · as of 2026-07-24 (page_dated)_ · **10255 hours of egocentric video captured** (vendor-stated cumulative capture, catalogue and custom combined; cumulative to 2026-07-24)
  - “38,457 scenarios, 10,255 hours captured to date” — Unidata, <https://unidata.pro/blog/best-egocentric-data-providers-for-robotics/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent figure for total egocentric hours captured could be reached (no search available; press coverage of the Dubai egocentric launch not findable by navigation). The only other-domain figures are owner-authored and describe the listed product, not the running total: Datarade's 'Egocentric Video Dataset' listing and the Hugging Face card UniDataPro/egocentric-video both say 4,050 hours ($30,000 one-off on Datarade). The Datarade URL slug still reads '239-3-hours', so the listed size has grown over time. These do not contradict 10,255 hours captured to date, but nothing outside Unidata supports it.
  - verifier (scope): **scope_ok** — The post shows '24 July, 2026'. The figure '38,457 scenarios, 10,255 hours captured to date' sits in Unidata's own 'Notable Scale' row of a comparison table of egocentric providers that Unidata wrote. It is the running capture total, not the 4,050-hour catalogue product (c009).

### demand

- **c006** Unidata says it has more than 200 corporate clients.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **200 corporate clients (lower bound)** (vendor-stated client count, all services not only datasets; as of retrieval)
  - “200+ Corporate Clients” — Unidata, <https://unidata.pro/about-us/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c044** Unidata's blog argues that buying a dataset lets teams start training in days instead of months.  
  _offer · vendor_stated · as of 2026-06-03 (page_dated)_
  - “Buying lets teams start training in days instead of months” — Unidata, <https://unidata.pro/blog/build-or-buy-ml-dataset/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** Unidata's blog estimates, as a general market figure and not a Unidata price, that buying a dataset costs $50k to $400k.  
  _number · vendor_stated · as of 2026-06-03 (page_dated)_ · **50000 USD per dataset (low end of a 50,000-400,000 range)** (Unidata blog's generic estimate of what buyers pay to license a dataset; not a Unidata list price; one-off)
  - “$50k–$400k depending on volume, industry and licensing” — Unidata, <https://unidata.pro/blog/build-or-buy-ml-dataset/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c047** Unidata's privacy policy covers personal information contained in files and data that customers or service providers give Unidata.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “personal information contained in the digital files, data, and machine learning models” — Unidata, <https://unidata.pro/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Unidata lists its datasets on Datarade, a third-party data marketplace, where the profile states a price range of $1,000 to $30,000 per one-off purchase.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Unidata provider profile on Datarade_ · **30000 USD per dataset purchase (upper end; lower end 1,000)** (buyer pays; one-off licence purchase; listing prices set by Unidata; one-off)
  - “Unidata's APIs and datasets range in cost from $1,000 / purchase to $30,000 / purchase” — Datarade, <https://datarade.ai/data-providers/unidata/profile> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v002** On Datarade, Unidata's Anti-Spoofing Real Videos Dataset is priced at $15,000 as a one-off purchase, with monthly and yearly licences not available.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Anti-Spoofing Real Videos Dataset (Datarade listing)_ · **15000 USD** (buyer pays; one-off purchase of the full dataset; price set by Unidata; one-off)
  - “One-off purchase $15,000 / purchase” — Datarade, <https://datarade.ai/data-products/anti-spoofing-real-videos-dataset-87-340-files-for-facial-r-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v003** On Datarade, Unidata's Egocentric Video Dataset (4,050 hours) is priced at $30,000 as a one-off purchase and delivered by S3 bucket.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Egocentric Video Dataset (Datarade listing)_ · **30000 USD** (buyer pays; one-off purchase; price set by Unidata; one-off)
  - “$30,000 / purchase” — Datarade, <https://datarade.ai/data-products/egocentric-video-dataset-239-3-hours-for-egocentric-action-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - “S3 Bucket” — Datarade, <https://datarade.ai/data-products/egocentric-video-dataset-239-3-hours-for-egocentric-action-unidata> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v004** Datarade's review section for Unidata carries a review from a DFRobot buyer who says it purchased a dataset of 50,000 licence plates.  
  _outcome · independent · as of 2026-10-01 (retrieved_only) · scope: Datarade buyer reviews_
  - “We purchased a dataset of 50,000 license plates from around the world” — Datarade, <https://datarade.ai/data-providers/unidata/profile> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v005** Datarade's review section for Unidata lists a reviewer from Shaip, itself an AI training-data vendor, so at least one of Unidata's buyers is a competing data supplier.  
  _outcome · independent · as of 2026-10-01 (retrieved_only) · scope: Datarade buyer reviews_
  - “A. N. Shaip” — Datarade, <https://datarade.ai/data-providers/unidata/profile> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - “Collect, annotate, license, and evaluate multimodal data” — Shaip, <https://www.shaip.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v006** Prolific's customer story on Unidata (16 December 2025) quotes a Unidata manager saying Prolific has become Unidata's main tool for international data collection.  
  _outcome · independent · as of 2025-12-16 (publication)_
  - “Prolific has become our main tool for international data collection projects” — Prolific, <https://www.prolific.com/resources/how-unidata-made-human-data-collection-for-ai-easy-fast-and-global> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://unidata.pro/datasets/face-anti-spoofing/>, <https://unidata.pro/datasets/egocentric-video/>, <https://unidata.pro/data-collection/egocentric-video-data/>, <https://unidata.pro/data-collection/>, <https://unidata.pro/terms/>
- `matrix.buyer_vetting` — not_published; tried <https://unidata.pro/datasets/face-anti-spoofing/>, <https://unidata.pro/datasets/selfie-with-id/>, <https://unidata.pro/terms/>
- `matrix.versioning` — not_published; tried <https://unidata.pro/datasets/face-anti-spoofing/>, <https://unidata.pro/datasets/egocentric-video/>, <https://huggingface.co/datasets/UniDataPro/face-anti-spoofing>
- `matrix.contributor_pay_model` — not_published; tried <https://unidata.pro/data-collection/>, <https://unidata.pro/data-collection/egocentric-video-data/>, <https://unidata.pro/cases/child-teen-facial-dataset-for-recognition-systems/>, <https://unidata.pro/datasets/>
- `matrix.erasure_after_sale` — not_published; tried <https://unidata.pro/privacy-policy/>, <https://unidata.pro/terms/>
- `matrix.quality_evidence` — not_published; tried <https://unidata.pro/quality-control-department/>, <https://unidata.pro/datasets/face-anti-spoofing/>, <https://unidata.pro/datasets/dataset-type/ibeta/>
- `questions.Q4` — not_published; tried <https://unidata.pro/data-collection/>, <https://unidata.pro/cases/egocentric-data-collection-for-humanoid-robot-training/>, <https://unidata.pro/cases/ethnic-coverage-expansion-for-ibeta-level-1-certification/>, <https://unidata.pro/cases/child-teen-facial-dataset-for-recognition-systems/>
- `other.buyer_licence_text` — not_published; tried <https://unidata.pro/terms/>, <https://unidata.pro/privacy-policy/>, <https://unidata.pro/datasets/face-anti-spoofing/>
- `other.egocentric_launch_2026_07_03` — not_found; tried <https://unidata.pro/blog/>, <https://unidata.pro/blog/page/2/>, <https://unidata.pro/data-collection/egocentric-video-data/>, <https://unidata.pro/robotics-training-data/>, <https://unidata.pro/cases/egocentric-data-collection-for-humanoid-robot-training/>, <https://unidata.pro/post-sitemap.xml>, <https://unidata.pro/cases-sitemap.xml>
- `other.kaggle_samples` — not_found; tried <https://www.kaggle.com/organizations/unidatapro>, <https://www.kaggle.com/datasets/unidatapro/latex-mask-attack>

## Conflicts

- c008, c034: The unidata.pro face anti-spoofing listing (43,670 people, 87,340 files, 179 countries) and the Hugging Face card (98,000 videos and selfies, 170 countries) give different sizes; they may describe different versions of the dataset. (unresolved)

## Leads, not cited

- <https://www.linkedin.com/company/unidatapro/> — Likely carries the 2026-07-03 Dubai egocentric capture launch announcement; not fetchable without login.
- <https://gts.ai/dataset-download/printed-3d-mask-attack-3500-videos/> — Other GTS relistings that appear to be Unidata samples; not checked individually.
- <https://unidata.pro/cases/fabric-mask-dataset-for-biometric-testing/> — A client fabric-mask case exists alongside a 'fabric-masks-dataset' sample on Hugging Face; could show commissioned work being relisted (Q4), but neither page says so. Fetched; not cited.
- <https://unidata.pro/cases/real-world-data-for-a-synthetic-trained-pad-model/> — Client got a 32,000+ video iBeta Level 2 dataset; the page does not say whether it came from the catalogue. Fetched; not cited.
