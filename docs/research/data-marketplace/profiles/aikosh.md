# AIKosh (IndiaAI Datasets Platform)

government · light · status: **active** · also known as IndiaAI Datasets Platform, AIKosh Datasets Platform

> Rendered from `ledger/aikosh.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Datasets Repository” and its bespoke side “Request Artefact (a link on the dataset page; what happens after a request is not documented; AIKosh does no collection to order)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | venue | c004, c006, c008, c010, c044 | Government-run host: contributors keep IP, set the end-use licence and approve restricted downloads; AIKosh takes only a non-exclusive hosting licence. |
| economics_model | free | c072, c042 | No dataset fee, price or payment mechanism appears in the terms, FAQ or manual; the platform is funded under the IndiaAI Mission. |
| who_pays_fee | not_applicable |  | No fees are charged to contributors or downloaders in any document found. |
| supply_models | third_party_providers, public_or_scraped | c021, c022, c036, c037, c053, c055 | Ministries and registered institutions upload their own data; contributors also relist public Kaggle, Hugging Face and research datasets such as Flickr30k. No evidence of AIKosh collecting its own datasets. |
| custody_model | mixed | c041, c038, c053, c056 | Uploaded files are hosted by AIKosh; Kaggle imports are redirect links; the API route leaves data with the contributor while downloads pass through AIKosh. |
| transaction_mode | free_download | c011, c072, c012, c014 | Open datasets download after login; restricted ones after the contributor approves a reasoned request. Nothing is sold. |
| public_prices | not_applicable |  | No dataset is priced; the only published figures are free compute tiers (c042). |
| licence_model | provider_defined | c007, c008, c061, c054 | Contributor picks from a dropdown of standard licences (CC, ODC, Open Government License India, Other, NA) or carries its own, e.g. ICAR Data Use License. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c070, c045 | Live detail pages were readable anonymously and are listed in the public sitemap; the user manual says detail view needs login (see conflicts). Download needs login. |
| buyer_vetting | account_only | c046, c043, c012 | Platform check is a login via MeriPehchaan/Entity Locker; for restricted datasets the contributor vets each requester case by case. |
| sample_mechanics | preview_in_browser | c047 | Tabular snippet plus column-level statistics on the dataset page. |
| versioning | immutable_revisions | c050, c034, c060 | File edits create a new version and downloads are addressed by version number; whether old versions stay downloadable is not stated. |
| human_subject_consent_docs | not_addressed | c020, c057, c071 | Platform policy is non-personal, anonymised data only; no consent or release evidence is shown to downloaders, and masking is left to contributors. |
| contributor_pay_model | none | c006, c072 | Contributors grant a royalty-free licence and nothing is sold, so no one is paid per download. |
| catalogue_plus_custom | catalogue_only | c020, c066 | AIKosh only lists ready-made datasets; the Request Artefact link is the only gesture toward demand-led supply and its handling is undocumented. |
| erasure_after_sale | takedown_only | c051, c067, c009 | Artefacts can be deleted or removed from AIKosh, but content is meant to stay under its licence once downloaded; no downloader deletion duty found. |
| quality_evidence | both | c033, c026, c048, c069 | Org admin and platform admin approve each upload and the platform computes a quality score; descriptions and metadata are the contributor's; terms disclaim accuracy. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | IndiaAI says AIKosh had over 25,000 registrations and pitches datasets to public and private sectors building AI applications; no data on who downloads photo or video, in what volume, or why. | c065, c029 |
| Q2 | partial | The EOI pitches contributors on reach to public and private AI builders, community cleaning, versioning, and running challenges and hackathons on their data; there is no revenue motive because nothing is sold. | c029, c030, c031 |
| Q3 | sourced | Supply is ministries, departments and registered institutions (individuals barred), plus relisted public Kaggle, Hugging Face and research datasets; each is listed under the contributor's chosen licence with AIKosh holding only a non-exclusive hosting licence. | c021, c022, c036, c053, c055, c037, c006, c007 |
| Q4 | not_applicable | AIKosh hosts free contributions; there is no commissioned work and no resale, so no carve-out or after-the-fact term change was found. |  |
| Q5 | sourced | AIKosh is a government-run venue: the contributor keeps IP and is licensor under its chosen licence, represents it has rights to the content, and indemnifies AIKosh; AIKosh disclaims all warranties including licence compliance. | c004, c006, c008, c010, c016, c017, c069 |
| Q6 | sourced | Mixed: uploads are hosted on AIKosh and downloaded by file or version via UI or API; Kaggle imports are redirect links; an API route leaves the data on the contributor's systems. | c041, c038, c053, c056, c060 |
| Q7 | partial | Only non-personal, anonymised data is meant to be contributed, in line with DPDPA; responsibility for masking sits with the contributor; no consent from people depicted is documented to downloaders, even on a photo dataset. | c020, c024, c057, c071, c016 |
| Q8 | partial | The contributor's chosen licence is meant to travel with the data after download; AIKosh shares downloader identity and usage with contributors and contributors can revoke restricted access; no audit, fingerprinting or exclusivity terms were found. | c009, c007, c015, c052 |
| Q9 | sourced | No purchase: open datasets download after login; restricted ones need a reasoned request the contributor approves, with appeal after 5 days and escalation to support after 10; no fees or commission. | c011, c012, c014, c044, c059, c072 |
| Q10 | partial | A dataset is an artefact with metadata, access level and numbered versions; file edits create a new version; contributors can request deletion subject to admin approval; what past downloaders get on a new version or withdrawal is not stated. | c013, c034, c050, c051, c060, c068 |
| Q11 | sourced | Before download a user sees metadata, a tabular sample preview, column statistics and a platform-computed Data Quality / AI Readiness score; uploads are approved by organisation and platform admins, though the terms disclaim accuracy. | c047, c048, c049, c040, c033, c026, c069 |
| Q12 | partial | AIKosh is catalogue-only (Datasets Repository); a 'Request Artefact' link invites requests for missing data but its handling is undocumented and AIKosh does not collect to order. | c066, c020 |

## Claims

### positioning

- **c001** The AIKosh home page, fetched 2026-10-01, shows the platform was last deployed on 30 September 2026, so it is live and maintained.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Last Deployed : 30th Sept, 26” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Operation confirmed on the parliamentary record as of 29 Jul 2026, within six months. The 'last deployed' footer itself exists only on the vendor's site (re-fetched 2026-10-01: 'Last Deployed: 30th Sept, 26'). Caveat on independence: Lok Sabha answers are given by MeitY, the ministry under which IndiaAI (the AIKosh operator) sits, so they are the operator's government on the parliamentary record, not a third party. WebSearch not available in this run (search budget spent); independent press could not be reached by navigation. 
    - “AIKosh, IndiaAI's datasets platform, hosts more than 13,445 datasets across 22 sectors from over 578 organisations” — Lok Sabha Secretariat (Unstarred Q 1688 answered by MeitY, 29.07.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1688_VkztvS.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote 'Last Deployed : 30th Sept, 26' supports the deploy date; 'live and maintained' is a fair inference for a page fetched the same day. Blind step found the operation independently confirmed on the parliamentary record (29.07.2026).
- **c004** AIKosh is designed, developed and hosted by the IndiaAI Division of India's Ministry of Electronics and IT, i.e. a government operator.  
  _offer · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “AIKosh is a platform designed, developed and hosted by the IndiaAI Division under the Ministry” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** IndiaAI, which runs AIKosh, is an Independent Business Division within Digital India Corporation under MeitY.  
  _offer · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “IndiaAI, an Independent Business Division (IBD) under the Digital India Corporation” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact

### supply

- **c002** AIKosh says on its home page that it lists more than 15,999 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_ · **15999 datasets listed** (vendor home-page counter, shown as a lower bound ('15999+'); includes open, restricted and redirected listings; as of retrieval)
  - “15999+” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Home-page counter re-fetched 2026-10-01 reads '15999+'. The nearest independent figure is lower and older: MeitY told the Lok Sabha on 29.07.2026 (Unstarred Q 1688) that AIKosh hosts 'more than 13,445 datasets ... from over 578 organisations'. Not a contradiction (two months apart, both self-reported), but the 15,999 figure has no independent support; see missed claim aikosh-v001.
  - verifier (scope): **quote_incomplete** — Fact correct (re-fetched: '15999+'), but the bare quote '15999+' does not show that the counter is datasets; the label 'Datasets' next to it would.
- **c003** AIKosh says on its home page that 671 organisations are on the platform.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_ · **671 organisations** (vendor home-page counter; not stated whether all have contributed artefacts; as of retrieval)
  - “671” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Home-page counter re-fetched 2026-10-01 reads 'Organizations: 671'. MeitY's 29.07.2026 Lok Sabha answer gives 'over 578 organisations'. Same caveat as c002: the 671 figure is vendor-only; the July figure is the operator's ministry restating its own count.
  - verifier (scope): **quote_incomplete** — Fact correct (re-fetched: 'Organizations' 671), but the bare quote '671' does not show what is counted and could match anything; the label 'Organizations' is needed.
- **c020** AIKosh's terms describe its Datasets Repository as a collection of non-personal, anonymised datasets.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Datasets Repository: A collection of non-personal, anonymized datasets” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The terms wording itself is vendor-only; MeitY gave Parliament the same characterisation of the datasets pillar at launch. This shows the operator describes the corpus consistently as non-personal and anonymised; it is not evidence that listed datasets are in fact anonymised. Caveat on independence: Lok Sabha answers are given by MeitY, the ministry under which IndiaAI (the AIKosh operator) sits, so they are the operator's government on the parliamentary record, not a third party. 
    - “improving access to non -personal and anonymized datasets, AI Models and” — Lok Sabha Secretariat (Unstarred Q 2177 answered by MeitY, 12.03.2025), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/184/AU2177_6X6vys.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the terms' definition. For matrix.human_subject_consent_docs it shows only a platform policy assertion, not evidence about any listing.
- **c021** Artefacts on AIKosh may come from Government of India organisations, departments and ministries or from non-government contributors.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Ministries of the Government of India or Non-Government Contributors” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** Under the 2025 expression of interest, only institutional entities may contribute datasets; individual submissions are not permitted.  
  _terms · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Only institutional entities are eligible to contribute datasets. Individual submissions are not permitted.” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Eligibility rule of IndiaAI's own expression of interest. Parliamentary answers describe AIKosh as 'integrating datasets from government and non-government sources' and say 'Private sector entities are also encouraged to share their AI ready datasets' (Unstarred Q 505, 23.07.2025): consistent with institution-only contribution, silent on individuals.
  - verifier (scope): **scope_ok** — Quote matches the EOI dated 25-Mar-2025. The June 2025 addendum widened artefact types but still invites 'Private entities including ... startups, enterprises, academic institutions, and research organizations', so the institution-only rule stands. source_class regulator_guidance is doubtful (see c028).
- **c036** Public organisations, private companies, non-profits, research organisations, universities and startups/MSMEs can register as organisations on AIKosh.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Public Organizations, Private Companies, Non-profit organizations, Research Organizations, Universities and Startups/MSMEs” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c037** AIKosh lists Flickr30k, a public research dataset of 31,000 Flickr images with human captions, uploaded by a third-party foundation rather than its creators.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: Flickr30k, India_
  - “Contains 31,000 images collected from Flickr, each accompanied by five reference sentences provided by human annotators” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/flickr30k.html> · docs · retrieved 2026-10-01 · quote check: exact
- **c053** Contributors can list a public Kaggle dataset on AIKosh, which fetches its metadata and a redirection link rather than the files.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “The AIKosh platform will fetch metadata and redirection link” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c055** Contributors can import a dataset from Hugging Face, and AIKosh fetches the dataset and its metadata.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “AIKosh fetches the Dataset and the metadata from the Hugging face.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** An undated IndiaAI call for proposals says AIKosh had onboarded over 10,000 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_ · **10000 datasets onboarded** (IndiaAI's own statement in an undated call for proposals; lower bound ('over'); cumulative since launch)
  - “The platform has onboarded over 10,000 datasets and approximately 300 AI models from more than 55 entities” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/cdn/documents/Call_for_Proposal_AIKosh_University_Engagement_Programme_final_v2.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Quote: '10,000+ datasets, 285 AI models and 28 development toolkits specific to India are available on the platform' (the bullet says 'the platform', within a list of IndiaAI Mission achievements; AIKosh is the only datasets platform in it). Confirms that the 10,000+ figure was the government's stated count in March 2026, which helps date the undated call for proposals; it is the operator's own count restated, so relayed, not independent. Caveat on independence: Lok Sabha answers are given by MeitY, the ministry under which IndiaAI (the AIKosh operator) sits, so they are the operator's government on the parliamentary record, not a third party. 
    - “10,000+ datasets, 285 AI models and 28 development toolkits specific to India are available on the platform” — Lok Sabha Secretariat (Unstarred Q 4311 answered by MeitY, 18.03.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/187/AU4311_SVy5u3.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the call for proposals. Dating: the document is undated but its figures (over 10,000 datasets, approximately 300 models) sit between MeitY's Lok Sabha figures of 18.03.2026 (10,000+ datasets, 285 models) and 29.07.2026 (13,445 datasets, 329 models), so it is roughly spring 2026; the profile's as_of 2026-10-01 (retrieved_only) should not be read as a current count (the home page now says 15999+).
- **c064** The same IndiaAI call for proposals says AIKosh's datasets and models came from more than 55 entities.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_ · **55 contributing entities** (IndiaAI's own statement in an undated call for proposals; lower bound ('more than'); cumulative since launch)
  - “from more than 55 entities across 20 sectors” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/cdn/documents/Call_for_Proposal_AIKosh_University_Engagement_Programme_final_v2.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch not available in this run (search budget spent); independent press could not be reached by navigation. No parliamentary answer scanned gives a count of contributing entities near 55; the 29.07.2026 answer gives 'over 578 organisations' (a later date and possibly a different measure: organisations on the platform vs entities that contributed). The two figures are hard to reconcile if the call for proposals is from early 2026 (10,000+ datasets); worth checking in scope step.
  - verifier (scope): **scope_ok** — Quote 'from more than 55 entities across 20 sectors' matches the call for proposals. Flag: MeitY told the Lok Sabha on 29.07.2026 that AIKosh hosts datasets 'from over 578 organisations' and the home page now says 671 organisations; 55 is either an older figure or a narrower measure. The profile should not use 55 as a current contributor count.

### object_model

- **c031** The EOI offers contributors versioning features for continuous refinement of datasets.  
  _offer · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Versioning features enable continuous refinement” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c034** AIKosh contributors can modify metadata and upload new versions of a dataset's data files.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “contributors can modify metadata and update new versions of the data files.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c035** AIKosh accepts video (MP4, MKV, AVI) and image (JPEG, PNG, TIFF, BMP, RAW) dataset files.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Video Files (MP4, MKV, AVI), Image Format (JPEG, PNG, TIFF, BMP, RAW)” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c050** Editing the files of a published AIKosh dataset creates a separate new version rather than overwriting it.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Edit of files of datasets and models will create the separate new version of the respective datasets and models.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c013** An artefact set to private is discoverable and downloadable only by its contributor.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “If the Artefact is private, it will only be discoverable and downloadable by the Contributor.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c045** AIKosh's user manual says a user who is not logged in cannot open the detailed dataset view or download any dataset.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “User will not be able to access detailed view of datasets and download rights for any of the datasets and” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c070** An anonymous visitor can open an AIKosh dataset detail page showing source organisation, licence and files without logging in.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: UJALA-2025, India_
  - “Source Organisation: MINISTRY OF POWER” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/ujala_2025.html> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c058** AIKosh's dataset filters let users pick by licence type, including open-source, commercial and custom agreements.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Select datasets based on the type of licensing agreement they come with, such as open-source” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c015** AIKosh may share a user's name, email address and usage with the contributor of an artefact the user accessed.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “sharing the User's name, email address, and usage with the Contributor of an artefact accessed” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** AIKosh provides its services and content 'as is' and 'as available', disclaiming warranties.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “the Services and Content are provided "as is" and "as available".” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c039** AIKosh dataset pages carry a platform 'Data Quality Score (Beta)' field, shown blank on some listings.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: Flickr30k, India_
  - “Data Quality Score (Beta)” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/flickr30k.html> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** The UJALA-2025 listing breaks its quality score into Data Quality & Integrity, Consistency & Usability, and Maintenance & Documentation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: UJALA-2025, India_
  - “Data Consistency & Usability” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/ujala_2025.html> · docs · retrieved 2026-10-01 · quote check: exact
- **c047** AIKosh dataset pages include a sample-data preview showing a snippet of the data in tabular form before download.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “A preview of the dataset that shows a snippet of the data in tabular form” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** AIKosh computes a data quality score by processing a dataset's files when the contributor uploads it.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “click on initiate file processing for calculation of Data quality score” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c049** AIKosh's manual says each dataset in the repository is accompanied by an AI Readiness Score.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “each accompanied by an AI Readiness Score” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** AIKosh disclaims warranties about the accuracy, reliability and copyright or licence compliance of its services.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “AIKosh disclaims all warranties or guarantees about the accuracy, reliability, copyright or license compliance” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact

### transaction

- **c011** An artefact set to open access is discoverable by any user and downloadable.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “If the Artefact is made available under open access, it will be discoverable by any User and downloadable” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** An artefact set to restricted access is discoverable by anyone but can be downloaded and used only with the contributor's explicit consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “its download and use will only be possible with the explicit consent of the Contributor.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — AIKosh's own Terms of Use; re-fetched 2026-10-01: 'its download and use will only be possible with the explicit consent of the Contributor'.
  - verifier (scope): **quote_incomplete** — Fact correct, but the quote shows only the consent half; the discoverability half needs 'If the Artefact is made available under restricted access, it will be discoverable by any User'.
- **c014** For a restricted dataset, a user must submit a request stating the reason for download and the dataset owner decides whether to grant access.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “For restricted datasets, users must submit a request stating the reason for download.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** Explorers, the default role of any registered individual, can raise requests to download restricted datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Can raise requests to download restricted datasets/models” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** On AIKosh the contributor, not the platform, approves or rejects download requests for the restricted datasets it uploaded.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Can approve/ reject download requests for restricted datasets/models uploaded by them” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** The dataset download button on AIKosh requires the user to log in.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “The button is prominently displayed and require user to login.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c059** If a download request stays pending over 5 days the requester can appeal, and after 5 more days it escalates to platform support.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “a request remains pending for more than 5 days, Explorers can raise an appeal” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c042** AIKosh's home page lists CPU-only and basic GPU notebook compute as free.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh Notebook compute, India_ · **0 INR** (price to the user for CPU-only and Basic GPU notebook tiers; Advance GPU also free but requires approval; not stated)
  - “Basic GPU - Free” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — Re-fetched home page 2026-10-01 lists CPU ONLY (free, 3.2 cores, 7GB RAM) and Basic GPU (free, 4 hours, 5GB A100 profile); Advance GPU requires approval. Parliamentary answers discuss the separate IndiaAI Compute Portal (subsidised up to 40%), not AIKosh notebooks.
  - verifier (scope): **quote_incomplete** — Fact correct. The quote 'Basic GPU - Free' covers only the Basic GPU tier and is a joined string: on the page 'Basic GPU' and 'Free' are separated by 'Ideal for moderate AI/ML experiments and training', so it may fail a verbatim match. The CPU ONLY card ('CPU ONLY ... Free ... Anytime CPU Access') is not quoted. The value basis that Advance GPU is also free is supported by the card text 'Free Requires Approval'.
- **c072** Registered explorers download open datasets without raising a request; neither the manual nor the terms describe any fee or payment.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “View and download open datasets/models that are readily available without raising requests.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Access mechanics and absence of fees are stated only in AIKosh's manual and terms; re-fetched terms show no fee, charge or payment language. Lok Sabha Unstarred Q 486 (03.12.2025) says Tamil datasets are 'publicly accessible through the BHASHINI and AIKosh platforms', consistent but not specific.
  - verifier (scope): **scope_ok** — Manual quote is under the Explorer rights section and matches; the no-fee half is an absence, consistent with re-fetched terms. Note the manual's filter text says restricted datasets are 'accessible to only those who are registered and member of the Organization', which differs from the terms' contributor-consent model.

### licence

- **c006** By contributing, a contributor grants AIKosh only a worldwide, royalty-free, non-exclusive licence to use, display, publish and reproduce the content.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “you grant AIKosh a worldwide, royalty-free and non-exclusive license to use, display, publish, reproduce” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in AIKosh's own terms, so vendor_only. BUT the re-fetched clause grants a 'worldwide, royalty-free and non-exclusive license to use, display, publish, reproduce, distribute, and make derivative works of such Content'. The claim's 'only ... use, display, publish and reproduce' omits distribution and derivative works, so it understates the grant; see scope verdict.
  - verifier (scope): **scope_wrong** — The quote is truncated at 'reproduce'; the live clause continues 'distribute, and make derivative works of such Content'. The statement's 'only ... use, display, publish and reproduce' therefore understates the grant: contributors also license AIKosh to distribute and make derivative works.
- **c007** AIKosh gives contributors a dropdown of commonly used licences from which they set the end-use terms of each artefact.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “AIKosh provides Contributors with a dropdown of commonly used licenses to define the terms of end use” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — AIKosh's own Terms of Use; re-fetched 2026-10-01: 'AIKosh provides Contributors with a dropdown of commonly used licenses to define the terms of end use for their Artifacts'.
  - verifier (scope): **scope_ok** — Quote matches the live terms.
- **c008** AIKosh's terms say a contributor's chosen licence is not replaced or overridden by the AIKosh Terms of Use.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “the license terms are not intended to be replaced or overridden by the terms of these Terms” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in AIKosh's own Terms of Use. Re-fetched terms contain: 'Nothing in these Terms limits your rights under, or grants you rights that supersede, the terms and conditions of any applicable license.' Whether a separate clause says the contributor's licence is 'not replaced or overridden' is for the scope check.
  - verifier (scope): **quote_incomplete** — Fact correct, but the quote does not show that 'the license terms' are the contributor's; the preceding words 'subject to specific license terms, as chosen by the Contributor' do. The same sentence also says 'the limitations of liabilities, disclaimers, and this provision apply to any such item as well', a carve-out the statement omits.
- **c009** AIKosh's terms say contributed content is meant to stay under its chosen licence when further accessed, distributed or used after download.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “such Content is intended to remain under the terms of such license when further accessed, distributed, or used.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** A contributor keeps its intellectual property rights in content it contributes to AIKosh.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “You retain any intellectual property rights that you have Content contributed by you.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** Under AIKosh's terms the contributing user, not AIKosh, represents that it has ownership, control and responsibility for content it posts.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “you have ownership, control, and responsibility for the Content you post or otherwise make available” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Users indemnify AIKosh against claims, liability and expenses; AIKosh gives no indemnity to downloaders.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “you agree to indemnify, defend and hold harmless AIKosh from all claims, liability, and expenses” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** EOI submissions must include complete metadata and specify licensing terms.  
  _terms · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Submissions must include complete and accurate metadata, specify licensing” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c054** For Kaggle imports, the licence shown on AIKosh is auto-populated from the Kaggle metadata.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Tags, license, and documentation are auto populated from the Kaggle metadata.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** The ICAR Video Gallery listing on AIKosh carries the contributor's own 'ICAR Data Use License' rather than a standard open licence.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: ICAR Video Gallery, India_
  - “ICAR Data Use License” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/icar_video_gallery.html> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c038** The Flickr30k listing on AIKosh is marked as redirected rather than hosted, i.e. the files sit on an external host.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: Flickr30k, India_
  - “Hosted / Redirected” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/flickr30k.html> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** The UJALA-2025 listing, contributed by the Ministry of Power, is hosted on AIKosh as a versioned file set with a Download Dataset button.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: UJALA-2025, India_
  - “Download Dataset” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/ujala_2025.html> · docs · retrieved 2026-10-01 · quote check: exact
- **c056** Under AIKosh's API contribution route the data stays with the contributing organisation while being discoverable and downloadable through AIKosh.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “data will remain with the contributor organization, however it will be discoverable and downloadable” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Contribution route described only in AIKosh's own manual. Note a possible tension: Lok Sabha Unstarred Q 505 (23.07.2025) says 'BharatX platform aims to serve as the data repository for AIKosh Platform', i.e. a central repository; this does not contradict an API route that leaves data with the contributor.
  - verifier (scope): **scope_ok** — Quote is from manual section 11.1 'Contributors exposing AIKosh recommended APIs'. Precision: the manual also has Pull API and Push API upload routes (8.4.2, 8.4.3) that are upload mechanisms; the 'data stays with the contributor' rule is stated only for the 11.1 route, so 'the API contribution route' should say which one.
- **c060** Registered users can download a whole dataset version through an authenticated API call using the dataset identifier and version number.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Download the entire dataset (all files in a version) by making a GET request” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c023** Contributing organisations must have a valid and verifiable legal status such as a registered society or company.  
  _terms · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “All applying organizations must have valid and verifiable legal status” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c026** Submitted datasets undergo backend validation against AIKosh's data quality standards before approval and publication.  
  _offer · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Submitted datasets undergo backend validation to ensure alignment with AIKosh” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c032** Only contributors may upload datasets to AIKosh, subject to verification by the organisation admin and the platform admin.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Only contributors are allowed to upload datasets on AIKosh, subject to verification from the organization admin” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c033** Uploaded datasets must be approved by both the organisation admin and the platform admin before they are visible on AIKosh.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “must be approved by the Organization Admin and Platform Admin before they are visible on the platform” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/faqs> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** AIKosh's terms say it does not actively pre-screen content but may refuse or remove any content or account at its discretion.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “AIKosh does not actively pre-screen Content but reserves the right, at its sole discretion” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c051** AIKosh contributors can request deletion of their artefacts, which the organisation administrator must approve before removal.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “contributors can raise requests to delete their artifacts. These requests must be” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c052** AIKosh contributors can revoke a previously approved access request to a restricted artefact.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “contributors retain the ability to revoke access if” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** On account termination AIKosh will use reasonable efforts to delete the user's contributed content within 90 days.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “delete your information and Content contributed by you, whether public or private, within 90 days” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c066** AIKosh's dataset listing page offers a 'Request Artefact' link for users who cannot find what they need.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “Can't find what you're looking for? Request Artefact” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c027** In its March 2025 EOI, IndiaAI said AIKosh was in a beta phase with some features still under development.  
  _status · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “AIKosh is currently in its beta phase; certain features may still be under” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c028** A 2025 addendum to the EOI extended private contributions from datasets to AI models and use cases.  
  _event · government · as of 2025 (page_dated) · scope: AIKosh, India_
  - “AI artefacts, specifically AI models and relevant use cases, are now being” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch not available in this run (search budget spent); independent press could not be reached by navigation. An addendum to an IndiaAI EOI should have independent echoes (procurement portal notice, press, parliamentary answer); none found. Lok Sabha MeitY answers from Mar 2025 to Aug 2026 were scanned (titles filtered for AI/data/Kosh, 25 answers read) and none mentions an EOI addendum or model/use-case contributions by private entities. Lok Sabha Unstarred Q 505 (23.07.2025) says only that private sector entities are encouraged to share AI-ready datasets.
  - verifier (scope): **scope_wrong** — The statement is right but the scope label is wrong and the quote is cut short. (1) As the profile's 'newest dated event' it is stale: the addendum is dated '29-06-2S' (29 June 2025, OCR-garbled), and later dated events exist, e.g. MeitY told the Lok Sabha (Unstarred Q 5334, 25.03.2026; Q 1688, 29.07.2026) that sovereign models launched at the India-AI Impact Summit 2026 'have since been made available on the AIKosh platform' (see missed aikosh-v005). (2) The quote stops at 'are now being'; the operative words are 'in addition to datasets, contributions in the form of AI artefacts ... are now being invited from private contributors'. (3) source_class regulator_guidance is doubtful: IndiaAI is the operator, so its EOI is the operator's own call, not a regulator's guidance.
- **c062** IndiaAI says AIKosh was launched on 6 March 2025.  
  _event · vendor_stated · as of 2025-03-06 (publication) · scope: AIKosh, India_
  - “Launched on 6 March 2025, AIKosh is India's national platform for AI” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/cdn/documents/Call_for_Proposal_AIKosh_University_Engagement_Programme_final_v2.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c029** The EOI pitches contributors that datasets hosted on AIKosh can be used directly by public and private sectors to build AI applications.  
  _offer · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Hosted datasets can be directly utilized by public and private sectors to build real-world AI applications” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c030** The EOI tells contributors they can run challenges and hackathons on their AIKosh datasets for visibility.  
  _offer · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “Contributors can run challenges and” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c065** IndiaAI says AIKosh had recorded over 25,000 registrations.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_ · **25000 user registrations** (IndiaAI's own statement in an undated call for proposals; lower bound ('over'); cumulative since launch)
  - “the platform has recorded over 17 lakh visits and 25,000 registrations” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/cdn/documents/Call_for_Proposal_AIKosh_University_Engagement_Programme_final_v2.pdf> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — WebSearch not available in this run (search budget spent); independent press could not be reached by navigation. The only independent registration figure found is older: Lok Sabha Starred Q 42 (23.07.2025) says the platform attracted 'over 265,000 visits, 6,000 registered users, and 13,000+ resource downloads'. No source for 25,000 registrations was reachable. Disclosure: while working, this verifier inadvertently saw a profiler scratch file in a shared scratchpad folder quoting '17 lakh visits and 25,000 registrations'; that is the profile's own source, not counted here.
  - verifier (scope): **scope_ok** — Quote 'the platform has recorded over 17 lakh visits and 25,000 registrations' matches the call for proposals (spring 2026, see c063). 'over' grammatically attaches to visits; reading it as 'over 25,000 registrations' in the statement and value basis is a slight stretch. Note the home page now shows 3,47,45,610 visitors, so the registration figure is dated.

### regulation

- **c019** AIKosh's terms are governed by Indian law.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “These Terms shall be governed by and construed in accordance with the Indian law.” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/terms-n-conditions> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Datasets shared with AIKosh under the EOI must comply with India's Digital Personal Data Protection Act and the NDSAP data-sharing policy.  
  _terms · government · as of 2025-03-25 (page_dated) · scope: AIKosh, India_
  - “with the provisions of the Digital Personal Data Protection Act (DPDPA), the National” — IndiaAI IBD, Digital India Corporation, <https://aikosh.indiaai.gov.in/static/datasets_EOI.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c057** On the API contribution route, sensitive-data masking and deletion are the sole responsibility of the contributing organisation.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh, India_
  - “sensitive data masking/deletion remains the sole” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** The AIKosh Flickr30k listing, 31,000 Flickr photographs with captions, shows no consent, release or privacy information to downloaders; its licence reads 'Other'.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AIKosh listing: Flickr30k, India_
  - “Contains 31,000 images collected from Flickr” — IndiaAI (MeitY), <https://aikosh.indiaai.gov.in/home/datasets/details/flickr30k.html> · docs · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** MeitY told the Lok Sabha on 29 July 2026 that AIKosh hosts more than 13,445 datasets across 22 sectors.  
  _number · government · as of 2026-07-29 (publication) · scope: AIKosh, India_ · **13445 datasets hosted** (MeitY written answer to Parliament; lower bound ('more than'); the operator's own count; cumulative as of 2026-07-29)
  - “AIKosh, IndiaAI's datasets platform, hosts more than 13,445 datasets across 22 sectors from over 578 organisations” — Lok Sabha Secretariat (Unstarred Q 1688 answered by MeitY, 29.07.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1688_VkztvS.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
- **v002** MeitY told the Lok Sabha on 29 July 2026 that AIKosh's datasets come from over 578 organisations.  
  _number · government · as of 2026-07-29 (publication) · scope: AIKosh, India_ · **578 organisations** (MeitY written answer to Parliament; lower bound ('over'); not stated whether all have contributed; cumulative as of 2026-07-29)
  - “AIKosh, IndiaAI's datasets platform, hosts more than 13,445 datasets across 22 sectors from over 578 organisations” — Lok Sabha Secretariat (Unstarred Q 1688 answered by MeitY, 29.07.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1688_VkztvS.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
- **v003** MeitY told the Lok Sabha in July 2025 that AIKosh had recorded 13,000+ resource downloads (with 6,000 registered users) since its March 2025 beta launch.  
  _number · government · as of 2025-07-23 (publication) · scope: AIKosh, India_ · **13000 resource downloads** (MeitY written answer to Parliament; lower bound ('13,000+'); all artefact types, not datasets only; cumulative as of 2025-07-23)
  - “The platform has attracted over 265,000 visits, 6,000 registered users, and 13,000+ resource downloads” — Lok Sabha Secretariat (Starred Q 42 answered by MeitY, 23.07.2025), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/185/AS42_UcKpjr.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
- **v004** The IndiaAI Datasets Platform (AIKosh) pillar is allocated Rs 199.55 crore of the IndiaAI Mission's Rs 10,371.92 crore five-year outlay.  
  _number · government · as of 2026-07-29 (publication) · scope: AIKosh, India_ · **199.55 INR crore** (Government budget allocation to the datasets pillar, out of a Rs 10,371.92 crore mission outlay; five years from March 2024)
  - “IndiaAI Datasets Platform 199.55” — Lok Sabha Secretariat (Unstarred Q 1717 answered by MeitY, 29.07.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1717_Yzq3qz.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
- **v005** Sovereign foundation models launched at the India-AI Impact Summit in February 2026 were subsequently made available on AIKosh, a later dated event than the June 2025 EOI addendum.  
  _event · government · as of 2026-07-29 (publication) · scope: AIKosh, India_
  - “These models were launched during the India-AI Impact Summit 2026 and have since been made available on the AIKosh platform” — Lok Sabha Secretariat (Unstarred Q 1688 answered by MeitY, 29.07.2026), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1688_VkztvS.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact
- **v006** MeitY told the Lok Sabha in July 2025 that the BharatX government data exchange is intended to serve as the data repository for AIKosh.  
  _architecture · government · as of 2025-07-23 (publication) · scope: AIKosh, India_
  - “BharatX platform aims to serve as the data repository for AIKosh Platform” — Lok Sabha Secretariat (Unstarred Q 505 answered by MeitY, 23.07.2025), <https://sansad.in/getFile/lsapps/loksabhaquestions/annex/185/AU505_EVOOZs.pdf?source=lsapps> · filing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://aikosh.indiaai.gov.in/home/terms-n-conditions>, <https://aikosh.indiaai.gov.in/home/faqs>, <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf>
- `other.request_artefact_handling` — js_empty; tried <https://aikosh.indiaai.gov.in/home/datasets>, <https://aikosh.indiaai.gov.in/home/faqs>, <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf>
- `other.old_version_retention` — not_published; tried <https://aikosh.indiaai.gov.in/home/faqs>, <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf>
- `other.independent_press_and_newest_event` — blocked; tried <https://pib.gov.in/PressReleasePage.aspx?PRID=2108810>, <https://indiaai.gov.in/>, <https://aikosh.indiaai.gov.in/home/article/all>, <http://export.arxiv.org/api/query?search_query=all:AIKosh>
- `other.data_onboarding_sop` — js_empty; tried <https://aikosh.indiaai.gov.in/home/user-manual>
- `other.downloader_deletion_duty` — not_published; tried <https://aikosh.indiaai.gov.in/home/terms-n-conditions>, <https://aikosh.indiaai.gov.in/manual/User_Manual_AIKosh.pdf>
- `questions.Q1` — not_published; tried <https://aikosh.indiaai.gov.in/>, <https://aikosh.indiaai.gov.in/cdn/documents/Call_for_Proposal_AIKosh_University_Engagement_Programme_final_v2.pdf>

## Conflicts

- c045, c070: The manual says detail views need login, but live detail pages were readable anonymously on 2026-10-01; public_listing follows the live pages. (live_primary_wins_terms)
- c067, c033: The terms say AIKosh does not actively pre-screen content, while the FAQ says every upload needs organisation-admin and platform-admin approval before it is visible; both are live. (unresolved)
- c063, c002: Different undated counts (over 10,000 datasets from 55+ entities vs 15999+ datasets and 671 organisations on the live home page); likely different dates and measures, not reconcilable from the sources. (unresolved)

## Leads, not cited

- <https://pib.gov.in/> — PIB press releases on the 6 March 2025 launch and later AIKosh milestones; WebFetch got 403 and no search was available to find release IDs.
- <https://aikosh.indiaai.gov.in/manual/AIKosha-Security-Measure.pdf> — Security-measures document found in the site's JS bundle; not read.
- <https://aikosh.indiaai.gov.in/home/privacy-policy> — Privacy policy; may say more on sharing downloader data with contributors.
- <https://aikosh.indiaai.gov.in/home/competitions> — Competitions with prize pools; relevant to how contributors are rewarded without sales.
