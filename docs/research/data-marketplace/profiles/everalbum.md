# Everalbum

failure · light · status: **active** · also known as Ever, Ever AI, Paravision, Paravision, Inc.

> Rendered from `ledger/everalbum.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “not applicable: sold no datasets; its enterprise brand Paravision (formerly Ever AI) sells 'face recognition technology' / 'AI building blocks'” and its bespoke side “not applicable: no custom data collection offered”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | not_applicable | c030, c039 | No dataset was ever sold or brokered: Everalbum used its own app users' photos to train its own face models and sold only the models (Paravision). |
| economics_model | not_applicable |  | Earned from selling face recognition technology to businesses and governments, not from data sales; model pricing not published. Supporting claims: c039, c040, c030. |
| who_pays_fee | not_applicable | c030 | No data transaction and no marketplace fee. |
| supply_models | contributor_uploads, public_or_scraped, own_collection, third_party_providers | c022, c046, c051 | Training inputs, not listed inventory. 2017-2019: face crops extracted from consumers' uploads to the Ever storage app (uploaded for storage, not contributed for training) mixed with public datasets. After the case (2022 filing): public datasets, consenting employees, and purchased third-party images with contractual consent. |
| custody_model | not_applicable |  | The photos stayed on Everalbum's own cloud servers and were never delivered to customers; only trained models left the company. Supporting claims: c030. |
| transaction_mode | not_applicable |  | No dataset transaction existed; Paravision sells its models B2B/B2G and its sales process for them was not examined. Supporting claims: c040, c030. |
| public_prices | not_applicable | c030 | Nothing data-related was priced or sold. |
| licence_model | not_applicable |  | No data licence was ever granted to buyers. On the input side, Paravision says it reviews the licences of public datasets it uses. Supporting claims: c030, c048. |
| exclusivity_offered | not_applicable |  | No data sold. Supporting claims: c030. |
| public_listing | not_applicable |  | No data listings existed. Supporting claims: c030. |
| buyer_vetting | case_by_case | c050, c049 | Applies to buyers of Paravision's face recognition technology, not of data: vetting of partners and customers, a country exclusion list, and use-case limits. |
| sample_mechanics | not_applicable |  | No data listings existed. Supporting claims: c030. |
| versioning | not_applicable |  | No data product. The model analogue: models from datasets 1-2 were discarded, and all models built from Ever data were ordered destroyed. Supporting claims: c030. |
| human_subject_consent_docs | not_addressed | c031, c032, c022, c011 | The people depicted were never asked; Ever's help text shifted responsibility to the uploader ('you have the approval of everyone featured'), and face recognition was on by default for most users until April 2019. Paravision later relies on suppliers' contractual consent warranties (asserted, not shown to anyone). |
| contributor_pay_model | none | c038, c022 | The individuals whose photos fed the models were consumers of a free storage app; no payment to them appears anywhere in the FTC record. |
| catalogue_plus_custom | not_applicable |  | Sold neither ready-made nor custom datasets; sells models. Supporting claims: c030, c041. |
| erasure_after_sale | unknown |  | The order made Everalbum destroy the photos, embeddings and every model built even partly from them, but nothing fetched says whether copies of those models already deployed at Paravision customers were recalled. |
| quality_evidence | not_applicable |  | No data listings. For models, evidence was third-party benchmarking (NIST accuracy testing). Supporting claims: c029. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Buyers were of models, not data: enterprises for security, access control and payments, plus law-enforcement uses pitched in 2019. Paravision itself is now a buyer of consented face images from third parties outside the US and EEA. | c039, c042, c046 |
| Q2 | not_applicable | Everalbum never listed or sold datasets, on its own site or anyone else's. |  |
| Q3 | sourced | Face crops were scripted out of consumers' storage-app uploads (about 12 million installs) and mixed with public datasets, under no training right. After the case, Paravision says it uses public datasets after licence review, consenting employees, and purchased images with contractual consent. | c022, c034, c043, c046, c048, c021 |
| Q4 | partial | Photos uploaded for storage were repurposed for commercial model training; face recognition was on by default, and opt-in controls and a privacy-policy mention came only in 2018-2019, after the data had been used. | c031, c045, c022 |
| Q5 | partial | No data was resold, so there was no licensor to buyers. Ever's help text pushed consent for depicted people onto the uploader; Paravision now relies on suppliers' contractual consent duties and its own customer vetting. | c032, c046, c047, c050 |
| Q6 | partial | The data never left Everalbum's servers; the FTC says no photos or personal information went to Paravision customers, only the trained models. | c030 |
| Q7 | sourced | The uploader was not asked for most of 2017-2019 (default-on outside IL/TX/WA/EU); the people depicted were never asked. The order now requires separate disclosure and affirmative express consent before training, except for products offered only outside the US. | c031, c032, c024, c026, c033, c011, c012, c013 |
| Q8 | partial | The remedy reached derived works: every model or algorithm built even partly from the improperly used data had to be destroyed, binding those in active concert who receive notice. Whether that reached models already at customers is not shown. | c007, c008, c014, c018, c019 |
| Q9 | not_applicable | No dataset sales took place; Paravision sells models B2B and B2G. | c040 |
| Q10 | partial | No data product existed. For withdrawal, the order ordered destruction of the photos, face embeddings and all Affected Work Product, confirmed by sworn statements, which Paravision says it made. | c010, c009, c008, c020, c028 |
| Q11 | partial | Not a data seller; for its models the evidence was NIST accuracy testing, and the FTC says a model trained on Ever data was submitted to NIST. | c029 |
| Q12 | not_applicable | Sold neither ready-made nor custom datasets; the consumer brand (Ever) supplied data to the enterprise brand (Paravision, formerly Ever AI), which sells models. | c027, c041 |

## Claims

### positioning

- **c039** The FTC complaint describes Paravision as offering its face recognition technology to enterprise customers for security, access control and payments.  
  _offer · government · as of 2021-05-06 (publication)_
  - “Paravision offers its face recognition technology to enterprise customers for purposes such as security, access control” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — FTC complaint para 16. Chopra's statement adds clients 'in the security and air travel industries'. Added after Part 2: same URL as the profile's source.
    - “to enterprise customers for purposes such as security, access control, and facilitating payments” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote is cut after 'access control' and omits payments, which the statement names. The complaint continues ', and facilitating payments'.
- **c041** Paravision presents itself as a maker of ethically developed AI building blocks for identity, not as a seller of datasets.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Ethically developed AI building blocks for the next generation of identity” — Paravision, <https://www.paravision.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c044** Ever's CEO told NBC News the company turned to face recognition after concluding that a free photo app with small paid features would not be a venture-scale business.  
  _event · vendor_stated · as of 2019-05-09 (publication)_
  - “a free photo app with some small paid premium features "wasn't going to be a venture-scale business."” — NBC News, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371> · independent_press · retrieved 2026-10-01 · quote check: exact

### supply

- **c021** Paravision states in its sworn 2022 compliance report that the technology it sells was not trained on any information collected through the Ever app.  
  _outcome · filing · as of 2022-05-05 (publication)_
  - “the technology that Paravision sells was not trained on any Covered Information collected through the Ever application” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Paravision's own sworn statement; no independent check exists. Same report says its sold technology is trained exclusively on public datasets, consenting employees, and third parties outside the US/EEA contractually obliged to obtain consent.
    - “the technology that Paravision sells was not trained on any Covered Information collected through the Ever application” — Paravision, Inc. (published by the U.S. Federal Trade Commission), <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The report says 'Covered Information', an order-defined term for information from or about an individual consumer; the statement's 'any information' is a fair rendering. The claim is correctly framed as Paravision's own sworn statement.
- **c022** The FTC alleged that between September 2017 and August 2019 Everalbum combined millions of face images extracted from Ever users' photos with public datasets to build four training datasets.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “Everalbum combined millions of facial images that it extracted from Ever users’ photos with facial images” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Press release sentence begins 'Between September 2017 and August 2019, Everalbum combined millions of facial images'. Complaint para 12 says the same. Per complaint paras 13-16 the four datasets were built with differing geographic exclusions, and two were discarded after testing.
    - “with facial images that Everalbum obtained from publicly available datasets to create four datasets” — U.S. Federal Trade Commission, <https://www.ftc.gov/news-events/news/press-releases/2021/01/california-company-settles-ftc-allegations-it-deceived-consumers-about-use-facial-recognition-photo> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows only that face images from users' photos were combined 'with facial images'; it does not show the dates, the public datasets or the four datasets. The same complaint sentence has 'Between September 2017 and August 2019' and 'obtained from publicly available datasets in order to create four new datasets'. Separately, its use for matrix.supply_models stretches the field: these were training inputs, not listed inventory, and storage-app uploads are not 'contributor_uploads' in the vocab's sense; the profile's own note admits this.
- **c024** The FTC alleged that for its June 2018 dataset Everalbum excluded users it believed from their IP addresses to be in Illinois, Texas, Washington or the EU.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “excluded facial images extracted from the photos of Ever users Everalbum believed to be residents of Illinois, Texas” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c026** The FTC alleged that the August 2019 dataset excluded users who had not turned on face recognition or clicked 'Yes' on the consent pop-up.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “excluded facial images extracted from the photos of Ever users who had not either turned on the setting, or clicked “Yes”” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c027** The FTC alleged that the model trained on the August 2019 dataset was used to build the face recognition services of Everalbum's enterprise brand Paravision, formerly Ever AI.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “to build the face recognition services offered by its enterprise brand, Paravision (formerly Ever AI)” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c034** The FTC reported that about 12 million consumers worldwide had installed the Ever app.  
  _number · government · as of 2021-05-06 (publication)_ · **12000000 app installs** (consumers who installed Ever, worldwide, cumulative; cumulative since 2015)
  - “Globally, approximately 12 million consumers have installed Ever.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — FTC complaint para 3. Added after Part 2: same URL as the profile's only source; no second source found (no search available). The figure is the FTC's, not the vendor's, so the statement's attribution is right.
    - “Globally, approximately 12 million consumers have installed Ever.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**
- **c043** Ever AI said in 2019 that it had a private global dataset of 13 billion photos and videos from tens of millions of users in 95 countries.  
  _number · vendor_stated · as of 2019-05-09 (publication)_ · **13000000000 photos and videos** (company's own claim quoted by NBC News; not independently verified; size of the Ever user corpus, not a training set; as of May 2019)
  - “ever-expanding private global dataset of 13 billion photos and videos” — NBC News, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The 13-billion / 95-countries figure is not in any FTC document on the case page (complaint, analysis, order, response letters, Chopra statement, compliance report). Contemporaneous 2019 press (NBC News reporting on Ever) ought to exist but its URL could not be reached by navigation, and the Wayback Machine (for ever.ai 2019) is blocked. arXiv's own search for Everalbum returned nothing. Added after Part 2: the profile's own source is NBC News (Solon and Farivar, 2019-05-09), which attributes the figure to Ever AI's news releases; fetched, it does relay it, so had it been reachable blind this would have been confirmed_relayed, not independent.
  - verifier (scope): **quote_incomplete** — The quote shows only '13 billion photos and videos'; 'tens of millions of users in 95 countries' is in the next words of the NBC sentence. NBC attributes the figure to Ever AI's news releases, which are not dated in the article, so 'said in 2019' is the article's date, not necessarily the release's. The source is tagged independent_press but here it relays the vendor (press_relayed); the claim's origin vendor_stated is right.
- **c046** Paravision states that the face recognition it sells is trained only on public datasets, consenting employees, and images bought from third parties outside the US and EEA who must contractually obtain consent.  
  _terms · filing · as of 2022-05-05 (publication)_
  - “from third parties outside of the United States and Europe Economic Area who are contractually obligated to obtain consent” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
- **c051** Paravision's privacy policy (May 2024) says it gets product-development images from people it photographs and from third parties contractually obligated to obtain their consent.  
  _terms · legal_text · as of 2024-05-22 (page_dated)_
  - “through third parties who are contractually obligated to obtain your consent” — Paravision, <https://www.paravision.ai/privacy-policy/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### trust

- **c029** The FTC alleged that Everalbum submitted the model from its June 2018 dataset to NIST for accuracy testing against competing face recognition technologies.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “submitted the resulting face recognition technology to the National Institute of Science and Technology for accuracy testing” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### transaction

- **c040** Paravision states that it operates solely business-to-business or business-to-government and offers nothing to individual consumers.  
  _offer · filing · as of 2022-05-05 (publication)_
  - “Paravision operates solely on a business-to-business or business-to-government basis” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Paravision's own sworn statement (2022-05-05), hosted by the FTC. The FTC complaint independently describes the enterprise brand selling to enterprise customers, but nothing independent confirms the absence of any consumer offering after Ever's shutdown on 2020-09-30.
    - “Paravision operates solely on a business-to-business or business-to-government basis and does not offer any products” — Paravision, Inc. (published by the U.S. Federal Trade Commission), <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows B2B/B2G only; the 'offers nothing to individual consumers' half needs the next words, 'and does not offer any products or services to individual consumers'. The statement is in the present tense but rests on a 2022-05-05 filing.

### licence

- **c032** Ever's help article told users that turning face recognition on meant they had the approval of everyone featured in their photos and videos.  
  _terms · government · as of 2021-05-06 (publication)_
  - “and that you have the approval of everyone featured in your photos and videos” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Complaint para 9 quotes the 'What is Face Recognition?' help article posted from July 2018; the FTC alleged it was misleading for users outside TX, IL, WA and the EU before April 2019. The original everalbum.com article is not reachable (Wayback blocked). Added after Part 2: same URL as the profile's source; no second source found.
    - “and that you have the approval of everyone featured in your photos and videos” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The words are the help article's as quoted in complaint para 9; the article was posted from July 2018. The statement could say it is known only through the FTC complaint.
- **c045** NBC News reported that Ever's only disclosure of training use was a brief privacy-policy reference added after NBC News contacted the company.  
  _event · independent · as of 2019-05-09 (publication)_
  - “except for a brief reference that was added to the privacy policy after NBC News reached out” — NBC News, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c047** Paravision's AI Principles commit it to obtaining all necessary consents, including appropriate releases, before collecting data.  
  _terms · vendor_stated · as of 2022-04-06 (page_dated)_
  - “we will ensure that we have obtained all necessary consents, including appropriate releases, prior to the collection of data” — Paravision, <https://www.paravision.ai/ai-principles/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c048** Paravision's AI Principles say it uses well-recognized public datasets subject to its review of their licences.  
  _terms · vendor_stated · as of 2022-04-06 (page_dated)_
  - “we will collect widely-used and well-recognized, public datasets subject to our review of their corresponding licenses.” — Paravision, <https://www.paravision.ai/ai-principles/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The compliance report summarises Paravision's AI Principles (published August 2020) and repeats the licence-review point; this is the vendor restating its own principle, so it confirms the vendor said it, not that reviews happen. The wording 'well-recognized' is not in the report and could only be checked on the vendor's own page.
    - “Conducts a review of all applicable licenses for public datasets it uses.” — Paravision, Inc. (published by the U.S. Federal Trade Commission), <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The AI Principles quote matches the statement. The page date (2022-04-06) is the principles page's own date; the compliance report says they were first published in August 2020.

### custody

- **c030** The FTC complaint states that Everalbum did not share Ever users' photos, face images or personal information with Paravision's customers; only the resulting technology was sold.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “not shared images from Ever users’ photos or Ever users’ photos, videos, or personal information with Paravision’s customers” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - “Ever AI does not share the photos or any identifying information about users with its facial recognition customers.” — NBC News, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — FTC press release of 2021-01-11 restating complaint para 16 (the complaint itself says the same).
    - “did not share images from Ever users' photos or their photos, videos, or personal information with those customers” — U.S. Federal Trade Commission, <https://www.ftc.gov/news-events/news/press-releases/2021/01/california-company-settles-ftc-allegations-it-deceived-consumers-about-use-facial-recognition-photo> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Complaint quote supports it. The profile's second source (NBC News) quotes Ever's CEO, so it is the vendor relayed (press_relaying_vendor), not independent_press for this point.

### vetting

- **c023** The FTC alleged that Everalbum's scripts filtered out faces its machines judged to be under thirteen in three of the four datasets.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “not identified by Everalbum’s machines as being an image of someone under the age of thirteen” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c031** The FTC alleged that when Ever's face-grouping 'Friends' feature launched in February 2017, face recognition was on by default for all mobile users with no way to turn it off.  
  _terms · government · as of 2021-05-06 (publication)_
  - “it enabled face recognition by default for all users of the Ever mobile app” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c049** Paravision keeps a list of countries where it will not do business, available on request.  
  _terms · vendor_stated · as of 2022-04-06 (page_dated)_
  - “We maintain and make available on request a list of countries in which we will not do business at all.” — Paravision, <https://www.paravision.ai/ai-principles/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Paravision states that it vets the partners and customers it does business with.  
  _terms · filing · as of 2022-05-05 (publication)_
  - “Paravision vets partners and customers with whom the Company does business” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c038** Commissioner Chopra wrote that the company allegedly enhanced its face recognition by baiting consumers into using Ever, a 'free' photo app.  
  _terms · government · as of 2021-01-08 (publication)_
  - “The company enhanced their facial recognition technology by allegedly baiting consumers into using Ever, a “free” app” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Statement dated 2021-01-08. This is the primary document itself and the same URL the profile cites; no second source quoting it was reachable without search.
    - “The company enhanced their facial recognition technology by allegedly baiting consumers into using Ever, a “free” app” — U.S. Federal Trade Commission, Office of Commissioner Rohit Chopra, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Supports the statement. As support for contributor_pay_model 'none' it is indirect: 'free' describes the app's price to users, not the absence of payment to them, though no payment appears anywhere in the FTC record.

### post_sale

- **c035** The FTC reported that about 36,000 Ever users had deactivated their accounts since January 2017.  
  _number · government · as of 2021-05-06 (publication)_ · **36000 deactivated accounts** (Ever users who deactivated, cumulative; January 2017 to the complaint)
  - “Since January 2017, approximately 36,000 Ever users have deactivated their accounts.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — FTC complaint para 17. Added after Part 2: same URL as the profile's only source; no second source found (no search available).
    - “Since January 2017, approximately 36,000 Ever users have deactivated their accounts.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**
- **c036** The FTC alleged that until at least October 2019 Everalbum deleted none of the photos or videos of users who had deactivated their accounts, despite promising to.  
  _terms · government · as of 2021-05-06 (publication)_
  - “did not, in fact, delete the photos or videos of any users who had deactivated their accounts” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c037** From October 2019 Everalbum began deleting the photos and videos of Ever accounts deactivated for more than three months.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “deleting all the photos and videos associated with Ever accounts that have been deactivated for more than three months” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Paravision, the company formerly named Everalbum, was still publishing product announcements in September 2026.  
  _status · vendor_stated · as of 2026-09-23 (page_dated)_
  - “New capability helps organizations evaluate biometric face images against ISO and ICAO image-quality requirements” — Paravision, <https://www.paravision.ai/news/paravision-announces-iso-icao-image-quality-suite-for-travel-and-border-applications/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The DHS S&T feature dated 2026-09-01 describes a joint Paravision/AiFi solution in operational exit-biometrics testing and quotes a Paravision VP, so Paravision was visibly trading in September 2026. It does not itself show a product announcement; the 2026-09-23 ISO/ICAO Image Quality Suite release exists only on paravision.ai (vendor). Biometric Update (2026-09-17, SITA article) also mentions Paravision's emaratech partnership. No search available.
    - “said Carl Gohringer, Vice President of Global Public Sector at Paravision” — U.S. Department of Homeland Security, Science and Technology Directorate, <https://www.dhs.gov/science-and-technology/news/2026/09/01/feature-article-biometrics-border-making-exit-secure-and-efficient> · regulator_guidance · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The fact is right (page dated 2026-09-23) but the quote is a product tagline that shows neither the date nor that Paravision announced it. Words that would: 'September 23, 2026 — Paravision, a leader in trusted Identity AI, today announced the Paravision ISO/ICAO Image Quality Suite'. The profile's status rests on a vendor page alone; see everalbum-v001 for an independent September 2026 source.
- **c002** Everalbum, Inc. changed its name to Paravision, Inc. on 7 September 2021.  
  _event · filing · as of 2021-09-07 (publication)_
  - “On September 7, 2021, Everalbum, Inc. changed its name to Paravision, Inc.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
- **c003** Paravision says it stopped offering any consumer product when it shut down the Ever photo app on 30 September 2020, about nine months before the FTC order.  
  _event · filing · as of 2020-09-30 (publication)_
  - “stopped offering any product or service to consumers on September 30, 2020 when it shut down the Ever application” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
- **c005** In January 2026 Paravision announced the promotion of Tiffany Lee to Chief Financial Officer.  
  _event · vendor_stated · as of 2026-01-26 (page_dated)_
  - “Paravision today announced the promotion of Tiffany Lee to Chief Financial Officer (CFO)” — Paravision, <https://www.paravision.ai/news/paravision-appoints-tiffany-lee-as-chief-financial-officer/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Trade-press round-up dated 2026-02-05 restating Paravision's own 2026-01-26 announcement; reached via biometricupdate.com's own Paravision tag page (no search available). Nothing found newer than this that is a corporate event, but without search a later event (layoffs, funding) cannot be ruled out.
    - “Paravision has promoted Tiffany Lee to Chief Financial Officer” — Biometric Update, <https://www.biometricupdate.com/202602/paravision-alcatraz-id-me-one-identity-trulioo-strengthen-leadership-teams> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the page dated 2026-01-26. As 'newest dated corporate event' it holds on what was reachable: later newsroom items (March, August, September 2026) are product and benchmark news, not corporate events. Without search a later layoff or funding event cannot be excluded.
- **c028** The FTC alleged that Everalbum discarded, after testing, the models built from its first two datasets of autumn 2017 and April 2018.  
  _architecture · government · as of 2021-05-06 (publication)_
  - “Everalbum discarded the face recognition technology that it developed in the Fall of 2017 and April 2018” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### demand

- **c033** The FTC reported that about 25% of the roughly 300,000 Ever users who answered the face-recognition pop-up chose to turn it off.  
  _number · government · as of 2021-05-06 (publication)_ · **25 percent of respondents** (share of the ~300,000 Ever users who made a selection on the opt-in pop-up and chose to turn face recognition off; since the pop-up was introduced (May 2018 / April 2019) to the complaint)
  - “approximately 25% of the approximately 300,000 users who made a selection” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The sentence continues 'chose to turn face recognition off'. FTC complaint para 8 (Docket C-4743, issued 2021-05-06). The figure appears only in the complaint; no second FTC document or press source restating it was reachable without search. Added after Part 2: this is the same URL the profile cites, so it confirms the profile read the complaint correctly but is not a second, independent corroboration.
    - “approximately 25% of the approximately 300,000 users who made a selection when presented with the pop-up message” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_complaint_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote stops before what the 25% did. The complaint's next words are 'when presented with the pop-up message chose to turn face recognition off'.
- **c042** NBC News reported in 2019 that Ever AI offered law enforcement the ability to identify faces in body-cam recordings or live video feeds.  
  _offer · independent · as of 2019-05-09 (publication)_
  - “It offers law enforcement the ability to identify faces in body-cam recordings or live video feeds.” — NBC News, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371> · independent_press · retrieved 2026-10-01 · quote check: exact

### regulation

- **c004** On 7 May 2021 the FTC announced that the Commission had voted 4-0 to finalize its settlement with Everalbum.  
  _event · government · as of 2021-05-07 (publication)_
  - “the Commission voted 4-0 to finalize the settlement” — U.S. Federal Trade Commission, <https://www.ftc.gov/news-events/news/press-releases/2021/05/ftc-finalizes-settlement-photo-app-developer-related-misuse-facial-recognition-technology> · regulator_guidance · retrieved 2026-10-01 · quote check: fetch_failed
- **c006** Paravision executed its one-year sworn compliance report under the FTC order on 5 May 2022, and the FTC published a redacted copy.  
  _event · filing · as of 2022-05-05 (publication)_
  - “is true and correct. Executed on: May 5, 2022.” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
- **c007** The FTC order defines 'Affected Work Product' as any models or algorithms developed even partly from biometric data collected from Ever users.  
  _terms · government · as of 2021-05-06 (publication)_
  - “any models or algorithms developed in whole or in part using Biometric Information Respondent collected from Users” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c008** The FTC order required Everalbum to delete or destroy all Affected Work Product within 90 days and confirm it in a sworn statement.  
  _terms · government · as of 2021-05-06 (publication)_
  - “Within ninety (90) days after the issuance of this Order, delete or destroy any Affected Work Product” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c009** The FTC order required deletion within 90 days of all face embeddings derived from users who had not by then given express affirmative consent.  
  _terms · government · as of 2021-05-06 (publication)_
  - “delete or destroy all Face Embeddings derived from Biometric Information Respondent collected from Users who” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c010** The FTC order required deletion within 30 days of all photos and videos of Ever users who had requested deactivation of their accounts.  
  _terms · government · as of 2021-05-06 (publication)_
  - “delete or destroy all photos and videos that Respondent collected from Users who requested deactivation” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c011** The FTC order bars Everalbum from using a user's biometric data to train or alter any face recognition model without that user's affirmative express consent.  
  _terms · government · as of 2021-05-06 (publication)_
  - “Obtain the affirmative express consent of the User from whom Respondent collected the Biometric Information” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c012** The FTC order requires the biometric-use disclosure to be made separately from any privacy policy or terms of use page.  
  _terms · government · as of 2021-05-06 (publication)_
  - “separate and apart from any “privacy policy,” “terms of use” page, or other similar document” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c013** The FTC order's notice-and-consent provision does not apply to a product or service offered only to users outside the United States.  
  _terms · government · as of 2021-05-06 (publication)_
  - “any product or service that is only offered to Users outside the United States” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c014** The FTC order's deletion duties bind Everalbum's officers, agents and employees and all persons in active concert with them who receive actual notice of the order.  
  _terms · government · as of 2021-05-06 (publication)_
  - “all other persons in active concert or participation with any of them, who receive actual notice of this Order” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c015** The FTC order runs for twenty years from its issuance, subject to the order's exceptions.  
  _terms · government · as of 2021-05-06 (publication)_
  - “This Order will terminate twenty (20) years from the date of its issuance” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c016** Everalbum settled without admitting or denying the FTC's allegations, so the data-use facts in the complaint remain allegations.  
  _terms · government · as of 2021-05-06 (publication)_
  - “it neither admits nor denies any of the allegations in the Complaint” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c017** The Everalbum settlement imposed no monetary penalty, because FTC Act Section 5 does not allow civil penalties for a first offense.  
  _outcome · government · as of 2021-05-06 (publication)_
  - “the settlement does not require the defendant to pay any penalty” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - “does not allow the Commission to seek civil penalties for a party’s first offense” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/cases/wpf_response_final_0.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — FTC letter of 2021-05-06 to the World Privacy Forum, answering its criticism that the consent agreement had no monetary penalty. Commissioner Chopra's statement also says 'the settlement does not require the defendant to pay any penalty' and attributes it to the absence of a Section 18 rule. Added after Part 2: both are the profile's own sources; no source outside ftc.gov found.
    - “Section 5 of the Federal Trade Commission Act does not allow the Commission to seek civil penalties for a party's first” — U.S. Federal Trade Commission, Office of the Secretary, <https://www.ftc.gov/system/files/documents/cases/wpf_response_final_0.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The two quotes together support it. The FTC letter's sentence begins 'Section 5 of the Federal Trade Commission Act does not allow'; the quoted fragment omits 'Section 5' but the claim is right. Chopra frames the cause more narrowly (no Section 18 rule restating the precedent).
- **c018** Commissioner Chopra described the remedy as requiring the company to delete the facial recognition technologies enhanced by improperly obtained photos.  
  _terms · government · as of 2021-01-08 (publication)_
  - “the company must delete the facial recognition technologies enhanced by any improperly obtained photos” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c019** Chopra called model deletion a course correction because earlier FTC settlements had let data-protection violators keep algorithms built on ill-gotten data.  
  _event · government · as of 2021-01-08 (publication)_
  - “Commissioners have previously voted to allow data protection law violators to retain algorithms” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **c020** Paravision states in its sworn 2022 compliance report that it timely submitted statements to the FTC confirming the ordered deletions of photos, embeddings and models.  
  _outcome · filing · as of 2022-05-05 (publication)_
  - “Paravision timely submitted written statements to the Commission confirming it deleted the data” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The only source is Paravision's own sworn compliance report (executed 2022-05-05 by CEO Doug Aley), hosted on ftc.gov. It shows Paravision said this under penalty of perjury; no FTC finding or independent audit confirming the deletions was found. The statement's framing ('Paravision states') is accurate.
    - “Paravision timely submitted written statements to the Commission confirming it deleted the data required under Order § III” — Paravision, Inc. (published by the U.S. Federal Trade Commission), <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote ends at 'confirming it deleted the data', which does not show that the statements covered photos, embeddings and models. Words that would: 'confirming it deleted the data required under Order § III (A), (B), and (C)' (III A photos/videos, B face embeddings, C Affected Work Product).
- **c025** Commissioner Chopra noted that Everalbum took greater care with users in states that had biometric laws, so its deception fell on users in other states.  
  _terms · government · as of 2021-01-08 (publication)_
  - “Everalbum took greater care when it came to these individuals in these states” — U.S. Federal Trade Commission, <https://www.ftc.gov/system/files/documents/public_statements/1585858/updated_final_chopra_statement_on_everalbum_for_circulation.pdf> · regulator_guidance · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** A DHS Science and Technology feature dated 1 September 2026 describes a joint Paravision and AiFi solution in operational testing of biometric exit capture and quotes Paravision's VP of Global Public Sector.  
  _status · government · as of 2026-09-01 (publication) · scope: US_
  - “said Carl Gohringer, Vice President of Global Public Sector at Paravision” — U.S. Department of Homeland Security, Science and Technology Directorate, <https://www.dhs.gov/science-and-technology/news/2026/09/01/feature-article-biometrics-border-making-exit-secure-and-efficient> · regulator_guidance · retrieved 2026-10-01 · quote check: fetch_failed

## Unknown

- `matrix.erasure_after_sale` — not_published; tried <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf>, <https://www.ftc.gov/system/files/documents/cases/1923172_-_everalbum_decision_final.pdf>, <https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3172-everalbum-inc-matter>, <https://www.ftc.gov/news-events/news/press-releases/2021/05/ftc-finalizes-settlement-photo-app-developer-related-misuse-facial-recognition-technology>
- `other.recall_of_deployed_models` — not_published; tried <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf>, <https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3172-everalbum-inc-matter>, <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371>
- `other.sworn_deletion_statements` — not_published; tried <https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3172-everalbum-inc-matter>, <https://www.ftc.gov/system/files/ftc_gov/pdf/paravision_compliance_report_redacted.pdf>
- `other.model_pricing_and_sales_process` — not_published; tried <https://www.paravision.ai/>, <https://www.paravision.ai/newsroom/>
- `other.funding_and_headcount_after_2022` — not_published; tried <https://www.paravision.ai/newsroom/>, <https://www.paravision.ai/news/paravision-appoints-tiffany-lee-as-chief-financial-officer/>
- `other.independent_press_after_order` — not_found; tried <https://www.nbcnews.com/tech/security/millions-people-uploaded-photos-ever-app-then-company-used-them-n1003371>
- `other.ever_help_article_and_privacy_policy_originals` — not_found

## Conflicts

- c027, c021: Both hold at their dates: the FTC alleged a model trained on Ever data was built into Paravision's services (2019); after the ordered deletion, Paravision swore in May 2022 that what it sells was not trained on Ever data. (newer_wins_status)

## Leads, not cited

- <https://www.federalregister.gov/documents/2021/01/25/2021-01430/everalbum-inc-analysis-of-proposed-consent-order-to-aid-public-comment> — Federal Register notice of the proposed order; not fetched.
- <https://www.ftc.gov/system/files/documents/cases/valentine_response_final.pdf> — FTC response to a second public comment; not fetched.
- <https://www.nytimes.com/interactive/2019/10/11/technology/flickr-facial-recognition.html> — Cited by Chopra on photo-sharing apps feeding face recognition; not fetched (paywall likely).
- <https://www.ftc.gov/system/files/documents/cases/everalbum_analysis.pdf> — FTC analysis to aid public comment; read, restates the complaint and order.
