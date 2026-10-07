# LAION-5B

failure · light · status: **active** · also known as Re-LAION-5B, LAION e.V.

> Rendered from `ledger/laion-5b.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “datasets (LAION: 'provides datasets, tools and models')” and its bespoke side “unknown”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | not_applicable | c029, c031, c037 | No sale or intermediation: LAION publishes its own link datasets free of charge as a non-profit; it is licensor of the metadata only. |
| economics_model | free | c031, c029 | Published free of charge; non-profit. |
| who_pays_fee | not_applicable | c031 | No fee is charged to either side. |
| supply_models | public_or_scraped | c021, c012 | URLs and alt text harvested from Common Crawl, CLIP-filtered. |
| custody_model | mixed | c013, c014, c018, c028 | Link-only dataset: metadata hosted (gated) on Hugging Face; images stay with third-party web hosts and each user downloads its own copy. None of the enum values fits exactly. |
| transaction_mode | free_download | c018, c001, c031 | Free download behind a Hugging Face gate that collects contact / affiliation information. |
| public_prices | not_applicable | c031 | Free; nothing is priced. |
| licence_model | open_licences | c015, c016, c017 | CC-BY 4.0 (original) then Apache-2.0 (Re-LAION) for the metadata; linked images remain under their owners' copyright. |
| exclusivity_offered | no | c015, c016 | Open licences are non-exclusive by construction; no exclusive offer found. |
| public_listing | public_summary_gated_detail | c001, c018 | Dataset page is public; files require accepting the gate. |
| buyer_vetting | account_only | c001, c018 | Hugging Face account plus submitted contact/affiliation information; whether LAION reviews requests manually was not found. |
| sample_mechanics | unknown |  | Not established from fetched pages. |
| versioning | unknown | c009, c010, c020 | Observed pattern: withdraw the release, publish a new named release (Re-LAION-5B, two variants) and provide diffs; whether old revisions stay retrievable was not established. |
| human_subject_consent_docs | not_addressed | c023, c027, c017 | No consent documentation; web-scraped images of people, including children, without their knowledge; only an after-the-fact GDPR takedown route. |
| contributor_pay_model | not_applicable | c021 | No contributors: content is scraped links from Common Crawl. |
| catalogue_plus_custom | unknown |  | LAION publishes datasets; no evidence either way on custom collection. |
| erasure_after_sale | takedown_only | c027, c019, c020, c028 | Entries removed from LAION's own copy on request; downstream holders are urged, not obliged, to migrate or apply diffs. |
| quality_evidence | provider_asserted | c033, c038, c036, c012 | LAION as producer publishes CLIP filtering and NSFW/watermark scores; no separate operator verification. Independent audit (Stanford) found its filters missed CSAM [c004, c008]. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Used to train text-to-image models such as Stable Diffusion, whose developer funded it; LAION itself steered use toward research rather than products. No buyer units or volumes exist since it is free. | c035, c034 |
| Q2 | partial | LAION distributes through Hugging Face gated repositories rather than its own storefront; why it chose that channel is not stated. | c018, c001 |
| Q3 | sourced | All inventory is URLs and alt text scraped from Common Crawl; LAION asserts the images stay under their owners' copyright and relies on text-and-data-mining exceptions, which German courts upheld. | c021, c017, c029, c030, c032 |
| Q4 | not_applicable | No commissioned work: the dataset is built from scraped public web links. |  |
| Q5 | partial | LAION is a non-profit publisher, not an intermediary; it relies on the scientific-research TDM exception, upheld in Kneschke v LAION partly because the dataset was free. No warranty or indemnity terms were found. | c029, c030, c031, c032 |
| Q6 | sourced | Link-only: LAION hosts metadata, the images stay on third-party hosts, and every user fetches its own copy; removing a link does not remove the image from the web. | c013, c014, c028 |
| Q7 | partial | No consent from capturers or people depicted; HRW found children's photos included without knowledge or consent, and LAION removed them after the fact; individuals can only request a GDPR takedown of the entry. | c022, c023, c024, c025, c026, c040, c027 |
| Q8 | partial | Open licences (CC-BY 4.0, then Apache-2.0) on the metadata with no audit, fingerprinting or recall; copies already downloaded kept the illegal links, and LAION could only urge migration. | c015, c016, c006, c019 |
| Q9 | sourced | Free download through a Hugging Face gate that asks for contact and affiliation information; no commission or revenue. | c018, c001, c031 |
| Q10 | partial | LAION-5B was pulled on 19 Dec 2023 with no instruction to existing holders in the notice; Re-LAION-5B (Aug 2024) removed 2,236 links, and past users were urged to migrate and given metadata to diff their derivatives. | c002, c005, c009, c010, c019, c020, c007 |
| Q11 | partial | Quality evidence was LAION's own CLIP and NSFW scores and filters; an independent Stanford hash-matching audit found hundreds of known CSAM items the filters had missed. | c033, c038, c039, c036, c004, c008 |
| Q12 | unknown |  |  |

## Claims

### positioning

- **c029** LAION's FAQ describes LAION as a non-profit research organisation and says text and data mining exemptions are therefore valid.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “LAION is a non-profit research organization that studies how learning algorithms work. Therefore, TDM exemptions are valid” — LAION, <https://laion.ai/faq/> · docs · retrieved 2026-09-30 · quote check: exact
- **c037** LAION describes itself as a non-profit organisation that provides datasets, tools and models for machine learning research.  
  _offer · vendor_stated · as of 2023-12-19 (page_dated)_
  - “LAION is a non-profit organization that provides datasets, tools and models for the advancement of machine learning research” — LAION, <https://laion.ai/notes/laion-maintenance/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### supply

- **c021** LAION states its datasets are sourced from the Common Crawl web index and offer only links to content.  
  _architecture · vendor_stated · as of 2023-12-19 (page_dated)_
  - “are sourced from the freely available Common Crawl web index and offer only links to content” — LAION, <https://laion.ai/notes/laion-maintenance/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### object_model

- **c011** LAION says Re-LAION-5B contains 5,526,641,167 text-link to image pairs.  
  _number · vendor_stated · as of 2024-08-30 (page_dated)_ · **5526641167 text-link to image pairs** (dataset size stated by LAION for Re-LAION-5B; as of the August 2024 release)
  - “Total number of text-link to images pairs in Re-LAION-5B: 5.5 B (5,526,641,167)” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Confirms only the rounded figure (about 5.5 billion); no independent source reached prints the exact 5,526,641,167 (a WebSearch for the exact string found nothing citable). TechCrunch and arXiv 2507.05300 also say about 5.5 billion. Treat the exact count as LAION-stated only.
    - “Re-LAION-5B contains 5.5 billion text-image pairs in total.” — The Decoder, <https://the-decoder.com/laion-releases-ai-dataset-re-laion-5b-purged-of-links-to-child-abuse-images/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — Quote gives the total for Re-LAION-5B overall; LAION's page gives no separate total for the research-safe variant, so the figure should not be reused for relaion2B-en-research-safe or research-safe generally.
- **c012** LAION described the original LAION-5B as a dataset of 5.85 billion CLIP-filtered image-text pairs.  
  _number · vendor_stated · as of 2022-03-31 (page_dated)_ · **5850000000 image-text pairs** (dataset size stated by LAION for the original LAION-5B; as of the March 2022 release)
  - “We present a dataset of 5,85 billion CLIP-filtered image-text pairs” — LAION, <https://laion.ai/blog/laion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Peer-reviewed paper, different domain and class, but authored by LAION members, so it evidences LAION's own description rather than an outside count. Human Rights Watch (2024-06-10) independently uses the figure: 'the 5.85 billion images and captions contained in the data set'.
    - “a dataset consisting of 5.85 billion CLIP-filtered image-text pairs, of which 2.32B contain English language” — arXiv (Schuhmann et al., NeurIPS 2022 Datasets and Benchmarks), <https://arxiv.org/abs/2210.08402> · academic · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — Quote ('5,85 billion CLIP-filtered image-text pairs', European decimal comma) is LAION's 2022 announcement of the original LAION-5B; matches. Used for supply_models and quality_evidence, which it supports (Common Crawl-derived, CLIP-filtered).

### trust

- **c003** LAION's takedown notice cited a zero tolerance policy for illegal content and an abundance of caution as the reason for the takedown.  
  _terms · vendor_stated · as of 2023-12-19 (page_dated)_
  - “LAION has a zero tolerance policy for illegal content and in an abundance of caution” — LAION, <https://laion.ai/notes/laion-maintenance/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c004** The Stanford Internet Observatory investigation reported 3,226 suspected instances of child sexual abuse material in LAION-5B, of which 1,008 were externally validated.  
  _number · independent · as of 2023-12-20 (publication)_ · **3226 suspected CSAM instances (links) in LAION-5B** (Stanford Internet Observatory count as reported by 404 Media; 1,008 of these externally validated; as of the December 2023 report)
  - “3,226 suspected instances of child sexual abuse material, 1,008 of which were externally validated” — 404 Media, <https://www.404media.co/laion-datasets-removed-stanford-csam-child-abuse/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — 404 Media, 2023-12-20. Also checked the SIO report PDF itself (stacks.stanford.edu, Thiel, 2023-12-23): it says 'we identified 3,226 dataset entries of suspected CSAM'; 1,008 is not printed but equals the validated totals of its Tables 2 and 3 (825 + 183), validated by C3P. The report's PDF text extracts without spaces, so the press quote is cited instead. The Stanford FSI news page returned 403.
    - “3,226 suspected instances of child sexual abuse material, 1,008 of which were externally validated.” — 404 Media, <https://www.404media.co/laion-datasets-removed-stanford-csam-child-abuse/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the statement exactly (404 Media, 2023-12-20). Minor: value.unit says 'links' where the source says 'instances'; the SIO report counts 'dataset entries', which are URL entries, so this is acceptable.
- **c008** The Stanford report says its methodology detected many hundreds of instances of known CSAM in the LAION-5B training set.  
  _outcome · academic · as of 2023-12-20 (publication)_
  - “This methodology detected many hundreds of instances of known CSAM in the training set” — Stanford Digital Repository (Stanford Internet Observatory), <https://purl.stanford.edu/kh752sm9123> · academic · retrieved 2026-09-30 · quote check: exact

### transaction

- **c018** Both Re-LAION-5B versions are released via gated access on Hugging Face that requires submitting affiliation information.  
  _offer · vendor_stated · as of 2024-08-30 (page_dated)_
  - “released via gated access on HF, requiring submission of affiliation information” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact

### licence

- **c015** Re-LAION-5B is released under the Apache-2.0 licence.  
  _terms · vendor_stated · as of 2024-08-30 (page_dated) · scope: Re-LAION-5B_
  - “released under Apache-2.0 license” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c016** The original LAION-5B announcement gave the dataset licence as Creative Commons CC-BY 4.0.  
  _terms · vendor_stated · as of 2022-03-31 (page_dated) · scope: LAION-5B (original)_
  - “Creative Common CC-BY 4.0” — LAION, <https://laion.ai/blog/laion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c017** The LAION-5B announcement states that the linked images remain under their own copyright.  
  _terms · vendor_stated · as of 2022-03-31 (page_dated)_
  - “The images are under their copyright.” — LAION, <https://laion.ai/blog/laion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c034** LAION recommended that LAION-5B be used for research and did not recommend using it to create ready-to-go industrial products.  
  _terms · vendor_stated · as of 2022-03-31 (page_dated)_
  - “do not recommend using it for creating ready-to-go industrial products” — LAION, <https://laion.ai/blog/laion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact

### custody

- **c013** LAION states that its datasets contain only links and metadata, not the images themselves.  
  _architecture · vendor_stated · as of 2024-08-30 (page_dated)_
  - “The datasets of LAION only contain links and metadata.” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — TechCrunch (Kyle Wiggers), 2024-08-30, in its own voice. Heise (2024-08-30) independently: 'The image databases do not contain the images themselves, but rather a hash value of the image file and the URL'. HRW likewise describes LAION-5B as containing links to photos.
    - “Important to note is that LAION's datasets don't — and never did — contain images.” — TechCrunch, <https://techcrunch.com/2024/08/30/the-org-behind-the-data-set-used-to-train-stable-diffusion-claims-it-has-removed-csam/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — Quote 'The datasets of LAION only contain links and metadata.' supports the statement and the link-only custody description. It does not by itself establish how users obtain images; the custody_model 'mixed' value relies on c014, c018 and c028 for that.
- **c014** LAION's FAQ states that its datasets do not contain any original media samples such as images, audio or video.  
  _architecture · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “LAION datasets do not contain any original media samples such as images, audio, or video.” — LAION, <https://laion.ai/faq/> · docs · retrieved 2026-09-30 · quote check: exact
- **c028** LAION's FAQ says that to remove content from the web entirely a person must contact the original hosting provider.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you will need to contact the original hosting provider directly” — LAION, <https://laion.ai/faq/> · docs · retrieved 2026-09-30 · quote check: exact

### vetting

- **c033** Re-LAION-5B-research-safe removes the majority of NSFW samples using a p_unsafe threshold of 0.45.  
  _architecture · vendor_stated · as of 2024-08-30 (page_dated) · scope: Re-LAION-5B-research-safe_
  - “elimination of the majority of NSFW presence: p_unsafe > 0.45” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c038** For Re-LAION-5B-research the p_unsafe removal threshold, applied together with keyword text filters, is 0.95.  
  _architecture · vendor_stated · as of 2024-08-30 (page_dated) · scope: Re-LAION-5B-research_
  - “For Re-LAION-5B-research, this threshold is determined to be p_unsafe>0.95” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c039** LAION says the research-safe NSFW filter removes 3.044% of samples from the original LAION-5B, about 176M of 5.8B.  
  _number · vendor_stated · as of 2024-08-30 (page_dated) · scope: Re-LAION-5B-research-safe_ · **3.044 percent of samples removed** (share of original LAION-5B samples removed by the p_unsafe > 0.45 filter in Re-LAION-5B-research-safe; vendor-stated; one-off (Re-LAION-5B release))
  - “This leads to removal of 3.044% (60.88M from 2B, 176M from 5.8B) samples from original LAION-5B.” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Next, 2024-09-03, relaying LAION's figures for the 'safe' version; gives 3,04 % (rounded) and 176 million. Next says 'images' where LAION's datasets hold links. No non-relaying independent source gives the percentage.
    - “l'association a supprimé 3,04 % de sa base de données, soit 176 millions d'images enlevées” — Next (next.ink), <https://next.ink/148346/laion-5b-revient-sans-contenus-pedocriminels-promis-quid-des-autres-problemes/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — LAION's page ties the 3.044% (176M of 5.8B) removal to the research-safe p_unsafe > 0.45 filter; product scope Re-LAION-5B-research-safe is correct. The percentage is of the original LAION-5B, not of Re-LAION-5B.
- **c036** Before the takedown LAION said it had developed and published its own filters to detect and remove illegal content before releasing datasets.  
  _architecture · vendor_stated · as of 2023-12-19 (page_dated)_
  - “We developed and published our own rigorous filters to detect and remove illegal content from LAION datasets” — LAION, <https://laion.ai/notes/laion-maintenance/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact

### post_sale

- **c006** 404 Media quoted the view that anyone who had downloaded the full LAION-5B dataset, including for research model training, holds CSAM.  
  _outcome · independent · as of 2023-12-20 (publication)_
  - “full dataset for whatever purpose, for training a model for research purposes, then yes, you absolutely have CSAM” — 404 Media, <https://www.404media.co/laion-datasets-removed-stanford-csam-child-abuse/> · independent_press · retrieved 2026-09-30 · quote check: exact
- **c007** The Stanford report on LAION-5B includes recommendations for those who need to maintain copies of the training set and for hosting models trained on it.  
  _outcome · academic · as of 2023-12-20 (publication)_
  - “recommendations for mitigating this issue for those that need to maintain copies of this training set” — Stanford Digital Repository (Stanford Internet Observatory), <https://purl.stanford.edu/kh752sm9123> · academic · retrieved 2026-09-30 · quote check: exact
- **c019** LAION urged all research labs and organisations still using the old LAION-5B to migrate to Re-LAION-5B as soon as possible.  
  _terms · vendor_stated · as of 2024-08-30 (page_dated)_
  - “We strongly urge all research labs and organizations who still make use of old LAION-5B to migrate to Re-LAION-5B datasets” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c020** LAION says third parties can use Re-LAION-5B metadata to clean existing derivatives of LAION-5B by generating diffs.  
  _architecture · vendor_stated · as of 2024-08-30 (page_dated)_
  - “Re-LAION-5B metadata can be utilized by third parties to clean existing derivatives of LAION-5B by generating diffs” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c024** According to Human Rights Watch, LAION confirmed the children's photos were in LAION-5B and pledged to remove them.  
  _event · independent · as of 2024-06-10 (publication)_
  - “confirmed that the data set contained the children’s personal photos found by Human Rights Watch and pledged to remove them” — Human Rights Watch, <https://www.hrw.org/news/2024/06/10/brazil-childrens-personal-photos-misused-power-ai-tools> · independent_press · retrieved 2026-09-30 · quote check: exact
- **c027** LAION's FAQ says a person whose image is in a URL or picture may request a takedown of the dataset entry through its GDPR page.  
  _terms · vendor_stated · as of 2026-09-30 (retrieved_only)_
  - “you may request a takedown of the dataset entry in the GDPR page.” — LAION, <https://laion.ai/faq/> · docs · retrieved 2026-09-30 · quote check: exact

### changes

- **c001** As of 2026-09-30 the Re-LAION-5B subset relaion2B-en-research-safe is still offered on Hugging Face behind a gate that requires sharing contact information.  
  _status · vendor_stated · as of 2026-09-30 (retrieved_only) · scope: Re-LAION-5B (relaion2B-en-research-safe)_
  - “You need to agree to share your contact information to access this dataset” — LAION on Hugging Face, <https://huggingface.co/datasets/laion/relaion2B-en-research-safe> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — The gate notice is Hugging Face platform text on the hosting operator's domain (huggingface.co), not LAION's own site; it is the only source that can show current (2026-09-30) status. The dataset card itself is LAION-authored, so independence is limited to the gate mechanism. Next.ink (2024-09-03) independently reported both versions were 'accessibles sur Hugging Face seulement après s'être identifié sur la plateforme', but that is 2024, not current.
    - “You need to agree to share your contact information to access this dataset” — Hugging Face, <https://huggingface.co/datasets/laion/relaion2B-en-research-safe> · docs · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — Quote is the Hugging Face gate text on the named repo, retrieved 2026-09-30; it supports current availability behind a contact-information gate. Caveat for the orchestrator: the blind confirmation above turned out to use the same URL as the profile, so c001 has no second, truly independent source; only Hugging Face's platform text (not LAION's) makes it more than vendor-stated. The profile tags it origin vendor_stated although the gate wording is Hugging Face's; LAION's own blog words the gate as affiliation information and consent (c018).
- **c002** On 19 December 2023 LAION announced it was temporarily taking down the LAION datasets to ensure they were safe before republishing them.  
  _event · vendor_stated · as of 2023-12-19 (page_dated)_
  - “we are temporarily taking down the LAION datasets to ensure they are safe before republishing them” — LAION, <https://laion.ai/notes/laion-maintenance/> · vendor_marketing · retrieved 2026-09-30 · quote check: exact
- **c005** 404 Media reported on 20 December 2023 that LAION was taking down its datasets, including LAION-5B and LAION-400M.  
  _event · independent · as of 2023-12-20 (publication)_
  - “it was taking down its datasets, including LAION-5B and another called LAION-400M” — 404 Media, <https://www.404media.co/laion-datasets-removed-stanford-csam-child-abuse/> · independent_press · retrieved 2026-09-30 · quote check: exact
- **c009** LAION says Re-LAION-5B, released 30 August 2024, is the first web-scale text-link to image pair dataset thoroughly cleaned of known links to suspected CSAM.  
  _event · vendor_stated · as of 2024-08-30 (page_dated)_
  - “the first web-scale, text-link to images pair dataset to be thoroughly cleaned of known links to suspected CSAM” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c010** LAION says 2,236 links were removed from LAION-5B to make Re-LAION-5B, after matching against link and image hash lists from its partners.  
  _number · vendor_stated · as of 2024-08-30 (page_dated)_ · **2236 links removed** (links in LAION-5B matched against hash lists from C3P, IWF and Stanford Internet Observatory; vendor-stated; one-off (Re-LAION-5B release))
  - “In all, 2236 links were removed after matching with the lists of link and image hashes provided by our partners.” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - “A total of 2,236 links were removed after checking against lists provided by partners.” — The Decoder, <https://the-decoder.com/laion-releases-ai-dataset-re-laion-5b-purged-of-links-to-child-abuse-images/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Authors are not LAION (Supermodel). The figure is still LAION's own count, relayed; no partner (IWF, C3P, SIO) publication giving 2,236 was found. TechCrunch 2024-08-30 and The Decoder 2024-08-31 relay the same number.
    - “removing 2236 identified links by matching against over 16 million image and URL hashes of known illegal content” — arXiv (Merchant et al., Supermodel), <https://arxiv.org/html/2507.05300> · academic · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — LAION blog quote and The Decoder relay both give 2,236 links removed after hash-list matching; statement is correctly framed as 'LAION says'.
- **c025** LAION says Re-LAION-5B also removed privacy-related data that contained no illegal content, in cooperation with Human Rights Watch.  
  _event · vendor_stated · as of 2024-08-30 (page_dated)_
  - “further privacy related data that did not contain any illegal content was removed in cooperation with the Human Rights Watch” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
- **c026** LAION says 399 links to children's private information reported by Human Rights Watch were removed in Re-LAION-5B.  
  _number · vendor_stated · as of 2024-08-30 (page_dated)_ · **399 links removed for privacy reasons** (41 links from a first HRW report plus 358 from a second; vendor-stated; one-off (Re-LAION-5B release))
  - “= 399 links to public web provided by HRW” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Next, 2024-09-03, relaying LAION; the same sentence continues that 'par prudence' LAION removed them all. HRW's own follow-up (hrw.org, 2024-09-03) confirms removal ('Human Rights Watch has confirmed the removal of the children's photos identified to LAION from its newly released dataset') but counts children (362 Australian + 358 Brazilian), not links, and never prints 399. So the 399 link count is LAION-stated; removal is independently confirmed by HRW.
    - “Sur les 399 signalées par l'ONG, LAION affirme que toutes ne contenaient pas des données sensibles mais” — Next (next.ink), <https://next.ink/148346/laion-5b-revient-sans-contenus-pedocriminels-promis-quid-des-autres-problemes/> · press_relaying_vendor · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The cited quote '= 399 links to public web provided by HRW' only says HRW provided 399 links; it does not say they were removed, and it does not say they were links to children's private information. LAION's same page says only a part of those links were found to contain private info and that it removed all links matching HRW's collection 'in abundance of caution' (see c040). The statement should read along the lines of 'LAION says it removed all 399 links reported by HRW, though only some were found to contain private information', and the quote should be the removal sentence.
- **c040** LAION says many of the 399 links reported by Human Rights Watch were not confirmed to contain sensitive data but it removed all of them anyway.  
  _event · vendor_stated · as of 2024-08-30 (page_dated)_
  - “In abundance of caution, we have still removed any of the links that were matching HRW collection” — LAION, <https://laion.ai/blog/relaion-5b/> · eng_blog · retrieved 2026-09-30 · quote check: exact

### demand

- **c035** 404 Media reported that Stable Diffusion uses LAION-5B and that Stability AI funded the dataset's development.  
  _outcome · independent · as of 2023-12-20 (publication)_
  - “Stable Diffusion, for example, uses LAION-5B, and Stability AI funded its development.” — 404 Media, <https://www.404media.co/laion-datasets-removed-stanford-csam-child-abuse/> · independent_press · retrieved 2026-09-30 · quote check: exact

### regulation

- **c022** Human Rights Watch reported finding 170 photos of Brazilian children from at least 10 states in LAION-5B.  
  _number · independent · as of 2024-06-10 (publication)_ · **170 photos of identifiable Brazilian children found in LAION-5B** (Human Rights Watch count from a sample review, not a full audit; as of June 2024)
  - “Human Rights Watch found 170 photos of children from at least 10 states” — Human Rights Watch, <https://www.hrw.org/news/2024/06/10/brazil-childrens-personal-photos-misused-power-ai-tools> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — HRW's own report page (primary for its own finding; NGO, no closer source_class available). HRW later (2024-09-03) put the combined total at 362 Australian and 358 Brazilian children, so 170 is the June 2024 Brazil figure only.
    - “Human Rights Watch found 170 photos of children from at least 10 states” — Human Rights Watch, <https://www.hrw.org/news/2024/06/10/brazil-childrens-personal-photos-misused-power-ai-tools> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_ok** — HRW's own June 2024 page, quote matches. It is a sample-based finding for Brazil only; HRW's later total (358 Brazilian children) differs and is not in the profile (see missed).
- **c023** Human Rights Watch said the Brazilian children's photos were in LAION-5B without the children's knowledge or consent.  
  _outcome · independent · as of 2024-06-10 (publication)_
  - “without the children’s knowledge or consent” — Human Rights Watch, <https://www.hrw.org/news/2024/06/10/brazil-childrens-personal-photos-misused-power-ai-tools> · independent_press · retrieved 2026-09-30 · quote check: exact
- **c030** The Hamburg Regional Court (case 310 O 227/23) dismissed photographer Robert Kneschke's copyright infringement claim against LAION in September 2024.  
  _event · independent · as of 2024-10-10 (publication)_
  - “dismissed Kneschke’s copyright infringement claim against LAION” — IPWatchdog, <https://ipwatchdog.com/2024/10/10/german-court-non-commercial-ai-training-data-meets-scientific-research-exception-copyright-infringement/> · independent_press · retrieved 2026-09-30 · quote check: exact
- **c031** IPWatchdog reports the Hamburg court relied on the dataset having been published free of charge and made available to researchers.  
  _outcome · independent · as of 2024-10-10 (publication)_
  - “published free of charge and thus made available to researchers” — IPWatchdog, <https://ipwatchdog.com/2024/10/10/german-court-non-commercial-ai-training-data-meets-scientific-research-exception-copyright-infringement/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (blind): **confirmed_independent** — Kluwer Copyright Blog, 2024-11-13, summarising LG Hamburg 310 O 227/23 (27 Sept 2024). Confirms the underlying fact the claim attributes to IPWatchdog; IPWatchdog itself was not fetched in the blind pass, and the court's own judgment text was not fetched. The same blog stresses 'The only decisive factor is that the activity is non-commercial'. Note this is a first-instance ruling about LAION's own download for dataset creation, not a finding about any fee model.
    - “It is sufficient that the data set is published free of charge, making it available (also) to researchers” — Kluwer Copyright Blog (Goldstein, Stuetzle, Bischoff), <https://legalblogs.wolterskluwer.com/copyright-blog/kneschke-vs-laion-landmark-ruling-on-tdm-exceptions-for-ai-training-data-part-1/> · independent_press · retrieved 2026-09-30 · quote check: exact
  - verifier (scope): **scope_wrong** — The statement itself matches the IPWatchdog quote. But the claim is used to back five matrix fields, and the quote only speaks to price: it supports economics_model=free and, by implication, who_pays_fee and public_prices = not_applicable. It says nothing about operator_role (whether LAION intermediates anyone's sale) or transaction_mode (it says 'made available', not how, and not gated download). It is also a court's description of the original LAION-5B at the time of the 2021 download, not of current Re-LAION-5B distribution terms.
- **c032** On 10 December 2025 the Higher Regional Court of Hamburg rejected Kneschke's appeal against the ruling in LAION's favour.  
  _event · independent · as of 2025-12-10 (page_dated)_
  - “In its judgment of 10 December 2025, the court rejected the appeal filed by photographer Robert Kneschke” — DLA Piper, <https://www.dlapiper.com/en/insights/blogs/mse-today/2025/robert-kneschke-v-laion> · independent_press · retrieved 2026-09-30 · quote check: fetch_failed

## Added by the verifier

- **v001** Human Rights Watch says it confirmed that the children's photos it identified to LAION were removed from the newly released dataset.  
  _outcome · independent · as of 2024-09-03 (publication) · scope: Re-LAION-5B_
  - “Human Rights Watch has confirmed the removal of the children's photos identified to LAION from its newly released dataset.” — Human Rights Watch, <https://www.hrw.org/news/2024/09/03/720-australian-and-brazilian-children-better-protected-ai-misuse> · independent_press · retrieved 2026-09-30 · quote check: exact
- **v002** Human Rights Watch says the images it found in LAION's dataset captured 362 Australian and 358 Brazilian children without their consent.  
  _number · independent · as of 2024-09-03 (publication) · scope: LAION-5B, Australia, Brazil_ · **720 children depicted without consent (362 Australian + 358 Brazilian)** (HRW count from its sample reviews across two investigations; not a full audit; as of September 2024)
  - “captured the faces and bodies of 362 Australian children and 358 Brazilian children without their consent” — Human Rights Watch, <https://www.hrw.org/news/2024/09/03/720-australian-and-brazilian-children-better-protected-ai-misuse> · independent_press · retrieved 2026-09-30 · quote check: exact
- **v003** Commentary on the Hamburg ruling says the only decisive factor for the research exception was that LAION's activity was non-commercial, making its organisation and financing irrelevant.  
  _outcome · independent · as of 2024-11-13 (publication) · scope: LAION-5B, Germany_
  - “The only decisive factor is that the activity is non-commercial, making LAION's organization and financing irrelevant” — Kluwer Copyright Blog, <https://legalblogs.wolterskluwer.com/copyright-blog/kneschke-vs-laion-landmark-ruling-on-tdm-exceptions-for-ai-training-data-part-1/> · independent_press · retrieved 2026-09-30 · quote check: exact

## Unknown

- `matrix.sample_mechanics` — not_published; tried <https://huggingface.co/datasets/laion/relaion2B-en-research-safe>, <https://laion.ai/blog/relaion-5b/>, <https://laion.ai/blog/laion-5b/>
- `matrix.versioning` — not_published; tried <https://laion.ai/blog/relaion-5b/>, <https://huggingface.co/datasets/laion/relaion2B-en-research-safe>, <https://huggingface.co/datasets/laion/laion2B-en>
- `matrix.catalogue_plus_custom` — not_published; tried <https://laion.ai/>, <https://laion.ai/faq/>, <https://laion.ai/blog/>
- `names_for.custom_side` — not_published; tried <https://laion.ai/>, <https://laion.ai/faq/>
- `questions.Q12` — not_published; tried <https://laion.ai/>, <https://laion.ai/faq/>, <https://laion.ai/blog/>
- `questions.Q10.notice_to_existing_holders_dec_2023` — not_published; tried <https://laion.ai/notes/laion-maintenance/>
- `questions.Q5.warranty_and_indemnity` — not_found; tried <https://laion.ai/faq/>, <https://huggingface.co/datasets/laion/relaion2B-en-research-safe>, <https://laion.ai/dataset-requests/>, <https://laion.ai/gdpr/>
- `questions.Q5.court_record` — blocked; tried <https://www.euipo.europa.eu/en/law/recent-case-law/germany-hamburg-district-court-310-o-22723-laion-v-robert-kneschke>, <https://www.twobirds.com/en/insights/2025/germany/higher-regional-court-hamburg-confirms-ai-training-was-permitted-(kneschke-v,-d-,-laion)>
- `questions.Q11.stanford_press_release` — blocked; tried <https://cyber.fsi.stanford.edu/news/investigation-finds-ai-image-generation-models-trained-child-abuse>

## Leads, not cited

- <https://purl.stanford.edu/kh752sm9123> — Landing page only was read; the full Stanford PDF has the specific recommendations for holders of copies and model hosts.
- <https://huggingface.co/datasets/laion/laion2B-en> — Original-name repo is live and gated with recent downloads; unclear whether its files now hold the cleaned Re-LAION data or the original.
- <https://www.euipo.europa.eu/en/law/recent-case-law/germany-hamburg-district-court-310-o-22723-laion-v-robert-kneschke> — EUIPO case-law summary of Kneschke v LAION; returned 403.
- <https://arxiv.org/abs/2506.17185> — Academic paper on privacy problems in a large web-scraped dataset (DataComp CommonPool); related failure mode.
- <https://laion.ai/dataset-requests/> — Issue-report form (name, email, dataset, sample ID, URL); no stated process or SLA for removals.
