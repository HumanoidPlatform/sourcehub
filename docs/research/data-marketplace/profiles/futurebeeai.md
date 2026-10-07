# FutureBeeAI

ai_data_catalogue · deep · status: **active** · also known as FBAI, FutureBee AI

> Rendered from `ledger/futurebeeai.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “OTS Datasets / 'Off-the-shelf' datasets, sold from the 'FBAI Datastore' (listing CTA: 'Get this AI Dataset')” and its bespoke side “Custom AI Data Collection (listing CTA: 'Request Custom Collection'); subsets and mixes of catalogue data are a 'custom package'”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c005, c006, c020, c056, c065 | FutureBeeAI grants the licence in its own name and retains IP; own-collected datasets are 'developed and owned by FutureBeeAI'. How bought-in third-party datasets are licensed is not published. |
| economics_model | principal_margin | c020, c065, c056, c040, c039 | Own-collected data is owned and sold at FutureBeeAI's price. For third-party datasets the seller page says only that pricing is discussed after approval and payment is processed; whether that is an outright purchase or a share is not published. |
| who_pays_fee | unknown |  | No fee, commission or split is published for buyers or sellers; see unknowns. |
| supply_models | own_collection, third_party_providers | c131, c048, c056, c065, c098, c113, c033, c034, c041, c079, c080 | Own crowd collection through the Yugo app is evidenced on listings; a 'Monetize Your Dataset' programme buys or licenses datasets from companies, individuals and institutions (no listing seen that is marked third-party). Freelancer/vendor providers and third-party communities are used for custom collection. No evidence found that client-commissioned data is relisted. |
| custody_model | copy_to_buyer | c091, c021, c087, c120 | Datasets sit in FutureBeeAI's AWS S3/OneDrive storage; after payment the buyer gets a custom link to the store and downloads the dataset. |
| transaction_mode | contact_sales | c050, c052, c076, c089, c090, c096 | No cart or card payment; 'Get this AI Dataset'/'Contact Us' leads to a data manager, payment by bank/wire/PayPal/Payoneer. |
| public_prices | none | c061, c010, c045 | No price found on the catalogue, the four listings opened, the FAQ, the licence or pricing articles. |
| licence_model | mixed | c005, c007, c009, c010, c011, c002 | A standard non-exclusive licence for catalogue data, with exclusive and custom licences negotiated by separate agreement; any signed agreement overrides the standard policy. |
| exclusivity_offered | yes | c009, c010, c139 | Exclusive licence available 'upon agreement' at separate pricing. |
| public_listing | public_indexable | c051, c067, c134, c047 | Catalogue and listing pages load without login and are in the sitemap. |
| buyer_vetting | unknown |  | No pre-sale buyer check is published; the licence only allows blacklisting after misuse [c025]. |
| sample_mechanics | sample_on_request | c058, c074, c133, c028 | Image and video listings say samples are 'available soon' and ask the buyer to contact FutureBeeAI; speech listings show a 'Download Sample Dataset' block (not tested, as it may need a form). The FAQ claims a free sample for every dataset. |
| versioning | mutable_latest | c059, c070, c032, c051, c067 | Listings show a 'Last updated' month and say datasets are regularly expanded; FutureBeeAI may modify or remove content at any time. What a past buyer gets on an update is not published. |
| human_subject_consent_docs | asserted_only | c055, c063, c068, c081, c135 | Listings assert written consent; consent records are said to be auditable in Yugo, but no page says consent forms or records are delivered to the buyer. |
| contributor_pay_model | one_off | c107, c106, c115, c084 | Crowd contributors are paid per completed task after quality review; no royalty or share of dataset sales is mentioned. |
| catalogue_plus_custom | both | c052, c053, c073, c119, c003 |  |
| erasure_after_sale | contractual_deletion | c024, c144, c143 | The buyer must delete all copies only on licence termination. For a contributor's consent withdrawal FutureBeeAI deletes its own copy within 7-15 working days, and says only that data already used in models is 'addressed responsibly'; no clause makes past buyers delete withdrawn data. |
| quality_evidence | operator_verified | c101, c102, c128, c038 | Quality statements come from FutureBeeAI as producer (in-app QA review, claimed multi-layer QA) and it reviews third-party submissions; no independent audit or certification of its own (see [c121]). |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | FutureBeeAI positions off-the-shelf facial data for baseline KYC and proof-of-concept work and tells buyers to start with OTS to save cost, custom when needs are specific; images are said to cost less than video. It names no buyers, volumes or sales figures. | c140, c138, c136, c047, c118, c054 |
| Q2 | partial | FutureBeeAI built its own store and runs a seller programme; a seller gets compliance review, negotiated pricing and 'customizable licensing', with no published payment basis. No listing of FutureBeeAI data on a third-party marketplace was found. | c033, c038, c039, c044, c045, c129 |
| Q3 | sourced | Most inventory is FutureBeeAI's own crowd collection through the Yugo app, owned by FutureBeeAI. Crowd workers are paid per task. A 'Monetize Your Dataset' programme takes datasets from companies, individuals and institutions that must own or hold rights to them. Freelancer/vendor providers and synthetic data also feed collection. | c131, c056, c065, c107, c113, c033, c034, c041, c043, c079, c095 |
| Q4 | partial | Custom datasets get usage rights set per contract, 'exclusive or non-exclusive depending on the agreement'; the FAQ offers data 'only for you' with no redistribution. Standard licences let FutureBeeAI resell the same data. No case of relisting commissioned data or of a disputed terms change was found. | c011, c012, c077, c008, c026 |
| Q5 | sourced | FutureBeeAI is the licensor of record: it grants the licence and retains all IP. The buyer carries data-protection compliance for its own use, and sellers must own the rights they sell. The policy has no consent warranty or indemnity clause; Indian law governs, with arbitration in Ahmedabad. | c005, c006, c020, c016, c041, c027 |
| Q6 | sourced | Datasets are held in FutureBeeAI's AWS S3/OneDrive storage. After payment the buyer gets a custom link to download a copy. Third-party sellers transfer their data to FutureBeeAI. | c120, c099, c091, c087, c021, c040 |
| Q7 | partial | Contributors consent in the app and sign project consent letters, can withdraw in Yugo, and are ID-checked. Listings assert written (or guardian) consent from people shown, but no page says consent records go to buyers. Property owners are not addressed. FutureBeeAI's own pages conflict on minors and on biometric data. | c082, c142, c145, c055, c063, c068, c135, c147, c123 |
| Q8 | sourced | Licences are non-exclusive, non-transferable and non-sublicensable by default. Exclusive licences are available by agreement. Redistribution and derivative datasets are banned, access is limited to authorised staff, and buyers must delete on termination. Enforcement is contractual (termination, legal action, blacklisting); no audit right, watermarking or fingerprinting was found. | c005, c009, c013, c014, c017, c018, c024, c025 |
| Q9 | sourced | Deals close through sales: a 'Get this AI Dataset'/Contact Us inquiry, a data manager confirming the contents, then payment by bank/wire/PayPal/Payoneer, with access about 2-3 business days after payment clears. No prices are published. FutureBeeAI sells data it owns and discounts bulk or continuing contracts. | c052, c076, c089, c090, c087, c088, c061, c093, c020 |
| Q10 | partial | A listing is an 'OTS Dataset' page with volume, participants and a last-updated month. Buyers can buy the whole dataset or a 'custom package' subset or mix. Datasets are updated in place and may be changed or removed. What a past buyer receives on an update or a withdrawal is not published. | c051, c053, c085, c086, c059, c032, c031 |
| Q11 | sourced | Samples may be used only for evaluation; image/video listings give samples on request and speech listings show a download block. A data manager confirms contents before purchase. Trust rests on FutureBeeAI's own QA and consent assertions; it holds no certifications itself, and samples are not guaranteed to match. | c028, c029, c058, c074, c133, c076, c128, c121, c030 |
| Q12 | sourced | Every 'OTS Dataset' listing pairs 'Get this AI Dataset' with 'Request Custom Collection' and lists customisation options. The licence covers both catalogue and custom-collected data. FutureBeeAI presents OTS as fast and fixed and custom as precise, and sells subsets as 'custom packages'. | c052, c053, c073, c059, c072, c003, c011, c140, c141, c085 |

## Narrative

### positioning

An Ahmedabad-based AI training-data vendor [c126] led by founder-CEO Jesal Thakkar [c127]. It sells custom collection, annotation and crowd services [c119] alongside a catalogue it says has 2,000+ datasets [c046]; the index showed 2,321 [c047]. Speech and OCR/text dominate. Image and video are mainly facial-biometric and visual-speech sets [c054][c067].

### supply

Most listings are FutureBeeAI's own crowd collections: 'developed and owned by FutureBeeAI' [c065], captured through its Yugo app [c131][c098]. The crowd is 20,000+ contributors by the join page [c113] and 10k+ by the home page [c117]. A 'Monetize Your Dataset' programme invites companies, individuals, institutions and consortia to sell datasets [c033][c034][c035][c036]. Sellers must hold the rights [c041] and pass a compliance review [c038]. Freelancer/vendor providers and third-party communities serve custom work [c079][c080], and synthetic sets are listed [c095]. No listing was seen marked as third-party supplied.

### object_model

The unit is an 'OTS Dataset' listing [c053] with volume, participants and a last-updated month [c051][c134]. Buyers can buy it whole or as a 'custom package', a subset by attributes or a mix of datasets [c085][c086]. Datasets are 'regularly updated' [c059][c070], FutureBeeAI may change or remove content [c032], and the delivered set may differ from the listing [c031]. Revision and entitlement rules are not published.

### listing

The listings opened (selfie/ID images, children's faces, US-English visual speech video, Egyptian Arabic call-centre speech) show a spec header [c051][c067][c134]. Below it come long descriptive sections on content, diversity, capture conditions, metadata, consent and customisation, then a licence line [c056][c065] and links to the licence terms [c060]. No price is shown [c061]. One video listing's licence line names a different product [c071].

### discovery

The public catalogue index filters by industry, use case, language, data type and synthetic/non-synthetic form [c049]. The count showed 2,321 results [c047]. Listings link to 'similar' datasets. The primary call to action is Contact Us [c050].

### trust

Trust is asserted rather than evidenced. Listings claim written or guardian consent [c055][c063][c068] and 'no PII' even for face videos [c069]. Samples are evaluation-only [c028][c029] and on request for image/video [c058], though the FAQ promises free samples [c074]. FutureBeeAI holds no security certifications of its own [c121]. It says consent records are auditable but does not say it hands them over [c135][c148].

### transaction

Sales-led. 'Get this AI Dataset' or Contact Us [c052][c050] leads to a data manager who confirms contents [c076]. Payment is by bank, wire, PayPal or Payoneer; no card gateway yet [c089][c090]. Access follows cleared payment [c087], generally in 2-3 business days [c088]. Raw data is priced by quote [c096].

### pricing

No prices are published [c061]. Exclusive licences are priced separately [c010] and cost more [c139]. Images are said to cost less than video [c136], and price rises with demographic targets, customisation and QC [c137]. Bulk and continuing contracts get discounts [c093]; academic and non-profit buyers are invited to ask [c092]. Seller pay is 'fair compensation' with no basis stated [c045][c039].

### licence

One published Data Usage & Licensing Policy (Feb 2025) [c001] sets Standard (non-exclusive), Exclusive and Custom licences [c007][c009][c011]. The grant is non-transferable and non-sublicensable [c005], with no redistribution or derivative datasets [c013][c014]. Models built with the data belong to the buyer [c019], and FutureBeeAI keeps IP [c006][c020]. A signed agreement overrides the policy [c002]. FutureBeeAI can change the policy unilaterally [c026]. Indian law and Ahmedabad arbitration apply [c027].

### custody

Data is stored in AWS S3 and Microsoft OneDrive [c120][c099] and processed on FutureBeeAI's own platform [c057]. The buyer receives a custom store link and downloads a copy [c091][c021]. Sellers transfer their datasets to FutureBeeAI [c040].

### vetting

Seller datasets go through a form, compliance review and approval [c037][c038], with ownership and acquisition questions [c043]. Contributors are ID-checked [c145] and bound by the Crowd Code [c112]. Yugo has in-app QA review and separate QA accounts [c101][c102]. No buyer vetting is published.

### contributor_pay

Crowd workers are paid per completed task after quality review [c107], at rates set per project [c084][c106]. The join page claims ₹70 million paid to the community [c114]. No royalty or revenue share on later dataset sales is mentioned. Repeat code violations suspend payment [c111].

### post_sale

No refund after download [c021]. The FAQ says there are no refunds at all [c094], while the licence allows discretionary refunds before access [c022]. Buyers must delete all copies on termination [c024]. A contributor who withdraws consent has data deleted within 7-15 working days [c143]. Already-used data is only 'addressed responsibly' [c144].

### catalogue_custom

Catalogue and custom share each listing: 'Get this AI Dataset' sits beside 'Request Custom Collection' [c052], and listings list custom variants [c059][c072]. The licence covers custom-collected data [c003]. Custom licences may be exclusive or not [c012], and the FAQ promises exclusive rights for data collected 'only for you' [c077].

### changes

Policies were last updated in February 2025 [c001]. The blog posted as recently as 28 September 2026 [c130]. No funding, acquisition, layoff or pricing event was found.

### demand

FutureBeeAI frames OTS data for baseline KYC and proof-of-concept work [c140] and claims 100+ completed projects [c118]. No buyer names or volumes are published.

### regulation

Indian law governs [c027], and data is mainly stored and processed in India [c124]. The buyer carries GDPR/CCPA compliance for its use [c016]. The website privacy policy says FutureBeeAI does not process biometric data [c123], yet it sells facial-biometric datasets [c054]. Third-party PII needs a Data Sharing Agreement [c122].

## Buyer journey

1. Lands on futurebeeai.com or the /dataset catalogue ('2,000+ ready-to-use datasets') and filters by industry, use case, language, type and synthetic/non-synthetic. [c046, c047, c049]
2. Opens an 'OTS Dataset' listing: header with category, volume, last-updated month and participants; long description of content, metadata, consent and customisation; a licence line; no price. [c051, c053, c056, c061]
3. Looks for a sample: image/video listings say samples are coming and to contact FutureBeeAI; speech listings show a sample download block. Samples are evaluation-only under the Terms of Use. [c058, c133, c028, c029]
4. Can read the public Data Usage & Licensing Policy linked from the listing. [c060, c001, c005]
5. Clicks 'Get this AI Dataset' (or 'Request Custom Collection') / Contact Us and fills in an inquiry form. [c052, c050]
6. A data manager confirms contents and metadata, and may cut a 'custom package' subset. Price, licence type (standard, exclusive or custom) and discounts are settled by negotiation. [c076, c085, c086, c010, c093]
7. Pays by bank transfer, wire, PayPal or Payoneer; no card checkout. [c089, c090]
8. Once payment clears (generally 2-3 business days), receives a custom link to FutureBeeAI's store and downloads the dataset with metadata under the licence. No refund after download. [c087, c088, c091, c021]

## Claims

### positioning

- **c046** FutureBeeAI says its catalogue holds 2,000+ ready-to-use datasets across audio, video, image and text.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2000 datasets (lower bound)** (vendor-stated catalogue size across all modalities; as of retrieval)
  - “Unlock 2,000+ ready-to-use diverse datasets across mutiple modalities like audio, video, image, and text” — FutureBeeAI, <https://www.futurebeeai.com/dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Vendor-stated catalogue size. No independent count exists on any reachable page: no Hugging Face organisation (API search for 'futurebee' returns nothing), 0 EDGAR hits, 0 arXiv hits, no press linked from the vendor's site; no search available. For context only (vendor source, not independent): futurebeeai.com/sitemap.xml on 2026-10-01 held 2,659 URLs containing '/dataset/', which is consistent with 2,000+.
  - verifier (scope): **scope_ok** — Quote is on /dataset as cited and matches the vendor_stated framing.
- **c119** FutureBeeAI leads with custom AI data collection among its services, alongside annotation, transcription, evaluation and crowd-as-a-service.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Collecting real-world speech, text, image, video, and multimodal data tailored to your AI needs-globally and at scale.” — FutureBeeAI, <https://www.futurebeeai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c126** FutureBeeAI is based in Ahmedabad, Gujarat, India.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “A-501, The Capital, Science City Road, Sola 380060,” — FutureBeeAI, <https://www.futurebeeai.com/about-futurebeeai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c127** FutureBeeAI's founder and CEO is Jesal Thakkar.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Jesal Thakkar Founder & CEO” — FutureBeeAI, <https://www.futurebeeai.com/about-futurebeeai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c033** FutureBeeAI runs a 'Monetize Your Dataset' programme inviting outside parties to sell AI training datasets through it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Have a dataset? Monetize it with FutureBeeAI!” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The programme page (/sell-ai-assets) is on the vendor's site. No independent evidence was found that any third party actually sells through it; no search available.
  - verifier (scope): **scope_wrong** — The page does not say outside parties sell THROUGH FutureBeeAI to buyers. Its process ends with 'Secure data transfer & payment processing', and it requires sellers to 'own or have rights to sell the data'. This reads as FutureBeeAI buying or licensing the data in, as the profile's own supply_models note says ('buys or licenses datasets'). The business model (purchase, consignment or revenue share) is not stated. The statement should say FutureBeeAI invites outside parties to sell or license datasets TO it. Whether that is third_party_providers or partner_licensed stays unknown.
- **c034** FutureBeeAI's seller page names companies that have legally acquired proprietary datasets as eligible sellers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Businesses that have legally acquired proprietary datasets and wish to monetize them.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c035** Individuals such as researchers and data professionals who have collected structured data are also eligible to sell datasets to FutureBeeAI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Researchers, data professionals, AI enthusiasts who have collected structured data.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** Universities, research institutions, industry groups and multi-institution consortia are also invited to sell datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Universities, research institutions, and industry groups with high-quality datasets.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** FutureBeeAI says its off-the-shelf datasets are built by a global community.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “built by a global community for high-performance AI training, evaluation, and testing.” — FutureBeeAI, <https://www.futurebeeai.com/dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** FutureBeeAI says it can facilitate custom collection through a global network of data providers when a requirement is unusual.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We can also facilitate the custom collection through our global network of data providers” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c079** FutureBeeAI says it keeps a database of freelancer and vendor data providers it onboards for custom projects.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have a huge network of freelancer and vendor data providers with their specific details in our database.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c080** FutureBeeAI also draws on third-party communities for collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have access to many third-party communities as well” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c095** FutureBeeAI says synthetic datasets are listed in its store and it builds custom synthetic data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have already listed various synthetic datasets on the store” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c097** Holders of image, speech, text or video training data are directed to a 'sell your data' option.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “you can always reach out to us via the 'sell your data' option” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c098** FutureBeeAI describes Yugo as its own mobile application for data collection.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We have Yugo which is a mobile application for all kinds of data collection needs.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c100** Yugo is presented as FutureBeeAI's platform for custom speech data collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Meet Yugo - the streamlined platform built to simplify and scale custom speech data collection.” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c110** Contributors must not share or sell collected data to third parties.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “No sharing or selling collected data to third parties.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c113** FutureBeeAI says its crowd community has 20,000+ contributors in 50+ countries.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **20000 crowd contributors (lower bound)** (vendor-stated community size on the join page; cumulative, as of retrieval)
  - “20,000+ Contributors 50+ Countries” — FutureBeeAI, <https://www.futurebeeai.com/join-ai-community> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent count of contributors reachable (no search available; 0 EDGAR/arXiv hits). The only third-party metric found is Google Play's install band for the crowd app Yugo, '5K+ Downloads' (2026-10-01), which neither confirms nor contradicts 20,000+ contributors (contributors may use other channels). Note the vendor's own figures disagree: /join-ai-community says 20,000+ contributors while the home page says 'Global crowd of 10k+' (c117).
  - verifier (scope): **scope_ok** — Quote is on /join-ai-community. The profile already records the conflict with the home page's 10k+ (c117).
- **c116** Contributors are matched to projects in data collection, annotation and transcription after creating a profile.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We connect you with cutting-edge AI tasks in data collection, annotation, transcription, and beyond.” — FutureBeeAI, <https://www.futurebeeai.com/join-ai-community> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c117** The home page states a global crowd of 10k+.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **10000 crowd members (lower bound)** (vendor-stated on home page; as of retrieval)
  - “Global crowd of 10k+” — FutureBeeAI, <https://www.futurebeeai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Home-page marketing figure; no independent source reachable (no search available). It conflicts with the vendor's own /join-ai-community figure of 20,000+ contributors (c113); the two should be recorded as a conflict rather than both stated as fact.
  - verifier (scope): **scope_ok** — Quote is on the home page as cited.
- **c129** The contact page invites dataset holders to partner and earn by selling data, alongside the buyer inquiry form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Partner with us and earn by selling your data for AI advancements.” — FutureBeeAI, <https://www.futurebeeai.com/contact-us> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c131** A speech listing states all its data was collected using Yugo, FutureBeeAI's proprietary platform, tying the catalogue to FutureBeeAI's own crowd collection.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All data was collected using “Yugo,” FutureBeeAI’s proprietary platform” — FutureBeeAI, <https://www.futurebeeai.com/dataset/speech-dataset/bfsi-call-center-conversation-arabic-egypt> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The Play Store listing (developer: FutureBeeAI) confirms Yugo is FutureBeeAI's own collection app, but its description is written by the vendor. That a given speech listing was collected with Yugo is vendor_only.
    - “Yugo is SAAS product by FutureBeeAI for all kind of speech data collection project for AI” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote is on the Egyptian Arabic BFSI call-centre listing. It covers that listing only; the statement says 'a speech listing', which is correctly scoped.

### object_model

- **c031** The Terms of Use say the final delivered dataset may differ from the listing based on the buyer's requirements.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Final dataset may have changes based on your requirement or preferences.” — FutureBeeAI, <https://www.futurebeeai.com/policies/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c032** FutureBeeAI reserves the right to modify, update or remove any listed content at any time.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Modify, update, or remove any Content at any time.” — FutureBeeAI, <https://www.futurebeeai.com/policies/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c059** The listing says the dataset is regularly updated and can be customised (environment, lighting, resolution, annotation, device).  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “this dataset is regularly updated and can be customized” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c070** The visual speech listing says the dataset is regularly updated with new videos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “our dataset is regularly updated with new videos in various real-world conditions.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c085** Buyers can buy a 'custom package': part of a large dataset or a mix of several datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You can ask for a small part of the big dataset or maybe a mix of the various dataset” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c086** Buyers can have a custom package cut from a catalogue dataset by attributes such as age, gender, country or accent.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “choose the custom package according to any available attributes like age, gender etc.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c103** Yugo exports metadata including user details, device information, data links, QA details and final status.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Visualize user details, device information, speech data links, QA details, and final status.” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c051** A catalogue listing (South Asian Selfie & ID Card Image Dataset) shows category, total volume, last-updated month and number of participants at the top.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Total volume 56K+ images Last Updated July 2025 Number of participants 8K+ people” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c054** The South Asian Selfie & ID Card dataset pairs five selfies with two face images extracted from government-issued ID cards per person.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “2 clear facial images extracted from different government-issued ID cards” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** The listing links to the licence terms and FAQs from its details panel.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Read the License Terms Browse FAQs” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** FutureBeeAI lists an off-the-shelf facial image dataset of children under 18 from South Asian countries.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This dataset features high-quality facial images of children under 18 from across South Asian countries.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-minor-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** The American English Visual Speech Dataset lists 1,000+ videos from 200+ participants, last updated August 2024.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Total Volume 1,000+ Videos Last updated Aug 2024 Number of participants 200+” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c134** The speech listing header shows volume in speech hours, the last-updated month and participant count.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Total Volume 40 Speech Hours Last updated June 2025” — FutureBeeAI, <https://www.futurebeeai.com/dataset/speech-dataset/bfsi-call-center-conversation-arabic-egypt> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c047** The catalogue index page showed a filter result count of 2,321 datasets when retrieved.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2321 datasets listed** (count shown beside the catalogue filter, all categories; as of retrieval)
  - “Filter ( 2321 )” — FutureBeeAI, <https://www.futurebeeai.com/dataset> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A filter result count on the vendor's own catalogue page exists only there. The vendor's sitemap (2,659 '/dataset/' URLs on 2026-10-01) is in the same range but is also a vendor source and counts pages, not datasets.
  - verifier (scope): **scope_ok** — 'Filter ( 2321 )' is on /dataset. The page does not label the number as datasets; reading it as the unfiltered result count is reasonable. For comparison, the vendor sitemap held 2,659 '/dataset/' URLs on 2026-10-01.
- **c049** The catalogue can be filtered by industry, use case, language, data type (audio, text, image, video) and data form (synthetic or non-synthetic).  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Type Audio Text Image Video Data Form Synthetic Non-Synthetic” — FutureBeeAI, <https://www.futurebeeai.com/dataset> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c004** Dataset samples, metadata and descriptions are outside the licence policy and are governed by the website Terms of Use for pre-purchase evaluation only.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “This Policy does not cover dataset samples, metadata, attribute details, or descriptions” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** FutureBeeAI may blacklist buyers who make unauthorised use of datasets.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “FutureBeeAI may also blacklist Buyers who engage in unauthorized use of datasets.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** Under the Terms of Use, downloaded samples, descriptions and metadata may be used only to evaluate a dataset before purchase.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “You may only download and use the Content for evaluation purposes” — FutureBeeAI, <https://www.futurebeeai.com/policies/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** The Terms of Use forbid using samples or other site content for research, AI training, model development or commercial applications.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Use any Content for research, AI training, model development, or commercial applications.” — FutureBeeAI, <https://www.futurebeeai.com/policies/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c030** FutureBeeAI does not guarantee that dataset descriptions, samples or metadata will fully match the purchased dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “FutureBeeAI does not guarantee that dataset descriptions, samples, or metadata will fully match final purchased datasets.” — FutureBeeAI, <https://www.futurebeeai.com/policies/terms-of-use> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c055** The South Asian Selfie & ID Card listing states every participant gave written consent aware of the intended uses; no consent document is offered to the buyer on the page.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every participant provided written consent, with full awareness of the intended uses of the data” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Wording (and an absence) on a vendor listing page; exists only there.
  - verifier (scope): **scope_ok** — Quote is on the South Asian selfie & ID listing (Last Updated July 2025). The page offers 'Read the License Terms' and 'Browse FAQs' links but no consent document, which supports the stated absence.
- **c058** Instead of a downloadable sample, the listing says samples will be available soon and asks the buyer to contact FutureBeeAI for samples.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contact us to get the samples immediately for this dataset.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** For the children's facial dataset, the listing states each participant's guardian gave informed written consent outlining the use cases.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Every participant’s guardian provided informed, written consent, clearly outlining the dataset’s use cases.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-minor-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c064** The children's dataset listing states personally identifiable information is not shared and only anonymised metadata is included.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Personally identifiable information is not shared. Only anonymized metadata is included.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-minor-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** The visual speech video listing states written signed consent was obtained from all participants.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “obtaining written signed consent of all participants” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** The visual speech video listing asserts the dataset contains no personally identifiable information about any participant.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The dataset does not include any personally identifiable information about any participant, making it safe to use.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** The visual speech listing's licence paragraph names a different product ('Image Captioning Dataset'), a template error in the listing text.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This US English Language Image Captioning Dataset, created by FutureBeeAI, is available for commercial use.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c074** The FAQ says a free sample is always available for every datastore dataset, via a 'download sample' button or on request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You can always get a free sample of all datasets listed on the datastore.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c075** The FAQ says the sample dataset is an identical part of the full dataset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The sample dataset is an identical part of the entire dataset.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c081** FutureBeeAI says it takes written consent from each data provider before collecting any data.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We take proper written consent from each data provider prior to collecting any kind of data.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c082** FutureBeeAI says it has a platform for getting project-specific NDAs and consent letters signed by data providers.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “we have a platform to get the NDA and consent letter signed for that particular type of data” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c104** A contributor testimonial published on the Yugo page refers to the app's built-in consent feature.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Yugo's inbuilt consent feature is like a pro.” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c105** The Yugo page offers downloadable sample speech datasets with metadata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Download sample speech datasets including scripted prompt recordings, two-person conversational recordings” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c108** Contributors collecting data must obtain informed consent from participants.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Participants must give informed consent.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c109** The Crowd Code of Ethics prohibits recording individuals without consent.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Recording individuals without consent is strictly prohibited.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c121** FutureBeeAI does not itself hold GDPR/SOC 2/ISO 27001-type certifications, relying on its cloud providers' certifications.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “While we are not certifying these standards directly as a data host” — FutureBeeAI, <https://www.futurebeeai.com/policies/data-security-and-compliance> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c132** The speech listing asserts the dataset complies with global data privacy guidelines and is copyright-free.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The Dataset complies with global data privacy guidelines and is copyright-free.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/speech-dataset/bfsi-call-center-conversation-arabic-egypt> · docs · retrieved 2026-10-01 · quote check: exact
- **c133** Speech listings carry a 'Download Sample Dataset' block offering a free sample, alongside a contact option.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Download a free sample of this dataset to get more clarity about this set!” — FutureBeeAI, <https://www.futurebeeai.com/dataset/speech-dataset/bfsi-call-center-conversation-arabic-egypt> · docs · retrieved 2026-10-01 · quote check: exact
- **c135** FutureBeeAI says its Yugo system captures contributor consent evidence and keeps consent records auditable; the article does not say the records are given to buyers.  
  _architecture · vendor_stated · as of 2025-11-29 (page_dated)_
  - “consent records remain auditable throughout the data lifecycle” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/contributor-consent-evidence-buyers> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c142** Contributors can withdraw consent through a consent-management section in their Yugo account.  
  _architecture · vendor_stated · as of 2025-12-09 (page_dated)_
  - “Log into your Yugo account and locate the consent management section.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/withdraw-consent-data-collection> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c146** FutureBeeAI says each consent record is linked to the contributor's unique ID.  
  _architecture · vendor_stated · as of 2025-12-25 (page_dated)_
  - “Each consent record is linked to the contributor’s unique ID for accountability.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/futurebeeai-contributor-identity-consent> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c148** FutureBeeAI says it maintains transparency through auditability and provenance documentation.  
  _terms · vendor_stated · as of 2025-10-16 (page_dated)_
  - “FutureBeeAI maintains transparency through auditability and provenance documentation” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/ai-data-provider-pricing-comparison> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c050** The catalogue index offers a 'Contact Us' call to action rather than a cart or checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “built by a global community for high-performance AI training, evaluation, and testing. Contact Us” — FutureBeeAI, <https://www.futurebeeai.com/dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** A FutureBeeAI data manager confirms the data, metadata and contents with the buyer before purchase.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our data manager will confirm everything before your purchase about the data you will receive” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c087** For an already-available dataset, the buyer gets access once payment has cleared.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “you will get the access to dataset once the fund is cleared” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c088** FutureBeeAI says access to a purchased dataset generally takes 2-3 business days after payment.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **3 business days from payment to dataset access (upper end of stated 2-3)** (vendor FAQ; off-the-shelf datasets in the already-available format; per order)
  - “It generally takes 2-3 business days.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **vendor_only** — A delivery-time promise in the vendor's own FAQ; no buyer-side or independent source is reachable without search.
  - verifier (scope): **quote_incomplete** — The quote 'It generally takes 2-3 business days.' has no subject. The full FAQ answer (in the page's FAQPage JSON-LD, collapsed in the visible page) reads 'you will get the access to dataset once the fund is cleared. Once we receive the payment you will instantly get access'. The 2-3 days therefore reads as fund clearance before access, and applies only to datasets 'in the already available format'; a mix of datasets 'may take some more time'. The statement is a fair summary, but the quote should include 'once the fund is cleared'.
- **c089** FutureBeeAI accepts payment by bank transfer, wire transfer, PayPal and Payoneer.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “bank transfer, wire transfer, PayPal, and Payoneer” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c090** The FAQ says a card payment gateway is not yet integrated.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We are will integrate a payment gateway soon so then you can pay through your card also.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c096** Raw data without annotation is priced by quote.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We will share the respective quote for that and make the package for you.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data

### pricing

- **c010** An Exclusive licence is subject to a separate agreement with its own pricing and licensing terms.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Subject to a separate agreement, pricing, and licensing terms.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c039** Pricing and licensing terms for a third-party dataset are discussed with the seller only after approval, so seller terms are negotiated per dataset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If approved, we will discuss pricing and licensing terms.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c045** FutureBeeAI promises sellers 'fair compensation' but publishes no payment basis, split or rate for purchased datasets.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We help you monetize your AI training datasets while ensuring compliance and fair compensation.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c061** No price appears on the South Asian Selfie & ID Card listing; the details panel lists demographic, volume, format, device and resolution only.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Minimum Resolution 480p Annotation NA” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c092** FutureBeeAI invites academic, research and non-profit users to ask for special terms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We are always here to support academic, research and non-profit use.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c093** FutureBeeAI offers discounts on large batch purchases and continuous contracts.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If you want to purchased huge batch data we always have discounts for you.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c136** FutureBeeAI's pricing article says static image datasets generally cost less than video datasets.  
  _terms · vendor_stated · as of 2025-12-08 (page_dated)_
  - “Static image datasets are generally less expensive than video datasets” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/dataset-pricing-factors> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c137** FutureBeeAI's pricing article says demographic diversity targets, customisation, QC/compliance and volume drive dataset price.  
  _terms · vendor_stated · as of 2025-12-08 (page_dated)_
  - “Dataset pricing increases when projects require specific or underrepresented demographics.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/dataset-pricing-factors> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c139** FutureBeeAI's licensing article says exclusive licences typically cost more than non-exclusive ones.  
  _terms · vendor_stated · as of 2025-12-06 (page_dated)_
  - “Exclusive licenses typically involve higher costs but offer greater control and strategic freedom.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/facial-recognition-licensing-models> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c001** FutureBeeAI's Data Usage & Licensing Policy (the 'AI Data License Agreement' page) governs the use and licensing of every dataset bought from FutureBeeAI.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “governs the usage and licensing of datasets purchased from FutureBeeAI” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c002** The standard licence policy yields to any specific agreement signed between the buyer and FutureBeeAI where the two conflict.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “any specific agreement signed between the Buyer and FutureBeeAI shall supersede these clauses in case of any conflicts” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** FutureBeeAI grants buyers a non-exclusive, non-transferable, non-sublicensable licence to use a purchased dataset for the approved use cases.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “grants the Buyer a non-exclusive, non-transferable, non-sublicensable license to use the purchased dataset” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c006** FutureBeeAI retains all intellectual property in datasets it licenses unless a signed agreement says otherwise, making it the licensor of record.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “FutureBeeAI retains all intellectual property rights over the dataset unless explicitly stated otherwise” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in the vendor's own licence terms. Related wording in its Terms of Use (Feb 2025) covers only site content: 'All Content, including dataset descriptions, samples, metadata, and attribute information, remains the intellectual property of FutureBeeAI.'
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote stops before the condition the statement relies on. The page reads '...rights over the dataset unless explicitly stated otherwise in a signed agreement.' The preceding sentence, 'The license does not transfer ownership of the dataset to the Buyer', supports the licensor-of-record point. Neither is in the quote.
- **c007** Under the Standard (non-exclusive) licence a dataset may be used for internal research, AI/ML training and product development.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “The dataset may be used for internal research, AI/ML training, and product development.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c008** Under the Standard licence FutureBeeAI may sell the same dataset to other buyers.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “FutureBeeAI may sell the same dataset to other buyers.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c009** FutureBeeAI offers an Exclusive licence, upon agreement, under which no other party gets access to the same dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “The dataset is sold exclusively to the Buyer, and no other party will have access to the same dataset.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A licence option stated only on the vendor's own pages.
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote does not show the 'upon agreement' condition. The heading 'B. Exclusive License (Upon Agreement)' or the next line, 'Subject to a separate agreement, pricing, and licensing terms.', would show it. The source is the Feb 2025 licence policy.
- **c013** Buyers may not resell, share, sublicense or publicly distribute a dataset, including on open-source platforms.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Datasets cannot be resold, shared, sublicensed, or publicly distributed, including open-source platforms.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c014** Buyers may not alter a dataset and resell it as a derivative dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Buyers cannot alter the dataset and resell it as a derivative dataset.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** The licence bars use in discriminatory AI models, illegal surveillance or unethical applications.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “No use in discriminatory AI models, illegal surveillance, or unethical applications.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** The buyer is responsible for ensuring its use of a dataset complies with GDPR, CCPA and other applicable data protection law.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “The Buyer is responsible for ensuring their use of the dataset complies with GDPR, CCPA, or any other applicable regulations.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Buyers must limit dataset access to authorised personnel within their organisation.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Access to the dataset should be limited to authorized personnel within the Buyer’s organization.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** Buyers must notify FutureBeeAI immediately of any unauthorised access or misuse of a dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “If unauthorized access or misuse occurs, the Buyer must notify FutureBeeAI immediately.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c019** Insights, models and products derived from a dataset belong to the buyer provided they do not expose or distribute the original dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Any insights, models, or products derived from the dataset belong to the Buyer” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Datasets remain FutureBeeAI's sole property unless an exclusive licence is granted in writing.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “All datasets remain the sole property of FutureBeeAI unless an exclusive license is granted in writing.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c044** FutureBeeAI tells sellers they can choose how their data is used through customisable licensing agreements.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Choose how your data is used with customizable licensing agreements.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** The South Asian Selfie & ID Card listing states the dataset was developed by FutureBeeAI and is available for commercial use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This dataset is developed by FutureBeeAI and is available for commercial use.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** The children's dataset listing states the data is developed and owned by FutureBeeAI and available for commercial licensing.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “This dataset is developed and owned by FutureBeeAI and is available for commercial licensing.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-minor-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Wording on a vendor listing page; exists only there.
  - verifier (scope): **scope_ok** — Quote is on the minor facial-images listing as cited. That listing also says every participant's guardian gave written consent.
- **c066** Listings say custom licensing agreements are available for enterprise, academic or research use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom licensing agreements are available for enterprise, academic, or research use.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-minor-south-asian> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c040** The final seller step is secure data transfer and payment processing, meaning the seller's data is transferred to FutureBeeAI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Secure data transfer & payment processing.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** The listing's images were stored and processed on FutureBeeAI's own platform.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All images were securely stored and processed on FutureBeeAI’s proprietary platform” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c091** After payment the buyer receives a custom link to FutureBeeAI's store to get the dataset and metadata.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “you will get the custom link to our store where you will receive the final dataset” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
  - verifier (blind): **vendor_only** — Delivery mechanics described only in the vendor's own FAQ.
  - verifier (scope): **scope_ok** — The full answer reads 'As soon as the payment is received you will get the custom link to our store where you will receive the final dataset as per the agreement along with all metadata.' The text sits in the FAQ's collapsed content and its FAQPage JSON-LD (page dateModified 2025-05-05). A quote checker that reads only the visible text may miss it.
- **c099** The FAQ says FutureBeeAI's data infrastructure is built on AWS S3.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “FutureBeeAI data infrastructure is built on the AWS S3 cloud” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c120** FutureBeeAI's data security policy says all datasets are stored in AWS S3 and Microsoft OneDrive.  
  _architecture · legal_text · as of 2025-02 (page_dated)_
  - “All datasets are securely stored in AWS S3 and Microsoft OneDrive” — FutureBeeAI, <https://www.futurebeeai.com/policies/data-security-and-compliance> · legal_terms · retrieved 2026-10-01 · quote check: exact

### vetting

- **c037** The first step for a dataset seller is to submit dataset details through a web form.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Submit your dataset details via our form.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** FutureBeeAI's team reviews and verifies a submitted dataset's compliance before it is accepted.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our team reviews and verifies dataset compliance.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c041** Sellers must own or have the rights to sell the data they submit.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You must own or have rights to sell the data.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c042** Seller datasets may contain personal information only with proper consent.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “No personal information unless with proper consent.” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** The seller intake form asks whether the seller has exclusive ownership of the dataset and how it was collected or acquired.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Do you have exclusive ownership of the dataset?” — FutureBeeAI, <https://www.futurebeeai.com/sell-ai-assets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c101** Yugo has an in-app review workflow for reviewing, validating and approving recordings.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Review, validate, and approve recordings within the app to maintain high data quality standards at every step.” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c102** Yugo's admin console issues separate credentials to recorders and quality-assurance (QA) users per project.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “generating unique account credentials for recorders and quality assurance (QA) users” — FutureBeeAI, <https://www.futurebeeai.com/ai-data-platform/yugo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c112** Contributors must acknowledge and comply with the Crowd Code before joining any project.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “All contributors must acknowledge and comply before participating in any project.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c128** FutureBeeAI claims a multi-layer '100%' quality assurance process for every dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “our multi-layer 100% quality assurance process guarantee the highest accuracy and reliability in every dataset” — FutureBeeAI, <https://www.futurebeeai.com/about-futurebeeai> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c145** FutureBeeAI says contributors submit government-issued ID at onboarding, validated to prevent impersonation.  
  _architecture · vendor_stated · as of 2025-12-25 (page_dated)_
  - “Contributors submit government-issued identification, which is securely validated to prevent impersonation and misuse.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/futurebeeai-contributor-identity-consent> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c147** FutureBeeAI's contributor-verification article says participation of minors is prohibited, particularly for sensitive or regulated projects.  
  _terms · vendor_stated · as of 2025-12-25 (page_dated)_
  - “Participation of minors is prohibited, particularly for sensitive or regulated data projects.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/futurebeeai-contributor-identity-consent> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c084** Pay rates for data providers depend on data type, complexity and client requirements; no rate card is published.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Pay rate totally depends on the type of data, the complexity of data, client requirements and many other factors.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c106** FutureBeeAI's Crowd Code of Ethics says contributor payment rates are communicated upfront with no hidden conditions.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Payment rates are clearly communicated upfront, with no hidden conditions.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c107** Crowd contributors are paid on completion of tasks after quality review, not per later sale of the data.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Payments are processed on time based on quality review and task completion.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Vendor-written Play Store description; it supports task-based pay only. Nothing on it speaks to payment after quality review or to the absence of per-sale royalties. No contributor testimony reachable without search.
    - “earn some money in the extra time by doing various exciting speech based tasks” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Crowd Code of Ethics (Feb 2025): 'Payments are processed on time based on quality review and task completion.' The document never mentions royalties or revenue share, so 'not per later sale' is a recorded absence, which is acceptable. The FAQ adds that pay rate 'totally depends on the type of data, the complexity of data, client requirements'.
- **c111** Repeated violations of the Crowd Code lead to removal from projects and suspension of payment.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Repeated Violations: Project removal and payment suspension.” — FutureBeeAI, <https://www.futurebeeai.com/policies/crowd-code-of-ethics> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c114** FutureBeeAI says its community has earned 70 million rupees in total.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **70000000 INR paid to crowd contributors** (vendor-stated cumulative community earnings; gross, all task types; cumulative to retrieval)
  - “₹70 Millions Earned by Our Community” — FutureBeeAI, <https://www.futurebeeai.com/join-ai-community> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Total contributor earnings are stated only by the vendor (/join-ai-community shows '₹70 Millions'). No filing, registry or press source reachable; no search available.
  - verifier (scope): **scope_ok** — Page reads '₹70 Millions Earned by Our Community'. The value's basis says 'gross, all task types'; the page states neither, so the basis should be 'not stated'.
- **c115** The join page promises fair compensation for every task a contributor completes.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “We ensure fair compensation for every task you complete-no hidden conditions.” — FutureBeeAI, <https://www.futurebeeai.com/join-ai-community> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c021** FutureBeeAI gives no refunds once a dataset has been accessed or downloaded.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “refunds are not provided once a dataset has been accessed or downloaded” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** If a buyer cancels before accessing a dataset, FutureBeeAI may refund at its discretion.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “If a Buyer cancels before accessing the dataset, FutureBeeAI may offer a refund at its discretion.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** If a dataset misses agreed specifications the buyer may request a resolution, but refunds are not guaranteed.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “If a dataset does not meet agreed-upon specifications, Buyers may request a resolution, but refunds are not guaranteed.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** On termination of the licence the buyer must delete all copies of the dataset.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “The Buyer must delete all copies of the dataset upon termination of the license.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c083** Data providers can delete their account at any time and ask for their information to be removed.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “user can delete their respective account at any time and also ask for removing the information” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c094** The FAQ states that refunds are not an option.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Refund is not an option with us.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c125** Under the privacy policy, users can request deletion of their data at any time via privacy@futurebeeai.com.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Users can request data deletion at any time by contacting privacy@futurebeeai.com” — FutureBeeAI, <https://www.futurebeeai.com/policies/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c143** After a contributor withdraws consent, FutureBeeAI says it deletes or anonymises the data within 7 to 15 working days.  
  _number · vendor_stated · as of 2025-12-09 (page_dated)_ · **15 working days (upper bound of stated 7-15) to delete or anonymise withdrawn contributor data** (vendor-stated handling of a contributor's consent withdrawal; FutureBeeAI-held copies only; per request)
  - “FutureBeeAI deletes or anonymizes the data within 7 to 15 working days” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/withdraw-consent-data-collection> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A retention commitment exists only in the vendor's own policies. Note: the vendor's Privacy Policy (Last Updated Feb 2025) gives no timeframe; it says only that users may request deletion by contacting privacy@futurebeeai.com and that data no longer required is deleted or anonymised. The 7-15 working day figure must come from another vendor page; see the scope verdict.
  - verifier (scope): **scope_ok** — The knowledge-hub article (dated 9 Dec 2025) says 'Once withdrawal is confirmed, FutureBeeAI deletes or anonymizes the data within 7 to 15 working days'. It covers FutureBeeAI's own copy only, as the value's basis says. It is a marketing article, not a policy: the Privacy Policy (Feb 2025) gives no timeframe.
- **c144** On withdrawal, FutureBeeAI says only that data already used in models is 'addressed responsibly'; no obligation on past buyers to delete is described.  
  _terms · vendor_stated · as of 2025-12-09 (page_dated)_
  - “FutureBeeAI ensures that data already used in models is addressed responsibly.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/withdraw-consent-data-collection> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c003** The licence policy expressly covers custom-collected datasets gathered at a buyer's request as well as catalogue datasets.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Custom-collected datasets (specially collected as per Buyer’s request).” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c011** For a Custom Dataset License (data collected or processed specifically for a buyer) the usage rights are set in the contract.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “If a dataset is specifically collected or processed for a Buyer, usage rights will be defined in the contract.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** A custom dataset licence can be exclusive or non-exclusive depending on the agreement, so commissioned data is not automatically exclusive to the client.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Can be exclusive or non-exclusive depending on the agreement.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** Each listing carries two calls to action: 'Get this AI Dataset' and 'Request Custom Collection'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Get this AI Dataset Request Custom Collection” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Button labels on the vendor's own listing pages.
  - verifier (scope): **scope_wrong** — corrected to: Image listings carry 'Get this AI Dataset' and 'Request Custom Collection'; speech listings carry 'Get this Speech Dataset', a 'Download' button and 'Request Custom Collection'. — The statement says 'each listing', but the quote comes from one image listing. The Egyptian Arabic BFSI speech listing (re-fetched 2026-10-01) reads 'Get this Speech Dataset Download Request Custom Collection', so the buy label differs by modality. The pairing of a buy action with a custom-collection action does hold. The profile's catalogue_custom section repeats the 'Get this AI Dataset' wording as universal.
- **c053** FutureBeeAI calls a catalogue listing an 'OTS Dataset' (off-the-shelf).  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “About This OTS Dataset” — FutureBeeAI, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian> · docs · retrieved 2026-10-01 · quote check: exact
- **c072** The visual speech listing offers custom collection of similar data in any language or on specific devices.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Similar dataset can be prepared in any specific language.” — FutureBeeAI, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset> · docs · retrieved 2026-10-01 · quote check: exact
- **c073** FutureBeeAI's FAQ calls its catalogue the 'FBAI Datastore' and says listed datasets are available for all kinds of commercial use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “datasets listed on the FBAI Datastore is available for all kind of commercial use” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c077** For custom collection a client can ask for data collected only for it, with all rights and no redistribution.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “You will get all the rights of the data and no redistribution of data will be done.” — FutureBeeAI, <https://www.futurebeeai.com/faqs-and-guides> · docs · retrieved 2026-10-01 · quote check: exact_in_data
- **c138** FutureBeeAI advises buyers to start with off-the-shelf datasets where feasible to manage cost.  
  _terms · vendor_stated · as of 2025-12-08 (page_dated)_
  - “Start with off-the-shelf datasets where feasible, limit customization to what your model truly needs” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/dataset-pricing-factors> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c141** FutureBeeAI describes OTS datasets as fixed in size and scope.  
  _terms · vendor_stated · as of 2025-12-07 (page_dated)_
  - “Fixed in size and scope. Scaling beyond what is available may not be possible.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/ots-vs-custom-facial-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c026** FutureBeeAI may change the licence policy at any time, and continued use of the dataset after an update counts as acceptance.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Continued use of the dataset after updates constitutes acceptance of the revised terms.” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c130** FutureBeeAI is operating: its blog index shows a post dated 28 September 2026.  
  _status · vendor_stated · as of 2026-09-28 (page_dated)_
  - “Read full blog 28 September 2026” — FutureBeeAI, <https://www.futurebeeai.com/blog> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Confirms the status part only: FutureBeeAI's crowd app Yugo (developer shown as FutureBeeAI) was updated on Google Play on 29 Sep 2026, so the company is visibly operating. The blog post date itself exists only on the vendor's site. No corporate event (funding, layoffs, acquisition) could be looked for without web search: EDGAR full-text search for "FutureBeeAI" returns 0 hits, arXiv returns 0, CourtListener refused (403), and no press or investor page is linked from the vendor's site. Indian press and the MCA company registry could not be reached by navigation (no search available).
    - “Updated on Sep 29, 2026” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The blog index shows 'Read full blog 28 September 2026' (re-fetched 2026-10-01). The status claim rests only on the vendor's own blog; the Google Play update of 29 Sep 2026 (futurebeeai-v001) gives an independent second leg.

### demand

- **c118** The home page states 100+ designed and completed projects.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 completed projects (lower bound)** (vendor-stated on home page; cumulative)
  - “100+ Designed and completed projects” — FutureBeeAI, <https://www.futurebeeai.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Home-page marketing figure; the vendor names no clients whose sites could be checked, and no search available.
  - verifier (scope): **scope_ok** — Quote is on the home page as cited. It is vendor-stated; the statement says 'the home page states', which is correctly framed.
- **c140** FutureBeeAI positions OTS facial datasets for general-purpose use such as baseline KYC or proof-of-concept, and custom datasets for specialised needs.  
  _terms · vendor_stated · as of 2025-12-07 (page_dated)_
  - “Best suited for general-purpose applications such as baseline KYC or proof-of-concept facial recognition.” — FutureBeeAI, <https://www.futurebeeai.com/knowledge-hub/ots-vs-custom-facial-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c027** The licence policy is governed by Indian law with arbitration in Ahmedabad, Gujarat.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “governed by the laws of India, and disputes will be resolved through arbitration in Ahmedabad, Gujarat” — FutureBeeAI, <https://www.futurebeeai.com/policies/ai-data-license-agreement> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c122** FutureBeeAI says it does not process third-party PII unless a formal Data Sharing Agreement is executed.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “We do not collect or process third-party Personally Identifiable Information (PII) unless a formal Data Sharing Agreement” — FutureBeeAI, <https://www.futurebeeai.com/policies/data-security-and-compliance> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c123** FutureBeeAI's website privacy policy lists biometric data (including facial recognition data) among the sensitive data it says it does not collect or process.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “Biometric Data (fingerprints, facial recognition, voiceprints)” — FutureBeeAI, <https://www.futurebeeai.com/policies/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c124** FutureBeeAI's privacy policy says it primarily stores and processes data in India and may transfer it internationally.  
  _terms · legal_text · as of 2025-02 (page_dated)_
  - “FutureBeeAI primarily stores and processes data in India but may transfer data internationally” — FutureBeeAI, <https://www.futurebeeai.com/policies/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Google Play shows FutureBeeAI's crowd collection app Yugo as updated on 29 September 2026, independent evidence that the company is operating.  
  _status · independent · as of 2026-09-29 (page_dated) · scope: Yugo (Android)_
  - “Updated on Sep 29, 2026” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v002** Google Play shows 5K+ downloads for FutureBeeAI's Yugo collection app, the only third-party measure of crowd reach found; it neither confirms nor contradicts the vendor's 10k+ or 20,000+ contributor figures.  
  _number · independent · as of 2026-10-01 (retrieved_only) · scope: Yugo (Android), Google Play, all regions_ · **5000 app installs (lower bound of Google Play band)** (Google Play install band for the Android app only; excludes iOS and web contributors; cumulative, as of retrieval)
  - “5K+ Downloads” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v003** The developer's Google Play data-safety declaration for Yugo states that no data is shared with third parties, while listing personal info and audio among the data the app collects.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Yugo (Android)_
  - “No data shared with third parties” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - “This app may collect these data types Personal info, Audio, and Device or other IDs” — Google Play, <https://play.google.com/store/apps/details?id=com.futurebeeai.yugo&hl=en&gl=US> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://www.futurebeeai.com/sell-ai-assets>, <https://www.futurebeeai.com/policies/ai-data-license-agreement>, <https://www.futurebeeai.com/faqs-and-guides>
- `matrix.buyer_vetting` — not_published; tried <https://www.futurebeeai.com/policies/ai-data-license-agreement>, <https://www.futurebeeai.com/policies/terms-of-use>, <https://www.futurebeeai.com/contact-us>
- `other.third_party_seller_terms` — gated; tried <https://www.futurebeeai.com/sell-ai-assets>, <https://www.futurebeeai.com/contact-us>
- `other.third_party_listings_identified` — not_published; tried <https://www.futurebeeai.com/dataset>, <https://www.futurebeeai.com/sitemap.xml>
- `other.commissioned_data_relisted` — js_empty; tried <https://www.futurebeeai.com/case-studies/visual-speech-data-collection-for-emotion-recognition>, <https://www.futurebeeai.com/case-studies/facial-image-data-collection>
- `other.yugo_faq_answers_storage` — js_empty; tried <https://www.futurebeeai.com/ai-data-platform/yugo>
- `other.consent_records_delivered_to_buyer` — not_published; tried <https://www.futurebeeai.com/knowledge-hub/contributor-consent-evidence-buyers>, <https://www.futurebeeai.com/policies/ai-data-license-agreement>, <https://www.futurebeeai.com/dataset/image-dataset/facial-images-selfie-id-south-asian>
- `other.licence_warranty_indemnity` — not_published; tried <https://www.futurebeeai.com/policies/ai-data-license-agreement>
- `other.past_buyer_rights_on_update` — not_published; tried <https://www.futurebeeai.com/policies/ai-data-license-agreement>, <https://www.futurebeeai.com/policies/terms-of-use>, <https://www.futurebeeai.com/faqs-and-guides>
- `other.property_owner_releases` — not_published; tried <https://www.futurebeeai.com/policies/crowd-code-of-ethics>, <https://www.futurebeeai.com/dataset/multi-modal-dataset/american-english-visual-speech-dataset>
- `other.company_counters` — js_empty; tried <https://www.futurebeeai.com/>, <https://www.futurebeeai.com/about-futurebeeai>
- `other.corporate_events_and_independent_press` — not_found; tried <https://www.futurebeeai.com/blog>, <https://www.futurebeeai.com/sitemap.xml>, <https://huggingface.co/api/datasets?search=futurebee>
- `other.third_party_marketplace_presence` — not_found; tried <https://huggingface.co/FutureBeeAI>, <https://huggingface.co/api/datasets?search=futurebee>
- `other.speech_sample_download_gate` — gated; tried <https://www.futurebeeai.com/dataset/speech-dataset/bfsi-call-center-conversation-arabic-egypt>

## Conflicts

- c094, c022: The FAQ says refunds are never an option; the Feb 2025 licence policy (legal text) allows a discretionary refund before the dataset is accessed. The licence governs. (live_primary_wins_terms)
- c074, c058: The FAQ promises a free sample for every dataset, but the image and video listings opened offer samples only on request ('available soon'); speech listings do show a sample download block. (unresolved)
- c147, c062, c063: A Dec 2025 article says minors may not participate, particularly in sensitive projects, yet the catalogue sells a children's facial dataset collected with guardian consent. (unresolved)
- c123, c054: The website privacy policy says FutureBeeAI does not collect or process biometric data; the catalogue sells facial-biometric datasets. The policy may be scoped to website visitors only; it does not say so explicitly. (unresolved)
- c113, c117: Crowd size is given as 20,000+ on the join page and 10k+ on the home page; neither is dated. (unresolved)
- c069, c067: The visual speech video listing says the dataset has no personally identifiable information, although it consists of face videos of identifiable participants. (unresolved)

## Leads, not cited

- <https://www.futurebeeai.com/case-studies> — Case study bodies are client-rendered and did not load; they may show whether commissioned collections later became OTS listings.
- <https://www.futurebeeai.com/policies/ai-ethics-and-responsible-ai-policy> — Listed on the policies index as 'AI Ethics & Responsible AI Policy'; its link did not appear among the index page hrefs, so it was not fetched.
- <https://www.linkedin.com/company/futurebeeai/> — Company page linked from the site footer; may carry headcount or company events. Not fetched (login wall).
- <https://www.mca.gov.in/> — Indian company registry filings would give incorporation date and financials; needs a CIN and captcha, not reachable without search.
- <https://www.futurebeeai.com/knowledge-hub/facial-data-consent-form> — Describes what FutureBeeAI thinks a facial consent form should contain; could inform DataMind360's release form design.
