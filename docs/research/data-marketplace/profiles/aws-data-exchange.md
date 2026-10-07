# AWS Data Exchange

cloud_exchange · deep · status: **active** · also known as ADX, AWS Marketplace data products

> Rendered from `ledger/aws-data-exchange.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “data products with a public offer, listed in the "AWS Marketplace product catalog" (browsed via "Browse catalog")” and its bespoke side “"custom offers" ("private offers" and "Bring Your Own Subscription (BYOS) offers") and "private products"; AWS itself does no bespoke collection, and "Request data product" routes a buyer to the "Data Discovery Team" for recommendations”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | venue | c074, c118, c047, c088, c017 | AWS is not a party to the DSA or buyer-seller agreements and the provider's account is seller of record, but AWS invoices the buyer, collects and disburses net of fees. |
| economics_model | commission | c050, c051, c052, c053, c054, c126, c058, c059 | Percentage listing fee on contract value; data grants (no marketplace) are instead billed per active grant-hour plus storage. |
| who_pays_fee | seller | c126, c017, c058, c129 | Listing fee is deducted from the seller's disbursement; data-grant hourly fee is paid by the sender; buyers pay only their own AWS infrastructure usage. |
| supply_models | third_party_providers, public_or_scraped | c009, c049, c012, c076 | Third-party providers list only data sets they own; Open Data on AWS public data sets are also findable. AWS does not list its own collected data. |
| custody_model | mixed | c013, c028, c014, c025, c026, c098 | Files: AWS-hosted copy exported to buyer's S3; S3 data access / Redshift / Lake Formation: shared in place from the provider's own storage. |
| transaction_mode | both | c033, c016, c097, c105, c111, c113 | Self-serve subscription to public offers; private offers negotiated off-platform and accepted in console. |
| public_prices | some | c006, c114, c107, c113 | Public offers show prices; private offer prices are not public; many image listings are free samples with full data on request. |
| licence_model | provider_defined | c035, c036, c034, c063 | Default standard DSA template, but the provider controls terms and may edit or replace it. |
| exclusivity_offered | unknown |  | Standard DSA licence is non-exclusive [c063]; nothing found on whether custom DSAs grant exclusivity. |
| public_listing | public_indexable | c107, c114, c127 | Product detail pages on AWS Marketplace were fetched without login; data set descriptions are visible only to active subscribers. |
| buyer_vetting | account_only | c033, c015 | An AWS account suffices by default; providers may switch on subscription verification to review each subscriber. |
| sample_mechanics | free_sample_download | c085, c103, c107 | Optional provider-uploaded samples and dictionaries downloadable before subscribing; many providers also list free sample products. |
| versioning | immutable_revisions | c022, c027, c083 | Files revisions are immutable once finalized; S3 data access shares are live and need no new revision [c102]. |
| human_subject_consent_docs | asserted_only | c067, c068, c040, c041 | Provider warrants personal data is public and indemnifies for missing consents; no consent or release documents are delivered to buyers by the platform. |
| contributor_pay_model | not_applicable | c009, c017 | No contributor programme; supply comes from registered provider businesses paid monthly disbursements. |
| catalogue_plus_custom | both | c123, c016, c109, c111, c121 | Custom work is provider-run via private offers/private products; AWS offers recommendation, not bespoke collection. |
| erasure_after_sale | contractual_deletion | c071, c082 | Default DSA requires removal within 90 days of end; exported files otherwise remain with buyer. |
| quality_evidence | provider_asserted | c043, c075, c005, c085 | AWS reviews listings for policy compliance, not data quality; samples and descriptions come from the provider. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | No demand volumes are published; for photo and image data, listings seen are free samples with the full or custom corpus sold by contacting the provider. Buyers who cannot find data can file a request with budget and cadence. | c107, c111, c113, c109, c121, c122, c119 |
| Q2 | sourced | Listing gives the provider AWS billing, entitlement and delivery plumbing, catalogue reach (vendor-stated 3,500+ products) and free migration of existing subscribers; it costs a 3% listing fee and requires seller registration, ADX qualification and an eligible jurisdiction. | c014, c119, c061, c050, c046, c045, c115 |
| Q3 | partial | Only registered providers list, and only data sets their own account owns; the DSA contemplates resold third-party data under extra terms. Open Data on AWS public data sets are also surfaced. | c049, c009, c076, c012, c108 |
| Q4 | partial | Not a commissioning platform, so no resale carve-outs; on term changes, an auto-renewing subscription renews onto the new price and DSA. | c081, c056 |
| Q5 | sourced | AWS is a venue: the DSA is solely between provider and subscriber, AWS is not a party, the provider is seller of record and warrants and indemnifies; AWS invoices and collects. | c074, c118, c047, c068, c088, c017 |
| Q6 | sourced | Mixed: Files products are copied into AWS Data Exchange and exported to the buyer's S3; S3 data access shares read-only from the provider's own bucket through an AWS-provisioned access point, revoked when the subscription ends. | c013, c028, c014, c025, c026, c098, c099 |
| Q7 | partial | Guidelines ban identifiable personal data outside the Extended Provider Program and require sensitive categories anonymised; the DSA has the provider warrant public-only personal data and indemnify for missing consents. Nothing addresses capturer, depicted-person or property releases as documents. | c040, c041, c067, c068, c069, c020 |
| Q8 | partial | Default DSA: non-exclusive, worldwide, no redistribution, no re-identification, buyer owns derived data incl. models, deletion within 90 days of end, NY law; providers may substitute their own terms. No audit or fingerprinting mechanism found. | c063, c064, c065, c066, c071, c073, c036 |
| Q9 | sourced | Public offers are self-serve subscriptions paid upfront or on schedule; private and BYOS offers handle negotiated deals. AWS takes a listing fee (3% public; 3/2/1.5% private by contract value; 1.5% renewals) deducted from disbursement. | c033, c016, c097, c050, c051, c052, c053, c054, c126 |
| Q10 | sourced | Product > data sets > revisions > assets; offers carry terms; a subscription yields entitled (read-only) data sets. Finalized revisions are immutable; the offer sets historical and future revision access; access ends at expiry; unpublishing keeps active subscribers; revisions can be revoked with a stated reason. | c002, c021, c022, c024, c083, c079, c080, c023 |
| Q11 | sourced | Providers may attach up to 10 samples and data dictionaries viewable before purchase; listings must be accurate and flag anonymisation; AWS reviews for policy, while the DSA disclaims accuracy. | c085, c103, c005, c043, c003, c075 |
| Q12 | partial | The platform is the catalogue; custom deals run through provider private offers and 'private products', and image providers use free samples as a funnel to curated custom sets. | c123, c016, c109, c111, c113, c121 |

## Narrative

### positioning

AWS Data Exchange is AWS's data-sharing and data-marketplace service [c128]: data grants for direct sharing with any AWS account [c001][c007], and data products sold through AWS Marketplace [c002]. It went GA in November 2019 [c089]; AWS claims 3,500+ products from 300+ providers (vendor-stated) [c119].

### supply

Supply is third-party only: providers must be registered AWS Marketplace sellers qualified by the ADX team [c046], in an eligible jurisdiction [c045], and may list only data sets their own account owns [c049]. The FAQ's narrower US/EU rule conflicts with the docs [c094]. Indian sellers can list ADX products but only to Indian buyers [c115][c116], while the ADX jurisdiction list omits India [c045]. Image providers such as PIXTA list from their own stock libraries [c108].

### object_model

Assets sit in revisions, revisions in data sets, data sets in products [c021][c002]. Offers attach price, duration, DSA and refund policy [c006]. Subscribing creates read-only entitled data sets [c024]. Finalized revisions are immutable [c022]; the offer sets how many historical and future revisions a subscriber gets [c083]. S3 data access shares need no new revision when objects change [c102]. Grants and products are single-Region [c030].

### listing

Product pages carry descriptions, samples, logo and support contact [c005]; up to 10 samples [c103]; data dictionaries and samples are viewable before purchase [c085]. Data set descriptions are subscriber-only [c127]. Listings must note anonymisation [c043]. Real image listings are free samples [c107][c110].

### discovery

One catalogue across Regions [c010], filterable by category and data set type [c124]. A buyer who finds nothing can file a 'Request data product' with cadence and budget; the Data Discovery Team replies within 2 business days [c121][c122].

### trust

AWS reviews products against guidelines before listing [c003] and removes breaching products [c044]. Providers flag sensitive data categories shown on the product page [c086]. The DSA puts personal-data warranties [c067] and USD 5M insurance [c072] on the provider but disclaims accuracy [c075].

### transaction

Public offers are self-serve: pick a price and duration and pay upfront [c033]. Private offers target named accounts with an acceptance deadline [c105][c097]; BYOS migrates existing customers [c016][c061]. AWS invoices the buyer [c088] and pays the provider monthly after collection [c017][c018].

### pricing

Providers pay AWS a listing fee: 3% on ADX public offers [c050]; private offers 3%/2%/1.5% by contract value [c051][c052][c053]; renewals 1.5% [c054], on pre-tax TCV [c055], deducted from payouts [c126]. Data grants cost senders USD 0.04167 per active grant-hour [c058] plus storage [c059]. Prices are USD only [c032], durations 1-36 months [c031].

### licence

The default Data Subscription Agreement [c034] grants a non-exclusive, worldwide, non-transferable licence incl. derived data [c063], bans redistribution [c064] and re-identification [c065], lets buyers own derived models [c066], caps liability at 3x spend or USD 1M [c070] and uses NY law [c073]. AWS is not a party [c074][c118]; providers may replace it [c036].

### custody

Files products are copied into ADX and exported to the buyer's S3 [c013][c028]. S3 data access leaves data in the provider's bucket: ADX provisions an access point granting read-only access [c098][c025] without copies [c026], revoked at expiry [c099]. Requester Pays is recommended [c062]. Objects must be S3 Standard or Intelligent-Tiering [c100].

### vetting

Providers need a support organisation [c048], seller registration and ADX qualification [c046]. Identifiable personal data is barred unless public [c040]; sensitive categories must be anonymised [c041]; the Extended Provider Program adds review for sensitive data [c019][c020]. Buyers need only an AWS account unless the provider enables subscription verification [c015].

### contributor_pay

Not applicable: there is no contributor or crowd programme; supply comes from provider businesses that receive monthly disbursements net of listing fees [c017][c126].

### post_sale

Access ends when the subscription expires [c079][c096]; unpublishing does not cut off active subscribers [c080]. Providers can revoke a revision with a stated reason [c023][c092]. Exported files stay with the buyer [c082], but the default DSA requires deletion within 90 days of termination [c071]. Providers can notify subscribers of updates, delays and deprecations [c093].

### catalogue_custom

AWS runs only the catalogue. Custom deals run through provider private offers and 'private products' [c123][c016]. Image providers use free samples as a funnel: PIXTA offers to curate a specific set [c109], Shutterstock sells tailored datasets via sales [c111], InfoBay licenses its full corpus on request [c113].

### changes

Key dates: GA 2019-11-13 [c089]; revision revocation 2022-03-15 [c092]; S3 data access GA 2023-03-14 [c091]; data grants without seller registration 2023-12-14 [c090]; current listing fee schedule 2024-01-05 [c056]. On auto-renewal, changed terms and DSA apply [c081].

### demand

Demand evidence is thin and vendor-stated: 3,500+ products and 300+ providers [c119]; 80+ providers and 1,000+ products at launch, as relayed by press [c120].

### regulation

The publishing guidelines bar identifiable personal data unless publicly available, outside the Extended Provider Program [c040], and require biometric, health and other sensitive categories to be aggregated or anonymised [c041]. The default DSA bans re-identification [c065]. AWS tells buyers to do their own privacy-law due diligence [c011].

## Buyer journey

1. Lands on the AWS Marketplace catalogue (single catalogue for all Regions), searches or filters by category and data set type such as Files or Access to Amazon S3. [c010, c124]
2. Opens a product page without logging in: provider, descriptions, logo, support contact, sensitive-data flag, offer price/duration, DSA or EULA link and refund policy. [c005, c006, c086, c114, c107]
3. Evaluates free samples and data dictionaries before buying (for image providers, often a separate free sample product). [c085, c103, c110, c111]
4. If nothing fits or the full dataset is not self-serve, contacts the provider for a private offer or custom set, or files a 'Request data product' to the Data Discovery Team. [c109, c113, c121, c097]
5. Signs in with an AWS account and subscribes: chooses one price/duration, accepts the offer terms and DSA, pays upfront or on schedule; if the provider enabled subscription verification, first submits a request for approval. [c033, c015, c078]
6. AWS invoices the buyer and may share contact details with the provider; the buyer receives entitled read-only data sets. [c088, c087, c024]
7. Accesses data: exports Files revisions to their own S3 (optionally auto-export new revisions), or reads the provider's S3 bucket in place through an access point. [c028, c084, c098, c025]
8. Holds a licence under the DSA (non-exclusive, no redistribution); at expiry access is revoked and DSA may require deletion of exported data within 90 days. [c063, c064, c079, c071]

## Claims

### positioning

- **c128** AWS Data Exchange is live: its user guide describes it in the present tense as a service for sharing and managing data entitlements, retrieved 2026-09-30.  
  _status · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange is a service that helps AWS customers easily share and manage data entitlements” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Indirect: a third-party guide dated August 2026 lists the fee AWS Marketplace currently charges on AWS Data Exchange products, which shows the service still transacting within the last six months. It does not quote the user guide. Clazar is a third-party AWS Marketplace seller-tools company, not AWS; its guide is dated 2026-08-11, last updated 2026-08-25. It restates AWS's schedule, so it corroborates currency rather than being an independent measurement.
    - “AWS Data Exchange products: 3%” — Clazar, <https://clazar.io/blog/aws-marketplace-fees> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is the user guide's present-tense definition. The page is undated (retrieved_only), so it shows the service is documented, not that it is transacting. It is acceptable as status evidence; Clazar's August 2026 fee guide backs it up.

### supply

- **c007** Anyone with an AWS account can create and send data grants to data receivers.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Anyone with an AWS account can create and send data grants to data receivers.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c009** Providers who publish data sets as products in AWS Marketplace must be registered AWS Marketplace sellers.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange data providers must be registered as AWS Marketplace sellers” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c012** Open Data on AWS data sets can be found and used through AWS Data Exchange by anyone, with or without an AWS account.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “anyone, with or without an AWS account, can find and use publicly available data sets” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c045** To provide data products a provider must be a resident, citizen or business entity of an eligible jurisdiction; the list retrieved on 2026-09-30 names Australia, Bahrain, EU states, Hong Kong, Israel, Japan, New Zealand, Norway, Qatar, Switzerland, UAE, UK and US, and not India.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Be a permanent resident or citizen in an eligible jurisdiction, or a business entity organized or incorporated” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c049** Only data sets owned by the listing AWS account can be included in the products that account publishes.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Only data sets owned by that account can be included in products published by that account.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c076** The standard DSA contemplates Third Party Data that the provider obtains from a third party and resells, possibly under additional Third Party Terms.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “means information or data that Provider obtains from a third party and makes available to Subscriber” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c094** The AWS Data Exchange FAQ states that a provider must use a legal entity domiciled in the United States or an EU member state.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “valid legal entity domiciled in the United States or a member state of the EU” — Amazon Web Services, <https://aws.amazon.com/data-exchange/faqs/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c108** PIXTA AI says the listed car dataset is sourced from its own stock library of 80M+ Asian-featured images and videos.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Car dataset in multiple scenes for AI & Computer Vision_
  - “All of the contents is sourced from PIXTA's stock library of 80M+ Asian-featured images and videos.” — PIXTA AI (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-6i7gc6mi7hlgs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c115** AWS Marketplace sellers in India can create offers for AWS Data Exchange product types.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: India_
  - “You can create products and offers for SaaS, AMI, Containers, Professional Services, ML and AWS Data Exchange product types.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/india-seller-faq.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c116** AWS Marketplace sellers in India can only sell to buyers in India.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: India_
  - “Sellers in India can only sell to buyers in India.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/india-seller-faq.html> · docs · retrieved 2026-09-30 · quote check: exact

### object_model

- **c001** In AWS Data Exchange a data grant is the unit of exchange that a data sender creates to give a data receiver access to a data set.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “A data grant is the unit of exchange in AWS Data Exchange that is created by a data sender” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c002** On AWS Marketplace the unit of exchange for data is a product, published by a provider and containing one or more AWS Data Exchange data sets.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “A product is the unit of exchange in AWS Marketplace that is published by a provider” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “A data product is a product that includes AWS Data Exchange data sets.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c004** AWS Data Exchange supports five data set types: Files, API, Amazon Redshift, Amazon S3 (data access) and AWS Lake Formation (preview).  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange supports five types of data sets: Files, API, Amazon Redshift, Amazon S3, and AWS Lake Formation (Preview)” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c021** AWS Data Exchange organises data in three building blocks: assets (a piece of data), revisions (containers of assets) and data sets (a series of revisions).  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Data is organized in AWS Data Exchange using three building blocks” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c022** A finalized revision published to at least one data grant or product cannot be unfinalized or changed, except through the revoke revision process.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “A finalized revision published to at least one data grant or product can't be unfinalized or changed in any way.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c024** Entitled data sets are a read-only view of a sender's owned data sets, created when a data grant is created or a product is published.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Entitled data sets are a read-only view of a sender's owned data sets.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c027** A subscriber to a Files data set accesses specific revisions, so providers can change the data over time without altering historical data.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “When recipients or subscribers access a Files data set, they're accessing a specific revision in the data set.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c030** All data sets in a single data grant or product must be in the same AWS Region.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “all data sets in a single data grant or product must be in the same AWS Region.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c083** The provider decides per offer whether subscribers get none, some or all historical revisions, and may also grant future revisions published during the subscription.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “they give you access to 0 or more historical revisions, up to all historical revisions” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “They can also give you access to future revisions that are made available during your subscription period.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c102** A provider sharing S3 data in place does not need to create a new revision when it updates the shared objects.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “You don't need to create a new revision when updating the shared Amazon S3 objects” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c125** A data grant names the recipient's AWS account ID and can optionally be given an end date on which it expires.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “optionally set an end date on which the data grant should expire” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/creating-data-grants.html> · docs · retrieved 2026-09-30 · quote check: exact

### listing

- **c005** A data product's provider-completed details include short and long descriptions, data samples, a logo and support contact information.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “includes name, descriptions (both short and long), data samples, a logo image, and support contact information” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c043** Data product listing descriptions must be accurate, give valid contact information and state whether any data was aggregated or anonymised.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “must be accurate, contain valid contact information, and note if any data has been aggregated or anonymized” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publishing-guidelines.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c085** Some products include data dictionaries and samples that prospective subscribers can view and download before subscribing.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you can view and download the data dictionaries and samples before you subscribe to it” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c103** A provider can attach up to 10 samples of at most 50 MB to a product; CSV samples can be previewed.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **10 samples per product data set** (maximum number of provider-uploaded samples, 50 MB maximum size; not stated)
  - “You can upload up to 10 samples with a maximum size of 50 MB.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — A search that excluded AWS domains found no source giving the 10-sample or 50 MB limits or CSV preview. PredictHQ's docs mention its samples on ADX but give no limits.
  - verifier (scope): **scope_wrong** — The quote comes from the S3 data access publishing walkthrough, but the statement generalises it to any product, which that page does not show. 'CSV samples can be previewed' is also not in the quote; the page's next sentence says 'Samples in .csv format can be previewed.' The statement should be scoped to the publishing flow cited, or the claim needs a second source for other product types.
- **c107** PIXTA AI lists a car image dataset on AWS Data Exchange free of charge, with subscriptions that have no end date.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Car dataset in multiple scenes for AI & Computer Vision_
  - “This product is available free of charge. Free subscriptions have no end date and may be canceled any time.” — PIXTA AI (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-6i7gc6mi7hlgs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c110** PIXTA AI's listing describes its sample as limited images with thumbnails for visual check only.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Car dataset in multiple scenes for AI & Computer Vision_
  - “The sample set includes limited images with thumbnail for visual check only.” — PIXTA AI (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-6i7gc6mi7hlgs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c127** Data set descriptions are visible only to recipients or subscribers with an active data grant or subscription.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The description is visible to recipients or subscribers who have an active data grant or subscription to the product.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact

### discovery

- **c010** AWS Marketplace shows subscribers a single data product catalogue regardless of the AWS Region they use.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Subscribers can see the same catalog regardless of which supported AWS Region they are using.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c121** A buyer who cannot find a product can request personalised recommendations from the AWS Data Exchange Data Discovery Team, which aims to respond within 2 business days.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “You should receive a response from the AWS Data Exchange Data Discovery Team within 2 business days.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/subscriber-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c122** A data product request lets the buyer state delivery cadence, subscription length and subscription budget.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Delivery cadence” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/subscriber-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c124** A buyer can browse the AWS Data Exchange catalogue by category and filter by data set type, including Access to Amazon S3.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Products containing Amazon S3 data access” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/subscriber-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact

### trust

- **c011** AWS tells customers to do their own additional due diligence on compliance with data privacy laws for data obtained through AWS Data Exchange.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you are encouraged to conduct your own additional due-diligence to ensure compliance with any applicable data privacy laws” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c067** In the standard DSA the provider warrants that any data identifying a natural person has already lawfully been made public and contains no Sensitive Personal Data.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “already lawfully been made available to the general public, such as via governmental” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c072** The standard DSA requires the provider to carry at least USD 5 million of commercial general liability insurance per occurrence.  
  _number · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_ · **5000000 USD** (minimum commercial general liability insurance the provider must maintain, per occurrence and aggregate, default DSA; USD 5M professional liability also required; per occurrence)
  - “not less than $5,000,000 per occurrence and $5,000,000 aggregate limit” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — No independent copy with the insurance clause was found. The Rearc, Utecon and Visier provider DSAs fetched in this run contain no USD 5,000,000 commercial general liability requirement; searches found the clause only on AWS-hosted copies (aws-mp-standard-contracts S3, d7umqicpi7263.cloudfront.net EULAs). Absence from provider variants is not a refutation of the template.
  - verifier (scope): **scope_ok** — The quote does not name the policy type, but in section 9 of the template 'per occurrence and $5,000,000 aggregate limit' belongs to the Commercial General Liability requirement. Professional Liability is a separate USD 5M 'for each claim'. The attribution is correct.
- **c075** In the standard DSA the provider does not warrant that the data will be accurate, complete or up to date.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “that the Data will be accurate, complete, or up-to-date” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c086** If a provider indicates a product contains sensitive or personal data categories, this is displayed with the product details.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “If the data provider has indicated that the product contains any categories of sensitive or personal data” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c112** The Shutterstock sample listing's metadata fields include a model-release flag.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Free Sample Dataset - 1000 High Resolution Images & Metadata_
  - “has_model_release” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### transaction

- **c006** A public offer on a data product includes prices and durations, a data subscription agreement, a refund policy and the option to create custom offers.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “This offer includes prices and durations, data subscription agreement, refund policy, and the option to create custom offers” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c016** Besides a public offer, a provider can create custom offers, including private offers and Bring Your Own Subscription (BYOS) offers, for selected customers.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you can create custom offers, including private and Bring Your Own Subscription (BYOS) offers, for select customers” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c017** AWS disburses provider proceeds monthly to the bank account of the registered seller account, net of AWS Marketplace service fees.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS disburses payments monthly directly to the bank account associated with the AWS account registered as a seller” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-financials.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “minus AWS Marketplace service fees” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-financials.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c018** AWS disburses funds to a data provider only after they are collected from the subscriber.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Funds are disbursed to you only after they are collected from the subscriber.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-financials.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c033** On a subscription offer the subscriber picks one price and duration, accepts the offer terms and pays the purchase charges upfront.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “they must agree to your offer terms and pay upfront for the purchase charges” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c039** A custom offer extended to a selected AWS account lets the provider set specific terms and pricing for that buyer.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The custom offer makes it possible for you to set specific terms and pricing for your product.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c047** The provider's registered AWS Marketplace seller account is the seller of record for its data products.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “the account is the seller of record for your products and is used for reporting and disbursement” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c078** All AWS Data Exchange products are subscription-based.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “All AWS Data Exchange products are subscription-based.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c087** When a buyer subscribes to a data product AWS may share the buyer's contact information with the provider.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “When you subscribe to a data product, we might share your contact information with the provider.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c088** For a data product with an upfront commitment the subscriber is invoiced by Amazon Web Services immediately.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you will receive an invoice from Amazon Web Services (AWS) immediately” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c095** The AWS Data Exchange FAQ says providers receive a monthly disbursement for subscriptions less fulfilment fees.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “You will receive a disbursement for subscriptions less fulfillment fees once a month.” — Amazon Web Services, <https://aws.amazon.com/data-exchange/faqs/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c097** Private offers let a provider make a public product available to selected AWS customers with custom price, duration, payment schedule, DSA or refund policy.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “set terms including price, duration, payment schedule, DSA, or refund policy” — Amazon Web Services, <https://aws.amazon.com/data-exchange/faqs/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c105** A private offer names at least one subscriber account and carries an offer expiration date by which the subscriber must accept.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “add at least one subscriber account to which you want to extend the offer” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “by which the subscriber must accept the offer” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c117** For sellers in India, AWS India issues GST tax invoices to buyers with the seller as seller on record.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: India_
  - “AWS India facilitates issuing GST tax invoices to buyers with you as the seller on record (SoR)” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/india-seller-faq.html> · docs · retrieved 2026-09-30 · quote check: exact

### pricing

- **c031** Offer durations for AWS Data Exchange subscriptions run from 1 to 36 months.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Durations are 1–36 months.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c032** The only supported pricing currency for AWS Data Exchange offers is US dollars.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The only supported currency for pricing is US dollars (USD).” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c050** AWS Marketplace charges a 3% listing fee on AWS Data Exchange public offers.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **3 percent** (listing fee paid by the seller (deducted from disbursement), percent of pre-tax total contract value, AWS Data Exchange public offers; per transaction)
  - “AWS Data Exchange – 3%” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Clazar is a third-party AWS Marketplace seller-tools company, not AWS; its guide is dated 2026-08-11, last updated 2026-08-25. It restates AWS's schedule, so it corroborates currency rather than being an independent measurement.
    - “AWS Data Exchange products: 3%” — Clazar, <https://clazar.io/blog/aws-marketplace-fees> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote sits under 'Listing fees for software and data public offers are determined by the deployment method', so the 3% is the public-offer rate for ADX. The rates have been in effect since 2024-01-05, as the page says. The same page adds an additive regional listing fee (South Korea +1%), so the stated rate is the standard rate, not what every sale pays. The profile has no claim for this; see missed v001.
- **c051** AWS Marketplace charges a 3% listing fee on private offers with total contract value under USD 1M.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **3 percent** (listing fee paid by the seller, percent of pre-tax total contract value, private offers under USD 1M (all product types incl. data); per transaction)
  - “Less than $1M – 3%” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — The page scopes the tiers to 'software and data private offers'. Stactize is a third-party AWS Marketplace integration partner; this is its knowledge base (partner documentation), undated, describing the January 2024 AWS fee change. Clazar's guide (2026-08-25) gives the same figure, so it is still current.
    - “Deals under $1 million TCV: 3% fee.” — Stactize, <https://stactize.com/knowledge-base/finance/amazon-aws-marketplace-transaction-fees/> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is in the private-offer section, which covers software and data. The claim's basis says 'all product types', but professional services private offers carry 0.5% on the same page, so that basis is slightly too broad. The same page adds an additive regional listing fee (South Korea +1%), so the stated rate is the standard rate, not what every sale pays. The profile has no claim for this; see missed v001.
- **c052** AWS Marketplace charges a 2% listing fee on private offers with total contract value from USD 1M to under USD 10M.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **2 percent** (listing fee paid by the seller, percent of pre-tax total contract value, private offers USD 1M to under 10M; per transaction)
  - “Between $1M and less than $10M – 2%” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Stactize is a third-party AWS Marketplace integration partner; this is its knowledge base (partner documentation), undated, describing the January 2024 AWS fee change. Clazar's guide (2026-08-25) gives the same figure, so it is still current.
    - “Deals between $1 million and under $10 million TCV: 2% fee.” — Stactize, <https://stactize.com/knowledge-base/finance/amazon-aws-marketplace-transaction-fees/> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is in the private-offer TCV tiers on the AWS listing-fees page. The same page adds an additive regional listing fee (South Korea +1%), so the stated rate is the standard rate, not what every sale pays. The profile has no claim for this; see missed v001.
- **c053** AWS Marketplace charges a 1.5% listing fee on private offers with total contract value of USD 10M or more.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **1.5 percent** (listing fee paid by the seller, percent of pre-tax total contract value, private offers USD 10M or more; per transaction)
  - “Equal to or greater than $10M – 1.5%” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Stactize is a third-party AWS Marketplace integration partner; this is its knowledge base (partner documentation), undated, describing the January 2024 AWS fee change. Clazar's guide (2026-08-25) gives the same figure, so it is still current.
    - “Deals equal to or greater than $10 million TCV: 1.5% fee.” — Stactize, <https://stactize.com/knowledge-base/finance/amazon-aws-marketplace-transaction-fees/> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is in the private-offer TCV tiers on the AWS listing-fees page. The same page adds an additive regional listing fee (South Korea +1%), so the stated rate is the standard rate, not what every sale pays. The profile has no claim for this; see missed v001.
- **c054** AWS Marketplace charges a 1.5% listing fee on all private offer renewals.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **1.5 percent** (listing fee paid by the seller, percent of pre-tax total contract value, renewals of private offers or of prior off-Marketplace agreements; per transaction)
  - “All renewals – 1.5%” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Stactize is a third-party AWS Marketplace integration partner; this is its knowledge base (partner documentation), undated, describing the January 2024 AWS fee change. Clazar's guide (2026-08-25) gives the same figure, so it is still current.
    - “Fees for renewing private offers for software and data are set at 1.5%.” — Stactize, <https://stactize.com/knowledge-base/finance/amazon-aws-marketplace-transaction-fees/> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — 'All renewals' is in the private-offer list, which the page says covers renewals from a previous private offer or from an agreement outside AWS Marketplace, as the claim's basis says.
- **c055** AWS Marketplace listing fees are calculated on the pre-tax total contract value.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The fee is calculated based on the pre-tax Total Contract Value (TCV).” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c057** Channel partner private offers add a 0.5 percentage-point uplift to the AWS Marketplace listing fee.  
  _number · vendor_stated · as of 2024-01-05 (page_dated)_ · **0.5 percentage points** (uplift on the seller's listing fee for channel partner private offers, any offer type or deployment method; per transaction)
  - “CPPO products have a 0.5% uplift on the listing fee” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Stactize's worked example adds it as percentage points (3% + 0.5% = 3.5%). Clazar (2026-08-25) adds that the CPPO fee is charged on the discounted price the seller gives the channel partner, not the end-customer price. Stactize is a third-party AWS Marketplace integration partner; this is its knowledge base (partner documentation), undated, describing the January 2024 AWS fee change. Clazar's guide (2026-08-25) gives the same figure, so it is still current.
    - “CPPO transactions have a 0.5% uplift on the standard private offer fee.” — Stactize, <https://stactize.com/knowledge-base/finance/amazon-aws-marketplace-transaction-fees/> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The quote continues 'regardless of the offer type or deployment method', and the page's example adds it as percentage points (3% + 0.5% = 3.5%). The page also says the fee is computed on the discounted price the ISV gives the channel partner, which the profile lacks; see missed v002.
- **c058** AWS Data Exchange charges data senders USD 0.04167 per hour while an accepted data grant is active.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **0.04167 USD per hour** (paid by the data sender, per active accepted data grant (worked example on pricing page); per hour)
  - “you will be charged $.04167 per hour until your data grant expires” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — CloudZero is a third-party cloud-cost vendor (blog dated 2026-02-17); it restates AWS's price list. It scopes the rate to US East (Ohio) with regional variation, and says grants become billable only after the receiver accepts them.
    - “AWS charges $0.04167 per active data grant per hour in US East (Ohio)” — CloudZero, <https://www.cloudzero.com/blog/aws-data-exchange/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The quote comes from a worked example (a 6-month Redshift datashare grant). The page's live rate table is region-dependent ({regionSelector}), and the matching Files example is set in US East (N. Virginia). The statement gives USD 0.04167 as the rate with no region. It should be scoped to US East (N. Virginia) and marked as varying by Region. CloudZero gives the same figure for US East (Ohio).
- **c059** AWS Data Exchange charges for storing data loaded into the service; the pricing example uses USD 0.023 per GB-month.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **0.023 USD per GB-month** (storage of Files assets loaded into AWS Data Exchange, paid by the data sender; rate taken from the page's worked example; per month)
  - “at $0.023/GB/month” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — CloudZero gives this as the US East (Ohio) storage rate, measured in byte-hours and billed monthly, with pricing varying by Region. Third-party cloud-cost vendor restating AWS's price list.
    - “$0.023 per GB per month” — CloudZero, <https://www.cloudzero.com/blog/aws-data-exchange/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — The statement already says the rate is from the pricing example. The page says storage prices are 'based on the size of data and on the Region', and it covers Files products only ('Storage fees for products containing Files'). Region is still unstated.
- **c060** AWS Marketplace charges tiered fulfilment fees on revenue that AWS collects for all new subscriptions to data products.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “charges tiered fulfillment fees for revenue collections made by AWS for all new subscriptions to your data products” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact
- **c061** Bring Your Own Subscription offers let providers migrate pre-existing subscribers onto AWS Data Exchange at no additional cost.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “offers to migrate and fulfill pre-existing subscriptions with AWS customers at no additional cost” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact
- **c114** SilverLining.Cloud's currency history data product shows a public price of USD 370 for a 12-month contract.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Currency Exchange Historical Data (140+ currencies), 12-month contract_ · **370 USD** (public offer list price paid by buyer, Product Access dimension, 12-month contract; per 12 months)
  - “$370.00” — SilverLining.Cloud GmbH (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-vyrjcczmkjaeu> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - “12-month contract” — SilverLining.Cloud GmbH (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-vyrjcczmkjaeu> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — SilverLining.Cloud's own product page confirms it sells its full historical dataset on AWS Data Exchange and links the listing, but it gives no price. The USD 370 price appears only on the AWS Marketplace listing.
  - verifier (scope): **scope_ok** — The two quotes are separate fragments ('$370.00' and '12-month contract') that do not show their link on their own. Refetching the listing shows the price is USD 370 per 12 months for the Product Access dimension of 'Currency Exchange Historical Data (140+ currencies)' from SilverLining.Cloud GmbH, which matches the claim.
- **c126** AWS Marketplace deducts the listing fee from the amount it disburses to the seller.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Marketplace deducts this listing fee from the amount disbursed to the ISV.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c129** Buyers also pay for any AWS services they use to store, process or analyse subscribed data products.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “charges for any AWS services you choose to store, process, or analyze the data products” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact

### licence

- **c034** The Data Subscription Agreement (DSA) is the standard contract template that AWS Data Exchange offers as the default for data products.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The Data Subscription Agreement (DSA) is the standard contract template that AWS Data Exchange offers as the default.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c035** On AWS Data Exchange the provider, not AWS, controls the legal terms and usage rights attached to each offer.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “As a provider, you control the legal terms and usage rights.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c036** A provider can edit the default DSA or upload its own custom agreement, which AWS attaches to the offer without further modification.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you can specify your own custom terms by uploading the DSA of your choice” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “AWS Data Exchange associates the DSA that you specify for the product's offer without any further modifications.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c037** AWS says the DSA sets common ground on use, warranty, indemnification and governing law.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “common ground across key contractual clauses like use, warranty, indemnification and governing law” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c042** The publishing guidelines tell providers to state in their DSA how subscribers may and may not use the data product.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you should clearly include this information in your Data Subscription Agreement (DSA)” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publishing-guidelines.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c063** The standard DSA grants the subscriber, its affiliates and users a non-exclusive, worldwide, non-transferable licence to receive, retain, use and modify the data and create Derived Data.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “a nonexclusive, worldwide, nontransferable license to receive, retain, use, and modify the Data and to create Derived Data” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c064** The standard DSA forbids the subscriber to publish, distribute or give any third party access to the data or any material subset of it.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “publish, disseminate, distribute or provide access of any kind to the Data, or any material subset thereof” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c065** The standard DSA forbids using de-identified data to create or infer information about the identity of an individual.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “use the Data to create, generate, or infer any information relating to the identity of an individual” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c066** Under the standard DSA the subscriber owns Derived Data, which is defined to include analytics, tools and models created using the data.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “it owns all right, title and interest in and to the Derived Data” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - “including data analytics, reports, research, analysis, tools, notes, presentations, discussions and/or models” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c068** In the standard DSA the provider indemnifies the subscriber against claims arising from the provider's failure to hold the rights and consents needed to supply the data.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “any actual or alleged failure by Provider to obtain and hold sufficient legal right and any consents, authorizations” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c069** The standard DSA's provider indemnity also covers claims that the data violates third parties' rights of publicity or privacy.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “violation of any Proprietary Rights, right of publicity, or privacy or other rights of a third party by the Data” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c070** The standard DSA caps each party's aggregate liability at the greater of three times the subscriber's spend in the prior twelve months or USD 1 million.  
  _number · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_ · **3 multiple of subscriber spend in the preceding 12 months** (general liability cap for either party under the default DSA; the cap is the greater of this or USD 1,000,000; carve-outs for indemnity, confidentiality, gross negligence, fraud; trailing 12 months)
  - “SHALL EXCEED THE GREATER OF THREE TIMES THE SUBSCRIBER SPEND IN THE TWELVE (12) MONTHS” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Source is the data provider Rearc's own published DSA (a 'Non-Sensitive' variant, undated), hosted in Rearc's S3 bucket, not the 2022-07-14 AWS template itself. It carries the same clause word for word, which supports the template wording but does not by itself prove the version date. No law-firm or filing copy of the template was found.
    - “THREE TIMES THE SUBSCRIBER SPEND IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE DAMAGES OR $1 MILLION” — Rearc, <https://rearc-data-public-assets.s3.amazonaws.com/Rearc_Data_DSA.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The quote says less than the statement. It stops at 'TWELVE (12) MONTHS' and leaves out the 'OR $1 MILLION' alternative, which is the other half of the stated cap. The template PDF does contain '...GIVING RISE TO THE DAMAGES OR $1 MILLION', so the fact is right; only the quote needs extending. The 2022-07-14 date comes from the PDF's filename, not from text printed in the document.
- **c073** The standard DSA is governed by New York law with exclusive forum in Manhattan.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “governed and interpreted under the laws of the State of New York” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
- **c074** The standard DSA is solely between subscriber and provider; Amazon Web Services is not a party to it and has no liability under it.  
  _terms · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_
  - “This Agreement is solely between Subscriber and Provider.” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - “Neither Amazon Web Services, Inc. nor any of its Affiliates are a party to this Agreement” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — Only half supported independently: Rearc's DSA copy says the agreement is solely between subscriber and provider, but it does not name Amazon Web Services or say AWS has no liability. Search found the AWS non-party wording only on AWS-hosted copies.
    - “This Agreement is solely between Subscriber and Provider.” — Rearc, <https://rearc-data-public-assets.s3.amazonaws.com/Rearc_Data_DSA.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The two quotes support 'solely between subscriber and provider' and 'AWS is not a party'. The second quote stops before 'and none of them will have any liability or obligations hereunder', so the 'has no liability under it' part is unquoted. The document supports it; the quote needs extending.
- **c077** AWS Marketplace lists the Data Subscription Agreement among its standardised contracts, describing it as simplifying procurement of data in AWS Data Exchange.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “helps customers simplify procurement and quickly access data solutions available in AWS Data Exchange” — Amazon Web Services, <https://aws.amazon.com/marketplace/features/standardized-contracts> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c118** AWS says usage of data products sold on AWS Marketplace is governed by agreements between buyers and sellers to which AWS is not a party.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS is not a party to these agreements.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/buyerguide/contract-structure.html> · docs · retrieved 2026-09-30 · quote check: exact

### custody

- **c008** AWS Data Exchange lets data recipients directly access and use a provider's own Amazon S3 buckets.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange also enables recipients to directly access and use providers' Amazon S3 buckets.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c013** When a provider publishes a Files data set in a product, AWS Data Exchange creates a copy of it that subscribers access as an entitled data set.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange creates a copy of the data set. Subscribers can access that copy of the data set as an entitled data set” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c014** With Amazon S3 data access products, providers share direct access to their own S3 bucket or prefix and use AWS Data Exchange only to manage subscriptions, entitlements, billing and payment.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Providers share direct access to an Amazon S3 bucket or specific prefix and Amazon S3 objects” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “use AWS Data Exchange to manage subscriptions, entitlements, billing, and payment” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c025** Subscribers to an Amazon S3 data access data set get read-only access to shared objects hosted in the provider's own S3 buckets.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “they're granted read-only access to shared Amazon S3 objects hosted in the provider's Amazon S3 buckets” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The read-only access in the provider's own buckets is described only in AWS docs and AWS workshop pages. Study-guide sites that repeat it are not citable. CloudZero confirms read-only access for Redshift datashares but not for S3 data access.
  - verifier (scope): **scope_ok** — The quote on data-sets.html describes the Amazon S3 data access data set type. The claim sits under Q6 custody (share in place).
- **c026** Amazon S3 data access lets subscribers use a provider's data without creating or managing copies of it.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “directly access and use the provider's data without creating or managing data copies” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c028** A subscriber to a Files data set can export the data to a local computer or to the subscriber's own Amazon S3 bucket.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you can export data either locally (download to your computer) or to your Amazon S3 bucket.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c062** AWS recommends that providers sharing S3 objects directly enable Requester Pays so subscribers pay for data requests and downloads.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “it is recommended to enable Requester Pays such that requesters pay for data requests and downloads” — Amazon Web Services, <https://aws.amazon.com/data-exchange/pricing/> · pricing_page · retrieved 2026-09-30 · quote check: exact
- **c084** Subscribers to file products can auto-export new revisions to up to five of their own S3 buckets when the provider publishes them.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **5 S3 buckets** (maximum number of subscriber-owned buckets for automatic export of new revisions, Files products; not stated)
  - “automatically export new revisions to your Amazon S3 buckets (up to five buckets maximum)” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The provider PredictHQ's docs confirm that ADX revisions can be copied to S3 automatically, but no independent source gives the five-bucket limit. Search found it only on AWS pages, AWS's GitHub docs mirror and certification study guides (not citable).
  - verifier (scope): **scope_ok** — The quote's sentence begins 'After you subscribe to a product containing files', which matches the statement's scope to file products.
- **c098** When a buyer subscribes to an S3 data access product, AWS Data Exchange provisions an S3 access point and updates its policies on the provider's behalf to grant read-only access.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange automatically provisions an Amazon S3 access point and updates its resource policies on your behalf” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c100** Objects shared through S3 data access must be in the S3 Standard storage class or managed by S3 Intelligent-Tiering.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Your shared objects must be in the Amazon S3 Standard Storage class, or be managed using S3 Intelligent Tiering” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c101** An S3 data access data set can share an entire bucket or up to five prefixes or objects within one bucket.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **5 prefixes or objects per S3 data access share** (maximum locations selectable within one bucket per data access share; whole bucket also allowed; not stated)
  - “specify up to five prefixes or objects within an Amazon S3 bucket” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The limit of five prefixes or objects appears only on AWS docs, AWS workshops (catalog.workshops.aws) and study-guide sites; no partner, provider or independent source was found.
  - verifier (scope): **scope_ok** — The quote is from step 2 of publishing an S3 data access product. The same sentence opens 'You can select an entire Amazon S3 bucket', and the page adds that more buckets need another S3 data share, which matches 'within one bucket'.

### vetting

- **c003** AWS reviews a data product against its guidelines and terms before the product is listed in the AWS Marketplace catalogue.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “that product is listed in the AWS Marketplace product catalog after being reviewed by AWS against our guidelines” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c015** A provider may enable subscription verification, which makes subscribers request a subscription so the provider can review them before they get access.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “If you enable subscription verification, subscribers must request a subscription to your product.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c019** The Extended Provider Program lets qualified providers publish data products containing sensitive or non-public personal information.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “a program for qualified data providers to publish data products containing sensitive categories of personal information” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c020** Providers seeking the Extended Provider Program must pass an additional review by the AWS Data Exchange team.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Providers seeking to participate in the EPP must complete an additional review process by the AWS Data Exchange team.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/providing-data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c040** Outside the Extended Provider Program, data products may not include information that identifies any person unless it is Publicly Available Information.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “your data products may not include information that can be used to identify any person, unless that information is” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publishing-guidelines.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c044** AWS removes any data product that breaches the publishing guidelines and may suspend the provider from the service.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS removes any product that breaches these guidelines and may suspend the provider from future use of the service.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publishing-guidelines.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c046** To provide data products an AWS account must be a registered AWS Marketplace seller and also be qualified by the AWS Data Exchange team.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you must be a registered seller on AWS Marketplace and be qualified by the AWS Data Exchange team” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c048** Data product providers must have a defined customer support process and support organisation.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Have a defined customer support process and support organization.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/provider-getting-started.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c104** After a provider submits a product with a public offer, its status is Awaiting approval until AWS Data Exchange publishes it.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange prepares and publishes your product.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact

### post_sale

- **c023** A provider can revoke subscribers' access to a revision and must give subscribers a comment stating the reason.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “A required comment to inform subscribers of the reason their access to the revision was revoked.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c029** For Amazon Redshift data sets, access to the datashare starts when the grant or subscription activates and is lost when it expires.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “lose access after your either of these expire” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c038** AWS Data Exchange does not require providers to offer refunds but requires each offer to state its refund policy; AWS processes refunds only when the provider authorises them.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange doesn't require you to offer refunds, you must clearly specify your refund policy in the offer details” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c071** Under the standard DSA the subscriber must remove the data from its systems within 90 days after the subscription ends and destroy other copies if the provider instructs.  
  _number · legal_text · as of 2022-07-14 (page_dated) · scope: Data Subscription Agreement for AWS Marketplace (2022-07-14 template)_ · **90 calendar days** (deadline for subscriber to remove data after termination or expiry, default DSA; one-off)
  - “within ninety (90) calendar days following such termination or expiration, Subscriber will remove the Data” — Amazon Web Services, <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Same Rearc DSA copy; it also says 'if instructed by Provider, destroy all other copies of the Data'. An older provider copy (utecon.net, 2022-02) limits removal to 'the AWS Services infrastructure used by Subscriber', so the wording has changed between versions.
    - “within ninety (90) calendar days following such termination or expiration, Subscriber will remove the Data” — Rearc, <https://rearc-data-public-assets.s3.amazonaws.com/Rearc_Data_DSA.pdf> · legal_terms · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The quote covers only the 90-day removal. The second half of the statement ('destroy other copies if the provider instructs') is not in the quote, though the same clause 8.5.1 says 'if instructed by Provider, destroy all other copies of the Data'. The template scopes removal to 'the AWS Services infrastructure used by Subscriber under its own AWS Services account and any other computer systems operated by or for Subscriber', which fits 'its systems'. This is a quote-coverage gap, not a factual error.
- **c079** Once an AWS Data Exchange subscription has expired, the subscriber can no longer view or export the data sets.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Once a subscription has expired, you can no longer view or export the data sets.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c080** If a provider unpublishes a product, existing subscribers keep access to its data sets while their subscription is active but cannot auto-renew.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “If a provider decides to unpublish a product, you still have access to the data sets as long as your subscription is active.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c082** When a Files subscription ends the subscriber keeps files already exported; whether they must be deleted depends on the DSA.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you retain access to any files that you already exported” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
  - “Review your Data Subscription Agreement to verify if your agreement requires that you delete exported data” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c092** Since 15 March 2022 providers can revoke subscribers' access to a revision and delete the revision's assets.  
  _event · vendor_stated · as of 2022-03-15 (page_dated)_
  - “Providers can revoke subscribers' access to a revision and delete the assets of the revision.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c093** Providers can send subscribers notifications about data updates, delays, schema changes and deprecations (launched 31 October 2023).  
  _event · vendor_stated · as of 2023-10-31 (page_dated)_
  - “Providers can send notifications corresponding to data updates, data delays, schema changes, and deprecations.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c096** When a subscription is no longer active, AWS Data Exchange revokes the subscriber's entitlement to the provider's data.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “AWS Data Exchange revokes that subscriber's entitlement to your data.” — Amazon Web Services, <https://aws.amazon.com/data-exchange/faqs/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c099** For S3 data access products the subscriber's permissions on the provider's bucket are revoked when the subscription ends.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “When the subscription ends, the subscriber’s permissions are revoked.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publish-s3-data-access-product.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c106** Products can be set to Restricted, which stops new subscriptions and hides the product while existing allowlisted users keep using it.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “it will no longer be visible to the public or available to new users” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-visibility.html> · docs · retrieved 2026-09-30 · quote check: exact

### catalogue_custom

- **c109** PIXTA AI's listing directs buyers to contact its representative to curate a specific data set, i.e. the full or custom dataset is sold off the self-serve path.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Car dataset in multiple scenes for AI & Computer Vision_
  - “who will work with you to curate your specific data set” — PIXTA AI (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-6i7gc6mi7hlgs> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c111** Shutterstock lists a free 1,000-image sample on AWS Data Exchange and asks buyers wanting its full library to contact its sales team for tailored datasets.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Free Sample Dataset - 1000 High Resolution Images & Metadata_
  - “to start using our tailored services to help ideate, curate and customize datasets for your unique business needs” — Shutterstock (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-w6cuvuwu6qrlo> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c113** InfoBay AI's image dataset listing is sample data only, with enterprise licensing of the complete corpus available on request.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Multidomain Image Dataset for Computer Vision & Multimodal AI_
  - “Enterprise licensing and access to the complete image corpus are available upon request.” — InfoBay AI Ltd. (AWS Marketplace listing), <https://aws.amazon.com/marketplace/pp/prodview-jzwdtminy6cnq> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c123** AWS's data consultation page says additional custom products are available through private products.  
  _offer · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “Additional custom products available through private products” — Amazon Web Services, <https://pages.awscloud.com/adx-contact-dex-contact-us.html> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### changes

- **c056** The current AWS Marketplace listing fee schedule took effect on 5 January 2024.  
  _event · vendor_stated · as of 2024-01-05 (page_dated)_
  - “These listing fees are effective as of January 5, 2024 at midnight UTC.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c081** If offer terms have changed when an auto-renewing subscription renews, the new price and new DSA apply to the renewed subscription.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “the new product offer terms (including new price and new DSA) apply” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/product-subscriptions.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c089** AWS Data Exchange became generally available on 13 November 2019.  
  _event · vendor_stated · as of 2019-11-13 (page_dated)_
  - “AWS Data Exchange is now generally available” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c090** Since 14 December 2023 data owners can share data through AWS Data Exchange data grants without registering as AWS Marketplace sellers.  
  _event · vendor_stated · as of 2023-12-14 (page_dated)_
  - “Data owners can now share data using AWS Data Exchange without registering as a AWS Marketplace seller.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html> · docs · retrieved 2026-09-30 · quote check: exact
- **c091** Products containing Amazon S3 data access became generally available on 14 March 2023.  
  _event · vendor_stated · as of 2023-03-14 (page_dated)_
  - “Subscribing to and publishing data products containing Amazon S3 data access is now generally available.” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html> · docs · retrieved 2026-09-30 · quote check: exact

### demand

- **c119** AWS says AWS Data Exchange has more than 3,500 products from over 300 providers.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only)_ · **3500 data products** (vendor-stated catalogue size, over 300 providers; undated page; not stated)
  - “AWS Data Exchange is the only data marketplace with more than 3,500 products from over 300 providers” — Amazon Web Services, <https://aws.amazon.com/data-exchange/why-aws-data-exchange/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **unverifiable** — The 3,500 products / 300 providers figure is found only on AWS pages and on directories, listicles and training sites (londonstrategicedge, slashdot, k21academy), which are banned or unsuitable. No independent reporting was found. It is an AWS-stated figure in any case.
  - verifier (scope): **scope_ok** — The statement is correctly framed as 'AWS says' (vendor_stated). The page is undated, so the figure has no as-of date beyond retrieval.
- **c120** VentureBeat reported, citing Amazon, that more than 80 providers contributed over 1,000 data products at launch in November 2019.  
  _number · press_relayed · as of 2019-11-13 (publication)_ · **80 data providers** (providers at launch, as stated by Amazon and relayed by press; over 1,000 products; at launch)
  - “More than 80 data providers have contributed over 1,000 products containing data at launch, Amazon says.” — VentureBeat, <https://venturebeat.com/2019/11/13/amazons-aws-data-exchange-launches-with-over-80-data-providers/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Article dated 2019-11-13. VentureBeat relays Amazon's figure, as the claim says. The claim is about what VentureBeat reported, so the confirming page is necessarily VentureBeat itself, found blind (Part 2 showed the profile cites the same URL). InfoQ (Nov 2019, infoq.com/news/2019/11/AWS-Data-Exchange) independently reports the same numbers.
    - “More than 80 data providers have contributed over 1,000 products containing data at launch, Amazon says.” — VentureBeat, <https://venturebeat.com/2019/11/13/amazons-aws-data-exchange-launches-with-over-80-data-providers/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The quote matches word for word, and the article is dated 2019-11-13. It is correctly classed as press_relaying_vendor.

### regulation

- **c041** Biometric, health, racial or ethnic origin and other listed sensitive categories must be aggregated or anonymised so no person in the data product can be identified.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “must be aggregated or anonymized so that no person in your data product can be identified: biometric or genetic data” — Amazon Web Services, <https://docs.aws.amazon.com/data-exchange/latest/userguide/publishing-guidelines.html> · docs · retrieved 2026-09-30 · quote check: exact

## Added by the verifier

- **v001** AWS Marketplace adds a 1% regional listing fee, on top of the standard listing fee, for sales to buyers in South Korea.  
  _number · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: South Korea_ · **1 percentage points** (additive regional listing fee paid by the seller on sales to South Korean buyers, all offer types; per transaction)
  - “South Korea, the listing fee would be 4% (3% standard private offer listing fees plus a 1% regional listing fee)” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact
- **v002** For channel partner private offers, the AWS Marketplace listing fee is charged on the discounted price the provider gives the channel partner.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “The listing fee is based on the discounted price offered by the ISV to the channel partner.” — Amazon Web Services, <https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html> · docs · retrieved 2026-09-30 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf>, <https://docs.aws.amazon.com/data-exchange/latest/userguide/prepare-offers.html>
- `questions.Q5 (Terms and Conditions for AWS Marketplace Sellers: AWS's role in payment collection, agent status)` — gated; tried <https://aws.amazon.com/marketplace/management/seller-settings/terms>
- `questions.Q1 (subscription volumes, buyer types, spend for image/video data)` — not_published; tried <https://aws.amazon.com/data-exchange/why-aws-data-exchange/>, <https://aws.amazon.com/data-exchange/faqs/>, <https://venturebeat.com/2019/11/13/amazons-aws-data-exchange-launches-with-over-80-data-providers/>
- `questions.Q8 (audit rights, leakage detection, fingerprinting)` — not_published; tried <https://aws-mp-standard-contracts.s3.amazonaws.com/Data-Subscription-Agreement-for-AWS-Marketplace-2022-07-14.pdf>, <https://docs.aws.amazon.com/data-exchange/latest/userguide/data-sets.html>
- `status (a dated source within six months)` — not_found; tried <https://docs.aws.amazon.com/data-exchange/latest/userguide/doc-history.html>, <https://aws.amazon.com/blogs/big-data/category/analytics/aws-data-exchange/>, <https://aws.amazon.com/blogs/industries/financial-market-infrastructure-providers-cloud-adoption-update-for-1h26/>
- `pricing (tier table behind 'tiered fulfillment fees' on the ADX pricing page)` — not_published; tried <https://aws.amazon.com/data-exchange/pricing/>
- `licence (whether a DSA version newer than 2022-07-14 exists)` — not_found; tried <https://aws.amazon.com/marketplace/features/standardized-contracts>
- `supply (independent evidence of provider count, revenue or GMV)` — not_published; tried <https://press.aboutamazon.com/2019/11/aws-announces-aws-data-exchange>

## Conflicts

- c094, c045: FAQ says provider entity must be US or EU domiciled; the user guide lists 13 eligible jurisdictions. The user guide (documentation) is taken as current; both kept. (live_primary_wins_terms)
- c115, c045: Unresolved: the AWS Marketplace India seller FAQ says Indian sellers can offer AWS Data Exchange products (India-only buyers), but the ADX eligible-jurisdiction list omits India. Both are live primary docs; the India FAQ is more specific and possibly newer. Needs confirmation before relying on it. (live_primary_wins_terms)
- c060, c050: ADX pricing page speaks of 'tiered fulfillment fees'; the Marketplace seller guide gives a flat 3% for ADX public offers and TCV tiers only for private offers. Read as: tiers apply to private offers; the seller guide figures are used. (live_primary_wins_terms)

## Leads, not cited

- <https://investor.shutterstock.com/news-releases/news-release-details/shutterstockai-launches-data-aws-data-exchange-advance-computer> — Shutterstock press release on its computer-vision datasets on ADX; vendor-relayed, not fetched.
- <https://aws.amazon.com/blogs/awsmarketplace/using-shutterstocks-image-datasets-to-train-your-computer-vision-models/> — AWS blog walkthrough of buying and using image datasets from ADX; not fetched.
- <https://aws.amazon.com/about-aws/whats-new/2023/12/aws-data-exchange-data-grants-sharing-organizations/> — Data grants launch announcement.
- <https://aws.amazon.com/service-terms/> — AWS Service Terms may contain an AWS Data Exchange / Marketplace section on AWS's role; not fetched.
- <https://techcrunch.com/2021/11/30/aws-launches-data-exchange-for-apis-to-update-changing-data-automatically/> — Independent-ish coverage of ADX for APIs; not fetched.
- <https://aws.amazon.com/marketplace/pp/prodview-2u4rkbf5hpvia> — Airborne Object Tracking dataset listing (5.9M images) delivered as S3 bucket access; a vision dataset example not opened.
