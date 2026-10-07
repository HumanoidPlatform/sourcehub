# DataSeeds.AI

crowd_capture · light · status: **active** · also known as DataSeeds, Dataseeds

> Rendered from `ledger/dataseeds-ai.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Off-the-Shelf Collection (off-the-shelf datasets; 'Sample Datasets' storefront at data.dataseeds.ai; Premium Partner Catalog for partner assets)” and its bespoke side “Custom Production / DataSeeds Production Cloud (on-demand datasets for bespoke content requests)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c012, c016, c007, c024 | DataSeeds (Zedge/GuruShots) licenses content it has secured rights to; the storefront seller is 'GuruShots Storefront'. The buyer licence itself is not published, and how Premium Partner Catalog assets are contracted is not stated. |
| economics_model | principal_margin | c012, c025, c007 | DataSeeds sells content it holds rights to, and custom data it produces, at prices quoted on request. Terms for Premium Partner Catalog and production-partner content are not published. |
| who_pays_fee | unknown |  | Operator sells its own licensed inventory; whether any fee applies to partner-catalogue content, or what Datarade charges for the storefront, is not published. |
| supply_models | contributor_uploads, partner_licensed | c011, c040, c032, c015, c056, c055 | GuruShots competition submissions and Zedge creator communities (contributor_uploads, including custom collection to brief via challenges and mission apps); Premium Partner Catalog and production partners (partner_licensed). Whether data made for one client is resold is not published. |
| custody_model | copy_to_buyer | c031 | Storefront listings name S3 bucket, UI export and API delivery; no share-in-place option is shown. Delivery practice for custom orders is not documented. The free sample is hosted on Hugging Face. |
| transaction_mode | contact_sales | c025, c041, c046 | Every listing opened shows 'Pricing available upon request'; the contact form qualifies budget over USD 5k. Only the Apache-2.0 sample is a free download. |
| public_prices | none | c025, c026 | No price on any storefront or off-the-shelf page opened; filings report a six-figure order and a 25x repeat order but no unit prices. |
| licence_model | negotiated | c041, c026, c035, c022, c037 | No standard buyer licence is published; licensing is arranged through sales, with one-off, monthly, yearly and usage-based forms named on listings. The free sample alone is Apache 2.0. Inferred from the absence of a published licence plus sales-led licensing. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c023, c047 | Storefront and off-the-shelf dataset pages are visible without login and listed in the site's sitemap. |
| buyer_vetting | unknown |  | The contact form asks whether budget exceeds USD 5k (c_budget); no vetting policy is published. |
| sample_mechanics | free_sample_download | c037, c038, c030, c047 | A 7,772-image sample (DSD) is a free Apache-2.0 download on Hugging Face; individual catalogue listings offer samples only on request. |
| versioning | unknown |  |  |
| human_subject_consent_docs | asserted_only | c027, c036, c039 | Listings assert explicit contributor consent and documented rights; no listing or page says releases are handed to the buyer. |
| contributor_pay_model | unknown | c054, c061, c059 | Zedge says mission apps integrate contributor payments, and GuruShots gives in-game Coins per challenge entry, but no source reached by WebFetch says how photographers are paid when their photos are licensed as data. |
| catalogue_plus_custom | both | c014, c063, c050, c018 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c058, c019, c043, c062 | Quality rests on GuruShots community peer-voting plus DataSeeds' own human review and annotation; benchmark results are DataSeeds' own. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Zedge names AI developers and enterprises (tech companies, stock sites, e-commerce) as buyers; the first six-figure order came from a repeat big-tech customer whose second order was ~25x the first. Revenue is lumpy with few deals; units and why buyers pick catalogue over custom are not published. | c013, c004, c049, c051, c052, c005, c006 |
| Q2 | partial | DataSeeds runs its own site and also lists its catalogue through a white-label Datarade storefront (data.dataseeds.ai, 49 products); what the Datarade channel brings it is not stated. | c023, c024 |
| Q3 | partial | Inventory comes from GuruShots competition submissions and Zedge creator communities (company says rights secured for only part of the library), custom collection via challenges, mission apps and a Production Cloud network, plus a Premium Partner Catalog and production partners. Catalogue size is stated as 30M rights-cleared (10-K) vs 100M+/150M+ (marketing). | c011, c012, c008, c009, c010, c044, c055, c056, c015, c059 |
| Q4 | unknown | No published terms on resale of commissioned data. GuruShots changed its terms in January 2025 to add an AI-training licence, but that text was only reachable in a JS bundle (see unknowns). |  |
| Q5 | partial | DataSeeds/GuruShots licenses content it holds rights to (storefront seller: GuruShots Storefront) and claims provenance and rights ownership for produced assets; buyer licence, warranties and indemnities are not published. | c012, c016, c024 |
| Q6 | partial | Listings offer S3 bucket, UI export and API delivery to the buyer; the free sample sits on Hugging Face. Custom-order delivery is not documented. | c031, c037 |
| Q7 | partial | DataSeeds asserts creator opt-in, explicit consent for face video, and documented rights; Zedge says mission apps embed documentation and consent, and warns contributors may decline licensing. No release documents are shown to buyers. | c039, c027, c036, c054, c053 |
| Q8 | partial | Only the sample has a published licence (Apache 2.0); paid data is sold under unpublished 'commercial-grade' terms with one-off, monthly, yearly or usage-based forms. Nothing on exclusivity, audit or fingerprinting was found. | c037, c022, c026, c035, c028 |
| Q9 | sourced | Contact-sales only: listings say 'Pricing available upon request', the contact form qualifies budget over USD 5k, and the dataset card routes licensing to sales email; the operator sells its own rights-held inventory. | c025, c046, c041, c012 |
| Q10 | partial | A listing is a Datarade product page (volume, delivery methods, pricing models, sample request) or a dataset page on dataseeds.ai; orders, entitlements and versioning are not documented. | c023, c047, c026, c031 |
| Q11 | sourced | Before purchase: a free 7,772-image Apache-2.0 sample, samples on request per listing, per-image popularity scores from GuruShots competitions, blind peer voting, expert review, and a DataSeeds-authored arXiv benchmark claiming gains over commercial tagging APIs such as AWS Rekognition (vendor's own evidence). | c038, c037, c030, c033, c060, c043, c020, c021, c042, c058 |
| Q12 | sourced | DataSeeds says its focus is custom production (DataSeeds Production Cloud, on-demand challenges, 72-hour custom sourcing) and it keeps an Off-the-Shelf Collection plus a Premium Partner Catalog; the same GuruShots/Zedge contributor base feeds both. | c014, c063, c050, c018, c034, c015, c045 |

## Claims

### positioning

- **c007** Zedge describes DataSeeds.AI as its B2B business delivering managed, multimodal datasets that are ethically sourced and rights-cleared.  
  _offer · filing · as of 2026-06-11 (publication)_
  - “DataSeeds.AI is our B2B business, delivering managed, multimodal datasets that are ethically sourced, rights-cleared” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026067834/ea029448101ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c008** Zedge's fiscal 2025 10-K describes DataSeeds.AI as a business-to-business marketplace with a catalogue of over 30 million fully rights-cleared images.  
  _number · filing · as of 2025-10-28 (publication)_ · **30000000 images** (rights-cleared images in the DataSeeds catalogue per the FY2025 10-K; point in time)
  - “catalog of over 30 million high-quality, fully rights-cleared images” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The fact is what Zedge's own 10-K says, so only that filing can carry it. Re-read at the profile's own URL (FY2025 10-K, filed 28 Oct 2025); it says 'a business-to-business marketplace offering access to our rapidly growing catalog of over 30 million ... fully rights-cleared images'. Not counted as independent. Zedge's own size figures diverge: the June 2025 arXiv DSD paper gives a '100 million-plus image catalog' and the website 150M+. By Jun-Aug 2026 Zedge's filings describe DataSeeds as managed data creation rather than a marketplace (profile c007).
  - verifier (scope): **quote_incomplete** — The quote shows the 30 million figure but not the 'business-to-business marketplace' description that the statement also asserts. The words 'a business-to-business marketplace offering access to our rapidly growing catalog' would show it.
- **c009** DataSeeds.AI's website says its catalogue holds 150M+ photographs, human-ranked via a proprietary voting system.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **150000000 photographs** (catalogue size as stated on the vendor homepage; rights status not stated; point in time)
  - “A catalog of 150M+ high-quality photographs, human-ranked via a proprietary voting system” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A figure that exists only on the vendor's own website. It is not corroborated by Zedge's filings: the FY2025 10-K says 'over 30 million high-quality, fully rights-cleared images', and the June 2025 arXiv DSD paper says 'DataSeeds.AI's 100 million-plus image catalog'. The 150M+ figure evidently counts photos not yet rights-cleared, so it should not be read as 150M licensable images.
  - verifier (scope): **scope_ok** — Correctly framed as what the website says. It conflicts with the 10-K's 30M rights-cleared figure and the June 2025 100M+ figure (profile c008, c010, c044); the profile's conflicts list should carry this.
- **c010** At launch in June 2025 Zedge said the GuruShots catalogue behind DataSeeds.AI held over 100 million images.  
  _number · vendor_stated · as of 2025-06-11 (publication)_ · **100000000 images** (GuruShots historical catalogue size stated by Zedge at launch; point in time)
  - “over 100 million images” — Zedge, Inc., <https://blog.zedge.net/zedge-announces-dataseeds-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** Zedge's 10-K says it has begun to use the library of photographs GuruShots players submitted to GuruShots competitions as a dataset for DataSeeds.  
  _offer · filing · as of 2025-10-28 (publication)_
  - “the extensive library of photographs generated by GuruShots players through submissions to GuruShots' competitions as a dataset” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The fact is what Zedge's own 10-K says. Re-read at the profile's own URL: 'we have begun to utilize the extensive library of photographs generated by GuruShots players through submissions to GuruShots' competitions as a dataset for our emerging DataSeeds offering'. Not counted as independent. The arXiv DSD paper agrees on the origin ('The DSD is derived from GuruShots, a popular online photography game').
  - verifier (scope): **quote_incomplete** — The quote omits the verb, so it does not show that Zedge 'has begun to use' the library. The words 'we have begun to utilize the extensive library of photographs generated by GuruShots players' would show it.
- **c015** DataSeeds.AI invites buyers seeking premium pre-existing assets or collaborative datasets to ask about a Premium Partner Catalog.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “please ask us about our Premium Partner Catalog” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c017** DataSeeds.AI says it draws on Zedge's community of 25 million monthly users and a network of vetted specialists.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **25000000 monthly users** (Zedge app community size as stated by DataSeeds; not a count of data contributors; per month)
  - “We leverage Zedge's community of 25 million monthly users and a worldwide network of vetted specialists” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** DataSeeds says its face ID videos are collected through controlled contribution pipelines.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Videos are collected through controlled contribution pipelines” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** DataSeeds says the images in its flower dataset were collected through a proprietary gamified platform for photographers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “the images are collected through a proprietary gamified platform for photographers” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c040** The DataSeeds sample dataset was contributed by the GuruShots photography platform.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Generously contributed to the community by the GuruShots photography platform” — DataSeeds.AI, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** In June 2025 DataSeeds described GuruShots' catalogue as 30M+ rights-cleared images.  
  _number · vendor_stated · as of 2025-06-11 (page_dated)_ · **30000000 images** (rights-cleared GuruShots images as stated by DataSeeds, June 2025; point in time)
  - “30M+ and growing, rights-cleared images enriched with EXIF metadata, tags and geolocation diversity” — DataSeeds.AI, <https://www.dataseeds.ai/post/zedge-s-dataseeds-ai-releases-foundational-dataset-for-computer-vision-and-generative-ai-in-collabor> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Zedge says DataSeeds sources content through Zedge's creator communities, mission-focused apps and sites built per customer brief, and its Production Cloud.  
  _offer · filing · as of 2026-08-31 (publication)_
  - “mission-focused mobile applications and websites built around individual customer briefs” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c056** Zedge says DataSeeds also draws on broader crowdsourcing and a network of production partners to deliver data built to customer specifications.  
  _offer · filing · as of 2026-09-30 (publication)_
  - “GuruShots photography community, as well as broader crowdsourcing and a network of” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026104861/ea030698401ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### listing

- **c023** DataSeeds.AI's public data-products storefront at data.dataseeds.ai is powered by Datarade and listed 49 data products when retrieved.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Powered by Datarade” — DataSeeds.AI, <https://data.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Showing 1-10 of 49 results” — DataSeeds.AI, <https://data.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** On the Datarade-powered storefront the seller of the DataSeeds listings is named GuruShots Storefront.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “GuruShots Storefront” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The seller name on a vendor-run storefront exists only there. One check on the platform operator's own site: Datarade's product search for 'dataseeds' (datarade.ai/search/products?keywords=dataseeds) lists the provider as 'DataSeeds.AI' with 49 datasets and returns no 'GuruShots' match. That page is JS-rendered, so it could not be quoted, and the provider profile URL was not found (the guessed /data-providers/dataseeds-ai/profile returned 404). On Datarade's main marketplace, at least, the seller appears as DataSeeds.AI.
  - verifier (scope): **scope_wrong** — On the listing pages, 'GuruShots Storefront' is the storefront's site name and logo (it links to dataseeds.ai, with 'Powered by Datarade' at the foot); no seller or provider entity is named on the listing. The quote is the bare string, so it cannot show a seller role. Datarade's own marketplace search names the provider 'DataSeeds.AI'. The claim should not support an operator_role finding about who the licensor of record is.
- **c047** DataSeeds' off-the-shelf Global Faces Dataset page lists 100,000+ images and videos and offers 'Get a sample' with no price or licence shown.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A large-scale faces dataset containing 100,000+ images and videos” — DataSeeds.AI, <https://www.dataseeds.ai/off-the-shelf-datasets-1/global-faces-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Get a sample” — DataSeeds.AI, <https://www.dataseeds.ai/off-the-shelf-datasets-1/global-faces-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c019** Zedge says DataSeeds.AI data combines photographic peer-ranking with structured human-in-the-loop annotation.  
  _offer · vendor_stated · as of 2025-06-11 (publication)_
  - “photographic peer-ranking, structured human-in-the-loop annotation” — Zedge, Inc., <https://blog.zedge.net/zedge-announces-dataseeds-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c020** DataSeeds says models fine-tuned on its sample dataset capture details often ignored by commercial APIs like AWS Rekognition (vendor's own benchmark).  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “details often ignored by off-the-shelf commercial APIs like AWS Rekognition” — DataSeeds.AI, <https://www.dataseeds.ai/research> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “details often ignored by off-the-shelf commercial APIs like AWS Rekognition” — Zedge, Inc., <https://blog.zedge.net/zedge-announces-dataseeds-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: In the DSD paper (arXiv 2506.05673, co-authored by a Zedge employee), AWS Rekognition's label detection recovered only 18.96% of the DSD's human labels; the paper did not benchmark the models it fine-tuned on the DSD against Rekognition. — The paper compares Rekognition labels with the DSD's human annotations: 'Of the 7,926 unique human labels, only 1,503 (18.96%) were recovered through machine inference'. Separately, it reports fine-tuning gains for LLaVA-NeXT and BLIP2 over their base models. No table or figure compares the fine-tuned models' outputs with Rekognition's, and the words 'chalkboard' and 'handwritten' do not appear in the paper. The evidence therefore supports 'human annotations capture what Rekognition misses', not 'fine-tuned models capture what Rekognition misses'. The paper is not independent: co-author Gediminas Vasiliauskas is affiliated with Zedge, and it is an arXiv preprint, not peer reviewed.
    - “AWS Rekognition label detection API against DSD's human-curated annotations.” — arXiv (Abdoli, Lewin, Vasiliauskas, Schonholz, 'Peer-Ranked Precision', v3 11 Jun 2025), <https://arxiv.org/html/2506.05673v3> · academic · retrieved 2026-10-01 · quote check: fuzzy 0.89
  - verifier (scope): **scope_wrong** — The vendor sentence does say this: 'After training on DSD data, both models began to reliably identify small but semantically significant objects... details often ignored by off-the-shelf commercial APIs like AWS Rekognition'. Calling it the vendor's 'benchmark' claims more than the evidence shows. The chalkboard and handwritten-text example does not appear in the paper (a honeybee image caption does), and the paper's only Rekognition measurement compares Rekognition with human labels, not with the fine-tuned models. The quote also omits the subject ('both models'), so on its own it does not show the fine-tuned-model claim.
- **c021** DataSeeds says models trained on its sample dataset outperform commonly used datasets and traditional tagging APIs in precision tasks.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “outperforms commonly used datasets and traditional tagging APIs in precision tasks” — DataSeeds.AI, <https://www.dataseeds.ai/research> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** DataSeeds storefront listings offer a 'Request Sample Access' button rather than a downloadable sample.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request Sample Access” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Request Sample Access” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** Each image in the DataSeeds flower dataset carries a popularity score based on its performance in GuruShots competitions.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each image is assigned a popularity score based on its performance in GuruShots competitions.” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** The DataSeeds sample dataset on Hugging Face contains 7,772 peer-ranked, fully annotated photographic images.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **7772 images** (free public sample dataset size on Hugging Face; point in time)
  - “7,772 peer-ranked, fully annotated photographic images” — DataSeeds.AI, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The paper explains the number. The DSD was 'approximately 10,610' images, and 'we removed 2,838 images that contained subjects of a sensitive nature, including people's faces', leaving 7,772 public (missed v003). The source is on a different domain and of a different class from the profile's Hugging Face card, but one co-author is affiliated with Zedge, so it is only partly independent.
    - “The remaining 7,772 images are available for AI training at https://huggingface.co/” — arXiv (Abdoli, Lewin, Vasiliauskas, Schonholz, 'Peer-Ranked Precision', v3 11 Jun 2025), <https://arxiv.org/html/2506.05673v3> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The Hugging Face card says 7,772. The public sample is what was left of approximately 10,610 images after 2,838 with sensitive content, including faces, were removed (arXiv 2506.05673).
- **c042** A June 2025 arXiv paper by DataSeeds-affiliated authors describes the sample dataset as a small fraction of a 100 million-plus image catalogue.  
  _offer · vendor_stated · as of 2025-06-11 (publication)_
  - “Representing a small fraction of DataSeeds.AI's 100 million-plus image catalog” — arXiv, <https://arxiv.org/abs/2506.05673> · academic · retrieved 2026-10-01 · quote check: missing 0.64
- **c043** DataSeeds says each sample-dataset image was ranked by GuruShots players and then annotated by expert reviewers.  
  _offer · vendor_stated · as of 2025-06-11 (page_dated)_
  - “Each image was ranked by players of the game, and subsequently, each image was annotated by expert reviewers” — DataSeeds.AI, <https://www.dataseeds.ai/post/zedge-s-dataseeds-ai-releases-foundational-dataset-for-computer-vision-and-generative-ai-in-collabor> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.94
- **c048** DataSeeds' off-the-shelf Text-Rich Image Dataset page offers a sample on request via a 'Get a sample' button.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get a sample” — DataSeeds.AI, <https://www.dataseeds.ai/off-the-shelf-datasets-1/text-rich-image-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** DataSeeds says every asset in a custom production run is vetted by its network of human reviewers against the buyer's specifications.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every asset in a custom production run is vetted by our network of human reviewers” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** GuruShots' help centre says challenge voting is blind, so voters do not know whose photo they are voting for.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The voting system is 'blind' so you don't know who you are voting for” — GuruShots, <https://support.gurushots.com/support/solutions/articles/5000640118-how-does-the-voting-system-work-> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** DataSeeds calls the GuruShots Quality Engine a source of data peer-ranked by a proprietary voting system.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The GuruShots Quality Engine, where data is peer-ranked via a proprietary voting system” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c041** The DataSeeds dataset card directs buyers wanting licensing or customised dataset sourcing to contact sales by email.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “To inquire about licensing or customized dataset sourcing, contact:” — DataSeeds.AI, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A contact instruction on the vendor's own Hugging Face dataset card; no other source would carry it.
  - verifier (scope): **quote_incomplete** — The quote ends at 'contact:'; the email address (sales@dataseeds.ai) that follows on the card is what shows the contact is by email to sales.
- **c046** DataSeeds' contact form asks prospective buyers whether their budget is over USD 5,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5000 USD** (buyer budget threshold asked in the contact form; not a price; per project)
  - “Is your budget over $5k?” — DataSeeds.AI, <https://www.dataseeds.ai/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c025** DataSeeds storefront listings (for example the face ID video and flower image datasets) show no price, only 'Pricing available upon request'.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pricing available upon request” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Pricing available upon request” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — How prices are shown on the vendor's own storefront. None of the Zedge filings and releases fetched publishes a DataSeeds price, which fits 'on request': the FY2025 10-K, the earnings releases of Dec 2025 and Jun 2026, the Jun 2026 investor presentation, and the Aug and Sep 2026 releases.
  - verifier (scope): **scope_ok** — Both listings show 'Pricing available upon request'.
- **c026** The DataSeeds flower-image listing offers one-off purchase, monthly licence, yearly licence and usage-based pricing models, without prices.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Yearly License” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c012** Zedge's 10-K says it has secured rights to license only a portion of the GuruShots library, including for AI training, and is securing rights to more.  
  _terms · filing · as of 2025-10-28 (publication)_
  - “we have secured rights to license a portion of this library for various applications, including AI training” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The fact is what Zedge's own 10-K says, so only that filing can carry it. Re-read at the profile's own URL: 'we have secured rights to license a portion of this library for various applications, including AI training', continuing 'and we continue to expand the licensable catalog by securing rights to additional photographs'. The filing says 'a portion', not 'only a portion'; the meaning is the same. Not counted as independent.
  - verifier (scope): **quote_incomplete** — The quote shows that rights to only a portion were secured, but not the second half of the statement, that more are being secured. The words 'we continue to expand the licensable catalog by securing rights to additional photographs' would show it.
- **c016** DataSeeds.AI says every asset produced through its production cloud comes with full provenance tracking and complete rights ownership.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every asset produced through our cloud comes with full provenance tracking and complete rights ownership” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Zedge said at launch that DataSeeds.AI datasets come with commercial-grade licensing terms, without publishing those terms.  
  _terms · vendor_stated · as of 2025-06-11 (publication)_
  - “with commercial-grade licensing terms” — Zedge, Inc., <https://blog.zedge.net/zedge-announces-dataseeds-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** The DataSeeds face ID video listing says the data is vetted for commercial and research use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Vetted for commercial and research use” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c035** The DataSeeds flower-image listing claims transparent licensing for both commercial and academic use, without linking a licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “offers transparent licensing for both commercial and academic use” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c037** DataSeeds publishes a free sample dataset (DSD) on Hugging Face under the Apache 2.0 licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “license: apache-2.0” — DataSeeds.AI, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c031** DataSeeds storefront listings name S3 bucket, UI export and API delivery as delivery methods for the data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “S3 Bucket” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “UI Export” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Delivery options on the vendor's own storefront listings. One check: the Datarade marketplace search page is JS-rendered and showed no listing detail.
  - verifier (scope): **quote_incomplete** — The quotes show 'S3 Bucket' and 'UI Export' but no API option. Both listings also name 'REST API', 'SOAP API' and 'Feed API'. These are the Datarade template's standard delivery options, so they are not evidence that DataSeeds actually delivers by each route.

### vetting

- **c027** The DataSeeds face ID video listing states explicit contributor consent for face ID video usage and documented rights, without offering the documents.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Explicit contributor consent for face ID video usage” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Documented rights and usage permissions” — DataSeeds.AI, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A consent statement on the vendor's own listing. Related context from other sources: the DSD paper says faces were removed before the public release ('we removed 2,838 images that contained subjects of a sensitive nature, including people's faces'), and the FY2025 10-K says nothing about releases from people depicted. Nothing found shows consent documents being given to buyers.
  - verifier (scope): **scope_ok** — Both phrases sit under the listing's 'Licensing & Compliance' heading. The listing offers only a 'Request Sample Access' button, and no consent documents or release forms appear, which supports 'without offering the documents'. The consent asserted is the contributor's; nothing is said about third parties shown in the videos.
- **c036** The DataSeeds annotated-image listing says all images are sourced through authorized channels with documented usage rights.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All images are sourced through authorized channels. Usage rights and permissions are documented.” — DataSeeds.AI, <https://data.dataseeds.ai/products/annotated-image-data-for-ai-training-dataseeds-ai-dataseeds-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c039** DataSeeds' dataset card says its data is backed by structured consent frameworks and traceable rights, with active opt-in from creators.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Backed by structured consent frameworks and traceable rights, with active opt-in from creators” — DataSeeds.AI, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c053** Zedge's 10-K warns that contributors may choose not to provide their content for licensing, which could limit the licensing business.  
  _terms · filing · as of 2025-10-28 (publication)_
  - “Contributors may choose not to provide their content for licensing purposes” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c054** Zedge says DataSeeds' mission-focused apps build onboarding, documentation and consent, and contributor payments into the collection workflow.  
  _architecture · filing · as of 2026-08-31 (publication)_
  - “onboarding, documentation and consent, contributor engagement and payments into the workflow.” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Zedge's own description of its apps. Re-read at the profile's own URL (SEC EX-99.1, 31 Aug 2026): 'integrating onboarding, documentation and consent, contributor engagement and payments into the workflow'. The blind step found only that URL, so it is not counted as independent. It describes how the apps are designed, not evidence that they work. The release ties the apps to 'individual customer briefs', meaning custom collection, not the catalogue.
  - verifier (scope): **scope_ok** — The quote is the tail of the sentence that begins 'The mission-focused applications guide contributors through specific collection requirements while integrating ...'. It applies to the custom-brief apps, not to the GuruShots catalogue.
- **c059** GuruShots' help centre says photographers keep full ownership and copyright of the photos they submit.  
  _terms · vendor_stated · as of 2022-07-19 (page_dated)_
  - “You maintain full ownership and copyright of all photos you submit.” — GuruShots, <https://support.gurushots.com/support/solutions/articles/5000640104-are-my-photos-protected-do-i-maintain-ownership-> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** GuruShots rewards every non-Flash challenge entry with 10 in-game Coins, a game prize rather than a data-licensing payment.  
  _number · vendor_stated · as of 2024-10-14 (page_dated)_ · **10 GuruShots Coins (virtual currency)** (paid by GuruShots to the photographer per challenge entry; not tied to dataset sales; per challenge entry)
  - “Every participation in a challenge (except Flash) rewards 10 Coins.” — GuruShots, <https://support.gurushots.com/support/solutions/articles/13000106424-what-types-of-prizes-are-there-> · docs · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c014** DataSeeds.AI says its focus is custom production and that it also maintains an Off-the-Shelf Collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “While our focus is custom production, we maintain an Off-the-Shelf Collection” — DataSeeds.AI, <https://www.dataseeds.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** Zedge said at launch that for on-demand requests DataSeeds.AI launches curated challenges to its contributor network and delivers targeted datasets.  
  _offer · vendor_stated · as of 2025-06-11 (publication)_
  - “launch curated challenges to its global network of contributors and deliver targeted datasets” — Zedge, Inc., <https://blog.zedge.net/zedge-announces-dataseeds-ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** The DataSeeds flower-image listing says custom datasets can be sourced on demand within 72 hours.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom datasets can be sourced on-demand within 72 hours” — DataSeeds.AI, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** DataSeeds says it collected 2,027 high-resolution shopping-bag photos within 48 hours for a prospective client (vendor case study).  
  _outcome · vendor_stated · as of 2025-05-27 (page_dated)_
  - “We collected 2,027 high-resolution photos within 48 hours” — DataSeeds.AI, <https://www.dataseeds.ai/post/solving-data-centric-ai-s-data-bottleneck-with-on-demand-data-a-data-seeds-case-study> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Zedge calls the DataSeeds Production Cloud its network of creative experts built to fulfil bespoke content requests.  
  _offer · filing · as of 2025-12-12 (publication)_
  - “DataSeeds Production Cloud, our network of creative experts built to fulfill bespoke content requests” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025120916/ea026930001ex99-1_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c063** DataSeeds.AI's About page says it offers both on-demand and off-the-shelf image, video and audio datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “both on-demand and off-the-shelf image, video and audio datasets” — DataSeeds.AI, <https://www.dataseeds.ai/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Zedge completed a private placement in September 2026 and said the proceeds would accelerate the growth of DataSeeds.AI, which it was still operating.  
  _status · filing · as of 2026-09-30 (publication)_
  - “accelerate the growth of DataSeeds.AI and broaden its capabilities” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026104861/ea030698401ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Closing date (25 Sep 2026) and gross proceeds of $7,675,000 come from the body of the 8-K/A filed 30 Sep 2026. The use-of-proceeds wording is in that filing's EX-99.1 press release, which is the profile's own source. The 8-K/A body is a different document in the same SEC accession: it is Zedge's own statement under SEC disclosure rules, not third-party reporting. The status is supported, but the newest leadership event matters: the 31 Aug 2026 8-K (EX-99.1) named Morris Berger Zedge CEO from 1 Oct 2026, with Jonathan Reich moving to President and COO (the profile has this as c002). WebSearch was unavailable and no independent press was reached.
    - “On September 25, 2026, the Company completed the private placement contemplated by the Purchase Agreement.” — Zedge, Inc. (Form 8-K/A, SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1667313/000121390026104861/ea0306984-8ka1_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote shows only the use of proceeds. It does not show that a private placement was completed, or when. The release headline 'Zedge Completes $7.7 Million Private Placement Led by Vice Chairman Howard Jonas' would show it, as would the 8-K/A sentence 'On September 25, 2026, the Company completed the private placement'.
- **c002** On 31 August 2026 Zedge announced a USD 7.5 million insider investment to accelerate its DataSeeds.AI strategy and a new Zedge CEO, Morris Berger.  
  _event · filing · as of 2026-08-31 (publication)_
  - “Zedge Accelerates DataSeeds.AI Strategy with $7.5 Million Insider Investment and Appointment of Morris Berger as CEO” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c003** Zedge's 30 September 2026 release said its goal is to build DataSeeds into a core business by expanding its team.  
  _event · filing · as of 2026-09-30 (publication)_
  - “Zedge's goal is to build DataSeeds into a core business by expanding its team,” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026104861/ea030698401ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The words are there. Re-read at the profile's own source (SEC EX-99.1, 30 Sep 2026): 'build DataSeeds into a core business by expanding its team, capabilities and reach across the AI data value chain'. The blind step found only the profile's own URL, so this is not counted as independent; a stated goal exists only in Zedge's own release. The statement drops 'capabilities and reach'. No search available.
  - verifier (scope): **scope_ok** — The quote supports the statement. The full goal also names 'capabilities and reach across the AI data value chain'.
- **c057** Zedge said in August 2026 that DataSeeds had signed its first deal for model evaluations.  
  _event · filing · as of 2026-08-31 (publication)_
  - “DataSeeds recently signed its first deal for model evaluations” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### demand

- **c004** Zedge says DataSeeds fulfilled its first six-figure order in fiscal 2026, for an existing customer described as a leading global technology company.  
  _outcome · filing · as of 2026-08-31 (publication)_
  - “In fiscal 2026, DataSeeds fulfilled its first six-figure order for an existing customer, a leading global technology” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “DataSeeds.AI fulfilled first six-figure order, demonstrating enterprise-scale execution capability” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026067834/ea029448101ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **unverifiable** — Zedge does say this. Re-read at the profile's own two sources, the SEC EX-99.1 exhibits of 31 Aug 2026 and 11 Jun 2026; the blind step found only those URLs, so it is not counted as independent. The 11 Jun release places the order in Q3 FY2026, Feb-Apr 2026 ('we fulfilled our first six-figure order this quarter'). No customer name or amount beyond 'six-figure' is given. No independent source (customer, press) was reachable: no search available.
  - verifier (scope): **scope_ok** — Both quotes support it. as_of 2026-08-31 is the release date; the order itself fell in Q3 FY2026 (Feb-Apr 2026), per the 11 Jun 2026 release ('this quarter').
- **c005** Zedge describes DataSeeds revenue as lumpy at this stage (third quarter of fiscal 2026, ended 30 April 2026).  
  _outcome · filing · as of 2026-06-11 (publication)_
  - “While revenue remains lumpy at this stage” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026067834/ea029448101ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c006** Zedge says DataSeeds was beginning to see interest from new prospects in the third quarter of fiscal 2026.  
  _outcome · filing · as of 2026-06-11 (publication)_
  - “we are beginning to see interest from new prospects, which strengthens our confidence in this offering” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026067834/ea029448101ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c013** Zedge's 10-K names technology companies, stock photo sites and ecommerce vendors as target DataSeeds customers.  
  _offer · filing · as of 2025-10-28 (publication)_
  - “technology companies, stock photo sites, ecommerce vendors” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c049** Zedge said DataSeeds' second order from an existing AI customer in Q1 fiscal 2026 was roughly 25 times the dollar size of the first.  
  _number · filing · as of 2025-12-12 (publication)_ · **25 multiple of first order value** (second order vs first order from the same customer, company-reported; absolute value not stated; one-off)
  - “an increased dollar size of roughly 25X from the customer's first order” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025120916/ea026930001ex99-1_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **unverifiable** — Zedge does say this. Re-read at the profile's own source (SEC EX-99.1, 12 Dec 2025, headed 'Zedge Reports First Quarter Fiscal 2026 Results'): 'with an increased dollar size of roughly 25X from the customer's first order', customer 'a leader in the AI space'. The blind step found only the profile's own URL. Neither order's dollar amount is disclosed, and the same release says the number of closed deals is 'still small'. No independent source reachable: no search available.
  - verifier (scope): **quote_incomplete** — The quote shows the 25X multiple but not that the order came from an AI customer, or that it fell in Q1 FY2026. Words that would show it: 'received our second order from an existing customer' with 'a leader in the AI space', in the release headed 'Zedge Reports First Quarter Fiscal 2026 Results'.
- **c051** Zedge said in March 2026 that DataSeeds had repeat customers placing larger orders.  
  _outcome · filing · as of 2026-03-12 (publication)_
  - “repeat customers placing larger orders” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026026946/ea028138401ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c052** Zedge said in March 2026 that DataSeeds revenue was early-stage and lumpy given the limited number of deals.  
  _outcome · filing · as of 2026-03-12 (publication)_
  - “revenue remains early-stage and lumpy given the limited number of deals” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390026026946/ea028138401ex99-1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Added by the verifier

- **v001** Zedge's fiscal 2025 10-K says a restructuring implemented in January 2025, which included cost cuts at GuruShots, reduced Zedge's global workforce by 22%.  
  _event · filing · as of 2025-10-28 (publication)_
  - “In total, our global workforce was reduced by 22%” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “We have cut costs at GuruShots, including as part of the restructuring implemented in January 2025” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** Zedge's fiscal 2025 10-K presents earning money from making their content available to third parties as a benefit to GuruShots players, without saying how or how much they are paid.  
  _terms · filing · as of 2025-10-28 (publication) · scope: GuruShots_
  - “enables players not only to have fun, but also to earn money while doing so” — Zedge, Inc., <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v003** Before releasing the DSD sample publicly, its authors removed 2,838 images that showed subjects of a sensitive nature, including people's faces, leaving 7,772 of about 10,610.  
  _number · academic · as of 2025-06-11 (publication) · scope: DataSeeds.AI Sample Dataset (DSD)_ · **2838 images removed** (removed from the approximately 10,610-image DSD before public release for sensitive content including faces; one-off)
  - “we removed 2,838 images that contained subjects of a sensitive nature, including people's faces.” — arXiv (Abdoli, Lewin, Vasiliauskas, Schonholz; one co-author affiliated with Zedge), <https://arxiv.org/html/2506.05673v3> · academic · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://data.dataseeds.ai/>, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds>, <https://www.dataseeds.ai/contact>, <https://www.dataseeds.ai/>
- `matrix.exclusivity_offered` — not_published; tried <https://www.dataseeds.ai/>, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds>, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds>, <https://data.dataseeds.ai/products/annotated-image-data-for-ai-training-dataseeds-ai-dataseeds-ai>, <https://www.dataseeds.ai/off-the-shelf-datasets-1/global-faces-dataset>, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md>, <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm>
- `matrix.buyer_vetting` — not_published; tried <https://www.dataseeds.ai/contact>, <https://data.dataseeds.ai/>, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds>
- `matrix.versioning` — not_published; tried <https://data.dataseeds.ai/>, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds>, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md>, <https://www.dataseeds.ai/off-the-shelf-datasets-1/global-faces-dataset>
- `matrix.contributor_pay_model` — js_empty; tried <https://gurushots.com/terms>, <https://support.gurushots.com/support/solutions/articles/13000106424-what-types-of-prizes-are-there->, <https://support.gurushots.com/support/solutions/articles/5000640104-are-my-photos-protected-do-i-maintain-ownership->, <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm>, <https://www.sec.gov/Archives/edgar/data/1667313/000121390026095319/ea030397901ex99-1.htm>
- `matrix.erasure_after_sale` — not_published; tried <https://www.dataseeds.ai/>, <https://gurushots.com/terms>, <https://gurushots.com/privacy>, <https://huggingface.co/datasets/Dataseeds/DataSeeds.AI-Sample-Dataset-DSD/raw/main/README.md>
- `questions.Q4` — js_empty; tried <https://gurushots.com/terms>, <https://www.dataseeds.ai/>, <https://www.sec.gov/Archives/edgar/data/1667313/000121390025103098/ea0262035-10k_zedge.htm>
- `other.buyer_licence_text` — not_published; tried <https://www.dataseeds.ai/>, <https://www.dataseeds.ai/contact>, <https://data.dataseeds.ai/products/1-5m-flower-images-ai-training-data-annotated-imagery-da-data-seeds>, <https://data.dataseeds.ai/products/2k-hours-of-face-id-video-data-ai-training-data-annotate-data-seeds>, <https://data.dataseeds.ai/products/annotated-image-data-for-ai-training-dataseeds-ai-dataseeds-ai>, <https://www.dataseeds.ai#consent>
- `other.gurushots_terms_ai_licence` — js_empty; tried <https://gurushots.com/terms>
- `other.independent_press` — not_found; tried <https://blog.zedge.net/>

## Conflicts

- c008, c044, c010, c009, c042: The 10-K and the June 2025 DataSeeds post give 30M+ rights-cleared images; Zedge's launch blog and the arXiv paper give 100M+ and the live homepage 150M+ without saying they are rights-cleared. Likely total GuruShots library vs licensable subset, but no source reconciles them. (unresolved)

## Leads, not cited

- <https://gurushots.com/terms> — Angular page, empty to WebFetch. A shell fetch of the site's JS bundle showed Terms 'Effective Date: January 01, 2025' with a clause 'Licensing, Use, and Processing of Submissions in Connection with Artificial Intelligence Training; Opt-Out Right': a fully paid-up, royalty-free, irrevocable, sub-licensable licence to use Submissions for AI training and make them available to third parties; a 30-day opt-out; existing users brought in via an 'I ACCEPT' pop-up offering an in-app reward; and warranties that photographers hold written releases of identifiable people. Not cited because no allowed fetch method returns the text; a verifier with a JS-rendering fetch should capture it (Q4, Q5, Q7, contributor_pay_model).
- <https://support.gurushots.com/support/solutions> — GuruShots Freshdesk help centre; no AI-licensing article found in the FAQ list, but folders not fully browsed.
- <https://www.dataseeds.ai/dynamic-off-the-shelf-datasets-1_p_fa8fc6c8_58f8_4f33_8dce_b16987c33ea6_0_5000-sitemap.xml> — Sitemap listing 14 off-the-shelf dataset pages (faces, selfies, driving DMS, fashion try-on, etc.); only two opened.
- <https://www.sec.gov/Archives/edgar/data/1667313/000121390026068278/ea0293880-10q_zedge.htm> — Q3 FY2026 10-Q; WebFetch reported no DataSeeds revenue breakout. Worth a full read for risk factors on AI licensing.
- <https://www.dataseeds.ai/post/the-role-of-large-scale-image-data-in-training-multimodal-ai-models> — Vendor blog post not opened.
