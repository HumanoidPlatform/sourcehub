# TwentyBN (Twenty Billion Neurons GmbH)

failure · light · status: **acquired** · also known as Twenty Billion Neurons, 20BN, Twentyone bc GmbH i.L.

> Rendered from `ledger/twentybn.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “"Datasets" (20bn.com/products/datasets, linked from TwentyBN's SDK README); under Qualcomm, the developer portal's "AI Datasets" section” and its bespoke side “none found”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c022, c039, c038 | First-party owner, not a marketplace. Licensor of record today is Qualcomm (licence 'defined by QualComm'); TwentyBN-era licence text unreachable. |
| economics_model | unknown |  | No price or fee for any dataset found; whether TwentyBN charged for commercial dataset licences is not reachable (20bn.com gone, no Wayback). |
| who_pays_fee | unknown |  |  |
| supply_models | own_collection | c009, c018, c034 | All inventory captured to spec by paid crowd workers on TwentyBN's own platform; no third-party supply found. |
| custody_model | copy_to_buyer | c026, c039, c040 | Files downloaded from the owner's site (20bn.com, then Qualcomm developer portal). |
| transaction_mode | unknown |  | Qualcomm-era downloads look free under a research licence but no page reachable here states the price or access steps; TwentyBN-era commercial route unknown. |
| public_prices | unknown |  |  |
| licence_model | unknown | c023, c038 | Qualcomm-era: a research-use data licence agreement / 'proprietary research license'. Whether a commercial tier exists, then or now, is not reachable. |
| exclusivity_offered | unknown |  |  |
| public_listing | unknown |  | Qualcomm dataset pages exist publicly (sitemap) but render only with JavaScript; access gate not visible. |
| buyer_vetting | unknown |  |  |
| sample_mechanics | unknown |  |  |
| versioning | unknown | c010, c027 | Something-Something grew from 108,499 clips (v1) to 220,847 (v2); what v1 holders got, and whether v1 is still offered, not found. |
| human_subject_consent_docs | not_addressed | c028 | For the TwentyBN-era datasets nothing on consent is published; the Qualcomm-era AirLetters datasheet asserts a signed consent form [asserted_only] (twentybn-c036). |
| contributor_pay_model | one_off | c012, c019, c043 | Per accepted task via Amazon Mechanical Turk; no royalty or resale share found. |
| catalogue_plus_custom | unknown |  | No evidence found of collection to order for clients. |
| erasure_after_sale | unknown | c037 | AirLetters lets participants email to revoke consent; what that means for copies already downloaded is not stated. |
| quality_evidence | operator_verified | c013, c020 | The data owner reviewed every submission (automatic checks plus human operators). |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | unknown | No evidence reached on who licensed TwentyBN datasets, in what unit or volume. |  |
| Q2 | not_applicable | TwentyBN published only its own datasets from its own site; it neither listed elsewhere nor ran a marketplace. |  |
| Q3 | sourced | All inventory was captured to spec by crowd workers recruited via Amazon Mechanical Turk onto TwentyBN's own platform; later Qualcomm-era sets state direct agreements permitting research and commercial use. | c009, c012, c019, c035, c042 |
| Q4 | unknown | No commissioned client work or resale carve-outs found. |  |
| Q5 | partial | Licensor of record moved with the asset sale: Something-Something v2 now carries a licence 'defined by QualComm' and Qualcomm hosts the successor datasets; who warranted consent is not published. | c002, c022, c039, c006 |
| Q6 | sourced | Buyers download copies from the owner's site: first 20bn.com, now Qualcomm's developer portal (manual download of 19 files for Something-Something v2). | c021, c026, c040 |
| Q7 | partial | Capturers were the people depicted, filming themselves at home; TwentyBN-era papers and cards say nothing about consent, while Qualcomm-era AirLetters/QEVD assert signed consent and research-plus-commercial agreements. | c018, c028, c036, c035, c042, c045 |
| Q8 | partial | Qualcomm-era sets are under a research-use / proprietary research licence; audit, leakage or fingerprinting terms not reachable. | c023, c038, c037 |
| Q9 | unknown | No price, checkout or sales route for TwentyBN datasets found; the only TwentyBN gate found is account-plus-evaluation-licence for SDK weights. | c031 |
| Q10 | partial | Something-Something grew from v1 (108,499 clips) to v2 (220,847) and moved to Qualcomm's portal; old 20bn.com dataset links are dead. What prior licensees kept is not published. | c010, c027, c024, c021, c001 |
| Q11 | partial | Quality evidence was the owner's own review (automatic checks plus human operators) and published benchmark papers; no pre-purchase sample mechanics found. | c013, c020, c045 |
| Q12 | partial | TwentyBN sold AI models/SDKs and published datasets; no custom collection for clients found. Former TwentyBN staff continue dataset work under Qualcomm. | c008, c014, c032, c046 |

## Claims

### positioning

- **c007** TwentyBN was an AI start-up founded in Berlin in 2015 with a subsidiary in Toronto, Canada.  
  _event · vendor_stated · as of 2015 (page_dated)_
  - “TwentyBN was an AI start-up founded in Berlin, Germany in 2015 with a subsidiary in Toronto, Canada.” — Twenty Billion Neurons GmbH, <https://twentybn.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** TwentyBN describes itself as having specialised in interactive visual AI systems for smart home, fitness and automotive.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The company specialized in interactive, visual AI systems for smart home, fitness and automotive.” — Twenty Billion Neurons GmbH, <https://twentybn.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c009** For Something-Something, TwentyBN asked crowd workers to record videos acting out given labels, instead of labelling videos found online.  
  _architecture · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_
  - “ask crowd-workers to provide videos given labels instead of the other way around” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The MIT paper says this about all three datasets it uses (Something-Something, Jester, Charades) and contrasts them with YouTube-type videos. The creators' paper (arXiv 1706.04261) says: 'We therefore ask crowd-workers to provide videos given labels instead of the other way around'. The profile cites a different source (the creators' paper or the HF card); the MIT paper is a separate, third-party source.
    - “the videos are collected by asking the crowd-source workers to record themselves performing instructed activities” — Zhou, Andonian, Oliva, Torralba (MIT CSAIL), arXiv / ECCV 2018, <https://arxiv.org/pdf/1711.08496> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is the operative sentence from section 4.1 of the Something-Something paper. The preceding text contrasts this with videos found via Google image search or YouTube, which supports 'instead of labelling videos found online'.
- **c010** The first Something-Something release contained 108,499 videos across 174 labels.  
  _number · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_ · **108499 video clips** (total clips in the version described in the 2017 paper (v1); one-off)
  - “It currently contains 108, 499 videos across 174” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Table 1 of the MIT Temporal Relation Networks paper (Dataset / Classes / Videos / Type). The vendor-authored paper (arXiv 1706.04261, TwentyBN staff) gives the same: 'It currently contains 108, 499 videos across 174 labels'. The profile cites a different source (the creators' paper or the HF card); the MIT paper is a separate, third-party source.
    - “Something-V1 174 108,499 human-object interaction” — Zhou, Andonian, Oliva, Torralba (MIT CSAIL), arXiv / ECCV 2018, <https://arxiv.org/pdf/1711.08496> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is cut before 'labels' (the PDF line break falls there), but '108, 499 videos across 174' carries the fact. 'First release' is fair: the paper's 'current version' is what later papers call Something-V1 (MIT TRN Table 1: 108,499).
- **c015** The Something-Something paper describes the challenges of crowd-sourcing this video data at scale.  
  _architecture · academic · as of 2017-06-15 (publication) · scope: Something-Something_
  - “We also describe the challenges in crowd-sourcing this data at scale.” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/abs/1706.04261> · academic · retrieved 2026-10-01 · quote check: exact
- **c016** The Jester gesture dataset contains 148,092 short video clips.  
  _number · academic · as of 2019 (publication) · scope: Jester v1_ · **148092 video clips** (total clips in Jester v1 as stated by the dataset authors; one-off)
  - “Total number of videos 148,092” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Table 1 of the MIT TRN paper. The vendor-authored ICCV 2019 workshop paper also gives 'Total number of videos 148,092'. The profile cites a different source (the creators' paper or the HF card); the MIT paper is a separate, third-party source.
    - “Jester 27 148,092 human hand gesture” — Zhou, Andonian, Oliva, Torralba (MIT CSAIL), arXiv / ECCV 2018, <https://arxiv.org/pdf/1711.08496> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote 'Total number of videos 148,092' is from the Jester paper's dataset table.
- **c018** Jester clips show the crowd workers themselves performing gestures, recorded in their own homes.  
  _architecture · academic · as of 2019 (publication) · scope: Jester v1_
  - “individuals performing the gesture in the convenience of their homes” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
- **c027** Something-Something v2 has 220,847 labelled clips of humans performing pre-defined actions with everyday objects.  
  _number · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_ · **220847 video clips** (total clips in v2 across train, validation and test, per the community card; one-off)
  - “a collection of 220,847 labeled video clips of humans performing pre-defined, basic actions” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The count is independently confirmed. The wording 'humans performing pre-defined, basic actions with everyday objects' comes from the dataset card (HuggingFaceM4 card on huggingface.co), not from the MIT paper. The profile cites a different source (the creators' paper or the HF card); the MIT paper is a separate, third-party source.
    - “Something-V2 174 220,847 human-object interaction” — Zhou, Andonian, Oliva, Torralba (MIT CSAIL), arXiv / ECCV 2018, <https://arxiv.org/pdf/1711.08496> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is from the HF card. 'Pre-defined, basic actions' is shortened to 'pre-defined actions', which is fine. The count is independently confirmed by MIT TRN Table 1. The value basis 'across train, validation and test' is not shown by the quote; the card's summary sentence does not split by subset.
- **c034** AirLetters was collected on a custom platform integrated with crowd-sourcing providers.  
  _architecture · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “we used a custom platform integrated with crowd-sourcing providers” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c035** AirLetters videos show participants' faces and were collected under a direct agreement with the crowd workers permitting research and commercial use.  
  _terms · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “the videos were collected under a direct agreement with the crowd workers, permitting research and commercial use” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c042** Qualcomm's QEVD fitness videos were collected under a direct agreement with crowd workers permitting research and commercial use.  
  _terms · academic · as of 2026-04-14 (publication) · scope: QEVD_
  - “The data was collected under a direct agreement with the crowd workers, permitting research and commercial use” — arXiv (Panchal et al., Qualcomm AI Research), <https://arxiv.org/html/2407.08101> · academic · retrieved 2026-10-01 · quote check: exact
- **c044** QEVD-Fit-300K's short labelled videos were crowd-sourced from over 1,900 participants.  
  _number · academic · as of 2026-04-14 (publication) · scope: QEVD-Fit-300K_ · **1900 participants** (lower bound ('over 1,900 unique participants') as stated by the authors; one-off)
  - “crowd-sourced from over 1,900” — arXiv (Panchal et al., Qualcomm AI Research), <https://arxiv.org/html/2407.08101> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — By nature this fact is known only to the dataset creators. The only source is their own paper, https://arxiv.org/html/2407.08101 (Panchal et al. (Qualcomm AI Research), arXiv), which says: 'crowd-sourced from over 1,900 unique participants in the wild'. Only source is the Qualcomm-authored paper (some authors footnoted 'Work performed at TwentyBN GmbH'); it is the vendor's own figure. The paper says 'unique participants'. No independent count; no search available. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **scope_ok** — The quote 'crowd-sourced from over 1,900' supports the statement. The paper adds 'unique participants in the wild'. as_of 2026-04-14 is the v5 revision date of the arXiv paper, which is fine.

### transaction

- **c031** To get the SenseKit weights, users had to create an account and agree to an evaluation licence before downloading.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: SenseKit weights_
  - “create an account, agree to evaluation license and download the weights” — Qualcomm Innovation Center GitHub (quic/sense), <https://github.com/quic/sense> · docs · retrieved 2026-10-01 · quote check: exact

### licence

- **c022** A community Hugging Face card for Something-Something v2 says its licence is a one-page document defined by Qualcomm.  
  _terms · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “License is a one-page document as defined by QualComm” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what one specific page says: the HuggingFaceM4 card (https://huggingface.co/datasets/HuggingFaceM4/something_something_v2), which is a third-party page, not TwentyBN's. Only that page can show it, and it is almost certainly the profile's own source, so this is not counted as independent. Re-fetched 2026-10-01; its Licensing Information reads 'License is a one-page document as defined by QualComm.' HuggingFaceM4 is Hugging Face's own multimodal research team, so 'community' here means 'not the dataset owner'. The Qualcomm licence page itself (qualcomm.com/developer/artificial-intelligence/datasets) rendered empty (JS) and could not be checked. Part 2 confirms this is the same URL the profile cites.
  - verifier (scope): **scope_ok** — The quote matches the card's Licensing Information. 'Community' card is accurate in the sense that the card is not the owner's: it is published by HuggingFaceM4, Hugging Face's own research team, not by Qualcomm or TwentyBN. Matrix use: the card is weak evidence for operator_role = reseller_licensor (that Qualcomm defines the licence is relayed by a third party); the licence page itself was not readable.
- **c023** The licence the card links for Something-Something v2 is a Qualcomm developer page titled as a data licence agreement for research use.  
  _terms · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “developer.qualcomm.com/downloads/data-license-agreement-research-use” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2/raw/main/README.md> · third_party_docs · retrieved 2026-10-01 · quote check: exact
- **c029** TwentyBN's real-time video SDK code, now in Qualcomm's quic GitHub organisation, is MIT-licensed and copyright 2020 Twenty Billion Neurons GmbH.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: Sense SDK_
  - “The code is copyright (c) 2020 Twenty Billion Neurons GmbH under an MIT Licence” — Qualcomm Innovation Center GitHub (quic/sense), <https://github.com/quic/sense> · docs · retrieved 2026-10-01 · quote check: exact
- **c030** The SDK README says pretrained weights carry a separate licence hosted on a 20bn.com licensing page.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: SenseKit weights_
  - “Pretrained weights come with a separate license available” — Qualcomm Innovation Center GitHub (quic/sense), <https://github.com/quic/sense> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** The AirLetters datasheet says the dataset would be released under a proprietary research licence.  
  _terms · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “we plan to release the dataset under a proprietary research license” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — This is a statement about what the creators' own datasheet says, so only that document can show it. Confirmed at https://arxiv.org/html/2410.02921 (Qualcomm AI Research, for Qualcomm Technologies Inc. and TwentyBN GmbH): 'Yes, we plan to release the dataset under a proprietary research license.' The same datasheet also says 'The dataset will be publicly downloadable through a website.' Part 2 confirms the profile cites this same arXiv page.
  - verifier (scope): **scope_ok** — The quote matches the datasheet answer. The statement correctly keeps the future tense ('would be released'). Matrix use: the profile keeps licence_model unknown, which is right because a plan in a 2024 datasheet is not the licence actually in force.

### custody

- **c021** The Jester paper directed users to download the videos from the Jester dataset website on 20bn.com.  
  _architecture · academic · as of 2019 (publication) · scope: Jester v1_
  - “The videos can be downloaded at the jester-dataset website” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
- **c026** The Hugging Face loader cannot fetch Something-Something v2 itself: users must manually download 19 data files and a labels file from Qualcomm's developer site.  
  _architecture · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “please download the 19 data files and the labels file” — Hugging Face (HuggingFaceM4 loader script), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2/raw/main/something_something_v2.py> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about a Hugging Face loader, a third-party artefact, so only that loader can show it. Re-fetched the loader script https://huggingface.co/datasets/HuggingFaceM4/something_something_v2/raw/main/something_something_v2.py on 2026-10-01: 'To use Something-Something-v2, please download the 19 data files and the labels file' from developer.qualcomm.com/software/ai-datasets/something-something. That Qualcomm URL now 301-redirects to qualcomm.com/developer/artificial-intelligence/datasets, which rendered empty (JS), so the download step on Qualcomm's side could not be checked. The dataset card itself does not state the file count; only the script does. Part 2 confirms the profile cites this same loader-script URL.
  - verifier (scope): **quote_incomplete** — The quote shows '19 data files and the labels file' but not where from. Words that would: "from 'https://developer.qualcomm.com/software/ai-datasets/something-something'" in the same loader docstring. Note that URL now 301-redirects to qualcomm.com/developer/artificial-intelligence/datasets (JS-only page). 'Cannot fetch itself' is an inference from the manual-download instruction; it is reasonable.
- **c039** AirLetters is hosted and maintained by Qualcomm Technologies Inc.  
  _architecture · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “The dataset is hosted and maintained by Qualcomm Technologies Inc” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c040** AirLetters was to be publicly downloadable through a website.  
  _architecture · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “The dataset will be publicly downloadable through a website” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact

### vetting

- **c013** A Something-Something submission was accepted automatically only if it passed quality-control checks such as video length and uniqueness.  
  _architecture · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_
  - “A submission is accepted automatically, if it passes a number of quality control checks” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact
- **c020** Jester submissions were reviewed by a human operator to ensure the recordings were correct.  
  _architecture · academic · as of 2019 (publication) · scope: Jester v1_
  - “reviewed by a human operator” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
- **c028** Under 'Personal and Sensitive Information' the Something-Something v2 card says nothing on it was specifically discussed in the paper.  
  _terms · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “Nothing specifically discussed in the paper” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about the HuggingFaceM4 card's text, a third-party page; only that page can show it, and it is probably the profile's own source. Re-fetched 2026-10-01: under Personal and Sensitive Information it reads 'Nothing specifically discussed in the paper.' Not independent. Part 2 confirms this is the same URL the profile cites.
  - verifier (scope): **scope_ok** — The quote matches the card. Matrix use: the third-party card's silence supports human_subject_consent_docs = not_addressed only for the TwentyBN-era Something-Something v2, not for the Qualcomm-era sets (the profile's matrix note already says so).
- **c036** The AirLetters datasheet states that crowd workers signed a consent form; the form itself is not reproduced.  
  _terms · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “Yes, crowdworkers signed a consent form” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c045** QEVD videos were screened with a detector for problems such as people in the background, and flagged videos were inspected and removed.  
  _architecture · academic · as of 2026-04-14 (publication) · scope: QEVD_
  - “a detector was used on all videos to detect any issues, such as individuals in the background” — arXiv (Panchal et al., Qualcomm AI Research), <https://arxiv.org/html/2407.08101> · academic · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c011** The first Something-Something release was generated by 1,133 crowd workers.  
  _number · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_ · **1133 crowd workers** (distinct contributors to v1 as stated by the dataset authors; one-off)
  - “the dataset was generated by 1133 crowd workers” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — By nature this fact is known only to the dataset creators. The only source is their own paper, https://arxiv.org/pdf/1706.04261 (Goyal et al. (TwentyBN staff), arXiv / ICCV 2017), which says: 'the dataset was generated by 1133 crowd workers'. Only source is the dataset creators' own paper (all authors TwentyBN); it is on another domain and peer-reviewed, but it is the vendor's own count, not an independent measurement. Third-party papers (MIT TRN, MIT-IBM TSM) restate video and class counts but not the worker count. No search available. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **scope_ok** — The quote matches the statement exactly. It is the version described in the June 2017 paper ('In its current version').
- **c012** TwentyBN's collection platform reported accept/reject results back to Amazon Mechanical Turk so that accepted Something-Something tasks were paid.  
  _architecture · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_
  - “allow for payments for the accepted tasks” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — By nature this fact is known only to the dataset creators. The only source is their own paper, https://arxiv.org/pdf/1706.04261 (Goyal et al. (TwentyBN staff), arXiv / ICCV 2017), which says: 'the result (accept/reject) and allow for payments for the accepted tasks'. The creators' own paper (section 4.5, Data collection platform) describes its platform. The Jester paper (ICCVW 2019, also TwentyBN) describes the same platform interacting with Amazon Mechanical Turk. No third-party account of TwentyBN's pay mechanics exists or could be found; no search available. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **quote_incomplete** — The fact is right, but the quote 'allow for payments for the accepted tasks' does not show the platform reporting accept/reject back to AMT. Words that would: 'our platform communicates with AMT to communicate the result (accept/reject)' (arXiv 1706.04261 section 4.5; 'commu-nicate' is hyphenated across lines in the PDF).
- **c017** Jester was recorded by 1,376 crowd workers acting as actors.  
  _number · academic · as of 2019 (publication) · scope: Jester v1_ · **1376 crowd workers (actors)** (distinct contributors as stated by the dataset authors; one-off)
  - “Number of actors 1376” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — By nature this fact is known only to the dataset creators. The only source is their own paper, https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf (Materzynska et al. (TwentyBN staff), ICCV Workshops 2019, CVF Open Access), which says: 'the help of 1, 376 crowd-workers'. The paper's Table 1 also reads 'Number of actors 1376'. It is the creators' own peer-reviewed paper, so it shows TwentyBN stated the count, not that a third party checked it. No third-party source for the actor count; no search available. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **scope_ok** — The quote 'Number of actors 1376' is from the table. The same paper says the actors were crowd workers ('the help of 1, 376 crowd-workers'), so 'crowd workers acting as actors' holds.
- **c019** On TwentyBN's platform a successful Jester task resulted in a payment, and an unsuccessful one could be re-done rather than rejected outright.  
  _architecture · academic · as of 2019 (publication) · scope: Jester v1_
  - “The outcome is either successful and results in a pay” — CVF Open Access (Materzynska et al., TwentyBN), <https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf> · academic · retrieved 2026-10-01 · quote check: exact
- **c033** AirLetters was recorded by 1,781 crowd workers.  
  _number · academic · as of 2024-10-03 (publication) · scope: AirLetters_ · **1781 crowd workers** (distinct contributors as stated by the dataset authors; one-off)
  - “with 1781 crowd workers contributing” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — By nature this fact is known only to the dataset creators. The only source is their own paper, https://arxiv.org/html/2410.02921 (Dagli et al. (Qualcomm AI Research), arXiv / ECCV 2024 HANDS workshop), which says: 'with 1781 crowd workers contributing'. Only source is the creators' own paper; its datasheet says the creators are the authors 'on behalf of Qualcomm Technologies Inc. and TwentyBN GmbH', so this is the vendor's (successor's) own count. No third-party count found; no search available. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **scope_ok** — The quote matches the statement for AirLetters.
- **c043** QEVD participants received compensation the authors describe as appropriate and fair for their region.  
  _terms · academic · as of 2026-04-14 (publication) · scope: QEVD_
  - “Participants received appropriate and fair compensation for the regions where they were located” — arXiv (Panchal et al., Qualcomm AI Research), <https://arxiv.org/html/2407.08101> · academic · retrieved 2026-10-01 · quote check: exact

### post_sale

- **c037** AirLetters participants may seek to revoke consent by emailing the dataset owners.  
  _terms · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “Yes, the participants may reach out to us via email” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c041** The AirLetters datasheet says any dataset updates should be communicated through the dataset web page.  
  _terms · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “changes should be communicated through the dataset web page” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c014** The 2017 Something-Something paper said TwentyBN planned to make 'a version' of the dataset available on twentybn.com.  
  _offer · academic · as of 2017-06-15 (publication) · scope: Something-Something v1_
  - “We plan to make a version of the dataset available at” — arXiv (Goyal et al., TwentyBN), <https://arxiv.org/pdf/1706.04261v2> · academic · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** As of 2026-10-01 the TwentyBN website is only a notice saying the company's assets were acquired by Qualcomm, Inc. in July 2021.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “The company's assets were ultimately acquired by NASDAQ-listed Qualcomm, Inc. in July 2021.” — Twenty Billion Neurons GmbH, <https://twentybn.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about the content of TwentyBN's own homepage, so by nature only that page can show it. Re-fetched https://twentybn.com/ (20bn.com 301-redirects there) on 2026-10-01: no navigation, product or dataset content; it carries the Qualcomm July 2021 asset-acquisition notice, a short company history, contacts (corpcomm@qualcomm.com for technology enquiries) and the footer of the remaining entity 'Twentyone bc GmbH i.L.' (i.L. = in liquidation). 'Only a notice' is fair, but the notice also says the remaining entity was renamed and is in liquidation. WebSearch not available in this run.
  - verifier (scope): **scope_ok** — The quote supports the acquisition notice. 'Only a notice' is an observed absence (no navigation, products or datasets), which cannot be quoted, so the statement rightly carries it. The page also names the liquidating entity 'Twentyone bc GmbH i.L.' (covered by c003-c005). source_class vendor_marketing is generous for what is really a corporate legal notice, but harmless.
- **c002** Twenty Billion Neurons GmbH's assets were acquired by Qualcomm, Inc. in July 2021 (the newest dated event found).  
  _event · vendor_stated · as of 2021-07 (page_dated)_
  - “The company's assets were ultimately acquired by NASDAQ-listed Qualcomm, Inc. in July 2021.” — Twentyone bc GmbH i.L., <https://twentyonebc.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — Independent press and the German commercial register ought to exist but could not be reached: no search available (WebSearch not offered in this run), and handelsregister.de is form-gated. The only other page found, https://www.twentyonebc.com/ (the liquidating successor's site, run by Breuer Consulting), repeats the twentybn.com sentence word for word, and it is the profile's own source for this claim, so it is not counted. SEC EDGAR full-text search for "Twenty Billion Neurons" and "TwentyBN" returned 0 hits (the same search for Veoneer returns Qualcomm 10-Ks, so the search works). Circumstantial support only: TwentyBN's 'sense' code (copyright Twenty Billion Neurons GmbH) now sits in Qualcomm's github.com/quic org, and Qualcomm AI Research papers footnote authors' 'Work performed at TwentyBN GmbH'. On 'newest dated event': Qualcomm archived that repository on 7 Jan 2025 (see missed twentybn-v002). This is a later dated event concerning TwentyBN's assets, though not the company itself. Reclassified after Part 2: in the blind step this was recorded as confirmed_relayed, but this is the same document the profile cites, so it is not a second source.
  - verifier (scope): **scope_ok** — The quote supports July 2021 and Qualcomm, Inc. The page is undated, so as_of 2021-07 with as_of_basis page_dated reflects the date stated in the text, not a page date; 'publication' or 'retrieved_only' would be more accurate. The parenthetical 'newest dated event found' is weakened by Qualcomm archiving TwentyBN's sense repository on 2025-01-07 (missed twentybn-v002).
- **c003** After the 2021 asset sale the residual TwentyBN legal entity was renamed Twentyone bc GmbH and moved to Hamburg for liquidation proceedings.  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “the remaining legal entity was renamed Twentyone bc GmbH and relocated to Hamburg for liquidation proceedings” — Twenty Billion Neurons GmbH, <https://twentybn.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c004** The liquidating entity's own site says Twentyone bc GmbH i.L. was the remaining legal entity after the 2021 asset sale and was subsequently dissolved (no date given).  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “assets in 2021 and was subsequently dissolved” — Twentyone bc GmbH i.L., <https://twentyonebc.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c005** The liquidating entity Twentyone bc GmbH i.L. is registered at the Berlin-Charlottenburg local court under HRB 166984.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “AG Berlin Charlottenburg HRB 166984” — Twentyone bc GmbH i.L., <https://twentyonebc.com> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c006** TwentyBN's notice page sends enquiries about TwentyBN's technology to a Qualcomm corporate-communications address.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only)_
  - “For inquiries about TwentyBN's technology, please contact: corpcomm@qualcomm.com” — Twenty Billion Neurons GmbH, <https://twentybn.com/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** The card gives Qualcomm's developer site as the homepage of Something-Something v2.  
  _offer · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “Homepage:** https://developer.qualcomm.com/software/ai-datasets/something-something” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2/raw/main/README.md> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.25
- **c025** The card names a Qualcomm research-datasets email address as point of contact for Something-Something v2.  
  _offer · independent · as of 2026-10-01 (retrieved_only) · scope: Something-Something v2_
  - “research.datasets@qti.qualcomm.com” — Hugging Face (HuggingFaceM4 community card), <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2/raw/main/README.md> · third_party_docs · retrieved 2026-10-01 · quote check: missing 0.00
- **c032** The AirLetters datasheet (2024) says the dataset was created on behalf of Qualcomm Technologies Inc. and TwentyBN GmbH.  
  _event · academic · as of 2024-10-03 (publication) · scope: AirLetters_
  - “on behalf of Qualcomm Technologies Inc. and TwentyBN GmbH” — arXiv (Dagli et al., Qualcomm / TwentyBN), <https://arxiv.org/html/2410.02921> · academic · retrieved 2026-10-01 · quote check: exact
- **c046** Two QEVD co-authors are footnoted as having done the work at TwentyBN GmbH.  
  _event · academic · as of 2026-04-14 (publication) · scope: QEVD_
  - “Work performed at TwentyBN GmbH” — arXiv (Panchal et al., Qualcomm AI Research), <https://arxiv.org/html/2407.08101> · academic · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Independent academic groups used TwentyBN's datasets as public benchmarks: MIT CSAIL's Temporal Relation Networks paper evaluated on Something-Something (v1 and v2) and Jester.  
  _outcome · academic · as of 2018 (publication) · scope: Something-Something v1/v2; Jester v1_
  - “using three recent video datasets - Something-Something, Jester, and Charades” — Zhou, Andonian, Oliva, Torralba (MIT CSAIL), arXiv / ECCV 2018, <https://arxiv.org/pdf/1711.08496> · academic · retrieved 2026-10-01 · quote check: exact
- **v002** Qualcomm archived the GitHub repository holding TwentyBN's real-time video SDK code (quic/sense) on 7 January 2025, making it read-only.  
  _event · vendor_stated · as of 2025-01-07 (page_dated) · scope: sense SDK_
  - “This repository was archived by the owner on Jan 7, 2025. It is now read-only.” — Qualcomm Innovation Center (GitHub), <https://github.com/quic/sense> · docs · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.economics_model` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>, <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>
- `matrix.who_pays_fee` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>, <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>
- `matrix.transaction_mode` — js_empty; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>, <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>
- `matrix.public_prices` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>, <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>
- `matrix.licence_model` — not_found; tried <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>, <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>
- `matrix.exclusivity_offered` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>, <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>
- `matrix.public_listing` — js_empty; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>
- `matrix.buyer_vetting` — js_empty; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>, <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>
- `matrix.sample_mechanics` — js_empty; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>, <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>
- `matrix.versioning` — not_published; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>, <https://huggingface.co/datasets/HuggingFaceM4/something_something_v2>
- `matrix.catalogue_plus_custom` — not_found; tried <https://twentybn.com/>, <https://github.com/quic/sense>, <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>
- `matrix.erasure_after_sale` — not_published; tried <https://arxiv.org/html/2410.02921>, <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>
- `questions.Q1` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>, <https://medium.com/twentybn>
- `questions.Q4` — not_found; tried <https://twentybn.com/>, <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>
- `questions.Q9` — js_empty; tried <https://www.qualcomm.com/developer/artificial-intelligence/datasets>, <https://www.qualcomm.com/developer/software/something-something-v-2-dataset>, <https://www.qualcomm.com/developer/software/jester-dataset>, <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>, <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>, <https://20bn.com/licensing/sdk/evaluation>, <https://twentybn.com/>
- `other.twentybn_era_dataset_licence` — not_found; tried <https://20bn.com/datasets/something-something>, <https://20bn.com/products/datasets>
- `other.qualcomm_research_licence_text` — not_found; tried <https://developer.qualcomm.com/downloads/data-license-agreement-research-use?referrer=node/68935>
- `other.acquisition_terms_and_press` — not_found; tried <https://efts.sec.gov/LATEST/search-index?q=%22Twenty%20Billion%20Neurons%22>, <https://efts.sec.gov/LATEST/search-index?q=%22TwentyBN%22>, <https://www.qualcomm.com/sitemap.xml>
- `other.twentybn_blog` — blocked; tried <https://medium.com/twentybn>
- `other.qualcomm_memisevic_interview` — js_empty; tried <https://www.qualcomm.com/news/onq/2021/09/qa-ai-researcher-roland-memisevic-discusses-secret-dataset-generation-data>

## Conflicts

- c003, c004: twentybn.com says the residual entity was relocated to Hamburg for liquidation proceedings; twentyonebc.com says it was subsequently dissolved. Both undated; dissolution is the later stage, so the entity is treated as dissolved. (newer_wins_status)

## Leads, not cited

- <https://www.qualcomm.com/news/onq/2021/09/qa-ai-researcher-roland-memisevic-discusses-secret-dataset-generation-data> — Qualcomm OnQ interview (Sept 2021) with TwentyBN co-founder on dataset generation; JS-rendered, body not readable here.
- <https://www.qualcomm.com/developer/software/something-something-v-2-dataset/downloads> — Qualcomm download page for Something-Something v2 (from sitemap); JS-rendered. Would show current licence and access gate.
- <https://www.qualcomm.com/developer/software/jester-dataset/downloads> — Qualcomm download page for Jester (from sitemap); JS-rendered.
- <https://www.qualcomm.com/developer/blog/2025/01/qualcomm-ai-research-publishes-datasets-for-research-use> — Qualcomm blog (Jan 2025) on publishing datasets for research use; JS-rendered.
- <https://medium.com/twentybn> — TwentyBN's own blog (403 to fetcher); likely held dataset licensing announcements.
- <https://www.qualcomm.com/developer/software/qevd-dataset/downloads> — QEVD fitness dataset, likely built on TwentyBN fitness captures; JS-rendered.
