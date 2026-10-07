# Bee Maps

crowd_capture · light · status: **active** · also known as Hivemapper, Hivemapper, Inc.

> Rendered from `ledger/bee-maps.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Data APIs (consumption-based: Street Level Imagery, AI Event Videos, Road Detections)” and its bespoke side “Burst (on-demand mapping); also Bee Edge AI for custom workloads on network devices”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c023, c052, c062 | Bee Maps sells its own data under its own name; its ToS makes it owner of data collected from Bees. No separate buyer licence document was found. |
| economics_model | principal_margin | c023, c005, c006, c004 | Bee Maps owns the data and sells at its own list prices; contributor rewards are funded by Bee Maps at its discretion, not a share of each sale. |
| who_pays_fee | not_applicable |  | No marketplace fee: Bee Maps is the only seller and sells its own data at list price. |
| supply_models | contributor_uploads | c024, c023, c066, c067, c026 | Crowd drivers and fleets running Bee dashcams. Beekeeper fleet customers' data is also owned by Bee Maps (sale limited to aggregated or anonymized data). Whether Burst captures ordered by one buyer are resold to others is not stated. |
| custody_model | copy_to_buyer | c047, c048 | Platform-hosted; buyers receive temporary signed URLs and download the files. |
| transaction_mode | both | c015, c016, c018, c068, c014 | Self-serve prepaid API balance for all data APIs; a contact form for training-data and other needs. |
| public_prices | all | c005, c006, c007, c008, c011 | Every data API and Burst has a published unit price; no price is published for whatever is agreed through the contact form. |
| licence_model | unknown |  | Only marketing statements (AI Event Videos licensed for commercial use incl. training; 'flexible licensing') were found; no buyer licence or data terms document. |
| exclusivity_offered | unknown |  | Nothing found either way for buyers. |
| public_listing | public_summary_gated_detail | c005, c051 | Products and prices are public; querying imagery, clips or detections needs an API key from an account. |
| buyer_vetting | account_only | c019, c018, c051 | An account and API key; no credit card needed to start with free credits. No business verification found. |
| sample_mechanics | free_sample_download | c018 | No separate sample set; new accounts get USD 20 in free credits usable on real data before paying. |
| versioning | unknown | c049 | Imagery is time-indexed (per week or latest) rather than versioned; no statement on versions or withdrawals. |
| human_subject_consent_docs | unknown | c058, c060 | Approach is automatic blurring of faces, bodies, vehicles and plates before upload plus removal requests; no buyer licence found to say whether any consent warranty or evidence is given. |
| contributor_pay_model | mixed | c039, c038, c004, c043 | Network terms pay Map Coverage Rewards for collecting and Consumption Rewards when paid demand is fulfilled; Burst adds targeted incentives; from August 2026 rewards are in USDC funded by Bee Maps at its discretion. Rates not published. |
| catalogue_plus_custom | both | c069, c042, c046 |  |
| erasure_after_sale | unknown | c060 | Removal and blurring requests exist, but nothing says whether copies already downloaded by buyers must be deleted. |
| quality_evidence | unknown |  | Bee Maps is operator and sole provider, so the operator/provider distinction does not fit; no quality statement on listings was found beyond vendor claims about freshness. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Bee Maps sells per image (USD 0.005) and per event clip (USD 6) and names world-model and AV training as uses; it says enterprise customers include HERE, Lyft, NBC Universal, Mapbox and Volkswagen (vendor-stated). Volumes bought are not published. | c005, c006, c056, c063, c062 |
| Q2 | unknown |  |  |
| Q3 | sourced | Inventory comes from crowd drivers and fleets running Bee dashcams; Bee Maps' ToS says it owns data collected from Bees and from Beekeeper fleets, while the May 2026 Hivemapper network terms say contributors keep ownership and license each developer whose Work Order is fulfilled. | c023, c024, c026, c035, c036, c037, c066 |
| Q4 | partial | Burst lets one buyer pay to have drivers capture an area, but nothing says whether that imagery is then sold to others. Terms moved: ToS updated Q4 2025, network terms May 2026, and HONEY rewards replaced by Bee-Maps-funded USDC from August 2026. | c042, c022, c034, c002, c003 |
| Q5 | partial | Bee Maps sells as owner and licensor of the data under its own name; no buyer licence was found, so who warrants consent and who indemnifies the buyer is unknown. | c023, c029, c052 |
| Q6 | sourced | Platform-hosted; buyers query the API and receive temporary signed URLs to download images and clips into their own systems. | c047, c048, c016 |
| Q7 | partial | Capturers: covered by Bee Maps ToS ownership and the network licence to developers; Beekeeper data is not anonymized as to drivers. Depicted people and property: automatic on-device blurring plus blur/delete on request; no release evidence found. | c023, c036, c028, c058, c059, c060, c041 |
| Q8 | partial | Bee Maps says AI Event Videos are licensed for commercial use including training and derivatives, and imagery allows derived datasets; exclusivity, audit, leakage controls and fingerprinting are not addressed in anything found. | c052, c053 |
| Q9 | sourced | Self-serve: a prepaid USD API balance, debited per call at list price, with no subscription or minimum; a contact form handles training-data and other requests. Bee Maps owns the inventory, so there is no commission. | c015, c016, c017, c020, c013, c068 |
| Q10 | partial | The unit sold is an image, an event clip, a batch of detections or a Burst location, each debited per API call; imagery is indexed by week or latest, and a history endpoint logs credit use. Nothing on versions or withdrawals. | c049, c050, c054, c045, c016 |
| Q11 | partial | Before paying, a buyer gets USD 20 of free credits on an account with no card; trust signals are vendor claims of coverage and freshness, not independent evidence. | c018, c019, c057, c064, c065 |
| Q12 | sourced | The catalogue side is the consumption-priced 'Data APIs'; the bespoke side is 'Burst (on-demand mapping)', which pushes paid capture requests to nearby drivers through the same API and balance, plus Bee Edge AI for custom workloads on network devices. | c069, c008, c042, c043, c046, c011 |

## Claims

### positioning

- **c057** Bee Maps claims its data is days to weeks old rather than months or years.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Days to weeks old, not months/years like traditional providers” — Bee Maps, <https://beemaps.com/docs/platform/road-intelligence-api> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** Bee Maps' privacy policy says it builds Physical AI Data Products that businesses can consume.  
  _offer · legal_text · as of 2026 (page_dated)_
  - “We build Physical AI Data Products that businesses can consume.” — Bee Maps, <https://beemaps.com/privacy/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### supply

- **c023** For Bee devices outside Beekeeper, Bee Maps owns the data it collects from the Bee, with the right to use, license, distribute or sell it.  
  _terms · legal_text · as of 2025 (page_dated)_
  - “owns the data it collects from the Bee in this capacity, including the right to use, license, distribute, or sell that data” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of the vendor's own terms of service.
  - verifier (scope): **quote_incomplete** — The statement is right, but the quote ('in this capacity') does not show the Beekeeper condition. The words that do: 'If you own or operate a Bee device and have not opted into Beekeeper, Hivemapper, Inc.' The ToS is dated Q4 2025.
- **c024** Under the Bee Maps ToS, Bee Maps leases access to the owner's Bee sensing device and collects data from it.  
  _terms · legal_text · as of 2025 (page_dated)_
  - “leases access to your Bee sensing device and collects data from it” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of the vendor's own terms of service.
  - verifier (scope): **scope_wrong** — The clause is conditional, and the statement drops the condition. It applies only to owners who 'have not opted into Beekeeper', and Bee Maps acts 'as a developer on the Hivemapper Network'. The ToS (Q4 2025) predates the July 2026 termination of Bee Maps' services agreement with the Hivemapper Foundation, so this network-developer framing may be stale.
- **c025** The data Bee Maps collects from a Bee includes privacy-blurred imagery, video, GPS and related sensor data.  
  _terms · legal_text · as of 2025 (page_dated)_
  - “including privacy-blurred imagery, video, GPS data, and related sensor data” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c026** For fleets using Beekeeper, Bee Maps owns all data generated through their use of Beekeeper.  
  _terms · legal_text · as of 2025 (page_dated) · scope: Beekeeper fleet services_
  - “Hivemapper, Inc. (dba Bee Maps) owns all data generated through your use of Beekeeper” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c035** The Hivemapper network terms say Hivemapper does not own and claims no rights in Contributor Data.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “Hivemapper does not own and does not claim rights in Contributor Data.” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** On the Hivemapper network, developers post Work Orders specifying the coverage and workloads they want executed.  
  _architecture · legal_text · as of 2026-05-05 (page_dated)_
  - “Developers post Work Orders specifying geographic coverage and the workloads they wish to have executed.” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c066** Bee Maps says it has contributors across 100+ countries.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **100 countries with contributors (lower bound)** (vendor-stated; as of retrieval)
  - “Contributors across 100+ countries.” — Bee Maps, <https://beemaps.com/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c067** Bee Maps says its coverage comes from thousands of fleet dashcams mapping the roads they drive every day.  
  _offer · vendor_stated · as of 2026-02-12 (page_dated)_
  - “thousands of fleet dashcams mapping every road they drive, every day, automatically” — Bee Maps, <https://beemaps.com/blog/how-bee-maps-gets-its-coverage> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c049** The imagery API can query street-level imagery for a specific week within a polygon, as well as the most recent imagery.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Query street-level imagery for a specific week within a polygon” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c050** The API exposes a buyer's query history with credit consumption details.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Retrieve your API query history with credit consumption details” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c054** AI Event Video clips are about 20-30 seconds of MP4 footage captured around the event.  
  _offer · vendor_stated · as of 2026-03-12 (page_dated) · scope: AI Event Videos_
  - “~20-30 seconds of MP4 footage captured around the event” — Bee Maps, <https://beemaps.com/blog/deep-dive-ai-event-video-data> · eng_blog · retrieved 2026-10-01 · quote check: exact

### discovery

- **c055** AI Event Video search filters on event type, date range, device ID and geographic polygon, combinable.  
  _architecture · vendor_stated · as of 2026-03-12 (page_dated) · scope: AI Event Videos_
  - “event type, date range, device ID, and geographic polygon can all be used together” — Bee Maps, <https://beemaps.com/blog/deep-dive-ai-event-video-data> · eng_blog · retrieved 2026-10-01 · quote check: exact

### trust

- **c018** Bee Maps says every new account starts with USD 20 in free API credits.  
  _number · vendor_stated · as of 2026-03-06 (page_dated)_ · **20 USD free API credit** (granted by Bee Maps to each new buyer account, usable on data APIs; one-off)
  - “Every new Bee Maps account starts with $20 in free API credits” — Bee Maps, <https://beemaps.com/blog/api-billing-and-free-credits> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A sign-up offer that exists only in the vendor's own billing terms and blog.
  - verifier (scope): **scope_ok** — Blog dated 6 March 2026. It also says no credit card is required and gives no expiry date.

### transaction

- **c014** The Bee Maps pricing page carries a 'Contact Us' button alongside 'Get Started'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Contact Us” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c015** Bee Maps' data API usage is paid from a prepaid API balance.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your API balance is a prepaid account used to pay for consumption-based data API usage” — Bee Maps, <https://beemaps.com/docs/platform/billing-and-payment> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's own billing mechanics.
  - verifier (scope): **scope_ok** — The same page says Bee Membership, fleet software subscriptions and Bee Edge AI device services are paid by card on file, not from the API balance, so the claim holds for data APIs only, as worded.
- **c016** Bee Maps deducts each API call from the buyer's balance automatically.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “API calls are deducted from your balance automatically.” — Bee Maps, <https://beemaps.com/docs/platform/billing-and-payment> · docs · retrieved 2026-10-01 · quote check: exact
- **c017** A Bee Maps buyer can top up the API balance by a custom amount between USD 5 and USD 1,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **1000 USD maximum custom top-up** (buyer-paid prepaid top-up; custom amount range USD 5 to 1,000; presets USD 10, 25, 50, 100; per top-up)
  - “or enter a custom amount between $5 and $1,000” — Bee Maps, <https://beemaps.com/docs/platform/billing-and-payment> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** Bee Maps' contact page invites buyers who need training data to talk to its team.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Tell us if you need training data, APIs, Bee cameras, or fleet deployment help.” — Bee Maps, <https://beemaps.com/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### pricing

- **c005** Bee Maps lists Street Level Imagery at USD 0.005 per image.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Street Level Imagery_ · **0.005 USD per image** (buyer pays list price, consumption-based, deducted from prepaid API balance; per unit)
  - “Street Level Imagery$0.005/ image” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A list price set on the vendor's own pricing page. One check: AWS Marketplace search for 'hivemapper' shows no listing that could relay the price.
  - verifier (scope): **scope_ok** — Live /pricing reads 'Street Level Imagery' '$0.005/ image'. The page shows no tiers or regional variation. The basis 'deducted from prepaid API balance' is supported by the billing docs, not by this quote.
- **c006** Bee Maps lists AI Event Videos at USD 6 per video clip.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Event Videos_ · **6 USD per video** (buyer pays list price, consumption-based, deducted from prepaid API balance; per unit)
  - “AI Event Videos$6/ video” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A list price on the vendor's own pricing page; no third-party marketplace listing found (AWS Marketplace search empty).
  - verifier (scope): **scope_ok** — The page says '$6/ video'; 'clip' is wording from the API reference ('event video clip') and changes nothing.
- **c007** Bee Maps lists Road Detections at USD 3 per 1,000 detections.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Road Detections_ · **3 USD per 1,000 detections** (buyer pays list price, consumption-based; per unit)
  - “Road Detections$3/ 1K detections” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c008** Bee Maps lists Burst on-demand mapping at USD 1 per location requested.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Burst_ · **1 USD per location** (buyer pays per location requested for on-demand capture; delivery depends on drivers; per request)
  - “Burst (on-demand mapping)$1/ location” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A list price on the vendor's own pricing page; no third-party marketplace listing found (AWS Marketplace search empty).
  - verifier (scope): **scope_ok** — The page says '$1/ location'. The pricing page does not say whether the charge applies when a request goes unfulfilled, so 'per location requested' is the profiler's reading.
- **c009** Bee Edge AI on the customer's own devices is listed at USD 15 per device per month including 1 GB.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bee Edge AI, Own Devices_ · **15 USD per device per month** (customer pays to run its own ML workloads on its own Bee devices; includes 1 GB; per month)
  - “Own Devices$15 / device / moincludes 1GB” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact_nospace
- **c010** Bee Edge AI on own devices charges USD 3 per GB above the included 1 GB.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bee Edge AI, Own Devices_ · **3 USD per GB** (overage above the included 1 GB per device, Own Devices scenario; per unit)
  - “$3 / GB” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c011** Bee Edge AI on network devices is listed at USD 0.02 per km, including 5 MB per km.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bee Edge AI, Network Devices_ · **0.02 USD per km** (customer pays per km driven by network (contributor) devices running its workload; includes 5 MB/km; per unit)
  - “Network Devices$0.02 / kmincludes 5MB/km” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact_nospace
- **c012** Bee Edge AI on network devices charges USD 0.05 per 10 MB above the included allowance.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Bee Edge AI, Network Devices_ · **0.05 USD per 10 MB** (overage above 5 MB/km, Network Devices scenario; per unit)
  - “$0.05 / 10MB” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c013** Bee Maps' data API pricing has no upfront commitment.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “No upfront commitments.” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c020** Bee Maps' pay-as-you-go data API billing has no subscriptions or monthly minimums.  
  _terms · vendor_stated · as of 2026-03-06 (page_dated)_
  - “No subscriptions, no monthly minimums, no commitments” — Bee Maps, <https://beemaps.com/blog/api-billing-and-free-credits> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c022** The Bee Maps Terms of Service page is dated 'Last Updated: Q4 2025'.  
  _terms · legal_text · as of 2025 (page_dated)_
  - “Last Updated: Q4 2025” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c027** Bee Maps holds an exclusive licence to data generated through Beekeeper.  
  _terms · legal_text · as of 2025 (page_dated) · scope: Beekeeper fleet services_
  - “Hivemapper, Inc. (dba Bee Maps) holds an exclusive license to this data” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** Bee Maps reserves the right to sublicense, distribute or sell aggregated or anonymized Beekeeper data to third parties.  
  _terms · legal_text · as of 2025 (page_dated) · scope: Beekeeper fleet services_
  - “the right to sublicense, distribute, or sell aggregated or anonymized data to third parties” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** The Bee membership terms say Bee Maps may license, distribute and exploit Fleet Data, including to create and sell map data.  
  _terms · legal_text · as of 2025-10-06 (page_dated) · scope: Beekeeper fleet services_
  - “including but not limited to improving the Services, creating and selling map data and related products” — Bee Maps, <https://beemaps.com/tos/bee-membership> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** The Hivemapper network Terms of Service are dated 5 May 2026.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “Last Updated: May 5, 2026” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c036** Under the Hivemapper network terms a contributor grants each developer whose Work Order is fulfilled a perpetual, irrevocable, royalty-free licence to its data.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “you grant a worldwide, perpetual, irrevocable, royalty-free license to use, reproduce, process, distribute” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c052** Bee Maps says AI Event Videos are licensed for commercial use, including model training, fine-tuning, simulation and derivative products.  
  _terms · vendor_stated · as of 2026-03-12 (page_dated) · scope: AI Event Videos_
  - “AI Event Videos are licensed for commercial use, including model training, fine-tuning, simulation, and derivative products” — Bee Maps, <https://beemaps.com/blog/deep-dive-ai-event-video-data> · eng_blog · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's own licence statement for its product.
  - verifier (scope): **scope_ok** — Blog FAQ dated 12 March 2026. It is a blog statement, not the licence text; the governing licence terms were not quoted.
- **c053** Bee Maps' API docs advertise 'flexible licensing' allowing buyers to build derived datasets from imagery.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Street Level Imagery_
  - “Build derived datasets from imagery” — Bee Maps, <https://beemaps.com/docs/platform/road-intelligence-api> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c047** Bee Maps returns street-level images as temporary URLs that the buyer must download promptly.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Image URLs are temporary—download promptly” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — API behaviour documented only in the vendor's own API reference; no third-party integration doc found by navigation.
  - verifier (scope): **scope_ok** — The scope is right: the imagery /poly endpoint, with no expiry time given; AI Event Video URLs are also 'Temporary signed URL'. QUOTE DEFECT: the stored quote contains mojibake ('temporaryâ€”download'), which quotecheck rejects; it should read 'Image URLs are temporary—download promptly'.
- **c048** AI Event Video clips are delivered as a temporary signed URL to download the clip.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Temporary signed URL to download the event video clip” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c019** Bee Maps does not require a credit card to open an account with free credits.  
  _terms · vendor_stated · as of 2026-03-06 (page_dated)_
  - “No credit card required” — Bee Maps, <https://beemaps.com/blog/api-billing-and-free-credits> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Most Bee Maps API endpoints require authentication with an API key.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Most endpoints require authentication via API key” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c003** With the USDC switch Bee Maps said it will no longer support HONEY token rewards in the Bee App.  
  _event · vendor_stated · as of 2026-07-16 (page_dated)_
  - “we will no longer support HONEY token rewards” — Bee Maps, <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c004** Bee Maps says the USDC rewards are funded directly by Bee Maps and paid at its sole discretion.  
  _terms · vendor_stated · as of 2026-07-16 (page_dated)_
  - “USDC rewards are funded directly by Bee Maps and offered at our sole discretion” — Bee Maps, <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The vendor's own statement of how it funds its rewards; no counterparty document addresses it.
  - verifier (scope): **scope_ok**
- **c030** The Bee Maps ToS says rewards for operating a Bee on the Hivemapper Network are governed by the separate Hivemapper Mapping Network Terms.  
  _terms · legal_text · as of 2025 (page_dated)_
  - “including any rewards you may receive for participating, is also governed by the Hivemapper Mapping Network Terms of Service” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c032** Bee membership is priced at USD 19 per month per membership.  
  _number · legal_text · as of 2025-10-06 (page_dated) · scope: Bee membership_ · **19 USD per membership per month** (paid by the membership customer to Bee Maps; per Bee docs membership bundles device, Beekeeper software and LTE; not a data price; per month)
  - “Service Fees: $19 per month per membership” — Bee Maps, <https://beemaps.com/tos/bee-membership> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c033** Under the membership terms, a customer who does not connect a wallet receives no rewards and forfeits unclaimed rewards.  
  _terms · legal_text · as of 2025-10-06 (page_dated)_
  - “If Customer does not connect a wallet, no rewards will be issued” — Bee Maps, <https://beemaps.com/tos/bee-membership> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c038** Hivemapper network Consumption Rewards are distributed to contributors when paid developer demand against Work Orders is fulfilled.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “Consumption Rewards, distributed to Contributors when paid developer demand against Work Orders is fulfilled” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A rule of the Hivemapper network, which only the network's own governance texts state. Found on docs.hivemapper.com MIP-26 (Hivemapper Foundation, part of the profiled organisation's family of sites, so not independent): 'Rewards accrue when Map Credits are consumed and distribute weekly.' MIP-26 took effect on 4 May 2026 and sets the pool at 25% of Map Credits consumed, reminted as HONEY. The Foundation's 'Reward Types' page still describes the earlier MIP-15 model (25% of burned HONEY, capped at 500,000 HONEY a week).
  - verifier (scope): **scope_ok** — hivemapper.com/tos (Hivemapper, Inc., last updated 5 May 2026) is network terms in HONEY, not Bee Maps' app terms. It matches MIP-26, effective 4 May 2026. Since August 2026 the Bee App no longer pays HONEY, so it is unclear which contributors still receive these rewards.
- **c039** Hivemapper network Map Coverage Rewards are paid for collecting and submitting eligible data.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “Map Coverage Rewards, for collecting and submitting eligible data” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c040** The Hivemapper network terms do not guarantee that a contributor will earn any HONEY.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “Hivemapper does not guarantee that you will earn any HONEY.” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c044** Drivers within range of a Burst receive a push notification.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Drivers within range receive a push notification.” — Bee Maps, <https://beemaps.com/docs/platform/road-intelligence-api> · docs · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c060** Bee Maps offers to further blur or delete imagery an individual considers sensitive, such as a face, vehicle, plate or home, on request.  
  _terms · legal_text · as of 2026 (page_dated)_
  - “We can assist with further blurring or deleting of imagery an individual considers sensitive or their personal information” — Bee Maps, <https://beemaps.com/privacy/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c042** Bee Maps' Burst product lets a buyer request fresh imagery for specific locations, dispatching network devices in the area to capture it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Request fresh imagery for specific locations. Network devices in the area are dispatched to capture it.” — Bee Maps, <https://beemaps.com/api-products> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** Burst incentivizes drivers to map specific areas on demand, and a new burst goes live in the Bee App immediately.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Incentivize drivers to map specific areas on-demand. When you create a burst, it goes live in the Bee App immediately.” — Bee Maps, <https://beemaps.com/docs/platform/road-intelligence-api> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** The Burst API endpoint creates bursts that incentivize Hivemapper drivers to map specific locations.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Creates `bursts` that incentivize Hivemapper drivers to map specific locations.” — Bee Maps, <https://beemaps.com/docs/api-reference> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** Bee Edge AI lets a customer deploy custom Python ML workloads directly on Bee cameras.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Deploy custom Python ML workloads directly on Bee cameras.” — Bee Maps, <https://beemaps.com/api-products> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c069** Bee Maps' pricing page calls its catalogue side consumption-based pricing for Data APIs.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Consumption-based pricing for Data APIs.” — Bee Maps, <https://beemaps.com/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Bee Maps was operating in July 2026, when it published a change to how it rewards contributors.  
  _status · vendor_stated · as of 2026-07-16 (page_dated)_
  - “USDC will become the default rewards system” — Bee Maps, <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Apple's version history dates these release notes to Jul 27 (v10.12.10), with further Circle-wallet releases on Jul 9 and Jul 15 and a release one day before retrieval (v10.13.16), so the app was being shipped in July 2026 and is still shipped in late September 2026. The dates are Apple's metadata; the release-note wording is the vendor's. WebSearch was not available, so no independent press on the July 2026 change could be found.
    - “Email Sign In Enable USDC wallet to Beekeeper users” — Apple (App Store listing; seller Hivemapper Inc.), <https://apps.apple.com/us/app/bee-maps-drive-earn-fun/id6740009613> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The post is dated 16 July 2026 and the quote states the rewards change.
- **c002** On 16 July 2026 Bee Maps announced that USDC rewards become the default for contributors in August 2026.  
  _event · vendor_stated · as of 2026-07-16 (page_dated)_
  - “USDC Rewards Become the Default in August 2026” — Bee Maps, <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. The only non-vendor-domain trace reached is Apple's App Store version history (Circle wallet added Jul 9, 'Email Sign In Enable USDC wallet to Beekeeper users' Jul 27), which fits the change but does not confirm a 16 July announcement or an August 2026 default. CoinDesk's Hivemapper tag page has nothing after January 2024; EDGAR full-text search for 'Bee Maps' returns 0 hits.
  - verifier (scope): **scope_wrong** — The post makes USDC the default 'in the Bee App' and limits it to 'most regions' ('We expect to offer USDC rewards in most regions.'), so 'the default for contributors' overstates it. The same post also ends HONEY rewards in the app and terminates the services agreement with the Hivemapper Foundation.
- **c021** Bee Maps added self-serve top-up of the API balance in USD from its billing page on 6 March 2026.  
  _event · vendor_stated · as of 2026-03-06 (page_dated)_
  - “Top up your account with a USD amount directly from the billing page” — Bee Maps, <https://beemaps.com/changelog> · docs · retrieved 2026-10-01 · quote check: exact

### demand

- **c056** Bee Maps describes AI Event Videos as clips of notable driving events for training autonomous driving and world models.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI Event Videos_
  - “Video clips of notable driving events for training autonomous driving models and world models.” — Bee Maps, <https://beemaps.com/docs/platform/road-intelligence-api> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** Bee Maps says its enterprise customers include HERE Technologies, Lyft, NBC Universal, Mapbox and Volkswagen.  
  _outcome · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Enterprise customers include HERE Technologies, Lyft, NBC Universal, Mapbox, Volkswagen” — Bee Maps, <https://beemaps.com/about> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No search available. Tried partner sites by navigation: Mapbox's data-sources page (mapbox.com/about/maps) lists no Hivemapper or Bee Maps source; the HERE press release linked from Bee Maps' HERE case study does not mention Bee Maps; Volkswagen's US media-site search returned an empty JS page; here.com search redirects to its consumer map. Lyft appears only in a social post quoted on hivemapper.com (affiliated, not independent). No partner or customer confirmation of any of the five names reached. The homepage logo wall also lists TomTom and Trimble.
  - verifier (scope): **scope_ok** — The /about sentence continues '…Volkswagen, and other leading mapping, automotive, and mobility companies.' The claim is correctly worded as vendor-stated.
- **c064** Bee Maps says 754 million total km have been mapped.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **754000000 km mapped (total)** (vendor-stated cumulative km driven by the network; not independently verified; cumulative)
  - “754MTotal KM Mapped” — Bee Maps, <https://beemaps.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **unverifiable** — No search available. The network's own coverage dashboard (hivemapper.com/coverage) renders placeholder zeros without JavaScript; no on-chain dashboard, filing or press figure reachable by navigation.
  - verifier (scope): **scope_ok** — The homepage shows 754M total km beside 22M unique km and 37% global road coverage; the claim correctly says total, which counts repeat drives.
- **c065** Bee Maps says it covers 37% of global roads.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only)_ · **37 percent of world roads** (vendor-stated coverage share; method not stated; cumulative)
  - “37%Global Road Coverage” — Bee Maps, <https://beemaps.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### regulation

- **c028** Beekeeper data is not anonymized with respect to the fleet's drivers.  
  _terms · legal_text · as of 2025 (page_dated) · scope: Beekeeper fleet services_
  - “data generated through your use of Beekeeper will not be anonymized with respect to your drivers” — Bee Maps, <https://beemaps.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c041** Hivemapper network contributors must operate their devices in compliance with privacy and data-protection law.  
  _terms · legal_text · as of 2026-05-05 (page_dated)_
  - “You operate your Device in compliance with applicable law, including privacy and data-protection law” — Hivemapper, <https://hivemapper.com/tos> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c058** Bee Maps' privacy policy says the device blurs faces and license plates on the edge before imagery is uploaded.  
  _architecture · legal_text · as of 2026 (page_dated)_
  - “Automatically blurs faces and license plates from the imagery on the edge” — Bee Maps, <https://beemaps.com/privacy/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The Hivemapper Foundation docs are a different domain and a separate entity, but affiliated with the vendor and pointing to 'Hivemapper Inc.'s Privacy Policy'; they repeat the vendor's technical statement rather than test it. They say 'on the edge'; 'before upload' is implied, not stated. No independent audit or regulator statement reached.
    - “Blurring occurs automatically on the edge on all device models.” — Hivemapper Foundation (network documentation), <https://docs.hivemapper.com/welcome/data-protection-and-privacy/> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote supports 'on the edge' but not 'before imagery is uploaded'. The policy (last updated Q2 2026) supports that with 'Bee Maps has no access to unblurred imagery'.
- **c059** Bee Maps' privacy docs say blurring of faces, bodies, vehicles and license plates occurs automatically on the edge on all device models.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Blurring occurs automatically on the edge on all device models.” — Bee Maps, <https://beemaps.com/docs/help-and-support/data-protection-and-privacy> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** The Bee Maps privacy policy is dated 'Last updated Q2 2026'.  
  _terms · legal_text · as of 2026 (page_dated)_
  - “Last updated Q2 2026” — Bee Maps, <https://beemaps.com/privacy/privacy-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Bee Maps said in July 2026 that it had terminated its services agreement with the Hivemapper Foundation as part of removing Phantom and Breeze wallets from the Bee App.  
  _event · vendor_stated · as of 2026-07-16 (page_dated) · scope: Bee App_
  - “we have terminated our services agreement with the Hivemapper Foundation” — Bee Maps, <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **v002** Under Hivemapper network rule MIP-26, effective 4 May 2026, the work-order consumption reward pool equals 25% of the Map Credits consumed in the period, reminted as HONEY.  
  _terms · legal_text · as of 2026-05-04 (page_dated) · scope: Hivemapper network_
  - “The total work order consumption reward pool equals 25% of the Map Credits consumed during that period, reminted as HONEY” — Hivemapper Foundation, <https://docs.hivemapper.com/welcome/network-governance/mip-26/> · docs · retrieved 2026-10-01 · quote check: exact
- **v003** Apple's App Store shows the Bee Maps app (seller Hivemapper Inc.) updated to version 10.13.16 one day before 1 October 2026, so the consumer app was still being shipped at the end of September 2026.  
  _status · independent · as of 2026-09-30 (page_dated) · scope: Bee Maps app (iOS), US App Store_
  - “Goal Rewards and video gateway bugfixes” — Apple (App Store), <https://apps.apple.com/us/app/bee-maps-drive-earn-fun/id6740009613> · third_party_docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.licence_model` — not_published; tried <https://beemaps.com/tos>, <https://beemaps.com/docs/help-and-support/terms-of-service>, <https://beemaps.com/developers>, <https://beemaps.com/docs/api-reference>, <https://beemaps.com/sitemap.xml>
- `matrix.exclusivity_offered` — not_published; tried <https://beemaps.com/tos>, <https://beemaps.com/pricing>, <https://beemaps.com/api-products>
- `matrix.versioning` — not_published; tried <https://beemaps.com/docs/api-reference>, <https://beemaps.com/docs/platform/road-intelligence-api>
- `matrix.human_subject_consent_docs` — not_published; tried <https://beemaps.com/privacy/privacy-policy>, <https://beemaps.com/docs/help-and-support/data-protection-and-privacy>, <https://beemaps.com/tos>
- `matrix.erasure_after_sale` — not_published; tried <https://beemaps.com/privacy/privacy-policy>, <https://beemaps.com/docs/help-and-support/data-protection-and-privacy>
- `matrix.quality_evidence` — not_published; tried <https://beemaps.com/api-products>, <https://beemaps.com/docs/platform/road-intelligence-api>
- `questions.Q2` — not_found; tried <https://beemaps.com/>, <https://beemaps.com/api-products>, <https://beemaps.com/blog>
- `other.burst_resale` — not_published; tried <https://beemaps.com/docs/api-reference>, <https://beemaps.com/docs/platform/road-intelligence-api>, <https://beemaps.com/pricing>
- `other.contributor_reward_rates` — not_published; tried <https://beemaps.com/blog/get-paid-in-usdc-to-map-your-city>, <https://hivemapper.com/tos>
- `other.independent_traction` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Hivemapper%22&forms=D>, <https://beemaps.com/about>

## Conflicts

- c023, c035: Bee Maps ToS (Q4 2025) says Bee Maps owns data it collects from a Bee; the Hivemapper network terms (May 2026) say Hivemapper claims no rights in Contributor Data and contributors license developers. Both may hold if Bee Maps acts as a 'developer' on the network, but the documents do not reconcile this; both kept. (unresolved)
- c040, c003: Network terms dated May 2026 still describe HONEY rewards; the July 2026 announcement ends HONEY support from August 2026. Newer event wins for the current reward currency. (newer_wins_status)

## Leads, not cited

- <https://beemaps.com/tos/bee> — Bee Terms of Service linked from the docs ToS index; not fetched separately.
- <https://beemaps.com/privacy/overview> — Privacy center overview; may describe data products and sharing.
- <https://beemaps.com/docs/platform/fleets> — Fleet (Beekeeper) docs; may explain fleet data use in products.
- <https://beemaps.com/blog/case-study-here> — Vendor case study with HERE Technologies (vendor-stated demand evidence).
