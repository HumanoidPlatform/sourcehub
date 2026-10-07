# Wirestock

stock_media · deep · status: **active** · also known as Wirestock Inc., Wirestock Dataset Deals Program

> Rendered from `ledger/wirestock.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Dataset Library (also 'Explore datasets'; library content sits in 'Commission Based' / 'Paid per sale' projects)” and its bespoke side “Custom data solutions / custom datasets ('Get Custom Dataset Quote'; creators work on 'Paid Projects')”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c042, c029, c031, c070, c071 | Creators grant Wirestock a sublicensable licence and Wirestock licenses sets of content to Dataset Partners at a price and scope it chooses; creators do not license buyers directly. The buyer-side licence itself is not published. |
| economics_model | mixed | c032, c033, c088, c090, c092 | Catalogue and pooled deals: revenue share (creator pool gets 50% of the Dataset Partner payment; Commission Based creators get 50%). Commissioned project work: Wirestock pays a fixed rate per approved asset and sells at its own price (principal margin). |
| who_pays_fee | seller | c033, c088 | Wirestock's share is retained out of what the buyer pays (50% of the Dataset Partner payment); no buyer-side fee is published. |
| supply_models | contributor_uploads, own_collection | c025, c123, c075, c081, c090, c036 | Contributor uploads auto-enrolled in Dataset Deals; Wirestock-commissioned content made to its own briefs at fixed pay, and bundles that include content provided by Wirestock (c036). Whether data made for one paying lab is resold to others is not published; 'other content providers' in c036 is too ambiguous to count as third-party supply. |
| custody_model | unknown |  | No page says how datasets reach the buyer (download, drive share, bucket delivery). Listings only name delivery formats (c111) and the Series A post mentions pipeline integrations (c128). |
| transaction_mode | contact_sales | c100, c101, c107, c116, c120 | Every buyer action is a form: Access full library, Request custom dataset, Request Dataset, Book a demo, Get Custom Dataset Quote. |
| public_prices | none | c107, c100, c031 | No dataset price on the library or on the three listings opened; Terms say Wirestock sets deal prices in its sole discretion. |
| licence_model | negotiated | c031, c070 | Wirestock may license to Dataset Partners 'for the price and in the form, extent, and scope' it chooses; no standard buyer licence for datasets is published. Listings assert rights for research, commercial and generative training (c108). |
| exclusivity_offered | unknown |  | No buyer-side statement. Wirestock holds only a non-exclusive licence from creators (c042) and creators may license elsewhere (c078), which suggests catalogue content cannot be sold exclusively, but exclusive custom work is not addressed. |
| public_listing | public_indexable | c103, c104, c109, c110 | Library and listing pages load without login. |
| buyer_vetting | case_by_case | c030 | Terms: Wirestock selects Dataset Partners in its sole discretion; no published buyer-vetting criteria. |
| sample_mechanics | free_sample_download | c106 | Listings link 'View sample files' to a public Google Drive folder and show in-page sample previews. |
| versioning | unknown |  | No page describes dataset versions, updates or what a past buyer receives. |
| human_subject_consent_docs | asserted_only | c112, c108, c122, c049, c053 | Listings and AI Labs page assert consent and rights clearance; creators must supply model releases, which Wirestock may furnish to customers 'as necessary' (e.g. legal action), not as a routine delivery item. |
| contributor_pay_model | mixed | c032, c088, c090, c092, c086 | Revenue share on licensing (Dataset Deals 50% pool share; Commission Based 50%) plus one-off fixed payments per approved asset on commissioned projects. |
| catalogue_plus_custom | both | c022, c102, c019, c020, c127 |  |
| erasure_after_sale | takedown_only | c060, c061, c063, c131 | Removal from Wirestock does not affect licences already issued, which survive in perpetuity; licensees need not remove content from models or storage. |
| quality_evidence | operator_verified | c113, c114, c124, c084 | Quality statements are Wirestock's own, based on its review of every submission; no third-party audit or per-listing quality metrics are shown. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Frontier AI labs: Wirestock says it serves six of the largest foundation model makers at a USD 40M run-rate (company-reported); early deals were off-the-shelf library sales, later mostly custom requests. Units and volumes per deal are not published. | c007, c008, c019, c020, c119, c014 |
| Q2 | partial | Wirestock began by distributing creator content onto other stock marketplaces (Shutterstock, Adobe Stock and others) and stopped sending new content there from 20 January 2026 to sell to AI labs itself; it gives no stated rationale beyond AI demand. | c130, c041, c006, c018, c017 |
| Q3 | sourced | Inventory is creator uploads plus content made to Wirestock briefs; creators keep copyright but grant a worldwide, non-exclusive, sublicensable licence covering AI training, waive moral rights, and new content is auto-enrolled in Dataset Deals. | c025, c042, c043, c045, c046, c075, c078, c081 |
| Q4 | partial | The January 2026 Terms made Dataset Deals enrolment automatic with no opt-out for new content, honouring only earlier opt-outs; stock distribution and the Marketplace were then retired and old content moved into Commission Based projects. How rights in lab-commissioned work are carved out is not published. | c025, c027, c028, c041, c094, c093, c021, c076 |
| Q5 | partial | Wirestock is licensor of record, licensing at its own price and scope; creators warrant rights and publicity/privacy clearance and indemnify Wirestock, Dataset Partners and end users. Wirestock's warranties and indemnity to buyers are not published. | c042, c031, c055, c056, c057, c058 |
| Q6 | partial | Not published. Listings name delivery formats (e.g. RAW .BRAW/.R3D) and samples sit in Google Drive; the Series A post speaks of pipelines integrated with lab workflows. | c111, c106, c128 |
| Q7 | partial | Capturer: content is auto-enrolled in dataset licensing with no opt-out under current Terms. Person depicted: creators must supply model releases, which may be furnished to customers as necessary. Property: property releases where Wirestock decides they are needed. | c028, c049, c050, c051, c053, c112 |
| Q8 | partial | Buyer licence text is not published; listings claim rights for research, commercial and generative training. Licences survive content removal in perpetuity and licensees need not remove content from models. Nothing on audit, leakage or fingerprinting. | c108, c115, c060, c061, c063 |
| Q9 | sourced | Contact-sales only (request forms and demos, no prices). Wirestock owns the licence relationship and shares revenue: 50% of Dataset Partner payments to the contributor pool, 50% commission per licence, or fixed pay per asset for commissioned work. | c100, c107, c116, c032, c088, c092 |
| Q10 | partial | A listing is a themed dataset (e.g. 10,000 try-on pairs, 5,000 RAW clips) with format and use cases; deals license 'sets' pooled from many creators. Revisions, orders, entitlements and what past buyers get on change are not published. | c029, c104, c110, c103, c125 |
| Q11 | sourced | Buyers see listing descriptions, in-page sample previews and downloadable sample files on Google Drive, plus Wirestock's own claims of review, QA and consent; no third-party quality evidence. | c106, c113, c114, c112, c124 |
| Q12 | sourced | One creator base feeds both a 'Dataset Library' and 'Custom data solutions'; creators earn commission on library licensing and fixed pay on commissioned briefs, and custom requests now dominate per the CEO. | c022, c102, c133, c020, c086, c081 |

## Narrative

### positioning

Wirestock began as a tool distributing creators' stock content to Shutterstock and similar marketplaces [c018][c130], pivoted to AI data supply in 2023 [c017], and now calls itself the data infrastructure layer where creative data is born [c023]. It pitches multimodal data for pretraining, SFT, RL and RLHF [c119] from 700K+ creators [c011].

### supply

All supply comes from one creator base: uploaded content, auto-enrolled in the Dataset Deals Program with no opt-out for content submitted under the January 2026 Terms [c025][c028], and content made to Wirestock's paid project briefs [c081][c090]. Creators grant a worldwide, non-exclusive, sublicensable licence covering AI training [c042][c043] and waive moral rights [c045]. Bundled deals may mix in content provided by Wirestock itself [c036]. Wirestock says it sources 1M+ new items a month [c015].

### object_model

Buyers see themed datasets (Virtual Try-On, Dance Videos, High-Bit Videos) [c103]. Behind them, Wirestock licenses 'sets' of content pooled from many creators [c029], organised into collections and Commission Based project listings by content type [c125][c089]. Wirestock owns all metadata, including annotations added by contractors [c048]. No versions, orders or entitlements are described.

### listing

A listing shows a description, stated size (10,000 image pairs; 5,000 RAW clips) [c104][c110], file formats [c105][c111], key features, use cases, a rights statement [c108] and sample previews. No price, licence text, creator names or consent documents appear [c107].

### discovery

The library is a single public page of category cards, with no search or filters, and ends with an invitation to request a custom dataset [c100][c101][c103].

### trust

Trust rests on Wirestock's assertions: datasets are 'consent-based and fully licensed' [c112], listings are 'rights-cleared' [c108]. Behind this, creators must supply model and property releases [c049][c051], warrant non-infringement including publicity and privacy [c055], and indemnify Wirestock, Dataset Partners and end users [c057]. Releases may be furnished to customers 'as necessary' [c053].

### transaction

No checkout. Every buyer action (Access full library, Request custom dataset, Request Dataset, Book a demo, Get Custom Dataset Quote) leads to a form [c100][c101][c107][c116][c120]. Wirestock chooses its Dataset Partners [c030].

### pricing

No prices are published for datasets [c107]. The Terms let Wirestock set the price, form and scope of any deal in its sole discretion [c031][c070]. The only published figures are the creator splits [c032][c088].

### licence

The buyer licence is not published. On the supply side creators keep copyright [c046] but grant Wirestock a sublicensable, multi-tier licence for any purpose including training generative and non-generative AI [c042][c043][c044], and have no interest in models built from their content [c047]. Listings claim rights for research, commercial and generative training [c108].

### custody

How data reaches a buyer is not published. Listings give formats only [c111], and samples are shared as Google Drive folders [c106]. The Series A post promises pipelines that extend lab research workflows [c128].

### vetting

Wirestock reviews every submission against its guidelines [c124][c084], runs an unpaid test task for creator pools [c091] with review in about two days [c087], requires AI-generated content to be flagged [c073], and decides alone whether a release is valid [c054]. It claims QA, curation and annotation of datasets [c113][c114].

### contributor_pay

Three pay routes. Dataset Deals pay the creator pool 50% of the partner's payment, split by item count (Fractional Participation), or a Wirestock-set amount for bundled deals (Dynamic Calculation) [c032][c033][c034][c035]. Commission Based content earns 50% per licence [c088]. Commissioned briefs pay a fixed rate per approved asset [c090][c092]. Legacy stock downloads paid 85% [c039]. Payouts go monthly via PayPal or Payoneer, with a USD 30 minimum [c065][c066].

### post_sale

Removal does not reach buyers: licences issued survive in perpetuity [c060][c131], licensees need not remove content from storage or models and may keep retraining [c061][c062], and Wirestock says it cannot retrieve content from end users [c063]. Creators can ask support to pull content from Commission Based projects [c085].

### catalogue_custom

One creator network feeds both a 'Dataset Library' and 'Custom data solutions' [c133][c022]. The CEO says deals began as off-the-shelf library sales and turned into mostly custom requests [c019][c020]. Custom work is briefed to matched creator pools who are paid per approved asset [c081][c098][c090], while library content earns commission [c089][c088]. The Series A is to fund more complex custom datasets [c127].

### changes

The Terms effective 20 January 2026 made Dataset Deals enrolment automatic with no opt-out for new content [c005][c025][c028], honouring only earlier opt-outs [c027], and ended distribution of new content to stock marketplaces [c041]. In April 2026 the Portfolio, Marketplace, challenges and Premium plans were retired and approved content moved into Paid per sale projects [c094][c095][c099]. A USD 23M Series A followed in May 2026 [c002][c003].

### demand

Company-reported to TechCrunch: a USD 40M annual run-rate and six of the largest foundation model makers as customers, unnamed [c007][c008]. Wirestock claims 10M+ assets licensed for AI [c014]. None of these figures is independently verified.

## Buyer journey

1. Lands on wirestock.io or the AI Labs page, which pitches ethically sourced multimodal data from 700K+ creators and offers 'Book a demo', 'See all datasets' and 'Get Custom Dataset Quote'. [c116, c112, c119]
2. Opens the Dataset Library: a public page of category cards (video edits, high-bit video, virtual try-on, dance, sports, design assets) with no prices, and buttons 'Access full library' and 'Request custom dataset'. [c100, c101, c103]
3. Opens a listing: sees description, stated size, file formats, use cases and a 'rights-cleared' statement, with in-page sample previews. [c104, c105, c108, c110]
4. Clicks 'View sample files' to download samples from a shared Google Drive folder. [c106]
5. Clicks 'Request Dataset' (or asks for a custom dataset): a contact / book-a-demo form; no checkout exists. [c107, c120]
6. Negotiates with Wirestock, which selects its Dataset Partners and sets price, form and scope of the licence per deal; for custom work, specifications are configured and iterated with Wirestock. [c030, c031, c117]
7. Receives the data and a licence from Wirestock as licensor; the delivery method and the buyer licence text are not published. Releases for depicted people may be provided if needed, e.g. for legal action. [c042, c053]

## Claims

### positioning

- **c017** TechCrunch reported that Wirestock pivoted from stock distribution to being a data provider in 2023.  
  _event · press_relayed · as of 2026-05-14 (publication)_
  - “The company pivoted to being a data provider in 2023 and now supplies datasets of images, videos, design assets, and” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c018** TechCrunch reported that Wirestock previously helped photographers distribute and sell work on stock services such as Shutterstock.  
  _offer · press_relayed · as of 2026-05-14 (publication)_
  - “previously helped photographers distribute and sell their work on stock photography services like Shutterstock” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c023** Wirestock describes itself as the data infrastructure layer where creative data is born.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Wirestock serves as the data infrastructure layer where creative data is born.” — Wirestock, <https://wirestock.io/about-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c119** Wirestock's homepage says its datasets are built for pretraining, SFT, RL and RLHF workflows.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Datasets built for pretraining, SFT, RL, and RLHF workflows” — Wirestock, <https://wirestock.io/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c011** TechCrunch reported that Wirestock has signed up more than 700,000 artists and designers who complete tasks for data collection.  
  _number · press_relayed · as of 2026-05-14 (publication)_ · **700000 artists and designers signed up** (registered creators, company-reported; as of May 2026)
  - “platform has signed up more than 700,000 artists and designers who complete different tasks for data collection” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. The vendor's homepage and AI Labs page show the same '700K+'. TechCrunch 2022-07-01 (Haje Jan Kamps) gave 'the 100,000 or so contributors' at the time of the Getty partnership, so the figure grew about sevenfold. No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “platform has signed up more than 700,000 artists and designers who complete different tasks for data collection” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c015** Wirestock's AI Labs page says it sources more than 1 million new content items a month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1000000 new content items per month** (vendor-stated; page also states 50M+ total content and 700K+ creators; per month)
  - “1M+ New Content Sourced Monthly” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — AI Labs page shows '1M+ New Content Sourced Monthly' and the homepage '1M+' Sourced Monthly. No third-party source gives a monthly sourcing volume; no search available.
  - verifier (scope): **scope_ok** — Quote matches the AI Labs page; the homepage repeats '1M+' Sourced Monthly.
- **c025** Wirestock's Terms automatically include in the Dataset Deals Program all content a creator submits after the Terms' effective date.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock will automatically include in the Dataset Deals Program (described below) all Content you submit to Wirestock after” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Automatic-inclusion clause in Wirestock's own Terms, live 2026-10-01. No independent reporting of the opt-in change was reachable; no search available.
  - verifier (scope): **quote_incomplete** — The quote stops at 'after', so it does not show the scoping that matters. The Terms continue: 'the effective date of these Terms'.
- **c026** Wirestock's Terms tell creators who do not want content in the Dataset Deals Program not to submit it.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “If you do not want your Content included in the Dataset Deals Program, please do not submit Content to Wirestock.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** Wirestock's Terms state that there is no option to opt out of the Dataset Deals Program.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “You understand and agree that there is no option to opt out of the Dataset Deals Program.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** Dynamic Calculation applies when content is bundled or commingled with content from other providers or from Wirestock itself.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “commingled with other content, provided by other content providers or by Wirestock” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c071** Wirestock may license content directly to Ultimate Consumers such as individuals, companies or brands, as well as to content marketplaces and Dataset Partners.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “offer to license your Content to Ultimate Consumers” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** Images uploaded to Wirestock's AI Services are enrolled in the Dataset Deals Program.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “agree and enroll those images for the Wirestock Dataset Deals Program” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c075** Wirestock's FAQ says creator content earns through paid AI projects, in which Wirestock licenses selected work to AI labs against a project brief.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “paid AI projects (where Wirestock licenses selected work to leading AI labs based on a project brief)” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** Wirestock's FAQ says creators can manage Dataset Deals participation, including opting out when available, in account settings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You can manage participation (including opting out, when available) in your account settings.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** Wirestock's FAQ says it does not require exclusivity from creators, who may license content elsewhere.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Wirestock doesn't require exclusivity. You can license your content elsewhere, too.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c097** Wirestock said it would actively seek buyers for content in Paid per sale projects on creators' behalf.  
  _offer · vendor_stated · as of 2026-04-09 (page_dated)_
  - “We will actively seek buyers on your behalf.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c130** Wirestock's Terms name Shutterstock, Adobe Stock, Alamy, Dreamstime, Depositphotos and Pond5 as examples of content marketplaces it licensed creator content to.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “such as (but not limited to) Shutterstock, Adobe Stock, Alamy, Dreamstime, Depositphotos, and Pond5” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact

### object_model

- **c029** Under the Dataset Deals Program Wirestock licenses sets of a creator's content, usually pooled with other users' content, to third-party Dataset Partners.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “usually along with images provided by other Wirestock users, to third parties (the” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c048** Wirestock owns all metadata created by Wirestock or anyone else, including its contractors and sublicensees.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock owns all right, title, and interest in and to any Metadata created or developed” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c125** Wirestock says approved content is organised into collections for buyers and creators are paid when it is licensed as part of a collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get paid when your content is licensed as part of a collection.” — Wirestock, <https://wirestock.io/creators/sell-your-content> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c103** Wirestock's dataset library lists categories including Before and After Video Edits, High-Bit Videos, Virtual Try-On, Dance Videos and Sports Videos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Before and After Video Edits” — Wirestock, <https://wirestock.io/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c104** The Virtual Try-On listing describes 10,000 person-plus-garment image pairs with JSON metadata.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **10000 image pairs** (stated dataset size on listing; as listed)
  - “10,000 person-plus-garment image pairs” — Wirestock, <https://wirestock.io/datasets/virtual-try-on> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Listing text on wirestock.io/datasets/virtual-try-on, live 2026-10-01. Wirestock's Hugging Face org shows 'None public yet', so no second host carries the listing.
  - verifier (scope): **quote_incomplete** — The quote shows the 10,000 pairs but not the JSON metadata. The page also says 'JSON metadata included per pair'.
- **c105** The Virtual Try-On listing states its file format as JPEG images with JSON metadata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “JPEG for images and JSON for metadata” — Wirestock, <https://wirestock.io/datasets/virtual-try-on> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c109** The Dance Videos listing describes extended clips of dancers capturing full-body movement across dance styles.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Extended video clips of dancers in motion, capturing full-body movement, rhythm, and gesture” — Wirestock, <https://wirestock.io/datasets/dance-videos> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c110** The High-Bit Videos listing describes 5,000 clips shot on professional cinema cameras.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5000 video clips** (stated dataset size on listing; as listed)
  - “5,000 high-bit video clips captured on professional cinema cameras” — Wirestock, <https://wirestock.io/datasets/high-bit-video> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Listing text on wirestock.io/datasets/high-bit-video, live 2026-10-01 ('5,000 clips from professional cinema cameras at 12- and 16-bit depth').
  - verifier (scope): **scope_ok** — Quote appears verbatim on the page (the full sentence goes on to name the Blackmagic and RED cameras); a second line on the page reads '5,000 clips from professional cinema cameras at 12- and 16-bit depth'.

### trust

- **c049** Creators must give Wirestock a valid model release for any content that, in Wirestock's judgment, contains an identifiable face or human figure.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “valid and accurate model release for any and all Content you contribute to Wirestock that, in Wirestock's judgment, contains” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** The model-release duty also covers identifiable voice, appearance or likeness.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “identifiable human figure or other identifiable attribute including, without limitation, voice, appearance, or likeness” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c051** Creators must provide property releases for content that Wirestock decides requires them.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “You also agree to provide valid and accurate property releases to Wirestock for all Content that requires such releases” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** Creators are solely responsible for retaining original releases and keeping release records.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “you are solely responsible for retaining all original releases and maintaining complete and accurate release records” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** Wirestock, Dataset Partners or content marketplaces may furnish copies of releases to customers as necessary, for example to respond to legal action.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “may furnish copies of releases to customers, as necessary, in order to respond to any potential or actual legal action” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Release-furnishing clause in Wirestock's own Terms, live 2026-10-01.
  - verifier (scope): **quote_incomplete** — The quote omits the parties named in the statement. The Terms read 'Wirestock, Dataset Partners, or the content marketplaces, may furnish copies of releases to customers, as necessary'.
- **c055** Creators warrant that no party's use of their content will infringe third-party rights, including rights of publicity or privacy.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “the Content does not, and any party's use of the Content will not, infringe any rights of any third parties” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c056** Creators warrant that the content is solely owned or controlled by them and that no third party has rights in it.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “the Content and all parts thereof and rights therein are solely owned or controlled by you, unencumbered” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c057** Creators indemnify Wirestock, its Dataset Partners, content marketplaces and Ultimate Consumers against claims arising from their content.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Dataset Partners, content marketplaces, Ultimate Consumers, and service providers” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c058** Wirestock's aggregate liability to creators and third parties under the Terms is capped at 500 US dollars.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **500 USD** (cap on Wirestock's aggregate liability to the creator and all third parties under the contributor Terms; aggregate)
  - “not to exceed five hundred dollars ($500.00 USD)” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Liability cap clause in Wirestock's own Terms, live on 2026-10-01.
  - verifier (scope): **scope_ok**
- **c106** Wirestock dataset listings offer a 'View sample files' link to a shared Google Drive folder before purchase.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “View sample files” — Wirestock, <https://wirestock.io/datasets/virtual-try-on> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c112** Wirestock's AI Labs page says all its datasets are consent-based and fully licensed.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All datasets are consent-based and fully licensed.” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c122** Wirestock's creators page says every dataset is consent-based with fair creator payouts.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every dataset is consent-based, with fair creator payouts” — Wirestock, <https://wirestock.io/creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c072** Under the January 2026 Terms, buyers license Wirestock Marketplace content by paying a subscription fee and accepting separate Marketplace terms.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “provided you pay the associated subscription fee and agree to the Wirestock Marketplace Terms of Service” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c100** Wirestock's dataset library shows samples and asks buyers to contact it for access to the full library.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Explore multimodal dataset samples below, and contact us to access our full library of AI training data” — Wirestock, <https://wirestock.io/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c101** The dataset library offers two buyer actions, 'Access full library' and 'Request custom dataset', both leading to a contact form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request custom dataset” — Wirestock, <https://wirestock.io/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c107** The only purchase action on a Wirestock dataset listing is a 'Request Dataset' button; no price is shown.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request Dataset” — Wirestock, <https://wirestock.io/datasets/virtual-try-on> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Checked the Virtual Try-On and High-Bit Videos listings on 2026-10-01: the buttons are 'Request Dataset', 'View sample files' and "Let's talk"; no price shown. 'Request Dataset' is the only purchase action, with 'Let's talk' as a second contact route.
  - verifier (scope): **scope_ok** — Checked Virtual Try-On and High-Bit Videos: 'Request Dataset', 'View sample files' and "Let's talk", no price. The absence of a price cannot be quoted (rule 13). 'Let's talk' is a second contact route, not a checkout.
- **c116** Wirestock's AI Labs page offers buyers 'Book a demo' and 'Get Custom Dataset Quote' as calls to action.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get Custom Dataset Quote” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c120** Wirestock's dataset contact page is a 'Book a demo with our team' form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Book a demo with our team” — Wirestock, <https://wirestock.io/datasets/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00

### pricing

- **c031** Wirestock may license creators' content and metadata to Dataset Partners at a price and scope it chooses in its sole discretion.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Dataset Partners for the price and in the form, extent, and scope that Wirestock, in its sole discretion, chooses” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Sole-discretion clause in Wirestock's own Terms, live 2026-10-01.
  - verifier (scope): **quote_incomplete** — The statement says 'content and metadata' but the quote does not show metadata. The Terms read 'your Content, as well as all associated Metadata, to Wirestock's Dataset Partners'.
- **c070** Wirestock can grant licences to a creator's Portfolio Content at the price and scope it chooses, in its sole discretion.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “You hereby grant Wirestock the ability to grant a license to your Portfolio Content for the price and in the form, extent” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact

### licence

- **c042** Creators grant Wirestock a worldwide, non-exclusive, transferable, sublicensable licence to their content.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “grant Wirestock a worldwide, non-exclusive, transferable, sublicensable (with the right to sublicense through multiple tiers” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Licence grant in Wirestock's own Terms (effective January 20, 2026), live 2026-10-01.
  - verifier (scope): **scope_ok**
- **c043** The creator licence lets Wirestock use content for developing, training, testing and improving products and Developed Technology.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “purpose of developing, building, training, testing, validating, and improving any products, services, tools, technology” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c044** The Terms define Developed Technology to include generative and non-generative AI.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “technologies, including generative and non-generative AI” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c045** Creators waive moral rights so that Wirestock's customers and business partners may use the content under Wirestock's licences.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “you expressly and irrevocably waive any and all” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c046** Creators keep copyright; the Terms state nothing in them transfers copyright to Wirestock.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “nothing in these Terms will be construed as a transfer of copyright to Wirestock” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** Creators have no right, title or interest in any Developed Technology built using their content.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “You understand that you have no right, title, or interest in any such products, services, tools, technology, software” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** The Terms are governed by California law.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “governed by and construed in accordance with the internal laws of the California” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c083** Wirestock's FAQ says creators keep ownership and licensing through Wirestock does not transfer copyright.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You keep ownership of your work. Licensing your content through Wirestock does not transfer your copyright.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c108** The Dance Videos listing says the data is rights-cleared for research, commercial and generative model training.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Rights-cleared for research, commercial, and generative model training” — Wirestock, <https://wirestock.io/datasets/dance-videos> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c115** Wirestock's AI Labs page says its content is fully licensed for commercial use, eliminating legal risk for buyers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our content is fully licensed and compliant for commercial use, eliminating legal risk for your business.” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c132** For Wirestock Marketplace Paid Content, Wirestock does not require attribution by the licensee.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “for Paid Content, Wirestock will not require attribution by the licensee” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c111** The High-Bit Videos dataset is delivered in RAW formats (.BRAW, .R3D).  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Delivered in RAW formats (.BRAW, .R3D) for maximum grading flexibility.” — Wirestock, <https://wirestock.io/datasets/high-bit-video> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c128** Wirestock describes deepening integrations so its data pipelines extend AI lab partners' research workflows.  
  _architecture · vendor_stated · as of 2026-05-15 (page_dated)_
  - “data pipelines a seamless extension of its AI lab partners' research workflows” — Wirestock, <https://wirestock.io/blog/wirestock-raises-23m-series-a> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00

### vetting

- **c030** Wirestock selects Dataset Partners in its sole discretion.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock will select the Dataset Partners in its sole discretion.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c054** Wirestock alone decides whether a release is valid and complete.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock has complete discretion to determine whether a release is valid and complete” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c073** Creators must disclose AI-Generated Content at upload, and Wirestock may remove it at any time.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “You must indicate at the time of upload which Content is AI-Generated Content” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c084** Wirestock's FAQ says quality and acceptance criteria are set out in its Submission Guidelines, with extra requirements in each brief.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “quality and acceptance criteria are outlined in the Submission Guidelines” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c087** Wirestock says its review of a creator's test submission usually takes up to two days.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2 days** (typical review time for a creator test submission, vendor-stated; per submission)
  - “Usually up to 2 days.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/7PsHB3lkunyJY3L58Azk6K7TYyG5fg-sTyE9eFrrOIY.2dgPynaX.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c091** Wirestock's test task for joining a creator pool is unpaid.  
  _terms · vendor_stated · as of 2026-07-13 (page_dated)_
  - “Submit a sample based on the brief. This is unpaid and lets us see how you work” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c113** Wirestock's AI Labs page says its content is expertly curated, reviewed and annotated.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our content is expertly curated, reviewed, and annotated.” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c114** Wirestock's AI Labs page promises QA and review for quality data at high volume.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Thoughtful QA and review that ensures quality data at high volume” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c124** Wirestock reviews submissions against its content guidelines before approval.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We review your submission to make sure it meets the content guidelines” — Wirestock, <https://wirestock.io/creators/sell-your-content> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c009** TechCrunch reported that Wirestock had paid out 15 million US dollars to its contributors.  
  _number · press_relayed · as of 2026-05-14 (publication)_ · **15000000 USD** (cumulative payouts to contributors, company-reported; cumulative to May 2026)
  - “has so far paid out $15 million to its contributors.” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. The vendor's own pages give three different cumulative payout figures on 2026-10-01: About page $6M+, sell-your-content page $10M+, creators page $20M+. No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “has so far paid out $15 million to its contributors” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c012** Wirestock's About page says it has paid more than 6 million US dollars to creators.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **6000000 USD** (cumulative paid to creators, vendor-stated; label '$6M+ Paid to Creators'; cumulative)
  - “$6M+ Paid to Creators” — Wirestock, <https://wirestock.io/about-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The About page (wirestock.io/about-us) still shows '$6M+' Paid to Creators on 2026-10-01. It is stale against TechCrunch 2026-05-14, which relays the company's figure of $15 million paid out, and against the vendor's own creators page ($20M+) and sell-your-content page ($10M+). No independent source for $6M.
  - verifier (scope): **scope_ok** — Quote matches the About page on 2026-10-01; stated as vendor-said, and the payout conflict is recorded.
- **c013** Wirestock's creators page says it has paid more than 20 million US dollars to creators.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **20000000 USD** (cumulative paid to creators, vendor-stated; label '$20M+ Paid to Creators'; cumulative)
  - “$20M+ Paid to Creators” — Wirestock, <https://wirestock.io/creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Creators page shows '$20M+' Paid to Creators on 2026-10-01. TechCrunch 2026-05-14 relayed $15 million paid out; $20M+ four and a half months later is possible at a $40M run rate but unverified. The vendor's three payout figures ($6M+, $10M+, $20M+) conflict with one another. No search available.
  - verifier (scope): **scope_ok** — Quote matches the creators page on 2026-10-01.
- **c032** Under Dataset Deals Method 1 (Fractional Participation), a creator is paid their Fractional Participation multiplied by 50 percent of what the Dataset Partner pays Wirestock.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **50 percent** (creator pool's share of the gross payment Wirestock receives from a Dataset Partner, divided pro rata by item count (Method 1); per dataset deal)
  - “Your Fractional Participation multiplied by 50 percent of the total payment Wirestock receives from the Dataset Partner” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Wirestock's own Terms (effective January 20, 2026), confirmed live on 2026-10-01. No partner or third-party document restates it.
  - verifier (scope): **scope_ok** — Quote matches the live Terms (effective January 20, 2026), Method 1 only.
- **c033** Under Dataset Deals Method 1, Wirestock keeps the remaining 50 percent of the Dataset Partner's payment.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **50 percent** (Wirestock's retained share of the gross Dataset Partner payment (Method 1); per dataset deal)
  - “You agree that Wirestock shall retain the remaining 50 percent of the total payment.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Follows from the same Terms formula (50 percent of the Dataset Partner payment is the pool); live on 2026-10-01. Vendor's own clause.
  - verifier (scope): **scope_ok**
- **c034** Fractional Participation is a creator's number of participating items divided by the total number of items participating in the Dataset Program.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “total number of items of your Content participating in the Dataset Program divided by the total number of items of Content” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** Under Dataset Deals Method 2 (Dynamic Calculation), for bundled deals a creator's compensation is determined by Wirestock in its sole discretion.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “In those instances, your compensation will vary and will be determined by Wirestock in its sole discretion.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Wirestock chooses which of the two Dataset Deals compensation methods applies, in its sole discretion.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “you agree to be compensated in either of the two following methods, as determined by Wirestock in its sole discretion” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** Wirestock's Terms give a worked example: 100 of 10,000 participating items on a 10,000 US dollar deal pays the creator 50 US dollars.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **50 USD** (illustrative example in the Terms, not a real deal: 1% of pool times 50% of a USD 10,000 Dataset Partner payment; per dataset deal)
  - “100 (your total participating Content) / 10,000 (total Content participating) * (50% *$10,000 (payment)) = $50.00” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Worked example in Wirestock's own Terms, live on 2026-10-01.
  - verifier (scope): **scope_ok** — The profile's value basis correctly marks it as an illustrative example.
- **c039** For stock downloads paid by a content marketplace, Wirestock pays the creator 85 percent of the royalty and keeps 15 percent.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **85 percent** (creator share of the royalty Wirestock receives from a content marketplace per download (legacy stock distribution); per download)
  - “you agree that Wirestock will pay you 85% of the Royalty, but will keep 15% of the Royalty.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The 85%/15% clause is still in the Terms (effective January 20, 2026) on 2026-10-01, but Wirestock's own blog post 'What's New in Wirestock' (dated Apr 9, 2026) says 'Wirestock would stop distributing content to third-party stock marketplaces', so the clause likely no longer operates. TechCrunch 2022-07-01 on the Getty partnership gives no split. No independent notice of the distribution ending could be found; no search available.
  - verifier (scope): **scope_wrong** — The quote is live in the Terms, but the statement is in the present tense for a service Wirestock says it has ended: its April 2026 guide says it 'would stop distributing content to third-party stock marketplaces' (the profile's own c006). The statement should be scoped as the legacy stock-distribution clause that is still printed in the January 2026 Terms. The profile's conflict entry pairs c039 with c088, but they cover different channels (third-party marketplace royalties versus Commission Based project licences), so they do not conflict; the real conflict is c039 against c006.
- **c040** For print sales Wirestock pays the creator 70 percent of what it receives from the purchaser and keeps 30 percent.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **70 percent** (creator share of amount received from print purchaser, excluding shipping, processing and taxes; per print sale)
  - “Wirestock will pay you an amount equal to 70% of the total amount Wirestock receives from the purchaser” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Clause live in the Terms on 2026-10-01. The same April 2026 post says the Portfolio and Marketplace are being retired; it does not mention prints, so whether print sales still run is unknown. Vendor's own clause.
  - verifier (scope): **scope_ok** — Quote matches the live Terms. Whether print sales still run after the Portfolio and Marketplace were retired (c094) is not stated anywhere; the statement should ideally carry that caveat.
- **c065** Wirestock currently pays creators only through PayPal and Payoneer.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Currently, Wirestock only supports payments through Paypal and Payoneer.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c066** The minimum payout is 30 US dollars via PayPal and 50 US dollars via Payoneer per accounting period.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **30 USD** (minimum payout per accounting period via PayPal (USD 50 via Payoneer); per month)
  - “thirty U.S. Dollars (USD $30.00) for PayPal and fifty U.S. Dollars (USD $50.00) for Payoneer” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Payout thresholds in Wirestock's own Terms, live on 2026-10-01.
  - verifier (scope): **scope_ok** — Quote matches. The value's period 'per month' was not checked against the Terms' definition of accounting period; the statement's 'per accounting period' is the safer wording.
- **c067** If a creator closes an account below the payout minimum, Wirestock deducts a 20 US dollar funds administration fee each month.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **20 USD** (monthly fee deducted from sub-minimum royalty balance after account termination; per month)
  - “a funds administration fee of $20 USD” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c077** Wirestock's FAQ says Dataset Deals earnings are calculated from a creator's contribution within the participating pool and the deal's payment terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “earnings are calculated based on your contribution within the participating pool and the payment terms of the deal” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c079** Wirestock's FAQ says creators applying to paid projects submit requested assets and releases and are paid for each approved asset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Then submit the requested assets (and any releases if needed). Your submission will be reviewed, and you'll get paid” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c080** Wirestock's FAQ says the minimum payout amount is 30 US dollars.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The minimum payout amount is $30.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c082** Wirestock's FAQ says Marketplace earnings are calculated from total buyer subscription revenue and the relative contribution of a creator's content.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “calculated based on the total subscription revenue from buyers and the relative contribution of your content” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c086** Wirestock distinguishes Fixed Payments, paid once commissioned project work is approved, from Commission Based payments earned each time content is licensed.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Fixed Payments apply when you create work for a specific project and get paid once it's approved.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/7PsHB3lkunyJY3L58Azk6K7TYyG5fg-sTyE9eFrrOIY.2dgPynaX.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c088** Wirestock says creators earn 50 percent commission each time one of their assets is licensed under the Commission Based plan.  
  _number · vendor_stated · as of 2026-07-13 (page_dated)_ · **50 percent** (creator commission on each licence of an asset in a Commission Based project; basis of the percentage (gross or net) not stated; per licence)
  - “You earn 50% commission each time someone licenses one of your assets” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Stated in Wirestock's blog post of 13 July 2026 ('You earn 50% commission each time someone licenses one of your assets'). No independent source; the sell-your-content page calls the plan commission-based without a percentage.
  - verifier (scope): **scope_ok** — Quote matches the 13 July 2026 post. The source is a blog post rather than contract text; the profile already records that the Terms do not mention Commission Based projects.
- **c090** Under Fixed Payments, creators join a creator pool, complete a test task, and are paid for each submission approved for an active project.  
  _terms · vendor_stated · as of 2026-07-13 (page_dated)_
  - “complete a test task, and then earn money every time one of your submissions gets approved for an active project” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Stated in Wirestock's 13 July 2026 blog post; no third-party source describes the Fixed Payments flow.
  - verifier (scope): **quote_incomplete** — The quote omits the creator-pool step. The post reads 'you apply to join a creator pool, complete a test task'.
- **c092** Fixed Payment earnings are a rate per asset multiplied by the number of approved assets.  
  _terms · vendor_stated · as of 2026-07-13 (page_dated)_
  - “Rate per asset times 15 equals what you earn.” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c123** Wirestock's sell-your-content page says approved content stays available for purchase, earning commission each time.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Once approved, your content stays available for purchase, earning you commission each time.” — Wirestock, <https://wirestock.io/creators/sell-your-content> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c126** Wirestock's sell-your-content page claims more than 10 million US dollars in creator payouts.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **10000000 USD** (cumulative creator payouts, vendor-stated; cumulative)
  - “$10M+ Creator Payouts” — Wirestock, <https://wirestock.io/creators/sell-your-content> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Sell-your-content page shows '$10M+' Creator Payouts on 2026-10-01; conflicts with the About page ($6M+), the creators page ($20M+) and TechCrunch's relayed $15 million (May 2026).
  - verifier (scope): **scope_ok**

### post_sale

- **c059** Wirestock has the right to remove a creator's content from its website.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock has the right to remove your Content from its Website” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c060** Licences issued by Wirestock to a sublicensee remain in force in perpetuity even if the content is later removed from Wirestock.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “to any Wirestock sublicensee, if later removed from Wirestock, will remain in full force and effect, in perpetuity” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c061** On account termination, licensees are not obliged to remove the content from their servers, products or Developed Technology.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “will be obligated to remove the Content, or any elements or portions of it, from its servers, databases, storage devices” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c062** After termination, Wirestock's licensees keep the right to retrain, tune and commercialise products reliant on the content.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “will continue to have the right to support, maintain, update, improve, retrain, tune, validate, revalidate” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c063** Wirestock says it has no feasible way to retrieve content from end users once licences are granted.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “as Wirestock has no feasible way to retrieve such content from Ultimate Users” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c064** Wirestock terminates an account no later than 120 days after a written request from the creator.  
  _number · legal_text · as of 2026-01-20 (page_dated)_ · **120 days** (maximum time from creator's written termination request to account termination; one-off)
  - “it will terminate your account no later than 120 days following our receipt of a written request from you” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c085** Creators can remove content from Commission Based projects by contacting Wirestock support.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You can remove your content from Commission Based projects by contacting Wirestock support at support@wirestock.io.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/7PsHB3lkunyJY3L58Azk6K7TYyG5fg-sTyE9eFrrOIY.2dgPynaX.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c131** Licences issued through content marketplaces for content later removed stay in force in perpetuity.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “will remain in full force and effect in perpetuity.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c019** Wirestock's CEO told TechCrunch that early deals were mostly sales of its existing off-the-shelf library.  
  _outcome · press_relayed · as of 2026-05-14 (publication)_
  - “Initially, a lot of our deals were just selling what we had off the shelf, like our existing library.” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The CEO's own words as printed by TechCrunch; TechCrunch is the only record and is the profile's own source, so it is not counted as independent. No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “Initially, a lot of our deals were just selling what we had off the shelf, like our existing library” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c020** Wirestock's CEO told TechCrunch that deals then turned into many custom requests for content and data, creating work for creators.  
  _outcome · press_relayed · as of 2026-05-14 (publication)_
  - “But then it turned into a lot of custom requests for content and data, and that created new opportunities for creators.” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The CEO's own words as printed by TechCrunch; the profile's own source, so not counted as independent. No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “But then it turned into a lot of custom requests for content and data, and that created new opportunities” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c022** Wirestock's About page says it delivers both ready-to-use datasets and custom content built around specific training goals.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Wirestock delivers both ready-to-use datasets and custom content built around” — Wirestock, <https://wirestock.io/about-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c081** Wirestock's FAQ describes Paid Projects as briefs where creators create and submit specific content for AI training and evaluation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Paid projects are paid briefs where you create and submit specific types of content for AI training and evaluation.” — Wirestock, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs> · docs · retrieved 2026-10-01 · quote check: exact
- **c089** Under Commission Based pay, Wirestock organises approved content into project listings by content type and offers it to AI labs.  
  _offer · vendor_stated · as of 2026-07-13 (page_dated)_
  - “Wirestock then offers this data to AI labs.” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c098** Wirestock said creator profiles would become the primary way creators are matched with paid project opportunities.  
  _offer · vendor_stated · as of 2026-04-09 (page_dated)_
  - “it will now be the primary way you're matched with paid project opportunities across the platform” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c102** Wirestock says it curates custom multimodal datasets for top labs, sourced directly from its creator community.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “curate custom multimodal datasets structured precisely for their architecture, sourced directly from our creator community” — Wirestock, <https://wirestock.io/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c117** Wirestock's AI Labs page lets buyers configure, review and iterate data specifications.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Configure, review, and iterate data specifications as needed.” — Wirestock, <https://wirestock.io/ai-labs> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c118** Wirestock's homepage offers custom multimodal datasets built to buyer specifications, with rubrics and verifier tasks.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom multimodal datasets structured to your specifications, with rubrics, verifier tasks” — Wirestock, <https://wirestock.io/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c121** Wirestock's creators page invites creators to exclusive AI-lab projects creating custom content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Participate in exclusive projects from AI Labs and earn by creating custom content” — Wirestock, <https://wirestock.io/creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c127** Wirestock said its Series A would expand its capacity to execute increasingly complex custom datasets.  
  _offer · vendor_stated · as of 2026-05-15 (page_dated)_
  - “expand our capacity to execute on increasingly complex custom datasets” — Wirestock, <https://wirestock.io/blog/wirestock-raises-23m-series-a> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c133** Wirestock's homepage navigation calls its bespoke offer 'Custom data solutions' next to 'Explore datasets'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom data solutions” — Wirestock, <https://wirestock.io/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Wirestock was operating and publishing creator payment guidance on 13 July 2026, describing big changes to how the platform works.  
  _status · vendor_stated · as of 2026-07-13 (page_dated)_
  - “We've made big changes to how Wirestock works” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The 13 July 2026 post ('Getting Paid on Wirestock: Your Two Options') exists only on wirestock.io, and the blog index lists later posts up to 2 Sep 2026. Independent evidence of operation is older: TechCrunch 2026-05-14 reported the Series A and 60 staff; Nava Ventures and Formula VC list Wirestock in their live portfolios (undated). No independent source dated after May 2026 was reachable; no search available. Note the same blog's 'What's New in Wirestock' post (dated Apr 9, 2026) says the Portfolio and Marketplace are being retired and stock-marketplace distribution stopped.
  - verifier (scope): **scope_ok** — Quote and date (13 July 2026) match the post. For status, a fresher vendor source exists: the blog lists posts to 2 Sep 2026, and the 'What's New' guide shows 'Published Sep 30, 2026'.
- **c002** Wirestock announced on 15 May 2026 that it had raised 23 million US dollars.  
  _event · vendor_stated · as of 2026-05-15 (page_dated)_
  - “We've Raised $23M. Here's What We're Building Next” — Wirestock, <https://wirestock.io/blog/wirestock-raises-23m-series-a> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
- **c003** TechCrunch reported on 14 May 2026 that Wirestock raised 23 million US dollars in Series A funding led by Nava Ventures.  
  _event · press_relayed · as of 2026-05-14 (publication)_
  - “it has raised $23 million in Series A funding to build out the new data supply business. The round was led by Nava” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. Nava Ventures' own portfolio page (nava.vc/portfolio) lists Wirestock ('Premium multimodal data from a global network of creative professionals'), which corroborates the investor relationship but not the amount or lead role. SEC EDGAR full-text search for 'Wirestock' returned 0 hits (no Form D). No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. This TechCrunch URL is the profile's own source (checked after the blind pass), so it is not counted as independent.
    - “raised $23 million in Series A funding to build out the new data supply business. The round was led by Nava Ventures” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c004** TechCrunch reported that SBVP, Formula VC and I2BF Ventures participated in Wirestock's Series A.  
  _event · press_relayed · as of 2026-05-14 (publication)_
  - “saw participation from SBVP (co-founded by Sheryl Sandberg), Formula VC, and I2BF Ventures” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c005** Wirestock's current Terms of Service are effective as of 20 January 2026.  
  _event · legal_text · as of 2026-01-20 (page_dated)_
  - “Effective as of January 20, 2026.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c006** On 9 April 2026 Wirestock told creators it had earlier that year announced it would stop distributing content to third-party stock marketplaces.  
  _event · vendor_stated · as of 2026-04-09 (page_dated)_
  - “Earlier this year, we announced that Wirestock would stop distributing content to third-party stock marketplaces.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c021** TechCrunch reported that Wirestock allowed artists to opt out of its data supply business when it shifted.  
  _event · press_relayed · as of 2026-05-14 (publication)_
  - “Wirestock was transparent about its shift and allowed artists to opt out of its data supply business” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c027** Wirestock's Terms honour opt-outs from the Dataset Deals Program that creators requested before the effective date, but only for that content.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock will respect your request but only as to that Previously Opted-Out Content.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c041** From 20 January 2026 Wirestock will not license or provide to third-party content marketplaces any content first submitted after that date.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “starting January 20, 2026, Wirestock will not license or otherwise provide to the content marketplaces any New Content” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c068** Wirestock may modify the Terms at any time, notifying creators by email or on the site no later than three days before changes take effect.  
  _terms · legal_text · as of 2026-01-20 (page_dated)_
  - “Wirestock reserves the right to modify these Terms at any time in its sole discretion.” — Wirestock, <https://wirestock.io/docs/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c093** Content approved before the changes was moved automatically into Commission Based projects.  
  _event · vendor_stated · as of 2026-07-13 (page_dated)_
  - “it's already moved into a Commission Based project. You don't need to do anything.” — Wirestock, <https://wirestock.io/blog/how-to-get-paid-on-wirestock> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c094** In April 2026 Wirestock said its Portfolio and Marketplace were being retired.  
  _event · vendor_stated · as of 2026-04-09 (page_dated)_
  - “The Portfolio and Marketplace are being retired.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c095** Wirestock said previously approved content would move automatically into Paid per sale projects, without creator action.  
  _event · vendor_stated · as of 2026-04-09 (page_dated)_
  - “Previously approved content will move automatically to Paid per sale projects.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c096** Wirestock said content submitted but never approved would be removed from the platform.  
  _event · vendor_stated · as of 2026-04-09 (page_dated)_
  - “Unapproved content will be removed from the platform.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c099** Wirestock said Premium plans were being discontinued and subscribers refunded.  
  _event · vendor_stated · as of 2026-04-09 (page_dated)_
  - “Premium plans are being discontinued.” — Wirestock, <https://wirestock.io/blog/whats-changing-on-wirestock-a-guide-for-creators> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c007** TechCrunch reported, citing the company, that Wirestock had an annual run-rate revenue of 40 million US dollars in May 2026.  
  _number · press_relayed · as of 2026-05-14 (publication)_ · **40000000 USD** (annual run-rate revenue, company-reported to TechCrunch, not audited; per year)
  - “the company currently has an annual run-rate revenue of $40 million” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. No filing exists (EDGAR 0 hits). No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “company currently has an annual run-rate revenue of $40 million” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c008** TechCrunch reported that Wirestock supplies multimodal data to six of the largest foundation model makers, which the CEO would not name.  
  _number · press_relayed · as of 2026-05-14 (publication)_ · **6 foundation-model customers** (company-reported count of large foundation model makers served; unnamed; as of May 2026)
  - “Wirestock currently provides multimodal data to six of the largest foundation model makers, but he wouldn't name them.” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. No search available (WebSearch not offered in this run); no second outlet could be reached by navigation. 
    - “provides multimodal data to six of the largest foundation model makers, but he wouldn't name them” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c014** Wirestock's About page says more than 10 million assets have been licensed for AI.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **10000000 assets licensed for AI** (vendor-stated cumulative count; label '10M+'; cumulative)
  - “10M+ Assets Licensed for AI” — Wirestock, <https://wirestock.io/about-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — About page shows '10M+' Assets Licensed for AI; the creators page labels the same '10M+' as 'Paid Content Licenses', which is not necessarily the same measure. TechCrunch 2026-05-14 gives no licensed-asset count. No search available.
  - verifier (scope): **scope_ok** — Quote matches the About page. The creators page shows the same '10M+' labelled 'Paid Content Licenses', so the count may measure licences rather than distinct assets.
- **c016** Wirestock's Series A announcement says millions of assets have been licensed for AI training.  
  _outcome · vendor_stated · as of 2026-05-15 (page_dated)_
  - “Millions of assets have been licensed for AI training” — Wirestock, <https://wirestock.io/blog/wirestock-raises-23m-series-a> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Wirestock's own Series A post (wirestock.io/blog/wirestock-raises-23m-series-a) says 'Millions of assets have been licensed for AI training'. TechCrunch 2026-05-14 does not repeat a licensed-asset count. No search available.
  - verifier (scope): **scope_ok**
- **c129** Wirestock says its platform serves the world's leading AI labs.  
  _outcome · vendor_stated · as of 2026-05-15 (page_dated)_
  - “That platform now serves the world's leading AI labs” — Wirestock, <https://wirestock.io/blog/wirestock-raises-23m-series-a> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **confirmed_relayed** — An investor's portfolio blurb (Formula VC) restating the company's positioning, so relayed, not independent. TechCrunch 2026-05-14 relays the CEO's claim of 'six of the largest foundation model makers' without names. No buyer has been named anywhere reachable.
    - “Wirestock is a content infrastructure platform that connects MAG7 and AI Labs with high-quality, scalable visual datasets.” — Formula VC, <https://formula.vc/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Stated as vendor-said; the only other source is an investor blurb (Formula VC) and TechCrunch relaying the CEO.

### other

- **c010** TechCrunch reported that Wirestock employed 60 people in May 2026.  
  _number · press_relayed · as of 2026-05-14 (publication)_ · **60 employees** (headcount, company-reported; as of May 2026)
  - “Wirestock currently employs 60 people and will use the new funding to hire for research, engineering, and product roles.” — TechCrunch, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — TechCrunch is a different domain, but every figure in the article is attributed to the company or its CEO, so it relays the vendor's statement rather than establishing it; it is also the profile's own source. Headcount after May 2026 (any cut or growth) could not be checked: no search available and no registry or filing found (EDGAR 0 hits).
    - “Wirestock currently employs 60 people” — TechCrunch (Ivan Mehta, 2026-05-14), <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the article and the statement is correctly framed as 'TechCrunch reported'. The source is tagged source_class independent_press while origin is press_relayed; since the figure is attributed to the company, press_relaying_vendor is the better class.
- **c024** Wirestock's About page names Mikayel Khachatryan, Ashot Mnatsakanyan, Vladimir Khoetsyan and Hovhanness Kuloghlyan as founders.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Wirestock was founded by Mikayel Khachatryan, Ashot Mnatsakanyan, Vladimir Khoetsyan,” — Wirestock, <https://wirestock.io/about-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** TechCrunch reported on 1 July 2022 that Wirestock had signed a distribution partnership covering Getty Images and its sister site iStock.  
  _event · press_relayed · as of 2022-07-01 (publication) · scope: stock distribution (legacy)_
  - “The deal includes both Getty Images and its sister site iStock.” — TechCrunch (Haje Jan Kamps, 2022-07-01), <https://techcrunch.com/2022/07/01/wirestock-getty/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **v002** TechCrunch reported in July 2022 that Wirestock had about 100,000 contributors and 3 million pieces of content, against 700,000+ creators reported in May 2026.  
  _number · press_relayed · as of 2022-07-01 (publication)_ · **100000 contributors** (registered contributors, company figure relayed by TechCrunch; 3 million content items; as of July 2022)
  - “gives the 100,000 or so contributors on the Wirestock platform, and their 3 million pieces of content” — TechCrunch (Haje Jan Kamps, 2022-07-01), <https://techcrunch.com/2022/07/01/wirestock-getty/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **v003** Investor Formula VC describes Wirestock as connecting MAG7 and AI labs with licensable visual datasets, naming big-tech firms as a buyer group alongside AI labs.  
  _outcome · press_relayed · as of 2026-10-01 (retrieved_only)_
  - “Wirestock is a content infrastructure platform that connects MAG7 and AI Labs with high-quality, scalable visual datasets.” — Formula VC, <https://formula.vc/> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.custody_model` — not_published; tried <https://wirestock.io/datasets>, <https://wirestock.io/datasets/virtual-try-on>, <https://wirestock.io/datasets/high-bit-video>, <https://wirestock.io/datasets/dance-videos>, <https://wirestock.io/ai-labs>, <https://wirestock.io/blog/wirestock-raises-23m-series-a>, <https://wirestock.io/docs/terms-of-use>
- `matrix.exclusivity_offered` — not_published; tried <https://wirestock.io/ai-labs>, <https://wirestock.io/datasets>, <https://wirestock.io/docs/terms-of-use>, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs>
- `matrix.versioning` — not_published; tried <https://wirestock.io/datasets>, <https://wirestock.io/datasets/virtual-try-on>, <https://wirestock.io/datasets/high-bit-video>, <https://wirestock.io/datasets/dance-videos>, <https://wirestock.io/docs/terms-of-use>
- `other.buyer_licence` — not_published; tried <https://wirestock.io/docs/terms-of-use>, <https://wirestock.io/docs/faq>, <https://wirestock.io/ai-labs>, <https://wirestock.io/datasets>
- `other.marketplace_terms_link` — not_found; tried <https://wirestock.io/docs/terms-of-use>
- `other.commissioned_work_resale` — not_published; tried <https://wirestock.io/ai-labs>, <https://wirestock.io/datasets>, <https://wirestock.io/docs/terms-of-use>, <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/4se6MT8-6beNPZUAlSBWvEATGdQHo-IvJQuwY3wJkGk.BENxEdRF.mjs>, <https://wirestock.io/blog/how-to-get-paid-on-wirestock>
- `other.independent_traction` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Wirestock%22>, <https://www.sec.gov/cgi-bin/browse-edgar?company=wirestock&action=getcompany>, <https://techcrunch.com/2026/05/14/wirestock-raises-23m-to-supply-multi-modal-data-to-ai-labs/>
- `other.press_beyond_techcrunch` — blocked; tried <https://aiweekly.co/alerts/wirestock-raises-23m-for-licensed-ai-training-data>
- `other.custom_dataset_intake_form` — js_empty; tried <https://wirestock.typeform.com/to/kcnPj9RV>, <https://wirestock.io/datasets/contact>
- `questions.Q8` — not_published; tried <https://wirestock.io/docs/terms-of-use>, <https://wirestock.io/ai-labs>, <https://wirestock.io/datasets>, <https://wirestock.io/datasets/dance-videos>
- `questions.Q10` — not_published; tried <https://wirestock.io/datasets>, <https://wirestock.io/datasets/virtual-try-on>, <https://wirestock.io/docs/terms-of-use>

## Conflicts

- c028, c076, c021: The Terms (effective 2026-01-20) say there is no option to opt out of Dataset Deals for content submitted after that date; the FAQ says opting out is possible 'when available'; TechCrunch says artists could opt out when Wirestock shifted to data supply (apparently the earlier, 2023 shift). The Terms govern new content; earlier opt-outs are honoured (c027). (live_primary_wins_terms)
- c009, c012, c013, c126: Cumulative creator payouts are given as USD 15M (TechCrunch, May 2026), USD 6M+ (About page), USD 20M+ (creators page) and USD 10M+ (sell-your-content page). The figures may count different programmes or dates; none is independently verified. (unresolved)
- c072, c082, c094: The January 2026 Terms and the FAQ still describe the Wirestock Marketplace subscription; the April 2026 creator guide says the Portfolio and Marketplace are being retired. The newer notice is taken as current. (newer_wins_status)
- c039, c088: The Terms' general compensation clause pays 85% of stock-marketplace royalties, while the July 2026 guide pays 50% commission per licence in Commission Based projects; the Terms do not mention Commission Based projects, so which contract text governs the 50% rate is unclear. (unresolved)

## Leads, not cited

- <https://aiweekly.co/alerts/wirestock-raises-23m-for-licensed-ai-training-data> — Summary piece that relays TechCrunch ($40M+ annualised revenue); not cited as the publisher is an aggregator. TechCrunch was cited instead.
- <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/bGbuegs1szpPSz4fIXJ-DlF0RATCOZEOiV_sCRTdg4w.B2NBWXjy.mjs> — JS bundle holding the AI Labs FAQ answers (custom datasets 'beyond our existing library', 'strict quality control to remove duplicates'); WebFetch could not read it, so not cited.
- <https://framerusercontent.com/sites/28xXcwZQ1sdr0D4OjHIHMA/yV1fTgLTwxKH81uwKSqEM5ybnO0IgNWXoMrFKNT4mNo.eSVfi1ou.mjs> — JS bundle holding the sell-your-content FAQ answers (Commission Based payouts, removal on request); WebFetch could not read it.
- <https://wirestock.io/blog/ai-training-data-visual-data-bottlenecks> — Blog post on AI training data; body is JS-rendered and returned no text.
- <https://wirestock.io/docs/submission-guidelines> — Submission and release requirements (e.g. AI-generated content depicting real people needs a model release); worth a light read for Q7.
- <https://wirestock.io/docs/privacy> — Privacy notice: contributors may be asked for government ID or card verification; relevant to contributor identity checks.
