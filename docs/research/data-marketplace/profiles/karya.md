# Karya

crowd_capture · light · status: **active** · also known as DAIA Tech Pvt. Ltd., Karya Inc.

> Rendered from `ledger/karya.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Data Catalogue; 'off-the-shelf AI data infrastructure' (Project Apollo); 'Foundational datasets'; 'Karya marketplace' (older case study)” and its bespoke side “Custom data solutions (Data Collection / data generation services)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c020, c022, c006 | Datasets are 'purchased from us' (DAIA Tech Pvt. Ltd.) and are Karya's own collections; no dataset licence is published, so licensor of record is inferred from the refund policy. |
| economics_model | principal_margin | c006, c031, c020 | Karya funds or commissions collection and sells its own datasets; no third-party sellers or commission seen. |
| who_pays_fee | not_applicable |  | No third-party sellers are listed; Karya sells its own inventory, so there is no marketplace fee. |
| supply_models | own_collection, commissioned_nonexclusive | c006, c007, c031, c034 | Own collection: Project Apollo. Commissioned then resold: KHPT tuberculosis speech data. No third-party provider listings seen. |
| custody_model | unknown |  | Samples sit in a Karya Google Cloud Storage bucket; how full datasets are delivered is not published. |
| transaction_mode | contact_sales | c038, c015 | The catalogue has no price or cart; egocentric data is by email to sales. (Platform by Karya tooling has 'Buy Now' plans, but that is not dataset sales.) |
| public_prices | none | c018, c019 | No dataset price appears in the catalogue data or on any page read. Only the Platform by Karya tooling has published prices. |
| licence_model | unknown |  | No dataset licence is published; the website T&C cover site use only. No 'Karya Public License' page found. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c018, c017 | An anonymous visitor sees every catalogue entry with its specifications and sample links; the entries are rendered client-side from a public JS file. |
| buyer_vetting | unknown |  |  |
| sample_mechanics | free_sample_download | c017, c034, c043 | Speech samples download without login from a public GCS bucket (confirmed 200 on 2026-10-01); the egocentric sample is a Google Drive folder that asks for a Google sign-in. |
| versioning | unknown |  |  |
| human_subject_consent_docs | unknown | c037 | Karya says consent is built into its worker platform, but nothing says what, if anything, a buyer receives. |
| contributor_pay_model | mixed | c032, c024, c002, c025 | Workers are paid wages per task (vendor says about 20x minimum wage) and, at least for the KHPT dataset, are promised royalties on re-sales; royalty rate and mechanism unpublished. |
| catalogue_plus_custom | both | c011, c012, c006 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | unknown | c027 | Listings show only hours, speakers and gender ratio. A >95% SLA is claimed for datasets Karya creates, on the services page, not on listings. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers named are AI labs, big tech, foundations and government (Anthropic, Microsoft, Google, Gates, Maharashtra), mostly for custom work; catalogue units are hours of speech and on-request egocentric video. Why buyers choose catalogue over custom is not stated. | c039, c040, c014, c016, c019 |
| Q2 | partial | Karya sells through its own catalogue (earlier called the 'Karya marketplace'); no evidence of listing on third-party marketplaces. | c031, c018 |
| Q3 | sourced | Inventory comes from Karya's own crowd workforce: self-funded collections (Project Apollo) and data first collected for clients and then resold (KHPT TB speech). Rights terms for either are not published. | c006, c008, c030, c031, c034, c003 |
| Q4 | partial | For the KHPT/USAID project Karya stated up front that the dataset would be resold after KHPT's use, and a matching TB dataset is now in the catalogue. The contract carve-out itself is not public, and no dispute was found. | c031, c034, c030 |
| Q5 | partial | Datasets are bought from Karya (DAIA Tech Pvt. Ltd.), which appears to be licensor of record; no warranty, consent or indemnity terms for datasets are published. | c020, c022, c023 |
| Q6 | partial | Samples are hosted by Karya in a public Google Cloud Storage bucket; delivery of full datasets is not described. | c017 |
| Q7 | partial | Karya says worker consent is built into its platform and promises capturing workers royalties on re-sales; nothing covers consent from depicted persons or property owners in egocentric video. | c037, c032, c024 |
| Q8 | partial | No dataset licence is published. The only public terms are the website T&C and a no-refund-after-delivery policy; Apollo is described as 'publicly available' without a named licence. | c023, c007, c020 |
| Q9 | partial | Deals close through sales contact (catalogue 'Connect with us', egocentric by email to sales); Karya owns the inventory, so there is no commission. Delivered datasets cannot be refunded. | c038, c015, c020, c021 |
| Q10 | partial | A catalogue entry is a dataset record (language, type, hours, speakers, gender ratio, domain, sample link); orders are final once delivered. Revisions and entitlements are not described. | c018, c020 |
| Q11 | partial | Buyers see summary stats and can download free samples; Karya claims a >95% SLA on datasets it creates. | c017, c018, c027 |
| Q12 | sourced | Karya runs custom data solutions and a Data Catalogue of foundational or off-the-shelf datasets; client-commissioned collections feed the catalogue, and Project Apollo is its largest self-funded off-the-shelf build. | c011, c012, c006, c031, c029 |

## Claims

### positioning

- **c001** Karya's impact page, live on 2026-10-01, reports its platform figures as of July 2026, showing the organisation still operating.  
  _status · vendor_stated · as of 2026-07 (page_dated)_
  - “Data is as of July 2026, per internal platform data.” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The impact page itself was live on 2026-10-01 and does say 'As of July 2026' (vendor page, not independent). No independent source dated after April 2026 was reachable. The newest independent items found by navigation are the Berkeley Haas case 'Karya: Elevating Ethical Data for AI' (2025-10-01, cases.haas.berkeley.edu) and Karya-affiliated arXiv papers from late 2025, which are too old for the six-month rule. No newer dated event such as funding, layoffs or a restructuring was found. Microsoft Research's Project Karya page says the research project 'was spun off as an impact-focused startup'. CourtListener returned 403. WebSearch is not available in this run, and that is the main reason this stays unverifiable.
  - verifier (scope): **scope_ok** — The quote is the impact page's own footnote ('Data is as of July 2026, per internal platform data.') and supports the statement. The organisation's status rests only on its own live page.

### supply

- **c003** Karya says it has onboarded more than 200,000 workers on the Karya Platform, as of July 2026.  
  _number · vendor_stated · as of 2026-07 (page_dated)_ · **200000 workers onboarded (lower bound)** (vendor-stated cumulative onboarding count; cumulative to July 2026)
  - “200k+ workers onboarded on the Karya Platform” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent 2026 worker count was reachable. Older figures for context: TIME (2023-07-27), relaying Karya, says 'some 30,000 rural Indians'. Karya's own 2024 report (reports.karya.in/2024) says '50,000+ Workers engaged'. The jump to 200k+ 'onboarded' may count onboarded rather than paid or engaged workers, and nothing independent separates the two. No search available.
  - verifier (scope): **scope_ok** — Quote matches. The page says 'onboarded', which counts sign-ups, not paid or active workers. The 2024 report says '50,000+ Workers engaged', so the two counts measure different things.
- **c006** In Q1 2026 Karya launched Project Apollo, which it calls its largest investment in off-the-shelf AI data infrastructure to date.  
  _event · vendor_stated · as of 2026 (publication)_
  - “Karya launched Project Apollo, its largest investment in off-the-shelf AI data infrastructure to date.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/project-apollo/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The launch event is stated only on Karya's Project Apollo case study ('In Q1 2026, Karya launched Project Apollo'). No independent report of it was reachable by navigation: Karya's pages link to no press about it, and the Anthropic newsroom index and Microsoft Research's Karya news page have nothing on it. No search available.
  - verifier (scope): **scope_wrong** — Two problems. (1) The quote leaves out 'In Q1 2026', the date in the statement; the page reads 'In Q1 2026, Karya launched Project Apollo'. (2) For matrix.economics_model, which the profile sets to principal_margin: the same page says Apollo is building 'one of India's largest publicly available multilingual conversational speech corpora' and names no buyer or price. The impact page also says the Vaani dataset 'has been open-sourced'. So c006 shows Karya investing in its own data, not selling it at its own price. TIME 2023 ('sells data to big tech companies and other clients at the market rate'; see karya-v001) is better evidence for principal_margin.
- **c007** Karya describes Project Apollo as building one of India's largest publicly available multilingual conversational speech corpora; the page states no licence or access terms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “building one of India's largest publicly available multilingual conversational speech corpora for AI research” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/project-apollo/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** Karya says Project Apollo created 100,000 hours of transcribed conversational speech across India's 22 Scheduled Languages.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100000 hours of transcribed conversational speech** (corpus size stated by the vendor; the same page says 15 languages are already in production, so the total may be a target; project total)
  - “100,000 hours of transcribed conversational speech across India's 22 Scheduled Languages” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/project-apollo/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c030** Karya's tuberculosis case study describes collecting speech data with KHPT and USAID to build a voice-based TB knowledge app for KHPT.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Karya is working with the Karnataka Health Promotion Trust (KHPT) and USAID to create a voice-based tuberculosis knowledge app” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/first-tuberculosis-chatbot/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c031** Karya says that once the KHPT speech dataset has been collected, validated and used for KHPT's app, the same dataset will be sold on the Karya marketplace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “once collected, validated, and used for the KHPT app, the same dataset will be available for sale on the Karya marketplace” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/first-tuberculosis-chatbot/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — TIME (Billy Perrigo, 2023-07-27) reports the plan for the Kannada tuberculosis speech recordings collected 'for an Indian healthcare NGO'. TIME does not name KHPT. The KHPT link comes from KHPT's own press page (khpt.org/press/), which lists 'Karya, NGO create Kannada Q&A bot for TB' (Times of India, March 19, 2024). WebFetch refuses timesofindia.indiatimes.com, so that article was not read. Note that TIME reports a plan as of 2023 and says the recordings will 'also' be sold. It does not say the sale waits until KHPT has used the data.
    - “The recordings will also go up for sale on Karya's platform as part of its Kannada dataset” — TIME, <https://time.com/6297403/the-workers-behind-ai-rarely-see-its-rewards-this-indian-startup-wants-to-fix-that/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote matches the case-study sentence for the KHPT dataset. The page carries no date, and it does not appear among the 10 titles on the current /case-studies/ index, so it is an older, unlinked page. That makes as_of 'retrieved_only' generous: TIME reported the same plan on 2023-07-27.
- **c033** For the KHPT project Karya planned to employ 100 people (50 men, 50 women) in each of 10 Karnataka districts to record speech with the Karya app.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 workers per district, in 10 districts** (planned workforce for one commissioned project; vendor-stated; project total)
  - “employing 100 individuals (50 men and 50 women) each in 10 districts across Karnataka to collect speech data using the Karya app” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/first-tuberculosis-chatbot/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c018** A catalogue entry shows language, type, hours, speaker count, gender ratio and domain, and has no price field.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “language:"Telugu",type:"Conversational",hours:"219",speakerCount:"566",genderRatio:{male:.28,female:.71,other:.01}” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c013** Karya's homepage advertises large-scale conversational datasets across 22 official Indian languages.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Large-scale conversational datasets across 22 official Indian languages” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c014** Karya advertises egocentric work and life datasets for physical-world and embodied AI.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Egocentric work and life datasets for physical-world and embodied AI systems.” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c016** The catalogue's egocentric video entry gives its size as 'On Request' and lists capture devices GoPro, smartphone, head-mounted and neck-mounted.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “hours:"On Request",domain:"On-Demand (GoPro; SmartPhone; HeadMounted; NeckMounted)"” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact
- **c019** The catalogue lists a Hindi general dual-channel conversational dataset of 2,000 hours from 1,900+ speakers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2000 hours of conversational speech** (size of one catalogue dataset; no price given; one-off)
  - “language:"Hindi",type:"Conversational",hours:"2000",speakerCount:"1900+",domain:"General Dual Channel Conversations"” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact
- **c034** The public catalogue lists a Kannada read-speech dataset on questions related to tuberculosis: 629.61 hours from 604 speakers, with a sample download.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **629.61 hours of read speech** (size of one catalogue dataset; no price given; one-off)
  - “language:"Kannada",type:"Read Speech",hours:"629.61",speakerCount:"604",domain:"Questions related to Tuberculosis"” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A catalogue listing is by nature on the vendor site only. I checked it directly: the karya.in catalogue JS bundle (chunk 4648) has entry id 18, language Kannada, type 'Read Speech', hours '629.61', speakerCount '604', domain 'Questions related to Tuberculosis'. Its sample link, storage.googleapis.com/karyadata-catalogue-samples/domain_specific_speech/kn_R_1807.tgz, returned HTTP 200 (2,456,382 bytes) on 2026-10-01. TIME (2023-07-27) independently describes the underlying Kannada TB speech collection but gives no hours or speaker count.
  - verifier (scope): **quote_incomplete** — The quote shows language, type, hours, speakers and domain but not the sample download in the statement. The words that would show it come right after it in the same object: downloadLink:"https://storage.googleapis.com/karyadata-catalogue-samples/domain_specific_speech/kn_R_1807.tgz". That URL returned HTTP 200 on 2026-10-01.

### trust

- **c017** Catalogue entries carry a public sample download link hosted in a Karya Google Cloud Storage bucket named karyadata-catalogue-samples.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “storage.googleapis.com/karyadata-catalogue-samples/telugu_agent_guided_conversations/Telugu_Conversational_Sample.zip” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is a fact about the vendor's own catalogue. Checked directly: the karya.in catalogue bundle (chunk 4648) has 60 entries, and 54 carry a downloadLink. Of those, 45 point to storage.googleapis.com/karyadata-catalogue-samples/ and 9 point to Google Drive folders, including the Egocentric video entry. So 'catalogue entries carry a ... link hosted in karyadata-catalogue-samples' holds for most entries, not all.
  - verifier (scope): **scope_wrong** — The statement claims more than is true. The quote shows a single entry (Telugu). In the same bundle, 45 of the 60 catalogue entries link to karyadata-catalogue-samples. Nine link to Google Drive folders: ids 1-8, the Assamese, Kannada, Bodo, Manipuri, Gujarati, Malayalam, Punjabi and Tamil conversational sets, plus 16, Egocentric video. Six have no sample link at all: ids 9, 10 and 12-15, including the 2,000-hour Hindi set in c019. The profile's sample_mechanics note ('Speech samples download without login from a public GCS bucket; the egocentric sample is a Google Drive folder') is wrong in the same way.
- **c037** Karya's 2025 report says its platform architecture includes safeguards covering worker consent, wages and grievance handling; it does not say whether buyers receive consent records.  
  _offer · vendor_stated · as of 2025 (publication)_
  - “safeguards covering consent, wages, and grievance handling” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2025/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is about what Karya's own report says and leaves out. Checked: a WebFetch read of reports.karya.in/2025 says consent, wages and grievance handling 'form the shared set of safeguards' across Platform by Karya deployments. Nothing found there or on the catalogue about giving consent records to buyers.
  - verifier (scope): **scope_wrong** — The quoted words come from a sentence about partner deployments abroad: 'Project teams in Kenya and Ethiopia are designing tasks, onboarding workers, and managing quality and payments within a shared set of safeguards covering consent, wages, and grievance handling.' It describes Platform by Karya projects run by other teams. It is not a statement about the architecture behind Karya's own India collections or catalogue datasets. It supports nothing about consent for the catalogue's data, which leaves human_subject_consent_docs even weaker than the profile suggests.
- **c043** The catalogue's egocentric video entry links its sample to a Google Drive folder rather than to Karya's public sample bucket.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “downloadLink:"https://drive.google.com/drive/folders/1-WsQ6eoJ3SAcRmQmoNOv4Qd_IUzuGNGl?usp=sharing"” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact

### transaction

- **c015** The homepage's 'Explore Egocentric Datasets' link is a mailto link to sales@karya.in with the subject 'Egocentric datasets inquiry', not a listing or checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Explore Egocentric Datasets” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is a link on the vendor's own homepage. Checked directly on 2026-10-01: 'Explore Egocentric Datasets' points to mailto:sales@karya.in?subject=Egocentric+datasets+inquiry.
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote is only the anchor text. The mailto target, 'mailto:sales@karya.in?subject=Egocentric+datasets+inquiry', sits in the href attribute, which a text-matching quote check cannot show. Say so in the statement, or quote the visible contact text instead.
- **c038** The Data Catalogue page's only call to action is 'Connect with us', linking to the contact page; there is no cart or checkout.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Let's build better AI, together. Connect with us” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/data-catalogue/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c041** Platform by Karya, its self-serve data-task tooling, lists a Basic plan at INR 4.99 per month with a Buy Now button; this is a tooling price, not a dataset price.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **4.99 INR** (Platform by Karya Basic plan, paid by the platform customer; figure looks nominal and may be placeholder; per month)
  - “4.99₹ Every month To get the first impression of our capabilities” — Karya (DAIA Tech Pvt. Ltd.), <https://platform.karya.in/plans-pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact

### licence

- **c022** The karya.in website is operated by DAIA Tech Pvt. Ltd., which with its licensors owns the IP in the site's material.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “DAIA Tech Pvt. Ltd. and/or its licensors own the intellectual property rights for all material on” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/legal/terms-and-conditions/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** Karya's published terms and conditions license only personal use of the website's material; no dataset licence is published.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “for your own personal use subjected to restrictions set in these terms and conditions” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/legal/terms-and-conditions/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This concerns the vendor's own terms. Checked directly: karya.in/legal/terms-and-conditions/ licenses access 'for your own personal use' and contains no dataset licence. platform.karya.in links only to the same T&C and privacy policy. No other published dataset licence was found by navigation; karya.in/sitemap.xml returns 404.
  - verifier (scope): **scope_ok** — The quote covers the personal-use licence. The absence of a dataset licence is properly put in the statement, and I confirmed it on platform.karya.in, which links only to the same T&C and privacy policy.

### vetting

- **c027** Karya says it guarantees a greater than 95% SLA on all datasets it creates.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Karya guarantees > 95% SLA on all datasets that we create assuring error-free data.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/data-services/generation/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c002** Karya says it has distributed USD 4.42M in wages directly to its workers, cumulatively, as of July 2026.  
  _number · vendor_stated · as of 2026-07 (page_dated)_ · **4420000 USD** (cumulative wages paid by Karya directly to workers; vendor-stated, internal platform data; cumulative to July 2026)
  - “$4.42M wages directly distributed to Karya workers” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source for the July 2026 cumulative wage figure was reachable. The only independent dated wage figure is older: TIME (Billy Perrigo, 2023-07-27) wrote 'Karya says it has paid out 65 million rupees (nearly $800,000) in wages to some 30,000 rural Indians'. That is relayed and fits the growth trend, but it does not test USD 4.42M. No search available.
  - verifier (scope): **scope_ok** — The figure is quoted exactly. The July 2026 date comes from the same page's footnote (quoted in c001), and as_of carries it.
- **c004** Karya says workers' average annual income rose 25.8% in FY2025-26 because of Karya, a figure it bases on self-reported baselines.  
  _outcome · vendor_stated · as of 2026-07 (page_dated)_
  - “25.8% average increase in worker annual income enabled by Karya (FY2025–26)” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent evaluation of the 25.8% figure was found. A J-PAL search for 'karya' finds only an earlier RCT whose partner was 'Project Karya at Microsoft Research', about women's take-up of flexible gig work. That study reports no income-change figure for FY2025-26. The Haas case abstract says only 'above-market wages and royalties'. No search available.
  - verifier (scope): **quote_incomplete** — The quote supports the 25.8% figure but not the 'self-reported baselines' part of the statement. The impact page footnote that would show it reads 'Calculated on a baseline established through self-reported surveys from workers'.
- **c005** Karya says wages it distributed to workers grew 6.8 times year on year from 2024 to 2025.  
  _number · vendor_stated · as of 2026-07 (page_dated)_ · **6.8 multiple of prior-year wages distributed** (vendor-stated, total worker wages 2025 vs 2024; per year)
  - “6.8x YoY increase in wages distributed to workers, 2024 to 2025” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c009** Karya says Project Apollo engages 60,000 workers with a target of USD 2.5 million in direct worker wages.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2500000 USD** (target direct wages to workers for the whole project, paid by Karya; vendor-stated; project total)
  - “Project Apollo engages with 60,000 workers across India, with a target of USD 2.5 million in direct worker wages.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/project-apollo/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Project Apollo appears only on karya.in/case-studies/project-apollo/, which names no partner or funder and links to nothing outside Karya. A WebFetch read of Karya's 2025 year-end report found no 'Apollo' branding there either. No press, partner or funder page reachable by navigation mentions it. No search available.
  - verifier (scope): **scope_ok** — The quote states both numbers for Project Apollo.
- **c010** Karya says USD 2M has been disbursed to date through Project Apollo.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **2000000 USD** (disbursed to date through the project (recipients not stated on the page); vendor-stated; cumulative to retrieval)
  - “$2M disbursed to date through Project Apollo” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/project-apollo/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** A UC Berkeley Haas case abstract (October 2025) states that Karya provides workers above-market wages and royalties, without describing the royalty mechanism.  
  _offer · academic · as of 2025-10-01 (publication)_
  - “It provides above-market wages and royalties, supporting both professional growth and higher-skilled data work.” — UC Berkeley Haas School of Business (case abstract), <https://cases.haas.berkeley.edu/2025/10/karya/> · academic · retrieved 2026-10-01 · quote check: exact
- **c025** Karya's end-of-year report says it pays workers nearly 20 times the Indian minimum wage.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “By paying our workers nearly 20 times the Indian minimum wage” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2023> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c026** Karya's end-of-year report says it redirects the majority of client revenue to its workers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “redirecting the majority of client revenue to our workers” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2023> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** Karya says workers who collected the KHPT tuberculosis speech data will receive royalties on any future re-sales of that dataset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “with workers receiving royalties on any future data re-sales” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/first-tuberculosis-chatbot/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — TIME (2023-07-27) is more specific than the claim. It says 100% of resale revenue goes to the contributing workers, 'apportioned by the hours they put in'. It refers to the Kannada TB recordings within Karya's Kannada dataset. This is a plan reported in 2023, and no source shows payouts actually made. The Haas case abstract (2025-10-01) also says Karya 'provides above-market wages and royalties'.
    - “Every time it's resold, 100% of the revenue will be distributed to the Karya workers who contributed to the dataset” — TIME, <https://time.com/6297403/the-workers-behind-ai-rarely-see-its-rewards-this-indian-startup-wants-to-fix-that/> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote ends the same sentence as c031 on the KHPT case-study page. TIME 2023 adds the mechanism, 100% of resale revenue apportioned by hours worked (see karya-v002). The profile lists that as unknown under other.royalty_rate_and_mechanism.
- **c035** Karya's 2025 end-of-year report says cumulative wages distributed to workers passed USD 3.2 million by the end of 2025.  
  _number · vendor_stated · as of 2025 (publication)_ · **3200000 USD** (cumulative wages distributed to workers; vendor-stated; cumulative to end 2025)
  - “bringing cumulative wages distributed to over USD 3.2 million” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2025/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — A WebFetch read of Karya's 2025 report (reports.karya.in/2025) does give 'USD 3.2 million' in cumulative direct wages, but that is the vendor's own page. No independent or relayed restatement was reachable. No search available.
  - verifier (scope): **scope_ok** — The full sentence in the 2025 year-end report reads: 'Wages directly distributed to our communities grew 6.8× year-on-year, bringing cumulative wages distributed to over USD 3.2 million.'
- **c042** Karya's 2024 end-of-year report states workers were paid 20 times the Indian minimum wage.  
  _number · vendor_stated · as of 2024 (publication)_ · **20 multiple of Indian minimum wage** (worker pay relative to statutory minimum wage; vendor-stated, method not given; not stated)
  - “20x Indian minimum wage paid” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2024> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Microsoft Research incubated Karya and is a partner, so its video description repeats the 20x claim without testing it. Independent press gives only one worker's case: TIME (2023-07-27) reports a worker earning 'an hourly wage of about $5, nearly 20 times the Indian minimum'. That is one example, not a platform-wide rate.
    - “employing rural Indians at 20x the minimum wage to build ethical datasets for low-resourced languages” — Microsoft Research, <https://www.microsoft.com/en-us/research/video/karya-is-creating-ethical-ai-datasets-and-lifting-rural-indians-from-poverty/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The 2024 report headline tile reads '20x Indian minimum wage paid'. It gives no method and no basis (an average, a typical task rate, or a top rate). The 2023 report says 'nearly 20 times' (c025), and TIME 2023 illustrates it with one worker earning about $5/hour.

### post_sale

- **c020** Karya's refund policy says services or datasets, once delivered, cannot be refunded or cancelled.  
  _terms · legal_text · as of 2023-05-01 (page_dated)_
  - “Once our services or datasets are delivered to you, they cannot be refunded or cancelled.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/legal/refund-and-cancellation/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is a clause in the vendor's own refund policy. It is live at karya.in/legal/refund-and-cancellation/ ('Once our services or datasets are delivered to you, they cannot be refunded or cancelled', operator DAIA Tech Pvt. Ltd., last updated May 1, 2023).
  - verifier (scope): **scope_ok** — The quote supports the refund term. Used for matrix.operator_role, it shows only that datasets are 'purchased from us' (DAIA Tech Pvt. Ltd., see c021). It says nothing about licence terms, so 'reseller_licensor' remains an inference.
- **c021** Karya's refund policy lets a buyer cancel a purchased service or dataset only if it has not yet been delivered.  
  _terms · legal_text · as of 2023-05-01 (page_dated)_
  - “You may cancel any service or dataset you purchased from us if they have already not been delivered.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/legal/refund-and-cancellation/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c011** Karya offers custom data solutions including domain-specific transcription, localised translation and multimodal dataset creation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Custom data solutions for the frontier of AI, including domain-specific transcription, localised translation, and multimodal” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c012** Karya offers foundational datasets and evaluation benchmarks designed for India alongside its custom work.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Foundational datasets and evaluation benchmarks designed for India's linguistic, cultural, and operational complexity” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c028** Karya's data generation service supports speech, text, image and video data tasks.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our platform is capable of supporting a variety of data tasks including speech, text, image and video data.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/data-services/generation/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** Karya's custom data generation designs collection strategies tailored to each client's goals.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Our experts design data generation strategies tailored to your specific goals and industry requirements.” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/data-services/generation/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c036** Karya's 2025 report lists egocentric data collection among its growing lines of work, alongside conversational speech, transcription and evaluations.  
  _event · vendor_stated · as of 2025 (publication)_
  - “conversational speech data, transcription, evaluations, and egocentric data collection” — Karya (DAIA Tech Pvt. Ltd.), <https://reports.karya.in/2025/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c039** Karya's case studies list Anthropic as a client, for evaluating AI across agriculture and law using community and expert input.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Evaluating AI Across Agriculture and Law Using Community and Expert Input Text Anthropic” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c040** Karya lists Project Vaani, mapping India's linguistic diversity, as speech work for Google.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Mapping India's Linguistic Diversity with Project Vaani Speech Google” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/case-studies/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** TIME reported in July 2023 that Karya sells data to big tech companies and other clients at the market rate.  
  _offer · independent · as of 2023-07-27 (publication)_
  - “it sells data to big tech companies and other clients at the market rate” — TIME, <https://time.com/6297403/the-workers-behind-ai-rarely-see-its-rewards-this-indian-startup-wants-to-fix-that/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **v002** TIME reported in July 2023 that each time the Kannada tuberculosis recordings are resold, 100% of the revenue is to go to the Karya workers who contributed, apportioned by hours worked.  
  _terms · independent · as of 2023-07-27 (publication) · scope: Kannada TB speech dataset, India_
  - “Every time it's resold, 100% of the revenue will be distributed to the Karya workers who contributed to the dataset” — TIME, <https://time.com/6297403/the-workers-behind-ai-rarely-see-its-rewards-this-indian-startup-wants-to-fix-that/> · independent_press · retrieved 2026-10-01 · quote check: exact
- **v003** Karya says the Project Vaani dataset, made with 48,000 workers, has been open-sourced.  
  _offer · vendor_stated · as of 2026-07 (page_dated) · scope: Project Vaani dataset, India_
  - “which has been open-sourced to support the development of more inclusive and representative language technologies” — Karya (DAIA Tech Pvt. Ltd.), <https://www.karya.in/impact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v004** KHPT, the health NGO that commissioned the Kannada tuberculosis speech data, lists a Times of India story dated 19 March 2024 headed 'Karya, NGO create Kannada Q&A bot for TB', showing the commissioned project reached the client.  
  _event · independent · as of 2024-03-19 (publication) · scope: KHPT tuberculosis Q&A bot, Karnataka, India_
  - “Karya, NGO create Kannada Q&A bot for TB” — KHPT (Karnataka Health Promotion Trust), <https://khpt.org/press/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **v005** Of the 60 entries in Karya's public data catalogue, 6 conversational speech datasets carry no sample link and 9 link samples to Google Drive folders rather than Karya's public sample bucket.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Karya Data Catalogue_
  - “language:"Bengali",type:"Conversational",hours:"500",domain:"General Dual Channel Conversations"}” — Karya (DAIA Tech Pvt. Ltd.), <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js> · docs · retrieved 2026-10-01 · quote check: exact
- **v006** TIME described Karya in July 2023 as a nonprofit launched in 2021 in Bengaluru (the karya.in site and dataset refund terms name DAIA Tech Pvt. Ltd. as operator).  
  _offer · independent · as of 2023-07-27 (publication) · scope: India_
  - “a nonprofit launched in 2021 in Bengaluru” — TIME, <https://time.com/6297403/the-workers-behind-ai-rarely-see-its-rewards-this-indian-startup-wants-to-fix-that/> · independent_press · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.licence_model` — not_published; tried <https://karya.in/legal/terms-and-conditions/>, <https://karya.in/karya-public-license/>, <https://karya.in/marketplace/>, <https://karya.in/legal/>, <https://karya.in/case-studies/project-apollo/>, <https://karya.in/data-catalogue/>, <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js>
- `other.karya_public_license` — not_found; tried <https://karya.in/karya-public-license/>, <https://karya.in/legal/>, <https://www.karya.in/impact>, <https://reports.karya.in/2023>, <https://reports.karya.in/2024>, <https://reports.karya.in/2025/>
- `matrix.custody_model` — not_published; tried <https://karya.in/data-services/generation/>, <https://karya.in/data-catalogue/>, <https://platform.karya.in/faq>
- `matrix.exclusivity_offered` — not_published; tried <https://karya.in/legal/terms-and-conditions/>, <https://karya.in/data-catalogue/>
- `matrix.buyer_vetting` — not_published; tried <https://karya.in/contact/>, <https://karya.in/data-catalogue/>
- `matrix.versioning` — not_published; tried <https://karya.in/data-catalogue/>, <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js>
- `matrix.human_subject_consent_docs` — not_published; tried <https://karya.in/legal/privacy-policy/>, <https://reports.karya.in/2025/>, <https://drive.google.com/drive/folders/1-WsQ6eoJ3SAcRmQmoNOv4Qd_IUzuGNGl?usp=sharing>
- `matrix.erasure_after_sale` — not_published; tried <https://karya.in/legal/privacy-policy/>, <https://karya.in/legal/refund-and-cancellation/>
- `matrix.quality_evidence` — not_published; tried <https://karya.in/data-catalogue/>, <https://karya.in/_next/static/chunks/4648-1bbb200c1c8ebd90.js>, <https://karya.in/data-services/generation/>
- `other.egocentric_sample_contents` — gated; tried <https://drive.google.com/drive/folders/1-WsQ6eoJ3SAcRmQmoNOv4Qd_IUzuGNGl?usp=sharing>
- `other.royalty_rate_and_mechanism` — paywalled; tried <https://karya.in/case-studies/first-tuberculosis-chatbot/>, <https://cases.haas.berkeley.edu/2025/10/karya/>, <https://reports.karya.in/2025/>
- `other.independent_press` — not_found; tried <https://time.com/6297289/karya-ai-workers-india/>
- `other.sitemap` — not_found; tried <https://www.karya.in/sitemap.xml>, <https://karya.in/robots.txt>
- `other.revenue_and_funding` — not_published; tried <https://reports.karya.in/2024>, <https://reports.karya.in/2025/>, <https://www.karya.in/impact>

## Leads, not cited

- <https://cases.haas.berkeley.edu/2025/10/karya/> — Full 9-page Haas case (paid) likely describes the royalty mechanism; only the abstract is public.
- <https://time.com/> — Karya's 2023 report says it was on the cover of TIME in 2023; that article is the likely independent source for the resale-royalty model. Could not be located without search.
- <https://www.linkedin.com/pulse/bringing-16-low-resource-languages-online-karya-inc-zxinc/> — Karya Inc. post linked from the impact page; not fetched (LinkedIn).
- <https://www.ethicaldatapledge.com/> — Ethical Data Pledge linked from Karya's 2023 report; did not respond.
- <https://reports.karya.in/2025/> — Report lists grants and a CHI 2026 paper; may help a deep profile on funding.
