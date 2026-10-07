# Adobe Stock

stock_media · light · status: **active** · also known as Fotolia

> Rendered from `ledger/adobe-stock.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Adobe Stock (licensed 'Stock Assets' under Standard, Enhanced and Extended licences)” and its bespoke side “none found”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c010, c023, c012 | Adobe sublicenses contributors' Work to buyers under its own User Agreement; contributors are not principals behind an agency. |
| economics_model | revenue_share | c050, c051 | Contributors get 33% (images) or 35% (video); Adobe keeps the rest. |
| who_pays_fee | seller | c050, c052 | No buyer-side fee; Adobe's share comes out of the licence price before the contributor royalty. |
| supply_models | contributor_uploads | c056, c006 | Only contributor uploads evidenced; whether Adobe also licenses whole collections from partner agencies was not established. |
| custody_model | copy_to_buyer | c039, c031 | Buyers download files; Adobe advises downloading because re-download may not be available after termination. |
| transaction_mode | both | c043, c049 | Self-serve credit plans for individuals; phone and consultation for teams and enterprise. |
| public_prices | some | c043, c045, c049 | Individual plans and credit costs are published; enterprise pricing goes through a consultation. |
| licence_model | tiered_standard | c024, c026, c027 | Standard, Enhanced and Extended licences (plus Editorial and Comp). |
| exclusivity_offered | no | c011, c024 | Adobe's own right to sublicense is non-exclusive, so no exclusive licence can be offered. |
| public_listing | unknown |  |  |
| buyer_vetting | unknown |  |  |
| sample_mechanics | free_sample_download | c031, c032 | Watermarked 'comp' downloads for 90-day preview use. |
| versioning | unknown |  | Single assets, not versioned datasets; nothing published on revisions. |
| human_subject_consent_docs | asserted_only | c014, c015, c033 | Contributor warrants releases and gives them to Adobe on request; buyers get an indemnity (capped) rather than release copies. |
| contributor_pay_model | royalty_or_revenue_share | c050, c051, c002, c005 | Per-licence royalties plus a discretionary annual Firefly training bonus weighted by assets considered for training and the licences they earned. |
| catalogue_plus_custom | catalogue_only | c057 | No custom or commissioned service found; the business product page timed out, so this rests on the 10-K description and the pages fetched. |
| erasure_after_sale | contractual_deletion | c036, c020 | Buyers must cease use and possession if Adobe instructs them over a suspected third-party claim; a contributor's own removal does not reach licences already sold. |
| quality_evidence | unknown |  |  |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Designers and businesses license single assets through credit plans (10 to 750 credits a month) and in-app from Photoshop, Illustrator and Express; video costs more credits than images. Buyer terms forbid using assets to train AI, so it is not a training-data source for buyers; volumes and buyer mix are not published. | c057, c058, c045, c046, c028 |
| Q2 | partial | Contributors get distribution into Adobe's apps (Stock, Firefly, Express, Creative Cloud) and to API partners and affiliates, with no API of their own; Adobe gives no reason a contributor would list here rather than sell directly. | c058, c061, c021, c067, c066 |
| Q3 | sourced | Inventory comes from contributor uploads under a non-exclusive, perpetual, royalty-free licence to Adobe that also covers 'developing new features and services'; Adobe trains Firefly on licensed content and pays contributors a discretionary annual training bonus based on assets considered for training and the licences they earned. | c056, c006, c007, c059, c002, c003, c005 |
| Q4 | partial | No commissioned work is resold. Contributor terms reach Work uploaded under earlier versions, and contributors accept new pricing simply by not removing their Work; Adobe's training use rests on a general 'new features and services' clause, compensated by a discretionary bonus. Contributor reaction to the training use was not researched (no search). | c008, c009, c007, c002 |
| Q5 | sourced | Adobe is licensor of record: it sublicenses under its own User Agreement and is not the contributor's agent. Contributors warrant rights and releases and indemnify buyers; Adobe also indemnifies buyers of paid, non-editorial assets up to US$10,000 per asset. | c010, c023, c012, c017, c033, c034, c035 |
| Q6 | sourced | Assets are downloaded by the buyer (web or API); Adobe hosts the files and advises buyers to download licensed assets because re-download may not be available after termination. | c039, c065 |
| Q7 | partial | Contributors warrant model and property releases and hand them to Adobe on request; editorial work may go without releases. Buyers can filter for released assets but are not shown to receive the releases; Adobe's indemnity covers publicity and privacy claims, and use for identifying people is banned. | c014, c015, c016, c062, c033, c029 |
| Q8 | sourced | Non-exclusive tiered licences (Standard with a 500,000 cap, Enhanced, Extended); no resale of licences and a ban on AI training and face identification. Adobe can order a buyer to cease use and possession of an asset facing a claim, but enforcement against infringers is at Adobe's option; no audit or fingerprinting terms found. | c024, c025, c026, c027, c011, c040, c028, c036, c022 |
| Q9 | sourced | Self-serve credit subscriptions and packs with published prices, plus a consultation route and an enterprise-only API for businesses. Adobe owns the licence relationship and pays contributors a 33% (images) or 35% (video) royalty. | c043, c044, c049, c064, c050, c051, c018 |
| Q10 | partial | The unit is a single Stock Asset licensed to a user or business; licences are perpetual and survive a subscription ending or the asset's removal, while Adobe may stop licensing any asset. No dataset or revision object exists. | c041, c038, c020, c037, c019 |
| Q11 | partial | Buyers can download watermarked comp versions for 90 days of preview use; the API exposes release and AI-generated flags. Adobe disclaims the accuracy of assets and their metadata. | c031, c032, c062, c063, c042 |
| Q12 | partial | Only a catalogue side was found ('Adobe Stock', licensed 'Stock Assets'); Adobe's annual report describes a library and no custom collection service. The business product page timed out, so a custom offer cannot be ruled out. | c057 |

## Claims

### positioning

- **c001** Adobe Stock is trading: its pricing page was selling credit subscriptions on 2026-10-01 (page served in Indian rupees).  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, India_
  - “₹2,394.22/mo” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Confirms Adobe Stock was a live, revenue-bearing subscription business in Q1 FY2026 (10-Q filed 2026-03-25), and that its ARR was shrinking. The FY2025 10-K (filed 2026-01-15) also describes Adobe Stock as licensed in-app, on stock.adobe.com or by multi-asset subscription. The Q2 and Q3 FY2026 10-Qs (filed 2026-06-15 and 2026-09-22) do not mention Adobe Stock at all. The rupee pricing page on 2026-10-01 is vendor-only by nature. No search available, so no independent 2026 report on Adobe Stock specifically could be reached.
    - “partially offset by a decrease from Adobe Stock” — U.S. SEC (EDGAR), Adobe Inc. Form 10-Q for the quarter ended 2026-02-27, <https://www.sec.gov/Archives/edgar/data/796343/000079634326000056/adbe-20260227.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — Page re-fetched 2026-10-01: prices are in rupees and the plans are credit subscriptions, so the fact holds. But the quote '₹2,394.22/mo' shows only a rupee price, not what is sold; the page's '10 Stock credits/mo ₹2,394.22/mo' would show the credit subscription.
- **c057** Adobe's fiscal 2025 annual report describes Adobe Stock as giving designers and businesses access to millions of curated, royalty-free assets; it describes no custom or commissioned content service.  
  _offer · filing · as of 2026-01-15 (publication) · scope: Adobe Stock_
  - “Adobe Stock provides designers and businesses with access to millions of high-quality, curated, royalty-free photos” — Adobe Inc. (Form 10-K, fiscal 2025, SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c006** Adobe Stock contributors grant Adobe a non-exclusive, worldwide, perpetual, fully-paid and royalty-free licence to their Work.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “You grant us a non-exclusive, worldwide, perpetual, fully-paid, and royalty-free license to use, reproduce” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c007** The contributor licence lets Adobe use contributed Work for 'developing new features and services', besides licensing it to users; the agreement does not name AI training.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “licensing the Work to users; developing new features and services; archiving the Work” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c012** The contributor agreement states Adobe and the contributor are independent contractors and not principal and agent.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “we are not joint venturers, partners, principal and agent, or employer and employee” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** Contributors resident outside the United States contract with Adobe Canada Services Corporation; US residents with Adobe Inc.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “If you reside outside of the United States, your relationship is with Adobe Canada Services Corporation” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c055** Adobe tells contributors they enter a non-exclusive partnership that lets Adobe promote and license their content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme_
  - “you enter a non-exclusive partnership that allows us to promote and license your content” — Adobe, <https://contributor.stock.adobe.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Adobe Stock accepts contributor uploads of photos, illustrations, videos, vectors and generative-AI content.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme_
  - “We accept many types of content such as photos, illustrations, videos, vectors, Gen AI and more.” — Adobe, <https://contributor.stock.adobe.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Page 47, ¶154, relaying an April 2024 Bloomberg investigation: Adobe paid Firefly bonuses in September 2023 to contributors, including those who supplied AI-generated content via Adobe Stock; ¶155 relays that Adobe said Midjourney-derived images were about 5% of training data. This confirms contributor uploads and the generative-AI part. The other media types are confirmed only as what Adobe Stock offers (FY2025 10-K: 'photos, vectors, illustrations, videos, templates, audio and 3D assets'), not as contributor uploads. Plaintiffs' allegation relaying press; not a finding of the court.
    - “including those who supplied AI-generated content via Adobe Stock” — CourtListener RECAP: Hirschberger v. Narayen, N.D. Cal. 5:26-cv-05882, verified stockholder derivative complaint (filed 2026-06-16), <https://storage.courtlistener.com/recap/gov.uscourts.cand.472306/gov.uscourts.cand.472306.1.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote names photos, illustrations, videos, vectors and Gen AI. Source class vendor_marketing is right.
- **c061** Adobe tells contributors their submissions fuel Adobe Stock, Firefly, Express and Creative Cloud.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme_
  - “Your submissions fuel Adobe Stock, Firefly, Express, and Creative Cloud” — Adobe, <https://contributor.stock.adobe.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: fuzzy 0.88
- **c066** There is no API for Adobe Stock contributors.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “there is no API for Stock Contributors” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/getting-started/> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c041** A licence taken by a Business User is granted to the business, not to the individual user.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “Any license or other Entitlement granted by Adobe to a Business User is granted to the Business.” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c062** The Adobe Stock Search API lets a buyer filter for assets that have model or property releases.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “Return found assets only if the asset has model or property releases.” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/api/11-search-reference/> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** The Adobe Stock Search API flags AI-generated ('gentech') assets and can filter them in or out.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “Filter AI generated (gentech) and non-gentech assets.” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/api/11-search-reference/> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c021** Adobe runs an API programme through which partners showcase contributors' Work and facilitate its sale.  
  _offer · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “program that allows our partners to showcase and to facilitate sales of the Work” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c058** Adobe Stock is built into Adobe's apps, including Photoshop, Illustrator and Adobe Express, where users search and add assets.  
  _offer · filing · as of 2026-01-15 (publication) · scope: Adobe Stock_
  - “Adobe Stock is built into our apps, including Adobe Photoshop, Adobe Illustrator and Adobe Express” — Adobe Inc. (Form 10-K, fiscal 2025, SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c067** Adobe Stock affiliates earn a US$72 commission when a referred user subscribes to a plan of at least 10 images a month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API, Affiliate programme_ · **72 USD per referred subscription** (Adobe pays the affiliate a referral commission when the referred user subscribes to a plan of 10+ images a month; one-off)
  - “$72 when referred user subscribe to a plan with minimum 10 images a month” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/faq/stock-api-business-faq> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **disputed** — Not independent: this is Adobe's own adobe.com affiliate page, which on 2026-10-01 listed Adobe Stock commissions as US$43 for a monthly or yearly-paid-monthly subscription, 8.33% on single purchases and 85% of the first month on '3 standard assets/month', with no US$72 figure and no 10-images-a-month plan. The affiliate network is Partnerize (adobe.com links signup.partnerize.com/signup/en/adobe, which redirects to join.partnerize.com/adobe/en, a page rendering only 'Sign Up to PHG Affiliate Program'), so no third-party statement of the rate was reachable. The US$72 figure may be from an older or regional stock.adobe.com page; see scope verdict.
    - “Monthly subscription: Earn US$43” — Adobe (adobe.com Affiliate Program page), <https://www.adobe.com/affiliates.html> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_wrong** — The quote is from an undated Stock API business FAQ on developer.adobe.com, and the claim dates it as 2026-10-01 using only the retrieval date. That FAQ links to adobe.com/affiliates.html, which on 2026-10-01 gave Adobe Stock affiliate commissions of US$43 (monthly subscription), 8.33% (single purchase) and 85% of the first month (3 assets/month), and had no US$72 figure or 10-images plan. The figure is probably stale. The scope 'Adobe Stock API' is also wrong: this is the Adobe Affiliate Program (via Partnerize), not the API.

### trust

- **c017** Contributors indemnify Adobe and its licensees, expressly including users (buyers), against claims arising from the Work they submit.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “partners, licensees, and licensors (including users) from any claim, demand, loss, or damages” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** Before licensing, a buyer may download a watermarked 'comp' version of a Work for preview use.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock, Comp License_
  - “A Comp License version of a Stock Asset is downloaded as either a watermarked Work” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c032** A comp version may be used for up to 90 days, only to preview how the asset would look in production.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock, Comp License_
  - “For up to 90 days from the date of download of a Stock Asset” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c033** Adobe defends buyers against third-party claims that use of a paid-for Stock Asset infringes copyright, trademark, publicity or privacy rights.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “directly infringes the third party’s copyright, trademark, publicity rights, or privacy rights” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** Adobe's aggregate liability for any indemnified Stock Asset is capped at US$10,000 per asset.  
  _number · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_ · **10000 USD per asset** (cap on Adobe's indemnity liability to the buyer for a licensed and paid-for Stock Asset; editorial works excluded; aggregate)
  - “will in no event exceed US$10,000 per each asset” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Adobe's own buyer terms.
  - verifier (scope): **scope_ok** — s.10.3(A) applies 'irrespective of the number of times' an asset is downloaded and 'notwithstanding anything to the contrary' in any other agreement, so it covers all licence tiers. A separate US$10,000 cap applies per Indemnified Firefly Output or per claim (s.10.3(B)).
- **c035** Editorial Works and unpaid free assets are excluded from Adobe's buyer indemnity.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “means a Stock Asset (excluding Editorial Works) that you have licensed and paid for” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact

### transaction

- **c049** For team and enterprise plans the pricing page offers a phone number and a consultation request alongside self-serve plans.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, India_
  - “Contact us at 1800 102 5567 or request a consultation” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A feature of Adobe's own India pricing page.
  - verifier (scope): **quote_incomplete** — The phone number and consultation link sit under the heading 'Subscription plans made for business'. The page as fetched does not say 'team' or 'enterprise', so the statement's 'team and enterprise plans' is an inference; the heading should be quoted.
- **c064** Since November 2024 the Adobe Stock API is available only to Stock for Enterprise customers (and affiliates for search).  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “Beginning in November, 2024, the Stock API will only be available to Stock for Enterprise customers.” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/getting-started/> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** With an authentication token the API can check a user's purchase status, license an asset and download the original.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “obtain a license for the user for a specific asset, and download the original asset” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/getting-started/> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c043** The Adobe Stock plan of 10 credits a month without AI Studio was priced at ₹2,394.22 a month on the Indian pricing page.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, 10 Stock credits/mo, India_ · **2394.22 INR per month** (buyer pays; 10 credits a month, annual commitment; price as displayed to an Indian visitor, tax treatment not stated; per month)
  - “₹2,394.22/mo” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c044** The Adobe Stock plan of 10 credits a month with AI Studio was priced at ₹3,193.08 a month on the Indian pricing page.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, 10 Stock credits/mo with AI Studio, India_ · **3193.08 INR per month** (buyer pays; 10 credits a month plus AI Studio; price as displayed to an Indian visitor, tax treatment not stated; per month)
  - “₹3,193.08/mo” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c045** The Adobe Stock plan of 750 credits a month with AI Studio was priced at ₹15,965.40 a month on the Indian pricing page.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, 750 Stock credits/mo with AI Studio, India_ · **15965.4 INR per month** (buyer pays; 750 credits a month; price as displayed to an Indian visitor, tax treatment not stated; per month)
  - “₹15,965.40/mo” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A price on Adobe's own India pricing page; no reseller page for India could be reached without search.
  - verifier (scope): **quote_incomplete** — Price confirmed on re-fetch. But the quote '₹15,965.40/mo' does not show which tier it belongs to; the page's '750 Stock credits/mo' label next to the price would. Whether the price is month-to-month or an annual commitment, and whether GST is included, is not shown.
- **c046** On a 10-credit plan a video costs 8 credits and is limited to one a month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, 10 Stock credits/mo, India_ · **8 credits per video** (credits the buyer spends per standard video on the 10-credit plan; per asset)
  - “8 credits each” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c047** Premium images cost 12 to 50 credits each.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, Premium images, India_ · **12 credits per premium image (lower bound of 12-50 range)** (credits the buyer spends per premium image; range 12 to 50; per asset)
  - “12 - 50credits each” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: missing 0.00

### licence

- **c010** Adobe sublicenses contributed Work to buyers under its own User Agreement between Adobe and the user.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “We may sublicense Works pursuant to a written or electronic agreement between us and a user” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Adobe's own contributor terms. The Hirschberger derivative complaint quotes Adobe's 2024 web copy that 'Adobe Stock content is covered under a separate license agreement', which is consistent but not this clause.
  - verifier (scope): **scope_ok** — Contributor Agreement Additional Terms, 'Effective as of February 16, 2024', s.2: the sublicensing agreement is defined as the 'User Agreement'.
- **c011** Adobe's right to sublicense contributed Work to users is non-exclusive, so it cannot grant a buyer exclusive rights.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “on a non-exclusive, worldwide, and perpetual basis in any media or embodiment” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** Adobe may enforce a contributor's rights against infringers but has no obligation to do so.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “You grant us the right to enforce your IP Rights against infringers, but we have no obligation to do so.” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** Under the Adobe Stock buyer terms, Adobe and its licensors retain title to Stock Assets and grant the buyer a licence.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “we and our licensors retain all rights, title, and interest in and to the Stock Assets” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** The Adobe Stock Standard License is non-exclusive, perpetual, worldwide, non-transferable and non-sublicensable.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “we grant you a non-exclusive, perpetual, worldwide, non-transferable and non-sublicensable” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** The Standard License caps a Work at 500,000 printed copies or an expected audience of 500,000 viewers, with no cap for web and social display.  
  _number · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock, Standard License_ · **500000 printed copies or viewers per Work** (Standard License reproduction cap for the buyer; web, social and app display exempt from the audience cap; aggregate over the licence)
  - “cause or allow a Work to appear on more than 500,000 printed materials” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Adobe's own licence terms; no library or partner restatement reachable without search.
  - verifier (scope): **quote_incomplete** — Right for the Standard License (s.3.1(B)(1) of the 2025-08-08 Stock product terms). The quote covers only printed copies; the viewer cap and the web exemption are in 'audience is expected to exceed 500,000 viewers' and 'does not apply to Works displayed only on websites, social media sites, or mobile applications'.
- **c026** The Enhanced License gives Standard License rights without the 500,000 reproduction and viewer cap.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock, Enhanced License_
  - “except without the limitation on the number of reproductions or viewers” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Adobe's own licence terms. No search available to look for a library or partner guide restating it.
  - verifier (scope): **scope_ok** — s.3.2(A): same rights as a Standard License 'except without the limitation on the number of reproductions or viewers'. The merchandise, template and press-release restrictions still apply (s.3.2(B)).
- **c027** The Extended License adds the right to use a Work in merchandise and template files for sale or distribution.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock, Extended License_
  - “for incorporation into merchandise and template files intended for sale or distribution” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** Adobe Stock buyers may not use Stock Assets, or data derived from the service, to create, train, test or improve machine-learning or AI systems.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “to directly or indirectly create, train, test, or otherwise improve any machine learning algorithms” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** Adobe Stock buyers may not use Stock Assets with technologies designed to identify natural persons.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “with technologies designed or intended for the identification of natural persons” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c030** Access through the Adobe Stock API is subject to the same machine-learning ban.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock API_
  - “You will not use your access to Adobe Stock API in violation of restrictions against use for machine learning” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c040** Adobe Stock buyers must not resell licences to Stock Assets.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “You must not (a) resell licenses to Stock Assets” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c048** Adobe Stock's pricing page says most assets come with a standard licence.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock, India_
  - “Most assets come with a standard license.” — Adobe, <https://stock.adobe.com/plans> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c068** Adobe's API FAQ says downloading Stock assets for machine-learning purposes is not permitted by the governing terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock API_
  - “download of Stock assets for machine learning purposes, which is not permitted by the governing terms of use” — Adobe (Adobe Developer documentation), <https://developer.adobe.com/stock/docs/faq/stock-api-business-faq> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c039** Buyers are told to download licensed assets because they may not be available for re-download after termination.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “as such Stock Assets and Output may not be available after termination” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of Adobe's own buyer terms.
  - verifier (scope): **scope_ok** — s.14.1(C). Perpetual licences survive termination (s.14.1(B)), except for unmetered or unlimited plans (s.9.4(E)).

### vetting

- **c014** Contributors warrant that they hold model and property releases substantially similar to Adobe's standard releases for each person or property depicted.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “obtained all necessary and valid releases or agreements substantially similar to our standard model and property releases” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A warranty clause in Adobe's own contributor terms.
  - verifier (scope): **scope_ok** — s.3.2 Releases. Contributors also warrant to provide copies to Adobe on request (not to buyers). Editorial-use-only Work may be accepted without releases.
- **c015** Contributors must give Adobe copies of releases on Adobe's request; the agreement says nothing about giving releases to buyers.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “you will promptly provide copies of such releases or agreements to us upon our request” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** Adobe may accept 'editorial use only' Work without a model or property release, at its sole discretion.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “we may accept it without a model or property release, at our sole discretion” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** Adobe disclaims responsibility for the accuracy of Stock Assets and of their descriptions, captions, metadata and keywords.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “the accuracy of any Stock Asset, including any related descriptions, categories, captions, titles, metadata” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c002** In September 2026 Adobe paid Adobe Stock contributors a Firefly Contributor bonus for helping train its Firefly generative AI models, per Adobe's email as quoted on Adobe's community forum on 2026-09-17.  
  _event · press_relayed · as of 2026-09-17 (publication) · scope: Firefly Contributor bonus_
  - “you are receiving a Firefly Contributor bonus payment, recognizing your continued support with helping train Adobe Firefly” — Adobe Community (post by a volunteer Community Expert quoting Adobe's email), <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The September 2026 payment itself could not be confirmed outside Adobe's forum: no search available, and no press link reached by navigation. The programme's existence is attested independently: the BIPA class complaint Dorcus v. Adobe, N.D. Ill. 1:26-cv-05575, filed 2026-05-14 (CourtListener RECAP, ¶9), says Adobe 'created the Firefly Stock Contributor Bonus, which compensates Adobe Stock contributors when their licensed content is used to train Firefly's image models'; the derivative complaint Hirschberger v. Narayen, N.D. Cal. 5:26-cv-05882 (filed 2026-06-16), relays Bloomberg reporting that bonuses were paid in September 2023. Neither speaks to a 2026 payment.
  - verifier (scope): **scope_ok** — Thread opened 2026-09-17 ('Fourteen dollars came in yesterday'), and a Community Expert reply quotes Adobe's email; the September 2026 date comes from the post date, not the email, which gives no payment date. The source is mislabelled press_relaying_vendor: it is a user post on Adobe's own forum (community.adobe.com), not press, and it is the only source.
- **c003** The 2026 Firefly Contributor bonus covered assets considered for training between 3 June 2025 and 2 June 2026, per Adobe's email as relayed on its community forum.  
  _event · press_relayed · as of 2026-09-17 (publication) · scope: Firefly Contributor bonus_
  - “considered for training between June 3, 2025, and June 2, 2026” — Adobe Community (post by a volunteer Community Expert quoting Adobe's email), <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c004** The 2026 Firefly Contributor bonus counted photos, videos, vectors, illustrations and generative-AI content considered for training, per Adobe's email as relayed on its community forum.  
  _event · press_relayed · as of 2026-09-17 (publication) · scope: Firefly Contributor bonus_
  - “The 2026 bonus is based on photos, videos, vectors, illustrations, and Generative AI content” — Adobe Community (post by a volunteer Community Expert quoting Adobe's email), <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c005** The 2026 Firefly Contributor bonus was also based on the number of licences the assets considered for training earned in the same 12-month period, per Adobe's email as relayed on its community forum.  
  _terms · press_relayed · as of 2026-09-17 (publication) · scope: Firefly Contributor bonus_
  - “and the number of licenses that those assets generated in the same 12-month period” — Adobe Community (post by a volunteer Community Expert quoting Adobe's email), <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The bonus formula is set out only in Adobe's email to contributors; no independent report of the 2026 formula could be reached (no search available). Dorcus v. Adobe ¶59 (N.D. Ill., filed 2026-05-14) describes eligibility as contributors 'whose images were considered for inclusion in the Firefly image-model training corpus', with no formula.
  - verifier (scope): **scope_ok** — The relayed email bases the 2026 bonus on content considered for training between 3 June 2025 and 2 June 2026 'and the number of licenses that those assets generated in the same 12-month period'. Same source-class mislabel as c002.
- **c018** Adobe pays contributors on sales of licences to their Work, less cancellations, returns and refunds, as set out on a separate pricing and payment page.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “for any sales of licenses to Work, less any cancellations, returns, and refunds” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c050** Adobe Stock pays contributors 33% royalties on photos, vectors and illustrations.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme, Images_ · **33 percent** (contributor's share of the licence price; earnings per download based on US-customer pricing; per licence)
  - “33% royalties” — Adobe, <https://contributor.stock.adobe.com/royalties> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Contributor-side reporting of the rate ought to exist but none could be reached: no search available. Adobe's FY2025 10-K and FY2026 10-Qs mention royalty fees in cost of subscription revenue and royalties payable, but give no contributor rate. arXiv's own search for 'Adobe Stock' returned two computer-vision papers only. Wirestock (a distributor to stock agencies) FAQ and home page carry no Adobe rate.
  - verifier (scope): **quote_incomplete** — The quote '33% royalties' does not show that the rate is for images; the page pairs it with 'Photos, vectors, illustrations'. The same table shows a '350+ credits/month' buyer tier paying a 'Minimum guaranteed' US$0.33 to $0.40 per download, so 33% is the headline rate, not necessarily the share on every plan. Earnings are 'based on pricing for US customers'.
- **c051** Adobe Stock pays contributors 35% royalties on video.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme, Video_ · **35 percent** (contributor's share of the licence price; earnings per download based on US-customer pricing; per licence)
  - “35% royalties” — Adobe, <https://contributor.stock.adobe.com/royalties> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — As for c050: no independent statement of the video rate reachable without search; Adobe's filings give no contributor rates.
  - verifier (scope): **quote_incomplete** — The quote '35% royalties' does not show that the rate is for video; the page places it over the video earnings table (for example HD US$22.40 to $28.00 and 4K US$56.00 to $70.00 per download).
- **c052** Adobe Stock contributor earnings per download are based on pricing for US customers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme_
  - “Earnings per download are based on pricing for US customers.” — Adobe, <https://contributor.stock.adobe.com/royalties> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c053** A contributor earns US$26.40 per on-demand Extended License image download ($21.12 via subscription).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme, Extended license_ · **26.4 USD per download** (contributor earning per on-demand Extended License image; $21.12 when licensed via subscription; per licence)
  - “$26.40 / $21.12” — Adobe, <https://contributor.stock.adobe.com/royalties> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Per-download contributor earnings appear only in Adobe's contributor help; no independent source reachable without search.
  - verifier (scope): **quote_incomplete** — The figures are correct and sit in the images table. But the quote '$26.40 / $21.12' leaves out the row label 'Extended license' and the column 'On demand / Subscription' that tie it to the tier.
- **c054** A contributor earns US$1.65 per image downloaded on a monthly 10-credit plan and $0.99 on an annual one.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Adobe Stock contributor programme, 10 credits per month_ · **1.65 USD per download** (contributor earning per image from a monthly 10-credit subscriber; $0.99 from an annual subscriber; per licence)
  - “$1.65 / $0.99” — Adobe, <https://contributor.stock.adobe.com/royalties> · pricing_page · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c019** A contributor may remove Work at any time, but removing more than 100 items or 10% of its Work (whichever is greater) within 90 days needs 90 days' notice.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “you do not remove more than 100 items of Work or 10% of the Work, whichever is greater, in any 90-day period” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Licences already granted to users before a contributor removes a Work, or ends the agreement, survive the removal.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “Any licenses to a Work granted to our users or to us prior to the removal of that Work from the Website” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** If Adobe reasonably believes a Stock Asset may face a third-party claim, it may instruct the buyer to cease all use and possession of it.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “Adobe may instruct you to cease all use, reproduction, modification, display, performance, distribution, and possession” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Adobe may at any time discontinue licensing any Stock Asset or deny its download.  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “We may, at any time (1) discontinue the licensing of any Stock Asset” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** When a subscription ends, perpetual licences already granted survive and the buyer may keep using those assets (unmetered and unlimited plans aside).  
  _terms · legal_text · as of 2025-08-08 (page_dated) · scope: Adobe Stock_
  - “any perpetual licenses granted as to Stock Assets will survive and you may continue to use those licensed Stock Assets” — Adobe, <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact

### changes

- **c008** The February 2024 contributor terms apply to Work uploaded under any prior version of the terms, not only to new uploads.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “upload to a Website under these Additional Terms or any other prior version thereof” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c009** Contributors accept revised pricing and payment terms simply by continuing to upload or by not removing their Work.  
  _terms · legal_text · as of 2024-02-16 (page_dated) · scope: Adobe Stock contributor programme_
  - “By continuing to submit or upload Works or by not removing Works, you are agreeing to any new Pricing and Payment Details” — Adobe, <https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe_Stock_Contributor_Agreement_Addl_Terms_en_US_20240216.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** On 3 September 2026 Adobe announced that Anil Chakravarthy will become its president and CEO on 1 December 2026, with Shantanu Narayen becoming executive chair.  
  _event · vendor_stated · as of 2026-09-03 (publication) · scope: Adobe Inc._
  - “will become Adobe's next president and chief executive officer and join the Board of Directors effective December 1, 2026” — Adobe (newsroom), <https://news.adobe.com/news/2026/09/adobe-announces-anil-chakravarthy-to-become-president-and-ceo> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c059** Adobe says in its fiscal 2025 annual report that it trains its Firefly generative AI models on licensed content and public-domain assets.  
  _terms · filing · as of 2026-01-15 (publication) · scope: Adobe Stock_
  - “sourced from licensed content and public domain assets to train our Firefly generative AI models” — Adobe Inc. (Form 10-K, fiscal 2025, SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c060** Adobe's annual report says Firefly models are trained on data Adobe has the rights to use.  
  _terms · filing · as of 2026-01-15 (publication) · scope: Adobe Stock_
  - “They are trained on data Adobe has the rights to use.” — Adobe Inc. (Form 10-K, fiscal 2025, SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Added by the verifier

- **v001** Adobe told the SEC that Adobe Stock was a drag on growth in Q1 fiscal 2026: Total Adobe ARR growth of 10.9% to US$26.06 billion was partially offset by a decrease from Adobe Stock.  
  _outcome · filing · as of 2026-02-27 (publication) · scope: Adobe Stock_
  - “partially offset by a decrease from Adobe Stock” — U.S. SEC (EDGAR), Adobe Inc. Form 10-Q for the quarter ended 2026-02-27 (filed 2026-03-25), <https://www.sec.gov/Archives/edgar/data/796343/000079634326000056/adbe-20260227.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** A shareholder derivative complaint filed against Adobe's directors on 2026-06-16, quoting April 2024 press, says Adobe acknowledged that Midjourney-made images supplied by Adobe Stock contributors made up about 5% of Firefly's training material.  
  _event · court · as of 2026-06-16 (publication) · scope: Adobe Stock generative-AI submissions_
  - “Adobe said the images from Midjourney only made up 5% of the training” — CourtListener RECAP: Hirschberger v. Narayen, N.D. Cal. 5:26-cv-05882, verified stockholder derivative complaint, <https://storage.courtlistener.com/recap/gov.uscourts.cand.472306/gov.uscourts.cand.472306.1.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **v003** A BIPA class action filed against Adobe on 2026-05-14 over Firefly voice models cites the Firefly Stock Contributor Bonus as consent and compensation infrastructure that Adobe built for image contributors but not for voice subjects.  
  _event · court · as of 2026-05-14 (publication) · scope: Adobe Firefly / Adobe Stock contributor bonus, Illinois, US_
  - “Adobe built consent infrastructure for image contributors” — CourtListener RECAP: Dorcus v. Adobe Inc., N.D. Ill. 1:26-cv-05575, class action complaint, <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.500617/gov.uscourts.ilnd.500617.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.public_listing` — blocked; tried <https://stock.adobe.com/>, <https://stock.adobe.com/in/>, <https://stock.adobe.com/search?k=street%20market%20india>, <https://stock.adobe.com/images/id/123456789>
- `matrix.buyer_vetting` — not_published; tried <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf>, <https://stock.adobe.com/plans>, <https://developer.adobe.com/stock/docs/getting-started/>
- `matrix.versioning` — not_published; tried <https://www.adobe.com/cc-shared/assets/pdf/legal/servicetou/stock-product-specific-terms-en-us-20250808.pdf>, <https://developer.adobe.com/stock/docs/api/11-search-reference/>
- `matrix.quality_evidence` — blocked; tried <https://contributor.stock.adobe.com/>, <https://helpx.adobe.com/stock/contributor/help/submission-guidelines.html>, <https://helpx.adobe.com/stock/contributor/user-guide.html>
- `other.custom_side` — blocked; tried <https://business.adobe.com/products/stock/adobe-stock.html>
- `other.traction` — not_published; tried <https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm>, <https://contributor.stock.adobe.com/>
- `other.video_purchase_for_training` — not_found
- `other.firefly_bonus_official_terms` — blocked; tried <https://helpx.adobe.com/stock/contributor/help/firefly-faq-for-adobe-stock-contributors.html>, <https://helpx.adobe.com/stock/contributor/help/royalty-details.html>
- `other.lowered_payout_minimum` — not_found; tried <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374>, <https://helpx.adobe.com/stock/contributor/help/firefly-faq-for-adobe-stock-contributors.html>
- `other.fourth_annual_bonus` — not_found; tried <https://community.adobe.com/questions-38/fourteen-dollars-came-in-yesterday-but-i-don-t-know-the-source-1642374>

## Leads, not cited

- <https://helpx.adobe.com/stock/contributor/help/firefly-faq-for-adobe-stock-contributors.html> — Official Firefly contributor bonus FAQ; 403 to WebFetch.
- <https://stock.adobe.com/license-terms> — Licence overview page; fetched, but it restates the Product Specific Terms, which were cited instead.
