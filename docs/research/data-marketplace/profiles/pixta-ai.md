# PIXTA AI

ai_data_catalogue · deep · status: **active** · also known as PIXTA Inc., PIXTA, ピクスタ, PIXTA 機械学習用画像・動画データ提供サービス, PIXTASTOCK

> Rendered from `ledger/pixta-ai.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “PIXTA AI: 'Datasets' / 'Latest Datasets'; pixta.jp: 'プリセットデータセット' (preset datasets), '画像・動画データセット'” and its bespoke side “PIXTA AI: 'Order made dataset' / 'Custom dataset' / 'Request datasets'; pixta.jp: 'オーダーメイドデータセット' (order-made dataset)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | mixed | c011, c010, c006, c104, c083 | PIXTA AI (pixta.ai) is a venue: the Partner is seller and licensor and signs its own agreement with the buyer. PIXTA's Japanese ML dataset service (pixta.jp) sells stock-derived and self-shot datasets as licensor on its own quote and purchase order. |
| economics_model | mixed | c030, c127, c114, c065 | PIXTA AI: listing, referral and performance fees charged to Partners. pixta.jp datasets: PIXTA sells contributor stock, sharing revenue (20% of net for generative-AI licences), and data it shot itself. |
| who_pays_fee | seller | c030 | PIXTA AI terms charge fees to the Partner; no buyer-side fee appears in the terms. Not applicable to the pixta.jp datasets PIXTA sells itself. |
| supply_models | own_collection, contributor_uploads, third_party_providers | c065, c075, c048, c103, c134, c051, c053, c047 | No evidence found of client-commissioned shoots (PIXTA Custom / On-demand) being resold as datasets. |
| custody_model | mixed | c011, c068, c084 | PIXTA AI hosts only samples and descriptions; the sale and all related communication run directly between buyer and Partner, so delivery is the provider's (mechanics not published). pixta.jp datasets are copied to the buyer by download or Google Drive / OneDrive. |
| transaction_mode | contact_sales | c008, c050, c083, c066, c130 | No cart or checkout for datasets on either site; inquiry, quote and purchase order. |
| public_prices | some | c059, c079, c090, c086 | pixta.jp publishes prices for some preset datasets; PIXTA AI listings show no prices. |
| licence_model | mixed | c006, c020, c070, c130 | PIXTA AI: each Partner's own licence in the buyer-Partner agreement (provider-defined). pixta.jp: PIXTA's own ML-only licence, with generative-AI licences contracted individually. |
| exclusivity_offered | unknown |  | No page found that offers or rules out exclusive rights to a listed dataset. |
| public_listing | public_summary_gated_detail | c049 | Title, categories, description and volume are public; metadata and samples need sign-in. |
| buyer_vetting | account_only | c017, c018, c013 | Registration is required, and PIXTA may refuse members and withhold inquiries it considers inappropriate; no business verification is described. |
| sample_mechanics | sample_on_request | c021, c049, c082, c067 | PIXTA AI: Partner samples, possibly watermarked, are free to registered buyers for evaluation only (the format behind sign-in was not seen). pixta.jp: low-quality trimmed clips are public, and preview video or sample data comes after an inquiry. |
| versioning | unknown |  | No versioning, revision or update policy published for listings or datasets. |
| human_subject_consent_docs | asserted_only | c026, c027, c028, c080, c053 | Partners warrant consent and must keep written consents for PIXTA on request; pixta.jp says model releases were obtained. Nothing says the buyer receives the releases. |
| contributor_pay_model | mixed | c127, c114, c133, c135 | Stock contributors get a revenue share (20% of net pro rata for generative-AI licences); ML-only paid briefs pay a one-off credit per accepted set. Pay for PIXTA's own shoots and for non-generative ML sales is not published. |
| catalogue_plus_custom | both | c043, c074, c063, c085, c050 |  |
| erasure_after_sale | takedown_only | c112, c113, c038, c037 | PIXTA's contributor terms: content already bought or licensed cannot be recalled, and delisting takes 30 days. On PIXTA AI only listings and samples are deleted; after-sale rights follow the buyer-Partner agreement. |
| quality_evidence | both | c089, c057, c054, c034 | PIXTA reviews its own stock and says it reviews its own annotated sets; third-party listings carry provider-asserted claims, and PIXTA disclaims them. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | PIXTA says companies and research bodies, notably major automotive and manufacturing firms, buy its datasets for image recognition, with generative-AI demand rising. Units are sets such as 1,000 images or 50 videos, pitched for PoC and for Japan-specific scenes; volumes are not published. | c091, c060, c092, c088, c132, c045 |
| Q2 | partial | On PIXTA AI a provider gets a listing page, samples PIXTA distributes to registered buyers, and buyer leads that PIXTA forwards and screens. The provider pays listing, referral and performance fees whose amounts are not published. | c009, c020, c021, c030, c031, c044 |
| Q3 | sourced | Inventory comes from PIXTA's contributor stock library, licensed under a non-exclusive grant that includes ML use; from photos collected in ML-only paid briefs; from data PIXTA shoots itself; and from third-party Partners (IndiaPix, FileMarket, Factori) who warrant lawful acquisition. | c103, c048, c134, c065, c075, c004, c024, c051, c047 |
| Q4 | partial | PIXTA's 2023 revision banned AI-training use in its buyer licence and wrote ML use into the contributor grant. In 2024 it started selling contributor stock for generative-AI training, with an opt-out form, a 20% net revenue pool and opaque item-level reporting; contributor reaction was not found. | c121, c103, c124, c125, c126, c127, c129, c115 |
| Q5 | sourced | On PIXTA AI, PIXTA is a venue: the Partner licenses directly and warrants lawful acquisition, rights, consent and non-infringement. A breaching user indemnifies PIXTA. On pixta.jp PIXTA is licensor under its contributor grant and warrants its providers' rights assurances, with stock compensation capped at 1 million yen. | c010, c011, c025, c026, c029, c033, c032, c104, c108, c109 |
| Q6 | partial | PIXTA AI holds only listings and samples; delivery happens between buyer and Partner by means not published. PIXTA's own datasets are delivered as downloads via Google Drive, OneDrive or other storage PIXTA designates. | c011, c040, c068, c084 |
| Q7 | partial | Capturer: contributors grant ML rights, and PIXTA says it has photographers' ML permission. Person depicted: model releases go to PIXTA, and Partners warrant consent and keep it for PIXTA. Property: third-party facility permission is required. Buyers get assertions only. | c103, c081, c105, c106, c026, c027, c138, c080 |
| Q8 | partial | PIXTA AI licences are whatever the buyer and Partner sign, and samples are for evaluation only. PIXTA's own datasets are licensed for ML use only, and in 2023 display in outputs and image-generation training were barred. Stock terms give an audit right; no fingerprinting or leak controls were found. | c006, c007, c039, c070, c123, c111, c037 |
| Q9 | sourced | Both sides are contact-sales: PIXTA AI forwards inquiries to Partners who close deals themselves, with PIXTA charging the Partner fees. pixta.jp runs a hearing, quotation and purchase order, then invoices, and generative-AI licences are individual contracts. There is no checkout. | c008, c011, c030, c066, c083, c071, c130 |
| Q10 | partial | A PIXTA AI listing is Partner 'Posted Information' (description, samples, volume, categories) about Data licensable under a separate agreement. PIXTA can edit or delete listings at will and deletes them 30 days after a Partner leaves. No version, order or entitlement model is published. | c003, c020, c022, c038, c037, c112 |
| Q11 | sourced | Anonymous visitors see description and volume; metadata and samples need sign-in, and samples are for evaluation only. pixta.jp shows low-quality clips, preview video and sample data. Quality claims are PIXTA's own review for its stock and the provider's for third-party listings, which PIXTA disclaims. | c049, c007, c082, c067, c089, c057, c054, c034, c035 |
| Q12 | sourced | PIXTA AI pairs 'Datasets' with an 'Order made dataset' or 'Custom dataset' request on every listing. pixta.jp calls ready-made sets 'preset datasets' (プリセットデータセット) and bespoke work 'order-made datasets' (オーダーメイドデータセット), with presets serving as a base for custom shoots. | c043, c050, c074, c063, c085, c076, c058 |

## Narrative

### positioning

PIXTA Inc., a TSE-listed Japanese stock-media company [c096], runs two routes to ML data. PIXTA AI (pixta.ai) is an English-language marketplace connecting data providers with AI buyers [c042], [c001]. PIXTA's own 'ML image/video data service' on pixta.jp sells preset and order-made datasets drawn from its stock library and its own shoots [c100], [c074]. The two share a brand but differ in legal role: PIXTA AI is a venue, while pixta.jp sells as licensor.

### supply

PIXTA's datasets come from its contributor library, where contributors grant a perpetual, non-exclusive right that includes data analysis and machine learning [c103], [c048]. They also come from ML-only paid briefs whose photos are never sold as stock [c134], and from data PIXTA plans and shoots itself [c065], [c075]. Third-party Partners list on PIXTA AI: IndiaPix (Indian editorial archive) [c051], FileMarket [c053] and Factori's non-visual location data [c047]. IndiaPix appears as a listing company, not a PIXTA subsidiary [c097].

### object_model

The PIXTA AI terms define Data as photos, illustrations, videos and metadata for ML training, validation and testing [c003]. A Registered User is the buyer [c005] and a Partner is the seller [c004]. A listing is the Partner's Posted Information: description, samples, name and logo [c020]. The licence object sits outside the platform as an 'Agreement between the Members' [c006]. PIXTA delivers its own annotations in COCO, Pascal VOC, TFRecord, CVAT or CSV [c069]. No version or entitlement model is published.

### listing

Listings are public summaries: title, categories, description and volume, with 'Sign in to access metadata' and 'Sign in to access data sample' buttons [c049]. On 1 October 2026 there were 38 listings [c045]. Some listings show no provider name to anonymous visitors [c055]. PIXTA can change or delete any listing without notice [c022].

### discovery

PIXTA AI offers a category tree (human, vehicle, landscape, OCR, audio, healthcare) and a latest-datasets feed [c139], [c045]. pixta.jp keeps a hand-maintained guide page listing every preset dataset [c078].

### trust

PIXTA gives no warranty on Data, samples or listings, and provides all of them as-is [c034], [c035]. It disclaims the buyer-Partner agreement and the Data itself [c012]. Samples are evaluation-only [c007]. Provider claims such as FileMarket's 'signed authorization agreements' and '>95%' label accuracy are the provider's own [c053], [c054]. For its own sets PIXTA cites staff review and rights clearance [c089], [c064].

### transaction

On PIXTA AI the buyer sends an inquiry through PIXTA [c008]. PIXTA may screen it [c013] and passes the buyer's contact details to the Partner [c019]. Everything after that happens directly between buyer and Partner [c011], [c010]. On pixta.jp the buyer has a hearing, gets a quotation and orders on PIXTA's purchase-order form [c066], [c083], then pays by invoice [c071].

### pricing

PIXTA AI shows no prices. PIXTA charges Partners listing, referral and performance fees set in an unpublished Application Form [c030], [c031]. pixta.jp publishes preset prices: from 99,000 yen for 1,000 items [c059], 198,000 yen for 50 senior-care videos [c079], and 99,000 or 165,000 yen with annotation in 2021 [c086], [c087]. Volume-discount examples sit in a gated brochure [c073].

### licence

On PIXTA AI the licence is the Partner's own agreement with the buyer [c006]. The Partner warrants lawful acquisition, rights, data-subject consent and non-infringement [c024], [c025], [c026], [c029]. PIXTA's liability is capped at three months' fees [c036]. pixta.jp datasets are for ML use only [c070]. The standard stock licence bans AI training [c101], [c102]. Generative-AI training licences are signed as individual contracts [c130].

### custody

PIXTA AI hosts listings and samples and may keep submitted Data and samples after a member leaves [c040]. Delivery of purchased Data is left to the parties [c011]. PIXTA delivers its own datasets through Google Drive, OneDrive or other designated storage [c068], as a download within about 2 business days of the order [c084].

### vetting

Buyers and Partners must register [c017], and PIXTA may refuse anyone it deems inappropriate [c018]. It can demand a Partner's consent records [c028]. For its own stock, PIXTA reviews every item [c089] and requires model releases for every recognisable person [c105], [c106]. It also requires facility and property permissions [c138].

### contributor_pay

Stock contributors earn credits at a rank-based commission rate [c114], [c120], for example 22-42% for general creators on single photo sales [c119]; 10 credits equal 1,000 yen [c116]. Generative-AI dataset sales pay a pool of 20% of net receipts, split pro rata and paid annually [c127], [c128], without item-level detail [c129]. Paid ML briefs pay one-off credits per accepted set [c133], [c135]. Evaluation data earns nothing [c107].

### post_sale

When a Partner leaves, PIXTA deletes its listing within 30 days [c038]. After-sale rights follow the buyer-Partner agreement [c037]. Partners handle complaints at their own cost [c032]. A withdrawn buyer must destroy its samples [c039]. For PIXTA's own content, contributors cannot recall anything already bought or licensed [c112].

### catalogue_custom

Every PIXTA AI listing carries 'Looking for customize dataset?' [c050], and the home page offers an 'Order made dataset' with on-demand sourcing [c043]. pixta.jp separates preset datasets [c074] from order-made datasets that select from 112.9M items [c063] or are newly shot [c076]. Presets serve as the base for custom shoots [c085]. Annotation is sold alongside both [c058].

### changes

PIXTA AI terms date from 3 March 2025 [c002]. The stock terms were last revised on 22 April 2025 [c118]. A 2023 revision barred AI training under the stock licence [c121]. In 2024 PIXTA opened generative-AI licensing with a contributor opt-out [c124], [c125]. AI-generated stock was dropped in May 2026 [c095]. New datasets launched through June 2026 [c093], and 20th-anniversary coverage followed in September 2026 [c098].

### demand

PIXTA says its ML buyers include major automotive and manufacturing firms [c091]. It says they need Japan-specific scenes that overseas datasets lack [c092], and that preset sets suit PoC work [c060]. It expects dataset licensing to become a major revenue pillar [c132]. All of this is vendor-stated. Buyer inquiries on PIXTA AI are also mined for PIXTA's own marketing [c014].

### regulation

The PIXTA AI terms are governed by Japanese law, with the Tokyo District Court as exclusive first-instance court [c041]. Partners must warrant data-subject agreement to how the Data is provided and used [c026].

### other

PIXTA may subcontract PIXTA AI operations to PIXTA VIETNAM [c016]. The group's listed subsidiaries do not include IndiaPix [c097].

## Buyer journey

1. Lands on pixta.ai: a 'Marketplace for AI Training Data' with a category tree, latest datasets, and buttons to request a dataset or list one [c042], [c139]. [c042, c139]
2. Browses the Latest Datasets feed (38 listings) and opens a listing, which shows title, categories, description and volume but no price [c045], [c050]. [c045, c050]
3. Registers as a member, accepting the PIXTA AI terms, so they can see metadata and samples; PIXTA may refuse the registration [c017], [c049], [c018]. [c017, c049, c018]
4. Views the Partner's samples, possibly watermarked, which may be used only to evaluate the Data [c021], [c007]. [c021, c007]
5. Clicks 'Request datasets' and sends an inquiry through PIXTA, which may screen it and then passes the buyer's contact details to the Partner [c008], [c013], [c019]. [c008, c013, c019]
6. Negotiates price, licence and delivery directly with the Partner and signs an 'Agreement between the Members'; PIXTA is not a party [c011], [c006], [c010]. [c011, c006, c010]
7. Alternatively, for PIXTA's own data on pixta.jp: submits an inquiry, gets a preview video or sample data, then has an online hearing on conditions, volume, annotation, deadline and budget [c082], [c066], [c067]. [c082, c066, c067]
8. Receives a quotation (preset sets from 99,000 yen for 1,000 items) and orders on PIXTA's purchase-order form [c059], [c083]. [c059, c083]
9. Gets the data as a download or through Google Drive or OneDrive, within about 2 business days for a preset, and pays by invoice [c084], [c068], [c071]. [c084, c068, c071]
10. Holds an ML-only licence; generative-AI training needs an individual licence contract with PIXTA [c070], [c130]. [c070, c130]

## Claims

### positioning

- **c001** PIXTA AI is a website operated and provided by PIXTA Inc., a Japanese company.  
  _offer · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “the service PIXTA AI as defined below operated and provided by PIXTA Inc.” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** PIXTA AI describes itself as a marketplace connecting data providers with companies and researchers seeking AI training datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “marketplace designed to connect data providers with companies and researchers seeking top-quality datasets for AI training” — PIXTA Inc., <https://www.pixta.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c096** PIXTA Inc. is listed on the Tokyo Stock Exchange Standard market under code 3416.  
  _status · vendor_stated · as of 2026-05-26 (page_dated) · scope: PIXTA stock marketplace_
  - “東証スタンダード：3416” — PIXTA Inc., <https://pixta.co.jp/news/2075> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c100** PIXTA's corporate site presents ML image data provision as part of its content-sales business, built on its ML and annotation know-how.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA Inc._
  - “AI開発のための機械学習用画像データサービスの提供もおこなっています” — PIXTA Inc., <https://pixta.co.jp/business> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c004** Under the PIXTA AI terms a 'Partner' is a registered user whose purpose is selling, licensing or otherwise distributing Data.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “for the purpose of selling, licensing, and otherwise distributing the Data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c044** PIXTA AI invites data providers to list datasets on it to monetise their data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Join us today to monetize your data and empower the next generation of AI innovation!” — PIXTA Inc., <https://www.pixta.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c047** PIXTA AI lists third-party non-visual data too, such as Factori's global points-of-interest database.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Factori Global Points Of Interest (POI) Data” — PIXTA Inc., <https://www.pixta.ai/datasets/latest> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** PIXTA's own PIXTA AI listings are drawn from its stock library of Asian-featured images and videos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “All of the contents is sourced from PIXTA's stock library of 100M+ Asian-featured images and videos” — PIXTA Inc., <https://www.pixta.ai/datasets/pixta-ai-face-recognition-human-face-and-emotion-dataset-100-000-licensed-images-ace551e2-7809-4e54-baa1-841789106204> · docs · retrieved 2026-10-01 · quote check: exact
- **c051** IndiaPix lists a 40,958-image annotated dataset of Indian people on PIXTA AI, describing itself as a production-first visual content company.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “IndiaPix is a production-first visual content company, delivering authentic Indian imagery and datasets” — IndiaPix (listing on PIXTA AI), <https://www.pixta.ai/datasets/indiapix-anatomy-40958-computer-vision-human-age-clothing-face-recognition-emotion-pose-movement-makeup-occluded-face-healthcare-887c9386-2baa-4859-97a8-6d17cee90aba> · docs · retrieved 2026-10-01 · quote check: exact
- **c052** The IndiaPix listing says its images originate from IndiaPix's own editorial archive of Indian imagery.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “All visuals originate from IndiaPix’s specialized archive editorial-quality Indian images” — IndiaPix (listing on PIXTA AI), <https://www.pixta.ai/datasets/indiapix-anatomy-40958-computer-vision-human-age-clothing-face-recognition-emotion-pose-movement-makeup-occluded-face-healthcare-887c9386-2baa-4859-97a8-6d17cee90aba> · docs · retrieved 2026-10-01 · quote check: exact
- **c056** PIXTA Inc. is itself a provider on PIXTA AI, with its own provider profile listing its stock-derived datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Pixta Inc Empower Creative People for the Better World” — PIXTA Inc., <https://www.pixta.ai/providers/pixta-inc-1d3b9e7a-ae47-43e0-9c2c-b2de425d0313> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** PIXTA says more than 112.9 million images and videos are available for immediate supply as training data.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_ · **112900000 images and videos** (vendor-stated library size available as ML training data; snapshot)
  - “すぐに提供できる学習用データは1億1290万点以上。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The exact 112.9 million is a live counter on PIXTA's page. Nikkei (2026-09-27) gives only the order of magnitude, 'アーカイブ画像1億点以上', and PIXTA's Q2 2026 IR deck says '素材点数 1億点以上' (June 2026). Consistent, but no independent source prints 112.9m.
  - verifier (scope): **scope_ok**
- **c065** PIXTA sells person video data that it planned and shot itself, mainly of Japanese subjects filmed in Japan.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “PIXTAが企画・撮影した高品質、権利クリアなAI開発・機械学習向け動画データ。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source found (no search available). PIXTA's own sources point the other way for at least one set: its 2026-04-27 release (pixta.co.jp/news/2064) says the daily-behaviour video dataset was selected from its existing video stock, with Japanese cast filmed in Japan; the 2023-12-18 overhead video set was also drawn from stock ('670万点以上の動画素材の中から'). Custom shooting for ML exists (TECH+, 2023-09-27). Whether any listed video set was planned and shot by PIXTA itself should be checked against the profile's quote.
  - verifier (scope): **quote_incomplete** — The quote shows 'PIXTAが企画・撮影した' under the heading 人物データ販売, but not the Japanese-subject part; the next sentence does: '日本人を中心とした被写体を国内で撮影しています'. Caveat: PIXTA's own 2026-04-27 behaviour-video release says that set was selected from existing stock, so not every person video set was necessarily shot to plan.
- **c075** PIXTA also collects and newly shoots data suited to machine learning and sells it as datasets.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA preset ML datasets (pixta.jp)_
  - “機械学習に適したデータを独自に収集、新規撮影してデータセットにして販売しています。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=72991> · docs · retrieved 2026-10-01 · quote check: exact
- **c081** PIXTA says it obtained the photographers' permission to use the senior-caregiver footage as machine-learning data.  
  _terms · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “撮影者から機械学習用データ活用の許諾取得済み” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c103** PIXTA contributors grant PIXTA a perpetual, worldwide, non-exclusive right including use for data analysis and machine learning.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “use for data analysis and machine learning etc.” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c117** The pixta.jp site footer showed 455,297 contributing creators on 1 October 2026 (vendor-stated).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_ · **455297 contributing creators** (vendor-stated count shown in pixta.jp footer; snapshot)
  - “クリエイター数： 455,297 人” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A live footer counter. PIXTA's Q2 2026 IR deck (eir-parts.net ir_material_for_fiscal_ym/210501, figures at end-June 2026) gives '投稿クリエイター登録数 約45万人', consistent. Registered creators, not necessarily active ones.
  - verifier (scope): **scope_ok** — Footer counter shown on pixta.jp/terms. It counts registered creators; the IR deck's 約45万人 is described as 投稿クリエイター登録数 (registered contributor accounts).
- **c122** PIXTA told contributors in 2023 that it had been licensing their photos as ML datasets mainly for image recognition such as face authentication and object detection.  
  _offer · vendor_stated · as of 2023-08-21 (page_dated) · scope: PIXTA terms revision notice 2023_
  - “顔認証や物体検知などといった主に画像認識のための機械学習の学習データとしての使用を想定し” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=69807> · docs · retrieved 2026-10-01 · quote check: exact
- **c131** The generative-AI licensing covered photos, illustrations and videos on sale in the subscription plan on 22 April 2024, minus opt-outs.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “2024年4月22日の時点で定額制で販売中の写真・イラスト・動画（オプトアウトしたものを除く）” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
- **c134** Photos collected through PIXTA's paid ML briefs are not sold on the PIXTA site but only as PIXTA's ML datasets.  
  _terms · vendor_stated · as of 2023-11-02 (page_dated) · scope: PIXTA paid contributor brief for ML face photos_
  - “当社による機械学習等向けのデータセットとしての販売になります” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70326> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c003** The PIXTA AI terms define 'Data' as photos, illustrations, videos and metadata suitable for machine-learning training, validation and testing.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “suitable for use as machine learning Training Data, Validation Data, and Testing Data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** Under the PIXTA AI terms a 'Registered User' is a registered member who wishes to procure Data (the buyer side).  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - ““Registered User” means the User who wishes to procure the Data and has completed the prescribed membership registration” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** PIXTA delivers annotation data in COCO, Pascal VOC, TFRecord, CVAT or CSV format.  
  _architecture · vendor_stated · as of 2022-07-13 (page_dated) · scope: Japanese people 1,000-image ML dataset (pixta.jp)_
  - “アノテーションデータは、COCO、Pascal VOC、TFRecord、CVAT、CSV形式に対応いたします。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=62476> · pricing_page · retrieved 2026-10-01 · quote check: exact

### listing

- **c009** A PIXTA AI Partner can list samples and information about its Data and receives from PIXTA information about buyers who wish to procure it.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “receive information from Pixta about the Registered User who wishes to procure the Data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Partners publish descriptions and samples of Data 'licensable under the Agreement between the Members', plus their name and logo, on designated PIXTA AI pages.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “descriptions and the Samples of the Data licensable under the Agreement between the Members, the Partner’s own tradename” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c045** On 1 October 2026 the PIXTA AI 'Latest Datasets' page showed 38 dataset listings.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_ · **38 dataset listings** (count shown on the public Latest Datasets page, all providers; snapshot)
  - “Latest Datasets ( 1 - 20 of 38 results)” — PIXTA Inc., <https://www.pixta.ai/datasets/latest> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A live count on the vendor's page. pixta.ai/datasets/latest fetched 2026-10-01 showed 20 per page over 2 pages, 38 in total, consistent with the claim. No independent source exists for a live listing count; no search available.
  - verifier (scope): **scope_ok**
- **c049** On a PIXTA AI listing, metadata and data samples are behind sign-in; an anonymous visitor sees title, categories, description and volume.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Sign in to access metadata → Sign in to access data sample →” — PIXTA Inc., <https://www.pixta.ai/datasets/pixta-ai-face-recognition-human-face-and-emotion-dataset-100-000-licensed-images-ace551e2-7809-4e54-baa1-841789106204> · docs · retrieved 2026-10-01 · quote check: exact
- **c055** Some PIXTA AI listings, such as 'Senior People Dataset Video' (11,677 videos), show no provider name to an anonymous visitor.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Senior People Dataset Video” — PIXTA AI (listing with no provider name shown), <https://www.pixta.ai/datasets/senior-people-dataset-video-c5d03303-1a13-493e-b558-335fee6a9561> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** PIXTA's preset dataset list (updated 24 June 2026) includes image sets such as 1,000 Japanese people images and video sets such as 50 overhead videos.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA preset ML datasets (pixta.jp)_
  - “現在販売しているすべてのプリセットデータセットを紹介しています。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=72991> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c139** PIXTA AI lets visitors browse datasets by a category tree covering computer vision, healthcare, OCR and audio.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Explore data by category on PIXTA AI” — PIXTA Inc., <https://www.pixta.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c007** Registered buyers can view Partner-published samples on PIXTA AI, but may use them only to evaluate the Data and not as training data.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “may not be used for any other purpose (including the use of the Samples as the Training Data etc.)” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** PIXTA disclaims liability for the negotiation and content of the buyer-Partner agreement and for the Data itself.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta shall not be liable for the negotiation and content of the Agreement between the Members as well as for the Data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** Partners agree PIXTA may give samples, with or without watermark, free to registered buyers for evaluation.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta may provide the Samples, whether with or without watermark, for free to the Registered User” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** PIXTA gives no warranty of correctness, completeness or latestness for the Data, samples or listings.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “PIXTA MAKES NO WARRANTY OF CORRECTNESS, COMPLETENESS, OR LATESTNESS REGARDING THE DATA” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** All Data, samples and listing information on PIXTA AI are provided 'as is'.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “ANY AND ALL THE DATA, THE SAMPLES AND THE POSTED INFORMATION SHALL BE PROVIDED “AS IS.”” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** FileMarket's face dataset listing on PIXTA AI asserts that all biometric data was gathered with signed authorization agreements.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “All biometric data is gathered with signed authorization agreements” — FileMarket AI Data Labs (listing on PIXTA AI), <https://www.pixta.ai/datasets/filemarket-diverse-human-face-data-20-000-ids-face-recognition-data-image-video-ai-training-data-biometric-data-ab28fd91-363b-4b30-aaca-12bd6404e106> · docs · retrieved 2026-10-01 · quote check: exact
- **c054** FileMarket's own listing on PIXTA AI claims label accuracy above 95% for its face dataset; this is provider-asserted.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “The labels for face pose, race, gender, and age are highly accurate, exceeding 95%” — FileMarket AI Data Labs (listing on PIXTA AI), <https://www.pixta.ai/datasets/filemarket-diverse-human-face-data-20-000-ids-face-recognition-data-image-video-ai-training-data-biometric-data-ab28fd91-363b-4b30-aaca-12bd6404e106> · docs · retrieved 2026-10-01 · quote check: exact
- **c057** PIXTA's own PIXTA AI listings say each annotated dataset goes through AI and human review for labelling consistency; this is PIXTA's own claim.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Each data set is supported by both AI and human review process to ensure labelling consistency and accuracy” — PIXTA Inc., <https://www.pixta.ai/providers/pixta-inc-1d3b9e7a-ae47-43e0-9c2c-b2de425d0313> · docs · retrieved 2026-10-01 · quote check: exact
- **c064** PIXTA tells ML buyers that because its datasets are stock content made for commercial use there is no copyright or portrait-right concern, including for generative AI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “商用利用を前提としたストック素材なので著作権や肖像権の心配がございません。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c067** After the hearing PIXTA prepares a specification and sample data for the buyer.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “ヒアリングに基づき、仕様書やサンプルデータをご用意いたします。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c080** PIXTA says the senior-caregiver video dataset is live-action MP4 with model releases obtained.  
  _terms · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “実写MP4（モデルリリース取得済み）” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c082** For the senior-caregiver dataset PIXTA shows trimmed, low-quality sample clips and sends a preview video after inquiry.  
  _architecture · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “サンプルでは動画の一部をトリミングして低画質に加工したものを表示しています。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact

### transaction

- **c008** On PIXTA AI a buyer procures Data by making an inquiry to the Partner through PIXTA.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “The Registered User is able to make an inquiry to the Partner through Pixta for the purpose of procuring the Data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** PIXTA states it is not involved in negotiating, concluding or executing the agreement between buyer and Partner.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “as well as the negotiation, conclusion, and execution of the Agreement between the Members” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c011** Under the PIXTA AI terms the sale and purchase of Data and all related communications are carried out directly between the user and the Partner.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “all related communications shall be carried out directly by and between the User and the Partner” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in PIXTA AI's own terms of use (pixta.ai/term). No partner or third party restates it; not searched further (no search available).
  - verifier (scope): **scope_ok**
- **c019** PIXTA passes an inquiring buyer's name, contact details and inquiry content to the Partner whose Data is asked about.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta provides the information of the inquiring User to the Partner of the Data in question” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** Each PIXTA AI listing has a 'Request datasets' button and a prompt for customised datasets, and shows no price.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “Looking for customize dataset?” — PIXTA Inc., <https://www.pixta.ai/datasets/pixta-ai-face-recognition-human-face-and-emotion-dataset-100-000-licensed-images-ace551e2-7809-4e54-baa1-841789106204> · docs · retrieved 2026-10-01 · quote check: exact
- **c066** PIXTA holds an online hearing (e.g. Zoom) on the buyer's asset conditions, volume, annotation, deadline and budget before supplying ML data.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “ご希望の素材条件、素材点数、アノテーション条件、納期、ご予算についてZoom等のオンライン会議ツールにてヒアリング” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c071** PIXTA's ML data is paid by invoice (month-end close, payment two months later) after free PIXTA registration and an invoice-payment application.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “請求書支払（月末締め・翌々月支払い）となります。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c072** PIXTA offers a free preliminary search and quote on whether matching images exist and the lead time.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “事前の調査・お見積りも無料で承ります。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c083** PIXTA's dataset purchase flow is inquiry, preview, a quotation, then an order on PIXTA's own purchase-order form.  
  _architecture · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “要件を確認後、お見積書を発行いたします。弊社規定の発注書書式にてご発注をお願いしております。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — PIXTA's own description of its order process. Press relays (ITmedia 2021, TECH+ 2024) mention only an inquiry/sales contact, not the preview-quote-PO sequence.
  - verifier (scope): **quote_incomplete** — The quote shows only the quotation and the PIXTA-format purchase order. The inquiry and preview steps are on the same page as numbered steps ('お問い合わせ', 'サンプル動画のご案内', 'お見積り・ご契約', '納品'). The flow is stated for this video dataset; calling it 'PIXTA's dataset purchase flow' generalises from one product page.
- **c130** PIXTA said generative-AI training licences would be individual licence contracts with enquiring customers, not offered to the public at large.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “そのような顧客との個別でのライセンス契約を締結することを想定しており” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c030** PIXTA may charge Partners listing fees, referral fees and performance rewards on transactions after PIXTA's referrals, per a separate Application Form.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “listing fees, referral fees, and other fees (including the performance rewards for transactions after the Pixta’s referrals)” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in PIXTA AI's own terms. The Application Form and any fee schedule are not public; no partner page found that states the fees (no search available).
  - verifier (scope): **quote_incomplete** — The quote lists the fees but not who pays them or the Application Form. The words 'Pixta is entitled to charge the Partner the listing fees' would show that Partners are charged.
- **c031** The Partner fee amounts are set in a separate Application Form that is not published with the terms.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “set forth in the separate Application Form” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c059** PIXTA's Japanese ML service says its image/video datasets can be bought from 1,000 items for 99,000 yen including tax.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_ · **99000 JPY per dataset of 1,000 items** (buyer pays PIXTA; entry price 'from', tax included; preset dataset; one-off)
  - “データセットは1,000点 99,000円（税込）からご購入いただけます。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — PIXTA release of 2023-09-27 lodged on TDnet: the from-99,000-yen price is for the Japanese people IMAGE dataset from stock photos, 1,000 items upward. Video datasets are priced separately (50 videos for 198,000 yen in the 2023-12-18 and 2026 releases), so 'image/video datasets from 99,000 yen' overstates it for video. TECH+ (2024-09-24) relays 99,000 yen for a 1,000-image wheelchair dataset.
    - “PIXTA日本人画像データセット（ストックフォト1,000点〜）99,000円（税込）〜” — PIXTA Inc. (TSE timely disclosure, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2339857/00.pdf> · filing · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (scope): **scope_wrong** — The page says only 'データセットは1,000点 99,000円（税込）から'. The 1,000-item, 99,000-yen entry price matches the image datasets. PIXTA's video datasets are sold as 50-video sets at 198,000 yen (pixta.jp/guide/?p=74272; pixta.co.jp/news/2064 and 2090; the 2023-12-18 TSE-lodged release). So 'image/video datasets from 1,000 items' overstates it for video; say image datasets.
- **c073** PIXTA's downloadable ML service brochure, behind a form, contains price examples including volume discounts; it was not read.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “価格例（ボリュームディスカウント・アノテーション有無による料金例など）” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c077** PIXTA's full list of preset datasets asks buyers to enquire about dataset contents and prices.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA preset ML datasets (pixta.jp)_
  - “このページにあるデータセットの内容や価格については、お気軽にお問い合わせください。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=72991> · docs · retrieved 2026-10-01 · quote check: exact
- **c079** PIXTA's 'senior and caregiver behaviour' video dataset of 50 videos is priced at 198,000 yen including tax, annotation extra.  
  _number · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_ · **198000 JPY per 50-video dataset** (buyer pays PIXTA; tax included; annotation charged separately; one-off)
  - “価格 198,000円（税込）” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Only PIXTA's own pages found: pixta.co.jp/news/2090 (2026-06-24) gives 動画50点 at 198,000円（税込）. The Q2 2026 IR deck (eir-parts.net ir_material_for_fiscal_ym/210501) confirms two care datasets launched, without prices. The release was not lodged on TDnet and no press relay was linked from PIXTA's media page; no search available to find a PR TIMES copy.
  - verifier (scope): **quote_incomplete** — Right page (the senior and caregiver video dataset, dated 2026-06-24), but the quote shows only the price. The words '動画50点' and '※各種アノテーションは有料にて承りますのでご相談ください' would show the size and the separate annotation charge.
- **c086** In 2021 PIXTA priced its 1,000-image Japanese people ML dataset at 99,000 yen including tax without annotation.  
  _number · vendor_stated · as of 2022-07-13 (page_dated) · scope: Japanese people 1,000-image ML dataset (pixta.jp)_ · **99000 JPY per 1,000-image dataset** (buyer pays PIXTA; tax included; without annotation; one-off)
  - “アノテーションなし　99,000円（税込）” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=62476> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — ITmedia, 2021-06-28, relaying PIXTA's launch: 1,000-image sets of Japanese people with and without masks, with annotation 165,000 yen and without 99,000 yen, tax included. The dataset was the 'mask-wearing' (and a matching no-mask) Japanese face set, not a generic Japanese people set. PIXTA's own TSE-lodged release (eir-parts.net tdnet/1994153, 2021-06-28) gives the same prices. Reached via the link on pixta.co.jp/news/1511.
    - “価格は順に16万5000円、9万9000円（いずれも税込）。” — ITmedia NEWS, <https://www.itmedia.co.jp/news/articles/2106/28/news122.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The page (pixta.jp/guide/?p=62476) was published 2021-06-28 and updated 2022-07-13; the profile's as_of uses the update date. The dataset is the mask-wearing / no-mask Japanese face image set; 'Japanese people ML dataset' is a fair shorthand.
- **c087** In 2021 PIXTA priced the same 1,000-image dataset with face bounding-box annotation at 165,000 yen including tax.  
  _number · vendor_stated · as of 2022-07-13 (page_dated) · scope: Japanese people 1,000-image ML dataset (pixta.jp)_ · **165000 JPY per 1,000-image dataset** (buyer pays PIXTA; tax included; with ready-made face bounding-box annotation; one-off)
  - “アノテーションあり　165,000円（税込）” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=62476> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — ITmedia confirms the 165,000 yen annotated price (annotation as CSV) but does not say what the annotation marks. The 'face bounding box' detail appears only in PIXTA's own release lodged on TDnet (eir-parts.net/doc/3416/tdnet/1994153/00.pdf, 2021-06-28): '既成アノテーションは、顔部分の外接矩形となります'. Scope: the set was the mask-wearing / no-mask Japanese face dataset.
    - “価格は順に16万5000円、9万9000円（いずれも税込）。” — ITmedia NEWS, <https://www.itmedia.co.jp/news/articles/2106/28/news122.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows the price but not the face bounding-box detail; the page states '既成アノテーションは、顔部分の外接矩形となります'.
- **c090** PIXTA launched a 1,000-image 'worker' ML dataset on 18 May 2026 at 99,000 yen including tax.  
  _number · vendor_stated · as of 2026-05-18 (page_dated) · scope: PIXTA ML image/video data service (pixta.jp)_ · **99000 JPY per 1,000-image dataset** (buyer pays PIXTA; tax included; annotation extra; one-off)
  - “99,000円（税込）” — PIXTA Inc., <https://pixta.co.jp/news/2072> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Only PIXTA's own release found (pixta.co.jp/news/2072, dated 2026-05-18, 作業員画像データセット 1,000点, 99,000円（税込）). Not lodged on TDnet; no media relay listed on PIXTA's media-coverage page; no search available.
  - verifier (scope): **quote_incomplete** — The quote '99,000円（税込）' alone does not show which dataset or its size. Needed: '作業員画像データセット' and '1,000点' from the same release (pixta.co.jp/news/2072, dated 2026-05-18).
- **c094** PIXTA's 1,000-image senior-caregiver dataset is priced at 99,000 yen including tax.  
  _number · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA ML image/video data service (pixta.jp)_ · **99000 JPY per 1,000-image dataset** (buyer pays PIXTA; tax included; annotation extra; one-off)
  - “99,000円（税込）” — PIXTA Inc., <https://pixta.co.jp/news/2090> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — As for c079: PIXTA's own release (pixta.co.jp/news/2090) gives 画像1,000点 at 99,000円（税込）; no relay or filing found; no search available.
  - verifier (scope): **quote_incomplete** — pixta.co.jp/news/2090 prices two datasets: the image set (画像1,000点, 99,000円) and the video set (動画50点, 198,000円). A bare '99,000円（税込）' does not show which one; the quote needs '画像1,000点' or the image dataset's name.

### licence

- **c006** The licence for PIXTA AI data is an 'Agreement between the Members', any agreement on the Data made directly between buyer and Partner, including licence agreements.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “any and all agreements regarding the Data entered into between the Registered User and the Partner including” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A definition in PIXTA AI's own terms; exists only on the vendor's site.
  - verifier (scope): **quote_incomplete** — The quote stops at 'including'; the words that follow in the definition (the licence agreements) are needed to show that licences fall inside the 'Agreement between the Members'.
- **c024** The Partner warrants to PIXTA that the Data, samples and posted information were obtained lawfully and produced in accordance with applicable law.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “the Data, the Samples, and the Posted Information have been obtained and acquired in a lawful and appropriate manner” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** The Partner warrants it has the lawful right to deliver the Data and grant the licences set out in the buyer-Partner agreement.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “in respect of the Data to be licensed under the Agreement between the Members, the Partner has the lawful right to deliver” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** Where Data contains personal information, the Partner warrants that the data subject agrees to how the Data and samples are provided and used.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “agrees how the Data and the Samples are provided and to what extent used, as set forth in the Agreement between the Members” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A Partner warranty in PIXTA AI's own terms; exists only on the vendor's site.
  - verifier (scope): **quote_incomplete** — The quote shows the data subject's agreement but not that it is a Partner warranty, or that it applies where Data contains personal information. The preceding words of the same clause, about the person to whom the personal information pertains, are needed.
- **c027** The Partner must obtain and keep written consent and acquisition records for personal data and submit them to PIXTA on request; buyers are not named as recipients.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “including, but not limited to, written consent from the Person, that show how the personal data” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** The Partner warrants that exercise of the granted rights by PIXTA and users does not infringe third-party rights or violate laws.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “does not infringe, misappropriate, or otherwise violate the rights of any third party, or violate any Laws” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c033** A user in breach of the PIXTA AI terms must indemnify PIXTA for resulting damages including reasonable attorney's fees.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “the breaching User shall indemnify Pixta for and against any and all damage and expenses related thereto” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** PIXTA's aggregate liability is capped at the fees paid between PIXTA and the user in the three months before the damage.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “THE AMOUNT OF FEES THAT HAS BEEN PAID BETWEEN PIXTA AND THE USER FOR A TERM OF THREE (3) MONTHS PRIOR” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c070** Images delivered in PIXTA's ML datasets may be used only for machine learning.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “機械学習用画像データセットは、機械学習用途での使用に限定しております。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c101** PIXTA's standard stock licence prohibits using content for machine learning or AI development and directs such buyers to its separate dataset sales.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “AI（生成AIを含むがこれに限られません。）開発のための機械学習目的その他研究開発目的でコンテンツを使用すること” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c102** The English PIXTA licence likewise bans ML and AI-development use and says the dataset for machine learning is available separately.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “the dataset for machine learning is available separately” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c104** The contributor grant lets PIXTA authorise third parties to use contributed content under the licence or other terms PIXTA designates.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “under the License Agreement or the other terms and conditions designated by Pixta” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c108** In its stock licence PIXTA warrants to buyers that it has obtained non-infringement warranties on copyright and portrait rights from content providers.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “コンテンツの提供者から、著作権、肖像権その他の権利について他の第三者の権利を侵害するものでない旨の保証を得ていることを保証します。” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c109** PIXTA's stock-licence compensation for rights infringement is capped at 1 million yen per member or per organisation.  
  _number · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_ · **1000000 JPY aggregate compensation cap** (PIXTA's indemnity to stock buyers, per member or per registered organisation; stock licence, not stated for ML datasets; aggregate)
  - “会員毎の総計（当該会員が利用した複数のコンテンツに権利侵害があった場合、累計の賠償額を指すものとします。）で100万円を超えない” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in PIXTA's own stock licence terms.
  - verifier (scope): **quote_incomplete** — The quote shows the per-member cap only. The per-organisation cap is in the continuation of the same sentence: '所属組織を登録している場合、所属組織毎の総計で、100万円を超えないものとします'.
- **c110** PIXTA's stock indemnity does not apply where PIXTA licensed use on terms different from the standard terms unless PIXTA agrees in writing.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “当社が書面にて本項の適用を認めない限り、本項の適用の対象外となります。” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c111** PIXTA reserves a right to investigate how buyers use purchased stock content, such as print runs and purposes.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “制作部数又は使用目的等コンテンツの使用に関する事項を調査する権利を有しており” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c123** PIXTA's 2023 ML dataset licence conditions in principle banned displaying content in ML outputs and using it to train image-generation models.  
  _terms · vendor_stated · as of 2023-08-21 (page_dated) · scope: PIXTA terms revision notice 2023_
  - “「画像生成モデルの学習データとして利用すること」は原則として禁止しています” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=69807> · docs · retrieved 2026-10-01 · quote check: exact
- **c136** PIXTA's brief says PIXTA and its customers may use the photos as AI training and validation data, including for generative models.  
  _terms · vendor_stated · as of 2025-11-13 (page_dated) · scope: PIXTA paid contributor brief for ML images_
  - “当社及び当社の顧客が、AI開発（生成モデル含む）の学習データ・検証データ等として使用” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=73298> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c040** Even after a member leaves, PIXTA may keep and use the member's registration information, Data and samples for a period it designates.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta may keep and utilize the Member’s registration information that has been collected by Pixta” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c068** PIXTA delivers ML image and video data through storage it designates, such as Google Drive or OneDrive.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “画像・動画データはGoogleDriveまたはOneDriveなど、当社指定のストレージ経由で納品します。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A delivery mechanic stated in PIXTA's own FAQ or service page; no independent source would carry it.
  - verifier (scope): **scope_ok** — Service-level statement. The senior-caregiver video dataset page (pixta.jp/guide/?p=74272) describes delivery by download within as little as 2 business days, which is consistent with designated storage.
- **c084** PIXTA delivers a preset dataset as a download, in as little as 2 business days after the purchase order.  
  _architecture · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “発注書締結後、最短2営業日でダウンロード形式にて納品いたします。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact

### vetting

- **c013** PIXTA may withhold a buyer's inquiry from the Partner if it judges the inquiry inappropriate, without giving reasons.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “is inappropriate, Pixta will not provide the content of the inquiry to the Partner” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Using parts of the PIXTA AI service requires membership registration designated by PIXTA.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “To use a prescribed part of the Service, the User is required to complete the membership registration procedure” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** PIXTA may refuse or cancel any registration it deems inappropriate, including for anti-social-forces links, without giving reasons.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “If otherwise Pixta determines that the User is inappropriate as the Member.” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** PIXTA can require the Partner to submit its consent contracts and documents to PIXTA.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “If requested by Pixta, the Partner shall submit the contracts or documents and related necessary information to Pixta” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c089** PIXTA says all stock content is sold only after staff review, so copyright and portrait rights are cleared.  
  _offer · vendor_stated · as of 2022-07-13 (page_dated) · scope: Japanese people 1,000-image ML dataset (pixta.jp)_
  - “素材は全てスタッフによる審査を経たうえで販売されており” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=62476> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c105** PIXTA contributors must submit model releases for every recognisable person in uploaded content.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “the Contributor Member shall submit to Pixta the model release for all such persons” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c106** Contributors warrant they keep all valid model releases and will provide them to PIXTA on request.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “at Pixta’s request, shall provide Pixta with the model release and/or necessary information related thereto” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c137** PIXTA's car-grille brief required that no faces or personal information be reflected in the car body.  
  _terms · vendor_stated · as of 2025-11-13 (page_dated) · scope: PIXTA paid contributor brief for ML images_
  - “車体に人物の顔や個人情報が特定できるものが反射して写っていないこと” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=73298> · docs · retrieved 2026-10-01 · quote check: exact
- **c138** PIXTA's contributor agreement treats content as inappropriate where permission from the manager of third-party facilities, animals or objects was not obtained.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “第三者が管理する施設、動物、物品等について、当該管理者又は権利保有者の適切な許可を取得していないもの” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c023** PIXTA pays Partners no remuneration or royalties for the listing, sample and promotional uses granted in Article 6.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta is not required to pay any remuneration, royalties, price for the non-exercise of the moral rights” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c107** Contributors get no royalty for data PIXTA provides for prior evaluation or testing under an ML licence.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace, international site (pixtastock.com) terms_
  - “provision of data under license for prior evaluation or testing purpose for the machine learning” — PIXTA Inc., <https://www.pixtastock.com/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** PIXTA pays contributors sales rewards in earned credits according to a commission rate it sets.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “獲得クレジット単位で販売報酬を支払います” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — ITmedia AI+, 2024-04-09, relays that creators are rewarded in 'earned credits' exchangeable for cash (said of generative-AI training sales). It does not mention a commission rate set by PIXTA; that part rests on the contributor agreement only.
    - “PIXTA内で現金と交換できる「獲得クレジット」を報酬として付与するという。” — ITmedia AI+, <https://www.itmedia.co.jp/aiplus/articles/2404/09/news113.html> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The rate-setting part is not in the quote. The full clause reads '当社が定めるコミッション率に従って獲得クレジット単位で販売報酬を支払います'.
- **c116** PIXTA says 10 credits are worth 1,000 yen and can be cashed out once accumulated.  
  _number · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_ · **100 JPY per earned credit** (contributor credit exchange value as stated in the terms note (10 credits = 1,000 yen), before withholding tax and fees; not stated)
  - “10クレジット（1,000円分）が貯まった時点で換金申請が可能となり” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A credit conversion rule in PIXTA's own contributor terms or help pages.
  - verifier (scope): **scope_ok**
- **c119** PIXTA pays general contributors 22-42% commission on single-image photo and illustration sales, by creator rank.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA stock contributor commission_ · **42 percent of net sale (upper bound; range 22-42)** (contributor share of pre-tax sale, general (non-exclusive) creator, single purchase of photo/illustration; stock sales, not ML datasets; per sale)
  - “22～42%” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=3336> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — PIXTA's own contributor commission table; no search available to look for creator blogs restating it (which would only be relays).
  - verifier (scope): **quote_incomplete** — '22～42%' alone does not show the tier. The row reads '一般 クリエイター | 通常 コミッション率 | 22～42%' under '写真・イラスト素材が購入された場合のコミッション率'. The same range also applies to subscription sales on plans of 10 downloads a month or fewer, so 'single-image' is narrower than the page; exclusive creators get 30-53%.
- **c120** PIXTA's contributor commission depends on registration status and sales record (creator rank).  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA stock contributor commission_
  - “売上の一部が獲得クレジットとして加算されます” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=3336> · docs · retrieved 2026-10-01 · quote check: exact
- **c127** For generative-AI dataset sales PIXTA pays contributors 20% of net receipts after its costs, pro-rated by their share of the dataset.  
  _number · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_ · **20 percent of net receipts** (contributors' pool: 20% of PIXTA's pre-tax receipts minus related costs, split by each contributor's share of content in the dataset; generative-AI training licences; per year (paid annually))
  - “残余の金額の20%に相当する金額に対して、機械学習用データセットに含まれたコンテンツの割合に応じて算出した金額” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — ITmedia AI+ (2024-04-09) independently reports that PIXTA began selling stock as generative-AI training material, with opt-out by 22 April 2024 and rewards in earned credits, but gives no percentage or formula; the 20%-of-net-receipts rule was not found outside PIXTA's own pages. No search available.
  - verifier (scope): **scope_ok**
- **c128** PIXTA pays generative-AI licence rewards once a year, totalled for January to December and credited by the end of the following January.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “原則として各年度毎（毎年1月1日から12月31日まで）に集計し” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
- **c129** PIXTA does not show contributors which of their items were used or for what in generative-AI licences, only a credit total.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “対象となったコンテンツの素材番号や用途等に関する情報は当社内部で管理され” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
- **c133** In a 2023 paid brief PIXTA paid 10 credits per accepted set of 6 frontal face photos, collected only for ML datasets.  
  _number · vendor_stated · as of 2023-11-02 (page_dated) · scope: PIXTA paid contributor brief for ML face photos_ · **10 credits per accepted set of 6 photos** (one-off reward to the contributor, covering all licence consideration for the period; ML-only brief; one-off)
  - “採用された画像一式（6点）につき 10クレジット” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70326> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A contributor brief on PIXTA's own site.
  - verifier (scope): **quote_incomplete** — The reward is correct. 'Collected only for ML datasets' needs the page's words 'PIXTAサイト（https://pixta.jp/）では販売されず、当社による機械学習等向けのデータセットとしての販売になります'. Also, the 6-photo set is front, right-facing and left-facing shots, each with and without a mask, so '6 frontal face photos' is loose (the title says 正面から撮影した顔写真).
- **c135** In a November 2025 brief PIXTA paid 15 credits per accepted set of 3-7 car front-grille photos for ML datasets.  
  _number · vendor_stated · as of 2025-11-13 (page_dated) · scope: PIXTA paid contributor brief for ML images_ · **15 credits per accepted set of 3-7 photos** (one-off reward to the contributor on passing review; ML-only brief; one-off)
  - “1式（写真３点以上最大７点まで）あたり、15クレジット分の獲得クレジットを一括で付与します” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=73298> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A contributor brief on PIXTA's own site.
  - verifier (scope): **scope_ok** — The page (2025-11-13, now closed) also says PIXTA and its customers may use the set for AI development, including generative models.

### post_sale

- **c022** PIXTA may delete or change a Partner's listing and samples without prior notice or consent.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta may delete or change the Posted Information and/or the Samples without prior notice to the Partner” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c032** The Partner must resolve at its own cost any complaint or claim about its Data, samples or listing.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “The Partner shall resolve at its own cost and expense any complaint or claim made by the User or any other third parties” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** After a member leaves, rights and obligations under the buyer-Partner agreement are governed by that agreement and PIXTA is not involved.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “shall be subject to the Agreement between the Members, and Pixta shall not be involved in such treatment” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** When a Partner cancels, PIXTA deletes its samples and listing from PIXTA AI within 30 days.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta will delete the Samples and the Posted Information from the Service within thirty (30) days” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c039** A buyer withdrawn for breach or inappropriateness must stop using and destroy all samples and copies.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “shall cease the use of, and destroy, all the Samples (including its copies)” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c112** Contributors cannot demand that buyers or PIXTA's licensees stop using content already bought or licensed, even after deletion or leaving.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “既に購入等されたコンテンツについてその使用中止や差止めを求めることは一切できません。” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c113** A contributor's deletion request ends sale of content already on sale 30 days later.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “当該削除手続きから30日後に当該コンテンツの販売が終了となります。” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c043** The PIXTA AI home page offers an 'Order made dataset' option with on-demand sourcing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “on-demand sourcing available” — PIXTA Inc., <https://www.pixta.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** PIXTA AI also sells a fully-managed data annotation service with a data-sourcing service drawing on its licensed data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “our data-sourcing service provides high-quality data to jumpstart your project annotation” — PIXTA Inc., <https://www.pixta.ai/data-annotation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c062** PIXTA says it can supply up to 4 million images of Japanese people through its made-to-order dataset service.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_ · **4000000 images of Japanese people** (vendor-stated maximum for order-made datasets; snapshot)
  - “日本人人物画像は最大400万点提供が可能です。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A capacity claim on PIXTA's own service page; no press or filing found that repeats the 4 million figure (no search available; checked PIXTA's TSE-lodged ML releases 2021-2024 and TECH+/ITmedia/Nikkei xTECH articles linked from its media page).
  - verifier (scope): **scope_ok** — The page introduces the figure with '例えば' (for example); the made-to-order framing comes from the page's context.
- **c063** PIXTA's 'order-made dataset' (オーダーメイドデータセット) selects the best images and videos from its 112.9M-item library to order.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “1億1290万点以上の素材のなかから最適な画像・動画データをオーダーメイドでご提供。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c074** PIXTA calls its ready-made ML datasets 'preset datasets' (プリセットデータセット), pre-selected by theme from over 100 million images and videos.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA preset ML datasets (pixta.jp)_
  - “PIXTAのプリセットデータセットは、1億点以上ある画像・動画データのなかから、テーマに沿ってあらかじめデータをセレクトしたデータセットです。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=72991> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** Besides preset datasets PIXTA does made-to-order dataset creation, new collection and shooting, and annotation.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA preset ML datasets (pixta.jp)_
  - “オーダーメイドでのデータセット作成、新規収集・撮影、アノテーションも行っております” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=72991> · docs · retrieved 2026-10-01 · quote check: exact
- **c085** PIXTA offers made-to-order shooting under specific conditions based on a preset dataset package.  
  _offer · vendor_stated · as of 2026-06-24 (page_dated) · scope: Senior and caregiver behaviour video dataset (pixta.jp)_
  - “本パッケージをベースとした、特定の環境・条件下でのオーダーメイド撮影も可能です。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=74272> · pricing_page · retrieved 2026-10-01 · quote check: exact

### changes

- **c002** The PIXTA AI Terms of Use were last updated on 3 March 2025.  
  _event · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “We have updated our Terms of Use on March 3rd, 2025” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** PIXTA may amend the PIXTA AI terms and must notify users of the effective date and details in advance.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “Pixta shall notify the User of effective dates and details of amendments in advance” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** The PIXTA AI dataset pages carried a 2006-2026 copyright line on 1 October 2026, and new listings were visible.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA AI_
  - “2006 - 2026 © PIXTA Inc. All Rights Reserved.” — PIXTA Inc., <https://www.pixta.ai/datasets/latest> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A footer line on the vendor's own page; no other source can show it. Fetched pixta.ai/datasets/latest on 2026-10-01: footer '2006 - 2026 © PIXTA Inc.'. But the pixta.ai home page footer the same day read '2006 - 2025 © PIXTA Inc.', so the 2026 line is not site-wide. The listing page shows no dates per listing, so 'new listings were visible' cannot be checked from it.
  - verifier (scope): **scope_wrong** — The quote shows only the footer line. 'New listings were visible' is not shown: the Latest Datasets page carries no dates per listing. The pixta.ai home page footer read '2006 - 2025 © PIXTA Inc.' on the same day, so the 2026 line is not site-wide. A copyright year is weak evidence of operation for the profile's status claim; the TSE filings (2026-09-08 disclosure) and Nikkei (2026-09-27, 2026-09-29) are stronger.
- **c093** On 24 June 2026 PIXTA launched two senior-care AI datasets, 1,000 images and 50 videos, each sold separately.  
  _event · vendor_stated · as of 2026-06-24 (page_dated) · scope: PIXTA ML image/video data service (pixta.jp)_
  - “各データセットは単独でご購入いただけます。” — PIXTA Inc., <https://pixta.co.jp/news/2090> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c095** PIXTA stopped selling AI-generated stock content on 22 May 2026, having closed new AI-generated submissions on 20 April 2026.  
  _event · vendor_stated · as of 2026-05-26 (page_dated) · scope: PIXTA stock marketplace_
  - “2026年5月22日をもって、「AI生成素材」の取扱いを終了いたしました” — PIXTA Inc., <https://pixta.co.jp/news/2075> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c098** PIXTA reported that Nikkei (online) covered its 20th-anniversary project on 27 September 2026.  
  _event · vendor_stated · as of 2026-09-27 (page_dated) · scope: PIXTA Inc._
  - “「日本経済新聞（電子版）」でPIXTAの20周年企画が紹介されました” — PIXTA Inc., <https://pixta.co.jp/news/2121> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Nikkei article '世話される存在→自立した個人へ　写真でみる過去20年の「シニア像」', dated 2026-09-27 05:00 (members-only; lead paragraphs readable). It reports PIXTA's analysis of 100m+ archive images since 2006, i.e. the 20th-anniversary project. Reached by the link on pixta.co.jp/news/2121; no search used. ITmedia Business Online (2026-09-24) covered the same project.
    - “ピクスタは画像や動画などのデジタル素材をサイト上で売買できる。” — Nikkei (日本経済新聞 電子版), <https://www.nikkei.com/article/DGXZQOUC246X70U6A920C2000000/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**
- **c099** PIXTA's corporate news page listed a dated item on 30 September 2026, showing the group still trading.  
  _status · vendor_stated · as of 2026-09-30 (page_dated) · scope: PIXTA Inc._
  - “「日本経済新聞」で子会社の株式会社YASUMI WORKS代表取締役社長・中濱のインタビューが掲載されました” — PIXTA Inc., <https://pixta.co.jp/news> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The 2026-09-30 corporate news item (pixta.co.jp/news/2124) announces the print-edition Nikkei interview with the CEO of subsidiary YASUMI WORKS; the online version (2026-09-29 17:00) is independent evidence that the group's subsidiary is trading. PIXTA's own TSE filings also show operation: a timely disclosure dated 2026-09-08 (eir-parts.net tdnet/2882746) records the sale of its Audiostock shares for 273m yen on 2026-09-16, and the half-year report was filed 2026-08-13. Note the group now calls PIXTA's stock business structurally declining (see missed claims).
    - “「YASUMI WORKS」（名古屋市）は、東京や大阪、名古屋で11店舗を運営している。” — Nikkei (日本経済新聞 電子版), <https://www.nikkei.com/article/DGXZQOCC145RH0U6A910C2000000/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quoted title sits beside the date 2026/09/30 on the list page (the date is a separate element and cannot be in the quote). The item concerns subsidiary YASUMI WORKS, not the PIXTA marketplace.
- **c115** PIXTA may change contributor payment conditions, for example when introducing new services.  
  _terms · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “クリエイター会員への販売報酬の支払いの条件を変更することができ” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c118** PIXTA's stock Terms of Use, licence and contributor agreement were last revised on 22 April 2025.  
  _event · legal_text · as of 2025-04-22 (page_dated) · scope: PIXTA stock marketplace (pixta.jp) terms, licence and contributor agreement_
  - “2025年4月22日　改定” — PIXTA Inc., <https://pixta.jp/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** PIXTA's 29 August 2023 terms revision added AI-training use, including generative AI models, to the stock licence's prohibited uses.  
  _event · vendor_stated · as of 2023-08-21 (page_dated) · scope: PIXTA terms revision notice 2023_
  - “コンテンツを使用するにあたっての禁止行為に生成AIモデルなどAI学習目的での” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=69807> · docs · retrieved 2026-10-01 · quote check: exact
- **c124** In April 2024 PIXTA told contributors it would start selling their content as training material for generative AI.  
  _event · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “生成AIの学習用素材として販売することといたしました” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
- **c125** PIXTA let contributors opt out of generative-AI training use via a form; without it, content could be supplied without prior explanation.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “事前の説明等なく生成AIの学習用素材として提供されることがあり” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact
- **c126** Contributors who opt out of generative-AI use may still have content used as training data for non-generative ML such as image recognition.  
  _terms · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “画像認識等の生成AI以外のAI等の機械学習の学習データとして利用されることがあります” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact

### demand

- **c014** PIXTA analyses buyers' inquiry content and uses it for provision to Partners and for its own advertising and marketing.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “will be analyzed and used by Pixta for provision to the Partner and for Pixta’s advertising and marketing purposes” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c060** PIXTA positions its preset datasets as suited to proof-of-concept and first trials.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: PIXTA machine-learning image/video data service (pixta.jp)_
  - “PoC（概念実証）や初回トライアルとしての導入に最適です。” — PIXTA Inc., <https://pixta.jp/machinelearning-dataset> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c088** PIXTA argued in 2021 that buyers choose its datasets because commissioning a shoot costs too much and searching stock takes too long.  
  _offer · vendor_stated · as of 2022-07-13 (page_dated) · scope: Japanese people 1,000-image ML dataset (pixta.jp)_
  - “撮り下ろすには予算がかかりすぎる上に、膨大なストックフォトの中から条件に合う素材を探し出すには時間がかかります。” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=62476> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c091** PIXTA says its ML data service is used by major automotive and manufacturing companies among others; this is PIXTA's own claim.  
  _outcome · vendor_stated · as of 2026-05-18 (page_dated) · scope: PIXTA ML image/video data service (pixta.jp)_
  - “自動車・製造業界大手をはじめ、さまざまな企業から高い支持を得ています” — PIXTA Inc., <https://pixta.co.jp/news/2072> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — PIXTA's own release of 2024-08-28 lodged on TDnet, so it repeats the vendor's claim rather than proving it. TECH+ (news.mynavi.jp, 2024-09-24) relays a weaker version: the service is aimed 'at' automotive and manufacturing companies ('自動車業をはじめ、製造業の企業などに向けて展開する'). No customer names found. The TDnet PDF is encrypted; pdftext.py needed the 'cryptography' package, which the tools venv lacks (ran it with the system Python).
    - “自動車・製造業界大手はじめ様々な企業から高い支持を得ています” — PIXTA Inc. (TSE timely disclosure, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2496411/00.pdf> · filing · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (scope): **scope_ok** — Boilerplate about the ML data service in the worker-dataset release; '高い支持を得ています' means 'is highly regarded by' rather than a named customer list, and the statement correctly marks it as PIXTA's own claim.
- **c092** PIXTA says ML buyers told it overseas datasets cannot reproduce Japanese site conditions and in-house shooting has limits.  
  _offer · vendor_stated · as of 2026-05-18 (page_dated) · scope: PIXTA ML image/video data service (pixta.jp)_
  - “海外のデータセットでは日本の現場環境を再現できず、自社撮影にも限界がある” — PIXTA Inc., <https://pixta.co.jp/news/2072> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c132** PIXTA told contributors it expects ML dataset licences, including generative AI, to become one of its major revenue pillars.  
  _offer · vendor_stated · as of 2024-04-08 (page_dated) · scope: PIXTA contributor notice on generative-AI training licences_
  - “今後PIXTAでの大きな収益の柱の一つになってくることが見込まれます” — PIXTA Inc. (PIXTA Guide), <https://pixta.jp/guide/?p=70856> · docs · retrieved 2026-10-01 · quote check: exact

### regulation

- **c041** The PIXTA AI terms are governed by Japanese law with exclusive first-instance jurisdiction in the Tokyo District Court.  
  _terms · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “exclusive jurisdiction of the Tokyo District Court of Japan in the first instance” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact

### other

- **c016** PIXTA may subcontract PIXTA AI operations to its subsidiary PIXTA VIETNAM CO., LTD. or other third parties.  
  _architecture · legal_text · as of 2025-03-03 (page_dated) · scope: PIXTA AI_
  - “subcontract all or part of the Service’s operations to PIXTA VIETNAM CO., LTD., a subsidiary of Pixta” — PIXTA Inc., <https://www.pixta.ai/term> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c097** PIXTA's May 2026 release lists its subsidiaries as PIXTA ASIA, PIXTA VIETNAM, POTONOW and YASUMI WORKS; no IndiaPix entity appears.  
  _status · vendor_stated · as of 2026-05-26 (page_dated) · scope: PIXTA stock marketplace_
  - “子会社：PIXTA ASIA PTE. LTD.” — PIXTA Inc., <https://pixta.co.jp/news/2075> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** PIXTA Inc. told investors in August 2026 that its PIXTA stock business had entered a structural decline in both unit price and volume because of generative AI and tougher competition.  
  _event · vendor_stated · as of 2026-08-12 (publication) · scope: PIXTA stock marketplace (pixta.jp), PIXTA segment, Japan_
  - “PIXTA事業は生成AIの普及と競争激化により、単価・数量ともに構造的な減収局面に入ったと認識” — PIXTA Inc. (Q2 FY2026 results presentation, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/ir_material_for_fiscal_ym/210501/00.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v002** In the same August 2026 results, PIXTA Inc. said it would shift resources, including staff, boldly from the PIXTA business to new businesses such as AI anime and inbound tourism, while cutting costs in the stock business.  
  _event · vendor_stated · as of 2026-08-12 (publication) · scope: PIXTA Inc. group_
  - “成長市場での新規事業へリソースを大胆にシフトする” — PIXTA Inc. (Q2 FY2026 results presentation, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/ir_material_for_fiscal_ym/210501/00.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v003** PIXTA Inc.'s consolidated revenue for January-June 2026 was 1,202.6 million yen, down 8.0% year on year, with an operating loss of 20.5 million yen.  
  _number · filing · as of 2026-08-12 (publication) · scope: PIXTA Inc. group (consolidated)_ · **1202587 thousand JPY revenue** (consolidated net sales, Japanese GAAP, H1 FY2026 (Jan-Jun 2026), down 8.0% YoY; operating loss 20,500 thousand JPY vs operating profit 89,547 thousand a year earlier; half-year)
  - “売上高は、1,202,587千円（前年同期比8.0%減)、営業損失は、20,500千円” — PIXTA Inc. (TSE earnings release 決算短信, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2871569/00.pdf> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v004** Revenue of the PIXTA segment (stock marketplace and ML data) was 868.4 million yen for January-June 2026, down 15.1% year on year.  
  _number · filing · as of 2026-08-12 (publication) · scope: PIXTA segment (pixta.jp stock and ML data)_ · **868449 thousand JPY revenue** (PIXTA segment net sales to external customers, H1 FY2026, down 15.1% YoY; ML data revenue is not broken out; half-year)
  - “当中間連結会計期間における売上高は、868,449千円（前年同期比15.1%減)” — PIXTA Inc. (TSE earnings release 決算短信, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2871569/00.pdf> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v005** PIXTA Inc. had 107 employees on a consolidated basis and 66 at the parent company at the end of June 2026.  
  _number · vendor_stated · as of 2026-06-30 (page_dated) · scope: PIXTA Inc. group_ · **107 employees (consolidated)** (headcount at 30 June 2026; parent company 66; snapshot)
  - “従業員数 連結107名 単体66名（2026年6月末時点）” — PIXTA Inc. (Q2 FY2026 results presentation, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/ir_material_for_fiscal_ym/210501/00.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: pdf_unparsed
- **v006** PIXTA said orders for its machine-learning image and video data were about 3.3 times higher in January-June 2024 than in July-December 2023.  
  _number · vendor_stated · as of 2024-08-28 (publication) · scope: PIXTA ML image/video data service (pixta.jp), Japan_ · **3.3 times (order value, H1 2024 vs H2 2023)** (vendor-stated order intake value for ML image/video data; absolute amounts not disclosed; half-year comparison)
  - “機械学習用の画像・動画データの受注額が約3.3倍に増加したことをお知らせいたします” — PIXTA Inc. (release lodged on TSE TDnet, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2496411/00.pdf> · filing · retrieved 2026-10-01 · quote check: exact_nospace
- **v007** In July 2024 PIXTA disclosed a single large order for image and video materials worth about 360 million yen, to be booked in Q3 2024 and not in its forecast; the filing does not name the buyer or say whether the use was ML training.  
  _event · filing · as of 2024-07-22 (publication) · scope: PIXTA Inc. (image and video materials)_
  - “受注製品 画像・動画素材 受注金額 約 360 百万円” — PIXTA Inc. (TSE timely disclosure 大口受注に関するお知らせ, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2476607/00.pdf> · filing · retrieved 2026-10-01 · quote check: exact
- **v008** PIXTA joined the Dataset Providers Alliance, formed on 26 June 2024, as a founding member alongside Datarade, Rightsify, GCX, vAIsual, Ado and Calliope Networks.  
  _event · vendor_stated · as of 2024-07-01 (publication) · scope: PIXTA Inc. / PIXTA AI_
  - “Dataset Providers Alliance」（以下、DPA）の創設メンバーとして参画したことをお知らせいたします” — PIXTA Inc. (release lodged on TSE TDnet, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2469230/00.pdf> · filing · retrieved 2026-10-01 · quote check: exact_nospace
- **v009** In September 2026 PIXTA Inc. sold all 280,000 of its shares in Audiostock for 273 million yen, booking a special gain in Q3 2026.  
  _event · filing · as of 2026-09-08 (publication) · scope: PIXTA Inc. group_
  - “売却価額 ： 273 百万円（１株につき975 円）” — PIXTA Inc. (TSE timely disclosure, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2882746/00.pdf> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed
  - “株式会社オーディオストック 普通株式 （２）株式の数 ： 280,000株” — PIXTA Inc. (TSE timely disclosure, hosted by eir-parts.net), <https://ssl4.eir-parts.net/doc/3416/tdnet/2882746/00.pdf> · filing · retrieved 2026-10-01 · quote check: pdf_unparsed

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.pixta.ai/term>, <https://pixta.jp/machinelearning-dataset>, <https://pixta.jp/guide/?p=72991>, <https://pixta.jp/guide/?p=74272>
- `matrix.versioning` — not_published; tried <https://www.pixta.ai/term>, <https://www.pixta.ai/datasets/latest>, <https://pixta.jp/guide/?p=72991>
- `other.partner_fee_amounts` — gated; tried <https://www.pixta.ai/term>, <https://www.pixta.ai/contact/list-dataset>
- `other.listing_metadata_and_samples` — gated; tried <https://www.pixta.ai/datasets/pixta-ai-face-recognition-human-face-and-emotion-dataset-100-000-licensed-images-ace551e2-7809-4e54-baa1-841789106204>
- `other.pixta_ai_catalogue_page` — js_empty; tried <https://www.pixta.ai/datasets/list>, <https://www.pixta.ai/api/v1/datasets?q=*&page=1&limit=100>
- `other.pixta_ml_dataset_licence_text` — not_published; tried <https://pixta.jp/machinelearning-dataset>, <https://pixta.jp/terms>, <https://pixta.jp/guide/?p=74272>
- `other.ml_brochure_price_examples` — gated; tried <https://req.qubo.jp/pixta/form/mldownload>
- `other.contributor_pay_non_generative_ml` — not_published; tried <https://pixta.jp/terms>, <https://pixta.jp/guide/?p=3336>, <https://pixta.jp/guide/?p=69807>, <https://pixta.jp/guide/?p=70856>
- `other.ml_revenue_and_volume` — js_empty; tried <https://pixta.co.jp/ir/news>, <https://pixta.co.jp/news>
- `other.indiapix_relationship` — not_published; tried <https://www.pixta.ai/datasets/indiapix-anatomy-40958-computer-vision-human-age-clothing-face-recognition-emotion-pose-movement-makeup-occluded-face-healthcare-887c9386-2baa-4859-97a8-6d17cee90aba>, <https://pixta.co.jp/en/company>, <https://pixta.co.jp/news/2075>
- `other.pixta_ai_launch_date` — not_found; tried <https://www.pixta.ai/>, <https://pixta.co.jp/news>, <https://www.pixta.ai/sitemap.xml>
- `other.independent_press` — not_found; tried <https://pixta.co.jp/news/2121>

## Conflicts

- c123, c124: The 2023 FAQ said PIXTA's ML dataset licences in principle barred image-generation training. The April 2024 contributor notice (updated March 2026) says PIXTA now licenses contributor content for generative-AI training through individual contracts, so the 2024 position is current for generative-AI licences. (live_primary_wins_terms)

## Leads, not cited

- <https://pixta.co.jp/ir/news> — IR list renders client-side; results briefings (決算説明資料) may break out ML dataset revenue. Needs a direct PDF link or EDINET.
- <https://disclosure2.edinet-fsa.go.jp/> — EDINET annual securities report for PIXTA (code 3416) may describe the ML data business and risks; not reached in this run.
- <https://pixta.co.jp/news/2120> — ITmedia coverage of the 20th anniversary (2026-09-24); may be independent, but concerns stock imagery rather than datasets.
- <https://pixta.jp/guide/?p=70673> — 2024 campaign: 10% off the next ML dataset purchase. A pricing mechanic not yet recorded.
- <https://pixta.jp/guide/?p=72560> — Another paid ML brief (licence plates, 2025) with reward terms.
- <https://pixta.co.jp/images/pdf/terms_jp_20230829.pdf> — The 2023 terms PDF, to compare ML clauses before and after the revision.
- <https://req.qubo.jp/pixta/form/mldownload> — Gated ML service brochure with price examples and case studies; form-gated, not opened.
- <https://www.pixta.ai/providers/filemarket-ai-data-labs-d97d3bb3-827a-4ad8-bcb1-94ce22adb1a2> — Third-party provider profile on PIXTA AI; the providers' own sites could show whether they sell the same data elsewhere.
