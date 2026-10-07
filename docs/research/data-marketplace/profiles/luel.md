# Luel

crowd_capture · deep · status: **active** · also known as Luel Inc., Luel Data, Luel Labs

> Rendered from `ledger/luel.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Marketplace / 'Off-the-shelf licensing' (self-serve API product: 'Luel Data')” and its bespoke side “'Custom collections' / 'collection engine'; listings badged 'Scoped to order'; form label 'Request custom dataset'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c036, c037, c113, c138 | Luel grants the buyer licence in its own name for contributor-captured, own and (draft) third-party supply alike; suppliers need not be named to buyers. |
| economics_model | mixed | c019, c020, c021, c039, c141 | Principal margin on contributor-captured and owned catalogue (contributors paid a fixed task rate, Luel sets the price); 85/15 revenue share for third-party suppliers under draft terms; paid custom collections. |
| who_pays_fee | seller | c039 | Applies to third-party listings only: Luel's 15% comes out of the order amount. On its own inventory there is no separate fee. |
| supply_models | own_collection, contributor_uploads, commissioned_nonexclusive, third_party_providers, partner_licensed | c023, c020, c024, c017, c022, c027, c021, c030, c031 | commissioned_nonexclusive rests on vendor statements that completed collections and deliveries feed the catalogue; the same source calls custom datasets 'exclusive', so how commissioned data is carved out is not public. third_party_providers: submissions open, but listing waits on unsigned Supplier Terms. partner_licensed: Music Library from one catalogue provider. The 16-year dermatology archive is 'exclusively owned' by Luel, origin unstated. |
| custody_model | copy_to_buyer | c071, c097, c096, c121, c045 | Luel copies supplier data from the supplier bucket, hosts it, and delivers via short-lived signed download URLs; buyers hold copies and must delete them on licence end. Delivery mechanics for contact-sales video listings are not published. |
| transaction_mode | both | c071, c074, c062, c070 | Self-serve prepaid-credit checkout (console or MCP agent) for audio SKUs; every video, sensor and image listing is contact-sales only. |
| public_prices | some | c074, c075 | Self-serve speech SKUs are $1.25/min in the docs; marketplace listing pages show no price. |
| licence_model | mixed | c113, c064, c036 | One standard clickwrap DLA for Luel Data; contact-sales listings negotiated (Music Library rights negotiated per buyer); supplier terms allow other written licence terms Luel sets per dataset. |
| exclusivity_offered | unknown |  | Luel Data licences are non-exclusive [c113]; custom builds are described as exclusive [c019]; no source says whether a listed dataset can be bought exclusively via sales. |
| public_listing | public_indexable | c054, c056 | Marketplace and dataset pages are public and in the sitemap; the self-serve API catalogue needs a signed-in buyer org. |
| buyer_vetting | account_only | c083, c086, c084, c087 | Entry 'Licensed' tier: DLA acceptance plus a country check, capped at $5,000 lifetime. 'Verified' tier above that adds operator review and restricted-party screening (business_verification). |
| sample_mechanics | sample_on_request | c063, c106, c107, c108 | Listing pages send sample clips on request; the API has a one-minute free sample grant but no SKU has one yet; separate sample sets sit on Hugging Face. |
| versioning | unknown |  | Licences attach to a dataset version and quantity, and Luel may withdraw a version; no source says whether a published version is immutable or what a past buyer gets on a new version. |
| human_subject_consent_docs | provided_to_buyer | c099, c135, c136, c126 | Weakly met. Each API delivery carries a signed consent projection and consent-reference hash, and marketing says consent evidence/records ship. The binding DLA only gives a knowledge-qualified promise, and no source shows signed release forms reaching the buyer. |
| contributor_pay_model | one_off | c141, c145, c147, c148 | Contributors are paid a posted per-minute, per-task or per-scene rate when a submission is approved; no share of later sales. |
| catalogue_plus_custom | both | c013, c014, c015, c061 |  |
| erasure_after_sale | contractual_deletion | c123, c121, c152, c124 | Buyers must delete withdrawn recordings within 30 days (models kept). Contributor-facing Terms say delivered copies cannot be retrieved. The DLA covers audio only. |
| quality_evidence | operator_verified | c109, c110, c052, c104 | All current listings are Luel's own and Luel reviews every submission. Supplier promises are not checked. The English speech listing advertises transcripts that the buying docs say no self-serve corpus has. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Luel says its buyers are AI labs, robotics firms, platforms, universities, hospitals and banks; self-serve speech is sold by the minute ($1.25) with capped entry-tier volumes. No volumes or reasons for off-the-shelf over custom are published beyond the pitch against slow procurement. | c080, c012, c074, c084, c079 |
| Q2 | partial | Third-party sellers get Luel's pricing, clickwrap licence, buyer vetting and agent/MCP distribution for 15% under draft terms, but Luel alone decides listing, price and licence and does not name the seller. Seller listing is not yet open. | c039, c040, c037, c066, c004, c029 |
| Q3 | sourced | Inventory comes from paid crowd contributors (perpetual non-exclusive licence to Luel), Luel-subsidised speculative collection, completed custom collections, a licensed music catalogue, an owned clinical archive, and (pending) third-party suppliers under a non-exclusive licence. | c137, c023, c017, c030, c031, c038, c027 |
| Q4 | partial | Luel calls custom datasets 'exclusive' yet says completed collections and each delivery feed the re-licensable catalogue; how resale rights are carved out of commissioned work is not published. Terms apply retroactively to earlier access and new DLA versions govern past licences once accepted; no dispute over a change was found. | c019, c020, c017, c022, c095, c094 |
| Q5 | sourced | Luel is licensor of record and licenses supplier data in its own name. Contributors and suppliers warrant consent to Luel; Luel's promise to buyers is knowledge-qualified, it gives no indemnity, and buyers indemnify Luel. | c036, c113, c153, c042, c126, c127, c128 |
| Q6 | sourced | Copy to buyer: Luel copies supplier data from the supplier's bucket, then issues short-lived signed download URLs under per-version download caps; buyers become independent controllers of their copies. | c045, c050, c071, c096, c157 |
| Q7 | partial | Capturers give written consent at sign-up and per submission and warrant consent for anyone else; egocentric video claims signed scene-level consent with screens masked. Depicted third parties have no documented release route, and buyers get a consent projection, not forms. | c156, c153, c154, c160, c161, c099, c042 |
| Q8 | sourced | Non-exclusive, internal-only training licence with no redistribution; audit on suspicion; deletion within 30 days on end or withdrawal, models kept. Audio ships unmarked and byte-identical, and per-buyer marking is not live. | c113, c117, c120, c121, c100, c101 |
| Q9 | sourced | Audio SKUs close self-serve on prepaid credits (card via Stripe, invoice fallback) with no cash refunds; video/sensor/image listings are contact-sales. Luel earns principal margin on its own data and 15% on third-party sales. | c071, c073, c072, c077, c062, c070, c039 |
| Q10 | sourced | Dataset = corpus sold as portions; each portion is a SKU with its own version id, price and tier; a buyer holds one grant per SKU, ordered as cumulative hours. The licence binds to the version bought; withdrawals revoke affected recordings with pro-rata credit. | c088, c089, c090, c091, c092, c093, c125 |
| Q11 | sourced | Before purchase: sample clips on request, a one-minute API sample (none cut yet), Hugging Face samples, and listing specs. Delivery carries a signed receipt; the docs disclose defects such as band-limited audio and missing transcripts. | c063, c106, c107, c108, c098, c104, c102 |
| Q12 | sourced | Luel sells both: 'Off-the-shelf licensing' / marketplace and 'Custom collections' / collection engine, on one pipeline. Listings flagged 'Scoped to order' are scoped with a buyer, so the catalogue entry doubles as a collection brief. | c017, c018, c016, c055, c056, c059, c061 |

## Narrative

### positioning

Luel (YC W26, founded 2025) sells itself as two things on one pipeline: a marketplace of completed datasets and a collection engine that captures to a buyer's spec [c014][c015][c016]. Its Terms describe a marketplace connecting individual contributors with AI-company buyers [c011][c012].

### supply

Supply is mainly a paid crowd (850,000+ contributors claimed) capturing to posted tasks [c025][c024], plus Luel-subsidised collection [c023], completed collections recycled into the catalogue [c017][c020], a music catalogue from one provider [c030] and an owned clinical archive [c031]. Third-party supply is announced at 85/15 [c021][c039], but the Supplier Terms are an unsigned draft [c004][c029].

### object_model

Self-serve: a dataset is one corpus sold in portions, each a SKU with its own version id, price and verification tier [c088][c089]. Buyers order cumulative hours and hold one grant per SKU [c091][c090]. The licence binds to the version and quantity paid for [c092], and Luel may withdraw a version [c093].

### listing

The public marketplace shows 30 datasets [c054]. Cards carry 'Scoped to order', 'Custom' or 'Enterprise' badges [c056][c057][c058]. Detail pages give specs and volume claims [c034][c035] but no price. Only audio is self-serve [c069].

### discovery

Buyers browse the public marketplace or let an MCP agent search and license from Claude Code, Cursor or Codex [c066][c067]. In the API, video and sensor listings appear only as contact-sales rows [c070].

### trust

Luel says listings are quality-verified [c109] and ship with consent evidence [c135][c136]. API deliveries carry an Ed25519-signed receipt with a consent projection [c098][c099]. The docs disclose band-limited audio and no transcripts [c104][c102], contradicting the English listing [c103].

### transaction

Audio SKUs close self-serve from a prepaid balance funded via Stripe, with an invoice fallback [c071][c073][c072]. There are no cash refunds [c077]. Other listings say licensing is arranged with the team [c062]. The docs say the API is switched off in production [c005], but a 17 September post says it is live [c001].

### pricing

Every self-serve SKU is $1.25 per minute of paired conversation, or $75 an hour [c074][c075]. An hour counts paired time, not speech [c076]. Third-party suppliers would get 85% of each order [c039], and Luel alone sets prices [c040].

### licence

The DLA (v5) is a non-exclusive, non-sublicensable, worldwide licence to train and evaluate models, which buyers may deploy and keep [c113][c114][c115]. It bars redistribution, affiliate access and biometric uses [c117][c116][c118], allows audits [c120][c119], and gives no indemnity [c127]. Audio ships unmarked [c100][c101].

### custody

Luel copies supplier data out of the supplier's bucket with read-only keys [c050][c045][c046]. Buyers download through signed URLs under a 5-session, 30-day cap [c096] and hold a licence, not ownership [c097].

### vetting

Any buyer can reach the 'Licensed' tier with a clickwrap and a country check, with no KYC, capped at $5,000 [c083][c086][c084][c085]. The 'Verified' tier adds operator review and sanctions screening [c087]. Supply is reviewed by hand [c052][c110], but supplier warranties are not checked [c044].

### contributor_pay

Contributors grant a perpetual, irrevocable, non-exclusive licence [c137]. They are paid a posted rate, for example $12/hr English or $7.50/hr low-resource conversation [c145][c146], fixed when Luel approves the submission, not at upload [c141][c142]. Luel may claw back payouts [c144]. Contributors get no share of later sales.

### post_sale

Contributor sales are final [c149]. On a verified request Luel stops licensing, revokes live entitlements and deletes its own copies [c151][c152], but says it cannot retrieve delivered copies [c150]. The DLA nonetheless obliges buyers to delete withdrawn recordings within 30 days, keeping models, with pro-rata credit [c123][c124][c125].

### catalogue_custom

Every listing doubles as a brief: 'Scoped to order' means Luel scopes the collection with a buyer [c055]. Listings offer coverage extended on request [c059][c060], and one request form covers samples, licences and custom collections [c061]. Custom work is described as exclusive [c019], yet deliveries grow the catalogue [c022].

### changes

Recent dated events: $31.2M seed (May 2026) [c006][c007], the agent-native marketplace (17 Sep 2026) [c001], and a Terms update on 17 Sep 2026 [c002]. Terms apply back to the start of access [c095], and each accepted DLA version governs past licences [c094].

### demand

Luel names labs, robotics companies, social platforms, universities, hospitals and banks as customers [c080], and pitches self-serve licensing against slow procurement and samples [c079]. No independent traction evidence was found.

### regulation

Speech is sold as identifiable, non-anonymised personal data, and the buyer is an independent controller [c130][c131]. Luel takes biometric consent at sign-up and per submission [c156] and treats the transfer as a sale of sensitive data [c158]. The dermatology set is de-identified [c112].

## Buyer journey

1. Lands on luel.ai/marketplace: 30 public dataset cards with modality tags and 'Scoped to order', 'Custom' or 'Enterprise' badges, no prices [c054][c056]. [c054, c056]
2. Opens a listing such as General Egocentric Video: overview, specs, provenance lines, and buttons to request a custom dataset, request samples or talk about pricing [c062][c063][c160]. [c062, c063, c160]
3. Video, sensor or image route: submits the request form (sample, licence or custom collection); Luel replies with samples, a price and a scope; licence terms are negotiated [c061][c064]. [c061, c064]
4. Speech route: creates a buyer organisation, accepts the DLA by clickwrap and states a country to reach the Licensed tier ($5,000 cap) [c083][c084]. [c083, c084]
5. Funds a prepaid balance through Stripe Checkout, or invoice for enterprise, and optionally connects an MCP agent [c073][c072][c066]. [c073, c072, c066]
6. Previews a SKU (price, hours, tier, sample availability) and orders cumulative hours at $1.25/min, pinning the quote; no cash refunds [c089][c074][c091][c077]. [c089, c074, c091, c077]
7. Downloads WAV plus JSON sidecars via signed URLs (5 sessions per 30 days) and verifies the Ed25519 rights receipt [c096][c098]. [c096, c098]
8. Afterwards: must delete withdrawn recordings within 30 days on notice (models kept, credit given) and all copies when the licence ends; may be audited [c123][c121][c120]. [c123, c121, c120]

## Claims

### positioning

- **c010** Luel says it was founded in 2025 by William Namgyal (CEO) and Inigo Lenderking (COO).  
  _event · vendor_stated · as of 2026-05-15 (publication)_
  - “Luel was founded in 2025 by William Namgyal, CEO (18), and Inigo Lenderking, COO (19).” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c011** Luel's Terms describe the Service as a marketplace for AI training data connecting individual contributors of video, audio and other recordings with buyers.  
  _offer · legal_text · as of 2026-09-17 (page_dated)_
  - “Luel operates as a specialized marketplace for AI training data, connecting individuals who contribute video, audio” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### supply

- **c004** The Luel Marketplace Supplier Terms (v2, 15 September 2026) are published as a draft pending counsel review, and Luel is not yet accepting signatures.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Draft pending counsel review. Luel is not accepting signatures yet.” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Luel names an off-the-shelf catalogue that can be re-licensed to more buyers at no new collection cost as a second revenue stream.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “an off-the-shelf catalog that can be re-licensed to additional buyers at no new collection cost” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The founders' own post on YC's domain names off-the-shelf licensing next to custom collections; it does not say 'second revenue stream' or 'no new collection cost'. Not independent.
    - “completed collections become ready-to-license catalogue datasets” — Y Combinator (Launch YC post by Luel co-founder Inigo Lenderking), <https://www.ycombinator.com/launches/PKl-luel-the-marketplace-for-multimodal-data> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches; 'second' is the list order in the seed post, which enumerates three streams.
- **c021** Luel names third-party listings, where external labs post their own datasets on its marketplace for a revenue share, as a third revenue stream.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “third-party listings, where external labs post their own datasets on Luel's marketplace for a revenue share” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — How Luel describes its own revenue streams; the founders' Launch YC post does not mention third-party listings.
  - verifier (scope): **scope_ok** — Quote matches; 'third' is the list order in the seed post.
- **c023** Luel says it will use seed funds to subsidise the collection of strategically important datasets, meaning speculative collection on its own account.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “subsidize the collection of strategically important datasets” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** Luel's contributor page invites individuals to get paid for everyday conversations, videos and photos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get paid for your everyday conversations, videos and photos.” — Luel, <https://www.luel.ai/contribute> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c025** Luel says more than 850,000 contributors earn through its platform.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **850000 contributors** (vendor-stated headcount of contributors, no definition of active; as of retrieval)
  - “Join 850,000+ contributors already earning with Luel.” — Luel, <https://www.luel.ai/contribute> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Figure appears on luel.ai/contribute ('850,000+ contributors already earning with Luel', near an unlabelled '$131.10M' figure). No independent count found; TechCrunch's Demo Day piece and the YC and Lightspeed pages give none. Luel's own seed post (15 May 2026) says only 'hundreds of thousands' of people. No search available.
  - verifier (scope): **scope_ok**
- **c026** Luel says its contributor network spans 96 or more countries.  
  _number · vendor_stated · as of 2026-09-17 (publication)_ · **96 countries** (vendor-stated lower bound; as of 2026-09-17)
  - “more than 850,000 contributors across 96+ countries” — Luel, <https://www.luel.ai/blog/luel-data-marketplace-agent-native> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent country count found (YC, Lightspeed, TechCrunch pages give none). Luel's own seed post (15 May 2026) says 'across almost 100 countries', not 96+. No search available.
  - verifier (scope): **scope_ok** — Quote is from the 17 Sept 2026 post; the 15 May 2026 seed post says 'almost 100 countries' and 'hundreds of thousands of people', so the figures moved between posts.
- **c027** Anyone in a Luel Data organisation can submit a dataset of any modality for sale.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Anyone in a Luel Data organization can submit a dataset, of any modality.” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c028** Console submission for sellers opens only once Luel's supplier terms clear review.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Console submission for sellers opens once our supplier terms clear review.” — Luel, <https://www.luel.ai/data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** The endpoint for accepting the supplier terms is not open in production, so no seller account can be completed today.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “no organization can accept them today and no seller account can be completed through the console” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c030** Luel's Music Library listing says every track is sourced from a single long-standing professional catalogue provider.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every track is sourced from the same long-standing catalog provider” — Luel, <https://www.luel.ai/datasets/music-library> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c031** Luel's Cancer Medical Imagery listing says the collection is exclusively owned by Luel.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Exclusively owned by Luel” — Luel, <https://www.luel.ai/datasets/cutaneous-medical-imagery> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** The dermatology listing describes an archive built over 16 years of clinical documentation, which predates Luel's 2025 founding.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “An exceptional dermatological imaging archive built over 16 years of continuous clinical documentation.” — Luel, <https://www.luel.ai/datasets/cutaneous-medical-imagery> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c033** Luel's Diverse Egocentric POV Video listing says it was filmed by more than 400 contributors on the Pineye camera system.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **400 contributors** (vendor-stated lower bound for one dataset; as of retrieval)
  - “Filmed by 400+ contributors using the Pineye egocentric camera system” — Luel, <https://www.luel.ai/datasets/diverse-egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing text; live page luel.ai/datasets/diverse-egocentric-video says '400+ unique contributors' and 'Pineye egocentric camera system'. Its linked Hugging Face sample (Luel-ai/Ego-Realm) returned 401 and is Luel-authored anyway.
  - verifier (scope): **scope_ok**
- **c038** A supplier keeps ownership and gives Luel a worldwide, non-exclusive, sublicensable licence.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “You keep ownership of your data. You give Luel a worldwide, non-exclusive, sublicensable licence” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c041** Luel promises suppliers not to train its own AI models on their data without written agreement.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel will not train its own AI models on your data unless you agree in writing” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c162** Luel's legal index says the Marketplace Supplier Terms cover the seller's licence, rights and consent promises, revenue share, payouts and removal on withdrawal.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “The licence a seller gives Luel, the promises a seller makes about rights and consent, the revenue share and payouts” — Luel, <https://www.luel.ai/legal> · legal_terms · retrieved 2026-10-01 · quote check: exact

### object_model

- **c053** Sellers cannot edit a live listing through the API; they file change requests (update details, change price, unpublish) that Luel staff apply.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “change is one of update_details , change_price , unpublish , other” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** A Luel Data hour is paired conversation time rather than speech time, and speech-active audio is about a quarter of it.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “An hour is paired conversation time , not speech time.” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c088** In Luel Data one dataset is one corpus, sold as one or more portions.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “One dataset is one corpus, sold as one or more portions” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c089** Each portion is a separate SKU with its own dataset-version id, price and required verification tier.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each portion is a separate SKU with its own datasetVersionId , its own price and its own required verification tier.” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c090** A buyer holds at most one active full grant per SKU, and re-ordering it charges nothing.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “One active full grant exists per buyer per SKU.” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c091** Orders specify the cumulative hours a buyer wants to hold, and hours already held are credited.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “hours is the cumulative total you want to hold , not this order's delta.” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c092** A Luel Data licence covers only the dataset version and quantity paid for.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “The license covers the dataset version and quantity you paid for and nothing else.” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c093** When recordings must be removed, Luel may withdraw the whole dataset version from sale and end download access to it.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel may also withdraw the dataset version that contains them from sale and end download access to it” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact

### listing

- **c034** Luel's Diverse Egocentric POV Video listing states a total duration of more than 1,000 hours.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1000 hours of video** (vendor-stated lower bound, one listing; as of retrieval)
  - “1,000+ hours of footage” — Luel, <https://www.luel.ai/datasets/diverse-egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing text; live page says '1,000+ hours'.
  - verifier (scope): **scope_ok**
- **c035** Luel's General Egocentric Video listing claims recordings spanning more than 20,000 unique tasks.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **20000 unique tasks** (vendor-stated lower bound, one listing; as of retrieval)
  - “20,000+ unique tasks captured across households, factories, shops, and many more real-world environments” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing text; live luel.ai/datasets/egocentric-video says '20,000+ unique tasks captured across households, factories, shops'.
  - verifier (scope): **scope_ok**
- **c054** Luel's public marketplace lists 30 datasets: 24 audio, 4 sensor and 5 video, with some listings in more than one category.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **30 datasets listed** (public marketplace count shown on the page; as of retrieval)
  - “Showing 1 – 12 of 30 datasets” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Live luel.ai/marketplace filter counts: All (30), Audio (24), Video (5), Sensor (4), which sum to 33, so the overlap reading holds. Note the sitemap lists 30 /datasets/ pages including a 'cutaneous-medical-imagery' listing, i.e. an image listing outside those three filters.
  - verifier (scope): **quote_incomplete** — The quote shows only the total of 30. The per-category counts need the filter labels on the same page: 'Audio (24)', 'Video (5)', 'Sensor (4)'.
- **c056** General Egocentric Video, Computer-Use Workflows and Music Library carry a 'Scoped to order' badge alongside an 'Enterprise' badge.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Scoped to order Video Sensor Enterprise General Egocentric Video” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Other listings, such as the gemstone-carving video set, carry a 'Custom' badge instead, and no page explains what that badge means.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Video Custom Egocentric Gemstone Carving & Lapidary Video” — Luel, <https://www.luel.ai/marketplace/video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c058** Some listings, such as English Conversational Speech Full, carry only an 'Enterprise' badge, so not every listing is marked 'Scoped to order' or 'Custom'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Audio Enterprise English English Conversational Speech Full” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c068** Luel's public beta of self-serve Luel Data publishes at most 12 corpora.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **12 corpora** (release bound on self-serve API catalogue, not enforced by the API; public beta)
  - “The public beta ships at most 12 corpora” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own docs limit; live luel.ai/docs/data/limits says the public beta includes 'at most 12 corpora'.
  - verifier (scope): **scope_ok** — Quote is from /docs/data/buying; /docs/data/limits says the same thing ('at most 12 corpora').
- **c069** Only text and audio can be licensed self-serve, and every self-serve SKU on sale is audio.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Only agent-deliverable modalities are listed: text and audio . Every SKU on sale today is audio.” — Luel, <https://www.luel.ai/docs/data/limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c103** The English Conversational Speech Full listing advertises JSON transcripts with diarization, word-level timestamps and emotion labels.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “JSON transcripts with speaker diarization labels” — Luel, <https://www.luel.ai/datasets/english-conversational-speech> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### discovery

- **c066** Luel Data can be browsed and licensed over MCP from Claude Code, Cursor, Codex and other MCP clients.  
  _offer · vendor_stated · as of 2026-09-17 (publication)_
  - “Luel Data works over MCP with Claude Code, Cursor, Codex and other MCP clients” — Luel, <https://www.luel.ai/blog/luel-data-marketplace-agent-native> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c067** The marketplace says an agent can license a growing subset of the listed datasets, or list the user's own, without a procurement thread.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your agent can license a growing set of these datasets, or list your own, without a procurement thread.” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c042** A supplier warrants that every identifiable person consented to their data being licensed to Luel, resold to buyers and used to train AI.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “gave informed consent to their data being licensed to Luel, resold and sublicensed by Luel to its buyers” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c043** A supplier must keep records of every consent, release and notice behind its data and hand copies to Luel on request.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “You will keep records of every consent, release and notice behind your data for as long as Luel holds it” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c051** A seller must have a person confirm that everyone identifiable in the data consented to it being licensed to others, including for AI training.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “every person who can be identified in it consented to it being licensed to others, including for training AI” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** Listing pages offer sample clips on request, sent by Luel after the buyer shares a use case.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Share your use case and we'll send sample clips, pricing, and recommended next steps for your pipeline.” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c098** Every Luel Data delivery ships an Ed25519-signed rights and provenance receipt.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every delivery ships an Ed25519-signed rights and provenance receipt” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c099** The signed receipt carries a buyer-safe consent projection, a consent reference hash and a lineage reference.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “a buyer-safe consent projection, a consentRef hash, a lineageRef” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own receipt format in its docs.
  - verifier (scope): **scope_ok**
- **c102** Luel's buying docs state that no conversation in the published self-serve catalogue carries a transcript.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “There are no transcripts. Not one conversation in the published catalogue carries one” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c104** Luel discloses that a sampled quarter of its launch corpus is band-limited to 16 kHz or below inside a 48 kHz container.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “a sampled quarter of the launch corpus holds audio band-limited to 16 kHz or below inside a 48 kHz container” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c105** Luel discloses that only 5.6% of sessions in its published corpora have two tracks of exactly equal length.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5.6 percent of sessions** (measured by Luel across published self-serve corpora; as of retrieval)
  - “only 5.6% of sessions have two tracks of exactly equal length” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Luel's own disclosure. Its lab papers are hosted only on luel.ai (no arXiv version found via the arXiv API search for 'Luel').
  - verifier (scope): **scope_ok**
- **c106** A self-serve sample is a free grant of at most six 10-second excerpts (one minute), where one exists.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “mints a free grant for at most 6 excerpts of 10 seconds” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c107** Luel's agent guide says no self-serve SKU on sale has a sample yet.  
  _status · vendor_stated · as of 2026-09-17 (page_dated)_
  - “No SKU on sale has a sample today, so every sample call answers `404 sample_not_available`.” — Luel, <https://www.luel.ai/data/skill.md> · docs · retrieved 2026-10-01 · quote check: exact
- **c108** Luel publishes sample sets on Hugging Face, including egocentric video, CAD, gaming, music and conversational-speech samples.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Luel-ai/luel-egocentric-video-samples” — Luel (Hugging Face organisation page), <https://huggingface.co/Luel-ai> · docs · retrieved 2026-10-01 · quote check: exact
- **c109** The Diverse Egocentric POV Video listing says the data was sourced and quality-verified by Luel.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sourced and quality-verified by Luel” — Luel, <https://www.luel.ai/datasets/diverse-egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c126** Luel's only warranty to buyers is a knowledge-qualified promise that the recorded people agreed to contributor terms permitting licensing.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “to its knowledge, the people whose recordings are in the Corpus agreed to Luel contributor terms that permit Luel to license” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c135** Luel's launch post says each catalogue entry ships with consent evidence, chain of title and audit logs.  
  _offer · vendor_stated · as of 2026-02-12 (publication)_
  - “Each entry ships with consent evidence, chain of title, and audit logs.” — Luel, <https://www.luel.ai/blog/launching-luel-yc-w26> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c136** Luel says what ships to a buyer includes a manifest, sensor channels, annotations, provenance and consent records.  
  _offer · vendor_stated · as of 2026-05-08 (publication)_
  - “what ships to a buyer is a manifest, sensor channels, annotations, provenance, and consent records” — Luel, <https://www.luel.ai/blog/scaling-egocentric-video-data-pipeline> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c153** The contributor alone warrants having every right, licence, consent and permission needed for content relating to third parties.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “you have obtained, and are solely responsible for obtaining, all necessary rights, licenses, consents, and permissions” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c154** Contributors warrant that their content includes no third-party images or audio.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “your content does not include any third-party images or audio” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c159** Luel says its Luel Data speech comes from paid adults who agreed their recordings can train AI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Adults who are paid, and who agreed their recordings can train AI.” — Luel, <https://www.luel.ai/data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c160** The General Egocentric Video listing says contributors signed scene-level consent.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Paid contributors with signed scene-level consent” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c161** The General Egocentric Video listing says third-party copyrighted content such as TVs and monitors is masked.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “No third-party copyrighted content (TVs / monitors are masked)” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c005** Luel's Data API limits page says the marketplace API runs behind a feature flag that is off in production, so every data path answers 404.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The marketplace runs behind DATA_MARKET_ENABLED , and it is off in production today” — Luel, <https://www.luel.ai/docs/data/limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Marketplace listing pages show no price, and licensing is arranged with Luel's team, which replies with pricing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Licensing is arranged with our team, tell us the use case and we will come back with pricing and next steps.” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c070** In the API catalogue, video and sensor listings appear only as 'contact_sales' rows with no price or version and cannot be ordered.  
  _architecture · vendor_stated · as of 2026-09-17 (page_dated)_
  - “a `video` or `sensor` listing appears here even though no `orderable` SKU of that modality ever will” — Luel, <https://www.luel.ai/data/skill.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own API behaviour. The API reference confirms an availability value 'contact_sales' and that 'Only agent-deliverable modalities are listed'; the catalogue itself needs authentication, so the rows could not be inspected.
  - verifier (scope): **quote_incomplete** — The quote shows video/sensor listings are never orderable, but not that they are contact_sales rows with no price or version. The same skill.md says 'No id, no datasetVersionId, no price — there is nothing to order' about contact_sales rows.
- **c071** The Luel Data API lets agents and services take a licence with prepaid credits and download signed packages without a dashboard.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “take a license with prepaid credits, and download signed packages” — Luel, <https://www.luel.ai/docs/data> · docs · retrieved 2026-10-01 · quote check: exact
- **c072** Luel Data is funded by prepaid credits, with invoicing as a fallback for enterprise buyers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Prepaid credits (or Invoice fallback for enterprise)” — Luel, <https://www.luel.ai/docs/data> · docs · retrieved 2026-10-01 · quote check: exact
- **c073** An owner funds the Luel Data balance through hosted Stripe Checkout.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “an owner funds the balance through hosted Stripe Checkout” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c077** Luel Data gives no cash refunds, and an order is reversed to platform credit only when Luel fails to deliver.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel Data does not issue cash refunds and reversals cannot be requested” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c078** Luel's Terms allow buyers to pay by credit card, invoice or other offered methods.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “Payments may be made by credit card, invoice, or other methods made available through the Service.” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### pricing

- **c039** Under the draft Supplier Terms a supplier earns 85% of each order amount that licenses its data, and Luel keeps the remaining 15%.  
  _number · legal_text · as of 2026-09-15 (page_dated)_ · **85 percent** (supplier's share of the buyer's order amount; Luel retains 15% out of proceeds; draft terms not yet open for signature; per order)
  - “you earn 85% of the order amount, rounded down to the cent, and Luel keeps the rest” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Luel's own Marketplace Supplier Terms (luel.ai/marketplace/agreement, dated 15 Sept 2026 on luel.ai/legal).
  - verifier (scope): **scope_ok** — The 15% is derived from 'Luel keeps the rest', which is fair. The 'draft' status is shown elsewhere on the page ('Draft pending counsel review. Luel is not accepting signatures yet.').
- **c040** Luel alone decides whether to copy, screen, price and list a supplier's data, and on what licence terms.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel decides at its sole discretion whether to copy, screen, price and list your data, on what licence terms” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** Every self-serve Luel Data SKU on sale in production is priced at US$1.25 per minute of paired conversation.  
  _number · vendor_stated · as of 2026-09-17 (page_dated)_ · **1.25 USD per minute** (buyer pays; list price per minute of paired conversation audio, all self-serve speech SKUs; per minute licensed)
  - “Every SKU on sale in production is 125 minor per minute ($1.25/min)” — Luel, <https://www.luel.ai/data/skill.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own docs. Live luel.ai/data/skill.md ('Staging catalog' section) says 'Every SKU on sale in production is 125 minor per minute ($1.25/min)' and adds 'Staging fixtures are priced differently'. The catalogue itself is behind authentication, so per-SKU prices could not be inspected.
  - verifier (scope): **scope_ok** — The quote sits under skill.md's 'Staging catalog' heading but explicitly speaks of production and is followed by 'Staging fixtures are priced differently'. 'Of paired conversation' is not in the quote and comes from other docs.
- **c075** Luel's quickstart says the $1.25-a-minute rate makes one hour cost $75.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **75 USD per hour** (buyer pays; per hour of paired conversation time at the per-minute list rate; per hour licensed)
  - “125 minor is $1.25 a minute, so an hour is $75” — Luel, <https://www.luel.ai/docs/data/quickstart> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own docs; live quickstart reads '125 minor is $1.25 a minute, so an hour is $75'.
  - verifier (scope): **scope_ok**

### licence

- **c003** The Luel Data License Agreement in force is version luel-data-dla-v5, last modified 15 September 2026.  
  _event · legal_text · as of 2026-09-15 (page_dated)_
  - “Last Modified: September 15, 2026 Version luel-data-dla-v5” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** Under the draft Supplier Terms Luel licenses a supplier's data to buyers in Luel's own name.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “license it to buyers in Luel's own name, under the Data License Agreement or other written licence terms Luel sets” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Luel's own Supplier Terms; no independent source exists by nature.
  - verifier (scope): **scope_ok** — Draft terms, correctly labelled.
- **c037** The draft Supplier Terms say Luel need not tell buyers who the supplier is.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel does not have to tell buyers who you are.” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c064** On the Music Library listing, sublicensing and commercial-redistribution rights are negotiated with each buyer.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Sublicensing terms and commercial-redistribution rights are negotiated per buyer.” — Luel, <https://www.luel.ai/datasets/music-library> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing text on Luel's own Music Library page.
  - verifier (scope): **scope_ok**
- **c100** Audio is delivered unmarked, so every buyer gets byte-identical files and a leaked file cannot be traced to a buyer.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “two buyers of the same hours receive byte-identical files and a leaked audio file cannot be traced to either from its bytes” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c101** Per-buyer forensic marking has been tested on staging but is not live in production.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Per-buyer marking is proven on staging and is not live in production.” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact
- **c113** For each paid order Luel grants a non-exclusive, non-sublicensable, non-transferable, worldwide licence.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel grants you a non-exclusive, non-sublicensable, non-transferable, worldwide license” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** The DLA lets buyers train, fine-tune, evaluate and test machine-learning models on the corpus.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “use the Corpus to train, fine-tune, evaluate and test machine learning models” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c115** Buyers may use, deploy, commercialise and keep the models trained, and their outputs.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “use, deploy, commercialize and retain the models so trained (Models) and their outputs” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c116** Affiliates, parent or subsidiary companies, clients and research partners may not access the corpus without Luel's written agreement.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “including your affiliates, parent or subsidiary companies, clients and research partners, unless Luel agrees in writing” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c117** Buyers may not redistribute, upload to a model hub or dataset host, resell or sublicense the corpus or derived data.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “upload to a model hub or dataset host, sell, resell, lend, sublicense or otherwise make available the Corpus” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c118** The DLA bars biometric identification, verification and surveillance uses without a separate written agreement.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “for biometric identification, biometric verification or biometric surveillance” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c119** On reasonable suspicion of breach, a buyer must give Luel a signed written account of storage, access and trained models within 15 business days.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “within 15 business days you will give it a written account of where the Corpus and Derived Data are stored” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c120** Buyers must allow a reasonable audit by Luel or an independent auditor bound by confidentiality.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “You will allow a reasonable audit of that account by Luel or an independent auditor bound by confidentiality” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c127** Luel gives Luel Data buyers no indemnity.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel gives you no indemnity.” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c128** The buyer defends Luel against third-party claims, including from speakers or regulators, arising from its breach, its models or its processing.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “including a speaker or a regulator, and pay the resulting damages, fines, penalties, settlements and reasonable legal costs” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c129** Luel's liability under the DLA is capped at what the buyer paid for the orders concerned in the prior 12 months.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “limited to the amount you paid Luel for the orders the claim relates to in the 12 months before the event” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c132** The DLA defines the Corpus as audio and its accompanying files, so it is written for speech and does not describe video or image deliveries.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “The Corpus means the audio, and any transcripts, labels, metadata and manifests, delivered to you under an order.” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c133** The DLA is governed by Delaware law, replacing the Terms of Service's California law and arbitration for Luel Data disputes.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “governed by the laws of the State of Delaware, United States” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c134** The consent scope shown on a dataset card describes what contributors consented to and is not itself a grant of rights to the buyer.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “consentScope on a card describes what contributors consented to. It is not a grant of rights to you” — Luel, <https://www.luel.ai/docs/data/buying> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c045** The supplier licence lets Luel access, download and copy the data, including from the supplier's own storage.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “access, download and copy your data, including from the storage you give Luel access to” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Luel's own Supplier Terms.
  - verifier (scope): **scope_ok** — 'Supplier's own storage' slightly paraphrases 'the storage you give Luel access to'; acceptable.
- **c046** Luel may delete a supplier's access keys once it has copied the data.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel may delete your keys at any time, including once it has copied your data” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** A seller submits a dataset by giving Luel read-only credentials to its own storage bucket.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get read-only credentials for your bucket.” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c096** A buyer may open 5 new download sessions per dataset version in a rolling 30-day window.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **5 download sessions** (per buyer org and dataset version, full-corpus lane; per rolling 30 days)
  - “Do not architect around more than five genuine re-downloads per window.” — Luel, <https://www.luel.ai/docs/data/limits> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own limit; live luel.ai/docs/data/limits: new-session cap 5 per 30-day window per buyer org and dataset version (hard ceiling 100 signed-URL issuances).
  - verifier (scope): **quote_incomplete** — The quote ('more than five genuine re-downloads per window') gives neither the 30-day window nor the per-dataset-version scope. The limits table does: 'New-session cap' 5, under 'Per 30-day window, per buyer org/dataset version'. The statement also says 'rolling', which I did not see.
- **c097** Luel Data buyers get a non-exclusive licence and a revocable entitlement to download the files, not ownership of them.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You do not buy ownership of the files.” — Luel, <https://www.luel.ai/docs/data> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c044** Luel's review of a supplier dataset does not check that the supplier's rights and consent promises are true.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “it does not check that your promises in section 4 are true” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** A person at Luel reviews every seller submission by hand, and nothing is priced, published or unpublished automatically.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A person at Luel reviews every submission by hand. Nothing is priced,” — Luel, <https://www.luel.ai/docs/data/selling> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** Access to the Music Library is gated and granted per team at Luel's discretion.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Access is gated and provisioned on a per-team basis at Luel's discretion.” — Luel, <https://www.luel.ai/datasets/music-library> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c083** Luel Data is open to any buyer, with no company-registration, work-email or address requirement at the entry tier.  
  _terms · legal_text · as of 2026-09-14 (page_dated)_
  - “There is no company-registration, work-email, or address requirement to license data at our entry tier.” — Luel, <https://www.luel.ai/data-buyer-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c084** The unverified 'Licensed' buyer tier is capped at US$5,000 of lifetime spend.  
  _number · legal_text · as of 2026-09-14 (page_dated)_ · **5000 USD** (lifetime spend cap per buyer account at the self-declared Licensed tier; account lifetime)
  - “$5,000 of spend in total, ever, and at most 20 hours held of any one hourly-priced dataset” — Luel, <https://www.luel.ai/data-buyer-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own limit; live luel.ai/data/skill.md gives a $5,000 lifetime spend cap for the self-declared 'licensed' rung.
  - verifier (scope): **quote_incomplete** — The $5,000 figure is right, but the quote does not name the tier. The words 'Licensed' tier (self-declared) on the Data Buyer Policy would show it. The same quote gives a 20-hour per-dataset cap, which the profile correctly records as a conflict with c085.
- **c085** Luel's agent guide says the Licensed tier's order range is 5 to 10 hours, so such a buyer can hold at most 10 hours of any one SKU.  
  _number · vendor_stated · as of 2026-09-17 (page_dated)_ · **10 hours per SKU** (maximum cumulative hours a Licensed-tier buyer may hold of one SKU; account lifetime)
  - “Today that range is 5 to 10 hours, so a `licensed` buyer can hold at most **10** hours of any” — Luel, <https://www.luel.ai/data/skill.md> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own limit; live skill.md: 'Today that range is 5 to 10 hours, so a licensed buyer can hold at most 10 hours of any one SKU'. The Data Buyer Policy (14 Sept 2026) instead says 'at most 20 hours held of any one hourly-priced dataset'.
  - verifier (scope): **scope_ok** — The quote supports the statement, but the Data Buyer Policy's 20-hour cap disagrees. The profile records this conflict and resolves it as the 10-hour tier range binding first. That resolution comes from skill.md and is an interpretation, not the policy's text.
- **c086** Luel requests no KYC, KYB, identity or business-registration documents at either buyer tier.  
  _terms · legal_text · as of 2026-09-14 (page_dated)_
  - “we do not request KYC, KYB, identity documents, business-registration documents, beneficial-owner forms, or liveness checks” — Luel, <https://www.luel.ai/data-buyer-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c087** The 'Verified' tier, needed above the cap, is decided by a Luel operator and includes a restricted-party check against OFAC, EU, UK and UN lists.  
  _terms · legal_text · as of 2026-09-14 (page_dated)_
  - “records a restricted-party check against the OFAC, EU, UK and UN lists before approving” — Luel, <https://www.luel.ai/data-buyer-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c110** Every contributor submission undergoes Luel review for AI training suitability, including quality and an AI ethics review.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “All submitted User Content shall undergo specialized review for AI training suitability” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c111** Luel's contributor app rejects clips that fail basic checks before they leave the device, and reviewers on a competence ladder score the rest.  
  _architecture · vendor_stated · as of 2026-05-08 (publication)_
  - “is rejected before it ever leaves the device” — Luel, <https://www.luel.ai/blog/scaling-egocentric-video-data-pipeline> · eng_blog · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c137** A contributor grants Luel a perpetual, irrevocable, worldwide, sublicensable, transferable and non-exclusive licence to their content.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “perpetual, irrevocable, worldwide, sublicensable, transferable, and non-exclusive license” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c138** The contributor licence expressly covers Luel selling, licensing and transferring the content to Enterprises.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “including selling, licensing, and transferring your User Content and Contributor Data to Enterprises” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c139** Contributors are independent contractors of Luel.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “your relationship with us is that of an independent contractor” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c140** The Terms say contributors may receive compensation for content sold or licensed through the Service.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “Contributors may receive compensation for User Content that is sold or licensed through the Service” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c141** A contributor's payout is based on the listing rate in effect when Luel marks the submission payable or approves it, not when it is submitted.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “the payout is based on the listing rate and terms in effect at that payable/approval determination time” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Luel's own contributor terms.
  - verifier (scope): **scope_ok** — Contributor payout clause sits in the Terms of Service; scope matches.
- **c142** No contributor payout rate is locked at upload, recording or submission time.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “No payout rate is locked at upload, recording, or submission time.” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c143** For conversation recordings, payouts are calculated per participant from duration and the listing rate.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “For conversation recordings, payouts are calculated per participant based on duration and listing payout rates.” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c144** Luel may withhold, adjust, reverse or recover any contributor payout, including amounts already marked payable.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “withhold, suspend, offset, adjust, reverse, cancel, or recover any payout (including previously marked payable amounts)” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c145** An open contributor task for three-person American English conversations pays US$12 per hour ($0.20 per minute).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **12 USD per hour of recording** (Luel pays contributor; posted task rate, one task; per hour recorded)
  - “$12/hr ($0.20/min) American English Conversations - Emotive & Spontaneous (3 People)” — Luel, <https://www.luel.ai/contribute> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own task board; live luel.ai/contribute lists 'American English Conversations - Emotive & Spontaneous (3 People)' at '$12/hr ($0.20/min)'. Rates change as tasks open and close.
  - verifier (scope): **scope_ok** — A posted task rate, correctly scoped to one task; board rates change.
- **c146** Open contributor tasks for low-resource-language conversations, such as Uyghur, pay US$7.50 per hour ($0.13 per minute).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **7.5 USD per hour of recording** (Luel pays contributor; posted task rate for partner conversations in Uyghur, Tibetan, Hmong and others; per hour recorded)
  - “$7.50/hr ($0.13/min) Uyghur Conversational Audio (Record with Partner)” — Luel, <https://www.luel.ai/contribute> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own task board; live luel.ai/contribute lists Uyghur, Hmong, Tibetan, Jamaican Creole and Guarani conversational audio at '$7.50/hr ($0.13/min)'.
  - verifier (scope): **scope_ok** — Live board shows the same $7.50/hr rate for Uyghur, Hmong, Tibetan, Jamaican Creole and Guarani tasks.
- **c147** Luel says contributor work is paid against a published rate card, per minute, per task or per scene.  
  _offer · vendor_stated · as of 2026-05-08 (publication)_
  - “Work is paid against a published rate card. A collection might pay per minute, per task, or per scene” — Luel, <https://www.luel.ai/blog/scaling-egocentric-video-data-pipeline> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c148** Luel says payouts are visible in the app from the moment a clip is accepted.  
  _offer · vendor_stated · as of 2026-05-08 (publication)_
  - “Payouts settle on a known cadence and are visible in the app from the moment a clip is accepted.” — Luel, <https://www.luel.ai/blog/scaling-egocentric-video-data-pipeline> · eng_blog · retrieved 2026-10-01 · quote check: exact
- **c155** Digital replicas made from contributor content, and their derivatives, are owned exclusively by Luel.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “any derivative works or outputs created therefrom shall be deemed derivative works owned exclusively by Luel” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c047** When a supplier withdraws a dataset, Luel stops selling new licences within 30 days, and licences already sold continue.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel will stop selling new licences of the affected data within 30 days of your notice” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c048** On a withdrawal or claim, Luel may remove supplier data, tell buyers, revoke their licences to it and credit them.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “remove any of your data, stop selling it, tell buyers, revoke their licences to the affected data and credit them” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c049** A supplier must tell Luel within 5 business days if a person in its data withdraws consent or asks for erasure.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “within 5 business days at most, if a person in your data withdraws consent or asks for their data to be erased” — Luel, <https://www.luel.ai/marketplace/agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** When a licence ends for any reason the buyer must delete all copies and derived data within 30 days.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “delete all copies of it and of Derived Data (including intermediate artifacts that embed the data) within 30 days” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c122** If a licence ends because of a breach of the access, use or sanctions clauses, Luel may require deletion of models trained in that breach.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel may also require you to stop using and delete any Model trained with data obtained, accessed or used in that breach” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c123** When a speaker withdraws or the law requires removal, the buyer must delete the affected recordings and derived data within 30 days.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Within 30 days you will delete them, and any Derived Data that contains or reproduces them, from all your systems” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c124** Models trained before a withdrawal notice need not be retrained or deleted.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Models trained before the notice do not need to be retrained or deleted.” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c125** For withdrawn recordings Luel credits the buyer's balance with the affected minutes at the per-minute rate paid.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “Luel adds platform credit to your purchasing balance equal to the minutes of affected audio multiplied by the per-minute rate” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c149** Once a contributor's content is sold or licensed to a business, the sale or licence is final and irrevocable.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “SUCH SALE OR LICENSE IS FINAL AND IRREVOCABLE” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c150** Luel tells contributors it cannot retrieve copies already delivered to a business.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “This Section addresses copies already delivered to a Business, which we cannot retrieve.” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c151** On a verified request, Luel stops offering the content for further licensing.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “On a verified request we stop offering the content for further licensing” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c152** On a verified request, Luel also revokes the entitlements of buyers still holding access and deletes its own copies.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “revoke the entitlements of Businesses that still hold access, and delete our own copies” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c013** Luel's marketplace page offers both licensing of existing datasets and a custom build scoped from scratch.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Explore, license, and analyze production-ready datasets or brief us on a custom build we scope from scratch.” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c014** Luel's launch post describes the business as a marketplace of completed, ready-to-license datasets.  
  _offer · vendor_stated · as of 2026-02-12 (publication)_
  - “The first is a marketplace of completed datasets, ready to license.” — Luel, <https://www.luel.ai/blog/launching-luel-yc-w26> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c015** Luel's second line is a collection engine: a vetted contributor network that produces datasets to a buyer's specification.  
  _offer · vendor_stated · as of 2026-02-12 (publication)_
  - “The second is a collection engine: a global, vetted contributor network that produces datasets to a buyer's spec” — Luel, <https://www.luel.ai/blog/launching-luel-yc-w26> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** Luel says the same pipeline fills the catalogue and runs custom collections.  
  _architecture · vendor_stated · as of 2026-02-12 (publication)_
  - “The same pipeline that fills the catalog also runs custom collections, nothing is one-off.” — Luel, <https://www.luel.ai/blog/launching-luel-yc-w26> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c017** In its Launch YC post Luel calls its catalogue side 'Off-the-shelf licensing', in which completed collections become ready-to-license catalogue datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Off-the-shelf licensing: completed collections become ready-to-license catalogue datasets” — Y Combinator (Launch YC post written by Luel founders), <https://www.ycombinator.com/companies/luel> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** In its Launch YC post Luel calls its bespoke side 'Custom collections', which it scopes, recruits, QAs and delivers to the buyer's specification.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom collections: you specify exactly what you need; we scope, recruit, QA, and deliver” — Y Combinator (Launch YC post written by Luel founders), <https://www.ycombinator.com/companies/luel> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c019** Luel's seed announcement names exclusive custom datasets built to spec as one of its three revenue streams.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “exclusive, custom datasets built to spec with custom annotations” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** Luel says each delivery grows its catalogue.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “Each delivery grows the catalog, and the catalog grows the margin.” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** The 'Scoped to order' badge on a marketplace card means Luel scopes that collection with a buyer.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Scoped to order. Luel scopes this collection with a buyer. Talk to us about scope.” — Luel, <https://www.luel.ai/marketplace> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.31
- **c059** The General Egocentric Video listing says coverage extends to custom scenes, regions and activity targets on request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “coverage extends to custom scenes, regions, and activity targets on request” — Luel, <https://www.luel.ai/datasets/egocentric-video> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c060** The Computer-Use Workflows listing says coverage extends to virtually any software on request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “coverage extends to virtually any software on request” — Luel, <https://www.luel.ai/datasets/computer-use-workflows> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c061** Luel's request form covers samples, licensing a listed dataset and commissioning a custom collection in one data request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “From samples to a licensed dataset or a custom collection.” — Luel, <https://www.luel.ai/request> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c081** Luel says it can spin up a new dataset campaign in under 24 hours.  
  _outcome · vendor_stated · as of 2026-05-15 (publication)_
  - “new dataset campaigns can be spun up in under 24 hours” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — A capability claim that only customer testimony or press could confirm; none found. The founders' own Launch YC post says submissions are 'delivered within days', not a 24-hour campaign launch. No search available.
  - verifier (scope): **scope_ok**
- **c082** For custom work, AI labs and enterprises submit a dataset specification covering modality, scenario, devices and quality rules.  
  _offer · vendor_stated · as of 2026-05-15 (publication)_
  - “AI labs and enterprises submit a dataset specification covering modality, scenario, device requirements, and quality rules.” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** On 17 September 2026 Luel announced that agent-native access to its Luel Data marketplace was available that day, showing the company trading.  
  _status · vendor_stated · as of 2026-09-17 (publication)_
  - “Agent-native access to the Luel data marketplace is available today.” — Luel, <https://www.luel.ai/blog/luel-data-marketplace-agent-native> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The 17 Sept 2026 announcement exists only on luel.ai/blog. No search available; publisher site searches (techcrunch.com, siliconangle.com, fortune.com) found no coverage of it. Separate support for 'trading': YC directory lists Luel 'Status: Active' (see luel-v001).
  - verifier (scope): **scope_ok** — Quote matches. The profile itself records a conflict (c005) with docs saying the API is off in production; that bears on the self-serve launch, not on the organisation trading.
- **c002** Luel's Terms of Service were last modified on 17 September 2026, the newest dated change found on the site.  
  _event · legal_text · as of 2026-09-17 (page_dated)_
  - “Terms of Service Last Modified: September 17, 2026” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Own ToS date. luel.ai/legal lists Terms 17 Sept 2026, Privacy 16 Sept, Data License 15 Sept, Supplier Terms 15 Sept, so 17 Sept is indeed the newest dated change there.
  - verifier (scope): **scope_ok**
- **c006** Luel says it raised US$31.2 million in seed funding, announced 15 May 2026.  
  _number · vendor_stated · as of 2026-05-15 (publication)_ · **31200000 USD** (seed round total, company-announced; no filing found; one-off)
  - “today announced it has raised $31.2 million in seed funding” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. Lightspeed's portfolio page (lsvp.com/company/luel/) confirms a Seed-stage investment in 2026 but gives no amount; General Catalyst's portfolio page does not list Luel; EDGAR company and full-text search show no Form D for Luel Inc.; techcrunch.com, siliconangle.com and fortune.com site search found no funding story.
  - verifier (scope): **scope_ok** — Correctly framed as 'Luel says'; the only source is the vendor's post.
- **c007** Luel says its seed round was led by General Catalyst and Lightspeed Venture Partners.  
  _event · vendor_stated · as of 2026-05-15 (publication)_
  - “The round was led by General Catalyst and Lightspeed Venture Partners.” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** Luel says it turned down three acquisition offers during its seed raise.  
  _outcome · vendor_stated · as of 2026-05-15 (publication)_
  - “During the raise, the company turned down three acquisition offers.” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Vendor-stated in its seed post; independent press would be the only route and none was reachable. No search available; techcrunch.com/siliconangle.com/fortune.com site search found nothing on Luel's seed.
  - verifier (scope): **scope_ok**
- **c009** Luel announced its launch on 12 February 2026 as part of the Y Combinator W26 batch.  
  _event · vendor_stated · as of 2026-02-12 (publication)_
  - “We're announcing it today as part of the Y Combinator W26 batch” — Luel, <https://www.luel.ai/blog/launching-luel-yc-w26> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c094** When a buyer accepts a new version of the DLA, it governs every corpus the buyer has already licensed.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “once you accept it, it governs every Corpus you have licensed” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c095** Luel's Terms apply from the start of a user's access, even where access began before the Terms were published.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “effective as of the start of your access to the Service, even if such access began before publication of these Terms” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact

### demand

- **c012** The Terms define the buying side ('Enterprises') as AI companies, research institutions and individual developers and researchers.  
  _terms · legal_text · as of 2026-09-17 (page_dated)_
  - “AI companies, research institutions, and individual developers and researchers seeking high-quality training datasets” — Luel, <https://www.luel.ai/terms> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c079** Luel pitches self-serve licensing at buyers frustrated by procurement threads, licence reviews and slow samples.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “still moves through a procurement thread, a licence review, and a sample that arrives weeks later” — Luel, <https://www.luel.ai/data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c080** Luel says its customers include generative AI labs, robotics companies, major social platforms, universities, hospitals and banks.  
  _outcome · vendor_stated · as of 2026-05-15 (publication)_
  - “generative AI labs, robotics companies, major social platforms, universities, hospitals, banks” — Luel, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent customer list reachable. Partial relays only: TechCrunch (28 Mar 2026) relays 'high demand from robotics and voice AI labs'; Lightspeed's portfolio page names 'Generative AI labs, robotics companies, and speech research teams'. Neither mentions social platforms, universities, hospitals or banks. No search available.
  - verifier (scope): **scope_ok**

### regulation

- **c112** The dermatology listing says images are de-identified before delivery and buyers remain responsible for their own regulatory review.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “De-identified before delivery. Buyers remain responsible for their own regulatory review before deployment.” — Luel, <https://www.luel.ai/datasets/cutaneous-medical-imagery> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c130** The DLA states that the corpus is recordings of real, identifiable people and is not anonymised.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “The Corpus is recordings of real, identifiable people. It is not anonymized.” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c131** For its own use of the corpus the buyer is an independent controller, not Luel's processor.  
  _terms · legal_text · as of 2026-09-15 (page_dated)_
  - “For your own use of the Corpus you act as an independent controller, or business, and not as a processor” — Luel, <https://www.luel.ai/data-license> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c156** Luel obtains contributors' written biometric consent at sign-up and again at each submission.  
  _terms · legal_text · as of 2026-04-24 (page_dated)_
  - “We obtain your explicit, written consent at sign-up and again at the point of each submission” — Luel, <https://www.luel.ai/biometric-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c157** Once content is licensed to a buyer, that buyer becomes an independent controller, and Luel cannot recall biometric identifiers from its systems.  
  _terms · legal_text · as of 2026-04-24 (page_dated)_
  - “Once content is licensed and transferred to an AI-company buyer, that buyer becomes an independent controller of the content.” — Luel, <https://www.luel.ai/biometric-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c158** Luel's Privacy Notice treats the transfer of contributors' sensitive data to business customers as a sale of sensitive personal data under some laws.  
  _terms · legal_text · as of 2026-09-16 (page_dated)_
  - “that transfer is treated as a sale of sensitive personal data under certain privacy laws” — Luel, <https://www.luel.ai/privacy> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Y Combinator's company directory lists Luel (Winter 2026 batch, San Francisco) as Active with a team size of 12.  
  _status · independent · as of 2026-10-01 (retrieved_only)_
  - “Team Size: 12” — Y Combinator, <https://www.ycombinator.com/companies/luel> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v002** TechCrunch reported at YC Demo Day (28 March 2026) that Luel claimed ARR of nearly US$2 million within six weeks.  
  _number · press_relayed · as of 2026-03-28 (publication)_ · **2000000 USD ARR** (company-claimed annual recurring revenue, 'nearly', relayed by press; per year)
  - “The company claims it's generating ARR of nearly $2 million within six weeks” — TechCrunch, <https://techcrunch.com/2026/03/28/from-moon-hotels-to-cattle-herding-8-startups-investors-chased-at-yc-demo-day/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **v003** TechCrunch attributed Luel's early revenue to high demand from robotics and voice AI labs.  
  _outcome · press_relayed · as of 2026-03-28 (publication)_
  - “fueled by high demand from robotics and voice AI labs” — TechCrunch, <https://techcrunch.com/2026/03/28/from-moon-hotels-to-cattle-herding-8-startups-investors-chased-at-yc-demo-day/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **v004** Lightspeed Venture Partners' portfolio page lists Luel as a Seed-stage investment made in 2026, independently corroborating Lightspeed's participation but not the round size.  
  _event · independent · as of 2026-10-01 (retrieved_only)_
  - “Stage Invested: Seed” — Lightspeed Venture Partners, <https://lsvp.com/company/luel/> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.luel.ai/data-license>, <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed>, <https://www.luel.ai/datasets/egocentric-video>, <https://www.luel.ai/datasets/music-library>
- `matrix.versioning` — not_published; tried <https://www.luel.ai/docs/data/buying>, <https://www.luel.ai/data-license>, <https://www.luel.ai/docs/data/api-reference>
- `other.scoped_vs_custom_badge` — not_published; tried <https://www.luel.ai/marketplace>, <https://www.luel.ai/marketplace/video>, <https://www.luel.ai/datasets/egocentric-gemstone-carving>
- `other.commissioned_resale_carveout` — not_published; tried <https://www.luel.ai/terms>, <https://www.luel.ai/request>, <https://www.luel.ai/legal>
- `other.contact_sales_licence` — not_published; tried <https://www.luel.ai/legal>, <https://www.luel.ai/data-license>
- `other.marketplace_production_state` — not_published; tried <https://www.luel.ai/docs/data/limits>, <https://www.luel.ai/docs/data/authentication>, <https://www.luel.ai/data/skill.md>, <https://app.luel.ai/api/v2/data/datasets>
- `other.independent_press_and_filings` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Luel%22>, <https://efts.sec.gov/LATEST/search-index?q=%22Luel%20Inc%22&forms=D>, <https://www.sec.gov/cgi-bin/browse-edgar?company=luel>
- `other.hf_ego_realm_samples` — gated; tried <https://huggingface.co/datasets/Luel-ai/Ego-Realm>
- `other.contributor_share_of_sales` — not_published; tried <https://www.luel.ai/terms>, <https://www.luel.ai/contribute>
- `other.buyer_volumes` — not_published; tried <https://www.luel.ai/blog/luel-seed-31m-general-catalyst-lightspeed>, <https://www.luel.ai/docs/data/buying>

## Conflicts

- c005, c001: Docs (undated, retrieved today) say the marketplace API is off in production; the 17 Sep 2026 blog post and dated skill.md (which prices 'every SKU on sale in production') say it is live. Treat the org as active and the self-serve launch state as uncertain. (unresolved)
- c103, c102: The English Conversational Speech listing advertises transcripts, diarization and emotion labels; the buying docs say no self-serve corpus carries any. They may describe different products (contact-sales listing vs API SKU); not reconcilable from public pages. (unresolved)
- c084, c085: Buyer Policy states a 20-hour per-dataset cap for the Licensed tier; the agent guide says the tier's order range (5-10 h) binds first, so the effective holding is 10 hours. Both limits exist. (live_primary_wins_terms)
- c150, c123: The contributor Terms say delivered copies cannot be retrieved; the buyer DLA obliges deletion within 30 days on notice. Both are true in their own frame: no technical recall, only a contractual deletion duty. (unresolved)

## Leads, not cited

- <https://www.luel.ai/docs/data/api-reference> — Full endpoint list including entitlement and version fields; downloaded, not mined in depth.
- <https://www.luel.ai/acceptable-use> — AUP (7 May 2026) incorporated by the DLA; not quoted here.
- <https://www.luel.ai/bounty> — Bounty/referral programme page; may bear on contributor pay.
- <https://www.luel.ai/blog/introducing-luel-lab> — Describes the 'multimodal QA engine'; quality-evidence detail.
- <https://www.luel.ai/lab/papers/speech-data-quality> — Speech data quality and fraud detection instruments behind the integrity pipeline.
- <https://huggingface.co/datasets/Luel-ai/imu-egocentric-250k> — Public egocentric IMU sample set (licence and card not read).
- <https://www.ycombinator.com/launches> — Original Launch YC post 'Luel: The Marketplace for Multimodal Data' linked from the YC company page.
- <https://www.luel.ai/docs/data/errors> — Error codes incl. not_eligible_for_license (contributor consent / jurisdiction), which shows consent-scope gating per buyer.
