# Shutterstock

stock_media · deep · status: **active** · also known as Shutterstock, Inc., SSTK

> Rendered from `ledger/shutterstock.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “'data licensing' / 'datasets' (filings: 'data offering', 'data deals'); contributors see a 'Data Catalog'” and its bespoke side “'custom datasets' within its 'AI services' for model builders; 'tailored services' to curate datasets; Shutterstock Studios for custom content production”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c080, c078, c042, c098 | Contributors grant Shutterstock a sublicensable non-exclusive licence; Shutterstock itself licenses datasets to buyers (and is the 'Provider' on its AWS listing). |
| economics_model | revenue_share | c027, c124, c029 | Shutterstock keeps the revenue from data deals and pays about 20% on average into a pooled Contributor Fund. |
| who_pays_fee | seller | c027, c124 | No buyer-side fee is published; Shutterstock's share comes out of the deal value, since contributors get a share (about 20% on average) of the contract value. |
| supply_models | contributor_uploads | c042, c064, c067, c069, c066 | Contributor uploads, both creative-marketplace content and data-only 'Data Catalog' content. No evidence found of own speculative collections or third-party dataset providers being listed; custom datasets from production hubs are made to order. |
| custody_model | copy_to_buyer | c053, c016, c103, c023 | Large metadata sets are delivered to customers (revenue is recognised on delivery); the AWS sample is exported to the buyer's S3. |
| transaction_mode | contact_sales | c092, c111, c050 | Only the 1,000-image sample is self-serve (free on AWS). Full-library data goes through sales. |
| public_prices | unknown |  | No dataset price was found in filings, press or the AWS listing (only the free sample, $0). shutterstock.com returned 403, so its data-licensing page could not be checked. |
| licence_model | mixed | c106, c051, c129, c026 | A research licence and a commercial licence are offered, but deals are individual contracts, some multi-year and some cancellable. Use is limited to ML/CV training. |
| exclusivity_offered | unknown |  | Not published. Contributor content is non-exclusive, which suggests but does not prove that no exclusivity is sold. |
| public_listing | unknown |  | shutterstock.com returned 403. The only public dataset listing seen is the free AWS Data Exchange sample. |
| buyer_vetting | unknown |  | Not published. |
| sample_mechanics | free_sample_download | c090, c091, c103 | Free 1,000-image sample with metadata on AWS Data Exchange. |
| versioning | unknown | c097 | The AWS sample gives access to all historical and future revisions, but nothing is published about versioning of negotiated data deliveries. |
| human_subject_consent_docs | asserted_only | c059, c061, c094, c095, c076 | Releases are collected and reviewed but not given to customers; buyers get a has_model_release flag and a model_release_id. |
| contributor_pay_model | royalty_or_revenue_share | c027, c029, c028, c068 | A pooled Contributor Fund (about 20% of data-licence revenue on average), paid pro rata to the volume of each contributor's content in the datasets sold, every six months. |
| catalogue_plus_custom | both | c093, c113, c112, c118 |  |
| erasure_after_sale | takedown_only | c122, c081, c044 | Opt-out affects only future datasets, and licences for removed content stay in force in perpetuity. The AWS standard DSA on the free sample does require deletion when the licence ends [c100]. |
| quality_evidence | operator_verified | c045, c046, c070, c072 | Every submission is reviewed by Shutterstock. Data Catalog content can be content rejected for creative quality, but it still passes legal and IP review. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | sourced | AI and ML model builders, from large tech and media companies to start-ups (OpenAI, Meta, NVIDIA, Runway and others by the vendor's account), license images, video, music and 3D with metadata under large multi-year contracts. Data revenue is lumpy and fell 26% in H1 2026. | c018, c019, c127, c129, c115, c014, c015, c047, c119 |
| Q2 | partial | Shutterstock sells direct but lists a free 1,000-image sample on AWS Data Exchange as a funnel to its sales team. The AWS listing brings discovery and S3 delivery, and the sale itself stays off-platform. | c090, c092, c104, c103 |
| Q3 | sourced | Inventory is contributor uploads licensed non-exclusively to Shutterstock, including data-only content rejected from the creative library. Contributors can opt out by media type (from 2023/2024) and are paid from a pooled fund. | c042, c078, c080, c064, c031, c032, c066, c033, c027, c039 |
| Q4 | partial | Datasets launched in July 2021, but the opt-out came only in January 2023 and applies only to future datasets. The terms can be changed at any time, and the press questioned contributor consent. No evidence was found on commissioned-work carve-outs. | c123, c031, c122, c085, c128, c126 |
| Q5 | partial | Shutterstock is licensor of record under a sublicensable contributor licence. Contributors warrant releases and indemnify Shutterstock. On AWS, Shutterstock as Provider indemnifies subscribers. The buyer-side data deal terms are not published. | c080, c082, c083, c101, c079 |
| Q6 | sourced | Copied to the buyer: large metadata sets are delivered, with revenue recognised on delivery, and the AWS sample is exported to S3. | c053, c016, c103, c023, c100 |
| Q7 | partial | Capturers: per-media opt-out toggles for future datasets. Depicted people: a release is required for every identifiable person and reviewed, but it is not shared with buyers, who get only a flag and ID. Property: releases are checked in review. | c031, c032, c122, c076, c045, c059, c061, c094, c074 |
| Q8 | partial | Use is limited to ML/CV training, with research or commercial licences. On the AWS sample, the standard DSA bars redistribution and requires deletion on termination. No audit, fingerprinting or leakage terms were found. | c026, c106, c102, c100, c051 |
| Q9 | sourced | Contact sales ('start the conversation', or email the sales team). Shutterstock owns the licence and pays contributors about 20% of revenue on average. Contracts are multi-year, some with cancellation rights. | c092, c111, c027, c124, c050, c051 |
| Q10 | partial | A dataset is a set of assets plus metadata, tracked in an internal database of every asset used in every dataset. Deliveries are timed in contracts. Only the AWS sample documents revisions; nothing is published on withdrawals. | c030, c036, c095, c105, c097, c016, c050 |
| Q11 | sourced | A free 1,000-image sample with a metadata schema (release flags, demographics). Buyers otherwise rely on Shutterstock's review process and its 'ethically sourced', provenance claims. | c090, c091, c095, c045, c020, c110, c066 |
| Q12 | sourced | Off-the-shelf 'data licensing'/'datasets' sit alongside 'custom datasets' made through its 'AI services', using production hubs and the contributor network. Submissions qualify for Creative Licensing, Data Licensing or both. | c093, c113, c112, c118, c021, c070 |

## Narrative

### positioning

Shutterstock is a public stock-media company whose 'data offering' licenses metadata tied to its images, footage, music and 3D models for AI training [c017][c054]. It markets this data to investors as 'ethically sourced' [c020]. The data offering is reported inside Data, Distribution, and Services, alongside Giphy and Studios [c021].

### supply

All inventory comes from contributor uploads licensed non-exclusively [c078][c080]. Accepted content is also made available to data partners [c042]. From June 2023 submissions are routed to creative, data or both [c071][c070], and content rejected on quality can go to a data-only Data Catalog [c066][c033]. From 2024 this includes video [c073]. Opt-out toggles exist since 2023 and are split by media type since 2024 [c031][c032]. AI-generated uploads are barred [c039].

### object_model

Datasets combine assets with metadata: images, video, 3D and music [c036]. The metadata includes release flags, a model_release_id and model age, gender and ethnicity [c094][c095], plus titles and keywords [c105]. An internal database records every asset used in every dataset, for paying contributors [c030].

### listing

No public dataset catalogue was reachable (shutterstock.com returned 403). The one public listing found is a free 1,000-image sample on AWS Data Exchange [c090].

### trust

A release is required for every identifiable person [c076], and since 2023 releases must include a date of birth [c074]. Releases are not shared with customers [c059][c061]. Shutterstock markets its data as having clear provenance [c110]. The press has questioned contributor consent [c128].

### transaction

Deals go through sales: buyers email the team or 'start the conversation' [c092][c111]. Contracts can run for years [c050][c129], and some carry cancellation rights [c051][c052].

### pricing

No dataset prices were found. The only priced item is the free sample [c091]. The February 2024 deck implies about $10 million a year per anchor data customer [c119].

### licence

Buyers may use datasets only to train ML and computer-vision models [c026]. There is a research licence and a commercial licence [c106]. The AWS sample uses AWS's standard DSA [c098][c099][c102].

### custody

Data is delivered to the buyer, and revenue follows delivery timing [c016][c053]. The AWS sample is exported to S3 [c103].

### vetting

Each submission is reviewed by technology and human reviewers [c046], including for releases and third-party IP [c045][c072]. Shutterstock may refuse any content [c087].

### contributor_pay

Data revenue is pooled in a Contributor Fund [c028], which pays about 20% of data-licence revenue on average [c027]. Each share is pro rata to the volume of the contributor's content in the datasets sold [c029], drawn from the whole contract value [c124]. Payouts come every six months [c068] in a separate 'Contributor Fund' column [c038]. Contributors see which files were accepted in the Data Catalog [c034], but not the dataset buyers [c125]. Creative licences pay per-download tiered royalties [c043].

### post_sale

Opt-out affects future datasets only [c122], and licences for removed content survive in perpetuity [c081]. The AWS DSA requires deletion when the licence ends [c100].

### catalogue_custom

Alongside the catalogue, Shutterstock offers tailored dataset curation [c093] and AI services launched in October 2025 [c112]. These include custom datasets from 10 production hubs and more than 2 million creators [c113], plus annotation [c114]. The plan to use contributors for 'bespoke data training sets' dates to 2024 [c118].

### changes

The Getty merger ended on 7 July 2026 [c002]. A $173.7 million goodwill impairment followed [c006], then a CEO exit [c004] and a dividend suspension [c005]. The company had already cut more than $70 million of run-rate costs and is targeting $60 million more [c007][c008]. New directors were appointed on 8 September 2026 [c001].

### demand

Data revenue grew 15% in 2024 [c049]. The segment containing it grew 16% in 2025 on metadata sales [c047][c048]. In 2026 data revenue fell 11% in Q2 and 26% in H1 [c014][c015]. The buyers named are OpenAI and other AI labs [c127][c108][c115].

### regulation

The 10-K flags the EU Data Act and AI Act as possible limits on data use [c058].

## Buyer journey

1. A prospective buyer reads a Shutterstock announcement and is directed to shutterstock.com/data-licensing to 'start the conversation'. That page returned 403 to our fetcher, so what it shows is unknown. [c111]
2. Alternatively, the buyer finds Shutterstock's free 1,000-image sample on AWS Data Exchange. It is drawn from a library of more than 550 million images. [c090]
3. The buyer subscribes to the sample at no charge and accepts the vendor EULA, which is AWS's standard Data Subscription Agreement. [c091, c096, c098]
4. The buyer exports the sample to S3 and inspects the images and CSV metadata, including has_model_release flags and model age, gender and ethnicity fields. The release documents themselves are not included. [c103, c094, c095, c059]
5. For full-library data, the buyer emails Shutterstock's sales team, which offers tailored curation or custom collection. [c092, c093, c113]
6. The buyer negotiates a contract. It may start with a research licence and move to a commercial one; deals can be multi-year and some carry cancellation rights. [c106, c129, c050, c051]
7. Shutterstock delivers the content and metadata sets on a contracted schedule, and use is restricted to ML and computer-vision training. [c016, c053, c026]

## Claims

### positioning

- **c017** Shutterstock's filings describe the data offering as licences to metadata associated with its images, footage, music tracks and 3D models.  
  _offer · filing · as of 2026-08-07 (publication)_
  - “licenses to metadata associated with our images, footage, music tracks and 3D models through our data offering” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c020** Shutterstock markets its training metadata to investors as ethically sourced and licensable at industry-leading scale and quality.  
  _offer · filing · as of 2026-08-07 (publication)_
  - “We offer ethically sourced and licenseable metadata at industry leading scales and quality.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c054** Shutterstock's 10-K describes its data offering as providing metadata associated with its content collection, used to train AI models.  
  _offer · filing · as of 2026-02-17 (publication)_
  - “our data offering which provides metadata associated with our content collection, used to train AI models” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c121** The February 2024 deck lists data licensing for customers' AI/ML model training and analytics as one of three growth businesses.  
  _offer · vendor_stated · as of 2024-02-21 (publication)_
  - “Data licensing for customers' AI/ML model training and analytics needs” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c031** Since January 2023 Shutterstock contributors can opt out of data licensing in their account settings.  
  _terms · vendor_stated · as of 2023-01 (page_dated)_
  - “In January 2023 we have added an option in the contributor account settings that allows you to opt out” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c032** From August 2024 Shutterstock contributors have separate opt-out toggles for image and video data licensing.  
  _terms · vendor_stated · as of 2024-08 (page_dated)_
  - “allow contributors to have separate toggles for image and video data licensing” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c033** In June 2023 Shutterstock introduced a Data Catalog in the contributor account and broadened what can be submitted specifically for datasets.  
  _architecture · vendor_stated · as of 2023-06 (page_dated)_
  - “introduced the Data Catalog in the contributor account” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** Some editorial content may be included in Shutterstock datasets, but premier editorial content is excluded.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “(premier editorial content is excluded)” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c039** Shutterstock does not accept AI-generated content from contributors for licensing.  
  _terms · vendor_stated · as of 2024-04-18 (page_dated)_
  - “Shutterstock will not allow AI-generated content to be submitted by contributors for licensing on our platform.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594676-ai-generated-content-on-shutterstock-contributor-faq> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** Content accepted into Shutterstock's collection is also made available for delivery to its data offering partners for machine learning.  
  _architecture · filing · as of 2026-02-17 (publication)_
  - “Content accepted is also made available for delivery to our data offering partners for machine learning purposes.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Found in the 2024 10-K (the profile cites the 2025 10-K, which repeats it word for word), so the statement has stood for two annual reports.
    - “Content accepted is also made available for delivery to our data offering partners for machine learning purposes” — Shutterstock, Inc. Form 10-K for 2024, filed with the SEC 2025-02-25, <https://www.sec.gov/Archives/edgar/data/1549346/000154934625000011/sstk-20241231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c057** Shutterstock distributes content under the brands Shutterstock, Pond5, TurboSquid, PicMonkey, PremiumBeat, Splash News, Bigstock and Envato.  
  _offer · filing · as of 2026-02-17 (publication)_
  - “Shutterstock; Pond5; TurboSquid; PicMonkey; PremiumBeat; Splash News; Bigstock; and Envato” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c064** Shutterstock's data licensing setting lets it include a contributor's content in datasets licensed to train computer vision and machine learning systems.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “include your content in datasets that are licensed by customers seeking visual content and its metadata to train” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594687-can-i-control-how-my-content-is-licensed> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** Shutterstock offers contributors separate data licensing toggles for images and for video.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have separate toggles to give you control over data licensing for images and video.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594687-can-i-control-how-my-content-is-licensed> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** Work in the Data Catalog may be used in datasets for AI training.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Work in the Data Catalog may be used in datasets for AI training.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12133814-why-are-my-approved-images-missing-from-my-portfolio> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** Content fully approved for Shutterstock's creative marketplace may also be used in data licensing.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Content that has been fully approved for the marketplace may also be used in data licensing.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12133814-why-are-my-approved-images-missing-from-my-portfolio> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** Contributors license content to Shutterstock on a non-exclusive, royalty-free basis and keep copyright.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your content is licensed to Shutterstock on a non-exclusive, royalty-free basis.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12136338-what-is-shutterstock-s-content-exclusivity-policy> · docs · retrieved 2026-10-01 · quote check: exact
- **c079** Contributors retain full copyright in content submitted to Shutterstock.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “When you submit content to Shutterstock, you retain full copyright.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12136338-what-is-shutterstock-s-content-exclusivity-policy> · docs · retrieved 2026-10-01 · quote check: exact
- **c120** Shutterstock's February 2024 investor deck cites 771 million images, 54 million videos and 3.2 million contributors.  
  _number · vendor_stated · as of 2024-02-21 (publication)_ · **771 million images** (images in the collection per investor deck (vendor-stated); as at early 2024)
  - “771 million Images 54 million Videos 4+ million Music Tracks & SFX 1.3 million 3D Models 3.2 million Contributors” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. The deck says 'All figures as of December 31, 2023, unless otherwise noted'.
    - “771 million Images 54 million Videos 4+ million Music Tracks & SFX 1.3 million 3D Models 3.2 million Contributors” — Shutterstock, Inc. Form 8-K Exhibit 99.2 'Shutterstock 2027: Long-range Financial Targets', SEC 2024-02-21, <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The deck dates its figures 'as of December 31, 2023'; the value's period 'as at early 2024' should be 31 December 2023.

### object_model

- **c030** Shutterstock keeps an internal database of every asset used in every dataset since the product launched, to compensate contributors.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Shutterstock maintains an internal database of all assets used in all datasets” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c036** Shutterstock datasets consist of images (photos, illustrations, vectors), videos, 3D models and music.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “including images (photos, illustrations, vectors), videos, 3D models, and music” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Contributors may add ethnicity, age and gender information to model-released images as metadata.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “contributors have the option to include ethnicity, age, and gender information for model-released images” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594592-what-content-information-is-visible-to-shutterstock-customers> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** Shutterstock encourages contributors to record where a photo or clip was taken.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contributors are encouraged to provide the geographic location where the photo or video clip was taken.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594592-what-content-information-is-visible-to-shutterstock-customers> · docs · retrieved 2026-10-01 · quote check: exact
- **c094** Shutterstock's sample dataset metadata includes a has_model_release flag per asset.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “has_model_release” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
- **c095** Shutterstock's sample dataset includes a model metadata file with model_release_id, age range, age, gender and ethnicity, but not the releases themselves.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “model_release_id” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
- **c097** Subscribers to Shutterstock's AWS sample get access to all historical and all future revisions of the data set.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “All future revisions” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
- **c105** Per the AWS blog, each Shutterstock dataset image carries a descriptive title of up to 200 characters and 7-50 keywords.  
  _architecture · independent · as of 2021-06-28 (publication)_
  - “Each image includes a descriptive title with up to 200 characters and an optimal 7-50 keywords.” — Amazon Web Services (AWS Marketplace blog), <https://aws.amazon.com/blogs/awsmarketplace/using-shutterstocks-image-datasets-to-train-your-computer-vision-models/> · third_party_docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c090** Shutterstock lists a free sample of 1,000 images with metadata on AWS Data Exchange, drawn from its library of over 550 million images.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “Free sample dataset of 1000 images and accompanying metadata sourced from our +550 million image library.” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: fuzzy 1.00

### trust

- **c059** Shutterstock generally does not share complete model releases with customers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Shutterstock generally does not share complete model releases with customers” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594591-is-a-model-s-personal-information-shared-with-customers> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A policy of Shutterstock's own help centre about release disclosure; by its nature only on the vendor's site.
  - verifier (scope): **scope_ok** — Matches the cited help article. For dataset buyers the Contributor Fund article is stronger: 'full model releases are never shared' with computer vision partners (see missed).
- **c060** Shutterstock may give a customer non-identifying model information, such as age, where local law requires it.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “may provide non-identifying information (such as the age of the model) if this is required by the customer under local laws” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594591-is-a-model-s-personal-information-shared-with-customers> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** Personal information on a model release, including name and address, is never disclosed to Shutterstock customers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Any personal information, including the name and address provided on a model release, is never disclosed.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594592-what-content-information-is-visible-to-shutterstock-customers> · docs · retrieved 2026-10-01 · quote check: exact
- **c074** Since April 2023 every Shutterstock model release must include the model's date of birth.  
  _terms · vendor_stated · as of 2023-04 (page_dated)_
  - “All Model Release forms must include the model's date of birth.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594681-content-publishing-standards-and-policy-updates> · docs · retrieved 2026-10-01 · quote check: exact
- **c075** Since April 2023 Shutterstock no longer requires witness information on model or property releases.  
  _terms · vendor_stated · as of 2023-04 (page_dated)_
  - “Witness information for Model or Property releases will no longer be required.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594681-content-publishing-standards-and-policy-updates> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** Shutterstock requires a release for every identifiable person in an image.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A release is needed for every identifiable person in the image.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12135904-what-are-the-requirements-for-model-releases> · docs · retrieved 2026-10-01 · quote check: exact
- **c077** Contributors upload model releases as JPEG files during submission via the Content Editor.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Upload your release during submission by attaching a JPEG file (max 20 MB)” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12135904-what-are-the-requirements-for-model-releases> · docs · retrieved 2026-10-01 · quote check: exact
- **c082** The 2023 contributor terms require valid model releases for all content containing an identifiable face.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “provide valid and accurate model releases for all Content you contribute to Shutterstock that contains an identifiable face” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: fuzzy 0.88
- **c110** Shutterstock markets its training content as labelled, continuously updated and with clear data provenance for AI compliance.  
  _offer · vendor_stated · as of 2026-03-19 (publication)_
  - “high-quality labeled and continuously updated multimodal content with clear data provenance to support AI compliance” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c128** TechCrunch questioned in 2022 where contributors' consent was to their work becoming AI training data.  
  _outcome · independent · as of 2022-10-25 (publication)_
  - “where was the consent from artists to becoming contributors to these AI systems in the first place?” — TechCrunch, <https://techcrunch.com/2022/10/25/shutterstock-openai-dall-e-2/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Same URL as the profile's own source. The claim is about what TechCrunch wrote, so the article itself is the only possible source; it is the reporter's own commentary on the announcement (not a relayed vendor statement), dated 25 October 2022.
    - “where was the consent from artists to becoming contributors to these AI systems in the first place?” — TechCrunch (Natasha Lomas, 2022-10-25), <https://techcrunch.com/2022/10/25/shutterstock-openai-dall-e-2/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**

### transaction

- **c016** Shutterstock says data offering revenue varies quarter to quarter with the delivery timing of metadata licences.  
  _architecture · filing · as of 2026-08-07 (publication)_
  - “Revenue recognition in our data offering may vary from quarter-to-quarter based on the delivery timing of metadata licenses.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c050** At 31 December 2025 Shutterstock had about $35.3 million of contracted but unsatisfied obligations, mainly data offerings, to be recognised over five years.  
  _number · filing · as of 2026-02-17 (publication)_ · **35.3 USD million** (remaining contracted performance obligations, primarily data deals, outside deferred revenue; recognised over a five-year period; as at 2025-12-31)
  - “contracted but unsatisfied performance obligations relating primarily to our data offerings” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. The sentence reads 'as of December 31, 2025, the Company has approximately $ 35.3 million of' (split by a page break) and ends 'expects to recognize over a five year period'.
    - “contracted but unsatisfied performance obligations relating primarily to our data offerings” — Shutterstock, Inc. Form 10-K for 2025, filed with the SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote lacks the amount and the period; the same sentence has 'approximately $ 35.3 million of' (before a page break) and 'expects to recognize over a five year period'.
- **c051** Some of Shutterstock's data deal contracts give the customer a right to cancel.  
  _terms · filing · as of 2026-02-17 (publication)_
  - “In certain of the Company's data deal contracts, the Company has provided customers with the right to cancel.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c052** Shutterstock held a $13.0 million refund reserve for data deal contracts with customer cancellation rights at 31 December 2024.  
  _number · filing · as of 2026-02-17 (publication)_ · **13.0 USD million** (refund reserve liability for data deal contracts with customer cancellation rights, at 31 Dec 2024; as at 2024-12-31)
  - “As of December 31, 2024, the total refund reserve related to these contracts was $ 13.0 million” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. 2024 10-K (the profile cites the 2025 10-K): current $7.3M plus non-current $5.7M = $13.0M at 31 December 2024. The 2025 10-K adds that there was no refund reserve at 31 December 2025 and $5.0M of reserve was reversed into 2025 revenue (see missed).
    - “the total refund reserve related to these contracts is $ 7.3 million and $ 5.7 million” — Shutterstock, Inc. Form 10-K for 2024, filed with the SEC 2025-02-25, <https://www.sec.gov/Archives/edgar/data/1549346/000154934625000011/sstk-20241231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — Right for 31 December 2024; the same note says the reserve was nil at 31 December 2025, which the profile does not record (see missed).
- **c092** Buyers wanting data from Shutterstock's full library are told to contact its sales team by email rather than buy on AWS.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “please reach out directly to our team at SalesADX@shutterstock.com” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The text is the provider's own listing copy on AWS Marketplace. During the blind pass the AWS Marketplace search page was rendered by script and returned no listings, so the listing could not be reached by navigation; no search available.
  - verifier (scope): **quote_incomplete** — The quote gives only the email; the words that carry 'full library' are: 'If you'd like to start licensing data from our full library please reach out directly to our team at SalesADX@shutterstock.com'. The same listing describes the sample as drawn from a '+550 million image library', older than the 771M figure in the 2024 deck.
- **c111** Shutterstock's March 2026 release sends prospective data buyers to 'start the conversation' on its data-licensing page rather than to a checkout.  
  _offer · vendor_stated · as of 2026-03-19 (publication)_
  - “start the conversation at shutterstock.com/data-licensing” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

### pricing

- **c091** Shutterstock's AWS Data Exchange sample is free, with no end date to the subscription.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_ · **0 USD** (price to subscriber of the 1,000-image sample dataset on AWS Data Exchange; one-off)
  - “This product is available free of charge. Free subscriptions have no end date and may be canceled any time.” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A term of Shutterstock's own AWS Data Exchange listing. The listing could not be reached by navigation during the blind pass because AWS Marketplace search is script-rendered; no search available. (Scope check: the 'no end date' sentence is AWS's standard wording for free subscriptions.)
  - verifier (scope): **scope_ok** — Matches the listing's pricing section for 'Free Sample Dataset - 1000 High Resolution Images & Metadata'. 'Free subscriptions have no end date and may be canceled any time' is AWS Marketplace's standard wording for free products, not a Shutterstock-specific term.

### licence

- **c026** Buyers of Shutterstock datasets (content and metadata) may only use them to train machine learning and computer vision models, per the contributor help centre.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “may only use them to train machine learning and computer vision models” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c080** Under the contributor terms effective 5 September 2023 the contributor grants Shutterstock a sublicensable, non-exclusive licence including to analyse and prepare derivative works.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “sublicensable, non-exclusive right and license to index, analyze, categorize, archive reproduce, prepare derivative works” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Shutterstock's own contributor terms; nothing independent restates it.
  - verifier (scope): **quote_incomplete** — The licence words are right, but the quote does not show the effective date. The page header that does: 'Updated contributor TOS will become effective on September 5, 2023'. The grant is also 'worldwide'. The page is marked updated April 21, 2025; whether a later contributor TOS supersedes it is unknown (the profile lists the current terms as js_empty).
- **c083** The 2023 contributor terms make the contributor indemnify Shutterstock for breaches of the contributor's representations.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “You agree to indemnify and hold Shutterstock harmless from any claims arising out of breach of your representations” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: missing 0.50
- **c096** Subscribers to Shutterstock's AWS sample must accept the vendor's End User License Agreement.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “you must acknowledge and agree to the terms and conditions outlined in the vendor's End User License Agreement (EULA)” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
- **c098** The EULA linked from Shutterstock's AWS sample is AWS's standard Data Subscription Agreement for AWS Marketplace.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “DATA SUBSCRIPTION AGREEMENT FOR AWS MARKETPLACE” — Amazon Web Services (standard Data Subscription Agreement, linked as Shutterstock's listing EULA), <https://d7umqicpi7263.cloudfront.net/eula/slK904JkkKlPCY4pY7CfGXLQMFrKBnDJAgNQKt_yXMI> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c099** That agreement grants the subscriber a nonexclusive, worldwide, nontransferable licence to use and modify the data and create derived data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “a nonexclusive, worldwide, nontransferable license to receive, retain, use, and modify the Data” — Amazon Web Services (standard Data Subscription Agreement, linked as Shutterstock's listing EULA), <https://d7umqicpi7263.cloudfront.net/eula/slK904JkkKlPCY4pY7CfGXLQMFrKBnDJAgNQKt_yXMI> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c101** Under the AWS Data Subscription Agreement the provider (here Shutterstock) indemnifies the subscriber against third-party claims tied to its warranties.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “Provider will, at its expense, indemnify, defend and hold harmless Subscriber” — Amazon Web Services (standard Data Subscription Agreement, linked as Shutterstock's listing EULA), <https://d7umqicpi7263.cloudfront.net/eula/slK904JkkKlPCY4pY7CfGXLQMFrKBnDJAgNQKt_yXMI> · legal_terms · retrieved 2026-10-01 · quote check: exact_nospace
- **c102** The AWS Data Subscription Agreement bars the subscriber from distributing or sublicensing the data to third parties.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “sell, sublicense, loan, lease, assign, authorize others to access, use, or disclose” — Amazon Web Services (standard Data Subscription Agreement, linked as Shutterstock's listing EULA), <https://d7umqicpi7263.cloudfront.net/eula/slK904JkkKlPCY4pY7CfGXLQMFrKBnDJAgNQKt_yXMI> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c106** Shutterstock offers AI buyers a research licence to explore and validate models before moving to a commercial licence for scaled deployment.  
  _terms · vendor_stated · as of 2026-03-19 (publication)_
  - “begin with a research license to explore, experiment, and validate models before transitioning to a commercial license” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An offer term on Shutterstock's own AI-licensing announcements. The 2025 10-K and 2026 filings do not describe a research-versus-commercial licence tier; no search available.
  - verifier (scope): **scope_ok** — Matches the 19 March 2026 release ('Researchers and startups can begin with a research license ... before transitioning to a commercial license for scaled deployment'); note it is addressed to researchers and startups, not to all AI buyers.

### custody

- **c023** Shutterstock's paid-download metric excludes metadata delivered through its data deal offering.  
  _architecture · filing · as of 2026-08-04 (publication)_
  - “metadata delivered through our data deal offering” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c053** Shutterstock says Data, Distribution, and Services results fluctuate with the timing of delivery of large metadata sets.  
  _architecture · filing · as of 2026-02-17 (publication)_
  - “fluctuate from quarter to quarter based on the timing of delivery of large metadata sets in our Data business” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. 2024 10-K (the profile cites the 2025 10-K, same words). The Q2 2026 10-Q says data offering revenue 'may vary from quarter-to-quarter based on the delivery timing of metadata licenses'.
    - “results will fluctuate from quarter to quarter based on the timing of delivery of large metadata sets in our Data business” — Shutterstock, Inc. Form 10-K for 2024, filed with the SEC 2025-02-25, <https://www.sec.gov/Archives/edgar/data/1549346/000154934625000011/sstk-20241231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c103** An AWS blog post (June 2021) says Shutterstock's image datasets on AWS Data Exchange are exported to Amazon S3 and sit in US East (Ohio).  
  _architecture · independent · as of 2021-06-28 (publication)_
  - “The Shutterstock Image Datasets exist in US East (Ohio)” — Amazon Web Services (AWS Marketplace blog), <https://aws.amazon.com/blogs/awsmarketplace/using-shutterstocks-image-datasets-to-train-your-computer-vision-models/> · third_party_docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c035** Shutterstock retains review results for content rejected from the creative library so it can be published for data licensing if the contributor later opts in.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “this content can be published for data licensing in the event that the contributor elects to opt in to future data deals” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** Shutterstock reviews submissions against technical and legal criteria, including whether applicable releases have been obtained.  
  _architecture · filing · as of 2026-02-17 (publication)_
  - “including whether applicable releases have been obtained, whether third-party intellectual property is excluded” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c046** Shutterstock's collection is vetted by proprietary technology and a specialised team of reviewers.  
  _architecture · filing · as of 2026-02-17 (publication)_
  - “is vetted through our proprietary technology and by a specialized team of reviewers” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c066** Images rejected from Shutterstock's main catalogue on quality grounds can be approved for data licensing and placed in the Data Catalog.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Images approved for data licensing were not accepted for the main catalogue due to quality grounds” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12133814-why-are-my-approved-images-missing-from-my-portfolio> · docs · retrieved 2026-10-01 · quote check: exact
- **c070** Shutterstock reviews each submission to qualify it for Creative Licensing, Data Licensing, or both.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “to qualify for either Creative Licensing, Data Licensing, or both” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12277318-what-are-the-photo-and-video-quality-requirements-on-shutterstock> · docs · retrieved 2026-10-01 · quote check: exact
- **c072** Data-licensing submissions are still reviewed for legal, intellectual property and technical requirements.  
  _terms · vendor_stated · as of 2023-06-26 (page_dated)_
  - “content submissions will continue to be reviewed for Legal, Intellectual Property and technical requirements” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594681-content-publishing-standards-and-policy-updates> · docs · retrieved 2026-10-01 · quote check: exact
- **c087** Shutterstock may refuse or remove contributor content for any reason under the 2023 terms.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “Shutterstock has the right to refuse to accept or to remove Content from the Shutterstock Websites for any reason” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c022** Shutterstock contributors upload content in exchange for royalty payments based on customer download activity.  
  _terms · filing · as of 2026-08-07 (publication)_
  - “Contributors upload their content to our web properties in exchange for royalty payments based on customer download activity.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c024** Shutterstock's cost of revenue, which includes contributor royalties, fell by $12.2 million to $93.8 million in Q2 2026.  
  _number · filing · as of 2026-08-07 (publication)_ · **93.8 USD million** (GAAP cost of revenue (includes contributor royalties), Q2 2026; per quarter)
  - “Cost of revenue decreased by $12.2 million to $93.8 million in the three months ended June 30, 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c025** Shutterstock describes data licensing to contributors as a way to earn more from their existing creative assets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Data licensing is an exciting opportunity to maximize the revenue-generating potential of creative assets” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c027** Shutterstock says contributors earn a 20% average corporate royalty rate of the revenue it receives for data licences.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **20 percent of revenue** (average royalty rate paid to contributors, of revenue Shutterstock receives for data licences; pooled, not per asset; per data deal)
  - “20% average corporate royalty rate of revenue received by Shutterstock” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The contributor royalty rate for data licences is Shutterstock's own programme term. The 2025 10-K describes contributor royalties only as a 'tiered earnings rate schedule that is tied to annual licensing volume' and gives no data-licence rate; no search available.
  - verifier (scope): **scope_ok** — The Contributor Fund article says 'Contributors will earn a 20% average corporate royalty rate of revenue received by Shutterstock for data licenses'.
- **c028** Shutterstock pools dataset earnings in a collective fund that is distributed periodically as it accumulates.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Earnings from datasets are pooled in a collective fund and will be distributed periodically as the fund accumulates” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c029** Each contributor's Contributor Fund share is proportionate to the volume of their content and metadata included in purchased datasets.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “proportionate to the volume of their content and metadata that is included in the purchased datasets” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c034** The Data Catalog shows a contributor which of their files were accepted specifically for data licensing.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The Data Catalog provides an easy way to view what content has been accepted specifically for data licensing” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** Contributor Fund payouts appear in a separate 'Contributor Fund' column of the contributor's Earnings Summary.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “posted in your Earnings Summary, in the 'Contributor Fund' column” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** Shutterstock says the Contributor Fund directly compensates contributors whose IP was used (in AI model training).  
  _terms · vendor_stated · as of 2024-04-18 (page_dated)_
  - “which will directly compensate Shutterstock contributors if their IP was used” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594676-ai-generated-content-on-shutterstock-contributor-faq> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** Shutterstock says it will continue to compensate contributors for future licensing of content made with its AI generation tool.  
  _terms · vendor_stated · as of 2024-04-18 (page_dated)_
  - “compensate contributors for the future licensing of AI-generated content through the Shutterstock AI content generation tool” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594676-ai-generated-content-on-shutterstock-contributor-faq> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** Shutterstock contributors earn per-licence royalties on a tiered earnings schedule tied to annual licensing volume.  
  _terms · filing · as of 2026-02-17 (publication)_
  - “Contributors earn royalties based on a tiered earnings rate schedule that is tied to annual licensing volume.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c068** Shutterstock pays contributors for data licensing usage every six months.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Payments for data licensing usage are made every 6 months.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/12133814-why-are-my-approved-images-missing-from-my-portfolio> · docs · retrieved 2026-10-01 · quote check: exact
- **c084** The 2023 contributor terms pay a royalty for each unique download of content for which Shutterstock receives payment.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “Shutterstock shall pay you a royalty for each unique download of Content for which Shutterstock receives payment” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c088** Contributors are paid for self-serve API licences as they would be for a regular Shutterstock subscription licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “you'll be paid out just like you would for any regular Shutterstock subscription” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594553-how-do-shutterstock-api-deals-impact-contributors> · docs · retrieved 2026-10-01 · quote check: exact
- **c089** Shutterstock says it has paid over $1 billion to contributors since 2003.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1 USD billion** (cumulative contributor payouts since 2003, all licence types (vendor-stated, lower bound 'over'); cumulative)
  - “Over $1 billion paid to contributors since 2003” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594553-how-do-shutterstock-api-deals-impact-contributors> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A self-reported cumulative payout. Not stated in the 2025 10-K (royalties appear only inside cost of revenue) or in the January 2025 merger announcement exhibit; no search available to find a third-party figure.
  - verifier (scope): **scope_ok** — The line is a site-wide sidebar or footer on the contributor help centre (it also appears on the Contributor Fund article, whose footer reads '© 2003-2025'), not part of the article's text; vendor-stated, as the statement says.
- **c124** Contributors receive a share of the entire contract value customers pay for dataset licences.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contributors will receive a share of the entire contract value paid by customers licensing datasets.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Shutterstock's own contributor programme. TechCrunch (2023-07-11) mentions a 'contributor fund' that pays artists for training use but says nothing about the basis (contract value) of the share; no search available.
  - verifier (scope): **scope_ok** — Quote is on the Contributor Fund article and matches; the page speaks in the future tense ('will receive') and adds that earnings are pooled and paid periodically.
- **c125** Dataset inclusion does not appear in a contributor's download history.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “not reflected in your contributor account download history” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact
- **c126** Content sold in data licensing deals before June 2023 is not shown in the Data Catalog.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Any content included in data licensing sales prior to June 2023 will not be reflected there” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c044** Shutterstock contributors may remove their content from the collection, subject to the contributor terms of service.  
  _terms · filing · as of 2026-02-17 (publication)_
  - “Contributors may choose to remove their content from our collection, subject to the terms of service” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c081** Under the 2023 contributor terms, licences Shutterstock issued for content later removed remain in force in perpetuity.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “later removed from the Shutterstock Websites will remain in full force and effect in perpetuity” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c100** On termination of the AWS Data Subscription Agreement, the subscriber must remove the data within 90 days and destroy other copies if the provider instructs.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “Subscriber will remove the Data from the AWS Services infrastructure used by Subscriber” — Amazon Web Services (standard Data Subscription Agreement, linked as Shutterstock's listing EULA), <https://d7umqicpi7263.cloudfront.net/eula/slK904JkkKlPCY4pY7CfGXLQMFrKBnDJAgNQKt_yXMI> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c122** Shutterstock's data-licensing opt-out removes a contributor's content from future datasets only; the page does not say datasets already sold are recalled.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “allows you to opt out of having your content included in future datasets” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c021** Shutterstock's Data, Distribution, and Services offering includes customised Shutterstock Studios offerings alongside metadata licensing.  
  _offer · filing · as of 2026-08-07 (publication)_
  - “the use of our metadata, leveraging our Giphy, Inc. platform, and customized Shutterstock Studios offerings” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c055** Shutterstock Studios provides custom content production at scale for brands and agencies, reported within Data, Distribution, and Services.  
  _offer · filing · as of 2026-02-17 (publication)_
  - “high-quality production and custom content at scale provided by Shutterstock Studios” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c093** Shutterstock offers tailored services to ideate, curate and customise datasets for a buyer's needs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AWS Data Exchange free sample_
  - “to start using our tailored services to help ideate, curate and customize datasets for your unique business needs” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · docs · retrieved 2026-10-01 · quote check: exact
- **c104** The June 2021 AWS blog post directs buyers wanting custom datasets from Shutterstock's library to contact Shutterstock directly.  
  _offer · independent · as of 2021-06-28 (publication)_
  - “creating custom datasets using the Shutterstock 370+ million image library, contact the Shutterstock team directly” — Amazon Web Services (AWS Marketplace blog), <https://aws.amazon.com/blogs/awsmarketplace/using-shutterstocks-image-datasets-to-train-your-computer-vision-models/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **c112** In October 2025 Shutterstock launched AI services for model builders providing training datasets and evaluation tools.  
  _event · vendor_stated · as of 2025-10-07 (publication)_
  - “AI services for model builders, providing specialized training datasets and evaluation tools” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-builds-on-data-licensing-strength-with-new-ai-services-for-model-training-and-evaluation-302576366.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c113** Shutterstock says it delivers custom datasets at scale using 10 production hubs and more than 2 million creators in 150+ countries.  
  _offer · vendor_stated · as of 2025-10-07 (publication)_
  - “With 10 production hubs and 2M+ creators across 150+ countries, Shutterstock delivers custom datasets at scale” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-builds-on-data-licensing-strength-with-new-ai-services-for-model-training-and-evaluation-302576366.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c114** Shutterstock's AI services include machine-learning and human-reviewer scoring, clustering and annotation.  
  _offer · vendor_stated · as of 2025-10-07 (publication)_
  - “Advanced machine learning tools and human reviewers deliver trait-specific scoring, clustering, and annotations” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-builds-on-data-licensing-strength-with-new-ai-services-for-model-training-and-evaluation-302576366.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c118** Shutterstock's February 2024 long-range plan set out to use its contributor community to deliver bespoke data training sets.  
  _offer · vendor_stated · as of 2024-02-21 (publication)_
  - “Leverage contributor community to deliver bespoke data training sets” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### changes

- **c001** Shutterstock was operating and appointing new board directors on 8 September 2026.  
  _status · filing · as of 2026-09-08 (publication)_
  - “today announced the appointment of Timothy Adams, Matthew Salzberg, and Michael Thompson to its Board of Directors” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126035918/ef20081694_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. 8-K Item 5.02 body (the profile cites the Exhibit 99.1 release in the same filing): the board appointed Timothy Adams, Matthew Salzberg and Michael Thompson on 4 September 2026, effective 8 September 2026; the new directors filed Forms 3 on 10 and 14 September 2026. Context the status line should carry (the profile has it in c002-c005): merger terminated 7 July 2026, CEO left 13 July 2026, dividend suspended 20-22 July 2026.
    - “effective as of September 8, 2026. Mr. Adams and Mr. Salzberg were appointed as Class II directors of the Company” — Shutterstock, Inc. Form 8-K (Item 5.02) filed with the SEC 2026-09-08, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126035918/ef20081694_8k.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — Release dated 8 September 2026 announces the appointments; the 8-K makes them effective that day.
- **c002** Shutterstock's merger agreement with Getty Images (signed 6 January 2025) was terminated on 7 July 2026.  
  _event · filing · as of 2026-07-09 (publication)_
  - “On July 7, 2026, the Merger Agreement was terminated.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000114036126028035/ef20077612_8k.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c003** The UK Competition and Markets Authority conditioned clearance of the Getty Images merger on a sale of Shutterstock's editorial business.  
  _event · filing · as of 2026-07-09 (publication)_
  - “upon a sale of the Company's editorial business” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000114036126028035/ef20077612_8k.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c004** Shutterstock CEO Paul Hennessy stepped down on 13 July 2026 and CFO Rik Powell became interim CEO.  
  _event · filing · as of 2026-07-13 (publication)_
  - “Paul Hennessy to Step Down as Chief Executive Officer and Board Member; Rik Powell Appointed as Interim CEO” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126028338/ef20077918_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c005** Shutterstock's board resolved on 20 July 2026 to suspend the quarterly cash dividend.  
  _event · filing · as of 2026-07-22 (publication)_
  - “resolved to suspend the Company's future quarterly cash dividend” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126029293/ef20078341_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c006** Shutterstock recorded a goodwill impairment charge of $173.7 million in Q2 2026, triggered by Getty Images' termination of the merger.  
  _number · filing · as of 2026-08-07 (publication)_ · **173.7 USD million** (goodwill impairment charge, GAAP, three months ended 30 June 2026; one-off)
  - “The analysis resulted in a goodwill impairment charge of $173.7 million.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Q2 2026 results release (the profile cites the 10-Q). The release continues 'of the terminated merger agreement'; the 10-Q says the triggering event was Getty's 30 June 2026 announcement that it would terminate (termination took effect 7 July 2026). The charge is $173.7M pre-tax; the release gives $163.4M after tax.
    - “goodwill impairment charge of $173.7 million resulting from the decline in the Company’s fair value after the announcement” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q2 2026 results release dated 2026-08-04), SEC, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — Amount and quarter are right, but the quote does not show the trigger. The 10-Q words: 'Getty Image's June 30, 2026 announcement to terminate the Merger Agreement resulted in a triggering event'. Strictly the trigger was the announcement; termination took effect 7 July 2026.
- **c007** Shutterstock said on 4 August 2026 that cost actions over the prior 18 months equate to over $70 million of annualised run-rate operating expense reductions.  
  _number · filing · as of 2026-08-04 (publication)_ · **70 USD million** (annualised run-rate operating expense reductions already taken (company statement, lower bound 'over'); per year)
  - “cost actions over the past 18 months that equate to over $70 million of annualized run-rate operating expense reductions” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. The words are Interim CEO Rik Powell's in the release datelined 'New York, NY - August 4, 2026'; the Q2 10-Q does not repeat them.
    - “cost actions over the past 18 months that equate to over $70 million of annualized run-rate operating expense reductions” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q2 2026 results release dated 2026-08-04), SEC, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c008** Shutterstock said on 4 August 2026 it is targeting a further $60 million of annualised run-rate operating expense reductions by the end of 2026.  
  _number · filing · as of 2026-08-04 (publication)_ · **60 USD million** (additional annualised run-rate operating expense reductions targeted by year-end 2026; per year)
  - “targeting an additional $ 60 million in annualized run-rate operating expense reductions by the end of the year” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. Same release, dated 4 August 2026.
    - “targeting an additional $ 60 million in annualized run-rate operating expense reductions by the end of the year” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q2 2026 results release dated 2026-08-04), SEC, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c009** Shutterstock cancelled its Q2 2026 earnings call and stopped issuing 2026 guidance pending a strategic update.  
  _event · filing · as of 2026-08-04 (publication)_
  - “the Company will no longer be hosting the conference call originally scheduled for August 6, 2026 or issuing guidance” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c010** Shutterstock's Q2 2026 results included $3.0 million of workforce optimisation expenses.  
  _number · filing · as of 2026-08-04 (publication)_ · **3.0 USD million** (workforce optimisation expense in net loss, Q2 2026; per quarter)
  - “$3.0 million of workforce optimizations expenses” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c071** Shutterstock began routing submissions into data licensing as well as the creative marketplace from 26 June 2023.  
  _event · vendor_stated · as of 2023-06-26 (page_dated)_
  - “starting on June 26, 2023 we are expanding our approach to submissions to widen the reach of our content library” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594681-content-publishing-standards-and-policy-updates> · docs · retrieved 2026-10-01 · quote check: exact
- **c073** From mid-2024 Shutterstock accepts video submitted only for data licensing, including video otherwise rejected for technical quality.  
  _event · vendor_stated · as of 2024-08 (page_dated)_
  - “video submissions that would have been otherwise rejected for technical quality can be used for data deals” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594681-content-publishing-standards-and-policy-updates> · docs · retrieved 2026-10-01 · quote check: exact
- **c085** Shutterstock reserves the right to modify its contributor terms at any time in its sole discretion.  
  _terms · legal_text · as of 2023-09-05 (page_dated)_
  - “Shutterstock reserves the right to modify these terms at any time in its sole discretion” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c086** Shutterstock's updated contributor terms took effect on 5 September 2023.  
  _event · legal_text · as of 2023-09-05 (page_dated)_
  - “Updated contributor TOS will become effective on September 5, 2023” — Shutterstock (contributor help centre), <http://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c107** In March 2026 Shutterstock added templates, fonts, long-form video, premium metadata, podcast and science imagery to its training data catalogue.  
  _event · vendor_stated · as of 2026-03-19 (publication)_
  - “templates, fonts, long-form video, premium metadata, and specialized podcast and science imagery” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c123** Shutterstock launched Shutterstock.AI and its computer vision 'datasets' products in July 2021.  
  _event · vendor_stated · as of 2021-07 (page_dated)_
  - “Shutterstock announced the launch of Shutterstock.AI and computer vision products, also known as 'datasets,' in July 2021.” — Shutterstock (contributor help centre), <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact

### demand

- **c011** Shutterstock's total revenue fell 17% to $221.8 million in the quarter ended 30 June 2026.  
  _number · filing · as of 2026-08-07 (publication)_ · **221.8 USD million** (total GAAP revenue, all offerings; per quarter)
  - “Revenue decreased by $45.2 million, or 17%, to $221.8 million for the three months ended June 30, 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Q2 2026 results release (the profile cites the 10-Q, which gives the 17% decline); $221.8M against $267.0M is a 16.9% fall.
    - “Revenues were $221.8 million compared to $267.0 million” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q2 2026 results release dated 2026-08-04), SEC, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c012** Shutterstock's Data, Distribution, and Services revenue fell 16% to $56.1 million in Q2 2026.  
  _number · filing · as of 2026-08-07 (publication)_ · **56.1 USD million** (GAAP revenue of the Data, Distribution, and Services offering (data licensing plus Giphy and Studios; data not broken out); per quarter)
  - “Our Data, Distribution, and Services revenues decreased by 16%, to $56.1 million in the three months ended June 30, 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Q2 2026 results release (the profile cites the 10-Q). DDS was 25% of Q2 revenue; the constant-currency decline was 19% (10-Q).
    - “or 16% , as compared to the second quarter of 2025 , to $56.1 million” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q2 2026 results release dated 2026-08-04), SEC, <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c013** Data, Distribution, and Services was 25% of Shutterstock's Q2 2026 revenue.  
  _number · filing · as of 2026-08-04 (publication)_ · **25 percent of total revenue** (Data, Distribution, and Services share of total GAAP revenue, Q2 2026; per quarter)
  - “and represented 25% of second quarter revenue in 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000114036126031306/ef20079466_ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c014** Shutterstock's data offering revenue decreased 11% year on year in Q2 2026 (dollar amount not disclosed).  
  _number · filing · as of 2026-08-07 (publication)_ · **-11 percent change year on year** (data offering revenue, Q2 2026 vs Q2 2025; per quarter)
  - “primarily driven by a decline in our data offering, which decreased by 11% in the three months ended June 30, 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. The Q2 results release does not give the data offering's own change; no dollar figure is disclosed.
    - “a decline in our data offering, which decreased by 11% in the three months ended June 30, 2026” — Shutterstock, Inc. Form 10-Q for Q2 2026, filed with the SEC 2026-08-07, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c015** Shutterstock's data offering revenue decreased 26% year on year in the first half of 2026.  
  _number · filing · as of 2026-08-07 (publication)_ · **-26 percent change year on year** (data offering revenue, H1 2026 vs H1 2025; per half-year)
  - “a decline in our data offering, which decreased by 26% in the six months ended June 30, 2026” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. Six-month DDS revenue fell 28% to $77.2M; Q1 2026 DDS alone fell 47% to $21.0M (see missed).
    - “a decline in our data offering, which decreased by 26% in the six months ended June 30, 2026” — Shutterstock, Inc. Form 10-Q for Q2 2026, filed with the SEC 2026-08-07, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c018** Shutterstock reports increased demand for its metadata for machine learning and generative AI model training.  
  _offer · filing · as of 2026-08-07 (publication)_
  - “increased demand for access to our metadata for machine learning and generative artificial intelligence model training” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c019** Shutterstock says its metadata customers range from large technology and media companies to start-ups.  
  _offer · filing · as of 2026-08-07 (publication)_
  - “Our metadata customer base ranges from large technology and media companies to smaller start-up organizations.” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c047** Shutterstock's Data, Distribution, and Services revenue rose 16% to $203.3 million in 2025, driven by metadata sales and delivery plus Distribution and Services growth.  
  _number · filing · as of 2026-02-17 (publication)_ · **203.3 USD million** (GAAP revenue, Data, Distribution, and Services offering (data licensing not broken out); per year)
  - “Services revenues increased by 16%, to $203.3 million in 2025” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Q4/FY2025 results release (the profile cites the 10-K). The release adds that DDS was 21% of 2025 revenue and gives the same drivers.
    - “Data, Distribution, and Services product offering increased 16% as compared to 2024, to $203.3 million” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q4 and FY2025 results), SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000007/a2025-q4_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote shows 16% and $203.3M but not the drivers the statement adds; the 10-K's next sentence does: 'increased primarily from the sale and delivery of metadata to new and existing customers as well as growth in our Distribution and Services offerings'.
- **c048** Shutterstock attributes its 2025 Data, Distribution, and Services growth mainly to sale and delivery of metadata to new and existing customers.  
  _outcome · filing · as of 2026-02-17 (publication)_
  - “increased primarily from the sale and delivery of metadata to new and existing customers” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. Q4/FY2025 results release (the profile cites the 10-K); same wording in both.
    - “increased primarily from the sale and delivery of metadata to new and existing customers” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q4 and FY2025 results), SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000007/a2025-q4_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c049** Shutterstock's data offering revenue grew 15% in 2024.  
  _number · filing · as of 2026-02-17 (publication)_ · **15 percent change year on year** (data offering revenue, FY2024 vs FY2023; per year)
  - “primarily driven by growth in our data offering, which grew 15% in the twelve months ended December 31, 2024” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. 2024 10-K (the profile cites the 2025 10-K's prior-year comparison). DDS rose 28% to $175.3M in 2024.
    - “growth in our data offering, which grew 15% in the twelve months ended December 31, 2024” — Shutterstock, Inc. Form 10-K for 2024, filed with the SEC 2025-02-25, <https://www.sec.gov/Archives/edgar/data/1549346/000154934625000011/sstk-20241231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c056** Shutterstock says over 3.5 million customers in more than 150 countries licensed content in 2025.  
  _number · filing · as of 2026-02-17 (publication)_ · **3.5 million customers** (customers licensing revenue-generating content, all offerings, FY2025 (lower bound 'over'); per year)
  - “over 3.5 million customers in more than 150 countries licensed revenue-generating content” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c108** Shutterstock says its training data powers systems built by large technology companies including OpenAI.  
  _outcome · vendor_stated · as of 2026-03-19 (publication)_
  - “powering systems built by some of the world's largest technology companies, including OpenAI” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch reports the six-year OpenAI licence from Shutterstock's 11 July 2023 announcement. The 2025 10-K says 'Our metadata customer base ranges from large technology and media companies to smaller start-up organizations' but names no customer. OpenAI's own site was not reachable by navigation; no search available. That OpenAI's current systems still use the data is not independently shown.
    - “Over the next six years, OpenAI will license data from Shutterstock, including images, videos and music” — TechCrunch (Kyle Wiggers, 2023-07-11), <https://techcrunch.com/2023/07/11/shutterstock-expands-deal-with-openai-to-build-generative-ai-tools/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The 19 March 2026 release says 'powering systems built by some of the world's largest technology companies, including OpenAI'.
- **c109** Shutterstock names Black Forest Labs, Runway and ElevenLabs among the AI companies it supplies.  
  _outcome · vendor_stated · as of 2026-03-19 (publication)_
  - “Shutterstock also supports global brands and startups like Black Forest Labs and Runway” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-announces-major-expansion-of-licensed-training-datasets-to-power-the-next-generation-of-generative-ai-302718050.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source naming Black Forest Labs, Runway or ElevenLabs as Shutterstock data customers was reachable. The 2025 10-K, the Q1 and Q2 2026 filings and results releases name no AI customer; runway.com/news does not mention Shutterstock. No search available (WebSearch not offered in this run), so partner-side announcements could not be looked for.
  - verifier (scope): **quote_incomplete** — The quote names only Black Forest Labs and Runway. ElevenLabs is in the next clause: 'as well as AI research and product companies, like ElevenLabs'. The release says Shutterstock 'supports' them, which is looser than 'supplies'.
- **c115** Shutterstock describes itself as a strategic partner to NVIDIA, Meta, OpenAI and Runway.  
  _outcome · vendor_stated · as of 2025-10-07 (publication)_
  - “Strategic partner to industry leaders like NVIDIA, Meta, OpenAI, Runway and others” — PR Newswire (Shutterstock press release), <https://www.prnewswire.com/news-releases/shutterstock-builds-on-data-licensing-strength-with-new-ai-services-for-model-training-and-evaluation-302576366.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: fuzzy 0.90
  - verifier (blind): **confirmed_relayed** — Relays Shutterstock's own 2023 account; covers NVIDIA, Meta and (same article) OpenAI, but not Runway. runway.com/news does not mention Shutterstock; the NVIDIA newsroom's own search returned no items for 'shutterstock'. No search available for a Runway-side source.
    - “Shutterstock has established licensing agreements with Nvidia, Meta, LG and others” — TechCrunch (Kyle Wiggers, 2023-07-11), <https://techcrunch.com/2023/07/11/shutterstock-expands-deal-with-openai-to-build-generative-ai-tools/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Matches the 7 October 2025 release; vendor self-description.
- **c116** Shutterstock's Data, Distribution, and Services revenue rose 256% to $137.3 million in 2023, mainly from its data offering and Giphy.  
  _number · filing · as of 2024-02-21 (publication)_ · **137.3 USD million** (GAAP revenue, Data, Distribution, and Services offering, FY2023 (data not broken out); per year)
  - “Data, Distribution, and Services product offering increased 256% as compared to 2022, to $137.3 million” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/a2023-q4_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — SEC EDGAR filing by Shutterstock itself (different domain; filing source class), a regulatory record rather than vendor marketing but not a third party's assessment. 2023 10-K (the profile cites the Q4 2023 results release). Drivers: the data offering 'accounted for $84.9 million of the growth from 2022 to 2023' plus $10.5M of Giphy revenue.
    - “Data, Distribution, and Services revenues increased by 256%, to $137.3 million in 2023” — Shutterstock, Inc. Form 10-K for 2023, filed with the SEC 2024-02-26, <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000007/sstk-20231231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote shows 256% and $137.3M but not the drivers; the 2023 10-K does: the data offering 'accounted for $84.9 million of the growth from 2022 to 2023' plus '$10.5 million of revenue generated from Giphy'.
- **c117** Shutterstock attributed part of its 2025 adjusted EBITDA growth to data deal revenue.  
  _outcome · filing · as of 2026-02-17 (publication)_
  - “primarily due to the contribution from Envato and data deal revenue” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000007/a2025-q4_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. Context: 'Adjusted EBITDA of $271.8 million for 2025 increased $24.7 million or 10%'. The 2025 10-K does not make this attribution.
    - “primarily due to the contribution from Envato and data deal revenue” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q4 and FY2025 results), SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000007/a2025-q4_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok**
- **c119** The February 2024 investor deck's opportunity-sizing slide lists, first in its Data column, 10 anchor customers at $10 million annual revenue per customer.  
  _number · vendor_stated · as of 2024-02-21 (publication)_ · **10 USD million per customer per year** (annual revenue per anchor data customer as laid out on the deck slide (10 anchor customers); layout-dependent reading, vendor-stated; per year)
  - “Opportunity Sizing Data Distribution Services Today Anchor Customers 10 Annual Revenue per Customer $10 million” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Only the profile's own source URL (an SEC filing) states this; I re-found and re-read it blind and it matches, but that is not a second source, so it is not counted as independent. By its nature this company-level detail is published only in Shutterstock's own filings; no search available (WebSearch not offered in this run) to look for press restating it. Deck Exhibit 99.2 dated 21 February 2024; slide source 'Management estimates'. The row is labelled 'Today' and the next Data row ('Growth Path') is 'Customers 150+ Annual Revenue per Customer $1 million'.
    - “Opportunity Sizing Data Distribution Services Today Anchor Customers 10 Annual Revenue per Customer $10 million” — Shutterstock, Inc. Form 8-K Exhibit 99.2 'Shutterstock 2027: Long-range Financial Targets', SEC 2024-02-21, <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000004/shutterstock2027_long-ra.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The statement is careful about layout. The row label is 'Today', so the deck presents 10 anchor customers at about $10M each as the current state in February 2024, with 150+ customers at $1M as the growth path; source 'Management estimates'.
- **c127** OpenAI's CEO said in October 2022 that data licensed from Shutterstock was critical to training DALL-E.  
  _outcome · press_relayed · as of 2022-10-25 (publication)_
  - “The data we licensed from Shutterstock was critical to the training of DALL-E” — TechCrunch, <https://techcrunch.com/2022/10/25/shutterstock-openai-dall-e-2/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Same URL as the profile's own source, so not a second source. TechCrunch attributes the words to Sam Altman 'in another supporting statement' within Shutterstock's 25 October 2022 announcement, so the article relays a statement issued through the vendor's release. OpenAI's own site could not be reached by navigation; no search available (WebSearch not offered in this run).
    - “The data we licensed from Shutterstock was critical to the training of DALL-E” — TechCrunch (Natasha Lomas, 2022-10-25), <https://techcrunch.com/2022/10/25/shutterstock-openai-dall-e-2/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote supports the statement, but the profile's source_class 'independent_press' is too strong: TechCrunch quotes Altman's 'supporting statement' from Shutterstock's release, so 'press_relaying_vendor' fits (the claim's origin press_relayed is right).
- **c129** TechCrunch reported in July 2023 that OpenAI would license Shutterstock images, videos, music and metadata over six years.  
  _event · press_relayed · as of 2023-07-11 (publication)_
  - “Over the next six years, OpenAI will license data from Shutterstock, including images, videos and music” — TechCrunch, <https://techcrunch.com/2023/07/11/shutterstock-expands-deal-with-openai-to-build-generative-ai-tools/> · independent_press · retrieved 2026-10-01 · quote check: exact

### regulation

- **c058** Shutterstock's 10-K flags the EU Data Act and EU AI Act as laws that may restrict the use of data in its products.  
  _terms · filing · as of 2026-02-17 (publication)_
  - “may impose additional rules and restrictions on the use of the data in our products” — U.S. SEC (Shutterstock filing), <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Added by the verifier

- **v001** Shutterstock's Data, Distribution, and Services revenue fell 47% to $21.0 million in Q1 2026.  
  _number · filing · as of 2026-04-28 (publication)_ · **21.0 USD million** (GAAP revenue of the Data, Distribution, and Services offering, Q1 2026 (data not broken out); per quarter)
  - “decreased by $18.7 million, or 47%, as compared to the first quarter of 2025, to $21.0 million” — Shutterstock, Inc. Form 8-K Exhibit 99.1 (Q1 2026 results), SEC 2026-04-28, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000021/a2026-q1_exx991xpressrelea.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** Shutterstock had no refund reserve liability for data deal contracts with customer cancellation rights at 31 December 2025.  
  _number · filing · as of 2026-02-17 (publication)_ · **0 USD million** (refund reserve liability for data deal contracts with cancellation rights, at 31 Dec 2025; as at 2025-12-31)
  - “As of December 31, 2025, the Company does not have a refund reserve liability.” — Shutterstock, Inc. Form 10-K for 2025, filed with the SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v003** Shutterstock recognised $5.0 million of 2025 revenue from reversing refund reserves held against data deal cancellation rights.  
  _number · filing · as of 2026-02-17 (publication)_ · **5.0 USD million** (revenue recognised in FY2025 from reversal of data deal refund reserves; per year)
  - “the Company recognized $ 5.0 million of revenue from the reversal of refund reserves” — Shutterstock, Inc. Form 10-K for 2025, filed with the SEC 2026-02-17, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v004** Shutterstock's data offering accounted for $84.9 million of the growth in its Data, Distribution, and Services revenue from 2022 to 2023.  
  _number · filing · as of 2024-02-26 (publication)_ · **84.9 USD million** (year-on-year increase in data offering revenue, FY2023 vs FY2022 (the only dollar figure for the data offering found); per year)
  - “growth in our data offering, which accounted for $84.9 million of the growth from 2022 to 2023” — Shutterstock, Inc. Form 10-K for 2023, filed with the SEC 2024-02-26, <https://www.sec.gov/Archives/edgar/data/1549346/000154934624000007/sstk-20231231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v005** Shutterstock tells contributors that full model releases, and the identity of models and contributors, are never shared with its computer vision dataset partners.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “full model releases are never shared, and the identity of models and contributors is never shared with computer vision” — Shutterstock Contributor help centre, <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund> · docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.public_prices` — blocked; tried <https://www.shutterstock.com/data-licensing>, <https://www.shutterstock.com/license>, <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo>
- `matrix.exclusivity_offered` — not_published; tried <https://www.shutterstock.com/data-licensing>, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm>
- `matrix.public_listing` — blocked; tried <https://www.shutterstock.com/data-licensing>, <https://www.shutterstock.com/developers/>, <https://huggingface.co/shutterstock>
- `matrix.buyer_vetting` — blocked; tried <https://www.shutterstock.com/data-licensing>, <https://www.shutterstock.com/help/en>
- `matrix.versioning` — not_published; tried <https://www.shutterstock.com/data-licensing>, <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo>
- `other.buyer_data_licence_text` — blocked; tried <https://www.shutterstock.com/data-licensing>, <https://www.shutterstock.com/license>, <https://www.shutterstock.com/help/en>
- `other.contributor_terms_current_text` — js_empty; tried <https://submit.shutterstock.com/legal/terms>
- `other.data_revenue_dollars` — not_published; tried <https://www.sec.gov/Archives/edgar/data/0001549346/000154934626000029/sstk-20260630.htm>, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm>
- `other.contributor_fund_total_paid` — not_published; tried <https://submit.shutterstock.com/help/en/articles/10594694-shutterstock-data-licensing-and-the-contributor-fund>
- `other.investor_site_and_independent_press` — blocked; tried <https://investor.shutterstock.com>, <https://investor.shutterstock.com/news-releases>
- `questions.Q4` — not_published; tried <https://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update>, <https://www.sec.gov/Archives/edgar/data/1549346/000154934626000008/sstk-20251231.htm>

## Conflicts

- c017, c026: Filings describe the data offering as licensing 'metadata' tied to assets, while the contributor help centre says datasets include content and metadata. They are probably the same product described narrowly and broadly; the buyer contract would settle it but was not reachable. (unresolved)
- c104, c090, c120: Library size is cited as 370M+ (AWS blog, 2021), 550M+ (AWS listing, undated) and 771M images (investor deck, February 2024). These are different dates rather than a contradiction; the newest filing-dated figure is 771M. (newer_wins_status)

## Leads, not cited

- <https://www.shutterstock.com/data-licensing> — Shutterstock's own data-licensing page (named in its March 2026 release); returned 403 to WebFetch.
- <https://submit.shutterstock.com/legal/terms> — Current contributor terms; renders client-side only, so the 2023 help-centre copy was used instead.
- <https://www.prnewswire.com/news-releases/shutterstock-brings-high-quality-images-videos-music-and-sound-effects-to-anthropics-claude-302849012.html> — 12 Aug 2026 content-distribution deal; not fetched, not a data-licensing deal on its face.
- <https://www.courtlistener.com/docket/69216944/elmatad-v-shutterstock-inc/> — S.D.N.Y. 2024 case against Shutterstock and Meta surfaced by a CourtListener search on AI terms; nature of suit is labour (FLSA), relevance unverified.
- <https://techcrunch.com/2025/01/07/getty-images-and-shutterstock-will-merge-to-form-37-billion-stock-photo-giant/> — Independent coverage of the merger announcement; not fetched.
