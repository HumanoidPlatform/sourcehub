# Linguistic Data Consortium

priced_catalogue · light · status: **active** · also known as LDC

> Rendered from `ledger/ldc.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “LDC Catalog” and its bespoke side “sponsored programs”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c013, c021, c049 | Buyer contracts with LDC under LDC's own agreements; LDC holds distribution rights from providers and passes through the rights it obtained. |
| economics_model | mixed | c031, c028, c060 | Annual membership fees plus per-corpus licence fees, on data LDC creates for sponsored programmes or holds under distribution agreements; any payment to providers is not published. |
| who_pays_fee | unknown |  | No published operator fee or split on provider sales. |
| supply_models | own_collection, commissioned_nonexclusive, third_party_providers | c006, c057, c060, c047, c049, c062 | commissioned_nonexclusive: data produced for government-sponsored programmes is published in the catalogue. |
| custody_model | copy_to_buyer | c042, c044, c018 | Web download from LDC's portal or a shipped drive. |
| transaction_mode | self_serve_checkout | c059, c039, c041 | Online cart with e-signature; quotes and pro forma invoices on request; some corpus-specific agreements go by fax or email. |
| public_prices | some | c031, c033, c055 | Membership fees public; per-corpus fees behind login. |
| licence_model | tiered_standard | c009, c010, c012 | Fixed menu by user type (non-member and not-for-profit research-only vs for-profit member commercial); corpus-specific licences override for some sets. |
| exclusivity_offered | unknown |  | Not addressed on any page fetched; LDC itself does not generally take exclusive rights from providers. |
| public_listing | public_summary_gated_detail | c054, c055 | Descriptions, samples and licence names public; fee requires login. |
| buyer_vetting | account_only | c070, c071 | A licensing account must be tied to an organisation; no further checks published. |
| sample_mechanics | free_sample_download | c054, c058 |  |
| versioning | immutable_revisions | c053, c068, c038 | New editions get new catalog IDs and the old edition stays listed; licences to data received are perpetual. Whether past buyers get a new edition free is not published. |
| human_subject_consent_docs | unknown | c050, c069, c017 | Providers must describe consent to LDC, but documentation guidelines do not require consent records for buyers and the licence disclaims all warranties; per-corpus documentation not inspected. |
| contributor_pay_model | unknown |  | No page fetched says how speakers, scribes or annotators are paid, or whether providers get royalties. |
| catalogue_plus_custom | both | c060, c061, c007 | Catalog plus data created for sponsored programmes and listed collection/annotation services. |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c051 | LDC's own QC claim; vendor-stated. The licences disclaim conformity with documentation. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | LDC sells to universities, corporations and government labs, in single-corpus licences or annual memberships; its most-distributed corpora are text and speech (OntoNotes, TIMIT), with images a minor share. Why buyers choose catalogue over custom is not published. | c002, c072, c031, c067, c057 |
| Q2 | partial | Providers give LDC a distribution agreement; LDC does not generally take exclusivity, so they can distribute elsewhere, and LDC adds QC and monthly release. No provider economics published. | c047, c048, c049, c051 |
| Q3 | sourced | Inventory is LDC's own creation, data produced for US-government-sponsored programmes, and contributions from researchers and media organisations under a distribution agreement; LDC passes through the rights it obtained, with corpus-specific licences where providers require them. | c006, c060, c062, c049, c021, c012 |
| Q4 | partial | Data made for sponsored programmes is routinely published in the catalogue; how resale rights are carved out of sponsor contracts, and any retroactive term changes, were not found. | c060, c048 |
| Q5 | sourced | LDC is licensor of record under its own agreements and grants the rights it obtained; data is as-is with no warranty from LDC, providers or authors, and the for-profit member indemnifies LDC. | c013, c021, c025, c017, c024 |
| Q6 | sourced | Copied to the buyer: web download from LDC's portal, or hard drive/USB for very large corpora. | c042, c044, c018 |
| Q7 | partial | Providers must tell LDC about IRB approval and consent elements, including consent to sharing in a corpus; nothing published shows that evidence passing to the buyer, and the licences disclaim warranties. Property/place owners not addressed. | c050, c069, c025 |
| Q8 | sourced | Research-only for non-members and not-for-profits, commercial use for for-profit members, perpetual, site-limited, no redistribution; some corpora need signed user agreements kept on file for LDC inspection. No fingerprinting published. | c009, c020, c016, c022, c023, c038, c064 |
| Q9 | sourced | Self-serve cart with e-signed licences, card/check/wire, or quotes and purchase orders; LDC sets prices (memberships USD 2,400 to 40,000 a year, per-corpus fees behind login). | c059, c039, c041, c031, c032, c033, c034, c055 |
| Q10 | partial | A corpus is a catalog item with a catalog number and DOI, released monthly; memberships entitle to a membership year's releases; new editions get new IDs and old ones stay listed. What past buyers get on a new edition is not published. | c056, c052, c026, c053, c068, c038 |
| Q11 | partial | Listings show a description, licence name and free sample files; LDC claims its own QC, but the licences disclaim accuracy and conformity with documentation. | c054, c058, c046, c051, c017 |
| Q12 | partial | The LDC Catalog is the off-the-shelf side; bespoke work is done as sponsored programmes and listed services, and virtually all sponsored-programme data flows into the Catalog. | c060, c061, c007, c008 |

## Claims

### positioning

- **c001** LDC says it was formed in 1992 to address a data shortage in language technology research and development.  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC was formed in 1992 to address the critical data shortage then facing language technology research and development.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/about> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c002** LDC describes itself as an open consortium of universities, libraries, corporations and government research laboratories.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “is an open consortium of universities, libraries, corporations and government research laboratories” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/about> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c003** LDC describes itself as a non-profit hosted by the University of Pennsylvania.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “non-profit hosted by the University of Pennsylvania” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/a-closer-look-at-ldc> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### supply

- **c006** LDC says it creates and distributes a wide array of language resources.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC has grown into an organization that creates and distributes a wide array of language resources.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/about> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c047** LDC invites contributions from language resource developers for publication in its catalogue.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC invites contributions from language resource developers to further this mission” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c048** LDC says it does not generally acquire exclusive rights to contributed resources, so developers can distribute them by other means too.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC does not generally acquire exclusive rights to contributed resources” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c049** All data providers must sign a distribution agreement giving LDC the right to store and distribute the submitted resource.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “All providers must sign a distribution agreement with LDC that gives the Consortium the right to store and distribute” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c057** LDC's MADCAT Phases 1-3 Composite Evaluation Set consists of handwritten pages produced by scribes LDC instructed, scanned as images.  
  _offer · vendor_stated · as of 2026-05-15 (page_dated) · scope: LDC2026T05_
  - “Arabic speaking scribes copied documents by hand, following specific instructions as to the writing style” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026T05> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** LDC says virtually all data it produces for sponsored programmes is published in the LDC Catalog and broadly available.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Virtually all data produced for sponsored programs is published in the LDC Catalog and broadly available to the community.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/collaborations> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **unverifiable** — A self-description of LDC's publishing record; an independent check (e.g. a DARPA/IARPA programme page or an academic audit of programme data releases) ought to exist but none was reachable. IARPA's MATERIAL programme page (iarpa.gov/research-programs/material) does not mention LDC although LDC is publishing MATERIAL language packs (LDC2026S12 in the September 2026 newsletter). arXiv abstract search found NIST SRE papers using LDC-collected corpora, which show individual cases, not 'virtually all'. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_ok** — Quote is the full sentence and the statement is correctly framed as 'LDC says'.
- **c062** LDC names organisations that create data of interest, such as news organisations and broadcasters, among its data contributors.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Organizations that create data of interest (news organizations, broadcasters)” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/collaborations> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### object_model

- **c019** The non-member agreement defines LDC Databases as media containing images, speech, video and/or text data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “containing images, speech, video and/or text data (the “LDC Databases”)” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c053** LDC re-released CALLHOME American English as a Second Edition with audio converted to FLAC, transcripts revised and the original partitioning removed, under a new catalog ID.  
  _offer · vendor_stated · as of 2026-07-15 (page_dated) · scope: LDC2026S08_
  - “original training/development/test partitioning was removed” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026S08> · docs · retrieved 2026-10-01 · quote check: exact
- **c056** Each LDC corpus carries a catalog number and DOI, e.g. CALLHOME American English Second Edition LDC2026S08 with DOI 10.35111/rzpb-np15.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LDC2026S08_
  - “10.35111/rzpb-np15” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026S08> · docs · retrieved 2026-10-01 · quote check: exact
- **c068** The original CALLHOME American English Speech listing (LDC97S42) remains in the catalogue and links to the Second Edition (LDC2026S08) as a related version.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LDC97S42_
  - “CALLHOME American English Second Edition” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC97S42> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c046** LDC says each corpus catalogue page links to the required nonmember licence agreement.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Each corpus catalog page contains a link to the required nonmember license agreement” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/language-resources/data/obtaining> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c054** The CALLHOME American English Second Edition listing offers a downloadable audio sample in FLAC.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LDC2026S08_
  - “English Audio Sample (FLAC)” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026S08> · docs · retrieved 2026-10-01 · quote check: exact
- **c058** The MADCAT evaluation set listing names the LDC User Agreement for Non-Members as its licence and offers a TIF image sample.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LDC2026T05_
  - “LDC User Agreement for Non-Members” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026T05> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c017** The non-member agreement provides LDC Databases 'as is', with neither LDC, the University of Pennsylvania, its data providers nor corpus authors warranting them.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “ALL LDC DATABASES ARE PROVIDED “AS IS” AND NEITHER THE LINGUISTIC DATA CONSORTIUM, ITS HOST INSTITUTION” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** The for-profit agreement provides LDC Databases as-is, with LDC and its data providers and corpus authors making no representations or warranties.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “LDC, AND ITS DATA PROVIDERS AND CORPUS AUTHORS MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c070** LDC guest accounts cannot license data; a guest must register an organisation or affiliate with an existing one first.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Guest users cannot license data.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/user-accounts> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### transaction

- **c035** To become an LDC member an organisation must sign the appropriate membership agreement and pay a membership fee.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “To become a member, an organization must sign the appropriate membership agreement and pay a membership fee.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/join-ldc> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c039** LDC users can sign required membership and user agreements electronically on the checkout Agreement page.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Users may sign any required agreements (membership agreements, user agreements) electronically from the Agreement page.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/online-transactions> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c040** LDC accepts payment by credit card, check or wire transfer.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Payment can be made in one of three ways: credit card, check and wire transfer.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/online-transactions> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c041** LDC accepts institutional purchase orders in most instances and issues quotes or pro forma invoices on request.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC accepts institutional purchase orders in most instances and issues quotes or pro forma invoices upon request.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/online-transactions> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c043** LDC does not process an order until payment is received.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Your order will not be processed until payment is received.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/online-transactions> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c059** LDC's process is to place a corpus in the cart, digitally sign applicable licence agreements, check out, and then download.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “place it in your cart, digitally signed any applicable license agreements, checked out” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/accessing-ldc-data> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — LDC's own process text; www.ldc.upenn.edu/accessing-ldc-data (fetched 2026-10-01) states: select corpus, place it in cart, digitally sign applicable licence agreements, check out, receive 'shipped' notification, then download. It matches the claim; no independent source needed.
  - verifier (scope): **quote_incomplete** — The quote stops at 'checked out' and does not include the download step; the page's own sentence begins 'Your data is ready for download once you have selected your corpus' and ends with receiving notification that the data has been 'shipped'.
- **c071** LDC organisation users can join LDC, create quotes and invoices, license data and download datasets their organisation has access to.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “ability to join LDC, create and view quotes and invoices, license data, view agreements signed by the organization” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/user-accounts> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c073** LDC asks licensees to fax completed corpus-specific user agreements or scan and email them to its Membership Office.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Fax all completed user agreements to +1.215.573.2175 or scan and email them to the Membership Office” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using-data/user-agreements> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### pricing

- **c026** LDC's for-profit Standard membership costs USD 34,000 per calendar year and entitles the Member to up to 16 databases from the membership year.  
  _number · legal_text · as of 2026-10-01 (retrieved_only) · scope: For-Profit Membership, Standard_ · **34000 USD** (annual fee paid by a for-profit member; covers up to 16 databases from the membership year; per year)
  - “$34,000 per calendar year. Standard Member is entitled to receive up to 16 LDC Databases from the Membership Year” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — LDC's own price list. Live join page (www.ldc.upenn.edu/members/join-ldc, fetched 2026-10-01) shows For-Profit Standard $34,000 and 'free access to 16 corpora published in the membership year'; it states the fee per membership year, and the page's own wording is 'corpora', not 'databases'. Corpora-list archive search for '34,000' returned 0 messages; no university, procurement or press source reachable. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_ok** — Exhibit A of the For-Profit Membership Agreement PDF (re-extracted 2026-10-01) reads '$34,000 per calendar year. Standard Member is entitled to receive up to 16 LDC Databases from the Membership Year'. Tier and org type match. The PDF is an undated template ('effective January 1, ____'), and Section 1 says fees 'may be amended from time to time at the beginning of a new membership year'.
- **c027** LDC's for-profit Subscription membership costs USD 40,000 per calendar year and entitles the Member to all databases released in the membership year.  
  _number · legal_text · as of 2026-10-01 (retrieved_only) · scope: For-Profit Membership, Subscription_ · **40000 USD** (annual fee paid by a for-profit member; covers all databases released in the membership year; per year)
  - “$40,000 per calendar year. Subscription Member is entitled to automatically receive copies of all LDC Databases released” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — LDC's own price list. Join page shows For-Profit Subscription $40,000 with 'copies of each LDC dataset published in the membership year'. No independent source reachable (Corpora-list search, university library pages at U of T, Berkeley, MIT, Michigan and Stanford Linguistics tried; none states fees). No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_ok** — Matches Exhibit A ('$40,000 per calendar year ... copies of all LDC Databases released in the Membership Year'). The same exhibit adds 'LDC reserves the right to release Databases that require separate license agreements and additional fees', so 'all' has that exception; the profile records it separately as c029.
- **c028** A Standard for-profit Member may license further membership-year databases at the regular non-member licensing fee.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: For-Profit Membership, Standard_
  - “Additional LDC Databases from the Membership Year may be licensed at the regular, non-member licensing fee” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of LDC's own membership terms; no third party states it. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_ok** — Exhibit A: 'Additional LDC Databases from the Membership Year may be licensed at the regular, non-member licensing fee', placed under Standard Membership; matches.
- **c029** LDC reserves the right to release databases that require separate licence agreements and additional fees beyond membership.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “LDC reserves the right to release Databases that require separate license agreements and additional fees” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c030** LDC for-profit membership fees are non-refundable.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only)_
  - “Membership fees are non-refundable.” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** LDC's join page lists the for-profit Standard membership at USD 34,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership, For-profit Standard_ · **34000 USD** (membership fee for for-profit organisations, Standard tier, paid by the member; per year)
  - “Standard membership: $34,000” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/join-ldc> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Claim is about what LDC's own join page lists; fetched it 2026-10-01 and it shows For-Profit Standard $34,000. Nothing independent needed or found.
  - verifier (scope): **quote_incomplete** — The join page lists two 'Standard membership:' and two 'Subscription membership:' lines, under the headings 'Not-for-profit organizations and US Government entities' and 'For-Profit organizations'; the quote alone does not show which category it belongs to. The fee itself matches the live page (re-fetched 2026-10-01). Here the heading 'For-Profit organizations' is what would show the tier. The value's period 'per year' is not on the join page; it comes from the agreement PDF (c026).
- **c032** LDC's join page lists the for-profit Subscription membership at USD 40,000.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership, For-profit Subscription_ · **40000 USD** (membership fee for for-profit organisations, Subscription tier, paid by the member; per year)
  - “Subscription membership: $40,000” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/join-ldc> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Join page fetched 2026-10-01 shows For-Profit Subscription $40,000.
  - verifier (scope): **quote_incomplete** — The join page lists two 'Standard membership:' and two 'Subscription membership:' lines, under the headings 'Not-for-profit organizations and US Government entities' and 'For-Profit organizations'; the quote alone does not show which category it belongs to. The fee itself matches the live page (re-fetched 2026-10-01). Here the heading 'For-Profit organizations' is what would show the tier. The value's period 'per year' is not on the join page; it comes from the agreement PDF (c027).
- **c033** LDC's join page lists the not-for-profit and US government Standard membership at USD 2,400.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership, Not-for-profit / US government Standard_ · **2400 USD** (membership fee for not-for-profit organisations and US government, Standard tier, paid by the member; per year)
  - “Standard membership: $2,400” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/join-ldc> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Join page fetched 2026-10-01 shows Not-for-Profit & US Government Standard $2,400. No university library page reachable that restates the fee (U of T page only says U of T 'is a subscriber'; its detail sits on a gated SharePoint site). No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **quote_incomplete** — The join page lists two 'Standard membership:' and two 'Subscription membership:' lines, under the headings 'Not-for-profit organizations and US Government entities' and 'For-Profit organizations'; the quote alone does not show which category it belongs to. The fee itself matches the live page (re-fetched 2026-10-01). Here the heading 'Not-for-profit organizations and US Government entities' is what would show the tier. The value's period 'per year' is not stated on the join page, and no cited source states it for not-for-profit members.
- **c034** LDC's join page lists the not-for-profit and US government Subscription membership at USD 3,850.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership, Not-for-profit / US government Subscription_ · **3850 USD** (membership fee for not-for-profit organisations and US government, Subscription tier, paid by the member; per year)
  - “Subscription membership: $3,850” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/join-ldc> · pricing_page · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — Join page fetched 2026-10-01 shows Not-for-Profit & US Government Subscription $3,850. No independent restatement reachable. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **quote_incomplete** — The join page lists two 'Standard membership:' and two 'Subscription membership:' lines, under the headings 'Not-for-profit organizations and US Government entities' and 'For-Profit organizations'; the quote alone does not show which category it belongs to. The fee itself matches the live page (re-fetched 2026-10-01). Here the heading 'Not-for-profit organizations and US Government entities' is what would show the tier. The value's period 'per year' is not stated on the join page, and no cited source states it for not-for-profit members.
- **c036** LDC says members can license older datasets at discounts of up to 50%.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership_ · **50 percent discount (maximum)** (discount for members on data outside the membership year, off the non-member fee; exact basis not stated; not stated)
  - “significant discounts (up to 50%)” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/membership-benefits> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — The 'up to 50%' figure could not be found anywhere but LDC's site. LDC's own newsletters relayed on the Corpora list (Nov 2022-Nov 2025) say only that members license older data 'at reduced fees' with no percentage (e.g. Nov 2025: 'Current LDC members enjoy the benefit of licensing at reduced fees older data from our Catalog'), and separately offer a 10% early-renewal discount off the membership fee, which is a different discount. On LDC's own site the figure is on the membership-benefits page ('license older data sets at significant discounts (up to 50%)'), not the join page. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_ok** — Membership-benefits page reads 'license older data sets at significant discounts (up to 50%)'. The statement correctly says 'LDC says'. The basis 'off the non-member fee' in value is the profiler's inference; the page does not state what the discount is off.
- **c055** LDC corpus pages do not show the licence fee publicly; an anonymous visitor sees 'Login for the applicable fee'.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: LDC2026S08_
  - “Login for the applicable fee” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026S08> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** LDC's data scholarship programme gives eligible students no-cost access to LDC data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The data scholarship program provides eligible students with no-cost access to LDC data.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/language-resources/data/data-scholarships> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### licence

- **c009** LDC not-for-profit members, government members and nonmember licensees may use LDC data only for noncommercial linguistic research and education.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC Not-For-Profit members, government members and nonmember licensees may use LDC data for noncommercial linguistic research” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using/licensing> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A clause of LDC's own licences. Third-party echo is weaker than the claim: the Hugging Face ptb_text_only card says only 'Dataset provided for research purposes only'. Note that LDC's accessing-data page words its standard terms more broadly: 'use for language-related education, research and technology development'. The Part 2 scope check should confirm the narrower 'noncommercial linguistic research and education' wording against the non-member agreement.
  - verifier (scope): **quote_incomplete** — The quote is cut before the words that carry the restriction. The page's full sentence ends 'may use LDC data for noncommercial linguistic research and education only.' Those final words ('and education only') support 'only' and 'education'. The fact is right.
- **c010** A for-profit organisation that does not renew LDC membership retains ongoing commercial rights to data from its membership year.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If the organization does not renew its membership for the following year, it still retains ongoing commercial rights to data” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using/licensing> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c011** A for-profit nonmember that later joins LDC can gain commercial rights to data it had already licensed as a nonmember.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “If that organization joins LDC at some future time, it can gain commercial rights to any data already licensed” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using/licensing> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c012** Certain LDC datasets carry corpus-specific licence agreements that supersede LDC membership agreements and must be signed by all licensees.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Certain LDC data sets are governed by corpus-specific license agreements which supersede the LDC membership agreements” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using/licensing> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c013** Nonmembers licensing LDC data must sign the LDC User Agreement for Non-Members.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Nonmembers who license data from LDC must sign the LDC User Agreement for Non-Members.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/using/licensing> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — A requirement in LDC's own licensing process. Partial third-party echo only: the Hugging Face card for ptb_text_only (huggingface.co/datasets/ptb-text-only/ptb_text_only) names 'license_details: LDC User Agreement for Non-Members', which shows the agreement governs non-member use of Penn Treebank but not that every non-member must sign it. LDC's accessing-data page says users must have 'digitally signed any applicable license agreements' before checkout.
  - verifier (scope): **scope_ok** — Licensing page sentence quoted in full; matches.
- **c014** The LDC User Agreement for Non-Members limits use of LDC Databases to non-commercial linguistic education, research and technology development.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “only for non-commercial linguistic education, research and technology development” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** Under the non-member agreement, a user whose use results in a commercial product must join LDC as a For-Profit Member and pay all fees before releasing it.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “User must join LDC as a For-Profit Member and pay all applicable fees prior to release of said commercial product” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** The non-member agreement bars publishing, copying or redistributing the LDC Databases outside the user's research group, save limited excerpts in publications.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “User shall not otherwise publish, retransmit, disclose, display, copy, reproduce or redistribute the LDC Databases to others” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** The LDC For-Profit Membership Agreement lets the Member incorporate portions of LDC Databases into its own work products, including for commercial purposes.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “Member may incorporate portions of the LDC Databases into its own work products, including for commercial purposes” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** The for-profit agreement says LDC grants the Member the same rights LDC has obtained in all LDC Databases.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “LDC shall grant to Member the same rights LDC has obtained in all LDC Databases” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c022** The for-profit licence is limited to use solely at the geographical sites the Member lists in Exhibit B.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “solely at the geographical sites listed in Exhibit B” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** For certain databases the for-profit Member must restrict access to staff who have signed separate user agreements, and keep those on file for LDC inspection.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “Member shall maintain all signed user agreements on file for inspection by LDC upon its request” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** The for-profit Member must defend, indemnify and hold harmless LDC against claims from use that violates the agreement or law; LDC gives no indemnity.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: for-profit member_
  - “Member shall defend, indemnify and hold harmless LDC, its employees, trustees, officers, and agents” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c037** LDC says membership allows unlimited use within an organisation, with no cost difference between departmental and organisation-wide membership.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership_
  - “Unlimited use within an organization” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/membership-benefits> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c038** LDC says members get a perpetual licence for membership-year data and data requested while an active member.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Membership_
  - “Perpetual license for membership year data and data requested while an active member” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/membership-benefits> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c045** LDC says most corpora are available to nonmember organisations under research-only licences.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Most corpora distributed by LDC are available to nonmember organizations under research-only licenses” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/language-resources/data/obtaining> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c064** LDC's September 2026 newsletter states that LDC membership is a prerequisite for a commercial licence to almost all LDC databases.  
  _event · vendor_stated · as of 2026-09 (page_dated)_
  - “an LDC membership is a pre-requisite for obtaining a commercial license to almost all LDC databases” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/communications/newsletter/september-2026-newsletter> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_relayed** — Same September 2026 newsletter as relayed to the Corpora list by LDC itself (15 Sep 2026). The November 2025 newsletter on the same list adds 'Current-year for-profit members may use most data for commercial applications.' No independent source found. No web search available in this run (WebSearch not used by instruction).
    - “an LDC membership is a pre-requisite for obtaining a commercial license to almost all LDC databases” — Corpora mailing list archive (ELRA), message posted by Penn LDC, <https://list.elra.info/mailman3/hyperkitty/list/corpora@list.elra.info/message/PHZXXA6TJGEZ5TJIQPS3DEY6UKSH24AX/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the statement word for word. Minor: this is a licensing term restated in a newsletter, so kind 'terms' fits better than 'event'.
- **c065** LDC's September 2026 newsletter states that non-member organisations, including for-profits, cannot use LDC data to develop or test commercial products.  
  _terms · vendor_stated · as of 2026-09 (page_dated)_
  - “Non-member organizations, including non-member for-profit organizations, cannot use LDC data to develop or test products” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/communications/newsletter/september-2026-newsletter> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### custody

- **c018** Under the non-member agreement, the user receives the named corpora on media such as hard drive, electronic files or web download.  
  _architecture · legal_text · as of 2026-10-01 (retrieved_only) · scope: non-member_
  - “User will receive media (CD-ROM, DVD, hard drive, electronic files, web download or other media as appropriate)” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c042** LDC fulfils orders by shipping data or by providing download instructions.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Orders are fulfilled by shipping data or by providing instructions for downloading data.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/members/managing-your-ldc-account/online-transactions> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — LDC's own fulfilment mechanics. LDC's accessing-data page says data is 'ready for download' after checkout and a notification that it has been 'shipped'. No third party describes fulfilment.
  - verifier (scope): **scope_ok** — Quote states exactly this.
- **c044** LDC says data is in most cases distributed by download from its member portal, with very large corpora sent on hard drive or USB flash drive.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “In most cases, data is distributed via download from LDC's member portal.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### vetting

- **c050** For human-subjects data, LDC requires providers to state IRB or ethics approval and list the consent elements, including consent to sharing in a corpus.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “list the elements of consent, including that participants consented to sharing their data in a corpus” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **vendor_only** — LDC's own requirements for data providers (submission guidance); no third party restates them. No web search available in this run (WebSearch not used by instruction).
  - verifier (scope): **scope_wrong** — The page requires providers of human-subjects data to 'indicate whether the collection was approved by an Institutional Review Board, Ethics Board, or similar body', which means saying whether it was approved, not stating an approval. The statement 'state IRB or ethics approval' reads as if approval were required. The quote also covers only the consent-elements half. Suggested wording: 'LDC requires providers of human-subjects data to indicate whether an IRB or ethics board approved the collection and to list the consent elements, including consent to sharing in a corpus.'
- **c051** LDC says it performs extensive quality control checks so that published data is complete, error free and ready to use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC performs extensive quality control checks to ensure that published data is complete, error free and ready to use.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c069** LDC's documentation guidelines ask providers of human-subjects data to include demographic information and related metadata; they do not list consent records.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “For data collected from human subjects, providers should also include any demographic information and related metadata” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/documentation-guidelines> · docs · retrieved 2026-10-01 · quote check: fetch_failed

### catalogue_custom

- **c007** LDC lists services including data collection, transcription, translation, and image and video labeling.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “data collection, processing and analysis; speech transcription, alignment, labeling and coding” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/a-closer-look-at-ldc> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c008** LDC's service list includes image and video labeling.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “image and video labeling” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/a-closer-look-at-ldc> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed
- **c061** LDC says it partners with US government agencies, including the Departments of Commerce, Defense and Homeland Security, on sponsored work.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “LDC partners with US government agencies (including the Departments of Commerce, Defense, Education, Homeland Security” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/collaborations> · vendor_marketing · retrieved 2026-10-01 · quote check: fetch_failed

### changes

- **c004** LDC's catalogue was still releasing new corpora on retrieval: CALLHOME American English Second Edition (LDC2026S08) was released on 15 July 2026.  
  _status · vendor_stated · as of 2026-07-15 (page_dated) · scope: LDC2026S08_
  - “July 15, 2026” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/LDC2026S08> · docs · retrieved 2026-10-01 · quote check: exact
- **c005** LDC's catalogue lists 2026 releases including LORELEI, MATERIAL, KAIROS and CALLHOME Second Edition corpora (catalog IDs LDC2026*).  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “CALLHOME American English Second Edition” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/byyear> · docs · retrieved 2026-10-01 · quote check: exact
- **c052** LDC says corpora are announced and released around the 15th of each month.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “Corpora are announced and released around the 15th of each month.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c063** LDC's September 2026 newsletter announced new releases including CALLHOME Mandarin Chinese Second Edition (LDC2026S11).  
  _status · vendor_stated · as of 2026-09 (page_dated)_
  - “CALLHOME Mandarin Chinese Second Edition” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/communications/newsletter/september-2026-newsletter> · docs · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_relayed** — The September 2026 LDC newsletter, as sent by Penn LDC (ldc@ldc.upenn.edu) to the ELRA-hosted Corpora list on 15 Sep 2026, lists CALLHOME Mandarin Chinese Second Edition linked to catalog.ldc.upenn.edu/LDC2026S11, plus CALLHOME Mandarin Chinese Lexicon Second Edition (LDC2026L06) and MATERIAL Lithuanian-English Language Pack (LDC2026S12). Same text as LDC's own newsletter, so relayed, not independent. No web search available in this run (WebSearch not used by instruction).
    - “New publications: CALLHOME Mandarin Chinese Second Edition” — Corpora mailing list archive (ELRA), message posted by Penn LDC, <https://list.elra.info/mailman3/hyperkitty/list/corpora@list.elra.info/message/PHZXXA6TJGEZ5TJIQPS3DEY6UKSH24AX/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The fact is right (LDC's newsletter page and the Corpora-list copy both link the title to catalog.ldc.upenn.edu/LDC2026S11), but the quote 'CALLHOME Mandarin Chinese Second Edition' does not show the catalog ID or that it is a new release; the words 'New publications: CALLHOME Mandarin Chinese Second Edition' would.

### demand

- **c066** LDC's July 2026 newsletter announced Fall 2026 data scholarship applications open through 15 September 2026.  
  _event · vendor_stated · as of 2026-07-15 (page_dated)_
  - “Student applications for the Fall 2026 LDC data scholarship program are being accepted now through September 15, 2026.” — Linguistic Data Consortium, <https://www.ldc.upenn.edu/communications/newsletter/july-2026-newsletter> · docs · retrieved 2026-10-01 · quote check: fetch_failed
- **c072** LDC's list of its ten most-distributed corpora is headed by OntoNotes Release 5.0 and TIMIT, both text and speech resources.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “OntoNotes Release 5.0” — Linguistic Data Consortium, <https://catalog.ldc.upenn.edu/topten> · docs · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** LDC's November 2025 newsletter offered a 10% discount off the membership fee to any organisation joining or renewing before 2 March 2026.  
  _number · press_relayed · as of 2025-11-17 (publication) · scope: Membership, all membership types_ · **10 percent discount** (off the annual membership fee, for organisations joining or renewing before 2 March 2026; paid by the member; membership year 2026)
  - “will receive a 10% discount off the membership fee” — Corpora mailing list archive (ELRA), message posted by Penn LDC, <https://list.elra.info/mailman3/hyperkitty/list/corpora@list.elra.info/message/AKIQJ4ZRWE4JJVP22PSBG3OBVEYQBTAE/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.who_pays_fee` — not_published; tried <https://www.ldc.upenn.edu/data-management/providing-data>, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process>, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf>
- `matrix.exclusivity_offered` — not_published; tried <https://www.ldc.upenn.edu/data-management/using/licensing>, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf>, <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf>, <https://www.ldc.upenn.edu/members/membership-benefits>
- `matrix.human_subject_consent_docs` — not_published; tried <https://www.ldc.upenn.edu/data-management/providing-data/publication-process>, <https://www.ldc.upenn.edu/data-management/providing-data/documentation-guidelines>, <https://catalog.ldc.upenn.edu/LDC2026S08>, <https://catalog.ldc.upenn.edu/LDC2026T05>
- `matrix.contributor_pay_model` — not_published; tried <https://www.ldc.upenn.edu/data-management/providing-data>, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process>, <https://www.ldc.upenn.edu/collaborations>, <https://submissions.ldc.upenn.edu/>
- `matrix.erasure_after_sale` — not_published; tried <https://catalog.ldc.upenn.edu/license/ldc-non-members-agreement.pdf>, <https://catalog.ldc.upenn.edu/license/ldc-for-profit-membership.pdf>, <https://www.ldc.upenn.edu/data-management/using/licensing>, <https://www.ldc.upenn.edu/data-management/using-data/user-agreements>
- `other.per_corpus_nonmember_prices` — gated; tried <https://catalog.ldc.upenn.edu/LDC2026S08>, <https://catalog.ldc.upenn.edu/LDC2026T05>, <https://catalog.ldc.upenn.edu/LDC97S42>, <https://www.ldc.upenn.edu/language-resources/data/obtaining>
- `other.provider_royalties` — not_published; tried <https://www.ldc.upenn.edu/data-management/providing-data>, <https://www.ldc.upenn.edu/data-management/providing-data/publication-process>, <https://submissions.ldc.upenn.edu/>
- `other.independent_sources` — not_found; tried <https://export.arxiv.org/api/query?search_query=all:%22Linguistic%20Data%20Consortium%22%20AND%20all:licensing&max_results=10>, <https://arxiv.org/a/cieri_c_1>
- `other.submissions_portal` — blocked; tried <https://submissions.ldc.upenn.edu/>
- `questions.Q4` — not_published; tried <https://www.ldc.upenn.edu/collaborations>, <https://www.ldc.upenn.edu/data-management/providing-data>

## Leads, not cited

- <http://ldc-upenn.blogspot.com/> — LDC blog; not fetched. May hold history of licence/fee changes.
- <https://www.ldc.upenn.edu/sites/www.ldc.upenn.edu/files/lrec2020-related-works-ldc-catalog.pdf> — LDC's LREC 2020 paper on catalogue related works; may describe versioning.
- <https://catalog.ldc.upenn.edu/license/LDC%20Not-for-Profit%20Membership%20Agreement.pdf> — Not-for-profit membership agreement; not read in this run.
- <https://www.ldc.upenn.edu/data-management/providing-data/technical-guidelines> — Provider technical guidelines; not read.
- <https://www.ldc.upenn.edu/communications/data-sheets> — LDC data sheets; may state traction numbers.
