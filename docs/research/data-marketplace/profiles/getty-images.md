# Getty Images

stock_media · light · status: **active** · also known as Getty Images Holdings, Inc., GETY, iStock, Unsplash, Generative AI by Getty Images

> Rendered from `ledger/getty-images.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Creative and Editorial stock content sold under the Content License Agreement; for AI buyers, 'Data Licensing' of its 'dataset of creative images, videos and metadata'” and its bespoke side “'Custom Content' (commissioned shoots, also 'Assignments'); for AI buyers, 'purpose‑built datasets ... for your exclusive use'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c014, c024, c069 | Getty is the licensing party and gives the warranties although content is owned by Getty or its suppliers. |
| economics_model | revenue_share | c011, c049, c029 | Stock side: contributors and contracted suppliers receive a royalty share of each licence fee; economics of negotiated AI data deals are not published. |
| who_pays_fee | seller | c011, c049 | No buyer fee on top: Getty keeps the part of the licence fee not paid out as royalty, i.e. the supplier bears it out of proceeds. |
| supply_models | own_collection, contributor_uploads, partner_licensed | c014, c010, c049, c050, c064, c057 | Content is owned by Getty or its suppliers; 600,000+ contributors and 360+ premium content partners. Commissioned Custom Content is exclusive to the client, so not commissioned_nonexclusive. |
| custody_model | copy_to_buyer | c061, c062, c038 | Files are downloaded by the buyer (site, API with short-lived URLs); the sample dataset is CSV/JSON of pre-signed URLs. Delivery mechanics of full AI datasets are not published. |
| transaction_mode | both | c045, c047, c019, c039, c067, c060 | Self-serve subscriptions and UltraPacks for stock; AI training rights, API access and datasets only through sales. |
| public_prices | some | c045, c046, c047, c042, c043, c048, c054 | Subscription, UltraPack and Custom Content prices are published; enterprise and data licensing are custom priced; asset pages ask the visitor to sign in to see prices. |
| licence_model | mixed | c015, c018, c019, c032 | Stock: fixed menu of RF / RR / RM licences that bans ML use; AI training rights are negotiated per deal. |
| exclusivity_offered | yes | c017, c032, c044 |  |
| public_listing | public_indexable | c053, c054 | Asset pages with preview, licence type and release status are public; price needs an account. No public listing of AI datasets beyond the Hugging Face sample. |
| buyer_vetting | unknown |  | Stock purchase needs an account; what Getty checks about AI data buyers is not published. |
| sample_mechanics | free_sample_download | c026, c036, c037 | Stock: free comp use for 30 days; AI data: a 3,750-image gated sample on Hugging Face. |
| versioning | unknown |  |  |
| human_subject_consent_docs | asserted_only | c024, c053, c030, c059, c025 | Getty warrants privacy/publicity for RF creative content and flags 'model and property released'; releases themselves are not shown to buyers in any source fetched. Editorial content generally has no releases. |
| contributor_pay_model | royalty_or_revenue_share | c049, c029, c008 |  |
| catalogue_plus_custom | both | c033, c032, c044, c042 |  |
| erasure_after_sale | contractual_deletion | c020, c021 |  |
| quality_evidence | operator_verified | c056, c055 | Getty says library content is vetted; no quality evidence specific to AI datasets was found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Getty's buyers are businesses and media on subscriptions (58.8% of revenue in Q2 2026) and, per its 10-Q, AI developers who pay for access to content for model training; it also markets data for physical AI and has display deals with OpenAI. Volumes and revenue from AI data deals are not published. | c006, c007, c031, c034, c040, c063 |
| Q2 | partial | Getty sells from its own sites and API rather than listing on others' marketplaces; the one outside listing found is a gated sample dataset on Hugging Face that routes buyers back to its data licensing team. | c036, c039, c061 |
| Q3 | sourced | Inventory comes from over 600,000 contributors on non-exclusive or exclusive royalty agreements, more than 360 premium content partners, and content Getty owns; Getty rejects AI-generated submissions and requires releases for recognisable people. Its generator was trained on 479 million licensed Getty and Bria-partner images, with no scraping. | c010, c014, c049, c050, c051, c052, c057, c058, c064 |
| Q4 | partial | Commissioned Custom Content is licensed to the commissioning client only, so it is not resold. No source fetched describes how contributor terms were changed to allow AI training, only that contributors are now paid when their content is used. | c044, c008, c029 |
| Q5 | sourced | Getty is licensor of record: it licenses content owned by itself or its suppliers, warrants non-violation of privacy and publicity for royalty-free creative content, and disclaims warranties over people and trademarks beyond that. | c014, c024, c069, c068 |
| Q6 | partial | Buyers download copies: the API returns short-lived download URLs and the sample dataset is a list of pre-signed URLs. How full training datasets are delivered is not published. | c061, c062, c038 |
| Q7 | partial | Getty requires model or property releases from contributors for recognisable people and property, flags release status on asset pages, and warrants privacy/publicity for royalty-free creative content; editorial content generally has no releases. Contributors are paid for AI training use, but no opt-in or opt-out mechanism was found. | c051, c053, c024, c025, c030, c059, c008 |
| Q8 | sourced | The stock licence is non-exclusive (exclusive buy-outs on request), bans ML/AI use, allows audits and download monitoring, and requires deletion on termination or on an infringement claim. Getty is enforcing training-data rights in court against Stability AI. | c016, c017, c018, c022, c023, c020, c021, c012 |
| Q9 | sourced | Stock is sold self-serve by subscription or UltraPack at published prices; AI training rights, API access and datasets are sold through sales. Getty keeps the licence fee minus a 15-45% contributor royalty (20-50% for contracted suppliers). | c045, c047, c019, c039, c060, c067, c049, c011 |
| Q10 | partial | The unit of sale is a licence to an individual asset under the RF/RR/RM model, delivered as a download; Getty may require deletion and stop licensing content. No dataset, revision or version model for AI data was found. | c015, c061, c021 |
| Q11 | partial | Buyers see public asset pages with preview, licence type and release status, can use comps free for 30 days, and AI buyers can get a 3,750-image gated sample dataset. Getty says its library is vetted and AI-free. | c053, c026, c036, c037, c055, c056 |
| Q12 | sourced | The stock licence excludes AI training and sends training needs to a representative; Data Licensing then offers both library datasets and new purpose-built datasets for exclusive use, alongside commissioned 'Custom Content' shoots for brands. | c018, c019, c031, c032, c033, c044 |

## Claims

### positioning

- **c001** Getty Images was operating as of its second-quarter 2026 results release dated 10 August 2026, which reported revenue for the quarter.  
  _status · vendor_stated · as of 2026-08-10 (publication)_
  - “Revenue of $229.1 million in Q2'26, a decrease of 2.5% year over year” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-reports-second-quarter-2026-results> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The release is Getty's own, furnished to the SEC as Exhibit 99.1 to an 8-K filed 2026-08-10. Operation is confirmed later still by an 8-K filed 2026-09-30 (interest paid on senior notes). The status picture is worse than 'operating': the Q2 2026 10-Q states substantial doubt about Getty's ability to continue as a going concern (see missed v001).
    - “Revenue of $229.1 million in Q2'26, a decrease of 2.5% year over year” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K Exhibit 99.1, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055270/gety-20260630xex991.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The release is dated 10 Aug 2026 and reports Q2 revenue. 'Operating' is true but leaves out the going-concern doubt stated in the 10-Q filed the same day (missed v001).
- **c007** Getty's 10-Q states that the company also earns revenue by giving customers access to its data and content for machine-learning and generative-AI model training.  
  _offer · filing · as of 2026-08 (publication)_
  - “The Company also generates revenue by providing customers with access to its data and content for machine learning” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c031** Getty's Data Licensing page offers curated, rights-cleared datasets for AI model training, tailored to the buyer's use case.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing_
  - “Accelerate AI model training with curated, rights‑cleared datasets tailored to your specific use case” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c034** Getty's Data Licensing page markets multimodal data for physical AI such as robotics and spatial computing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing_
  - “Improve performance for AI systems in robotics, spatial computing, and applied environments” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c009** Getty's 10-Q says over 662 million visual assets are available through its sites.  
  _number · filing · as of 2026-08 (publication)_ · **662000000 visual assets** (company-reported count of assets available through Getty's sites (lower bound, 'over'); as at Q2 2026 filing)
  - “over 662 million visual assets available through its industry-leading sites” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c010** Getty's 10-Q says it works with over 600,000 contributors and more than 360 premium content partners.  
  _number · filing · as of 2026-08 (publication)_ · **600000 contributors** (company-reported lower bound ('over'); separately more than 360 premium content partners; as at Q2 2026 filing)
  - “over 600,000 contributors and more than 360 premium content partners” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **unverifiable** — The only source found is the profile's own: the Q2 2026 10-Q (sec.gov ...000162828026055246/gety-20260630.htm), which does read 'distributes the content of over 600,000 contributors and more than 360 premium content partners'. So the statement accurately says what the 10-Q says, but it is not independently confirmed. No search was available to find an outside count. Note the filing says 'distributes the content of', not 'works with'.
  - verifier (scope): **scope_ok** — The 10-Q's own words are 'distributes the content of' 600,000+ contributors. The statement's 'works with' is a slight paraphrase, not a material change.
- **c027** Getty's AI model card says the Generative AI by Getty Images model was trained on photography, illustrations and stills from Getty Images and Bria's other creative partners.  
  _architecture · vendor_stated · as of 2026-04 (page_dated) · scope: Generative AI by Getty Images model card_
  - “still images from Getty Images and Bria's other creative partners” — Getty Images, <https://developer.gettyimages.com/ai-generation/model-card/> · docs · retrieved 2026-10-01 · quote check: exact
- **c028** Getty's AI model card states that all training data for its generator is owned or licensed.  
  _terms · vendor_stated · as of 2026-04 (page_dated) · scope: Generative AI by Getty Images model card_
  - “All training data is owned or licensed.” — Getty Images, <https://developer.gettyimages.com/ai-generation/model-card/> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** Getty announced on 13 January 2026 that Nfinite would transform select 2D imagery from Getty's creative library into 3D scenes.  
  _event · vendor_stated · as of 2026-01-13 (publication) · scope: Nfinite collaboration_
  - “select content from Getty Images' extensive creative library of 2D imagery into high‑fidelity 3D scenes” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/nfiniteai-collaborates-with-getty-images-to-bring-2d-visual-content-into-the-3d-physical-ai-era> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Getty offers contributors a non-exclusive agreement that still lets them submit the same work to other stock agencies.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Contributor programme_
  - “allows you to still submit photos, illustrations, and videos to other stock agencies if you wish” — Getty Images, <https://www.gettyimages.co.uk/workwithus> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c057** Getty's summary of training content says its generator was trained on 479 million fully licensed images from Getty Images and Bria data partners.  
  _number · vendor_stated · as of 2026-07 (page_dated) · scope: Generative AI by Getty Images_ · **479000000 images** (size of the image training set for Getty's generator (Bria), as stated by Getty; training data collected up to mid-2025)
  - “479 million images, fully licensed images provided by Getty Images and Bria data partners” — Getty Images, <https://developer.gettyimages.com/ai-generation/summary-of-training-content/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Bria (the named partner) confirms on bria.ai that its models are 'trained exclusively on licensed data from Getty Images, Alamy, and Envato', and its licensed-training-catalog page claims '1B+' assets and '30+ licensed data partners'. Neither page gives the 479 million figure or says that Getty's generator runs on Bria. No search was available to find an independent count.
  - verifier (scope): **scope_ok** — The summary page (last updated July 2026) applies the 479 million figure to Generative AI by Getty Images, which relies on Bria Fibo Lite. The pool combines Getty's images with those of Bria's data partners.
- **c058** Getty's summary of training content states that no data scraping was performed for its generator's training set.  
  _terms · vendor_stated · as of 2026-07 (page_dated) · scope: Generative AI by Getty Images_
  - “No data scraping is performed” — Getty Images, <https://developer.gettyimages.com/ai-generation/summary-of-training-content/> · docs · retrieved 2026-10-01 · quote check: exact
- **c064** On 8 September 2026 Getty announced a multiyear agreement with World Athletics to launch The WA Collection, with Getty as exclusive photo provider.  
  _event · vendor_stated · as of 2026-09-08 (publication) · scope: The WA Collection_
  - “World Athletics has entered into a multiyear agreement with Getty Images” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/world-athletics-selects-getty-images-as-exclusive-photo-provider> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c026** Buyers may use content from the Getty site free of charge for test or sample (comp) use for up to 30 days after download.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “for test or sample (composite or comp) use only, for up to 30 days following download” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c035** Getty's Data Licensing page links to a sample custom dataset rather than publishing prices.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing_
  - “Click here for access to a sample custom dataset” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c036** Getty's sample dataset on Hugging Face contains 3,750 images from 15 categories.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images Sample Dataset (Hugging Face)_ · **3750 images** (size of the free gated sample dataset published by Getty on Hugging Face; one-off)
  - “This sample Dataset includes 3,750 images from 15 categories” — Getty Images, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c053** A Getty royalty-free asset page shown to an anonymous visitor states the licence type and that the image is model and property released.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Asset detail page (creative image 1581299897)_
  - “Model and property released” — Getty Images, <https://www.gettyimages.in/detail/photo/young-man-working-at-distribution-warehouse-royalty-free-image/1581299897> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c054** On the Indian Getty site an asset page does not show a price to an anonymous visitor; it asks the visitor to join to view pricing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Asset detail page (creative image 1581299897), India (gettyimages.in)_
  - “Join today to view pricing and explore download options” — Getty Images, <https://www.gettyimages.in/detail/photo/young-man-working-at-distribution-warehouse-royalty-free-image/1581299897> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### trust

- **c024** For royalty-free creative content, Getty Images itself warrants to the buyer that use will not violate any right of privacy or publicity.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement, royalty-free, non-editorial_
  - “will not violate any right of privacy or right of publicity” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A warranty in Getty's own licence; no independent restatement could be reached without search.
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote leaves out the conditions. The warranty covers royalty-free content 'excluding content marked "editorial"', and applies only when the content is used in accordance with the agreement 'in the form delivered by Getty Images (that is, excluding any modifications)'.
- **c025** The buyer acknowledges under the Content License Agreement that releases are generally not obtained for editorial content.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement, editorial_
  - “You acknowledge that no releases are generally obtained for content identified as "editorial"” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c030** Getty's model card says it maintains model and property releases for people and certain places in the training set, or holds contractual guarantees of them for images from other libraries.  
  _terms · vendor_stated · as of 2026-04 (page_dated) · scope: Generative AI by Getty Images training set_
  - “maintains model and property releases for images depicting persons and certain places (as necessary)” — Getty Images, <https://developer.gettyimages.com/ai-generation/model-card/> · docs · retrieved 2026-10-01 · quote check: exact
- **c059** Getty's summary of training content says the training set is subject to model and property releases wherever identifiable persons or property appear.  
  _terms · vendor_stated · as of 2026-07 (page_dated) · scope: Generative AI by Getty Images_
  - “subject to all necessary model and property releases where identifiable persons or property are depicted” — Getty Images, <https://developer.gettyimages.com/ai-generation/summary-of-training-content/> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** Getty says it gives no right or warranty over the names, people or trademarks shown in content beyond what it specifically warrants.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Content License Agreement (company terms page)_
  - “Getty Images does not grant any right or make any warranty with regard to the use of names, people, trademarks” — Getty Images, <https://www.gettyimages.in/company/terms> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed

### transaction

- **c039** The Hugging Face sample dataset card routes licensing of further data from the full library to Getty's data licensing team.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images Sample Dataset (Hugging Face)_
  - “to license additional data from the full Getty Images library, contact the data licensing team” — Getty Images, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** Getty's API documentation tells developers to contact their Getty account rep to discuss API access and licensing options.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images API_
  - “Please contact your Getty Images account rep to discuss API access and licensing options.” — Getty Images, <https://developer.gettyimages.com/docs/> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** Getty's Data Licensing page ends with a Contact Sales call to action rather than a checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing_
  - “Ready to talk to us about your Data Licensing needs?” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### pricing

- **c042** Getty Custom Content (commissioned shoots) lists a price of USD 8,300 per brief on the 3-brief plan.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Custom Content, 3 briefs_ · **8300 USD per brief** (list price paid by the client per creative brief on the 3-brief tier; tier includes 75 image/video selects in total; one-off)
  - “$8,300 per brief” — Getty Images, <https://www.gettyimages.in/enterprise/custom-content> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c043** Getty Custom Content lists a price of USD 5,000 per brief on the 20-brief plan.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Custom Content, 20 briefs_ · **5000 USD per brief** (list price paid by the client per creative brief on the 20-brief tier; tier includes 500 image/video selects in total; one-off)
  - “$5,000 per brief” — Getty Images, <https://www.gettyimages.in/enterprise/custom-content> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c045** Getty's Indian pricing page lists a creative subscription at INR 21,000 per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Creative subscription, 10 downloads per month, India (gettyimages.in)_ · **21000 INR per month** (list price paid by buyer for the creative subscription with 10 monthly downloads; per month)
  - “₹21,000 /mo” — Getty Images, <https://www.gettyimages.in/plans-and-pricing> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c046** Getty's Indian pricing page lists an editorial subscription at INR 15,550 per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Editorial subscription, India (gettyimages.in)_ · **15550 INR per month** (list price paid by buyer for the editorial subscription; per month)
  - “₹15,550 /mo” — Getty Images, <https://www.gettyimages.in/plans-and-pricing> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c047** Getty's Indian pricing page lists the 5-download UltraPack at INR 12,800 per download (INR 64,000 per pack).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: UltraPack, 5 pack, India (gettyimages.in)_ · **12800 INR per download** (list price paid by buyer for an UltraPack download; 5-pack total INR 64,000; one-off)
  - “₹12,800.00 per download” — Getty Images, <https://www.gettyimages.in/plans-and-pricing> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c048** Getty's pricing page gives enterprise plans as custom pricing rather than a list price.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Enterprise / Premium Access_
  - “Custom pricing available” — Getty Images, <https://www.gettyimages.in/plans-and-pricing> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
- **c066** On 9 July 2026 Getty extended its creative and editorial subscriptions to individual professionals as single-seat plans.  
  _event · vendor_stated · as of 2026-07-09 (publication) · scope: Single-seat subscriptions_
  - “The new plans are single‑seat subscriptions providing access to AI‑free, authentic, commercially ready imagery” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-extends-creative-and-editorial-subscriptions-to-individual-professionals> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c014** Getty's buyer Content License Agreement (last updated April 2026) states that licensed content is owned either by Getty Images or by its content suppliers.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “All the licensed content is owned by either Getty Images or its content suppliers.” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A clause of Getty's own licence. No search was spent; consistent with the 10-Q, which says rights to most licensed content are kept by the owners and licensing rights are given to Getty by contributors and content partners.
  - verifier (scope): **scope_ok** — The page (gettyimages.in/eula) shows 'LAST UPDATED: April 2026' and the quoted sentence. It is the Indian-site version of the CLA.
- **c015** Getty's Content License Agreement offers three licence models: royalty-free (RF), rights-ready (RR) and rights-managed (RM).  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “Getty Images offers three types of licence models: royalty-free ("RF"), rights-ready ("RR") and rights-managed ("RM").” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c016** Under the Content License Agreement the buyer's licence is non-exclusive.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “Non-Exclusive, meaning that you do not have exclusive rights to use the content.” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c017** A buyer who wants exclusive rights to royalty-free content must contact Getty Images to discuss a buy-out.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement, royalty-free_
  - “If you would like exclusive rights to use royalty-free content, please contact Getty Images to discuss a buy-out.” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c018** The standard Content License Agreement forbids using content, including captions, keywords and other metadata, for any machine-learning or AI purpose.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “for any machine learning and/or artificial intelligence purposes” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A clause of Getty's own licence; no independent restatement could be reached without search.
  - verifier (scope): **scope_wrong** — The quote does not show the 'including any caption information, keywords or other metadata' words. The statement also overclaims 'any' AI purpose: the same clause lets licensees use AI technology on creative (non-editorial) content solely for internal archiving, searching, indexing or sorting, and for permitted editing. The statement should carry that carve-out.
- **c022** The Content License Agreement lets Getty Images audit the buyer's records related to the agreement.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “audit your records directly related to this agreement” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c023** Getty Images reserves the right to monitor downloads and user activity to check licence compliance.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “Getty Images reserves the right to monitor downloads and user activity” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c068** Getty's licence text says that Getty Images and its licensors exclude liability for lost profits and indirect or consequential damages.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: Content License Agreement (company terms page)_
  - “WILL NOT BE LIABLE TO YOU OR ANY OTHER PERSON OR ENTITY FOR ANY LOST PROFITS” — Getty Images, <https://www.gettyimages.in/company/terms> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed

### custody

- **c038** Getty's sample dataset is delivered as CSV or JSON files of asset IDs and pre-signed URLs, not as hosted image files.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images Sample Dataset (Hugging Face)_
  - “CSV or JSON files containing asset IDs and pre-signed URLs” — Getty Images, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** Getty's API delivers licensed files by download: a POST to a provided URI with a valid key and token downloads the image.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images API_
  - “A POST to the provided URI with a valid Api-Key and access token will download the image.” — Getty Images, <https://developer.gettyimages.com/docs/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — API mechanics exist only in Getty's own developer documentation; no search spent.
  - verifier (scope): **scope_ok** — The sentence is in the Hypermedia section of the general API docs, as an example of a download URI returned in search results. It describes the download mechanic generally.
- **c062** Getty API download URLs are not permalinks and are valid for less than 24 hours.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images API_
  - “Download URLs are not permalinks and should be used shortly after they are received.” — Getty Images, <https://developer.gettyimages.com/docs/> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c037** Access to Getty's Hugging Face sample dataset is gated: a user must agree to share contact information.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images Sample Dataset (Hugging Face)_
  - “You need to agree to share your contact information to access this dataset” — Getty Images, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c051** Getty tells contributors that content featuring recognisable people or property normally needs a model or property release.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Contributor programme_
  - “if your content features recognizable people or property, you need to complete a model or property release” — Getty Images, <https://www.gettyimages.co.uk/workwithus> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c052** Getty does not accept contributor files created or modified with generative AI models.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Contributor programme_
  - “We do not accept files created or modified using any generative AI models” — Getty Images, <https://www.gettyimages.co.uk/workwithus> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c055** Getty asset pages state that Getty does not allow AI-generated visuals in its library.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Asset detail page_
  - “We do not allow AI-generated visuals in our library.” — Getty Images, <https://www.gettyimages.in/detail/photo/young-man-working-at-distribution-warehouse-royalty-free-image/1581299897> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c056** Getty's pricing page says library content comes from its contributor community and is vetted against its standards.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images library_
  - “comes from our community of contributors and is vetted to ensure it meets our high standards” — Getty Images, <https://www.gettyimages.in/plans-and-pricing> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed

### contributor_pay

- **c008** Getty's 10-Q states that contributors are compensated when their content is included in AI training data sets and may share in revenue from AI tools.  
  _terms · filing · as of 2026-08 (publication)_
  - “Contributors are compensated for any inclusion of their content in AI data training sets and may share in the revenue” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c011** Getty's 10-Q says suppliers who work with it under contract typically receive royalties of 20% to 50% of the licence fee charged to customers.  
  _number · filing · as of 2026-08 (publication)_ · **20 percent of licence fee (low end of 20-50% range)** (royalty paid by Getty to contracted suppliers out of the total licence fee charged to the customer; range 20% to 50%; per licence)
  - “Suppliers who choose to work with us under contract typically receive royalties of 20% to 50% of” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **unverifiable** — The only source found is the profile's own: the Q2 2026 10-Q, which reads 'typically receive royalties of 20% to 50% of the total license fee we charge customers'. So the statement accurately says what the 10-Q says, but it is not independently confirmed (no search available). It sits uneasily with Getty's contributor page (c049: 15% to 45% for individual contributors).
  - verifier (scope): **quote_incomplete** — The quote stops at 'of 20% to 50% of'. The words that complete the fact are 'the total license fee we charge customers, depending on the basis on which their content is licensed'.
- **c029** Getty's model card says contributors whose content trained the AI Generator get an annual share of its revenue, split pro rata per file and by traditional licensing revenue.  
  _terms · vendor_stated · as of 2026-04 (page_dated) · scope: Generative AI by Getty Images_
  - “allocating both a pro rata share in respect of every file and allocating a share based on traditional licensing revenue” — Getty Images, <https://developer.gettyimages.com/ai-generation/model-card/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The annual, pro-rata mechanics appear only in Getty's own model card. The principle is backed by the Q2 2026 10-Q (sec.gov): 'Contributors are compensated for any inclusion of their content in AI data training sets and may share in the revenue generated by AI tools'. The filing gives no period and no allocation rule.
  - verifier (scope): **quote_incomplete** — The quote shows the pro-rata and licensing-revenue allocation but not the 'annual' timing or which product it is. Those words are: 'On an annual recurring basis, we will share in the revenues generated from the Generative AI by Getty Images'. The model card (April 2026) says the generator is built on Bria Fibo Lite.
- **c049** Getty's contributor page says individual contributors earn a royalty of 15% to 45% on each file licence, depending on their Contributor Agreement.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Getty Images / iStock contributor programme_ · **15 percent of licence (low end of 15-45% range)** (royalty paid by Getty to the contributor on each file licence; range 15% to 45% depending on Contributor Agreement; per licence)
  - “you will earn a royalty between 15% and 45% on each file license” — Getty Images, <https://www.gettyimages.co.uk/workwithus> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A contributor-page rate; no independent source reached (no search available). Tension worth noting: the 10-Q says suppliers under contract 'typically receive royalties of 20% to 50% of the total license fee', a range with a higher floor and ceiling than 15% to 45%. The bases differ (all contracted suppliers, including content partners, against individual contributors), so this is not a refutation.
  - verifier (scope): **scope_ok** — The page's full sentence begins 'Depending on your Contributor Agreement', which matches the statement. The source is the UK site.

### post_sale

- **c020** On termination of the Content License Agreement the buyer must immediately stop using the content and delete or destroy all copies.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “cease using the content; delete or destroy any copies” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **c021** If licensed content may be subject to an infringement claim, Getty can require the buyer to stop using it and delete all copies at the buyer's own expense.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “and at your own expense: cease using the content, delete or destroy any copies” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed

### catalogue_custom

- **c019** The Content License Agreement tells customers with content-training needs to contact their Getty Images representative, so training rights are sold outside the standard licence.  
  _terms · legal_text · as of 2026-04 (page_dated) · scope: Content License Agreement_
  - “If you have any content training needs, please reach out to your Getty Images' representative.” — Getty Images, <https://www.gettyimages.in/eula> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A clause of Getty's own licence. The 10-Q supports the inference that training rights are sold separately: its 'Other' revenue line includes 'data access and/or licensing' agreements, which fell 66.7% in Q2 2026 (missed v006).
  - verifier (scope): **scope_ok** — The quote is verbatim from the April 2026 CLA. 'Training rights are sold outside the standard licence' is a fair inference, given the CLA's AI prohibition.
- **c032** Getty's Data Licensing page offers to create new purpose-built datasets with its photographer and videographer network for the buyer's exclusive use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing (custom datasets)_
  - “create new, purpose‑built datasets aligned to your training objectives—for your exclusive use” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c033** Getty's Data Licensing page describes a training dataset of creative images, videos and metadata that it calls safe for commercial use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Data Licensing_
  - “our diverse dataset of creative images, videos and metadata. Safe for commercial use” — Getty Images, <https://www.gettyimages.in/enterprise/data-licensing> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c044** Getty says Custom Content assets are licensed to the commissioning client only.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Custom Content_
  - “Only you have the license to use your assets, so you'll never see your images on a competitor's website” — Getty Images, <https://www.gettyimages.in/enterprise/custom-content> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### changes

- **c002** On 7 July 2026 Getty Images gave Shutterstock written notice terminating their merger agreement.  
  _event · filing · as of 2026-07-07 (publication)_
  - “On July 7, 2026, Getty Images delivered a written notice to Shutterstock terminating the Merger Agreement” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Fact confirmed (8-K/A, Item 1.02). This is a different filing from the profile's source (the 10-Q) but on the same domain, sec.gov. But it is not the newest major corporate event: later 8-Ks report a USD 92.3m warrant-litigation judgment and standstill (filed 2026-08-28), the election to use 30-day grace periods on senior-note interest due 2026-09-01 (filed 2026-08-31), and payment of that interest on 2026-09-30. See missed v002-v004.
    - “On July 7, 2026, Getty Images delivered a written notice to Shutterstock terminating the Merger Agreement” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K/A, <https://www.sec.gov/Archives/edgar/data/1898496/000121390026076004/ea0297316-8ka1_getty.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_wrong** — The quote is in the 10-Q (Note 1 and Note 12) and supports the fact. The scope 'newest major corporate event' is wrong: newer material events exist. These are the USD 92.3m warrant judgment and standstill (8-K, 28 Aug 2026), the election to use 30-day grace periods on note interest (8-K, 31 Aug 2026), and the 10-Q's going-concern doubt (10 Aug 2026).
- **c003** Getty's Q2 2026 10-Q records that the UK CMA would let the Shutterstock merger proceed only if Shutterstock's entire editorial business was divested to CMA-approved purchasers.  
  _event · filing · as of 2026-08 (publication)_
  - “the Merger could proceed if Shutterstock's entire editorial business was divested to one or more CMA approved purchasers” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c004** In July 2026 Getty Images engaged Guggenheim Securities as financial adviser for its evaluation of strategic financing alternatives.  
  _event · filing · as of 2026-07 (publication)_
  - “In July 2026, the Company engaged Guggenheim Securities, LLC” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c063** On 12 August 2026 Getty launched an MCP server that lets AI agents discover, retrieve and use licensed Getty visual content.  
  _event · vendor_stated · as of 2026-08-12 (publication) · scope: Getty Images MCP server_
  - “enables AI agents to discover, retrieve and use licensed Getty Images extensive collection” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-launches-mcp-server-to-connect-creative-and-editorial-content-to-ai-workflows-and-products> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c065** The newest item in Getty's newsroom on 2026-10-01, dated 21 September 2026, announced Getty as official photographer of the 64th New York Film Festival.  
  _event · vendor_stated · as of 2026-09-21 (publication)_
  - “Getty Images Named Official Photographer of the 64th New York Film Festival” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-named-official-photographer-of-the-64th-new-york-film-festival> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — What Getty's newsroom shows is by nature vendor-only. The festival organiser's own site (filmlinc.org/press/ and filmlinc.org/nyff/) returned HTTP 403, and no search was available to find press coverage. As 'newest dated event' the scope is too narrow: Getty filed an 8-K dated 2026-09-30 reporting interest payments on its senior unsecured notes after a grace period, which is newer and far more material (missed v003, v004).
  - verifier (scope): **scope_wrong** — The newsroom on 2026-10-01 does list the NYFF item (21 Sep 2026) as its newest. But the claim is scoped as the 'newest dated event', and the newsroom leaves out Getty's SEC-reported events: the 30 Sep 2026 8-K (interest paid after a grace period) is newer, and it and the 31 Aug 8-K are far more material. As stated, the claim is only true of the newsroom.

### demand

- **c005** Getty Images says its Q2 2026 revenue was USD 229.1 million, down 2.5% year over year.  
  _number · vendor_stated · as of 2026-08-10 (publication)_ · **229.1 USD million** (total company revenue as reported by Getty, all products; per quarter (Q2 2026))
  - “Revenue of $229.1 million in Q2'26, a decrease of 2.5% year over year” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-reports-second-quarter-2026-results> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — 10-Q also gives reported revenue of $229.1 million versus $234.9 million a year earlier. Currency-neutral decline was 4.1%.
    - “On a reported basis, revenue decreased by 2.5% (decreased 4.1% CN) for the three months ended June 30, 2026” — U.S. SEC (EDGAR), Getty Images Holdings Form 10-Q for Q2 2026, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The release quote matches. The 10-Q confirms reported revenue of $229.1m against $234.9m, down 2.5%, or 4.1% currency-neutral.
- **c006** Getty Images says annual subscription revenue was 58.8% of total revenue in Q2 2026, up from 53.5% in Q2 2025.  
  _number · vendor_stated · as of 2026-08-10 (publication)_ · **58.8 percent of total revenue** (share of Getty's total revenue from annual subscriptions, as reported by Getty; per quarter (Q2 2026))
  - “Annual Subscription Revenue grew to 58.8% of total revenue, up from 53.5% in Q2'25” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-reports-second-quarter-2026-results> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The figure appears only in Getty's own earnings release, here as filed with the SEC; the 10-Q gives approximately 58% for the six months. The 'up from 53.5% in Q2'25' comparison is in the same release.
    - “Annual Subscription Revenue grew to 58.8% of total revenue” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K Exhibit 99.1, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055270/gety-20260630xex991.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The quote contains both 58.8% (Q2 2026) and 53.5% (Q2 2025).
- **c040** Getty announced a display agreement on 21 June 2026 under which its licensed content libraries appear in OpenAI search and discovery within ChatGPT.  
  _event · vendor_stated · as of 2026-06-21 (publication) · scope: OpenAI display partnership_
  - “licensed content libraries will appear across OpenAI search and discovery experiences within ChatGPT” — Getty Images, <https://newsroom.gettyimages.com/en/getty-images/getty-images-announces-display-partnership-with-openai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c012** In Getty's UK case against Stability AI, the court granted Getty permission to appeal the secondary-infringement ruling and refused Stability permission to appeal the trademark ruling, per Getty's 10-Q.  
  _outcome · filing · as of 2026-08 (publication)_
  - “granted Getty Images' request to appeal the decision on secondary infringement and denied Stability AI's request to appeal” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Judgment of 16 Dec 2025: para 7 frames the issue as the claimants' application to appeal the dismissal of the Secondary Infringement of Copyright Claim; the same judgment says 'I am going to refuse permission to appeal in relation to the defendant's application' on trade mark infringement. The 10-Q adds that the Court of Appeal also refused Stability permission and that the appeal is expected in November 2026. The costs judgment [2025] EWHC 3419 (Ch) names Stability the overall winner (missed v005).
    - “I am going to grant permission to appeal in relation to this issue.” — The National Archives (Find Case Law), [2025] EWHC 3343 (Ch), <https://caselaw.nationalarchives.gov.uk/ewhc/ch/2025/3343> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The 10-Q quote supports the statement. The rulings were made by the High Court in December 2025 ([2025] EWHC 3343 (Ch)), not in 2026. The as_of of 2026-08 is the date of the filing, not of the ruling.
- **c013** Getty's 10-Q says the appeal on secondary infringement in its UK case against Stability AI is expected to be heard in November 2026.  
  _event · filing · as of 2026-08 (publication)_
  - “The appeal of the decision on secondary infringement is expected to be held in November 2026” — Getty Images Holdings, Inc. (SEC Form 10-Q), <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Added by the verifier

- **v001** Getty Images' Q2 2026 10-Q states that substantial doubt about its ability to continue as a going concern has not been alleviated.  
  _status · filing · as of 2026-08-10 (publication)_
  - “substantial doubt about the Company's ability to continue as a going concern has not been alleviated” — U.S. SEC (EDGAR), Getty Images Holdings Form 10-Q, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** Plaintiffs in the warrant litigation against Getty Images Holdings (NY Supreme Court, judgment entered 27 July 2026) calculated the judgment including interest at USD 92.3 million as of 25 August 2026.  
  _event · filing · as of 2026-08-25 (publication) · scope: US_ · **92306578 USD** (judgment amount including interest as calculated by plaintiffs; one-off)
  - “As of August 25, 2026, Plaintiffs have calculated the amount of the Judgment including interest as $92,306,578.” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K, <https://www.sec.gov/Archives/edgar/data/1898496/000121390026095091/ea0303383-8k_getty.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v003** On 31 August 2026 Getty Images disclosed that it intended to use 30-day grace periods for the interest due on 1 September 2026 on its senior unsecured notes.  
  _event · filing · as of 2026-08-31 (publication)_
  - “intends to elect to rely on its available 30-day grace periods with respect to interest payments” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K, <https://www.sec.gov/Archives/edgar/data/1898496/000121390026095778/ea0304109-8k_getty.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v004** On 30 September 2026 Getty Images made the interest payments on its senior unsecured notes within the grace period, its newest dated SEC-reported event as of 2026-10-01.  
  _event · filing · as of 2026-09-30 (publication)_
  - “On September 30, 2026, the Company made the interest payments with respect to the Senior Unsecured Notes.” — U.S. SEC (EDGAR), Getty Images Holdings Form 8-K, <https://www.sec.gov/Archives/edgar/data/1898496/000121390026104907/ea0307141-8k_getty.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v005** In its December 2025 costs judgment in Getty v Stability AI, the English High Court treated Stability AI as the overall winner of the litigation.  
  _outcome · court · as of 2025-12-17 (publication) · scope: UK_
  - “As the overall winner, the defendant must have its costs of all claims that failed or were abandoned” — The National Archives (Find Case Law), [2025] EWHC 3419 (Ch), <https://caselaw.nationalarchives.gov.uk/ewhc/ch/2025/3419> · court_record · retrieved 2026-10-01 · quote check: exact
- **v006** Getty's Q2 2026 10-Q says its Other revenue, which includes data access and licensing, fell 66.7% year over year to USD 5.2 million, mainly because of lower volume and recognition timing of data access and licensing agreements.  
  _number · filing · as of 2026-08-10 (publication) · scope: Other revenue (data access and/or licensing, music, DAM, distribution, print)_ · **-66.7 percent change year over year** (reported Other revenue, Q2 2026 vs Q2 2025 (USD 5.2m vs 15.7m); per quarter)
  - “Other revenue decreased on a reported basis by $10.5 million, or 66.7% (67.2% CN), to $5.2 million” — U.S. SEC (EDGAR), Getty Images Holdings Form 10-Q, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “lower volume and recognition timing of data access and/or licensing agreements, including fewer higher-value agreements” — U.S. SEC (EDGAR), Getty Images Holdings Form 10-Q, <https://www.sec.gov/Archives/edgar/data/1898496/000162828026055246/gety-20260630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Unknown

- `matrix.versioning` — not_published; tried <https://www.gettyimages.in/enterprise/data-licensing>, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset>, <https://www.gettyimages.in/eula>
- `matrix.buyer_vetting` — not_published; tried <https://www.gettyimages.in/enterprise/data-licensing>, <https://developer.gettyimages.com/docs/>
- `other.ai_dataset_pricing` — not_published; tried <https://www.gettyimages.in/enterprise/data-licensing>, <https://www.gettyimages.in/plans-and-pricing>
- `other.ai_licensing_revenue` — not_published; tried <https://www.sec.gov/Archives/edgar/data/0001898496/000162828026055246/gety-20260630.htm>, <https://newsroom.gettyimages.com/en/getty-images/getty-images-reports-second-quarter-2026-results>
- `other.dataset_licence_terms` — gated; tried <https://www.gettyimages.in/enterprise/data-licensing>, <https://huggingface.co/datasets/GettyImages/Getty-Images-Sample-Dataset>
- `other.contributor_ai_opt_out_and_terms_change` — js_empty; tried <https://contributors.gettyimages.com/help?lang=en-gb>, <https://www.gettyimages.co.uk/workwithus>
- `other.us_stability_docket` — blocked; tried <https://www.courtlistener.com/docket/71112094/getty-images-us-inc-v-stability-ai-ltd/>, <https://www.courtlistener.com/api/rest/v4/dockets/71112094/>
- `other.independent_press_on_ai_deals` — not_found

## Conflicts

- c011, c049: The 10-Q gives 20-50% royalties for suppliers under contract; the contributor page gives 15-45% per file licence. They may describe different supplier groups (partners vs individual contributors); both kept. (unresolved)

## Leads, not cited

- <https://www.courtlistener.com/docket/71112094/getty-images-us-inc-v-stability-ai-ltd/> — US case Getty Images (US) v. Stability AI, N.D. Cal. 3:25-cv-06891, filed 2025-08-14 after the D. Del. case 1:23-cv-00135 ended 2025-08-18 (per CourtListener search); docket page returned 403.
- <https://contributors.gettyimages.com/help?lang=en-gb> — Contributor help centre renders empty to the fetcher; likely holds AI-training compensation and royalty details.
- <https://www.gettyimages.in/ai> — AI Solutions overview, not fetched; may describe generator indemnity and AI licensing.
- <https://www.gettyimages.co.uk/rights-and-clearance> — Rights and clearance service, not fetched; relevant to Q7.
- <https://www.gettyimages.in/company/ai-free-imagery-policy> — AI-free imagery policy, not fetched.
