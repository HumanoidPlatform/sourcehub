# Hugging Face Hub (datasets)

community_hub · light · status: **active** · also known as Hugging Face, Hugging Face, Inc., HF Hub

> Rendered from `ledger/hugging-face-hub.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “Datasets (the Hugging Face Hub's dataset repositories; 'gated datasets' for access-controlled ones)” and its bespoke side “none found: no bespoke data-collection offer was seen on the pricing page or Hub docs”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | venue | c014, c015, c016, c063, c066 | Hugging Face hosts; the uploader keeps ownership, sets the licence and grants it; HF takes only a licence to provide the service. |
| economics_model | free | c014, c034, c043, c045 | No per-dataset sale or fee: downloads are free. HF monetises hosting (subscriptions, storage, compute) paid by uploaders and teams, not transactions. |
| who_pays_fee | not_applicable | c034 | No transaction fee exists; storage and plan fees fall on the account that hosts or uses them. |
| supply_models | contributor_uploads, third_party_providers, own_collection, public_or_scraped | c076, c066, c072, c054, c077 | Open uploads by any account; organisations such as NVIDIA and GenRobot publish their own datasets; HF's own team publishes web-scraped corpora such as FineWeb. |
| custody_model | platform_hosted | c060, c057, c041 | Files sit in HF's Xet/Git storage and are served via CDN; users download or clone copies. Some third-party datasets are links-only, but the Hub's model is hosting. |
| transaction_mode | free_download | c003, c071, c060 | Free download, optionally behind an author-run access gate; no checkout. |
| public_prices | not_applicable | c043, c037 | Datasets carry no price; only plans and storage are priced. |
| licence_model | provider_defined | c063, c064, c024, c066, c072 | Each author picks a licence identifier or a custom 'other' licence; gated datasets can require acceptance of the provider's own agreement. |
| exclusivity_offered | unknown |  | No exclusivity mechanism found; the licences seen (open licences, NVIDIA's) are non-exclusive, but off-platform deals cannot be ruled out. |
| public_listing | public_indexable | c027, c030, c047 | Public dataset pages and cards are open to anonymous visitors; gated datasets show the card but files require an account and accepted request; private datasets are hidden. |
| buyer_vetting | case_by_case | c004, c009, c003, c012 | HF itself checks nothing beyond an account for gated files; each author chooses no gate, an automatic gate, or manual approval with custom fields. |
| sample_mechanics | preview_in_browser | c030, c031, c032 | Data Studio shows rows, column distributions and SQL over the first 5GB of large non-Parquet datasets. |
| versioning | mixed | c057, c059, c039, c061, c062 | Git commits give pinnable revisions and DOIs can freeze a version, but the default branch is mutable and owners can squash history or delete repos. |
| human_subject_consent_docs | not_addressed | c073, c016, c026 | The platform asks for no consent evidence; the card template invites an optional personal-information statement, and the uploader's warranty runs to HF, not to downloaders. |
| contributor_pay_model | not_applicable | c014, c015 | Nothing is sold, so uploaders are not paid; the licence they grant HF is royalty-free. |
| catalogue_plus_custom | catalogue_only | c076, c047 | Hosting and discovery of ready-made datasets only; no collect-to-order offer found. |
| erasure_after_sale | takedown_only | c019, c029, c028, c005 | HF can remove or disable content and authors can revoke gated access, but no platform term obliges downloaders to delete copies; some provider licences (e.g. NVIDIA's) do. |
| quality_evidence | provider_asserted | c022, c025, c030 | Quality statements are the author's own card text; HF supplies an automatic viewer and statistics but does not verify claims. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Usage is measured in developers and downloads, not purchases: HF-side counts of hosted datasets range from 500k public to over 1M, with 18M+ developers; no data on paying buyers or units exists because access is free. | c047, c055, c056, c053 |
| Q2 | partial | Providers get free public hosting, a rendered card, an in-browser viewer, library integrations and an audience; HF asks in return that large datasets be useful for community reuse and charges for private and above-quota storage. | c034, c035, c036, c030, c076, c045 |
| Q3 | sourced | Inventory comes from any account holder's uploads, from organisations publishing their own datasets (NVIDIA, GenRobot) and from HF's own scraped corpora; each is listed on the uploader's own warranty of rights and chosen licence. | c076, c016, c066, c072, c077, c054 |
| Q4 | not_applicable | HF commissions no data and sells none, so there is no resale carve-out; no after-the-fact change to uploader terms was found (ToS dated 2022-09-15). |  |
| Q5 | sourced | HF is a venue: uploaders own their content, warrant their rights to HF, choose the licence and indemnify HF, which disclaims all warranties; the licensor of record is the dataset author. | c014, c015, c016, c017, c018, c063 |
| Q6 | sourced | Platform-hosted: datasets are Xet-backed Git repositories on HF storage, served via CDN, and users download, clone or stream copies to their own machines. | c060, c057, c041, c058 |
| Q7 | partial | The platform requires no consent evidence from capturers, subjects or property owners; the uploader warrants rights, the content policy bars publishing others' private information without permission, and the card template invites an optional personal-data statement. Individual providers add their own terms (NVIDIA data-subject cooperation, FineWeb PII removal form). | c016, c026, c073, c074, c070, c078 |
| Q8 | sourced | Licences are author-defined (open licences or custom text); HF offers gating with custom acceptance fields, EU geo-blocking, access revocation and JSON access reports, but no fingerprinting or audit; downloaded copies are outside its control except where a provider licence demands destruction. | c063, c064, c009, c010, c011, c005, c008, c069, c068, c065 |
| Q9 | sourced | No deals close on HF: access is a free download, optionally behind an author-run gate with automatic or manual approval; HF earns from subscriptions and storage, not commission. | c003, c004, c071, c034, c042, c043, c021 |
| Q10 | partial | A dataset is a Git repository with a README card; versions are commits, branches or tags loadable by revision, and DOIs can pin a revision. Entitlements are per-user gate approvals that the author can reset or revoke; owners can squash history. | c022, c057, c059, c061, c062, c039, c002, c006, c007 |
| Q11 | sourced | Before downloading, anyone can read the dataset card and browse rows, distributions and SQL results in Data Studio; gated datasets still show the card. Quality evidence is the author's own card. | c022, c023, c030, c031, c032, c027, c025, c075 |
| Q12 | partial | Only the catalogue side exists: 'Datasets' on the Hub. No bespoke collection offer was found on pricing or Hub documentation pages. | c076, c044 |

## Claims

### supply

- **c035** Hugging Face asks that large uploaded datasets be as useful to the community as possible, measured for instance by likes or downloads.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “make sure any uploaded large model or dataset is **as useful to the community as possible**” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c036** Hugging Face requires large hosted datasets to be shared to enable community reuse and to carry a dataset card.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “You are sharing the dataset to enable community reuse.” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c054** Nvidia's CEO said, as reported by TechCrunch, that Nvidia has released more than 250 open datasets on Hugging Face.  
  _number · press_relayed · as of 2026-09-03 (publication) · scope: Hugging Face Hub datasets_ · **250 open datasets** (released by NVIDIA on Hugging Face, per its CEO as relayed by TechCrunch; cumulative)
  - “the chip company has released more than 500 models and 250 open datasets on Hugging Face” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Probably the profile's own source; it relays Jensen Huang's statement and shows he said it, not that the count is right. No search available to find an independent count of NVIDIA's datasets on the Hub.
    - “the chip company has released more than 500 models and 250 open datasets on Hugging Face” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**
- **c076** Any Hugging Face account holder can upload datasets to the Hub as well as discover them.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “On it, you'll be able to upload and discover” — Hugging Face, <https://huggingface.co/docs/hub/index> · docs · retrieved 2026-10-01 · quote check: exact
- **c077** Hugging Face's own FineWeb dataset consists of more than 18.5T tokens of English web data taken from CommonCrawl.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: HuggingFaceFW/fineweb_
  - “FineWeb dataset consists of more than 18.5T tokens of cleaned and deduplicated english web data from CommonCrawl” — Hugging Face, <https://huggingface.co/datasets/HuggingFaceFW/fineweb/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: fuzzy 1.00
  - verifier (blind): **unverifiable** — The FineWeb paper (v2, 2024-10-31; authors are HF staff) confirms English-only web text from Common Crawl ('keep only English text', arxiv.org/html/2406.17557v2) and that it is HF's own release, but gives 15T tokens from 96 snapshots. The 18.5T figure presumably reflects snapshots added later and appears only on the dataset card; no independent dated source for it was reachable without search. Not refuted: the paper is older than the card.
    - “a 15-trillion token dataset derived from 96 Common Crawl snapshots” — arXiv (Penedo et al., The FineWeb Datasets), <https://arxiv.org/abs/2406.17557> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote states the 18.5T, English and CommonCrawl facts for the live card. The 2024 paper gives 15T from 96 snapshots, so the figure is version-dependent.

### object_model

- **c039** A Hugging Face repo owner can squash a repository's whole Git history into one commit, permanently losing earlier revisions.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “This is a destructive operation that cannot be undone, commit history will be permanently lost” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c040** The Hugging Face Hub uses Git to version the data in a dataset repository.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Under the hood, the Hub uses Git to version the data” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c057** The Hugging Face Hub hosts datasets as Git-based, version-controlled repositories with commit history, diffs and branches.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “The Hub offers **versioning, commit history, diffs, branches, and over a dozen library integrations**!” — Hugging Face, <https://huggingface.co/docs/hub/index> · docs · retrieved 2026-10-01 · quote check: exact
- **c059** A Hugging Face dataset user can load a specific version by Git tag, branch or commit hash with the revision parameter.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Use the `revision` parameter to specify the dataset version you want to load” — Hugging Face, <https://huggingface.co/docs/datasets/loading> · docs · retrieved 2026-10-01 · quote check: exact
- **c061** Hugging Face can mint a DataCite DOI for a dataset, and a new DOI can be assigned for each new revision.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “a new DOI is assigned for the current revision of your model or dataset” — Hugging Face, <https://huggingface.co/docs/hub/doi> · docs · retrieved 2026-10-01 · quote check: exact
- **c062** A Hugging Face dataset with a DOI may only be deleted, renamed or have its visibility changed on request to support.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “datasets/models with DOIs are intended to persist perpetually” — Hugging Face, <https://huggingface.co/docs/hub/doi> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c022** A Hugging Face dataset card is the repository's README.md, which the Hub renders on the dataset's main page.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “This file is called a **dataset card**, and the Hugging Face Hub will render its contents on the dataset's main page.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-cards> · docs · retrieved 2026-10-01 · quote check: exact
- **c027** Hugging Face's Content Policy defines gated repositories as visible to everyone, with artifact access requiring accepted conditions or maintainer approval.  
  _terms · legal_text · as of 2025-04-10 (page_dated) · scope: Hugging Face Hub datasets_
  - “Gated Repositories and their Community Content are visible to everyone” — Hugging Face, <https://huggingface.co/content-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c058** On Hugging Face organisations and individuals can keep datasets private to comply with licensing or privacy issues.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “organizations and individuals can create private datasets to comply with licensing or privacy issues” — Hugging Face, <https://huggingface.co/docs/hub/index> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c023** Dataset card YAML metadata records licence, language, size and tags used to filter and discover datasets on the Hub.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “The metadata describes important information about a dataset such as its license, language, and size.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-cards> · docs · retrieved 2026-10-01 · quote check: exact

### trust

- **c001** On the Hugging Face Hub a dataset author can enable access requests, making it a gated dataset whose files require sharing username and email with the author.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “share their contact information (username and email address) with the datasets authors to access the datasets files” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c017** Hugging Face disclaims all warranties on the Services and Content, which are provided as is, including non-infringement.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “The Services and Content are provided "as is" and "as available"” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c025** Hugging Face recommends, but does not require, that a dataset card describe potential biases in the dataset.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “it's a good idea to include information about any potential biases within the dataset” — Hugging Face, <https://huggingface.co/docs/hub/datasets-cards> · docs · retrieved 2026-10-01 · quote check: exact
- **c030** Each Hugging Face dataset page includes an in-browser table of the dataset's contents, paged 100 rows at a time.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Each dataset page includes a table with the contents of the dataset, arranged by pages of 100 rows.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-viewer> · docs · retrieved 2026-10-01 · quote check: exact
- **c031** Hugging Face's dataset viewer lets visitors run SQL queries on a dataset in the browser via a SQL Console.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “You can run SQL queries on the dataset in the browser using the SQL Console.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-viewer> · docs · retrieved 2026-10-01 · quote check: exact
- **c032** For non-Parquet datasets over 5GB the Hugging Face viewer shows only the first 5GB.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **5 GB previewed** (viewer limit for datasets over 5GB not in Parquet; per dataset)
  - “the Dataset Viewer only shows the first 5GB” — Hugging Face, <https://huggingface.co/docs/hub/datasets-viewer> · docs · retrieved 2026-10-01 · quote check: exact
- **c073** Hugging Face's dataset card template asks the author to state whether the data contains personal or sensitive information and describe any anonymisation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “State whether the dataset contains data that might be considered personal, sensitive, or private” — Hugging Face, <https://raw.githubusercontent.com/huggingface/huggingface_hub/main/src/huggingface_hub/templates/datasetcard_template.md> · docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **confirmed_independent** — Table 1 ('Community-Endorsed Dataset Card Structure') lists a 'Personal and Sensitive Information' section with this description (the PDF text runs words together). Confirms the personal or sensitive information prompt only; the anonymisation part of the claim is not in this source. The paper also found only 30.9% of HF dataset repositories (7,433 of 24,065, at the time of study) had non-empty cards, so the template is a prompt, not a requirement.
    - “Statement of whether the dataset contains other data that might be considered sensitive” — arXiv (Yang, Liang and Zou, ICLR 2024), <https://arxiv.org/pdf/2401.13822v1> · academic · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (scope): **quote_incomplete** — The quote covers personal or sensitive data only. The anonymisation half is in the template's next sentence: 'If efforts were made to anonymize the data, describe the anonymization process.' Note that template sections are optional and default to '[More Information Needed]'.
- **c074** Hugging Face's dataset card template has a section for describing the people or systems who originally created the data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “This section describes the people or systems who originally created the data.” — Hugging Face, <https://raw.githubusercontent.com/huggingface/huggingface_hub/main/src/huggingface_hub/templates/datasetcard_template.md> · docs · retrieved 2026-10-01 · quote check: missing 0.00
- **c075** Reporting a Hugging Face repository opens a public discussion on it.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Once you do this, a **public discussion** will be opened.” — Hugging Face, <https://huggingface.co/docs/hub/moderation> · docs · retrieved 2026-10-01 · quote check: exact

### transaction

- **c002** Hugging Face gated-dataset access is granted to individual user accounts, not to whole organisations.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Access requests are always granted to individual users rather than to entire organizations.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c007** Hugging Face exposes API endpoints for authors to list, accept, reject, reset and grant gated-dataset access requests programmatically.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “You can automate the approval of access requests by using the API.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c013** Hugging Face Team and Enterprise subscribers can use Gating Group Collections to grant or reject access to all datasets in a collection at once.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets, Team & Enterprise_
  - “can create a Gating Group Collection to grant (or reject) access to all the models and datasets in a collection at once” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c021** Hugging Face paid plans are billed monthly in advance with usage-based overage fees, and fees are non-refundable.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “The plan is billed in advance on a monthly basis” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c033** For private datasets the Hugging Face viewer is enabled only for PRO users and Team or Enterprise organisations.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “For **private** datasets, the Dataset Viewer is enabled for [PRO users]” — Hugging Face, <https://huggingface.co/docs/hub/datasets-viewer> · docs · retrieved 2026-10-01 · quote check: exact
- **c034** Hugging Face offers free storage for public repositories and bills private storage above a free tier.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “We also bill for storage space for **private repositories**, above a free tier” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — HF's own pricing terms; no search available.
  - verifier (scope): **quote_incomplete** — The quote covers only the private-storage half. The public half is in the page's first sentence: 'significant volumes of free storage space for public repositories'. Free public storage is not unlimited: it is 'Best-effort' for free accounts, capped per plan (PRO up to 10TB; Team 12TB base + 1TB per seat), and extended by a paid Public Storage add-on (c038). The economics_model note should not read it as unlimited.
- **c037** Hugging Face charges pay-as-you-go private storage above the included allowance at a base price of $18 per TB per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **18 USD per TB** (paid by the account owner for private storage above the included allowance; base tier, discounts from 50TB; per month)
  - “at a base price of $18/TB/mo” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — HF's own storage price; no search available to find a partner or reseller restating it, and none was linked from pages fetched.
  - verifier (scope): **scope_ok** — Re-read storage-limits: pay-as-you-go applies above the included 1TB (PRO) or 1TB per seat (Team, Enterprise) of private storage at $18/TB/mo, falling to $16, $14 and $12 at 50TB+, 200TB+ and 500TB+. The value basis says this.
- **c038** Hugging Face sells a public storage add-on for paid plans at $12 per TB per month (1-20 TB tiers).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **12 USD per TB** (paid by the uploading account on PRO/Team/Enterprise for public storage above plan base; $10/TB at 50TB; per month)
  - “$12/TB/month” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** Hugging Face's PRO personal account is priced at $9 per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **9 USD per user** (paid by the individual account holder; plan price, not a dataset price; per month)
  - “$9 /month” — Hugging Face, <https://huggingface.co/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c043** Hugging Face's Team plan is priced at $20 per user per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **20 USD per user** (paid by the organisation per seat; plan price, not a dataset price; per month)
  - “$20 /month per user” — Hugging Face, <https://huggingface.co/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — HF's own plan price; no search available.
  - verifier (scope): **quote_incomplete** — Fact correct (pricing page: Team $20/month per user; PRO $9/month; Enterprise $50/month per user), but the quote '$20 /month per user' does not name the Team plan. The page's words 'Instant setup for growing teams' sit directly before the price and would show which plan it is.
- **c044** Hugging Face's Enterprise plan is listed from $50 per user per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **50 USD per user** (paid by the organisation per seat; plan price, not a dataset price; per month)
  - “$50 /month per user” — Hugging Face, <https://huggingface.co/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c045** Hugging Face's pricing page lists Hub storage for public repositories at a base $12 per TB per month.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **12 USD per TB** (paid by the uploading account for public repo storage; base tier, falling to $8/TB at 500TB+; per month)
  - “$12 /TB/mo” — Hugging Face, <https://huggingface.co/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact
- **c046** Hugging Face's paid plans list the dataset viewer for private datasets as a plan feature.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Dataset Viewer for private datasets” — Hugging Face, <https://huggingface.co/pricing> · pricing_page · retrieved 2026-10-01 · quote check: exact

### licence

- **c005** Hugging Face dataset authors can block an approved user's access at any time without prior notice, whatever the approval mode.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “they can decide at any time to block your access to the dataset without prior notice” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c006** Setting a Hugging Face access request to 'reset' revokes access and forces the user to re-accept the gating terms and request again.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Setting a request to `reset` revokes the previous decision and asks the user to start over” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c010** Hugging Face's documented gate example asks for company and country and a checkbox acknowledging non-commercial use only.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “the user is asked to provide their company name and country and acknowledge that the dataset is for non-commercial use only” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c014** Under Hugging Face's Terms of Service uploaders keep ownership of their content and Hugging Face says it will not sell it.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “You own the Content you create! We will not sell your Content” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of HF's own Terms of Service. NVIDIA's 8-K adds only a commitment to keep the platform open and let users upload and download datasets of their choosing; it says nothing on ownership or sale of content.
  - verifier (scope): **scope_ok** — ToS effective date 15 September 2022, matching as_of.
- **c015** Uploaders grant Hugging Face a worldwide, royalty-free, non-exclusive licence to use and distribute their content only to provide the Services.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “worldwide, royalty-free and non-exclusive license to use, display, publish, reproduce, distribute” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause of HF's own Terms of Service; no search available.
  - verifier (scope): **scope_wrong** — 'Only to provide the Services' is not in the ToS. The grant reads 'license to use, display, publish, reproduce, distribute, and make derivative works of such Content to provide Services and as otherwise permitted under these Terms and our Privacy Policy'. The purpose is wider than the statement says, and the grant includes derivative works.
- **c016** Hugging Face's Terms of Service make the uploader represent and warrant that it has the right to post the content and that it infringes no one's rights.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “You represent and warrant that you have ownership, control, and responsibility for the Content you post” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c018** Users indemnify Hugging Face against claims arising from their use of the Services, including violation of the Terms.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “You agree to indemnify, defend and hold harmless us and Related Parties from all claims, liability, and expenses” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** Hugging Face's Terms of Service are governed by New York law.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “governed by the Law of the State of New York” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c024** On Hugging Face the dataset author chooses the licence in card metadata, and a recognised licence keyword is displayed on the dataset page.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “license: "any valid license identifier"” — Hugging Face, <https://huggingface.co/docs/hub/datasets-cards> · docs · retrieved 2026-10-01 · quote check: exact
- **c063** On Hugging Face a dataset's licence is set by its author in the card metadata, chosen from a list of identifiers.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “The license can be specified in your repository's `README.md` file” — Hugging Face, <https://huggingface.co/docs/hub/repositories-licenses> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — One attempt: Yang, Liang and Zou (ICLR 2024, arxiv.org/abs/2401.13822) describe the card's 'Licensing Information' section as 'The license and link to the license webpage if available', a free-text section; the paper does not cover the YAML licence field or its identifier list. The metadata mechanics exist only in HF's docs.
  - verifier (scope): **quote_incomplete** — The quote shows only where the licence goes, not that it is chosen from a list. The page's words 'A full list of the available licenses is available here' and the 'License identifier (to use in repo card)' column would show that. 'Is set' also overstates it: the page says an author 'is able to add' a licence, so it is optional. The list includes 'other' (custom text in a LICENSE file, named in license_name) and 'unknown'.
- **c064** A Hugging Face author may use a custom licence by setting license: other and adding the licence text in a LICENSE file.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “In case of `license: other` please add the license's text to a `LICENSE` file inside your repo” — Hugging Face, <https://huggingface.co/docs/hub/repositories-licenses> · docs · retrieved 2026-10-01 · quote check: exact
- **c065** Hugging Face tells users to seek out and respect a repository's licence; compliance rests with the user.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Remember to seek out and respect a project's license if you're considering using their code or data.” — Hugging Face, <https://huggingface.co/docs/hub/repositories-licenses> · docs · retrieved 2026-10-01 · quote check: exact
- **c066** NVIDIA's PhysicalAI-Autonomous-Vehicles dataset on Hugging Face is gated behind acceptance of NVIDIA's own dataset licence agreement.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nvidia/PhysicalAI-Autonomous-Vehicles_
  - “You must agree to the NVIDIA Autonomous Vehicle Dataset License Agreement to access this dataset.” — NVIDIA on Hugging Face, <https://huggingface.co/datasets/nvidia/PhysicalAI-Autonomous-Vehicles> · docs · retrieved 2026-10-01 · quote check: exact
- **c067** NVIDIA's AV dataset licence on Hugging Face is non-exclusive, revocable and non-transferable.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nvidia/PhysicalAI-Autonomous-Vehicles_
  - “NVIDIA grants you a non-exclusive, revocable, non-transferable, non-sublicensable license” — NVIDIA on Hugging Face, <https://huggingface.co/datasets/nvidia/PhysicalAI-Autonomous-Vehicles> · docs · retrieved 2026-10-01 · quote check: fuzzy 0.90
- **c068** NVIDIA's AV dataset licence on Hugging Face expires twelve months after initial delivery or download.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nvidia/PhysicalAI-Autonomous-Vehicles_
  - “This Agreement expires twelve (12) months after the date of initial delivery or download” — NVIDIA on Hugging Face, <https://huggingface.co/datasets/nvidia/PhysicalAI-Autonomous-Vehicles> · docs · retrieved 2026-10-01 · quote check: exact
- **c072** GenRobot's Gen-HumanEgo dataset on Hugging Face (about 1,848 hours of egocentric video) is licensed CC-BY-SA-4.0.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: genrobot2025/Gen-HumanEgo_
  - “cc-by-sa-4.0” — GenRobot on Hugging Face, <https://huggingface.co/datasets/genrobot2025/Gen-HumanEgo> · docs · retrieved 2026-10-01 · quote check: exact

### custody

- **c041** Hugging Face serves repository files to users through CloudFront.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Files are served to the users using CloudFront.” — Hugging Face, <https://huggingface.co/docs/hub/storage-limits> · docs · retrieved 2026-10-01 · quote check: exact
- **c060** All Hugging Face Hub datasets are Xet-backed Git repositories that users can clone to their own machines.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Since all datasets on the Hub are Xet-backed Git repositories, you can clone the datasets locally” — Hugging Face, <https://huggingface.co/docs/hub/datasets-downloading> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Storage architecture described only in HF's own docs and blog; no search available. 'All' is a strong word and is checked under scope.
  - verifier (scope): **scope_ok** — The quote is the docs' own wording ('Since all datasets on the Hub are Xet-backed Git repositories'). 'All' is HF's claim: the profile's own custody note says some third-party datasets are links-only, and cloning a gated or private dataset needs authentication, which the statement leaves out.

### vetting

- **c003** By default a gated Hugging Face dataset uses automatic approval: any user who shares their information gets access immediately.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “By default, access to the dataset is automatically granted to the user when requesting it.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A default setting of HF's gating feature; exists only in HF's own docs.
  - verifier (scope): **scope_ok** — The page also says 'By default, the dataset is not gated'; automatic approval is the default only once an author enables access requests, which is what the statement says. Users must be logged in and share username and email.
- **c004** A Hugging Face dataset author can switch the gate to manual approval and accept or reject each pending request.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “If you want to manually approve which users can access your dataset, you must set it to **manual approval**.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c009** Hugging Face gate forms can collect extra author-defined fields (text, checkbox, date, country, select) declared in the dataset card metadata.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “add an `extra_gated_fields` property to your [dataset card metadata]” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c012** To request access to a gated Hugging Face dataset a user must be logged in to a Hugging Face account and request it from the browser.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “you must be logged in to a Hugging Face user account” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** GenRobot's Gen-HumanEgo egocentric video dataset on Hugging Face uses an automatic-approval gate that asks for intended use.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: genrobot2025/Gen-HumanEgo_
  - “Access is automatically granted after you submit the form.” — GenRobot on Hugging Face, <https://huggingface.co/datasets/genrobot2025/Gen-HumanEgo> · docs · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c008** A Hugging Face gated-dataset author can download a JSON access report listing each requester's user id, name, status, email and timestamps.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “Click on it to download a json file with a list of users.” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c019** Hugging Face may remove user content at any time at its sole discretion.  
  _terms · legal_text · as of 2022-09-15 (page_dated) · scope: Hugging Face Hub datasets_
  - “We may remove your Content at any time, at our sole discretion, if we have a concern about your Content.” — Hugging Face, <https://huggingface.co/terms-of-service> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** Hugging Face takes copyright takedown notices at dmca@huggingface.co.  
  _terms · legal_text · as of 2025-04-10 (page_dated) · scope: Hugging Face Hub datasets_
  - “you can submit a Takedown notice to dmca@huggingface.co” — Hugging Face, <https://huggingface.co/content-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c029** Hugging Face's moderation actions include removing or disabling access to content; the policy does not address copies already downloaded.  
  _terms · legal_text · as of 2025-04-10 (page_dated) · scope: Hugging Face Hub datasets_
  - “Removing or Disabling access to the Content” — Hugging Face, <https://huggingface.co/content-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c069** NVIDIA's AV dataset licence on Hugging Face requires the user to destroy all copies on termination.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nvidia/PhysicalAI-Autonomous-Vehicles_
  - “Upon termination, you must stop using and destroy all copies of the Dataset.” — NVIDIA on Hugging Face, <https://huggingface.co/datasets/nvidia/PhysicalAI-Autonomous-Vehicles> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** Hugging Face's FineWeb card offers people who find their own PII in the dataset a form to request its removal.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: HuggingFaceFW/fineweb_
  - “would like it removed, please fill out our” — Hugging Face, <https://huggingface.co/datasets/HuggingFaceFW/fineweb/raw/main/README.md> · docs · retrieved 2026-10-01 · quote check: exact

### changes

- **c047** On 2026-10-01 the Hugging Face datasets directory was live and reported 1,069,830 datasets.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_
  - “1,069,830” — Hugging Face, <https://huggingface.co/datasets> · docs · retrieved 2026-10-01 · quote check: missing 0.00
  - verifier (blind): **vendor_only** — A live dataset counter exists only on huggingface.co; no search available to find a dated third-party snapshot. That the platform was operating in September 2026 is independently supported by NVIDIA's 8-K of 2026-09-03 ('Hugging Face operates a platform and community for ... datasets'). Note the counter (about 1.07M) is double the 'half a million' TechCrunch printed on 2026-09-03 (c053) and the 'over 500k' in HF's docs (c055).
  - verifier (scope): **scope_ok** — The quote is a bare number from the live /datasets directory; it fits the statement. The profile already records the conflict with the 500k and 1.5M figures.
- **c048** NVIDIA disclosed in an 8-K that on 2 September 2026 it entered into a definitive agreement to acquire Hugging Face, Inc.  
  _event · filing · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_
  - “On September 2, 2026, NVIDIA Corporation entered into a definitive agreement to acquire Hugging Face, Inc.” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Found via EDGAR full-text search (efts.sec.gov), form 8-K, Item 8.01, filed 2026-09-03. Next words: 'to acquire Hugging Face, Inc.'. The filing also says closing is expected in the first half of 2027, subject to regulatory approvals, so the acquisition was pending, not completed, on 2026-10-01.
    - “On September 2, 2026, NVIDIA Corporation ("NVIDIA") entered into a definitive agreement” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_ok** — Fact correct. But the profile's quote leaves out the parenthetical: the filing reads 'NVIDIA Corporation ("NVIDIA") entered into a definitive agreement'. The quote string as written ('NVIDIA Corporation entered into ...') is not verbatim and may fail quotecheck.
- **c049** NVIDIA's 8-K states an approximately $11.9 billion cash purchase price payable to Hugging Face stockholders.  
  _number · filing · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_ · **11.9 USD billion** (purchase price payable by NVIDIA to Hugging Face stockholders, excluding up to ~$1.0bn employee retention awards; one-off)
  - “approximately $11.9 billion purchase price payable to Hugging Face stockholders” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **corrected** — corrected to: NVIDIA's 8-K states an approximately $11.9 billion purchase price payable to Hugging Face stockholders, subject to certain adjustments, plus an equity-based retention program of up to approximately $1.0 billion for Hugging Face employees joining NVIDIA; the filing does not say the price is paid in cash. — The word 'cash' does not appear in the 8-K. The $1.0B retention program is the likely reconciliation with TechCrunch's '$12.93 billion' figure.
    - “The transaction includes an approximately $11.9 billion purchase price payable to” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **scope_wrong** — The statement says 'cash purchase price'. Neither the quote nor the 8-K says cash; the word does not appear in the filing. The amount and payee are right. Drop 'cash' (see the blind corrected_statement).
- **c050** As of NVIDIA's 8-K of 3 September 2026 the Hugging Face acquisition was expected to close in the first half of 2027, subject to closing conditions.  
  _status · filing · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_
  - “The transaction is expected to close in the first half of 2027” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **c051** TechCrunch reported on 3 September 2026 that Nvidia confirmed it has acquired Hugging Face for $12.93 billion.  
  _event · press_relayed · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_
  - “Nvidia confirmed today that it has acquired Hugging Face for $12.93 billion.” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
- **c052** Nvidia's CEO said, as reported by TechCrunch, that Hugging Face will remain an open platform after the acquisition.  
  _event · press_relayed · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_
  - “Hugging Face will remain an open platform for the entire AI ecosystem.” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact

### demand

- **c053** TechCrunch, relaying the deal announcement, said Hugging Face's platform hosts half a million datasets and has over 18 million developers.  
  _number · press_relayed · as of 2026-09-03 (publication) · scope: Hugging Face Hub datasets_ · **500000 datasets hosted** (as relayed by TechCrunch; public/private scope not stated; point in time)
  - “one million applications used by over 18 million developers, and half a million datasets” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — Reached from techcrunch.com/tag/hugging-face/ (no search available). This is probably the profile's own source, so it only confirms that TechCrunch printed the figures, not that they are right. Full sentence: 'Hugging Face's platform hosts three million models, one million applications used by over 18 million developers, and half a million datasets.' The 18 million is attached to 'applications used by', not to the platform as a whole. The dataset figure is stale against the live counter of about 1.07M (c047). The same article says Nvidia 'has acquired' Hugging Face for $12.93 billion, which overstates the 8-K (agreement only, closing expected H1 2027).
    - “used by over 18 million developers, and half a million datasets” — TechCrunch, <https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote supports the dataset figure. Minor: TechCrunch attaches the 18 million to 'one million applications used by over 18 million developers', not to the platform as a whole, so 'has over 18 million developers' is a slight reframing. The value (500000 datasets) is correctly marked press-relayed and stale against the live counter.
- **c055** Hugging Face's Hub documentation says the Hub hosts over 500k public datasets in more than 8k languages.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **500000 public datasets** (vendor-stated count of public datasets; point in time)
  - “The Hub is home to over 500k public datasets in more than 8k languages” — Hugging Face, <https://huggingface.co/docs/hub/index> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what HF's own documentation says. Independent figures disagree: TechCrunch (2026-09-03) says 'half a million datasets' and the live counter shows about 1.07M (c047), so 'over 500k' is a stale floor. 'More than 8k languages' has no independent source reachable without search.
  - verifier (scope): **scope_ok** — The quote matches the statement, which correctly attributes it to HF's docs. The figure is a stale floor (live counter is about 1.07M).
- **c056** The same Hugging Face documentation page elsewhere says the Hub hosts 1.5M datasets, all open and publicly available.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets_ · **1500000 datasets** (vendor-stated; conflicts with the 500k public figure on the same page; point in time)
  - “It hosts over 2M models, 1.5M datasets, and 1.5M AI apps (Spaces), all open and publicly available.” — Hugging Face, <https://huggingface.co/docs/hub/index> · docs · retrieved 2026-10-01 · quote check: exact

### regulation

- **c011** A gated Hugging Face dataset can be set to refuse access to users in EU countries, identified by IP address, via extra_gated_eu_disallowed.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Hugging Face Hub datasets, European Union_
  - “you can add an additional layer of access control to specifically restrict users from European Union countries” — Hugging Face, <https://huggingface.co/docs/hub/datasets-gated> · docs · retrieved 2026-10-01 · quote check: exact
- **c026** Hugging Face's Content Policy prohibits content that publishes others' private information without their explicit permission.  
  _terms · legal_text · as of 2025-04-10 (page_dated) · scope: Hugging Face Hub datasets_
  - “publishing others' private information, such as a physical or email address, without their explicit permission” — Hugging Face, <https://huggingface.co/content-policy> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c070** NVIDIA's AV dataset licence on Hugging Face requires users to cooperate with NVIDIA to honour data subject rights.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: nvidia/PhysicalAI-Autonomous-Vehicles_
  - “You must cooperate with NVIDIA to honor any data subject rights where applicable.” — NVIDIA on Hugging Face, <https://huggingface.co/datasets/nvidia/PhysicalAI-Autonomous-Vehicles> · docs · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** In its 8-K on the Hugging Face acquisition, NVIDIA says it has committed to keep Hugging Face's platform open after the acquisition.  
  _event · filing · as of 2026-09-03 (publication) · scope: Hugging Face, Inc. (company)_
  - “NVIDIA has committed to, among other things, keep Hugging Face's platform open” — NVIDIA Corporation (SEC Form 8-K), <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm> · filing · retrieved 2026-10-01 · quote check: fetch_failed
- **v002** An ICLR 2024 study of all Hugging Face dataset cards found that only 7.9% of cards for datasets with no downloads completed all community-suggested sections, against 86.0% of the top 100 downloaded.  
  _outcome · academic · as of 2024-01 (publication) · scope: Hugging Face Hub datasets_
  - “only 7.9% of dataset cards with no downloads complete all these sections” — arXiv (Yang, Liang and Zou, ICLR 2024), <https://arxiv.org/pdf/2401.13822v1> · academic · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://huggingface.co/terms-of-service>, <https://huggingface.co/docs/hub/repositories-licenses>, <https://huggingface.co/docs/hub/datasets-gated>
- `other.business_insider_sale_report` — blocked; tried <https://www.businessinsider.com/s?q=hugging%20face>
- `other.acquisition_close` — not_published; tried <https://nvidianews.nvidia.com/news>, <https://huggingface.co/blog>
- `questions.Q1` — not_published; tried <https://huggingface.co/datasets>, <https://huggingface.co/docs/hub/index>
- `questions.Q12` — not_published; tried <https://huggingface.co/pricing>, <https://huggingface.co/docs/hub/index>
- `other.gate_form_fields_on_live_listing` — gated; tried <https://huggingface.co/datasets/genrobot2025/Gen-HumanEgo>

## Conflicts

- c048, c050, c051: Same-day sources: TechCrunch says Nvidia 'has acquired' Hugging Face, while NVIDIA's own 8-K describes a definitive agreement expected to close in H1 2027. The filing's wording is taken; status stays active pending close. (newer_wins_status)
- c055, c056, c053, c047: Dataset counts differ: 500k public (docs and TechCrunch), 1.5M (docs header), 1,069,830 (live directory). Definitions (public vs all) are not stated. (unresolved)

## Leads, not cited

- <https://www.businessinsider.com/> — Census lead: Business Insider reported on 2026-08-24 that Hugging Face was exploring a sale at $13B+; the site refused automated fetch.
- <https://fortune.com/2026/07/21/openai-says-ai-models-escaped-control-hacked-hugging-face/> — Reported July 2026 security incident on HF servers (from Wikipedia's references); not fetched.
- <https://www.reuters.com/technology/ai-startup-hugging-face-valued-45-bln-latest-round-funding-2023-08-24/> — Independent report of the 2023 $235M round at $4.5B; not fetched.
- <https://huggingface.co/docs/hub/enterprise-gating-group-collections> — Gating Group Collections for Team/Enterprise; org-level access management.
- <https://huggingface.co/docs/hub/storage-buckets> — Mutable, non-versioned storage buckets, a second custody model alongside Git repos.
