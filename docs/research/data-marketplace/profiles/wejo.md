# Wejo Group Limited

failure · light · status: **shut** · also known as Wejo, Wejo Limited, Wejo Marketplace

> Rendered from `ledger/wejo.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Wejo Marketplace Data Solutions (also 'Wejo Data Marketplace')” and its bespoke side “unknown”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | mixed | c039, c041, c047, c048, c029 | Legally Wejo sublicensed OEM data in its own name (GM DSA), but OEMs kept approval rights and Wejo booked itself as agent where OEMs retained rights and principal where it controlled the data. |
| economics_model | revenue_share | c040, c049, c055 | Wejo paid OEM data suppliers a share of gross revenue (GM DSA; OEM revenue-share fees netted from revenue). SaaS fees were a second revenue line. |
| who_pays_fee | seller | c040, c049 | No buyer-side fee is published; Wejo's take is what remains of the licence fee after the OEM's revenue share, so the supplier bears it out of proceeds. |
| supply_models | partner_licensed | c039, c025, c023, c052 | All inventory was connected-vehicle data licensed from OEM, Tier 1 and fleet partners; no own collection or contributor uploads found. |
| custody_model | mixed | c031, c032, c052, c044 | Data was processed on Wejo's cloud platform (ADEPT / Neural Edge) and also delivered to customers, whose copies had to be destroyed on GM DSA termination. Delivery mechanics (API, files, cloud shares) were not reachable. |
| transaction_mode | contact_sales | c051, c053, c041, c018 | Term licence contracts recognised ratably, reported as bookings and TCV, with GM approval of each licensing opportunity; no self-serve checkout found (website unreachable). |
| public_prices | unknown |  | wejo.com unreachable; no price found in filings. |
| licence_model | unknown |  | Customer licence template not found; only the upstream GM DSA flow-down requirement is known. |
| exclusivity_offered | unknown |  | Upstream GM licence to Wejo was non-exclusive; whether any buyer could obtain exclusivity is not published. |
| public_listing | unknown |  | wejo.com and marketplace pages unreachable; Wayback blocked. |
| buyer_vetting | case_by_case | c041 | For GM data at least, each commercial licensing opportunity went to GM for approval via the Joint Approval Process; practice for other OEMs' data unknown. |
| sample_mechanics | unknown |  | No sample or trial terms found. |
| versioning | unknown |  | Products were near real-time and historic data services; no versioning terms found. |
| human_subject_consent_docs | unknown | c036, c035, c046 | Only an investor-facing assertion that PII is used with appropriate consent; what, if anything, buyers received is not published. |
| contributor_pay_model | not_applicable |  | Data came from OEM connected-vehicle feeds under company-to-company licences; no individual capturers or uploaders were engaged or paid by Wejo in any source found. |
| catalogue_plus_custom | catalogue_only | c028, c030, c021 | Data was sold as standardised data sets from OEM feeds; the second line (Software & Cloud Solutions) was software and integration, not collection to order. |
| erasure_after_sale | contractual_deletion | c044, c043 | Evidence is the upstream GM DSA: on its termination Wejo had to make those it let use the data destroy their copies, and licensees had to accept terms at least as restrictive. |
| quality_evidence | unknown |  | No listing pages or quality statements reachable. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Not photo/video: buyers were departments of transportation, mapping, logistics, insurers and others licensing connected-vehicle data; about 108 customers and USD 8.4m revenue in FY2022, a third of the USD 23m projected in 2021. | c033, c020, c015, c017, c018, c060, c059 |
| Q2 | partial | OEMs supplied data to Wejo's marketplace for a revenue share rather than selling it themselves; Wejo pitched source-agnostic integration. Why OEMs chose this over their own channels is not stated. | c055, c040, c058 |
| Q3 | sourced | All supply was connected-vehicle data licensed from OEM, Tier 1 and fleet partners (29 at end-2022) under agreements of up to seven years; GM's was non-exclusive, sublicensable only as permitted, for a revenue share. | c023, c024, c039, c040, c045, c025, c052 |
| Q4 | partial | The supplier kept control: GM approved each licensing opportunity through a Joint Approval Process and barred licensing outside the agreement. No record found of terms being changed after the fact. | c041, c042, c047 |
| Q5 | partial | Wejo licensed data in its own name under sublicensable OEM licences, but accounted as agent where OEMs retained rights and principal where it controlled data. Consent warranties and indemnities to buyers are not published. | c039, c047, c048, c029 |
| Q6 | partial | OEM data was ingested and processed on Wejo's cloud platform and delivered to customers within 60 seconds; exact delivery mechanics were not reachable. | c052, c031, c032 |
| Q7 | partial | Drivers are the data subjects. Wejo asserted PII was used with appropriate consent and that two product lines used anonymised data; the GM DSA excludes individual-attributable insights. Who obtained consent is not stated. | c036, c035, c037, c046 |
| Q8 | partial | Upstream, GM required flow-down terms at least as restrictive as the DSA and destruction of all copies, including licensees', on termination. Customer licence terms themselves were not found. | c043, c044, c042, c029 |
| Q9 | partial | Customers paid licence fees under term contracts recognised ratably; OEMs received a revenue share (USD 2.4m netted in H1 2022). No self-serve checkout found. | c051, c053, c040, c049, c055, c026 |
| Q10 | partial | Products were standardised data sets and data services (portion or all of the data in a market), near real-time and historic. Revisions, entitlements and withdrawal rules not found. | c028, c034, c051 |
| Q11 | unknown |  |  |
| Q12 | partial | Wejo Marketplace Data Solutions (74% of FY2022 revenue) sold data; Wejo Software & Cloud Solutions (26%) sold software and services around it. There was no collect-to-order data side. | c021, c030, c054, c028 |

## Claims

### positioning

- **c054** Wejo's May 2021 investor presentation said it earns from proprietary data sets through its Data Marketplace and SaaS solutions.  
  _offer · vendor_stated · as of 2021-05-28 (publication)_
  - “Through its Data Marketplace and SaaS solutions, Wejo maximizes revenue opportunities from proprietary data sets” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c058** Wejo's May 2021 investor presentation described its platform as having source-agnostic interfaces for OEM and Tier 1 data.  
  _architecture · vendor_stated · as of 2021-05-28 (publication)_
  - “Source-agnostic interfaces provide flexible integration with OEM and Tier 1 data” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c022** Wejo said it had 20.8 million monetizable vehicles on its Wejo Neural Edge platform at 31 December 2022.  
  _number · filing · as of 2023-04-03 (publication)_ · **20.8 million vehicles** (connected vehicles whose data Wejo could monetise, per Wejo; as at 31 Dec 2022)
  - “Wejo had 20.8 million monetizable vehicles on the Wejo Neural Edge platform” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c023** Wejo said it had 29 OEM, Tier 1 and fleet data access relationships at 31 December 2022.  
  _number · filing · as of 2023-04-03 (publication)_ · **29 data access relationships** (OEM, Tier 1 and fleet data suppliers; as at 31 Dec 2022)
  - “Wejo had 29 OEM, Tier 1, and Fleet data access relationships” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c024** Wejo said its preferred data-partner relationships typically have terms of up to seven years.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “29 preferred partner relationships, which typically have terms of up to seven years” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c025** Wejo's 10-K states that its products rely on live data streams from vehicle manufacturers (OEMs) obtained on reasonable economic terms.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “Our products rely on live data streams from original equipment manufacturers” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the FY2022 10-K, the URL the profile cites. Note: the sentence is a risk-factor heading that continues 'if we are unable to maintain sufficient contracts ... at reasonable prices'. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “Our products rely on live data streams from OEMs on reasonable economic terms and with reasonable permissions” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote 'Our products rely on live data streams from original equipment manufacturers' stops before 'on reasonable economic terms', the part the statement depends on. Extend it to '... (“OEMs”) on reasonable economic terms and with reasonable permissions'. Also note that this is a risk-factor heading.
- **c026** Wejo's 10-K warns that if it cannot keep contracts with OEM partners for data streams at reasonable prices, its products could be impaired.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “if we are unable to maintain sufficient contracts with such partners for data streams at reasonable prices” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c027** Wejo named General Motors, Sompo Holdings, Palantir and Microsoft as strategic partners in its FY2022 10-K.  
  _offer · filing · as of 2023-04-03 (publication)_
  - “Our strong partnerships with companies such as General Motors Holdings LLC” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c038** Wejo Limited and General Motors Holdings LLC signed a Data Sharing Agreement effective 21 December 2018, filed as an exhibit to Wejo's 2021 S-4.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “effective as of the 21st day of December, 2018” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c039** Under the GM Data Sharing Agreement, GM granted Wejo a non-exclusive, non-transferable licence to its vehicle data, sublicensable only as the agreement permits.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “a non-exclusive, non-transferable, sublicensable (solely to the extent permitted herein), license to reproduce” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the contract exhibit, the URL the profile cites. Text matches s.3(a); the grant also runs to each Wejo Affiliate. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “a non-exclusive, non-transferable, sublicensable (solely to the extent permitted herein), license” — General Motors Holdings LLC and Wejo Limited (contract filed via SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — DSA s.3(a) grant clause; quote matches. Scope: this is GM only; c023 says 29 data partners, and this clause says nothing about the other OEMs' terms.
- **c045** The GM Data Sharing Agreement ran for a term of seven years from its effective date.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “begins on the Effective Date and ends on the seventh (7th)” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c050** Wejo carried its GM data sharing agreement on its balance sheet as an intangible asset.  
  _terms · filing · as of 2022-08-15 (publication)_
  - “gross book value of the General Motors” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c056** Wejo's May 2021 investor presentation claimed active agreements with 17 OEM and Tier 1 partners.  
  _number · vendor_stated · as of 2021-05-28 (publication)_ · **17 OEM and Tier 1 data partners** (active supply agreements, per Wejo; as at May 2021)
  - “Active agreements with 17 OEM and Tier 1 partners” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c057** Wejo's May 2021 investor presentation named GM and Hella as strategic investors.  
  _event · vendor_stated · as of 2021-05-28 (publication)_
  - “GM and Hella are strategic investors” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### object_model

- **c028** Wejo Marketplace Data Solutions takes ingested data from multiple sources and transforms it into standardized data sets for customers.  
  _offer · filing · as of 2023-04-03 (publication)_
  - “Wejo Marketplace Data Solutions utilizes ingested data from multiple sources” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c034** Wejo's Traffic Management Services line provided near real-time and historic intelligence about traffic patterns and roads.  
  _offer · filing · as of 2023-04-03 (publication)_
  - “Traffic Management Services offering provides near real-time and historic intelligence about traffic patterns” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### transaction

- **c047** Wejo's Q2 2022 10-Q says that where OEMs retained rights over the vehicle data supplied to customers, Wejo acted as agent and recognised revenue net.  
  _terms · filing · as of 2022-08-15 (publication)_
  - “the Company has determined it acts as the agent in this arrangement and recognizes revenue on a net basis” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “certain rights retained by the OEMs over the connected vehicle data being supplied to the customers” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is Wejo's own Q2 2022 10-Q, the URL the profile cites. Wording correct. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “the Company has determined it acts as the agent in this arrangement and recognizes revenue on a net basis” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — Both quotes come from the Q2 2022 10-Q revenue note and support the statement. Caution for the matrix: 'agent' here is the ASC 606 principal-versus-agent accounting call, not the matrix's legal sense (selling under the provider's name). The DSA shows Wejo sublicensing in its own name. The profile's 'mixed' value and its note already reflect this.
- **c048** Wejo's Q2 2022 10-Q says that where Wejo controlled the underlying data, it acted as principal and recognised revenue gross.  
  _terms · filing · as of 2022-08-15 (publication)_
  - “the Company has control over the underlying data and is acting as the principal and recognizes revenue on a gross basis” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c051** Wejo's 2021 SEC correspondence describes customers as paying licence fees for data services covering part or all of the data in their market.  
  _terms · filing · as of 2021-09-07 (publication)_
  - “customers pay license fees to obtain one or more data services that may include a portion or all of the data” — Wejo Group Limited / US SEC (EDGAR correspondence), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the 7 Sep 2021 response letter, the URL the profile cites. Wording correct. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “pay license fees to obtain one or more of these data services that may include a portion or all of the data in their market” — Wejo Group Ltd (response letter to SEC staff) via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The profile's quote ('one or more data services ...', without 'of these') is the SEC staff comment restating the S-4. Wejo's own response in the same letter repeats it as 'one or more of these data services'. Either supports the statement. For matrix.transaction_mode, this claim shows licence fees, not that deals closed through sales; contact_sales rests on the other cited claims.
- **c053** Wejo's 2021 SEC correspondence notes that it generally recognised data licence revenue ratably over the contract term.  
  _terms · filing · as of 2021-09-07 (publication)_
  - “you generally recognize revenue ratably over the term of the contract” — Wejo Group Limited / US SEC (EDGAR correspondence), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### pricing

- **c049** Wejo recognised a USD 2.4 million reduction of revenue in the six months to 30 June 2022 for revenue sharing and other fees paid to OEM partners.  
  _number · filing · as of 2022-08-15 (publication)_ · **2.4 USD million** (revenue sharing and other fees paid by Wejo to OEM data partners, netted against revenue where Wejo acted as agent; six months to 30 Jun 2022)
  - “recognized a reduction of revenue of $1.3 million and $2.4 million” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “These reductions of revenue arise from revenue sharing and other fees paid to the Company's OEM partners” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is Wejo's own Q2 2022 10-Q, the URL the profile cites. Figure correct: USD 2.4m over six months. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “has recognized a reduction of revenue of $ 1.3 million and $ 2.4 million, respectively” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The first quote gives '$1.3 million and $2.4 million' without the period, so it does not show that USD 2.4m is the six-month figure. The preceding words 'During the three and six months ended June 30, 2022' are needed. The scope use (economics_model supporting) is fine.
- **c055** Wejo's May 2021 investor presentation showed a Wejo Data Marketplace revenue flow with a revenue-share leg alongside licence, data and platform fees (the text does not label each party).  
  _offer · vendor_stated · as of 2021-05-28 (publication)_
  - “Demonstrating revenue flow from Wejo Data Marketplaces and Wejo SaaS” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “Receives Revenue Share Pays License & Platform Fees” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### licence

- **c029** Wejo sold data licences of its own proprietary data to customers.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “data licenses of our proprietary data used by customers for ongoing and efficient access” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c042** The GM Data Sharing Agreement bars Wejo from licensing GM data or derived insights to any third party except as the agreement expressly permits.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “Wejo will not license the Data or Derived Data Insights to any third party or permit any third party to” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c043** The GM Data Sharing Agreement requires Wejo to ensure anyone using GM data or derived insights complies with terms at least as restrictive as the agreement.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “complies with terms that are at least as restrictive as the relevant terms of this Agreement” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the contract exhibit, the URL the profile cites. Text matches s.6(a). Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “ensure that anyone accessing or using the Data or Derived Data Insights complies with terms that are at least as restrictive” — General Motors Holdings LLC and Wejo Limited (contract filed via SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — DSA s.6(a); the quote matches and is correctly flagged as nearest evidence for the licence model (GM upstream flow-down, not a customer licence).

### custody

- **c031** Wejo Neural Edge was described as a cloud-based platform for accessing and sharing connected vehicle data.  
  _architecture · filing · as of 2023-04-03 (publication)_
  - “Wejo Neural Edge is a cloud-based software and analytics platform” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c032** Wejo said it could deliver data from vehicle to customer in under 60 seconds.  
  _architecture · vendor_stated · as of 2023-04-03 (publication)_
  - “We are able to deliver data from vehicle to customer in less than 60 seconds” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c052** Wejo's 2021 SEC correspondence states that OEMs provide Wejo their data through licence agreements and Wejo processes it on its ADEPT platform in cloud data centres.  
  _architecture · filing · as of 2021-09-07 (publication)_
  - “OEMs provide the Company this data through license agreements. The Company processes the data in its ADEPT platform” — Wejo Group Limited / US SEC (EDGAR correspondence), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The claim is about what one document says, and the only source is that response letter (7 Sep 2021), the URL the profile cites. Wording correct. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “OEMs provide the Company this data through license agreements. The Company processes the data in its ADEPT platform” — Wejo Group Ltd (response letter to SEC staff) via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — The quote is Wejo's response text in the 7 Sep 2021 letter; the cloud-data-centre part ('running in cloud data centers') follows directly after it.

### vetting

- **c041** Under the GM Data Sharing Agreement, Wejo must present commercial licensing opportunities for GM data to GM for approval through a Joint Approval Process.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “licensing opportunities to GM for approval via the Joint Approval Process” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### contributor_pay

- **c040** Under the GM Data Sharing Agreement, Wejo pays GM a share (percentage redacted) of the gross revenue Wejo receives from licensing or otherwise using the data.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “of the gross revenue received by Wejo from Wejo's licensing or other use of the Data” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the contract exhibit, the URL the profile cites; the clause exists only there. GM is the counterparty but the exhibit was filed by Wejo. Text matches s.4(a); the percentage is redacted with no marker. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “Wejo shall pay GM of the gross revenue received by Wejo from Wejo's licensing or other use of the Data” — General Motors Holdings LLC and Wejo Limited (contract filed via SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — DSA s.4(a); the quote supports the statement and the redaction is described correctly.

### post_sale

- **c044** On expiry or termination of the GM Data Sharing Agreement, Wejo must destroy all copies of the data and ensure those it let use the data do the same.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “destroy all copies of the Data (and ensure others that Wejo has permitted to access or use the Data do the same)” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### catalogue_custom

- **c021** Wejo earned 74% of FY2022 revenue from Wejo Marketplace Data Solutions and 26% from Wejo Software & Cloud Solutions.  
  _number · filing · as of 2023-04-03 (publication)_ · **74 percent of revenue** (share of Wejo Group FY2022 revenue from Wejo Marketplace Data Solutions; per year (FY2022))
  - “the Company earned 74% of its revenue from the Wejo Marketplace Data Solutions” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c030** Wejo Software & Cloud Solutions provided software platforms, analytics tools, data management and data privacy solutions for OEMs, fleets, insurers and others.  
  _offer · filing · as of 2023-04-03 (publication)_
  - “Wejo Software & Cloud Solutions supports usage of these valuable data sets with solutions such as software platforms” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

### changes

- **c001** Companies House lists Wejo Limited (company 08813730) with status In Administration as of the retrieval date.  
  _status · government · as of 2026-10-01 (retrieved_only)_
  - “In Administration” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/08813730> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Companies House company page for WEJO LIMITED, 08813730, retrieved 2026-10-01. Insolvency tab: administration started 10 July 2023; administrators Andrew Poxon and Hilary Pascoe of Leonard Curtis. Same URL as the profile cites; it is the UK government register, so it is independent of Wejo, but no second route was found.
    - “In Administration” — Companies House (UK government), <https://find-and-update.company-information.service.gov.uk/company/08813730> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote is the status field on the Companies House page for 08813730. Profile-level remark: the profile's status is 'shut', but the register says In Administration (not dissolved). The AM10 says the other Wejo entities are non-trading, which supports 'shut' in substance.
- **c002** The newest filing on Wejo Limited's Companies House record is an administrator's progress report (AM10) dated 17 August 2026.  
  _event · government · as of 2026-08-17 (page_dated)_
  - “Administrator's progress report” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Filing history lists 17 Aug 2026 AM10 'Administrator's progress report' as the newest row; earlier AM10s every six months plus AM19 extensions filed 04 Jul 2024 and 25 Jun 2025. The quote cannot carry the date; the date is in the same table row. The AM10 PDF itself is a scanned image (no text layer): it reports the period 10 Jan 2026 to 9 Jul 2026 and says the administration was extended to 9 January 2027 by court order of 20 June 2025, and that no distribution to preferential creditors is anticipated - not quotable because the PDF has no text. Same URL as the profile cites; it is the UK government register, so it is independent of Wejo, but no second route was found.
    - “Administrator's progress report” — Companies House (UK government), <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote 'Administrator's progress report' matches several rows (AM10s from Feb 2024 to Aug 2026), so it shows neither the 17 Aug 2026 date nor that this is the newest filing. The row text '17 Aug 2026 AM10 Administrator's progress report' would show it, if the checker reads the row as one string.
- **c003** The administrators of Wejo Limited filed notices extending the period of administration (AM19) in July 2024 and June 2025.  
  _event · government · as of 2025-06-25 (page_dated)_
  - “Notice of extension of period” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c004** Andrew Poxon and Hilary Pascoe of Leonard Curtis were appointed administrators of Wejo Limited on 10 July 2023, per the London Gazette notice.  
  _event · government · as of 2023-07-10 (publication)_
  - “10 July 2023” — The London Gazette, <https://www.thegazette.co.uk/notice/4399698> · filing · retrieved 2026-10-01 · quote check: exact
  - “Andrew Poxon (IP No. 8620) and Hilary Pascoe (IP No. 27590) both of Leonard Curtis” — The London Gazette, <https://www.thegazette.co.uk/notice/4399698> · filing · retrieved 2026-10-01 · quote check: exact
- **c005** Wejo Group's 8-K of 18 July 2023 disclosed that Wejo Limited, its UK operating subsidiary, had appointed joint administrators from Leonard Curtis Recovery Limited.  
  _event · filing · as of 2023-07-18 (publication)_
  - “appointed Andrew Poxon and Hilary Pascoe of Leonard Curtis Recovery Limited as joint administrators of Wejo Limited” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000143/wejo-20230718.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c006** Wejo Group's 8-K of 18 July 2023 states that filing the notice of appointment of administrators was an event of default that accelerated the company's debt obligations.  
  _event · filing · as of 2023-07-18 (publication)_
  - “The filing of the NOA constitutes a continuing event of default that accelerated” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000143/wejo-20230718.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c007** Among the accelerated obligations was a secured convertible note issued under a 16 December 2022 securities purchase agreement with General Motors Holdings LLC.  
  _event · filing · as of 2023-07-18 (publication)_
  - “dated December 16, 2022, by and between the Company and General Motors Holdings LLC” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000143/wejo-20230718.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c008** Wejo's 8-K of 28 June 2023 put the accelerated amount under the GM secured convertible note at about USD 10.5 million of principal and interest.  
  _number · filing · as of 2023-06-28 (publication)_ · **10.5 USD million** (principal and interest owed by Wejo Group under the GM Holdings secured convertible note, accelerated on default; as at June 2023)
  - “approximately $10.5 million in principal and interest through December 2023 in the aggregate under” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The claim is about what Wejo's own 8-K says; it cites the same 8-K URL as the profile. The figure checks out (Item 2.04 names GM Holdings as note holder) but nothing outside Wejo corroborates it; no search available to find press. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “approximately $10.5 million in principal and interest through December 2023” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The amount is right, but the quote does not show that the note is GM's. Its 'in the aggregate under' trails off just before 'the Secured Convertible Notes'. Add the words naming the holder: 'Securities Purchase Agreement, dated December 16, 2022, by and between the Company and General Motors Holdings LLC'.
- **c009** Wejo's 8-K of 28 June 2023 put the accelerated amount under its April 2021 secured loan notes (Securis Investment Partners as security agent) at about USD 42.6 million.  
  _number · filing · as of 2023-06-28 (publication)_ · **42.6 USD million** (principal and unpaid interest owed under the 21 April 2021 secured loan notes, accelerated on default; as at June 2023)
  - “approximately $42.6 million in principal and unpaid interest through April 2024 in the aggregate under” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “Securis Investment Partners LLP, as security agent” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c010** A third notice of intent to appoint administrators over Wejo Limited was filed on 27 June 2023.  
  _event · filing · as of 2023-06-28 (publication)_
  - “was filed at 10.00 am BST on June 27, 2023” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c011** Wejo and TKB Critical Technologies mutually agreed in June 2023 to terminate their business combination agreement.  
  _event · filing · as of 2023-06-28 (publication)_
  - “the parties mutually agreed to terminate the Business Combination Agreement” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c012** Nasdaq determined that Wejo Group's common shares and public warrants would be delisted after the notice of intent to appoint administrators.  
  _event · filing · as of 2023-06-28 (publication)_
  - “Nasdaq had determined that the Company's common shares and public warrants” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000140/wejo-20230628.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c013** Wejo Group's last 8-K, filed 7 November 2023, reported the immediate resignation of director and audit committee chair Ann M Schwister.  
  _event · filing · as of 2023-11-07 (publication)_
  - “of her decision to resign, effective immediately” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000154/wejo-20231107.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c014** The administrators' statement of proposals for Wejo Limited (AM03) was filed at Companies House on 12 September 2023.  
  _event · government · as of 2023-09-12 (page_dated)_
  - “Statement of administrator's proposal” — Companies House, <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history> · filing · retrieved 2026-10-01 · quote check: exact
- **c019** Wejo and its auditor expressed substantial doubt about its ability to continue as a going concern in the FY2022 10-K.  
  _outcome · filing · as of 2023-04-03 (publication)_
  - “have expressed substantial doubt about our ability to continue as a going concern” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — The S-4 restates this from the 10-K. The 10-K's EY audit report says the negative operating cash flows give 'rise to substantial doubt about its ability to continue as a going concern'. The profile cites the 8-K Ex 99.1 / 10-K; this S-4 is a different document, but it is still Wejo-authored.
    - “its independent registered public accounting firm, have expressed substantial doubt about Wejo's ability” — Wejo Holdings Ltd / TKB Critical Technologies 1 via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1963322/000162828023011417/wejo-20230412.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The quote 'have expressed substantial doubt about our ability to continue as a going concern' does not show that the auditor joined in. The words 'We, as well as our independent registered public accounting firm, have expressed substantial doubt' would.

### demand

- **c015** Wejo reported FY2022 net revenue of USD 8.4 million, up 227% on 2021.  
  _number · filing · as of 2023-04-03 (publication)_ · **8.4 USD million** (Wejo Group consolidated net revenue, all product lines; per year (FY2022))
  - “Net Revenue for 2022 increased to $8.4 million, up 227% compared to the full-year 2021” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000064/wejo-8kex991q42022.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Joint S-4 for the TKB business combination (filed 2023-04-12 by Wejo Holdings Ltd), a different document from the 10-K, shows USD 8,396k vs 2,566k (in thousands), i.e. +227%. The 10-K itself says 'Revenue, net increased to $8.4 million, or 227%, compared to the prior year.' Both are Wejo-authored filings; no third-party press reached (no search available). The profile cites the 8-K Ex 99.1 / 10-K; this S-4 is a different document, but it is still Wejo-authored.
    - “Revenue, net $ 8,396 $ 2,566” — Wejo Holdings Ltd / TKB Critical Technologies 1 via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1963322/000162828023011417/wejo-20230412.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — 8-K Ex 99.1 (Q4/FY2022 results release), FY2022, company-wide; the quote states both USD 8.4m and 227%.
- **c016** Wejo reported an FY2022 net loss of USD 159.3 million.  
  _number · filing · as of 2023-04-03 (publication)_ · **159.3 USD million** (Wejo Group consolidated net loss; per year (FY2022))
  - “Net loss for 2022 was $159.3 million and Adjusted EBITDA loss was $97.2 million” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000064/wejo-8kex991q42022.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — S-4 (2023-04-12) selected historical financial data, in thousands: FY2022 net loss USD 159,253k; FY2021 USD 217,778k. Matches the 10-K MD&A ('our net loss of $159.3 million'). The profile cites the 8-K Ex 99.1 / 10-K; this S-4 is a different document, but it is still Wejo-authored.
    - “Net loss (159,253) $ (217,778)” — Wejo Holdings Ltd / TKB Critical Technologies 1 via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1963322/000162828023011417/wejo-20230412.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — Same release; the quote states the FY2022 net loss of USD 159.3m.
- **c017** Wejo reported FY2022 gross bookings of USD 18.8 million.  
  _number · filing · as of 2023-04-03 (publication)_ · **18.8 USD million** (gross bookings as defined by Wejo (company metric, not GAAP revenue); per year (FY2022))
  - “Gross Bookings increased by approximately 124% to $18.8 million in 2022” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000064/wejo-8kex991q42022.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c018** Wejo reported total contract value of USD 39.4 million as of 31 December 2022.  
  _number · filing · as of 2023-04-03 (publication)_ · **39.4 USD million** (total contract value as defined by Wejo (company metric); as at 31 Dec 2022)
  - “as of December 31, 2022 increased 92% to $39.4 million” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000064/wejo-8kex991q42022.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c020** Wejo said it had approximately 108 customers as of 31 December 2022.  
  _number · filing · as of 2023-04-03 (publication)_ · **108 customers** (all Wejo customers across both business lines; as at 31 Dec 2022)
  - “the Company had approximately 108 customers across a variety of industries and sectors” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c033** Wejo's target customers included departments of transportation, mapping and navigation firms, logistics and geospatial companies.  
  _offer · filing · as of 2022-03-31 (publication)_
  - “departments of transportation, mapping and navigation organizations, logistics companies” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000015/wejo-20211231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c059** Wejo's May 2021 investor presentation projected net revenue of USD 23 million for 2022.  
  _number · vendor_stated · as of 2021-05-28 (publication)_ · **23 USD million** (projected Wejo net revenue for 2022 (estimate), presented to investors before the SPAC merger; per year (2022E))
  - “2020 A 2021 E 2022 E 2023 E 2024 E 2025 E” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “$1.3 $4.3 $23 $118 $325 $764” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c060** Wejo's reported FY2022 net revenue of USD 8.4 million was roughly a third of the USD 23 million it had projected for 2022 in May 2021.  
  _outcome · filing · as of 2023-04-03 (publication)_
  - “Net Revenue for 2022 increased to $8.4 million” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000064/wejo-8kex991q42022.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “$1.3 $4.3 $23 $118 $325 $764” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Investor presentation filed by the SPAC Virtuoso Acquisition Corp as Exhibit 99.2 to its 8-K of 2021-05-28. The table header is '$ mm 2020 A 2021 E 2022 E ...', so 2022E net revenue was USD 23m. Actual FY2022 was USD 8.4m (10-K, S-4): 36.5% of the projection, which is 'roughly a third'. The same deck projected 2021 at USD 4.3m; actual 2021 was USD 2.57m. The projection was Wejo management's ('Source: Wejo management'). The profile cites the same deck as Wejo's own Rule 425 filing; this is the copy the SPAC filed (different filer and URL, same content).
    - “Net Revenue $1.3 $4.3 $23 $118 $325 $764” — Virtuoso Acquisition Corp. via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1822888/000121390021029979/ea141712ex99-2_virtuosoacq.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — The composite is arithmetically right (8.4/23 = 36.5%). But the second quote '$1.3 $4.3 $23 $118 $325 $764' has neither the row label nor the year, so on its own it does not show that USD 23m was the 2022 net revenue projection. 'Net Revenue $1.3 $4.3 $23 $118 $325 $764' gives the label; the header '$ mm 2020 A 2021 E 2022 E' is needed for the year. The profile's c059 is the cleaner carrier for the projection.

### regulation

- **c035** Wejo said its Traffic Management Services and Audience and Media Measurement lines used anonymized or de-identified data, and its other lines used PII.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “Traffic Management Services and Audience and Media Measurement use anonymized or de-identified data” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c036** Wejo's 10-K asserts that PII is used with appropriate consent, without saying in that passage who obtains it or what the buyer receives.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “PII is used with appropriate consent under our stringent privacy standards” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The only source is the FY2022 10-K, the URL the profile cites. The S-4 does not repeat the phrase. Searching the 10-K for 'consent' found no other passage naming who obtains it, so the 'without saying' framing holds for the whole document, not only that passage. Blind result: the only source reached is the URL the profile cites, so this is not independent corroboration. The quote is kept below as a check.
    - “PII is used with appropriate consent under our stringent privacy standards” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — FY2022 10-K Item 1; the quote matches. 'asserted_only' would be a stretch, and the profile rightly leaves the matrix field unknown.
- **c037** Wejo said its data collection and handling processes aim to comply with applicable laws including GDPR and CCPA.  
  _terms · filing · as of 2023-04-03 (publication)_
  - “All of Wejo's data collection and handling processes aim to achieve compliance with all applicable laws” — Wejo Group Limited (SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c046** The GM Data Sharing Agreement defines Derived Data Insights to exclude observations that can be attributed to GM or to any individual.  
  _terms · legal_text · as of 2018-12-21 (page_dated)_
  - “that can be attributed to GM or to any individual” — General Motors Holdings LLC and Wejo Limited (exhibit on SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed

## Added by the verifier

- **v001** The GM Data Sharing Agreement provides GM's data to Wejo 'as is' with all warranties disclaimed, including accuracy and non-infringement.  
  _terms · legal_text · as of 2018-12-21 (page_dated) · scope: GM connected-vehicle data supplied to Wejo_
  - “THE DATA IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS, WITH ALL WARRANTIES DISCLAIMED” — General Motors Holdings LLC and Wejo Limited (contract filed via SEC EDGAR), <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm> · legal_terms · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** Wejo's Q2 2022 10-Q recorded USD 2.4 million of revenue share owed to GM alone as a reduction of revenue in the six months to 30 June 2022, the same figure it gave for all OEM revenue sharing and fees.  
  _number · filing · as of 2022-08-15 (publication) · scope: Wejo Marketplace Data Solutions_ · **2.4 USD million** (revenue share owed by Wejo to GM, netted from Wejo's revenue; six months to 30 June 2022)
  - “the Company recorded $ 1.4 million and $ 2.4 million, respectively, as a reduction to revenue, net” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - “Comprehensive (Loss) Income for revenue sharing amounts owed to GM” — Wejo Group Ltd via SEC EDGAR, <https://www.sec.gov/Archives/edgar/data/1864448/000186444822000079/wejo-20220630.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v003** On 26 February 2024 the SEC declared Wejo Group Limited's pending registration statement (File 333-268929) abandoned after Wejo failed to respond to a Rule 479 notice.  
  _event · government · as of 2024-02-26 (publication) · scope: US_
  - “it is ORDERED that the registration statement be declared abandoned on February 26, 2024” — U.S. Securities and Exchange Commission, <https://www.sec.gov/Archives/edgar/data/1864448/999999999724000389/filename1.pdf> · filing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.public_prices` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>, <https://aws.amazon.com/marketplace/search/results?searchTerms=wejo>
- `matrix.licence_model` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm>
- `matrix.exclusivity_offered` — not_published; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm>
- `matrix.public_listing` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>
- `matrix.sample_mechanics` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm>
- `matrix.versioning` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>
- `matrix.human_subject_consent_docs` — not_published; tried <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm>, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm>
- `matrix.quality_evidence` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>
- `questions.Q11` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm>, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm>
- `other.website` — not_found; tried <https://www.wejo.com>, <http://www.wejo.com>, <https://developer.wejo.com>, <https://marketplace.wejo.com>, <https://docs.wejo.com>
- `other.administrators_reports` — not_published; tried <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000151/wejocompanieshouseadmini.htm>, <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history/MzM5MTY1OTY5OGFkaXF6a2N4/document?format=pdf&download=0>, <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history/MzUzNzIzMzcxMGFkaXF6a2N4/document?format=pdf&download=0>
- `other.trading_status_and_asset_sale` — not_found; tried <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history>, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000151/wejo-20230918.htm>, <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000151/wejocompanieshouseadmini.htm>
- `other.sec_staff_action_2024` — blocked; tried <https://www.sec.gov/Archives/edgar/data/1864448/999999999724000389/filename1.pdf>, <https://www.sec.gov/Archives/edgar/data/1864448/999999999724000389/9999999997-24-000389.txt>
- `other.independent_press` — not_found
- `other.oem_share_percentages` — not_published; tried <https://www.sec.gov/Archives/edgar/data/1864448/000110465921093068/tm2121431d2_ex10-2.htm>
- `other.names_for_custom_side` — not_found; tried <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000068/wejo-20221231.htm>, <https://www.sec.gov/Archives/edgar/data/1864448/000110465921074265/tm2117781d1_425.htm>

## Leads, not cited

- <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000151/wejocompanieshouseadmini.htm> — Administrators' report of 1 Sept 2023 (60 page images, no text layer): background to failure, marketing of the business, creditors. Needs OCR; not citable by quote.
- <https://find-and-update.company-information.service.gov.uk/company/08813730/filing-history> — AM03 proposals (Sept 2023) and AM10 progress reports to Aug 2026 are scanned PDFs; they would say whether assets were sold and what creditors (incl. GM) recover.
- <https://www.sec.gov/Archives/edgar/data/1864448/999999999724000389/filename1.pdf> — SEC staff action order of 26 Feb 2024 on Wejo Group; the PDF could not be read (403 to the extractor).
- <https://www.sec.gov/Archives/edgar/data/1864448/000110465921113474/filename1.htm> — SEC comment-letter response pointing to the S-4/A (p.213) for the principal-versus-agent policy on OEM data sharing agreements.
- <https://www.sec.gov/Archives/edgar/data/1864448/000186444823000125/wejo-20230331.htm> — Last 10-Q (Q1 2023): going-concern note and concentration disclosures beyond what WebFetch returned.
