# Kled

crowd_capture · deep · status: **active** · also known as Kled AI, Kled.ai, Nitrility, Inc.

> Rendered from `ledger/kled.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Dataset Catalog ('Explore Kled’s Full Data Library'); ready-made collections are also called 'data packs' / 'datapacks'” and its bespoke side “'Request Dataset' (buyer-facing button); fulfilled through 'Special Tasks' set by enterprise buyers in the contributor app”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c095, c101, c102, c130, c103 | Contributors license their uploads to Nitrility (Kled), which sublicenses through multiple tiers to its 'Data Customers'; its privacy policy says it licenses and sells the content. Kled's MiCA white paper instead calls it a two-sided marketplace between data owners and AI labs (see conflicts). No buyer licence is published. For partner catalogues (MPT, Ninja Digital, drone footage) Kled says it holds exclusive AI licensing rights itself. |
| economics_model | principal_margin | c075, c113, c065, c064, c134 | Kled takes rights from contributors, pays them rewards it sets itself (no fixed rate, no revenue share in the Terms) and sells at its own price, citing its own 'sales margin'. The white paper says revenue comes from 'licensing and transaction fees'; how partner-licensed catalogues are split with rights holders is not published. |
| who_pays_fee | unknown |  | No fee schedule exists for buyers or suppliers; Kled acts as principal for contributor data, and the 'transaction fees' in the white paper are not described. |
| supply_models | contributor_uploads, partner_licensed | c039, c113, c056, c011, c012, c013, c016, c052 | Crowd uploads through the phone app (general camera-roll uploads plus Special Tasks, some issued by Kled itself to build data packs) and exclusive AI-licensing deals for media catalogues (Maryland Public Television, Ninja Digital Holdings titles, a drone footage catalogue, film studios). Also used: 20,000+ trained VAs and specialist accountants for some collections. Whether data captured for one buyer's Special Task is resold to others is not stated. |
| custody_model | copy_to_buyer | c042, c043, c045, c041 | Kled hosts uploads itself (AWS regions by contributor location, in-house servers) and says validated data is 'sent directly' to labs. Delivery mechanics (format, bucket transfer or portal download) are not documented; the help centre speaks of buyers purchasing 'access'. |
| transaction_mode | contact_sales | c038, c088, c004 | The catalogue's only purchase action is 'Contact Sales' (email); labs evaluating data get access 'through Kled's commercial channels'. An enterprise portal with 'purchases' pages exists behind login but could not be inspected. |
| public_prices | none | c038, c034 | No dataset price on the catalogue cards or anywhere found. Contributor reward amounts are published, but those are what Kled pays, not what buyers pay. |
| licence_model | unknown |  | No buyer licence, EULA or data licence agreement is published; the only buyer-side term seen is that the $12M deal was 'non-exclusive'. |
| exclusivity_offered | unknown |  | The $12M deal was non-exclusive [c004]. Catalogue cards say 'Exclusive Rights', but this appears to describe Kled's own rights from the rights holder, not rights offered to a buyer; no statement found on whether a buyer can buy exclusivity. |
| public_listing | public_summary_gated_detail | c033, c034, c037, c031, c032, c088 | The Dataset Catalog shows cards (name, RAW/LABELED tag, size, modality, 'Exclusive Rights') to anyone; details, samples and purchases sit in the login-only enterprise portal or with sales. |
| buyer_vetting | unknown |  | The enterprise portal has a 'request-access' page, which suggests buyers are admitted on request, but no vetting rule is published. |
| sample_mechanics | sample_on_request | c088, c033 | The catalogue promises 'sample previews' but none are visible to an anonymous visitor; the audit portal says labs evaluating a dataset get access through Kled's commercial channels. |
| versioning | unknown |  | Nothing on dataset versions or what a past buyer receives. Contributor revocation or deletion removes assets from 'active datasets' [c092], so datasets appear to change over time, but buyer-side effects are unpublished. |
| human_subject_consent_docs | asserted_only | c109, c111, c131, c085, c084, c110 | People depicted other than the uploader are covered only by the uploader's warranty that they obtained consent. Trace receipts record the uploader's own consent (the ToS and privacy-policy versions accepted, 'signed consent forms'), and labs can verify them. No release from bystanders or depicted third parties is collected or passed to buyers. |
| contributor_pay_model | one_off | c113, c064, c065, c067, c071, c072, c059 | Contributors earn a reward per accepted upload or task, valued by Kled at its discretion (dynamic, no flat rate) and credited in batches; task rewards are fixed per item (for example $5 per trash video). No royalty or per-sale share appears in the Terms. The May 2026 Terms mentioned 'content sales' balances [c129], so the history is not fully clear. Referral commissions come on top. |
| catalogue_plus_custom | both | c033, c055, c058, c005 |  |
| erasure_after_sale | takedown_only | c092, c093, c117, c132, c102 | Revocation or deletion removes the asset from Kled's active datasets. The contributor licence is irrevocable, and Kled need not delete content on account deletion. No published term obliges buyers to delete copies they already hold; buyer contracts are not public. |
| quality_evidence | operator_verified | c080, c081, c082, c083, c076, c079 | Kled runs its own fraud-detection pipeline (Kled-FD), ML spec checks, duplicate blocking and crowd-consensus validation (UFDP). All of this is vendor-described; no third-party quality audit was found (the Trail of Bits audit is security and privacy). |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers are AI labs, enterprises and governments [c030]; Kled cites a $12M two-year non-exclusive deal [c004], an $8M financial-data request [c005] and a 100M-asset KPI from an image-generation lab [c019]. All of these are vendor-stated, and Kled does not say why buyers take ready-made data rather than custom. | c030, c004, c005, c019, c018, c027, c063, c086 |
| Q2 | partial | Kled built its own marketplace and consumer app and also sells voice data through distribution partners [c053]. For catalogue owners such as MPT, the pitch is that labs 'have to come through Kled' to train legally [c014]. | c053, c014, c012, c133, c062 |
| Q3 | sourced | Supply comes from phone-app contributors, who grant a perpetual, sublicensable licence that is exclusive for AI use [c103][c105], and from exclusive AI-licensing deals for media catalogues [c012][c013][c011]. Kled's sales teams build data packs from both [c052]. | c039, c103, c105, c102, c012, c013, c011, c016, c052, c056, c026, c020 |
| Q4 | partial | Kled's terms changed on 21 July 2026. The May 1, 2026 version was 'irrevocably selling' under a non-exclusive licence to Kled and its customers [c122][c123]; the July version is exclusive to Kled for AI use [c103]. Trace still shows v2026-05-01 as 'current' on 100% of receipts [c087]. Commissioned-data carve-outs are not described. | c122, c123, c103, c094, c121, c087, c119 |
| Q5 | sourced | Kled is licensor of record: contributors license to Nitrility, which sublicenses to 'Data Customers' [c095][c102]. Contributors warrant rights and consents and indemnify Kled and its customers [c109][c114]. Kled disclaims warranties [c116] and caps its liability to users at $100 [c115]. | c095, c102, c130, c109, c114, c116, c115, c133, c098 |
| Q6 | partial | Kled hosts uploads on its own infrastructure (AWS eu-west-1 and us-east-1) [c043][c042] and says validated data is 'sent directly' to labs [c045]. The delivery mechanism to buyers is undocumented. | c042, c043, c044, c045, c041 |
| Q7 | partial | Capturer: Kled accepts the uploader's ToS assent, recorded per receipt on Trace [c085][c087]. Depicted people: the uploader only warrants consent [c111][c131], and personal data of under-18s is barred [c110]. Place and property owners are not addressed. | c085, c087, c111, c131, c110, c125, c099, c069, c079 |
| Q8 | partial | The contributor side is exclusive to Kled for AI use and perpetual [c103][c102]. What buyers may do is unpublished; one deal is described as non-exclusive [c004]. Each upload carries a content-hash receipt on Trace [c085], but no buyer audit or leak-tracing term was found. | c103, c102, c004, c085, c096, c136 |
| Q9 | sourced | Buyers close through 'Contact Sales' and commercial channels [c038][c088]. Kled owns the licence and pays contributors discretionary per-item rewards [c113][c065], keeping a sales margin [c075]. The white paper cites licensing and transaction fees [c134]. | c038, c088, c113, c065, c075, c134, c068, c108 |
| Q10 | partial | The unit is an uploaded asset with a Trace receipt [c085], grouped into datasets and data packs [c058][c037]. The enterprise portal has datasets, collections and purchases pages [c032]. Revocation removes assets from 'active datasets' [c092]; what past buyers get is not stated. | c085, c058, c037, c032, c092, c093, c025, c057 |
| Q11 | partial | Publicly, buyers see catalogue cards [c034] and a Trace audit portal of receipts, consent versions and a Trail of Bits audit [c084][c090]; samples come through sales [c088]. Quality claims rest on Kled's own FD pipeline and crowd validation [c080][c082]. | c034, c033, c084, c090, c088, c080, c082, c083, c086, c047 |
| Q12 | sourced | The ready-made side is the 'Dataset Catalog' [c033], and bespoke work arrives as enterprise buyers' Special Tasks [c055]. Kled also issues its own Special Tasks and packages the results into data packs for its sales team [c056][c058]. | c033, c055, c056, c058, c017, c060, c005 |

## Narrative

### positioning

Kled (Nitrility, Inc., Delaware) sells itself as 'sourcing the largest licensable datasets on the planet' [c029] for AI labs, enterprises and governments [c030]. It pairs a consumer 'get paid for your data' app with a licensing business that also holds exclusive AI rights to media catalogues [c012][c013]. It also runs a Solana token ($KLED) as a rewards currency [c010].

### supply

Contributors, mostly in Southeast Asia (71.7% of receipts) and Sub-Saharan Africa [c048], upload photos, videos and files from the app [c039]. Images are 99.3% of files [c046]. Kled claims over 1 billion uploads [c020] and 300,000 contributors [c026]. Media supply comes from exclusive catalogue deals and film studios [c011][c016]. Some collections use VAs, accountants or shipped equipment [c049][c051][c050].

### object_model

Kled's unit is the upload, each with a Trace receipt holding a content hash [c085]. Uploads are grouped into datasets (12,000+ claimed [c025]), Special Task collections of 1,000-2,000 samples [c057] and sales 'data packs' [c058]. Catalogue cards are tagged RAW or LABELED [c037], and the buyer portal has datasets, collections and purchases pages [c032].

### listing

The public Dataset Catalog shows cards with a name, a one-line description, a size and 'Exclusive Rights' [c034][c035]. There are no prices or detail pages; it promises licensing details and sample previews [c033] that were not visible. Assets are not exposed publicly [c088].

### discovery

Buyers reach the catalogue from the homepage ('Explore Datasets', 'Request Dataset') or log in to a separate Enterprise Portal [c031][c032].

### trust

Kled publishes an audit portal on The DATA Foundation's Trace ledger showing receipt counts, consent-policy versions, contributor geography and compliance status [c084][c047][c090]. It says labs want receipts, consent forms and proof of payment before buying [c086]. The legal backstop is contributor warranties and an indemnity that also covers Kled's customers [c109][c114].

### transaction

No checkout exists: the catalogue's only action is 'Contact Sales' [c038], and evaluation access comes through commercial channels [c088]. Deals are sizeable and negotiated, such as a $12M two-year non-exclusive deal [c004]. The white paper describes automated licensing workflows as still under development [c135].

### pricing

No buyer prices are published. Kled cites a 'sales margin' on the data it sells [c075], and its white paper says revenue comes from licensing and transaction fees [c134].

### licence

Under the current Terms (21 July 2026), contributors grant a perpetual, irrevocable, multi-tier sublicensable licence that is exclusive to Kled for AI development [c102][c103][c104]. They may not license the content to anyone else for AI use [c105]. Earlier terms (1 May 2026) spoke of 'irrevocably selling' under a non-exclusive grant to Kled and its customers [c122][c123]. No buyer licence is public.

### custody

Kled stores uploads itself, in AWS eu-west-1 and us-east-1 and in its own servers [c043][c044], and says validated data goes 'directly' to labs [c045].

### vetting

Contributors pass KYC to cash out [c069], and duplicates are blocked [c076]. Kled's FD 0.1 pipeline flags AI-generated, stolen or duplicate media, minors and fraud rings [c080], and task videos that miss the specification are rejected automatically [c081]. UFDP adds crowd consensus from at least 50 people per question [c082]. Kled may reject content at will [c107].

### contributor_pay

Pay is a discretionary per-item reward with no flat rate [c064][c065], credited in batches [c067]. Cash-out starts at $25 [c068]. Advertised task rates include 500 selfies for $1,000 [c071] and $5 per chore video [c072]. If consents fail, contributors must refund what they were paid [c106].

### post_sale

Revocation or deletion removes an asset from 'active datasets' but leaves the receipt on Trace [c092][c093]. Content outlives account deletion [c132][c117]. No buyer deletion duty is published.

### catalogue_custom

The Dataset Catalog sits beside 'Request Dataset'. Enterprise buyers post Special Tasks [c055], such as an agreement for 80+ egocentric tasks [c017]. Kled also runs its own tasks and packages them into data packs [c056][c058].

### changes

Kled moved fast between 2025 and 2026: a 2025 launch, V2 and V3 releases, a $5.5M seed round [c007], $3M from The DATA Foundation [c003] and 500,000 users by July 2026 [c002]. Its Terms were rewritten on 21 July 2026 [c094], but Trace still shows the May 2026 version on every receipt [c087].

### demand

All demand figures are vendor-stated: a $12M deal [c004], an $8M request [c005], a $1M LOI [c018], a $35M+ pipeline [c027] and inbound requests from 'decacorn' labs [c063].

### regulation

Kled filed a MiCA white paper for its token [c009]. It states Delaware governing law in its Terms and says it is building SOC 2, ISO 27001, HIPAA and GDPR compliance [c091]. Under its Terms, partners may use personal data for their own purposes [c118].

## Buyer journey

1. Lands on kled.ai: 'Sourcing the largest licensable datasets on the planet', with buttons to 'Explore Datasets', 'Request Dataset' or become a contributor [c029][c030]. [c029, c030]
2. Opens the public Dataset Catalog. Cards show name, RAW/LABELED tag, size and modality, plus an 'Exclusive Rights' label; there are no prices and no detail pages [c034][c037]. [c033, c034, c037, c035, c036]
3. Clicks 'Contact Sales' (an email to team@kled.ai) or 'Request Dataset' for something not in the catalogue [c038]. [c038]
4. Optionally checks provenance on the public Trace audit portal: receipt counts, ToS versions, geography and compliance status. The assets themselves are not shown [c084][c088]. [c084, c087, c090, c088]
5. Gets evaluation access through Kled's commercial channels and the login-only Enterprise Portal, which has datasets, collections and purchases pages [c088][c032]. [c088, c031, c032]
6. For custom needs, Kled turns the request into Special Tasks in the contributor app. Contributors capture to spec and Kled validates the results [c055][c081]. [c055, c017, c081, c082]
7. Negotiates a deal with Nitrility as licensor, for example a two-year non-exclusive licence. The buyer licence terms are not public [c004][c095]. [c004, c095, c102]
8. Receives validated data sent directly from Kled's pipeline, then trains or fine-tunes models on it [c045][c096]. [c045, c096]

## Claims

### positioning

- **c001** Kled (Nitrility, Inc.) is operating: its privacy policy was last updated on September 14, 2026.  
  _status · legal_text · as of 2026-09-14 (page_dated) · scope: Kled_
  - “Nitrility, Inc. – Privacy Policy Last Updated: September 14, 2026” — Kled (Nitrility, Inc.), <https://www.kled.ai/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Operating status confirmed on Apple's App Store listing (seller 'Nitrility Inc.'), where version 3.0.1 was shown as released '3h ago' on 2026-10-01. The privacy-policy date itself is vendor_only; the live policy does read 'Last Updated: September 14, 2026'. Oddity: kled.ai/sitemap.xml lists a version page /privacy-policy/2026-11-14, a date in the future. The Google Play listing linked from Kled's Android post (play.google.com/store/apps/details?id=ai.kled.app) returned 404 on 2026-10-01. WebSearch not available in this run.
    - “Introducing Kled V3: • New task discovery feed: Find paid tasks directly on your” — Apple App Store, <https://apps.apple.com/app/kled/id6752585718> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote shows the Last Updated date on the named privacy policy.
- **c014** Kled says that AI companies wanting to train legally on the licensed classic titles must come through Kled.  
  _offer · vendor_stated · as of 2025-10-17 (page_dated) · scope: Kled_
  - “if they want to legally train on it, they have to come through Kled.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-secures-exclusive-rights-to-30-000-classic-titles> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** Kled's homepage describes the business as sourcing the largest licensable datasets on the planet.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Sourcing the largest licensable datasets on the planet.” — Kled (Nitrility, Inc.), <https://www.kled.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** Kled's homepage says it supplies AI companies, governments and research institutions with data sourced from verified contributors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “leading AI companies, governments, and research institutions with data sourced from verified contributors” — Kled (Nitrility, Inc.), <https://www.kled.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Kled describes its role as licensing, de-risking and enriching real-world data so labs can train without legal grey zones.  
  _offer · vendor_stated · as of 2025-08-19 (page_dated) · scope: Kled_
  - “We license, de risk, and enrich real world data (video, audio, text) so labs can train without legal gray zones.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/why-licensed-data-is-becoming-the-future-of-ai-training> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c133** Kled's white paper describes Nitrility's business as a two-sided marketplace enabling dataset licensing between data owners and AI labs.  
  _offer · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_
  - “enabling dataset licensing between data owners and AI laboratories” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact

### supply

- **c011** In December 2025 Kled said it owns exclusive rights to one of the largest US aerial drone footage catalogues (vendor-stated).  
  _event · vendor_stated · as of 2025-12-17 (page_dated) · scope: Kled_
  - “Kled now owns exclusive rights for one of the largest aerial drone footage catalogs in the United States.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-secures-exclusive-u.s.-drone-footage-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c012** In October 2025 Kled said it signed an exclusive AI licensing agreement with Maryland Public Television.  
  _event · vendor_stated · as of 2025-10-22 (page_dated) · scope: Kled_
  - “signed an exclusive AI licensing agreement with its first government organization, Maryland Public Television” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-signs-exclusive-ai-deal-with-maryland-public-television> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The counterparty's own channels show nothing. MPT's 2025 press-room listing (mpt.org/about/pressroom/pressroom-2025/) shows no release about Kled or AI licensing. MPT's Annual Report 2025 (Nov 2025) and Strategic Plan 2026-2029 PDFs contain no 'Kled'; the plan mentions AI only for internal tools. Silence is not a refutation. A state-agency deal of this kind should leave a record (commission minutes, procurement), but none was reachable. No search available.
  - verifier (scope): **scope_ok** — Quote says 'exclusive AI licensing agreement with its first government organization, Maryland Public Television'; the body date 10.22.25 matches.
- **c013** In October 2025 Kled said it holds exclusive AI licensing rights to over 30,000 entertainment titles under a deal with Ninja Digital Holdings.  
  _event · vendor_stated · as of 2025-10-17 (page_dated) · scope: Kled_
  - “Kled now holds the exclusive AI licensing rights to over 30,000 pieces of entertainment” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-secures-exclusive-rights-to-30-000-classic-titles> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c015** Kled says it migrated most of its enterprise content contracts to cover the suppliers' future catalogues as well as past catalogues.  
  _terms · vendor_stated · as of 2025-10-31 (page_dated) · scope: Kled_
  - “migrated the majority of all of our enterprise contracts to not only include past catalogs but now future catalogs” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-enterprise-v2-expands-with-growing-catalog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** In November 2025 Kled said it had signed $310,000,000 worth of enterprise data from international film studios since October 28 (vendor-stated).  
  _number · vendor_stated · as of 2025-11-08 (page_dated) · scope: Kled_ · **310000000 USD** (stated value of enterprise film data signed as supply, not revenue; basis of valuation not stated; 2025-10-28 to 2025-11-08)
  - “Kled has signed another $310,000,000 worth of enterprise data from international film studios.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-builds-petabyte-scale-infrastructure-for-global-expansion> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No studio is named, so there was no counterparty to check. A $310M figure is extraordinary next to the white paper's roughly USD 3M raised and the $35M pipeline claim, and it deserves independent confirmation that could not be reached. No search available.
  - verifier (scope): **quote_incomplete** — The 'since October 28' element is not in the quote; the page reads 'Since October 28th, Kled has signed another $310,000,000 worth of enterprise data from international film studios.' The quote's 'another' also implies earlier signings. The figure is the value of supply signed, not revenue, as the value basis says.
- **c020** In April 2026 Kled said it had passed 1 billion uploads (vendor-stated).  
  _outcome · vendor_stated · as of 2026-04-15 (page_dated) · scope: Kled_
  - “The first human data marketplace has just crossed over 1 billion uploads.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-surpasses-1-billion-uploads> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The DATA Foundation's 25 Jun 2026 post relays a consistent upload count (1.1B), and its homepage now says '1.5B+ records uploaded by real people'. The Foundation is Kled's partner and investor, and Kled's founder became its Chief Data Officer, so this is not independent.
    - “Over 1.1 billion images, videos, and files have been uploaded by real people on their app.” — The DATA Foundation, <https://datafdn.org/blog/were-becoming-the-data-foundation> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**
- **c026** Kled's April 2026 tokenomics page claims 300,000 contributors across 170+ countries and over 5 million uploads per day.  
  _number · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_ · **300000 contributors** (contributor count; vendor-stated; as of 2026-04-23)
  - “The network: 300,000 contributors across 170+ countries.” — Kled (Nitrility, Inc.), <https://www.kled.ai/kled-tokenomics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Partner (and investor) relays the 5M uploads/day figure in June 2026; its homepage shows '5M+ new uploads every day' and a live counter of '372.5K' contributors. The '170+ countries' figure was not found anywhere off Kled's site.
    - “Over 5 million uploads per day and growing.” — The DATA Foundation, <https://datafdn.org/blog/were-becoming-the-data-foundation> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Quote covers contributors and countries but not uploads; the page also says 'over 5 million uploads per day'.
- **c039** The Kled mobile app lets contributors submit photos, videos and files directly from their phone.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Easily submit photos, videos, and files directly from your phone.” — Kled (Nitrility, Inc.), <https://www.kled.ai/product> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c040** Kled's help centre says its content is used to train AI models and contributors are paid for the value it brings to training datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Your content is used to train artificial intelligence models, and you get paid for the value your contributions bring” — Kled Help Center, <https://help.kled.ai/article/what-is-kled-and-how-does-it-work> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** Kled's audit portal reports that 99.3% of the files measured on Trace are images and 0.7% are video (live dashboard).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_ · **99.3 percent of files** (share of 254,129,356 measured receipts that are images; as of 2026-10-01)
  - “Image 252,401,546 · 99.3%” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: missing 0.00
- **c048** Kled's audit portal says 71.7% of receipts come from Southeast Asia and 25.4% from Sub-Saharan Africa, with 2.2% from North America.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_ · **71.7 percent of receipts** (share of located receipts from contributors in Southeast Asia, weighted by receipt volume; as of 2026-10-01)
  - “Southeast Asia SEA 71.7% Sub-Saharan Africa AF 25.4%” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: missing 0.33
  - verifier (blind): **vendor_only** — The only source is Kled's own audit portal, hosted on the DATA Foundation's Trace network (trace.datafdn.org/audit/kled, linked from Kled's footer). The profile presumably cites this same URL, so it does not count as independent. Re-fetched live on 2026-10-01, it shows the same split: Southeast Asia 71.7%, Sub-Saharan Africa 25.4%, North America 2.2%, EU 0.4%.
  - verifier (scope): **quote_incomplete** — Quote lacks the North America figure; the portal also lists North America 2.2%. The figures matched the live portal on 2026-10-01.
- **c049** In September 2025 Kled said it had over 20,000 trained VAs who would contribute to 54 new multimodal datasets before collection moved to the main app.  
  _offer · vendor_stated · as of 2025-09-29 (page_dated) · scope: Kled_
  - “We’ve amassed over 20,000 trained VAs who will begin to contribute to these data sets” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-launches-54-new-multimodal-datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** For Kled ROS, Kled said it would ship capture equipment to thousands of Americans who agreed to record their household routines.  
  _offer · vendor_stated · as of 2025-10-29 (page_dated) · scope: Kled_
  - “shipped to thousands of middle income Americans who have agreed to record their daily household routines” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/introducing-kled-ros-for-robotic-training-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Kled said the $8M financial-data request was being fulfilled through a network of specialized accountants.  
  _offer · vendor_stated · as of 2026-06-27 (page_dated) · scope: Kled_
  - “currently being fulfilled through a network of specialized accountants with the proper legal clearance” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-lands-8m-financial-data-request> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c025** Kled says it has created 12,000+ structured datasets spanning egocentric, medical and urban travel data (vendor-stated).  
  _number · vendor_stated · as of 2026-03-10 (page_dated) · scope: Kled_ · **12000 structured datasets** (count of datasets Kled says it has created; vendor-stated; as of 2026-03-10)
  - “We’ve collected 12,000+ structured datasets created spanning egocentric data, medical data” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-raises-5.5m-seed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** The enterprise portal's site index lists a login page, request-access page and pages for datasets, collections and purchases.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “"/purchases":{"version":1,"title":"Kled.ai"” — Kled (Nitrility, Inc.), <https://framerusercontent.com/sites/3a3kujYV9IYC50kk0BykZ5/searchIndex-heiJpOdFBCVy.json> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** Catalogue cards are tagged RAW or LABELED; for example the Hospital Radiology Report Dataset is tagged LABELED.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “LABELED Hospital Radiology Report Dataset” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Kled says each Special Task collects 1,000-2,000 unique samples.  
  _number · vendor_stated · as of 2025-11-12 (page_dated) · scope: Kled_ · **2000 samples per task (upper end of 1,000-2,000)** (planned collection size per Special Task; per task)
  - “collect 1,000-2,000 unique samples per task” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-introduces-special-tasks-in-v2> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c033** Kled's public Dataset Catalog says it lists consumer and enterprise datasets with licensing details, metadata formats and sample previews.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “complete with licensing details, metadata formats, and sample previews” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c034** A catalogue card, 'Classic Animation Archive', shows 'Exclusive Rights to 18,000 Episodes' of video with no price.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “Exclusive Rights to 18,000 Episodes” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c035** A catalogue card lists a 'De-Identified U.S. Medical Records Corpus' of 50M records.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “De-Identified U.S. Medical Records Corpus” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** A catalogue card lists 'Feature Film Master Reels' of 40,000 hours of cinematic footage.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “Feature Film Master Reels” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c088** Kled's audit portal does not expose the underlying assets; labs evaluating a dataset are given access through Kled's commercial channels.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Labs evaluating a dataset for licensing are given access through Kled's commercial channels.” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c031** Kled's site footer links to a separate 'Enterprise Portal' at enterprise.kled.ai.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Enterprise Portal” — Kled (Nitrility, Inc.), <https://www.kled.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c047** Kled's audit portal shows 254,130,955 records on Trace (live counter).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_ · **254130955 receipts** (contribution receipts Kled has written to the Trace ledger; cumulative as of 2026-10-01)
  - “Records on Trace 254,130,955” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: missing 0.25
- **c083** Kled says every data point it sells to an AI lab has been validated by a decentralized network of contributors.  
  _offer · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_
  - “Every data point Kled sells to an AI lab has been validated by a decentralized network of contributors” — Kled (Nitrility, Inc.), <https://www.kled.ai/kled-tokenomics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c084** Kled's audit portal says every dataset available through Kled is backed by an audit trail of contributor consent, policy acceptance, provenance and compensation status.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “backed by an audit trail of contributor consent, policy acceptance, provenance signals, and compensation status” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c085** Kled says each upload creates an anonymized Trace receipt holding the content hash ID, signed consent forms, payment record and timestamps.  
  _architecture · vendor_stated · as of 2026-06-25 (page_dated) · scope: Kled_
  - “The content hash ID, signed consent forms, full payment record, and end-to-end timestamps.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-partners-with-the-data-foundation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c089** Kled says EXIF, GPS, IP and device-fingerprint values stay in its own systems and Trace stores only existence flags.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Trace stores existence flags (present or absent), never the values.” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c090** Kled's audit portal lists an independent Trail of Bits security and privacy audit dated May 2026 and SOC 2 Type II as targeted for Q4 2026.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Trail of Bits Independent security & privacy audit of Kled Last Assessed May 2026 Audited” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c109** The contributor warrants they hold all rights, licences, consents and permissions needed to submit the content and let Kled use it.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “you have, or have obtained, all rights, licenses, consents, permissions, power and/or authority necessary to submit and use” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c110** The contributor warrants Submitted Content contains no personal data relating to individuals under 18.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “does not include Personal Data (as defined in our Privacy Policy) that (a) relates to individuals under the age of 18” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c111** For other individuals' personal data in Submitted Content, the contributor warrants they have given or obtained all required notices and consents.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “unless you have provided and/or obtained all required notices and/or consents to provide such Personal Data” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Kled's own Terms.
  - verifier (scope): **scope_ok**
- **c112** The contributor warrants Submitted Content contains no output from AI models or machine-learning systems.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “the Submitted Content does not contain any output from artificial intelligence models or machine learning systems” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** The contributor must defend, indemnify and hold harmless Kled and Kled's current or prospective customers or partners.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “defend, indemnify and hold the Company Entities and the Company’s current or prospective customers or partners” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c115** The Terms cap the total liability of Kled and its current and prospective customers and partners to a user at $100.  
  _number · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_ · **100 USD** (cap on total liability of Kled and its customers and partners to a user (greater of $100 or other sum stated); aggregate)
  - “SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100.00)” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Kled's own Terms.
  - verifier (scope): **scope_ok** — The clause reads 'SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100.00).' and gives no second amount, so the cap is effectively $100. The value basis's 'or other sum stated' is inaccurate: no other sum is stated.
- **c116** Kled disclaims all warranties, including merchantability, fitness for purpose and non-infringement.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “WHETHER EXPRESS OR IMPLIED, OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-INFRINGEMENT” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c131** By sharing content with other individuals' personal information, the contributor confirms they obtained those individuals' prior permission.  
  _terms · legal_text · as of 2026-09-14 (page_dated) · scope: Kled_
  - “you confirm that you have obtained their prior permission in relation to such sharing” — Kled (Nitrility, Inc.), <https://www.kled.ai/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### transaction

- **c038** The catalogue shows no prices; the only purchase action on it is a 'Contact Sales' button, which opens an email to team@kled.ai.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled dataset catalogue / enterprise portal_
  - “Contact Sales” — Kled (Nitrility, Inc.), <https://www.kled.ai/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A button on Kled's own catalogue.
  - verifier (scope): **scope_ok** — The live catalogue also has a 'Request Dataset' button, which goes to the same mailto:team@kled.ai. No prices are shown, so the substance holds. Stating an absence from a button quote is acceptable under rule 13.
- **c041** Kled's help centre says AI buyers purchase access to datasets that include contributors' content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Buyers purchase access to datasets that include your content.” — Kled Help Center, <https://help.kled.ai/article/what-is-kled-and-how-does-it-work> · docs · retrieved 2026-10-01 · quote check: exact
- **c053** Kled says voice data from its contributors will be packaged and sold to voice model teams both directly and through distribution partners.  
  _offer · vendor_stated · as of 2026-04-30 (page_dated) · scope: Kled_
  - “packaged and sold to leading voice foundation model teams, both directly and through our distribution partners” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-expands-into-voice-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c135** The white paper lists, as features under development, automated licensing workflows letting developers obtain dataset-specific training rights.  
  _architecture · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_
  - “automated licensing workflows enabling developers to obtain dataset-specific training rights” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c075** Kled says its sales margin on validated data lets it run its UFDP captcha service free of charge.  
  _terms · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_
  - “Kled’s sales margin on this data lets us run this captcha service completely for free” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-launches-ufdp-%E2%80%94-paid-captcha-for-data-validation> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A statement about Kled's own economics, made on its own sites (blog / ufdp.ai).
  - verifier (scope): **scope_ok**
- **c134** Kled's white paper says revenues come from licensing and transaction fees.  
  _offer · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_
  - “Revenues are generated through licensing and transaction fees.” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact

### licence

- **c095** Under the current Terms, Kled may distribute and commercialise Submitted Content to business customers ('Data Customers') seeking rights in it.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “commercialize your Submitted Content to our business customers that seek to acquire rights in the Submitted Content” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Kled's own Terms. The App Store description says only 'Your accepted contributions are licensed for AI training with your consent.'
  - verifier (scope): **scope_ok** — The live page reads 'We may distribution and commercialize your Submitted Content' (sic).
- **c096** The Terms give training or fine-tuning AI models as an example of Data Customers' business purposes.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “for their own business purposes, such as to train or fine-tune their AI models” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c098** Kled does not claim ownership of Submitted Content; the contributor grants Kled a licence instead.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “the Company does not claim any ownership in your Submitted Content” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c099** The contributor's licence covers any intellectual property or publicity rights they have in the Submitted Content.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “under any rights you may have in your Submitted Content (including any intellectual property or publicity rights)” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c100** The contributor licenses Kled to annotate, modify, package and otherwise exploit Submitted Content for any and all purposes.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “annotate, modify, package and otherwise exploit your Submitted Content for any and all purposes” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c101** The licence expressly lets Kled make Submitted Content available to Data Customers and to its service providers and partners.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “to distribute and make your Submitted Content available to Data Customers and our service providers and partners” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c102** The contributor's licence to Kled is transferable, sublicensable through multiple tiers, worldwide, perpetual and irrevocable.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “rights and licenses are transferable, fully sub-licensable (through multiple tiers), worldwide, perpetual and irrevocable” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c103** The licence is exclusive to Kled for any use or modification of Submitted Content related to AI and machine-learning development ('Exclusive Use').  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “such license will be exclusive to us in connection with any uses or modifications of your Submitted Content” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c104** The Exclusive Use covers developing, training, testing, improving and deploying third-party AI and machine-learning models.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “developing, training, testing, improving and deploying third-party AI and machine learning models” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c105** The contributor must not allow anyone else to use their Submitted Content for the Exclusive Use, so cannot license it to another AI buyer.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “you will not allow or authorize any other person or entity to use your Submitted Content for the Exclusive Use” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c122** The May 1, 2026 Terms told contributors they were irrevocably selling Submitted Content to Kled to be used for any purpose.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “YOU UNDERSTAND AND AGREE THAT YOU ARE IRREVOCABLY SELLING SUBMITTED CONTENT TO COMPANY TO BE USED FOR ANY PURPOSE” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c123** The May 1, 2026 Terms granted Kled and its customers and partners a perpetual, irrevocable, non-exclusive, royalty-free, sublicensable licence.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “a world-wide, perpetual, irrevocable, non-exclusive, royalty-free, assignable, sublicensable, transferable rights” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c124** Under the May 1, 2026 Terms the contributor granted rights directly to Kled's customers and prospective customers as well as to Kled.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “irrevocably grant to Company, our affiliates, and our customers, partners and/or prospective customers and partners” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c125** The May 1, 2026 Terms also granted rights to use the contributor's name, image, voice and likeness for any AI training purpose.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “rights to use for any AI training purpose without limitation: (1) any element of your name, image, signature, voice” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c126** The May 1, 2026 Terms bound contributors never to sue Kled or its customers over their use of Submitted Content.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “refrain and forebear forever (both during and after termination of these Terms) from commencing, instituting or prosecuting” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c130** Kled's privacy policy says it licenses, sells or otherwise provides Submitted Content to third parties for their own purposes, including AI training.  
  _terms · legal_text · as of 2026-09-14 (page_dated) · scope: Kled_
  - “We license, sell, and/or otherwise provide this content to third parties for their own purposes” — Kled (Nitrility, Inc.), <https://www.kled.ai/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c042** Kled says it stores and prepares contributors' content for inclusion in AI training datasets.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Kled securely stores and prepares your content for inclusion in AI training datasets.” — Kled Help Center, <https://help.kled.ai/article/what-is-kled-and-how-does-it-work> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** Kled's audit portal says contributor data is held in AWS eu-west-1 for EU contributors and us-east-1 for North America.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “AWS eu-west-1 for EU contributors, us-east-1 for North America.” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** In November 2025 Kled said it was committing a large portion of a $3 million raise to in-house servers able to host petabytes of data.  
  _architecture · vendor_stated · as of 2025-11-08 (page_dated) · scope: Kled_
  - “building our own in house servers capable of hosting petabytes of data” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-builds-petabyte-scale-infrastructure-for-global-expansion> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** Kled says validated data from its pipeline is sent directly to foundation model and robotics companies.  
  _architecture · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_
  - “once validated is sent directly to the leading foundation models and robotics companies” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-launches-ufdp-%E2%80%94-paid-captcha-for-data-validation> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A description of Kled's own delivery pipeline; no buyer is named.
  - verifier (scope): **scope_ok** — The UFDP post (body date 04.23.26) says validated captcha data 'is sent directly to the leading foundation models and robotics companies'.

### vetting

- **c061** Some location-gated tasks require contributors to capture content on the spot with the camera, not from the photo library.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “require you to capture content on the spot (camera only — no library selection)” — Kled Help Center, <https://help.kled.ai/article/location-gated-tasks> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** Before cashing out, contributors must complete a one-time KYC check with a government ID and selfie.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “One-time verification with government ID and selfie” — Kled Help Center, <https://help.kled.ai/article/minimum-cashout-threshold-and-requirements> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** Kled blocks the same file from being uploaded twice, checking locally and on the server.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Kled automatically prevents the same file from being uploaded twice.” — Kled Help Center, <https://help.kled.ai/article/duplicate-detection> · docs · retrieved 2026-10-01 · quote check: exact
- **c077** Kled bans accounts that upload content they do not own; all content must be the uploader's own.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “All content must be yours.” — Kled Help Center, <https://help.kled.ai/article/account-bans-and-suspensions> · docs · retrieved 2026-10-01 · quote check: exact
- **c079** Kled says ML systems anonymize and remove sensitive information from uploads before labelling.  
  _architecture · vendor_stated · as of 2026-01-14 (page_dated) · scope: Kled_
  - “ML systems are built to anonymize and remove sensitive information from uploads.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled%E2%80%99s-opt-in-human-data-network-at-scale> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c080** Kled says its Kled-FD 0.1 pipeline detects AI-generated content, near duplicates, stolen media, screenshots, minors and fraud rings.  
  _architecture · vendor_stated · as of 2026-06-01 (page_dated) · scope: Kled_
  - “detecting AI generated content, near duplicates, stolen and plagiarized media, screenshots” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-launches-fd-0.1> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c081** Kled says its ML systems automatically reject task videos that fail a task's specification.  
  _architecture · vendor_stated · as of 2026-01-26 (page_dated) · scope: Kled_
  - “any video that fails that spec will be automatically rejected” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-v3-expands-rewards-and-contributor-tools> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c082** Kled's UFDP validation sends each question to at least 50 people and takes the consensus answer.  
  _architecture · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_
  - “Each question goes to a cluster of at minimum 50 people simultaneously.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-launches-ufdp-%E2%80%94-paid-captcha-for-data-validation> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c097** The Terms say certain Submitted Content may carry specific criteria for it to be acceptable.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “Certain Submitted Content may include specific criteria for Submitted Content to be acceptable.” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c107** Kled may screen, edit, delete, restrict, remove or reject any Submitted Content at any time.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “We reserve the right to screen, edit, delete, restrict, remove or reject any Submitted Content at any time” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c006** Kled says contributors uploading financial documents for the $8M request can expect up to $50-$150 per form.  
  _number · vendor_stated · as of 2026-06-27 (page_dated) · scope: Kled_ · **150 USD per form (upper end of $50-$150 range)** (paid by Kled to the contributor per uploaded financial document; gross, not stated; per item)
  - “Expected pay is up to $50-$150 per form.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-lands-8m-financial-data-request> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A contributor pay offer stated only in Kled's own blog post ('Expected pay is up to $50-$150 per form'); the App Store description gives no rates.
  - verifier (scope): **scope_ok**
- **c010** On 26 June 2026 Kled said it had bought back over $1 million of its $KLED token, which it intends as the rewards currency for its data marketplace.  
  _event · vendor_stated · as of 2026-06-26 (page_dated) · scope: Kled_
  - “will ultimately become a fully viable reward currency for our data marketplace” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-begins-1m-token-buyback> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c021** In January 2026 Kled said over $3 million was sitting in users' wallets (vendor-stated).  
  _number · vendor_stated · as of 2026-01-05 (page_dated) · scope: Kled_ · **3000000 USD** (unpaid contributor balances held in Kled wallets; as of 2026-01-05)
  - “Over $3 million is actively sitting in the wallets of our users.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-hits-3m-in-active-user-payouts> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Kled's tokenomics page links a Solscan wallet, but on-chain balances cannot confirm off-chain user wallet balances as stated. No search available.
  - verifier (scope): **scope_ok**
- **c022** Kled said that three days after its V2 launch in December 2025 over $95,000 had been paid out to contributors in total (vendor-stated).  
  _number · vendor_stated · as of 2025-12-17 (page_dated) · scope: Kled_ · **95000 USD** (cumulative contributor payouts to 2025-12-17; cumulative)
  - “Over $95,000+ have been paid out in total.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-v2-pays-out-95k-uploads-surge-400%C3%97> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source for payout totals. No search available.
  - verifier (scope): **scope_ok** — The page (body date 12.17.25) also says 'It's been 3 days since V2 launched', which supports the timing.
- **c023** In December 2025 Kled said payouts only processed once a contributor had at least 100 pending items worth at least $1.  
  _number · vendor_stated · as of 2025-12-17 (page_dated) · scope: Kled_ · **100 pending items** (minimum pending uploads before a payout batch processes (plus at least $1 value); per payout)
  - “payouts only process if you have at least 100 pending items and the value is at least $1” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-v2-pays-out-95k-uploads-surge-400%C3%97> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** In March 2026 Kled said its top earner made $7,400 per month and users uploaded 3-4.5 million files per day (vendor-stated).  
  _number · vendor_stated · as of 2026-03-10 (page_dated) · scope: Kled_ · **7400 USD per month** (earnings of the single top contributor; vendor-stated; per month)
  - “With our top earner making $7,400 per month.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-raises-5.5m-seed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source. No search available.
  - verifier (scope): **quote_incomplete** — Quote covers only the top earner. The upload rate needs 'Our users are now uploading anywhere from 3 - 4.5 million files per day.' The body date 03.10.26 matches.
- **c059** Kled says Special Task participants receive weighted payouts based on the value of their submissions.  
  _terms · vendor_stated · as of 2025-11-12 (page_dated) · scope: Kled_
  - “participants will receive weighted payouts based on the value of their submissions” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-introduces-special-tasks-in-v2> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c064** Kled's help centre says there is no flat per-file rate for contributor earnings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “There is no flat per-file rate.” — Kled Help Center, <https://help.kled.ai/article/how-earnings-are-calculated> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** Kled says contributor payout rates are not fixed and vary with market demand, dataset composition and how much similar content exists.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Payout rates are not fixed.” — Kled Help Center, <https://help.kled.ai/article/how-earnings-are-calculated> · docs · retrieved 2026-10-01 · quote check: exact
- **c066** Kled says content matching current buyer demand earns more.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “AI training relevance — Content matching current buyer demand earns more” — Kled Help Center, <https://help.kled.ai/article/how-earnings-are-calculated> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** Kled credits earnings in batches, which can take up to 7 business days to process.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Batch processing timelines vary and can take up to 7 business days.” — Kled Help Center, <https://help.kled.ai/article/how-earnings-are-calculated> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** Contributors can cash out via Venmo, PayPal or Solana once their balance reaches $25.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_ · **25 USD** (minimum contributor balance before cash-out; per cash-out)
  - “Withdraw your earnings via Venmo, PayPal, or Solana cryptocurrency once you reach the $25 minimum.” — Kled Help Center, <https://help.kled.ai/article/what-is-kled-and-how-does-it-work> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The App Store listing (a developer-written description on Apple's store, seller Nitrility Inc.) also says 'Cash out to Venmo, PayPal, or Solana Wallet (Crypto)'. It restates the vendor's own text, so it is relayed rather than independent.
    - “Minimum $25 balance to cash out” — Apple App Store, <https://apps.apple.com/app/kled/id6752585718> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Help-centre quote supports it, and the App Store listing says the same.
- **c070** Kled pays contributors referral commissions based on the activity of users who sign up with their invite code.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “When someone signs up using your code, you earn referral commissions based on their activity.” — Kled Help Center, <https://help.kled.ai/article/affiliate-program-and-referrals> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** In April 2026 Kled advertised US tasks such as uploading 500 selfies for $1,000.  
  _number · vendor_stated · as of 2026-04-28 (page_dated) · scope: Kled_ · **1000 USD per 500 selfies** (reward paid by Kled to a qualified, KYC'd US contributor for the task; per task)
  - “upload 500 selfies for $1,000” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-expands-u.s.-task-rewards> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An advertised task rate exists only in Kled's own posts and app.
  - verifier (scope): **scope_ok** — The page limits it to 'qualified, KYC'd users' in the U.S.; the value basis reflects that.
- **c072** In April 2026 Kled advertised $5 for a short video of the contributor taking out the trash and $150 for uploading a tax return.  
  _number · vendor_stated · as of 2026-04-28 (page_dated) · scope: Kled_ · **5 USD per video** (reward paid by Kled to the contributor for one task video; per item)
  - “record a quick video of yourself taking out the trash for $5, or upload your tax return for $150” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-expands-u.s.-task-rewards> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c073** Kled says it is receiving tasks from foundation model companies paying $1,000+ per single completion.  
  _number · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_ · **1000 USD per task completion (lower bound)** (reward per completion of the highest-value tasks; vendor-stated; per item)
  - “actively receiving tasks paying $1,000+ per single completion” — Kled (Nitrility, Inc.), <https://www.kled.ai/kled-tokenomics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — A claim about what unnamed foundation-model buyers pay; no counterparty is named. No search available.
  - verifier (scope): **quote_incomplete** — The source is named only in words the quote leaves out: 'We have begun working with the major foundation models and are actively receiving tasks paying $1,000+ per single completion'.
- **c074** Kled's blog, quoting a Guardian article, says a Cape Town contributor earned $14 for an 'Urban Navigation' task video.  
  _number · vendor_stated · as of 2026-03-21 (page_dated) · scope: Kled_ · **14 USD per video** (one contributor's reward for one task video, as relayed by Kled; per item)
  - “The video earned him $14, about 10 times the country’s minimum wage” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-featured-in-the-guardian-on-ai-data-work> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The Guardian article should confirm this, but WebFetch cannot fetch theguardian.com and content.guardianapis.com is also refused. Kled's post (dated 21 Mar 2026 in its body) links only to the Guardian's South Africa section, not to the article, and guessing the article URL is not allowed. No search available.
  - verifier (scope): **quote_incomplete** — Quote does not show Cape Town or 'Urban Navigation'. The page's words are 'The video was for an "Urban Navigation" task Louw found on Kled AI' and 'a 27-year-old based in Cape Town'.
- **c078** Balances in accounts suspended for violations may be forfeited, and bans have no appeal.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Remaining balances in suspended accounts may be forfeited.” — Kled Help Center, <https://help.kled.ai/article/account-bans-and-suspensions> · docs · retrieved 2026-10-01 · quote check: exact
- **c106** If the contributor's consents or rights are revoked or invalidated, the contributor must immediately refund any compensation received for that content.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “you are required to immediately refund to Company any compensation you previously received” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c108** Kled may decide in its sole discretion that Submitted Content is not eligible to earn payments or rewards.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “determine that Submitted Content are not eligible to accrue payments or rewards, in our sole discretion” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c113** Contributors may earn tokens such as SOL, fiat currency or other rewards, as Kled determines in its sole discretion, for accepted Submitted Content.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “fiat currency or other rewards (as determined by us in our sole discretion) for your accepted Submitted Content” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Kled's own Terms.
  - verifier (scope): **scope_ok**
- **c128** The May 1, 2026 Terms authorised Kled to charge the contributor's wallet automatically to recover amounts owed if consents were revoked.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “authorize Company to automatically charge your virtual currency wallet or other payment instrument for such amounts” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c129** Under the May 1, 2026 Terms, a deleted account forfeited pending cash-outs, balances and content sales to Kled.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “any pending cash outs, payment balances, and content sales will immediately be forfeited and assigned to Company” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c092** Kled's audit portal says a contributor's consent revocation removes the asset from active datasets while the receipt stays on Trace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Revocation produces a new lifecycle event on each affected receipt and removes the asset from active datasets.” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c093** Kled's audit portal describes a contributor-initiated right to deletion that removes the asset from active datasets but preserves the audit record.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_
  - “Contributor-initiated. Asset removed from active datasets; audit record preserved.” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: exact
- **c117** When an account is deleted, Kled may, but is not obliged to, delete the user's Submitted Content.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “the Company may, but is not obligated to, delete any Submitted Content” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c120** Copyright owners can send DMCA notices to Kled's copyright agent to have infringing material on the Services removed.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “you may submit a notification to our copyright agent in accordance with 17 USC 512(c)” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c132** When a contributor deletes their account, their uploaded content is retained as per the Terms of Service.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Your uploaded content will be retained as per the Terms of Service” — Kled Help Center, <https://help.kled.ai/article/how-to-delete-your-account> · docs · retrieved 2026-10-01 · quote check: exact
- **c136** The white paper also lists planned tools to record licence terms, track downloads and usage, and remit fees to data owners.  
  _architecture · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_
  - “track downloads/usage events, and facilitate fee remittance to data owners” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c017** In December 2025 Kled said it entered an agreement scoped at up to $2.2 million to roll out 80+ egocentric special tasks.  
  _outcome · vendor_stated · as of 2025-12-15 (page_dated) · scope: Kled_
  - “an agreement scoped at up to $2.2 million to roll out 80+ egocentric special tasks for user data” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-expands-special-tasks-with-2.2m-agreement> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Counterparty unnamed. No search available.
  - verifier (scope): **scope_ok**
- **c052** Kled said its sales teams structure data packs from both user uploads and enterprise clients' content for AI labs and buyers.  
  _offer · vendor_stated · as of 2025-11-08 (page_dated) · scope: Kled_
  - “Our sales teams are actively structuring organized datapacks from both users and enterprise clients” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-builds-petabyte-scale-infrastructure-for-global-expansion> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Kled Special Tasks let contributors complete domain-specific upload tasks set directly by enterprise buyers, which can be region-locked and person-specific.  
  _offer · vendor_stated · as of 2025-11-12 (page_dated) · scope: Kled_
  - “view and complete domain specific upload tasks directly from enterprise buyers” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-introduces-special-tasks-in-v2> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Kled says Special Tasks also let it identify valuable content types itself and issue calls for specific datasets.  
  _offer · vendor_stated · as of 2025-11-12 (page_dated) · scope: Kled_
  - “internally identify valuable content types, issue calls for specific datasets” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-introduces-special-tasks-in-v2> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** Kled says it packages Special Task collections into data packs that its sales team pitches to AI labs and enterprise clients.  
  _offer · vendor_stated · as of 2025-11-12 (page_dated) · scope: Kled_
  - “package these datasets into specialized data packs that our sales team will use to pitch directly to AI labs” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-introduces-special-tasks-in-v2> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** Some Special Tasks are created by third-party organisations that issue their own access codes.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled contributor app_
  - “Kled support cannot provide access codes for third-party tasks.” — Kled Help Center, <https://help.kled.ai/article/education-and-access-code-verification> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Kled says partner-run labelling and evaluation jobs routed through its app are owned and managed by the partners, with Kled routing people to the work.  
  _offer · vendor_stated · as of 2026-01-26 (page_dated) · scope: Kled_
  - “These jobs are owned and managed by our partners. Kled’s role is to route the right people to the right work.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-v3-expands-rewards-and-contributor-tools> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c002** On 18 July 2026 Kled announced on its own blog that it had surpassed 500,000 users (vendor-stated).  
  _event · vendor_stated · as of 2026-07-18 (page_dated) · scope: Kled_
  - “Kled has officially surpassed 500,000 users. Onward.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-hits-500-000-users> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Only relays: the developer-written App Store description repeats the figure (as 'contributors', not 'users'). The DATA Foundation homepage (datafdn.org, Kled's partner and investor) shows a live contributor counter of '372.5K', lower than 500,000, so the 500K figure appears to count users/sign-ups rather than contributors with receipts. On 'newest dated event': datafdn.org dates its Kled partnership post 25 Jun 2026 and a board decision extending the $DATA token lockup 4 Aug 2026; nothing newer about Kled itself was found by navigation. No search available.
    - “Join more than 500,000 contributors helping train the next generation of AI.” — Apple App Store, <https://apps.apple.com/app/kled/id6752585718> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote supports the milestone. The 18 July 2026 date comes from the blog index (07.18.26), not from the quote. Each post page also carries a site-wide CMS stamp 'Sep 14, 2026, 8:20 PM UTC' that is not the publication date.
- **c003** On 25 June 2026 Kled said The DATA Foundation invested $3 million, bringing Kled's total funding to $14 million (vendor-stated).  
  _event · vendor_stated · as of 2026-06-25 (page_dated) · scope: Kled_
  - “The Data Foundation has invested $3 million into Kled, bringing our total funding to now $14 million” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/the-data-foundation-invests-3m-in-kled> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c007** On 10 March 2026 Kled announced a $5.5M seed round and said total financing had reached $10 million (vendor-stated).  
  _event · vendor_stated · as of 2026-03-10 (page_dated) · scope: Kled_
  - “This brings our total financing to $10 million.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-raises-5.5m-seed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** Kled's tokenomics page says Nitrility's most recent SAFE investment came in at a $280 million valuation cap (vendor-stated).  
  _number · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_ · **280000000 USD** (valuation cap on the most recent SAFE investment in Nitrility Inc.; vendor-stated; as of 2026-04-23)
  - “Our most recent check came in at a $280 million valuation cap” — Kled (Nitrility, Inc.), <https://www.kled.ai/kled-tokenomics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No Form D or other filing for Nitrility on SEC EDGAR (company search: 'No matching companies'; full-text search: 0 hits). Investor sites tried: aglaeventures.com/companies (Kled not listed), parable.vc (parked domain), coxexponential.com (connection refused), street.global (Street FDN, named on the tokenomics page as partner: domain does not resolve). No search available.
  - verifier (scope): **scope_ok** — The tokenomics page carries the body date 04.23.26, which supports the April 2026 as_of.
- **c009** Kled's MiCA crypto-asset white paper (notified 2025-12-28) states Nitrility is profitable, carries no debt and had raised about USD 3 million through SAFE notes.  
  _number · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_ · **3000000 USD** (equity raised through SAFE notes to the white paper date; issuer's own statement; cumulative)
  - “It is currently profitable, carries no debt, and has raised approximately USD 3 million through SAFE notes.” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — ESMA's interim MiCA register (other crypto-asset white papers, CSV, downloaded 2026-10-01) confirms a white paper by Nitrility Inc. notified via the Central Bank of Ireland, but its date field reads 22/12/2025, not 2025-12-28, and its registered link www.kled.com/whitepaper returns 404 (the paper lives on kled.ai). The financial statements (profitable, no debt, about USD 3M via SAFEs) exist only in the issuer's own paper, and no independent source for them was found. Kled's own blog separately announces a $5.5M seed bringing 'total financing to $10 million' (its displayed date is a CMS re-date). No search available.
    - “Central Bank of Ireland (CBI),IE,Nitrility Inc.,,US,,,,,,www.kled.com/whitepaper,,22/12/2025” — European Securities and Markets Authority (interim MiCA register), <https://www.esma.europa.eu/sites/default/files/2024-12/OTHER.csv> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The white paper states notification and publication date 2025-12-28, but ESMA's register records 22/12/2025 for the same Nitrility Inc. entry (see the blind note). source_class 'filing' is generous for an issuer-hosted copy on kled.ai.
- **c028** Kled's white paper set a plan to scale the marketplace toward 5-10 million users by Q3 2026.  
  _number · vendor_stated · as of 2025-12-28 (page_dated) · scope: Kled_ · **5000000 users (lower bound of 5-10 million target)** (roadmap target, not an outcome; by Q3 2026)
  - “scale its marketplace toward 5–10 million users by Q3 2026” — Kled (Nitrility, Inc.), <https://www.kled.ai/whitepaper> · filing · retrieved 2026-10-01 · quote check: exact
- **c087** Kled's audit portal shows Terms of Service version 2026-05-01 as 'current' on 100% of consent receipts.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Kled_ · **100 percent of receipts** (share of 208,231,888 receipts that record ToS v2026-05-01; as of 2026-10-01)
  - “Terms of service v2026-05-01 current 208,231,888 · 100%” — Kled audit portal on Trace (The DATA Foundation), <https://trace.datafdn.org/audit/kled> · docs · retrieved 2026-10-01 · quote check: missing 0.56
  - verifier (blind): **vendor_only** — Same Kled audit portal on trace.datafdn.org, not independent. Live check on 2026-10-01: 'v2026-05-01 (current): 208,245,259 receipts (100%)'. The portal's total receipts are 254,161,064, so the 100% is a share of receipts that record a ToS version (about 208M), not of all receipts.
  - verifier (scope): **scope_ok** — The quote embeds a live counter, '208,231,888'; on 2026-10-01 the portal showed 208,245,259, so the quote will fail string-matching as the count moves. The portal's total receipts are 254,161,064, so '100%' is of receipts recording a ToS version. The profile already records the conflict with the 21 July 2026 Terms.
- **c094** Kled's current Terms of Service are issued by Nitrility, Inc. and were last revised on July 21, 2026.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “Nitrility, Inc. – Terms of Service Last Revised on July 21, 2026.” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c119** For material changes to the Terms, Kled commits only to reasonable efforts to notify users.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “If we make changes that are material, we will use reasonable efforts to attempt to notify you” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** The earlier Kled Terms of Service version is dated May 1, 2026.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “Kled.ai Last Updated On: May 1, 2026” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact

### demand

- **c004** On 26 June 2026 Kled said it had signed a $12 million non-exclusive data deal running over two years, which it says made the marketplace profitable (vendor-stated).  
  _outcome · vendor_stated · as of 2026-06-26 (page_dated) · scope: Kled_
  - “signed a $12 million non-exclusive data deal over the next 2 years making the marketplace officially profitable” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-signs-12m-enterprise-data-deal> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The buyer is unnamed, so no counterparty site could be checked. SEC EDGAR company and full-text search return nothing for Nitrility; CourtListener returns only unrelated fuzzy matches. Kled's blog post links to no press. No search available.
  - verifier (scope): **scope_ok**
- **c005** On 27 June 2026 Kled said it had received an $8 million request for anonymized financial data such as credit card reports and tax returns (vendor-stated).  
  _outcome · vendor_stated · as of 2026-06-27 (page_dated) · scope: Kled_
  - “We've received an $8 million request for anonymized financial data.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-lands-8m-financial-data-request> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Requester unnamed; Kled's post links to no press or counterparty. No search available.
  - verifier (scope): **quote_incomplete** — Quote shows the $8M request but not the document types; the page's words 'Credit card reports, tax returns, w9 forms and other personal financial documents' would.
- **c018** In October 2025 Kled said it received a $1 million letter of intent from Superpower for healthcare data, which it would license to companies like Superpower Health.  
  _outcome · vendor_stated · as of 2025-10-02 (page_dated) · scope: Kled_
  - “Kled has received a $1 million LOI from Superpower” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-secures-1m-loi-to-power-healthcare-ai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — superpower.com (linked from Kled's post) does not mention Kled or any data licensing. Its homepage says of member health data 'We never sell it', which concerns Superpower's own member data and does not contradict an LOI to buy data. Superpower has no press section in its footer. No search available.
  - verifier (scope): **quote_incomplete** — Quote shows only the LOI. The licensing element needs the page's words 'That data is then licensed to companies like Superpower Health'. The body date is 10.02.25; the page also shows the CMS stamp Sep 14, 2026.
- **c019** In October 2025 Kled said an image-generation AI lab had set it a KPI to scale to 100M uploaded assets to be sold to that lab.  
  _outcome · vendor_stated · as of 2025-10-15 (page_dated) · scope: Kled_
  - “scaling to 100M uploaded assets, which will be sold to their team” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-targets-100m-assets-after-major-kpi> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The lab is unnamed. No search available.
  - verifier (scope): **quote_incomplete** — 'Image-generation AI lab' is not in the quote; the page says 'first major KPI from one of the top image generation AI labs valued over $10B'.
- **c027** Kled says it has a $35M+ data purchase pipeline with enterprise relationships across leading AI labs (vendor-stated).  
  _number · vendor_stated · as of 2026-04-23 (page_dated) · scope: Kled_ · **35000000 USD** (stated pipeline of data purchases, not booked revenue; as of 2026-04-23)
  - “Kled has a $35M+ data purchase pipeline” — Kled (Nitrility, Inc.), <https://www.kled.ai/kled-tokenomics> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source. No search available.
  - verifier (scope): **scope_ok** — The page's full phrase is '$35M+ data purchase pipeline and enterprise relationships across the world's leading AI labs'. It is a pipeline, not bookings, as the value basis says.
- **c063** In January 2026 Kled said it had received inbound data requests from several decacorn AI labs and enterprises.  
  _outcome · vendor_stated · as of 2026-01-26 (page_dated) · scope: Kled_
  - “we’ve received inbound data requests from several decacorn AI labs and enterprises” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-v3-expands-rewards-and-contributor-tools> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The labs are unnamed. No search available.
  - verifier (scope): **scope_ok** — Body date 01.26.26; the page adds 'In the last seven days'.
- **c086** Kled says labs want a clean audit record of receipts, consent forms and proof of payment before buying a dataset.  
  _offer · vendor_stated · as of 2026-06-25 (page_dated) · scope: Kled_
  - “A clean audit record: end-to-end receipts, consent forms, and proof of payment.” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-partners-with-the-data-foundation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c091** In May 2026 Kled said it was partnering with Vanta and Workstreet to build SOC 2 Type II, ISO 27001, HIPAA and GDPR compliance infrastructure.  
  _event · vendor_stated · as of 2026-05-08 (page_dated) · scope: Kled_
  - “Kled is partnering with Vanta and Workstreet to build automated SOC 2 Type II, ISO 27001, HIPAA, and GDPR compliance” — Kled (Nitrility, Inc.), <https://www.kled.ai/blog/kled-expands-enterprise-compliance-infrastructure> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c118** Kled's partners may use personal information disclosed with Submitted Content for their own purposes under their own terms.  
  _terms · legal_text · as of 2026-07-21 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “Our partners may use such information for their own purposes, in accordance with their own terms and policies” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c127** The May 1, 2026 Terms gave consent for Kled's customers and partners to use and process personal data in Submitted Content for any purpose.  
  _terms · legal_text · as of 2026-05-01 (page_dated) · scope: Kled contributor app / data platform (Terms of Service)_
  - “partners or prospective customers and/or partners to use and process such Personal Data for any purpose” — Kled (Nitrility, Inc.), <https://www.kled.ai/terms-of-service/2026-05-01> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** ESMA's interim MiCA register lists a crypto-asset white paper from Nitrility Inc. (home member state Ireland, competent authority Central Bank of Ireland) with date 22/12/2025, linking to www.kled.com/whitepaper, a URL that returned 404 on 2026-10-01.  
  _event · government · as of 2025-12-22 (page_dated) · scope: KLED token white paper, EU_
  - “Central Bank of Ireland (CBI),IE,Nitrility Inc.,,US,,,,,,www.kled.com/whitepaper,,22/12/2025” — European Securities and Markets Authority (interim MiCA register), <https://www.esma.europa.eu/sites/default/files/2024-12/OTHER.csv> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v002** On 25 June 2026 The DATA Foundation, whose Trace network hosts Kled's audit portal, said Kled's founder and CEO Avi Patel was joining the Foundation as Chief Data Officer, so the audit host is not independent of Kled.  
  _event · vendor_stated · as of 2026-06-25 (page_dated) · scope: Kled audit portal on Trace_
  - “Avi Patel, Kled's founder and CEO, is joining the Foundation as Chief Data Officer.” — The DATA Foundation, <https://datafdn.org/blog/were-becoming-the-data-foundation> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://www.kled.ai/datasets>, <https://www.kled.ai/whitepaper>, <https://www.kled.ai/terms-of-service>, <https://enterprise.kled.ai/login>
- `matrix.licence_model` — gated; tried <https://www.kled.ai/terms-of-service>, <https://www.kled.ai/datasets>, <https://enterprise.kled.ai/request-access>, <https://enterprise.kled.ai/datasets>, <https://trace.datafdn.org/audit/kled>
- `matrix.exclusivity_offered` — not_published; tried <https://www.kled.ai/datasets>, <https://www.kled.ai/blog/kled-signs-12m-enterprise-data-deal>
- `matrix.buyer_vetting` — js_empty; tried <https://enterprise.kled.ai/request-access>, <https://enterprise.kled.ai/login>, <https://trust.kled.ai/>
- `matrix.versioning` — not_published; tried <https://www.kled.ai/datasets>, <https://trace.datafdn.org/audit/kled>, <https://enterprise.kled.ai/datasets>
- `other.buyer_delivery_mechanics` — gated; tried <https://enterprise.kled.ai/datasets>, <https://enterprise.kled.ai/request-access>, <https://help.kled.ai/>
- `other.trust_center` — js_empty; tried <https://trust.kled.ai/>
- `other.independent_press` — blocked; tried <https://www.theguardian.com/world/southafrica>, <https://content.guardianapis.com/search?q=Kled&api-key=test>
- `other.filings_and_court_records` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Nitrility%22>, <https://www.sec.gov/cgi-bin/browse-edgar?company=nitrility&type=&dateb=&owner=include&count=40&action=getcompany>, <https://www.courtlistener.com/api/rest/v4/search/?q=Nitrility&type=r>
- `other.partner_catalogue_terms` — not_published; tried <https://www.kled.ai/blog/kled-secures-exclusive-rights-to-30-000-classic-titles>, <https://www.kled.ai/blog/kled-signs-exclusive-ai-deal-with-maryland-public-television>, <https://www.kled.ai/blog/kled-enterprise-v2-expands-with-growing-catalog>
- `other.property_owner_consent` — not_published; tried <https://www.kled.ai/terms-of-service>, <https://www.kled.ai/privacy-policy>

## Conflicts

- c095, c133: The live Terms (21 July 2026) make Kled the licensee and sublicensor to its Data Customers, so Kled is licensor of record. The December 2025 MiCA white paper calls the business a two-sided marketplace licensing between data owners and AI labs. The Terms prevail on mechanics. (live_primary_wins_terms)
- c103, c123: The current Terms (21 July 2026) make the contributor licence exclusive to Kled for AI use. The 1 May 2026 Terms granted a non-exclusive licence to Kled and its customers, so the current Terms apply. (live_primary_wins_terms)
- c094, c087: The Terms page says it was last revised on 21 July 2026, but Kled's Trace audit portal lists ToS v2026-05-01 as 'current' on 100% of 208M receipts. It is unclear which version bound uploads made after July 2026, or whether the exclusivity clause reached earlier uploads. (unresolved)
- c009, c007, c008, c003: Funding figures differ: about USD 3M in SAFEs (white paper, Dec 2025); $5.5M seed and $10M total (Mar 2026); 'upwards of $10 million' with a ~$7M seed (Apr 2026); $14M total after the DATA Foundation's $3M (June 2026). The newest figure ($14M total) is taken; all are vendor-stated. (newer_wins_status)
- c028, c002: The white paper planned 5-10 million users by Q3 2026, while Kled's own July 2026 post reports 500,000 users. This is recorded as a gap between plan and outcome, not resolved. (unresolved)

## Leads, not cited

- <https://www.theguardian.com/> — Guardian feature (March 2026, by Shubham Agarwal) on AI data gig work featuring Kled contributors in Cape Town; would be the first independent source on pay and practice. Exact URL not found without search.
- <https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica> — ESMA's MiCA white-paper register may hold Kled's notified white paper (notification date 2025-12-28, home member state IE) as a regulator-hosted copy.
- <https://www.kled.ai/consumer-health-data-privacy-policy> — Consumer health data privacy policy (not read); relevant to medical-record and radiology datasets.
- <https://www.kled.ai/terms-of-service-mobile> — Mobile ToS copy; appears identical to the 21 July 2026 Terms.
- <https://ufdp.ai> — Kled's paid-captcha validation network (UFDP); not fetched.
- <https://www.kled.ai/uncanny-valley> — Kled research write-up on fine-tuning with a 3.1K-image coreset; possible quality evidence.
