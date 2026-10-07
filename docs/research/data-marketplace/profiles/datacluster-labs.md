# DataCluster Labs

ai_data_catalogue · light · status: **active** · also known as DataCluster Labs Pvt Ltd, DC Labs, Dailydata

> Rendered from `ledger/datacluster-labs.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Datasets: 'Off-the-shelf, ready on Kaggle' (products page); free sample datasets vs full datasets for commercial licensing” and its bespoke side “Data Collection via its 'managed crowd-sourcing platform - Dailydata'; 'Need a custom dataset? Let's talk.'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c013, c034, c035 | DataCluster Labs owns the images and is itself the licensor; no third-party sellers were found. |
| economics_model | principal_margin | c013, c011, c034 | Owns crowd-captured inventory and licenses it at its own (unpublished) price. |
| who_pays_fee | not_applicable |  | Single-vendor catalogue; there is no marketplace fee between buyer and a separate seller. |
| supply_models | own_collection | c011, c013, c014, c015 | Crowd captures through its own Dailydata platform, exclusively owned. No evidence of third-party or commissioned-then-resold inventory. |
| custody_model | unknown |  | Samples are hosted on Hugging Face/Kaggle; how full datasets are delivered is not published. |
| transaction_mode | contact_sales | c033, c024, c034 |  |
| public_prices | none | c033, c034 | No price found on the website, brochure, one-pager or any dataset card fetched. |
| licence_model | unknown |  | Samples carry mixed licences (own restricted licence, CC BY-NC-ND, CC BY, CC0 on Kaggle); the terms of the full-dataset commercial licence are not published. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c025, c007, c026 |  |
| buyer_vetting | unknown |  |  |
| sample_mechanics | free_sample_download | c025, c026 |  |
| versioning | unknown |  | The Number Plates card promises 'Ongoing' updates for full-dataset licensees [c027] but nothing on revisions or what a past buyer keeps. |
| human_subject_consent_docs | not_addressed | c043 | No public page or dataset card fetched mentions consent or releases; the full-dataset licence is not public. |
| contributor_pay_model | unknown |  | The Dailydata contributor app listing is gone (Play Store 404); no pay terms found. |
| catalogue_plus_custom | both | c020, c021, c022, c023 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c030, c031 | Operator is also the producer; quality statements are its own, with no independent check found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Only vendor signals: a client-logo section ('Trusted by leaders, universities & startups') and Kaggle sample downloads it puts at 89,000+ (brochure) or 40,000 (one-pager); units are datasets of thousands of images. No buyer volumes or reasons published. | c010, c008, c009 |
| Q2 | partial | It does not sell through a marketplace: it posts free samples on Kaggle, Hugging Face and Roboflow for discovery and routes every full-dataset or custom request to its own sales email. | c007, c025, c024, c023 |
| Q3 | sourced | Inventory is its own crowd captures via its Dailydata platform (100,000+ contributors claimed), stated as exclusively owned and not scraped; some catalogue datasets date from 2020-2022 captures. | c011, c005, c013, c014, c015, c017, c019 |
| Q4 | unknown |  |  |
| Q5 | partial | DataCluster Labs owns the images and licenses them itself; no warranty, consent or indemnity terms are public. | c013, c034 |
| Q6 | unknown |  |  |
| Q7 | partial | Public cards say nothing on consent from capturers, people shown or property owners; the company sells PII scrubbing as a cleaning service. | c043, c032 |
| Q8 | partial | Samples carry restrictive licences (no redistribution, no commercial training) but the same sample is CC BY-NC-ND on Hugging Face and CC0 on Kaggle; full-dataset terms are unpublished beyond 'commercial-friendly'. | c036, c037, c038, c039, c040, c042, c041 |
| Q9 | partial | Contact-sales only: buyers email sales for a commercial licence; no prices or checkout found. Commercial model is selling owned inventory. | c033, c034, c035 |
| Q10 | partial | A listing is a free sample subset (about 200 images) of a larger full dataset offered in several annotation formats; full licensees are promised ongoing updates. No order or entitlement model is public. | c026, c028, c027 |
| Q11 | sourced | Free downloadable samples on Hugging Face and Kaggle plus sample requests, with the vendor's own claims of manual review and inter-annotator agreement. | c025, c026, c029, c030, c031 |
| Q12 | sourced | The off-the-shelf side ('Off-the-shelf, ready on Kaggle', datasets) sits beside custom collection fielded to spec through Dailydata; the same sales email handles both. | c020, c021, c022, c012, c024 |

## Claims

### positioning

- **c001** DataCluster Labs' website was live on 2026-10-01, offering real-world image datasets and data services.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Power up your AI with real-world data” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Whether datacluster.ai is live exists only on the vendor's own site; I fetched it on 2026-10-01 and it served the dataset and services pages. Independent corroboration of continuing activity: Kaggle's API lists dataclusterlabs/cad-design-dataset lastUpdated 2026-09-22 and Hugging Face's API gives cad_design_dataset lastModified 2026-09-22 (see c002). No registry or press source could be reached (no search available).
  - verifier (scope): **scope_ok** — The tagline is from the live home page retrieved on the date given. It shows 'real-world data' but not 'image datasets and data services' as such, though the same page lists both.
- **c003** DataCluster Labs' own LinkedIn page gives its company size as 2-10 employees.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **10 employees (upper bound of LinkedIn size band)** (vendor-selected LinkedIn size band 2-10; as of retrieval)
  - “2-10 employees” — DataCluster Labs, <https://in.linkedin.com/company/datacluster-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — LinkedIn's company-size band is chosen by the company itself; fetched https://in.linkedin.com/company/datacluster-labs on 2026-10-01 and it reads '2-10 employees' (founded 2020, Bangalore, 212 followers). No independent headcount source reachable (no search available). Weak corroboration of a very small team: the Hugging Face org lists 1 member.
  - verifier (scope): **scope_ok**
- **c004** DataCluster Labs' own LinkedIn page says it was founded in 2020.  
  _event · vendor_stated · as of 2020 (retrieved_only)_
  - “Founded 2020” — DataCluster Labs, <https://in.linkedin.com/company/datacluster-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c005** DataCluster Labs says it crowdsources data from a network of 100,000+ contributors.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100000 contributors** (vendor-stated lower bound of its contributor network; cumulative)
  - “crowdsourcing and curating high-quality real-world data from a network of 100,000+ contributors” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The 100,000+ contributor figure appears only on the vendor's own pages (datacluster.ai home and brochure, Hugging Face org card). An independent check would be an app-store install count or registry filing for the Dailydata app; neither could be reached without search (no search available; no Dailydata link on the vendor site). Note the tension with c003: a 2-10 person company claiming a 100,000-person crowd.
  - verifier (scope): **scope_ok**
- **c006** DataCluster Labs says its flagship dataset holds 200,000+ images across 250+ classes.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **200000 images** (vendor-stated lower bound, flagship human-captured image dataset; cumulative)
  - “200,000+ images, 250+ classes” — DataCluster Labs, <https://www.datacluster.ai/brochure.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Only vendor pages state 200,000+ images / 250+ classes. The public samples do not add up to it: Kaggle lists 71 sample datasets and Hugging Face 11, each a small subset. No customer, audit or press source reachable (no search available).
  - verifier (scope): **quote_incomplete** — The brochure quote gives the numbers but not the word 'flagship'. That framing comes from the one-pager PDF: 'Our flagship dataset covers over 200,000+ high-resolution unique human-captured images spanning 250+ classes'. The brochure presents the figures as the collection as a whole ('200,000+ unique, human-captured, high-resolution images'), not as one dataset.
- **c011** DataCluster Labs collects data through its own managed crowd-sourcing platform called Dailydata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “managed crowd-sourced data collection and annotation through our Dailydata platform” — DataCluster Labs, <https://huggingface.co/Dataclusterlabspvtltd> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Dailydata is named only on vendor-authored pages (the Hugging Face org card, dataset READMEs, the one-pager PDF and the brochure). An app-store listing or company-registry record showing that DataCluster Labs owns and runs Dailydata ought to exist, but the vendor site links to none and it could not be reached (no search available). The older domain datacluster.in, linked from the GitHub org, returned HTTP 530.
  - verifier (scope): **scope_ok** — 'our Dailydata platform' supports 'its own'. Vendor-authored HF org card.
- **c013** DataCluster Labs states that the images in its Mobile Phone dataset are exclusively owned by DataCluster Labs.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Mobile Phone Dataset, India_
  - “The images are exclusively owned by DataCluster Labs.” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An ownership assertion in the vendor's own dataset card; nothing independent can confirm it. Relevant tension: Kaggle's metadata gives the Mobile Phone sample (dataclusterlabs/mobile-phone-image-dataset) the licence CC BY-NC-ND 4.0, and the Hugging Face copy uses a custom licence named datacluster-commercial-sample.
  - verifier (scope): **scope_ok** — The quote is from the Mobile Phone sample card's licence section. The card gives 600+ cities across India, which supports the region. The Kaggle copy of the same sample is CC BY-NC-ND 4.0.
- **c014** DataCluster Labs says the Mobile Phone dataset is crowdsourced original photography, not downloaded from the internet.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Mobile Phone Dataset, India_
  - “Crowdsourced original photography — not downloaded from the internet” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone> · docs · retrieved 2026-10-01 · quote check: exact
- **c015** DataCluster Labs says its Indian Number Plates dataset was crowdsourced from 4,000+ contributors using mobile phones.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_ · **4000 contributors** (vendor-stated lower bound, contributors to one dataset; 2020-2022 capture)
  - “Real-world mobile phone captures, crowdsourced from 4,000+ contributors” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The '4000+ crowdsource contributors' line appears only in the vendor's own dataset cards (Kaggle description, Hugging Face README), both written by DataCluster Labs, so neither is independent. No independent source reachable (no search available).
  - verifier (scope): **scope_ok**
- **c016** DataCluster Labs says the full Indian Number Plates dataset covers 700+ cities and villages across India.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “700+ cities and villages across urban and rural India” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c017** The Indian Number Plates dataset card gives a capture period of 2020 to 2022 for the images.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “Capture period: 2020–2022” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c018** A DataCluster Labs GitHub dataset README says its images are contributed by the large contributor base on its platform.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “contributed by the large contributor base on our platform” — DataCluster Labs, <https://github.com/datacluster-labs/Cracked-Screen-Image-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c019** DataCluster Labs says its PowerPoint presentation sample was collected through its data collection network, extending beyond photos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “collected through Datacluster Labs' data collection network” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/multi-domain-powerpoint-presentation-dataset> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c027** The Indian Number Plates card says the free sample is a one-time release while the licensed full dataset receives ongoing updates.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “Updates | One-time | Ongoing” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c028** DataCluster Labs offers full datasets in COCO, YOLO, Pascal VOC and TF-Record annotation formats.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “COCO, YOLO, Pascal VOC, TF-Record” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c026** The Indian Number Plates sample on Hugging Face is a free evaluation subset of about 200 images, against 15,000+ in the full dataset.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_ · **15000 images in full dataset** (vendor-stated lower bound; free sample is about 200 images; one-off)
  - “The full dataset (15,000+ annotated images, multiple formats) is available for commercial licensing.” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: The Indian Number Plates sample on Hugging Face is a free evaluation subset that its card describes as about 200 images against 15,000+ in the full dataset, but the repository actually holds 47 images and 47 Pascal VOC XML annotations. — Hugging Face's file-tree API for the images/ folder returns 47 entries, image_0001.jpg to image_0047.jpg (counted 2026-10-01); the repo's full sibling list has 96 files: 47 .jpg, 47 .xml, README.md, .gitattributes. The card's own table says '~200 (subset)'. The 15,000+ full-dataset figure is vendor-stated only.
    - “images/image_0047.jpg” — Hugging Face, <https://huggingface.co/api/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset/tree/main/images> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_wrong** — The quote supports only the full-dataset figure (15,000+). Neither 'free evaluation subset' nor 'about 200 images' is in it. The card's table does say '~200 (subset)', but the repo actually holds 47 images and 47 XML files (HF tree API), so the statement repeats the card's description as if it were the repo's contents. It should read 'the card describes about 200 images; the repo holds 47'.

### discovery

- **c007** DataCluster Labs says it has 65+ ready-to-use datasets published on Kaggle, Hugging Face and Roboflow.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **65 datasets** (vendor-stated count of sample datasets on third-party hubs; cumulative)
  - “65+ ready-to-use, real-world datasets on Kaggle, Hugging Face and Roboflow” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Kaggle's public API lists 71 datasets owned by dataclusterlabs across pages 1-4 (20+20+20+11, counted 2026-10-01 with 71 unique refs; the quote is one page-4 entry, since a count cannot be quoted); Hugging Face's API lists 11 more. So 65+ holds on Kaggle alone. Roboflow Universe returned HTTP 403. Most listings are samples of paid datasets, not complete datasets.
    - “"ref":"dataclusterlabs/cad-design-dataset"” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=4> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (scope): **scope_ok** — The home page says 65+ across Kaggle, HF and Roboflow, while the brochure says '65+ public datasets published on Kaggle'. Kaggle alone lists 71.
- **c025** DataCluster Labs publishes free sample datasets on Hugging Face so buyers can evaluate quality.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Browse our free sample datasets on this page to evaluate our quality.” — DataCluster Labs, <https://huggingface.co/Dataclusterlabspvtltd> · docs · retrieved 2026-10-01 · quote check: exact
- **c029** DataCluster Labs' website offers buyers a 'Request samples' button alongside the public sample datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request samples” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c032** DataCluster Labs lists PII scrubbing as part of its data cleaning service before labelling.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “De-duplication, blur and exposure filtering, PII scrubbing and format normalization” — DataCluster Labs, <https://www.datacluster.ai/products.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** The Indian Number Plates card's Data Collection section describes source, locations, period and ownership but says nothing on consent from contributors, people or vehicle owners shown.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “All images are exclusively owned by DataCluster Labs (not scraped from the internet)” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An absence in the vendor's own card. I read the whole Hugging Face README (raw/main/README.md): its Data Collection bullets are Source, Locations, Capture period, Resolution, Conditions, Quality (ownership) and Use cases, and nowhere does it mention consent. The Kaggle description of the same dataset does not mention consent either.
  - verifier (scope): **scope_ok** — Rule 13 applies: the quote shows the section's nearest entry (ownership), and the absence of consent is stated. I read the whole README and it has no consent wording anywhere.

### transaction

- **c033** The Indian Number Plates card directs buyers to contact DataCluster Labs' sales email to licence the full dataset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “For commercial licensing of the full dataset, contact” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A statement about the vendor's own card. On reading it, the Hugging Face README says 'To license the full dataset: sales@datacluster.ai', and the Kaggle description has the same sales@datacluster.ai contact.
  - verifier (scope): **quote_incomplete** — The quote stops at 'contact' and does not show the sales email. 'To license the full dataset: sales@datacluster.ai' would show it.

### pricing

- **c034** DataCluster Labs states that its full datasets are available for commercial licensing.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Full datasets are available for commercial licensing.” — DataCluster Labs, <https://huggingface.co/Dataclusterlabspvtltd> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's own offer. Its README on Hugging Face (vendor-authored) repeats it: 'The full dataset (15,000+ annotated images, multiple formats) is available for commercial licensing.' No customer or licensee is named in any readable page. The one-pager's 'Our client:' logos are images that the PDF extractor cannot read.
  - verifier (scope): **scope_ok** — Sentence confirmed verbatim on the HF org page 2026-10-01.

### licence

- **c035** The Mobile Phone card says a licence to the full dataset must be purchased for research as well as commercial use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Mobile Phone Dataset, India_
  - “To access the full dataset for research or commercial purposes, a license can be purchased” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone> · docs · retrieved 2026-10-01 · quote check: exact
- **c036** DataCluster Labs' Fire and Smoke sample is released under its own restricted commercial-sample licence.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Fire and Smoke Dataset_
  - “restricted commercial-sample license” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Fire-and-Smoke-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** The Fire and Smoke sample licence summary prohibits redistribution or re-upload.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Fire and Smoke Dataset_
  - “No redistribution or re-upload” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Fire-and-Smoke-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** The Fire and Smoke sample licence summary prohibits use of the sample in training commercial ML models.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Fire and Smoke Dataset_
  - “No use in training commercial ML models” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Fire-and-Smoke-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c039** DataCluster Labs' Hugging Face card releases the Indian Number Plates sample under CC BY-NC-ND 4.0.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** Kaggle's metadata for DataCluster Labs' Indian Number Plates dataset lists its licence as CC0: Public Domain.  
  _terms · vendor_stated · as of 2024-02-23 (page_dated) · scope: Indian Number Plates Dataset, India_
  - “CC0: Public Domain” — DataCluster Labs, <https://www.kaggle.com/api/v1/datasets/view/dataclusterlabs/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Changed after Part 2. On 2026-10-01 I fetched https://www.kaggle.com/api/v1/datasets/view/dataclusterlabs/indian-number-plates-dataset and it reads '"licenseName":"CC0: Public Domain"', and the list API (page 1) agrees. But the view URL is the profile's own source, and the licence value is picked by the uploader, DataCluster Labs, so this is the vendor's own licence choice shown on Kaggle, not independent evidence. The fact is correct. The same Kaggle record's description says the images are 'exclusively owned by Data Cluster Labs' and that a licence can be purchased, which conflicts with CC0. The Hugging Face copy of the same sample is cc-by-nc-nd-4.0.
  - verifier (scope): **scope_ok** — as_of 2024-02-23 is the date of Kaggle version 3, not of the licence field. The licence reads CC0 as of retrieval on 2026-10-01, and whether it was CC0 on 2024-02-23 is not shown.
- **c041** The Mobile Phone repository's file list shows only folders, .gitattributes and README.md, without the LICENSE file its card points to.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Mobile Phone Dataset, India_
  - “Upload 200 files” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone/tree/main> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** DataCluster Labs' brochure labels the licence of its flagship dataset as 'Commercial-friendly', without further terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Commercial-friendly” — DataCluster Labs, <https://www.datacluster.ai/brochure.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c030** DataCluster Labs says each Indian Number Plates image is manually reviewed and verified by its own computer vision staff.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “each image is manually reviewed and verified by computer vision professionals at DC Labs” — DataCluster Labs, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c031** DataCluster Labs says every batch passes multi-stage human review with measurable inter-annotator agreement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every batch passes multi-stage human review with measurable inter-annotator agreement.” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c012** DataCluster Labs describes Dailydata contributors as capturing real-world images to a client's spec.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “100,000+ contributors capturing real-world images to your spec” — DataCluster Labs, <https://www.datacluster.ai/brochure.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c020** DataCluster Labs' products page heads its catalogue section 'Off-the-shelf, ready on Kaggle'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Off-the-shelf, ready on Kaggle” — DataCluster Labs, <https://www.datacluster.ai/products.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c021** DataCluster Labs' products page closes with a call to action for custom datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Need a custom dataset? Let's talk.” — DataCluster Labs, <https://www.datacluster.ai/products.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** DataCluster Labs offers to field collection to a buyer's specification, including rare classes, devices, weather or time of day.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Define the spec — we field it. From rare classes to specific devices, weather or times of day.” — DataCluster Labs, <https://www.datacluster.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c023** DataCluster Labs' Hugging Face page offers to build a dataset that does not yet exist.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Looking for a dataset that doesn't exist yet? We can build it for you.” — DataCluster Labs, <https://huggingface.co/Dataclusterlabspvtltd> · docs · retrieved 2026-10-01 · quote check: exact
- **c024** DataCluster Labs' Kaggle listing asks visitors to email sales both for the full dataset and for new data collection requests.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Indian Number Plates Dataset, India_
  - “To download the full dataset or to submit a request for your new data collection needs” — DataCluster Labs, <https://www.kaggle.com/api/v1/datasets/view/dataclusterlabs/indian-number-plates-dataset> · docs · retrieved 2026-10-01 · quote check: missing 0.00

### changes

- **c002** DataCluster Labs' Hugging Face CAD design sample dataset was last modified on 2026-09-22, the newest dated activity found; no funding, acquisition or layoff event was found.  
  _event · vendor_stated · as of 2026-09-22 (page_dated)_
  - “2026-09-22T17:11:54.000Z” — DataCluster Labs, <https://huggingface.co/api/datasets/Dataclusterlabspvtltd/cad_design_dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Added after Part 2: the Hugging Face timestamp (lastModified 2026-09-22T17:11:54Z) is confirmed only by the profile's own source URL (the HF API), which does not count as independent. What Kaggle confirms, on a different domain, is that the same CAD design sample (dataclusterlabs/cad-design-dataset) was published or updated on 2026-09-22. Further caveats: the vendor's LinkedIn page shows a post labelled '1d Edited' (relative, undated) and posts labelled '1w', so dated-or-relative activity newer than 2026-09-22 exists; and Kaggle's API shows the matching cad-design-dataset lastUpdated 2026-09-22T17:05:24Z. The absence of funding, acquisition or layoff events could not be tested: no search available, and no registry (MCA) or press route was reachable by navigation.
    - “"lastUpdated":"2026-09-22T17:05:24.23Z"” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=4> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (scope): **scope_ok** — The quoted timestamp matches lastModified; createdAt is 17:10:27, so it is not ambiguous. But 'the newest dated activity found' overstates: LinkedIn posts labelled '1d Edited' and '1w' point to activity after 2026-09-22, although they carry no absolute date. The 'no funding/acquisition/layoff' half is an absence that nothing quoted can show.

### demand

- **c008** DataCluster Labs' brochure says its Kaggle sample datasets have 400,000+ views and 89,000+ downloads.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **89000 Kaggle downloads** (vendor-stated lower bound, free sample datasets, all time; cumulative)
  - “with 400,000+ views and 89,000+ downloads” — DataCluster Labs, <https://www.datacluster.ai/brochure.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Summing viewCount and downloadCount over all 71 Kaggle datasets from the API (pages 1-4, 2026-10-01) gives 720,199 views and 94,442 downloads, so the brochure's '400,000+ views' and '89,000+ downloads' are true lower bounds. The quote shows one dataset's count only; a sum cannot be quoted.
    - “"downloadCount":11071” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=1> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (scope): **scope_ok**
- **c009** DataCluster Labs' undated one-page PDF gives its Kaggle sample datasets 400,000 views and 40,000 downloads.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **40000 Kaggle downloads** (vendor-stated, free sample datasets, all time, undated document; cumulative)
  - “with over 400,000 views and 40,000 downloads” — DataCluster Labs, <https://www.datacluster.ai/assets/DataCluster-Labs-one-pager.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: DataCluster Labs' undated one-page PDF says its Kaggle samples have 'over 400,000 views and 40,000 downloads', but Kaggle's own counts on 2026-10-01 total 720,199 views and 94,442 downloads across 71 datasets, so the PDF's download figure is stale by more than half. — The PDF does say 40,000 (read with pdftext.py); what the independent evidence changes is the figure's currency. It also conflicts with the brochure's 89,000+ (c008). Totals computed from the Kaggle API, pages 1-4.
    - “"downloadCount":11071” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=1> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (scope): **scope_ok** — Matches pdftext output of the one-pager page 1.
- **c010** DataCluster Labs' brochure has a clients and partners section headed 'Trusted by leaders, universities & startups'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Trusted by leaders, universities & startups” — DataCluster Labs, <https://www.datacluster.ai/brochure.html> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Kaggle's public API lists 71 datasets owned by DataCluster Labs, with 720,199 views and 94,442 downloads in total on 2026-10-01.  
  _number · independent · as of 2026-10-01 (retrieved_only) · scope: Kaggle sample datasets_ · **94442 downloads** (sum of downloadCount over the 71 entries returned by Kaggle's datasets/list API for user dataclusterlabs, pages 1-4; views sum 720,199; cumulative to 2026-10-01)
  - “"downloadCount":11071” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=1> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
- **v002** Of DataCluster Labs' 71 Kaggle sample datasets, 41 carry the licence CC0: Public Domain, 13 'Data files © Original Authors', 9 CC BY-NC-ND 4.0, 5 CC BY 4.0 and 3 Unknown, although the cards claim exclusive ownership.  
  _terms · independent · as of 2026-10-01 (retrieved_only) · scope: Kaggle sample datasets_
  - “"licenseName":"Data files © Original Authors"” — Kaggle, <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs&page=1> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
- **v003** Kaggle keeps three dated versions of DataCluster Labs' Indian Number Plates sample: an initial release on 2021-11-09, a data update on 2023-02-24 and an OCR version on 2024-02-23.  
  _architecture · independent · as of 2024-02-23 (page_dated) · scope: Indian Number Plates Dataset, India_
  - “"versionNotes":"Initial release"” — Kaggle, <https://www.kaggle.com/api/v1/datasets/view/dataclusterlabs/indian-number-plates-dataset> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00

## Unknown

- `matrix.custody_model` — not_published; tried <https://www.datacluster.ai/products.html>, <https://www.datacluster.ai/contact.html>, <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset>
- `matrix.licence_model` — not_published; tried <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone/raw/main/LICENSE>, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone/tree/main>, <https://www.datacluster.ai/brochure.html>, <https://www.datacluster.ai/terms.html>
- `matrix.exclusivity_offered` — not_published; tried <https://www.datacluster.ai/>, <https://www.datacluster.ai/products.html>, <https://www.datacluster.ai/brochure.html>, <https://huggingface.co/Dataclusterlabspvtltd>
- `matrix.buyer_vetting` — not_published; tried <https://www.datacluster.ai/contact.html>, <https://huggingface.co/Dataclusterlabspvtltd>
- `matrix.versioning` — not_published; tried <https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset>, <https://huggingface.co/datasets/Dataclusterlabspvtltd/Mobile_Phone_Dataset_Smartphone_and_Feature_Phone/tree/main>
- `matrix.contributor_pay_model` — not_found; tried <https://play.google.com/store/apps/details?id=com.daily.data>, <https://github.com/datacluster-labs/Domestic-Fire-and-Smoke-Dataset>, <https://www.datacluster.ai/>, <https://www.datacluster.in/>
- `matrix.erasure_after_sale` — not_published; tried <https://www.datacluster.ai/>, <https://www.datacluster.ai/privacy.html>, <https://www.datacluster.ai/terms.html>
- `questions.Q4` — not_published; tried <https://www.datacluster.ai/>, <https://www.datacluster.ai/products.html>, <https://www.datacluster.ai/brochure.html>
- `questions.Q6` — not_published; tried <https://www.datacluster.ai/products.html>, <https://www.datacluster.ai/contact.html>
- `other.terms_privacy` — not_found; tried <https://www.datacluster.ai/terms.html>, <https://www.datacluster.ai/privacy.html>, <https://www.datacluster.ai/sitemap.xml>, <https://www.datacluster.ai/robots.txt>
- `other.roboflow_listing` — blocked; tried <https://universe.roboflow.com/datacluster-labs-agryi>
- `other.kaggle_listing_page` — js_empty; tried <https://www.kaggle.com/dataclusterlabs>
- `other.old_site` — blocked; tried <https://www.datacluster.in/>
- `other.independent_sources` — not_found; tried <http://export.arxiv.org/api/query?search_query=all:%22DataCluster%20Labs%22>, <http://export.arxiv.org/api/query?search_query=abs:datacluster>
- `other.funding_and_registration` — not_found; tried <https://in.linkedin.com/company/datacluster-labs>

## Conflicts

- c008, c009: Brochure says 89,000+ Kaggle downloads, undated one-pager says 40,000; the one-pager is probably older but neither is dated. Both vendor-stated. (unresolved)
- c039, c040: The same Indian Number Plates sample is CC BY-NC-ND 4.0 on Hugging Face (2026) and CC0 on Kaggle (updated 2024-02-23); the Hugging Face card is newer but the Kaggle CC0 grant remains live. (unresolved)

## Leads, not cited

- <https://play.google.com/store/apps/details?id=com.daily.data> — Dailydata contributor app linked from GitHub READMEs; returns 404 now. Contributor pay and consent terms would be here if it moves.
- <https://universe.roboflow.com/datacluster-labs-agryi> — Roboflow Universe workspace returned 403 to WebFetch; licence labels there could add to the licence conflict.
- <https://www.datacluster.in/> — Older company domain named on GitHub; returned HTTP 530. May have held terms or a Dailydata page.
- <https://calendar.app.google/frgiBFeAkemKsK7XA> — Sales booking link from the brochure; not fetched (no contacting).
- <https://www.kaggle.com/api/v1/datasets/list?user=dataclusterlabs> — Kaggle API list shows 20+ datasets with mixed licences (CC0, CC BY-NC-ND 4.0, 'Data files © Original Authors') and last updates from 2022 to 2025-07-20.
