# Snowflake Marketplace

cloud_exchange · light · status: **active** · also known as Snowflake Data Marketplace, Snowflake Data Exchange

> Rendered from `ledger/snowflake-marketplace.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Snowflake Marketplace listings (public listings; access types Free, Limited trial, Paid)” and its bespoke side “No bespoke collection side; the nearest are 'private listings' and 'private offers' ('individualized offers that providers can extend directly to specific consumers')”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | venue | c002, c003, c028, c073 | Snowflake is not seller of record and not a party to Listing Terms, except for products it lists itself (c012). |
| economics_model | commission | c009, c010, c070 | Fee deducted from Product Cost on paid listings using the Monetization Offering; the rate is in a fee schedule not published on the pages fetched. Snowflake also earns compute consumption and pays providers 10-50% rebates on consumer credits (c050). |
| who_pays_fee | seller | c009, c010, c070 |  |
| supply_models | third_party_providers | c047, c052, c054 | Providers are Snowflake customer organisations; Snowflake may also list its own products (c012) but no evidence was found of it listing its own collected data. |
| custody_model | share_in_place | c025, c030, c032 | Live share without copying into the consumer's account; cross-region auto-fulfilment replicates into a Snowflake-managed secure share area, at the provider's cost. |
| transaction_mode | both | c021, c067, c040, c041, c046 | Self-serve Get > Paid checkout on public paid listings; private offers with negotiated pricing and terms for specific consumers. |
| public_prices | unknown |  | Listing pages render only with JavaScript; no concrete listing price was observed. |
| licence_model | provider_defined | c003, c026, c058, c059 | Provider picks Snowflake's Standard Agreement, its own terms at a public URL, or (private listings) offline terms. |
| exclusivity_offered | unknown |  | Standard Agreement licence is non-exclusive (c027); custom or offline terms could differ, no evidence either way. |
| public_listing | unknown |  | app.snowflake.com/marketplace returns an empty JavaScript shell to the fetcher; docs do not say whether anonymous browsing is possible. |
| buyer_vetting | account_only | c023, c069, c022 | Consumer must be a Snowflake account whose org admin accepted the terms, with the right privileges and a billing address in a supported country for paid listings. |
| sample_mechanics | preview_in_browser | c063, c062, c060, c020 | Listing previews with a representative sample and a data dictionary; limited trials are required for public paid listings. |
| versioning | mutable_latest | c025, c065 | Data shares are live and updated at the provider's declared frequency; no immutable data revisions were found. |
| human_subject_consent_docs | asserted_only | c007, c008 | Provider warrants lawful collection 'e.g., obtaining any required consents'; nothing indicates consent evidence reaches the Consumer. |
| contributor_pay_model | not_applicable | c047 | Suppliers are organisations with full Snowflake accounts; the platform pays no individual capturers or contributors. |
| catalogue_plus_custom | catalogue_only | c052, c038, c040 | Snowflake does not collect to order; private listings and private offers vary access and terms for existing products. Professional-services listings exist (c018) but their scope was not examined. |
| erasure_after_sale | unknown |  | Shared-in-place data is revoked on termination (c029) and copying is barred by default (c005), but no clause obliging deletion of data already extracted was found; neither contractual_deletion nor takedown_only fits on the evidence. |
| quality_evidence | provider_asserted | c014, c066, c013 | Snowflake reviews and approves listings (c037) but disclaims accuracy; compliance certifications are provider-configured from third-party audits. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Snowflake says 820+ providers offer 3,400+ listings (as of July 2025) and pitches Marketplace data for enrichment and AI training; no buyer volumes, units or photo/video demand were found. | c052, c056 |
| Q2 | partial | Listing reaches existing Snowflake customers, lets buyers pay from committed Snowflake capacity, and earns providers 10-50% rebates on consumer compute; paid listings need an approved profile, Stripe payouts and a billing address in an eligible country (India not listed for providers). | c048, c049, c050, c057, c043, c044, c045 |
| Q3 | partial | Inventory comes from provider organisations with full Snowflake accounts (e.g. LSEG), each warranting it holds the rights to license and sell; Snowflake may also list its own products. | c047, c054, c006, c012 |
| Q4 | not_applicable | Snowflake does not commission collection; resale rights are the provider's own warranty (c006), and no post-hoc term change dispute was found. |  |
| Q5 | sourced | Venue: Snowflake is not seller of record nor party to Listing Terms; the provider warrants rights and defends Snowflake, and no provider-to-consumer indemnity is set by Snowflake. | c002, c003, c006, c071, c073, c028 |
| Q6 | sourced | Shared in place: live data without copies into the consumer account; cross-region delivery replicates to a Snowflake-managed secure share area at the provider's cost. | c025, c030, c032, c031 |
| Q7 | partial | Only a provider warranty of lawful personal-data collection with any required consents and a ban on sensitive data (incl. face geometry) in public listings; nothing on capturer, depicted-person releases or property owners. | c007, c008 |
| Q8 | partial | Provider-defined licence; by default no resale, sublicensing or transfer outside Snowflake, and in-place sharing limits leakage; Snowflake does not monitor use and offers no audit or fingerprinting. | c005, c015, c026, c027, c029, c058 |
| Q9 | sourced | Self-serve paid listings (usage or subscription plans, card/bank/capacity drawdown) and negotiated private offers; Snowflake deducts an unpublished fee from the provider's price and pays out via Stripe. | c019, c021, c040, c041, c009, c010, c045, c070 |
| Q10 | partial | A listing carries a data product, pricing plans and offers with contract dates; data is live-updated; on removal existing consumers keep access 30 days (free/trial) or a calendar month (paid), and subscriptions must be honoured. | c039, c042, c065, c033, c034, c035, c036, c011 |
| Q11 | sourced | Snowflake approves every listing but disclaims accuracy; buyers see data dictionaries, previews, SQL examples, provider-configured compliance certifications and limited trials (required for public paid listings). | c037, c014, c062, c063, c064, c066, c060, c020 |
| Q12 | partial | No bespoke collection side; the variant of the catalogue is private listings and private offers extended to specific consumers with negotiated terms. | c038, c040, c059 |

## Claims

### positioning

- **c048** Snowflake pitches the Marketplace to providers as reach to thousands of organisations with deals closed directly on Snowflake.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Offer your products to thousands of organizations in the AI Data Cloud and close deals directly on Snowflake.” — Snowflake, <https://www.snowflake.com/en/product/features/marketplace/snowflake-marketplace-for-providers/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c049** Snowflake tells providers the Marketplace Capacity Drawdown Program lets buyers use committed Snowflake spend, removing budget delays.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Tap into committed Snowflake spend to remove budgetary delays with the Marketplace Capacity Drawdown Program.” — Snowflake, <https://www.snowflake.com/en/product/features/marketplace/snowflake-marketplace-for-providers/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Snowflake's FY2026 10-K pitches the Marketplace to providers as a way to list data, applications and AI products and tap new monetization streams.  
  _offer · filing · as of 2026-03-20 (publication) · scope: Snowflake Marketplace_
  - “List data, applications and AI products on the Snowflake Marketplace and tap into new monetization streams.” — Snowflake Inc. (SEC Form 10-K), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c012** Snowflake may list and sell its own Products on the Marketplace as a Provider.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Snowflake may provide or sell its own Product(s) as a Provider.” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c047** A provider must use a full Snowflake account; trial accounts can share with specified consumers but not on the Marketplace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Trial accounts can share data with specified consumers, but not on the Snowflake Marketplace.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-becoming> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Account-type eligibility rule in Snowflake's docs. No search available.
  - verifier (scope): **quote_incomplete** — The quote covers only the trial-account half. The preceding sentence on the page, 'You must use a full Snowflake account.', supports the first half. As evidence for matrix.supply_models it shows only that providers are Snowflake account holders, which is weak support for third_party_providers.
- **c054** On 30 September 2026 Snowflake and LSEG announced an expanded five-year enterprise-wide collaboration that includes Snowflake Marketplace services.  
  _event · vendor_stated · as of 2026-09-30 (publication) · scope: Snowflake Marketplace_
  - “September 30, 2026 – Snowflake (NYSE: SNOW), the AI Data Cloud company, and LSEG announced an expanded five-year” — Snowflake, <https://www.snowflake.com/en/news/press-releases/lseg-snowflake-expand-collaboration/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Source is LSEG's own publication of the joint release, dated 30 Sep 2026; it confirms the counterparty made the announcement, but it is the same joint text, not independent reporting. No 8-K or other filing for this agreement appears in Snowflake's EDGAR submissions list up to 2026-10-01. LSEG's text says the deal 'deepens LSEG's ongoing use of ... Snowflake Marketplace services', i.e. LSEG as a Snowflake customer and Marketplace provider. No independent press reached: no search available.
    - “LSEG announced an expanded five-year enterprise-wide collaboration at the Snowflake World Tour today” — LSEG, <https://www.lseg.com/en/media-centre/press-releases/2026/lseg-snowflake-collaboration-financial-data-ai-workflows> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Quote stops at 'expanded five-year' and shows neither 'enterprise-wide' nor the Marketplace link. Words that would: 'expanded five-year enterprise-wide collaboration', plus 'reporting and Snowflake Marketplace services' (the release says it 'deepens LSEG's continued use of' these). Note that the Marketplace element is LSEG's use of Marketplace services as a provider/customer, not a new Marketplace product.

### object_model

- **c039** Offers carry individualised billing, payment terms, payment schedules and contract start and end dates.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Offers provide individualized billing, payment terms, payment schedules, and contract start and end dates.” — Snowflake, <https://docs.snowflake.com/en/user-guide/collaboration/listings/pricing-plans-offers/pricing-plans-and-offers> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** Listings declare an update frequency attribute stating how often the data product is updated.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “How often your data product is updated. If updated at different frequencies, choose the highest frequency.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c038** Private listings do not appear on Snowflake Marketplace.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Private listings do not appear on the Snowflake Marketplace” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-creating-publishing> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** A provider must contact Snowflake before creating a paid listing it wants to publish on the Marketplace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Before creating a paid listing that you want to publish on the Snowflake Marketplace, contact your” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-becoming> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** Free listings are available to all consumers on the Marketplace but require Snowflake approval before publishing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Available to all consumers on the Snowflake Marketplace. Requires Snowflake approval before publishing.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c064** Public listings with a Secure Share data product must include at least one SQL quick-start example.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Required for public listings with a Secure Share data product.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c014** Snowflake makes no representation about the completeness, accuracy or reliability of Provider Materials.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “makes no representations as to the Provider Materials' completeness, accuracy, reliability, validity, availability, security” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Trials are required for paid listings offered publicly on Snowflake Marketplace.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Trials are required for listings offered publicly on the Snowflake Marketplace.” — Snowflake, <https://docs.snowflake.com/collaboration/provider-listings-pricing-model> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** A limited trial listing lets consumers trial the provider's data product for a limited period.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Consumers can trial your data product for a limited period of time.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Listings can include a data dictionary that shows consumers the contents and structure of the listing before they install the data product.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “give consumers insight into the contents and structure of your listing before they install the data product” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** Listings can include data previews that provide a representative sample of the data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Previews provide a representative sample of the data” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c066** A provider that has completed a third-party-audited compliance certification can configure its listings to show that certification.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “completed compliance certification by a third-party auditor, you can configure your listings to include this certification” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact

### transaction

- **c002** Except for its own listed Products, Snowflake is not the seller of record of any Product on Snowflake Marketplace.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Snowflake is not the seller of record of any Products” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** Payments under the Monetization Offering are processed by Stripe or another processor Snowflake designates.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “the third-party payment processor, Stripe Inc. ("Stripe") or such other third-party payment processors” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Snowflake's docs say Marketplace Capacity Drawdown reserves a portion of a customer's committed Snowflake capacity for Marketplace purchases.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “a portion of your committed capacity is reserved for Snowflake Marketplace purchases” — Snowflake, <https://docs.snowflake.com/collaboration/marketplace-capacity-drawdown> · docs · retrieved 2026-10-01 · quote check: exact
- **c018** Only data shares, Native Apps and Connected Apps can be bought with Marketplace Capacity Drawdown; managed applications and professional services cannot.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Only eligible Marketplace product types can be purchased with MCD: data shares, Native Apps, and Connected Apps.” — Snowflake, <https://docs.snowflake.com/collaboration/marketplace-capacity-drawdown> · docs · retrieved 2026-10-01 · quote check: exact
- **c021** Consumers can pay for paid listings by credit card, bank transfer or Marketplace Capacity Drawdown funds.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Snowflake supports credit card, bank transfer, and Marketplace Capacity Drawdown (MCD) Program funds for paid listings.” — Snowflake, <https://docs.snowflake.com/collaboration/consumer-listings-paying> · docs · retrieved 2026-10-01 · quote check: exact
- **c023** Before buying paid listings, an organisation administrator must accept the combined Snowflake Provider and Consumer Terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “an organization administrator must accept the combined Snowflake Provider and Consumer Terms” — Snowflake, <https://docs.snowflake.com/collaboration/consumer-listings-paying> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** Private offers are individualised offers that a provider extends directly to specific consumers.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Private offers are individualized offers that providers can extend directly to specific consumers.” — Snowflake, <https://docs.snowflake.com/en/user-guide/collaboration/listings/pricing-plans-offers/pricing-plans-and-offers> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Definition of a Snowflake product feature; exists in its own docs. No search available.
  - verifier (scope): **scope_ok** — Quote matches. The same page adds 'Private offers aren't visible on the Snowflake Marketplace.'
- **c045** Snowflake Marketplace uses Stripe for provider payouts, and providers must create a Stripe Express connected account to receive them.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Snowflake Marketplace uses Stripe to process Provider payouts. To receive payouts, Providers must create” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-becoming> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** When getting a paid listing, the consumer selects the Paid option and reviews the price details before proceeding.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “review details about the price” — Snowflake, <https://docs.snowflake.com/en/collaboration/consumer-listings-access> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** After a consumer requests a limited trial listing, the provider is notified and contacts the consumer.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “After you request a limited trial listing, the listing provider is notified and contacts you.” — Snowflake, <https://docs.snowflake.com/en/collaboration/consumer-listings-access> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c009** Under the Monetization Offering, the Provider bears Snowflake's fees, which are set in a separate Monetization Offering Fee Schedule rather than in the Terms.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Customer is responsible for the Snowflake fees set forth in the relevant Monetization Offering Fee Schedule” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Clause in Snowflake's own terms. The fee schedule itself was not looked for independently: no search available.
  - verifier (scope): **scope_ok** — The quote sits in Section 3 (Use as Provider), where 'Customer' is the Provider, so 'the Provider bears Snowflake's fees' is right. The fee rate is not in the Terms.
- **c010** The Provider's Net Payment equals the Product Cost minus Snowflake's Fees, taxes and other expenses incurred by Snowflake.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “which shall equal the Product Cost minus: (i) the Fees” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c019** A provider's paid listing can use either a usage-based pricing plan or a subscription-based pricing plan.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “You can choose from a usage-based plan or a subscription-based plan” — Snowflake, <https://docs.snowflake.com/collaboration/provider-listings-pricing-model> · docs · retrieved 2026-10-01 · quote check: exact
- **c041** Private offers tied to pricing plans can carry negotiated pricing including discounts and custom terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “providers can apply negotiated pricing that includes discounts and custom terms” — Snowflake, <https://docs.snowflake.com/en/user-guide/collaboration/listings/pricing-plans-offers/pricing-plans-and-offers> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** Providers can configure multiple pricing plans for one listing, such as Good-Better-Best pricing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Providers can configure multiple pricing plans for a listing” — Snowflake, <https://docs.snowflake.com/en/user-guide/collaboration/listings/pricing-plans-offers/pricing-plans-and-offers> · docs · retrieved 2026-10-01 · quote check: exact
- **c050** Under the Data Sharing Rebate Program, Snowflake pays providers tiered rebates of 10% to 50% of the Snowflake credits consumers spend using their shared data, capped by the provider's spend.  
  _number · legal_text · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_ · **50 percent of consumers' Snowflake credits on qualifying jobs (range 10-50%)** (rebate paid by Snowflake to the provider, tiered by consumer usage, capped based on provider spend; not stated)
  - “providers can earn tiered rebates from 10% to 50% based on their consumers' usage of shared data” — Snowflake, <https://www.snowflake.com/en/legal/data-sharing-rebate-program/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The rebate schedule is a Snowflake programme term. Snowflake's FY2026 10-K and Q2 FY2027 10-Q (sec.gov) contain no mention of a data sharing rebate. Partner or consultant restatements could not be looked for: no search available.
  - verifier (scope): **quote_incomplete** — The quote shows the 10%-50% range only. The base and the cap are in other words on the page: 'percentage of the Snowflake Credits consumed by your consumers and attributed to their Qualifying Jobs' and 'rebates are always capped at the level of consumption of a given Snowflake ORG, per month'. 'Pays' overstates: the rebate shows as a 'Collaboration Rebate line item' on the provider's billing usage statement, i.e. a credit against its Snowflake bill, and no cash payout is stated. The programme covers any data sharing between two organisations, not only Marketplace listings. The page carries no date.
- **c070** Snowflake's disbursement report shows pre-tax fees owed to Snowflake by the provider, subtracted from the gross amount; no fee rate is given.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Pre-tax fees, owed to Snowflake by the provider. Snowflake subtracts the fees from the gross amount.” — Snowflake, <https://docs.snowflake.com/en/collaboration/views/marketplace-disbursement-report-ds> · docs · retrieved 2026-10-01 · quote check: exact

### licence

- **c003** Except where Snowflake is itself the Provider, Snowflake is not a party to the Listing Terms between Provider and Consumer.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “except where Snowflake is the applicable Provider, Snowflake (a) is not a party to any such Listing Terms” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Contract-structure clause in Snowflake's own terms. No search available for law-firm commentary.
  - verifier (scope): **scope_ok** — Section 3.3 Listing Terms; quote matches the statement.
- **c004** A Consumer must enter into Listing Terms with the relevant Provider before executing any Transaction.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Prior to executing any Transaction, Customer shall enter into Listing Terms with the relevant Provider” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c005** Unless the Provider's Listing Terms expressly allow it, a Consumer may not resell or sublicense a Product or transfer it outside the Snowflake Service.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “(c) resell or sublicense the Product, (d) transfer the Product outside the Service without specific authorization to do so” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c006** The Provider warrants that it has all rights and permissions needed to license and sell its Provider Materials to Snowflake and Consumers.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “has all necessary rights and permissions to license and, if applicable, sell its Provider Materials to Snowflake” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** Snowflake has no obligation to monitor or limit Consumers' use of Provider Materials.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Snowflake is under no obligation to monitor or otherwise limit Consumers' use of any Provider Materials” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** Snowflake publishes a Standard Agreement for Marketplace Products, last updated 17 November 2023, which a provider can offer its product subject to.  
  _terms · legal_text · as of 2023-11-17 (page_dated) · scope: Snowflake Marketplace_
  - “Provider's offering of the Product on the Marketplace subject to this Agreement” — Snowflake, <https://www.snowflake.com/marketplace/standard-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c027** The Standard Agreement grants the consumer a non-exclusive, non-transferable, revocable, worldwide, royalty-free licence to access and use the Product.  
  _terms · legal_text · as of 2023-11-17 (page_dated) · scope: Snowflake Marketplace_
  - “non-exclusive, non-transferable, revocable (as described herein), worldwide, and royalty-free license to access, use, deploy” — Snowflake, <https://www.snowflake.com/marketplace/standard-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** Under the Standard Agreement, Snowflake is not a party and has no liability or obligations (except when Snowflake is the Consumer).  
  _terms · legal_text · as of 2023-11-17 (page_dated) · scope: Snowflake Marketplace_
  - “Snowflake is not a party to this Agreement and will not have any liability or obligations hereunder” — Snowflake, <https://www.snowflake.com/marketplace/standard-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c058** A provider can attach its own listing terms by URL, which must be publicly accessible without authentication, instead of the Standard Agreement.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Provide a URL to your own listing terms. Must be publicly accessible and not require authentication to access.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing-configuration rule in Snowflake's own docs. No search available.
  - verifier (scope): **scope_ok** — Quote matches the listing-reference Terms of Service field. The third option, offline terms, is 'Available for private listings only' (c059).
- **c059** For private listings only, a provider can choose to provide the listing terms to consumers offline rather than at a URL.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Listing terms will be provided offline: Available for private listings only.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** The Provider must defend Snowflake against third-party claims arising from its Provider Materials; the Terms give no Provider indemnity to Consumers.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “defend Snowflake against any claim by a third party arising from or relating to any of Customer's Provider Materials” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c072** Each party's aggregate liability to the other under the Provider and Consumer Terms is capped at USD 50,000, outside excluded claims.  
  _number · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_ · **50000 USD aggregate liability cap** (each party's total liability to the other under the Provider and Consumer Terms (Snowflake vs Customer); excludes payment and indemnity obligations; aggregate, all claims)
  - “for all claims in the aggregate (for damages or liability of any type) in connection with these Terms exceed $50,000 (USD)” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in Snowflake's own Provider and Consumer Terms; no independent source exists by nature. Checked against the live terms in the scope step.
  - verifier (scope): **scope_ok** — Section 10.2 of the Terms (last updated 31 Mar 2026): 'either party's or its Affiliates' total liability ... exceed $50,000 (USD)', except Excluded Claims (payment, express indemnity, and liability that cannot be limited by law). The parties are Snowflake and the Customer (acting as Provider or Consumer), not Provider and Consumer against each other, as the value basis correctly says.
- **c073** Snowflake requires Providers' Listing Terms to state that the agreement is solely between Provider and Consumer, not Snowflake.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “the agreement is solely between Customer and the Consumer, and not Snowflake (except where Snowflake is the Consumer)” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### custody

- **c025** Snowflake's docs describe Marketplace sharing as live datasets shared without creating copies of the data.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Share live datasets securely and in real-time without creating copies of the data” — Snowflake, <https://docs.snowflake.com/collaboration/collaboration-marketplace-about> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Different domain and source class (a filing), though still Snowflake's own words. The filing qualifies the claim: sharing is 'generally' copy-free, and the next sentence says that across regions and public clouds the platform lets customers 'easily replicate data'. Cross-region Marketplace fulfilment therefore involves a replica, so 'without creating copies' holds for same-region sharing only. The 10-K also calls Marketplace data 'live, ready-to-query third-party data sets'.
    - “generally without copying or moving the underlying data” — Snowflake Inc. (SEC Form 10-K, fiscal year ended 31 Jan 2026), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The quote is under 'What can I do in the Snowflake Marketplace?' (provider capabilities), so it applies to Marketplace. The statement is correctly framed as what the docs say. For custody, the 10-K's 'generally' and the cross-region replication (c030/c032) limit it to same-region sharing.
- **c030** With Cross-Cloud Auto-Fulfillment, Snowflake automatically fulfils a provider's data product to the consumer regions where it is needed.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Snowflake automatically fulfills your data product to consumer regions as needed.” — Snowflake, <https://docs.snowflake.com/collaboration/provider-listings-auto-fulfillment> · docs · retrieved 2026-10-01 · quote check: exact
- **c031** A provider incurs additional costs when it makes a data product available in other regions.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “When you make a data product available in other regions, you incur additional costs.” — Snowflake, <https://docs.snowflake.com/collaboration/provider-listings-auto-fulfillment> · docs · retrieved 2026-10-01 · quote check: exact
- **c032** An auto-fulfilled data product is transferred to a Snowflake-managed secure share area (SSA) in the remote region, not into the consumer's account.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “When your data product is auto-fulfilled to a new region for the first time, it's transferred to an SSA in that region.” — Snowflake, <https://docs.snowflake.com/collaboration/provider-listings-auto-fulfillment> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c007** Where Provider Materials include personal data, the Provider warrants lawful collection, giving obtaining any required consents as an example; no consent evidence is delivered to the Consumer under the Terms.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “maintains the Personal Data in accordance with such laws (e.g., obtaining any required consents)” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Warranty clause in Snowflake's own terms, plus an absence (no consent evidence delivered) that can only be read off the same terms. No search available for commentary.
  - verifier (scope): **scope_ok** — Section 4.12 (Personal Data Provided by Provider). The warranty is given by the Customer-as-Provider to Snowflake under these Terms, not directly to the Consumer. No clause on this page requires consent records to be delivered or allows consent audits, so the absence is correctly recorded in the statement.
- **c008** A Provider may not reveal Sensitive Personal Data to Consumers in any Provider Materials offered publicly on the Marketplace.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “disclose or reveal Sensitive Personal Data to Consumers in any Provider Materials offered publicly via the Marketplace” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** Snowflake has no duty to review, accept or deny, or monitor Provider Materials listed on the Marketplace.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “has no duty or obligation to review, accept or deny, monitor, or otherwise control any Provider Materials” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** Every listing on Snowflake Marketplace must go through Snowflake's review and approval process.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Every listing in the Snowflake Marketplace must go through the review and approval process.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-creating-publishing> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** A provider's profile must be approved before it can offer paid or Marketplace listings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Your provider profile must be approved before you can offer paid listings or marketplace listings.” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-becoming> · docs · retrieved 2026-10-01 · quote check: exact
- **c069** To get listings a consumer account needs the CREATE DATABASE and IMPORT SHARE privileges, plus a purchase privilege for paid listings.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “the CREATE DATABASE and IMPORT SHARE privileges” — Snowflake, <https://docs.snowflake.com/en/collaboration/consumer-becoming> · docs · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c011** When a Provider retires a Product, it must let existing Consumers keep accessing and using it for the period set by the Listing Retirement requirements.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Customer will allow Consumers who are accessing or using Customer's Product(s) to continue to access and use such Product(s)” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** Consumers are told to contact the provider first, using the support email on the listing, for listing-specific issues including refund requests.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “always contact the provider first using the support email listed on the Snowflake Marketplace listing” — Snowflake, <https://docs.snowflake.com/collaboration/consumer-listings-paying> · docs · retrieved 2026-10-01 · quote check: exact
- **c029** Under the Standard Agreement, the consumer's right to use a Product ends on termination or expiry and access may be disabled; no deletion clause was found.  
  _terms · legal_text · as of 2023-11-17 (page_dated) · scope: Snowflake Marketplace_
  - “Consumer's right to use the associated Product will terminate, and Consumer's access to such Product may be disabled” — Snowflake, <https://www.snowflake.com/marketplace/standard-agreement/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c033** When a provider unpublishes a listing, existing consumers continue to have access to it.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “existing consumers will continue to have access to the listing” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-removing> · docs · retrieved 2026-10-01 · quote check: exact
- **c034** When a free or trial listing is deleted, existing consumers keep access for exactly 30 days from the date of deletion.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_ · **30 days of continued consumer access** (free and trial listings, after provider deletes the listing; one-off)
  - “exactly 30 days from the date of deletion” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-removing> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A post-deletion access window is a rule in Snowflake's own docs/terms. Without search no partner restatement could be found; none attempted beyond EDGAR full-text (no hit).
  - verifier (scope): **quote_incomplete** — Fact is right, but the quote shows neither the listing types nor that consumers keep access. Words that would: 'The retirement window for free and limited trial listings is exactly 30 days from the date of deletion', plus 'consumers still retain access to the listing' (same page). Applies to deletion, not unpublishing.
- **c035** For paid listings, the post-removal access window is one full calendar month regardless of the number of days.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_ · **1 calendar month of continued consumer access** (paid listings, after provider removes the listing; one-off)
  - “one full calendar month, regardless of the number of days” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-removing> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Snowflake's own rule for paid listings; exists only in its docs/terms. No search available.
  - verifier (scope): **scope_wrong** — The page says the paid-listing retirement window 'always contains one full calendar month', not that it is one month. Its worked examples: deleted 1 March, removal effective 1 April; deleted 2 March, the window runs 'until the first and last day of a complete month pass' and removal is effective 1 May. So access runs from one month to just under two months, depending on the deletion date. Separately, advance-payment listings can be unpublished immediately but existing subscription terms must be honoured. See missed v003.
- **c036** Providers may unpublish advance-payment listings immediately but must fulfil all existing consumer subscription terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “Providers can unpublish advance payment listings from the Snowflake Marketplace immediately, but they must fulfill all” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-removing> · docs · retrieved 2026-10-01 · quote check: exact
- **c074** The Provider alone must handle Consumer inquiries, complaints and claims about its materials, including those on quality, errors or refunds.  
  _terms · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “including those related to quality, content, errors, or refunds, relating to its Provider Materials” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** The Snowflake Provider and Consumer Terms, which govern Snowflake Marketplace, were last updated on 31 March 2026.  
  _event · legal_text · as of 2026-03-31 (page_dated) · scope: Snowflake Marketplace_
  - “Last Updated: March 31, 2026” — Snowflake, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c051** Snowflake's tiered rebate structure for the Data Sharing Rebate Program started on 1 May 2025.  
  _event · legal_text · as of 2025-05-01 (page_dated) · scope: Snowflake Marketplace_
  - “Starting May 1, 2025, Snowflake will calculate rebates based on a new, higher paying tiered rebate structure” — Snowflake, <https://www.snowflake.com/en/legal/data-sharing-rebate-program/> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** Snowflake Marketplace was operating on 30 September 2026, when Snowflake announced LSEG's financial data, analytics and index products on it.  
  _status · vendor_stated · as of 2026-09-30 (publication) · scope: Snowflake Marketplace_
  - “Explore LSEG's trusted financial data, analytics, and index products on Snowflake Marketplace” — Snowflake, <https://www.snowflake.com/en/news/press-releases/lseg-snowflake-expand-collaboration/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Operation on 30 Sep 2026 is confirmed by the counterparty's own copy of the release on lseg.com (found via lseg.com sitemap; LSEG is a customer/partner, not Snowflake). Separately, Snowflake's 10-Q filed 2026-09-04 (sec.gov, accession 0001640147-26-000037) carries 'Accrued customer liabilities related to Snowflake Marketplace' at 31 Jul 2026, so the marketplace was trading then. The detail 'financial data, analytics and index products on it' appears only in Snowflake's version of the release (an 'Explore ... on Snowflake Marketplace' link line); LSEG's version does not mention index products or say which products are listed. No search available.
    - “reporting and Snowflake Marketplace services” — LSEG, <https://www.lseg.com/en/media-centre/press-releases/2026/lseg-snowflake-collaboration-financial-data-ai-workflows> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote is real (an 'Explore ... on Snowflake Marketplace' link line in Snowflake's 30 Sep 2026 release) and is enough for current operation. 'Announced LSEG's ... products on it' overreads it slightly: the announcement is the expanded collaboration, and the product line is a call-to-action, not news of a new listing. LSEG's own copy of the release does not have this line.
- **c055** In late September 2026 Snowflake Inc. priced an upsized USD 3.75 billion private placement of 0.00% convertible senior notes, including USD 1.75 billion due 2031.  
  _event · vendor_stated · as of 2026-09 (publication) · scope: Snowflake Inc. (parent company)_
  - “$1.75 billion aggregate principal amount of its 0.00% Convertible Senior Notes due 2031” — Snowflake, <https://www.snowflake.com/en/news/press-releases/snowflake-prices-upsized-private-placement-3-75-billion-convertible-senior-notes/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c052** Snowflake says the Marketplace connects buyers to over 820 providers offering more than 3,400 live listings, as of 31 July 2025.  
  _outcome · vendor_stated · as of 2025-07-31 (page_dated) · scope: Snowflake Marketplace_
  - “Snowflake Marketplace connects you to over 820 providers, offering more than 3,400” — Snowflake, <https://www.snowflake.com/en/data-cloud/marketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — An independent count of providers and listings would need a third-party crawl, analyst report or filing. Snowflake's EDGAR filings stopped stating Marketplace listing counts after 2023 (EDGAR full-text hits for 'Marketplace listings' end with the Oct 2023 10-Q); the FY2026 10-K says only 'hundreds of live, ready-to-query third-party data sets'. No search available to find press or analyst counts.
  - verifier (scope): **quote_incomplete** — Quote is cut at '3,400' and does not show the date or what the 3,400 are. The page goes on 'live, AI-ready data, agents and integrated SaaS solutions' with a footnote 'As of July 31, 2025'. So the count includes agents and SaaS apps, not only datasets; 'live listings' is acceptable only if read that way. The figure is now 14 months old as of retrieval.
- **c056** Snowflake's FY2026 10-K tells customers they can use public and commercially available Marketplace data sets to enrich analysis and train AI models.  
  _offer · filing · as of 2026-03-20 (publication) · scope: Snowflake Marketplace_
  - “Leverage public and commercially available data sets on the Snowflake Marketplace to enrich insights” — Snowflake Inc. (SEC Form 10-K), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### regulation

- **c022** Paid listings are available only to organisations whose billing address is in a supported country; India is on the supported list as retrieved.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “can access paid listings only if the billing address registered to the account is in a supported country” — Snowflake, <https://docs.snowflake.com/collaboration/consumer-listings-paying> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** Only providers whose account billing address is in one of a listed set of countries can create paid listings; India was not on that list as retrieved.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace_
  - “As a provider, you can create paid listings if the billing address on your account is in one of the” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-becoming> · docs · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Snowflake's 10-Q reports USD 162.2 million of accrued customer liabilities at 31 July 2026 for customer capacity commitments it expects to be spent on third-party products and services on Snowflake Marketplace.  
  _number · filing · as of 2026-07-31 (publication) · scope: Snowflake Marketplace (third-party products bought with committed capacity), global_ · **162.196 USD million** (Snowflake balance-sheet accrual: estimated portion of contractual customer commitments expected to be used on third-party Marketplace purchases; not GMV and not provider revenue; point in time, 31 Jul 2026)
  - “Accrued customer liabilities related to Snowflake Marketplace (1) 162,196 122,893” — Snowflake Inc. (SEC Form 10-Q, quarter ended 31 Jul 2026), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000037/snow-20260731.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “customer commitments expected to be utilized towards the purchases of third-party products and services” — Snowflake Inc. (SEC Form 10-Q, quarter ended 31 Jul 2026), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000037/snow-20260731.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** Snowflake's FY2026 10-K shows accrued customer liabilities related to Snowflake Marketplace rising from USD 21.5 million at 31 January 2025 to USD 122.9 million at 31 January 2026.  
  _number · filing · as of 2026-01-31 (publication) · scope: Snowflake Marketplace (third-party products bought with committed capacity), global_ · **122.893 USD million** (Snowflake balance-sheet accrual for customer commitments expected to be spent on third-party Marketplace purchases; prior-year comparative 21.489; not GMV; point in time, 31 Jan 2026)
  - “Accrued customer liabilities related to Snowflake Marketplace (1) 122,893 21,489” — Snowflake Inc. (SEC Form 10-K, fiscal year ended 31 Jan 2026), <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v003** For a paid listing deleted after the first day of a month, consumers keep access until a complete calendar month has passed, so a listing deleted on 2 March is removed only on 1 May.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Snowflake Marketplace paid listings_
  - “the retirement window continues until the first and last day of a complete month pass” — Snowflake, <https://docs.snowflake.com/en/collaboration/provider-listings-removing> · docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.public_prices` — js_empty; tried <https://app.snowflake.com/marketplace>, <https://app.snowflake.com/marketplace/providers/GZ1M6ZEU47J/LSEG?search=lseg>
- `matrix.public_listing` — js_empty; tried <https://app.snowflake.com/marketplace>, <https://docs.snowflake.com/en/collaboration/consumer-becoming>, <https://docs.snowflake.com/en/collaboration/consumer-listings-access>
- `matrix.exclusivity_offered` — not_published; tried <https://www.snowflake.com/marketplace/standard-agreement/>, <https://docs.snowflake.com/en/collaboration/provider-listings-reference>
- `matrix.erasure_after_sale` — not_published; tried <https://www.snowflake.com/marketplace/standard-agreement/>, <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/>
- `other.monetization_fee_rate` — not_published; tried <https://www.snowflake.com/en/legal/optional-offerings/offering-specific-terms/snowflake-marketplace/provider-and-consumer-terms/>, <https://docs.snowflake.com/collaboration/provider-listings-pricing-model>, <https://docs.snowflake.com/en/collaboration/provider-becoming>, <https://docs.snowflake.com/en/collaboration/provider-monetization-usage>, <https://docs.snowflake.com/en/collaboration/views/marketplace-disbursement-report-ds>
- `other.listing_pages` — js_empty; tried <https://app.snowflake.com/marketplace>, <https://app.snowflake.com/marketplace/providers/GZ1M6ZEU47J/LSEG?search=lseg>
- `other.traction_filing` — not_found; tried <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000037/snow-20260731.htm>, <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm>
- `questions.Q1` — not_published; tried <https://www.snowflake.com/en/data-cloud/marketplace/>, <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm>
- `other.independent_press` — blocked

## Conflicts

- c025, c032: Docs say Marketplace shares are made 'without creating copies', while auto-fulfilment transfers the data product to a Snowflake-managed secure share area in each remote region. Both hold at different scopes: no copy lands in the consumer's account, but cross-region delivery is a replica. (unresolved)
- c022, c044: Not a contradiction but an asymmetry worth flagging: India is on the consumer paid-listing country list but not on the provider paid-listing list as retrieved. (unresolved)

## Leads, not cited

- <https://www.snowflake.com/content/dam/snowflake-site/legal/legal-files/Snowflake-Data-Sharing-Rebate-Credit-Terms-And-Conditions.pdf> — Full rebate terms (tiers, caps, eligibility); not read in this run.
- <https://www.sec.gov/Archives/edgar/data/1640147/000164014726000037/snow-20260731.htm> — Q2 FY2027 10-Q matched 'Snowflake Marketplace' in EDGAR full-text search, but the fetcher truncated before MD&A.
- <https://docs.snowflake.com/en/collaboration/policies-guidelines-enforcement> — Listing review policies and enforcement; not fetched.
- <https://docs.snowflake.com/en/collaboration/views/marketplace-disbursement-report-org> — Organisation-level disbursement view; may carry fee detail.
