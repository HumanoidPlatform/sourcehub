# AI-Hub (Korea)

government · light · status: **active** · also known as AI Hub, AIHub, aihub.or.kr

> Rendered from `ledger/korea-ai-hub.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “AI 허브 개방 데이터 (AI-Hub open data), alongside 기관 제공 데이터 (institution-provided data) and 독자 AI모델 데이터 (sovereign AI model data)” and its bespoke side “none on AI-Hub itself; it links out to private 'AI데이터 거래소' (AI data exchanges)”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | mixed | c007, c020, c037, c023 | NIA co-holds rights in, and sets the terms for, the data it commissioned; for institution-provided data AI-Hub only presents the listing and the provider's own terms apply. |
| economics_model | free | c024, c059 | Government-funded; no charge to users found anywhere on the site. |
| who_pays_fee | not_applicable | c024 | No fee is charged to users or providers. |
| supply_models | own_collection, third_party_providers | c006, c007, c066, c075, c002, c057, c038 | own_collection = datasets NIA commissions from vendor consortia under government programmes, with rights co-held by NIA and the builders; third_party_providers = institution-provided data, sovereign-model team data, company and university data. |
| custody_model | mixed | c047, c030, c033, c037, c035, c070 | Open data is downloaded to the user's machine; safe-zone data stays on NIA servers; institution-provided data and linked exchanges are presented as listings or links only. |
| transaction_mode | free_download | c049, c018, c024 | Application with stated purpose; auto-approved for most open data, reviewed for other data and the safe zone. |
| public_prices | not_applicable | c024 | Data is distributed free of charge. |
| licence_model | mixed | c008, c048, c020, c021 | One standard AI-Hub usage policy for NIA data; institution-provided and some hosted datasets (KETI, competition data) carry their own terms. |
| exclusivity_offered | unknown |  |  |
| public_listing | public_indexable | c019, c067 | Dataset pages with schema, statistics and builder contacts load without login; the data and even the sample button require login. |
| buyer_vetting | case_by_case | c018, c050, c044, c031, c032 | Identity-verified Korean nationals get auto-approval for most open data; review data and the safe zone are checked per application (IRB for medical data). |
| sample_mechanics | free_sample_download | c063 | A processed 'sample (light) data' file is offered per dataset; in the page markup the button calls a login prompt for anonymous visitors. |
| versioning | unknown |  | Dataset pages show a version change history (c065, c056) but nothing says whether earlier versions stay available. |
| human_subject_consent_docs | asserted_only | c071, c074, c040 | Listings assert that portrait rights were resolved and data de-identified; no consent or release documents are offered to users. |
| contributor_pay_model | not_applicable | c024, c072 | Data is given away, not sold, so no sale proceeds reach individual capturers or labellers; how builders pay crowd workers is not published. |
| catalogue_plus_custom | catalogue_only | c006, c034 | No build-to-order service for users was found; bespoke collection sits with the private exchanges AI-Hub links to. |
| erasure_after_sale | contractual_deletion | c016, c012 | Users must delete a dataset if personal information is found, and NIA may demand return or destruction. |
| quality_evidence | unknown |  | Listings show validation-model scores produced by the building consortium (c073); whether NIA or a third party checks them was not found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Users are Korean researchers, companies and public bodies who download whole datasets free (977 open datasets, 630 image and 110 video); listings show view and download counts but no buyer mix. Datasets such as K-Stock target gaps global stock sources leave. | c005, c051, c052, c053, c067, c068 |
| Q2 | partial | Providers opening data through AI-Hub are offered NIA-funded quality and de-identification support worth 60 million won per dataset, publicity and usage statistics; publication is decided by an NIA committee. | c060, c062, c038, c054, c022 |
| Q3 | sourced | Most inventory is built by vendor consortia under government programmes, with rights co-held by the builders and NIA; the rest comes from institutions, sovereign-model teams, companies and universities. | c006, c007, c066, c075, c076, c002, c057, c038, c022 |
| Q4 | partial | Commercial resale of a dataset needs a separate agreement with the building organisation, which keeps co-ownership; NIA may change the terms without notice. No dispute over changed terms was found. | c015, c007, c027 |
| Q5 | partial | NIA operates the platform with MSIT and co-holds rights with the builders; users bear all liability for misuse; providers bear liability for infringing content; AI-Hub warrants nothing about others' content. | c004, c007, c020, c014, c023, c025, c026 |
| Q6 | sourced | Open data is copied to the user's machine inside Korea; sensitive data (medical, broadcast) stays in the safe zone and only trained models leave; institution data and private exchanges are links. | c047, c045, c030, c033, c058, c037, c035, c070 |
| Q7 | partial | Listings assert that portrait and IP rights were cleared and data de-identified; a face dataset was cut back when consent forms were renewed; users must delete data containing personal information. | c071, c074, c039, c040, c016, c017, c032 |
| Q8 | sourced | A non-open licence by policy: for-profit R&D and selling trained models allowed, but no redistribution of raw data, no third-party sharing, attribution required, Korea-only use; NIA may demand destruction. | c008, c009, c013, c041, c042, c048, c010, c011, c044, c045, c012 |
| Q9 | sourced | No transaction: users apply with a purpose and identity check, most datasets are auto-approved for three months, and all access is free. | c049, c050, c018, c046, c024, c059, c069 |
| Q10 | partial | A dataset is source data plus labelling data with train/validation/sample splits (test withheld), a version history and a three-month use approval; what happens to past downloads on revision is not stated. | c040, c043, c065, c056, c046, c074 |
| Q11 | partial | Before download users see full descriptions, schemas, statistics, a processed sample and baseline-vs-measured scores of a validation model; NIA publishes quality guidelines but disclaims others' content. | c063, c073, c019, c077, c025 |
| Q12 | partial | AI-Hub is catalogue-only; for commercial and custom data it links out to four private exchanges including CrowdWorks's dataset store. | c034, c035, c036, c006 |

## Claims

### positioning

- **c001** AI-Hub is operating: on 2026-09-04 NIA posted a notice on AI-Hub inviting universities to offer and register AI training data.  
  _status · vendor_stated · as of 2026-09-04 (page_dated) · scope: AI-Hub, South Korea_
  - “대학 부문 AI 학습용데이터 제공·등록 수요조사 참여 안내” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10569> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Confirms the operating status, not the specific notice. Two government releases dated within two months show AI-Hub in use as a distribution channel: the commission's of 2026-08-05 (quoted) and MSIT's of 2026-08-27 (embargoed to 2026-08-28), which says 29 datasets from the sovereign AI foundation-model project are open on AI-Hub for free download (https://www.korea.kr/briefing/pressReleaseView.do?newsId=156775729; text only in the attached .hwpx/.odt). Separately, NIA's 2026-09-30 release links to AI-Hub. The 2026-09-04 notice inviting universities to offer and register data exists only on AI-Hub: Korea Policy Briefing's releases for 2026-09-01 to 09-12 contain no matching item. Web search was not available.
    - “개방되는 데이터는 인공지능 허브 안심 구역 누리집(https://www.aihub.or.kr/)을 통해 확인 가능하며” — Broadcasting Media Communications Commission (방송미디어통신위원회), press release of 2026-08-05 via Korea Policy Briefing, <https://www.korea.kr/common/download.do?fileId=198520367&tblKey=GMN> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The cited notice is dated 2026-09-04 on the page and its title matches the quote. Precision: it is a demand survey run jointly by MSIT and NIA to find candidate university data for the planned integrated training-data provision system (통합제공시스템) under Art. 15 of the AI Basic Act, with replies due 2026-09-11. It is not an invitation to list on AI-Hub as such. That is fine for a status claim, because the notice shows the site is live.
- **c004** AI-Hub is a national AI development support platform operated by the Ministry of Science and ICT (MSIT) and the National Information Society Agency (NIA).  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “과학기술정보통신부와 한국지능정보사회진흥원이 운영하는 국가 AI 개발 지원 플랫폼으로” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/intrcn.do?currMenu=150&topMenu=105> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c003** The sovereign AI model data released in August 2026 includes large-scale pre-training data, video- and speech-based multimodal data and red-teaming data.  
  _offer · vendor_stated · as of 2026-08-31 (page_dated) · scope: AI-Hub, South Korea_
  - “대규모 사전학습 데이터와 영상·음성 기반 멀티모달 데이터, 레드티밍 데이터 등으로 구성되어” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10567> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c006** AI-Hub publishes AI training data built under the government's intelligent-information-industry infrastructure programme (14 fields) plus training data held by domestic and foreign institutions and companies.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “지능정보산업 인프라 조성사업으로 추진한 AI 학습용 데이터(14개 분야)와 국내외 기관/기업에서 보유한 AI 학습용 데이터를 공개” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/intrcn.do?currMenu=150&topMenu=105> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c022** The AI-Hub terms of use define a providing organisation as an administrative body, public body, or private individual or company that opens its information resources as a shared service.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “공유서비스의 방식으로 개방, 제공하는 행정기관, 공공기관 및 민간 개인과 법인 등을 말한다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c034** AI-Hub's 'AI data exchange' page invites companies that want their data exchange listed to email AI-Hub, which then registers them.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI 데이터 거래소로 등록을 희망하는 기업은 이메일 주소 aihub@aihub.kr로 연락 주시면 확인 후 등록을 진행하겠습니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/devsport/aidataexchn/list.do?currMenu=523&topMenu=101> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** CrowdWorks's dataset store is one of the private exchanges AI-Hub links to from its 'AI data exchange' page.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “크라우드웍스는 Agentic AI, 생성형 AI, 언어모델, 데이터 등 기업을 위한 다양한 맞춤형 솔루션을 제공하는 AI 테크 기업입니다” — AI-Hub (NIA), <https://www.aihub.or.kr/devsport/aidataexchn/list.do?currMenu=523&topMenu=101> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** In March 2025 AI-Hub said it offered 908 datasets, the most in Korea, and invited companies to share their own data through it.  
  _number · vendor_stated · as of 2025-03-05 (page_dated) · scope: AI-Hub, South Korea_ · **908 datasets** (AI-Hub's own count of datasets offered; as at 2025-03)
  - “현재 국내에서 가장 많은 데이터(908종)를 제공하는 AI 허브가 이제 민간기업과 협력하고자 합니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10405> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** AI-Hub says 42 datasets from the 2025 AI training-data programme (LLM, LMM, synthetic and reasoning data) were officially opened on 30 June 2026.  
  _number · vendor_stated · as of 2026-06-30 (page_dated) · scope: AI-Hub, South Korea_ · **42 datasets** (datasets opened in the 2025 programme release; one-off)
  - “LLM, LMM, 합성데이터, 추론데이터로 구성된 총 42종의 데이터를 공개하오니” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10549> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source reached. Korea Policy Briefing's press-release list for 2026-06-22 to 2026-07-10, scanned for AI-Hub and training-data keywords, has no MSIT or NIA release about opening the 2025 programme's datasets; NIA's own press list has none on or near 30 June either. Context only: the Board of Audit and Inspection report (July 2026) says data built in 2025 had not yet been released when it analysed the programme ('2025년 구축 데이터는 아직 공개되지 않아 제외'), which is consistent with a mid-2026 release but does not confirm the date or the count of 42. Press coverage would normally exist; web search was not available.
  - verifier (scope): **scope_ok** — The notice is dated 2026-06-30 and the statement is correctly framed as 'AI-Hub says'. The same notice adds that the 2025 safe-zone data and some other data require a separate application and approval.
- **c057** The Broadcasting Media Communications Commission and the Korea Radio Promotion Association (RAPA) opened 10 broadcast-video AI training datasets totalling 1,175,800 items through the AI-Hub safe zone in August 2026.  
  _number · vendor_stated · as of 2026-08-05 (page_dated) · scope: AI-Hub, South Korea_ · **1175800 items** (total items across 10 broadcast-video datasets opened via the safe zone; one-off)
  - “방송영상 AI 학습용 데이터 10종(총 117만 5,800건)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10554> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The commission that owns the data (not NIA) announced on 2026-08-05 with RAPA that it was opening the broadcast-video training data through NIA's 'AI-Hub Safe Zone'; the annex table lists ten datasets with the total '합 계 1,175,800'. Listing page: https://www.korea.kr/briefing/pressReleaseView.do?newsId=156773395. Source class is a government press release by the data-owning partner; recorded as third_party_docs. The release also says the safe zone is free but requires an application and approval in advance. Found by paging korea.kr's dated press-release list; web search was not available.
    - “자막 등 10개 유형으로 총 117만여 건이 제공된다” — Broadcasting Media Communications Commission (방송미디어통신위원회), press release of 2026-08-05 via Korea Policy Briefing, <https://www.korea.kr/common/download.do?fileId=198520367&tblKey=GMN> · third_party_docs · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (scope): **scope_ok** — The AI-Hub notice is dated 2026-08-05 and matches the commission's own release of the same day (total 1,175,800).
- **c060** NIA's 2026 private-sector data survey offers each selected providing company technical and financial support worth 60 million won per dataset, up to 100 datasets.  
  _number · government · as of 2026-08-03 (page_dated) · scope: AI-Hub, South Korea_ · **60000000 KRW per dataset** (in-kind and financial quality and de-identification support paid by NIA to a data-providing company; cap 100 datasets; one-off)
  - “기술적·재정적 지원(1종당 0.6억원, 최대 100종)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10552> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The support amount and cap are terms of NIA's own programme notice. One attempt to find a relay outside AI-Hub: NIA's notice board on nia.or.kr (cbIdx=99835, 12 pages) and the government support portal bizinfo.go.kr (keyword filter ignored); neither showed it. Web search was not available.
  - verifier (scope): **scope_wrong** — The claim is scoped to product 'AI-Hub', but the notice (nttSn=10552, 2026-08-03) is an MSIT and NIA survey to find candidate data for the planned 'AI training-data integrated provision system' (통합제공시스템) under Art. 15 of the AI Basic Act. The notice is only posted on AI-Hub. The Board of Audit report describes that system as a separate 'National AI Data Cluster' with a pilot due in December 2026. The KRW 60m per dataset (max 100) is quality-consulting and de-identification support for selected data ('품질지원(컨설팅 등), 비식별화 등 기술적·재정적 지원'), not a payment for listing on AI-Hub. It should not feed AI-Hub's economics or supply fields. The parallel university survey (c001's notice) offers only '0.6억원 상당' of technical support.
- **c066** The K-Stock content dataset (2025) was built by a consortium whose lead performing organisation is Twigfarm.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “수행기관(주관) : 트위그팜” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The building partner's own site, not NIA's, says Twigfarm won the K-Stock content data project as lead organisation (주관기관). A later Twigfarm post (https://www.twigfarm.net/ko/news/twigfarm-nia-2025-kstock-ai-excellent-rating, 2026-02-13) says the 'Twigfarm consortium' received an 'excellent' final evaluation in NIA's 2025 hyperscale-AI ecosystem programme. Partner-authored, so it is independent of the operator but not of the contractor.
    - “'K-스톡 콘텐츠 데이터 구축' 과제(주관기관)와” — Twigfarm (news post of 2025-07-14 restating a Money Today article), <https://www.twigfarm.net/ko/news/twigfarm-korea-ai-ecosystem-projects-2025> · third_party_docs · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — dataSetSn=71969 shows '구축년도 : 2025' and '수행기관(주관) : 트위그팜'. The page is also tagged '# 크라우드 소싱' and shows '갱신년월 : 2026-06'.
- **c075** The 2024 essential-medical-knowledge dataset codes its QA items by source, and CrowdWorks is one of the six coded sources alongside five hospitals.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “(1) qa_id: 1-보라매병원, 2-삼성서울병원, 3-서울대병원, 4-서울성모병원, 5-세브란스병원, 6-크라우드웍스” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71875> · docs · retrieved 2026-10-01 · quote check: exact
- **c076** The 2024 essential-medical-knowledge dataset's lead performing organisation is the Catholic University of Korea industry-academic cooperation foundation.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “수행기관(주관) : 가톨릭대학교 산학협력단” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71875> · docs · retrieved 2026-10-01 · quote check: exact

### object_model

- **c040** AI-Hub says its data is provided as source data and labelling data after the collected raw data goes through personal-information de-identification and cleaning.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “수집한 원시 데이터를 개인정보 비식별화 및 정제 과정을 거쳐 '원천 데이터'와 '라벨링 데이터'로 구성하여 제공합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c043** AI-Hub datasets are split into training, validation, test and sample sets, and the test set is not released.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “이 중 Test(테스트셋) 데이터는 개방하지 않습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
- **c046** An AI-Hub data-use approval is valid for three months from approval, after which the user must apply again.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI 허브 데이터 이용 승인은 승인일로부터 3개월간 유효합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
- **c056** The 2025-programme datasets were opened in beta on 18 May and officially on 30 June 2026.  
  _event · vendor_stated · as of 2026-06-30 (page_dated) · scope: AI-Hub, South Korea_
  - “5월 18일 베타 개방 이후 6월 30일 정식 개방되었습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10549> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c065** AI-Hub dataset pages carry a version change history; the K-Stock content dataset shows version 1.1 'final data opening' after a 1.0 beta.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “데이터 최종 개방” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact

### listing

- **c051** AI-Hub's open-data catalogue page lists 977 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_ · **977 datasets** (count shown on AI-Hub's open-data list page, all fields and years; as at retrieval)
  - “데이터셋 (977건)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/list.do?currMenu=115&topMenu=100> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A live count on AI-Hub's own catalogue page. Independent context, not confirmation: the Board of Audit and Inspection report (July 2026, https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN) says 908 MSIT-built datasets were open on AI-Hub in November 2025 (915 released, 7 suspended for re-verification), before the 2025 programme's and the foundation-model project's datasets were added. A count of 977 in October 2026 is plausible against that. Web search was not available.
  - verifier (scope): **scope_ok** — Re-fetched 2026-10-01: the list page shows '데이터셋 (977건)'.
- **c052** Filtered to data type 'video', AI-Hub's open-data catalogue lists 110 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_ · **110 datasets** (count shown on AI-Hub's open-data list filtered to data type video; as at retrieval)
  - “데이터셋 (110건)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/list.do?currMenu=115&topMenu=100&srchOneDataTy=DATA002> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A filter result on AI-Hub's own catalogue; no outside source counts video datasets. Web search was not available.
  - verifier (scope): **scope_ok** — Re-fetched 2026-10-01 with srchOneDataTy=DATA002: '데이터셋 (110건)', and the listed items are video datasets.
- **c053** Filtered to data type 'image', AI-Hub's open-data catalogue lists 630 datasets.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_ · **630 datasets** (count shown on AI-Hub's open-data list filtered to data type image; as at retrieval)
  - “데이터셋 (630건)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/list.do?currMenu=115&topMenu=100&srchOneDataTy=DATA001> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c067** The K-Stock content dataset contains 52,463 source images and 52,463 label files built in 2025.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_ · **52463 images** (source images in the K-Stock content dataset; one-off)
  - “2025년/원천데이터 (이미지) 52,463장 라벨링데이터 (텍스트) 52,463건” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact

### discovery

- **c019** Dataset descriptions and authoring tools on AI-Hub, unlike the AI data itself, can be used without an application or login.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI데이터를 제외한 데이터 설명, 저작 도구 등은 별도의 신청 절차나 로그인 없이 이용이 가능합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact

### trust

- **c025** AI-Hub does not guarantee the accuracy, completeness or quality of content provided by members or other related institutions.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “가입자 또는 기타 유관기관이 제공하는 서비스의 내용상의 정확성, 완전성 및 질에 대하여 보장하지 않습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c063** AI-Hub dataset pages offer 'sample (light) data', separately processed to aid understanding, which may differ from the original and have sensitive items masked.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “샘플(경량) 데이터는 데이터의 이해를 돕기 위해 별도로 가공하여 제공하는 정보로써 원본 데이터와 차이가 있을 수 있으며” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact
- **c073** AI-Hub dataset pages show a data performance indicator table comparing a baseline score with the measured score of a validation model.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “※ 데이터 성능 지표가 여러 개일 경우 각 항목을 클릭하면 해당 지표의 값이 그래프에 표기됩니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71> · docs · retrieved 2026-10-01 · quote check: exact
- **c077** NIA published version 4.0 of its AI data quality-management guideline in February 2026, covering governance, framework and quality verification indicators for data construction.  
  _offer · vendor_stated · as of 2026-02-27 (page_dated) · scope: AI-Hub, South Korea_
  - “1권은 AI 데이터 구축을 위한 품질관리 거버넌스 및 프레임워크, 품질검증 지표에 대해 기술되어있으며,” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/qlityguidance/view.do?currMenu=135&topMenu=103&nttSn=10523> · docs · retrieved 2026-10-01 · quote check: exact

### transaction

- **c026** AI-Hub disclaims any responsibility for goods or money transactions between members, or between members and third parties, mediated through the service.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “회원 간 또는 회원과 제3자 간에 서비스를 매개로 하여 물품거래 혹은 금전적 거래 등과 관련하여 어떠한 책임도 부담하지 아니하고” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c049** For auto-approved AI-Hub datasets, entering a purpose of use on the application page gives immediate approval and download.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “이용 목적을 입력하시면 즉시 자동승인되어 다운로드하실 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=3> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — An approval mechanic in AI-Hub's own application flow. Related independent detail: the commission's 2026-08-05 release says safe-zone data needs a prior application and approval, and MSIT's 2026-08-27 release says some foundation-model data need a separate safe-zone application, so not every dataset is auto-approved.
  - verifier (scope): **scope_ok** — The FAQ separates auto-approved data from review and safe-zone data. The same answer adds that accounts without mobile-phone identity verification are excluded from auto-approval, which matters for buyer_vetting.
- **c069** AI-Hub's API download service becomes available for a dataset only after its download approval is complete.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “데이터셋 다운로드 승인이 완료 된 후 API 다운로드 서비스를 이용하실 수 있습니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact

### pricing

- **c024** The AI-Hub terms of use describe the service as provided free of charge and disclaim liability for damage arising from it except intentional criminal acts.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI 허브는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The wording of AI-Hub's own terms. The 'free of charge' element is independently consistent: MSIT's release of 2026-08-27 says anyone can download the 29 new datasets from AI-Hub free (무료로 내려받기), and the commission's release of 2026-08-05 says the safe zone can be used free after application and approval. The liability disclaimer exists only in the vendor's terms.
  - verifier (scope): **quote_incomplete** — The quote stops before the exception. Art. 18 continues 'AI 허브가 고의로 행한 범죄행위를 제외하고 이에 대하여 책임을 부담하지 아니합니다', and those words show the 'except intentional criminal acts' part.
- **c059** AI-Hub says anyone who completes the application and approval procedure can use the safe zone free of charge.  
  _terms · vendor_stated · as of 2026-08-05 (page_dated) · scope: AI-Hub, South Korea_
  - “이용 신청 및 승인 절차를 거치면 누구나 무료로 이용하실 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10554> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c007** Under the AI-Hub open-data usage policy, all rights in the AI data, models, tools and manuals belong jointly to the building performing and participating organisations and NIA.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “일체의 권리는 AI데이터 등의 구축 수행기관 및 참여기관(이하 ‘수행기관 등’)과 한국지능정보사회진흥원에 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A clause in AI-Hub's own usage policy. Related independent context: the Board of Audit and Inspection report (July 2026, p.50) says the grant agreement's special conditions (Art. 13) require building organisations to register the raw data, labelled data, model source, authoring tools and manuals on AI-Hub ('구축 산출물'), which fits the list of items in the claim but says nothing about ownership. Web search was not available.
  - verifier (scope): **scope_ok** — The quote is from the 'AI 허브 개방 데이터' section and the full sentence lists 'data, AI application models, data-authoring tool source, manuals'. That clause covers only outputs of MSIT/NIA's 「지능정보산업 인프라 조성」 programme. On the same page, rights in the 2020 and 2021 AI competition data belong to NIPA (non-commercial use only), and data not from that programme follows the providing body's own policy. The profile's 'mixed' operator_role already reflects this. The word 'jointly' is the profiler's reading; the clause says the rights 'lie with' both parties.
- **c008** The AI-Hub open-data usage policy permits use of the data for both for-profit and non-profit research and development.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “영리적・비영리적 연구・개발 목적으로 활용할 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c009** Users of AI-Hub open data must state that it is a result of an NIA project, including in derivative works.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “반드시 한국지능정보사회진흥원의 사업결과임을 밝혀야 하며” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c010** Entities located outside Korea need a separate agreement with the performing organisations and NIA to use AI-Hub open data.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “국외에 소재하는 법인, 단체 또는 개인이 AI데이터 등을 이용하기 위해서는 수행기관 등 및 한국지능정보사회진흥원과 별도로 합의가 필요합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c011** Taking AI-Hub open data out of Korea requires a separate agreement with the performing organisations and NIA.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “본 AI데이터 등의 국외 반출을 위해서는 수행기관 등 및 한국지능정보사회진흥원과 별도로 합의가 필요합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c013** Users may not let any other entity or person view, receive, be assigned, rent or buy AI-Hub data without approval of the performing organisations and NIA.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “승인을 받지 않은 다른 법인, 단체 또는 개인에게 열람하게 하거나 제공, 양도, 대여, 판매하여서는 안됩니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c014** The AI-Hub usage policy places all civil and criminal liability arising from off-purpose use or unauthorised sharing of the data on the using entity or person.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “모든 민・형사 상의 책임은 AI데이터 등을 이용한 법인, 단체 또는 개인에게 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c015** Commercial use of an AI-Hub dataset such as selling it requires a separate consultation with the performing organisation that built it.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI 데이터셋의 판매 등 상업적 이용을 희망하는 경우 수행기관과 별도 협의가 필요합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c017** Users must not attempt to re-identify individuals from de-identified information received from AI-Hub.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “이를 이용해서 개인을 재식별하기 위한 어떠한 행위도 하여서는 안됩니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c020** AI data on AI-Hub for which NIA is not the rights holder follows the providing organisation's own usage policy and download procedure.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “한국지능정보사회진흥원이 권리자가 아닌 AI데이터 등은 해당 기관의 이용정책과 다운로드 절차를 따라야 하며” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c021** The KETI flagship R&D data hosted on AI-Hub may be used for research only; commercial use needs a separate contract.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “KETI 데이터는 연구용도로만 사용이 가능하며” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c023** Under the AI-Hub terms of use, a providing organisation bears all civil and criminal liability if its posted content infringes another party's copyright or other rights.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “제공기관의 게시물이 타인의 저작권을 비롯한 기타 타인의 권리를 침해함으로써 발생하는 민, 형사상의 책임은 전적으로 제공기관이 부담하여야 합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c028** AI-Hub members may not conduct any profit-making activity using the service without AI-Hub's prior consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “회원은 AI 허브의 사전 승낙 없이 서비스를 이용하여 어떠한 영리행위도 할 수 없습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c041** AI models, services and research results developed with AI-Hub data may be freely used, sold or distributed for profit or not, with the dataset name and AI-Hub credited.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “2차 저작물은 영리·비영리 목적으로 자유롭게 활용하거나 판매·배포할 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c042** AI-Hub's FAQ says providing or distributing the original data itself to third parties is not allowed.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “원본 데이터 자체를 제3자에게 제공하거나 배포하는 행위는 허용되지 않습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c048** AI-Hub materials are not under an open licence such as Creative Commons but are provided on agreement to the AI-Hub usage policy.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “CC 라이선스와 같은 공개 라이선스가 아닌 AI 허브 이용정책에 동의한 후 이용하는 방식으로 제공됩니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Licence terms on the vendor's own site. One check outside it: arXiv papers that use AI-Hub data (2110.15023, 2009.03092, 2604.20334) describe AI-Hub as a source but say nothing about its licence. MSIT's 2026-08-27 release says licence-restricted data were excluded from the foundation-model datasets before opening, but does not name AI-Hub's licence. Web search was not available.
  - verifier (scope): **scope_ok** — FAQ answer on copyright policy, page 2. It continues that redistributing the original or simply edited data, or giving it to third parties, is restricted, and that institution-provided data follows its provider's own terms.

### custody

- **c030** AI-Hub's safe zone gives users cloud GPU servers and a development environment to work on data without taking the data out.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “데이터 반출 없이 클라우드 기반의 딥러닝용 고성능(GPU) 서버 및 개발환경을 제공합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/safetyzoneintrcn.do?currMenu=306&topMenu=105> · docs · retrieved 2026-10-01 · quote check: exact
- **c033** In the safe zone, a user leaves with a trained model rather than data: the model is uploaded to a folder and an export request is filed.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “해당 폴더에 모델 업로드 후 모델 반출 신청” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/safetyzoneintrcn.do?currMenu=306&topMenu=105> · docs · retrieved 2026-10-01 · quote check: exact
- **c035** AI-Hub's 'AI data exchange' page lists four registered private exchanges, each as a description and an outbound link.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_ · **4 registered data exchanges** (count shown on AI-Hub's AI data exchange page; as at retrieval)
  - “등록된거래소 4건” — AI-Hub (NIA), <https://www.aihub.or.kr/devsport/aidataexchn/list.do?currMenu=523&topMenu=101> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The content of one AI-Hub page. Without the exchanges' names (blind step) there was no partner site to check. Web search was not available.
  - verifier (scope): **scope_ok** — Re-fetched: '등록된거래소 4건'. The table summary on the page names the columns as company name, content and link, which supports 'description and outbound link'.
- **c037** For 'institution-provided data', AI-Hub only presents the dataset description and provider information; application and supply procedures are the provider's.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “AI 허브는 데이터 소개와 제공기관 정보를 안내하고 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c045** Storing AI-Hub data on, or training with it on, servers or clouds located abroad counts as taking it out of the country.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “해외에 소재한 서버나 클라우드 환경으로 전송·저장하거나 해당 환경에서 학습에 활용하는 경우에도 국외 반출에 해당하므로” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
- **c047** AI-Hub's download program supports downloading a whole dataset or a selected part of it to the user's machine.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “전체 데이터 다운로드 뿐만 아니라 필요 데이터 일부 다운로드 기능을 제공하고 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A feature of the vendor's download tool. No outside documentation of the tool was reached; web search was not available.
  - verifier (scope): **scope_ok** — The FAQ answer refers to the AI-Hub download program (web download via Innorix) with [전체 다운로드] and [선택 다운로드] buttons.
- **c058** AI-Hub says broadcast-video data had been hard to use because of IP, portrait and neighbouring rights, and is now opened via the safe zone for education and research.  
  _offer · vendor_stated · as of 2026-08-05 (page_dated) · scope: AI-Hub, South Korea_
  - “지식재산권, 초상권, 저작인접권 등의 문제로 활용에 제약이 있었으나” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10554> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c070** AI-Hub dataset pages say the data can also be used at the K-ICT Big Data Center, the offline secure-use site.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “본 데이터는 K-ICT 빅데이터센터 에서도 이용하실 수 있습니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact

### vetting

- **c018** Downloading AI-Hub data requires a separate procedure of applicant identity verification, information provision and a stated purpose.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “별도의 신청자 본인 확인과 정보 제공, 목적을 밝히는 절차가 필요합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c031** For safe-zone access NIA, as operator, reviews the submitted documents including a usage plan, a process AI-Hub says takes up to two weeks.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “안심존 활용 계획서를 비롯한 제출 서류 검토” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/safetyzoneintrcn.do?currMenu=306&topMenu=105> · docs · retrieved 2026-10-01 · quote check: exact
- **c032** Safe-zone applications for medical data must include an IRB review result notice or IRB exemption document.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “IRB 심의 결과 통지서(IRB 면제 서류)” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/safetyzoneintrcn.do?currMenu=306&topMenu=105> · docs · retrieved 2026-10-01 · quote check: exact
- **c038** Companies and institutions can apply to open their own AI data on AI-Hub, and whether it is published is decided by review of the NIA operating committee.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “데이터 공개 여부는 NIA 운영위원회의 심의를 통해 결정되며” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c039** Some files generated during dataset construction, such as raw voice MP3s, are excluded from release under personal-information rules.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “개인정보 보호 규정에 따라 구축 과정에서 생성되었더라도 공개 대상에서 제외된 파일(예: 원시 음성 MP3 등)이 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104> · docs · retrieved 2026-10-01 · quote check: exact
- **c044** AI-Hub data may be used only in Korea by Korean nationals resident in Korea whose application has been approved.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “대한민국 국적을 가진 국내 거주자(내국인)가 AI 허브를 통해 이용 신청 및 승인을 받은 경우에 한하여 국내에서 이용할 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2> · docs · retrieved 2026-10-01 · quote check: exact
- **c050** Accounts that have not completed mobile-phone identity verification are excluded from auto-approval.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “휴대폰 본인인증이 완료되지 않은 계정은 자동승인 대상에서 제외되어 반려됩니다” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=3> · docs · retrieved 2026-10-01 · quote check: exact
- **c064** The K-Stock content dataset page states that only Korean nationals may apply for the data.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “※ 내국인만 데이터 신청이 가능합니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact
- **c071** The 2020 broadcast-video dataset page states that its source data had IP and portrait-rights issues resolved before use.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “지적재산권, 초상권 등 법적 문제를 해결한 원천 데이터를 활용함” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — What one AI-Hub dataset page says. Related independent context: the commission's 2026-08-05 release says broadcast video had been hard to use for training 'because of IP, portrait and neighbouring rights', and presents the 2026 opening, through the access-controlled safe zone, as the fix. That concerns the newer broadcast datasets, not the 2020 one.
  - verifier (scope): **scope_ok** — dataSetSn=71 is a 2020 broadcast-video content dataset ('구축년도 : 2020'; lead Zoom Internet; footage from KDX(MBN), YTN and EBS 'and individuals'). The quoted words are on it. They are an assertion only; no rights documents are offered, so the matrix value asserted_only fits.

### contributor_pay

- **c072** The 2020 broadcast-video dataset lists a participating organisation responsible for data labelling using crowdsourcing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “데이터 라벨링 (크라우드 소싱 활용)” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — What one AI-Hub dataset page lists. Without the organisation's name (blind step) there was no partner site to check. The Board of Audit report defines raw data as produced 'through crowdsourcing or professional staff', which confirms the programme used crowdsourcing in general but not for this dataset.
  - verifier (scope): **scope_ok** — The same 2020 page lists '데이터 라벨링 (크라우드 소싱 활용)' among a participating organisation's tasks.

### post_sale

- **c012** NIA may refuse to provide AI-Hub data for unlawful or unsuitable uses and, where already provided, may demand that use stop and the data be returned or destroyed.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “이미 제공한 경우 이용의 중지와 AI 데이터 등의 환수, 폐기 등을 요구할 수 있습니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c016** If a user finds personal information in an AI-Hub dataset, the user must report it to AI-Hub immediately and delete the downloaded dataset.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “즉시 AI 허브에 해당 사실을 신고하고 다운로드 받은 데이터셋을 삭제하여야 합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c062** Universities whose data is selected for the integrated provision system are offered usage statistics such as views and downloads of their data.  
  _offer · government · as of 2026-09-04 (page_dated) · scope: AI-Hub, South Korea_
  - “제공 데이터의 조회·다운로드 등 활용 현황을 확인할 수 있도록 관련 통계를 제공하여” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10569> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c002** AI-Hub says the 'sovereign AI model data' built by the sovereign foundation-model elite teams was opened on AI-Hub on 27 August 2026.  
  _event · vendor_stated · as of 2026-08-31 (page_dated) · scope: AI-Hub, South Korea_
  - “독파모 정예팀이 구축한 ‘독자 AI모델 데이터’가 8월 27일 개방 되었습니다.” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10567> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c027** NIA may change the AI-Hub terms of use without prior notice, effective on posting, and continued use counts as consent.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “사전 고지 없이 변경할 수 있고, 변경된 약관은 AI 허브 내에 공지와 동시에 그 효력이 발생됩니다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c074** The 2017 Korean face image dataset is only partly released because the personal-information use consent forms were renewed.  
  _event · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “*개인정보활용동의서 갱신에 따라 일부 공개” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=83> · docs · retrieved 2026-10-01 · quote check: exact
- **c078** On 29 September 2026 NIA and MSIT reopened the K-ICT Big Data Center, the offline site where AI-Hub data can also be used, as the 'AI Data Safe-Use Center'.  
  _event · government · as of 2026-09-30 (page_dated) · scope: AI-Hub, South Korea_
  - “- 기존 「K-ICT 빅데이터센터」를 「AI데이터안심활용센터」로 개편 -” — NIA, <https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?cbIdx=90549&bcIdx=30023&parentSeq=30023> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — The only confirmation found is NIA's own press release (NIA operates AI-Hub, so it is the vendor, though on nia.or.kr): https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?cbIdx=90549&bcIdx=30023&parentSeq=30023, posted 2026-09-30, says NIA and MSIT finished remodelling the K-ICT Big Data Center, renamed it 'AI데이터안심활용센터' and held the opening on 29 September (Tue) at Gyeonggi Startup Campus. It frames the centre around the data safe zone, the data-combination support centre and an 'AI lounge'; it does not mention AI-Hub data in the text (only a related link). No MSIT release on this appears in Korea Policy Briefing's press-release list for 2026-09-29 to 2026-10-01 (paged in full by date). Independent press would normally exist but cannot be reached without web search. NIA's own press list shows one newer item (2026-10-01, pseudonymised-data combination results), so the 29 September opening is the newest AI-Hub-related dated event found.
  - verifier (scope): **quote_incomplete** — The quoted subtitle shows only the rename. The date and MSIT's part are in the body: '과학기술정보통신부(장관 배경훈, 이하 과기정통부)는' and '9월 29일(화) 경기 스타트업 캠퍼스에서 개소식을 개최했다'. The release itself does not say AI-Hub data can be used there; that clause rests on c070, whose page (dataSetSn=71969) does say so ('본 데이터는 K-ICT 빅데이터센터 에서도 이용하실 수 있습니다'). The release describes the centre as the data safe zone plus data-combination centre, with analysis rooms raised from one to five.

### demand

- **c005** AI-Hub describes its AI infrastructure (data, APIs, compute) as available to any Korean citizen, whether researcher, company or public body.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “대한민국 국민이면 누구나(연구자, 기업, 공공기관 등) 활용 할 수 있도록 제공 및 지원합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/intrcn/intrcn.do?currMenu=150&topMenu=105> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c068** The K-Stock content dataset was built to offset the English and Western bias of global stock content with Korean cultural imagery.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “글로벌 스톡 콘텐츠의 영어·서구권 편중을 해소하기 위해” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969> · docs · retrieved 2026-10-01 · quote check: exact

### regulation

- **c029** Disputes over use of AI-Hub fall under the exclusive jurisdiction of the Seoul Central District Court.  
  _terms · legal_text · as of 2026-10-01 (retrieved_only) · scope: AI-Hub, South Korea_
  - “서울중앙지방법원을 전속적 관할 법원으로 합니다” — AI-Hub (NIA), <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110> · legal_terms · retrieved 2026-10-01 · quote check: exact
- **c061** NIA runs the provider-data surveys under Article 15 of the AI Basic Act and Article 13 of its enforcement decree on an integrated training-data provision system.  
  _terms · government · as of 2026-09-04 (page_dated) · scope: AI-Hub, South Korea_
  - “시행령 제13조(학습용데이터 통합제공시스템의 구축 및 관리)에 따라” — AI-Hub (NIA), <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10569> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

## Added by the verifier

- **v001** Korea's Board of Audit and Inspection found that 65 of the 1,270 firms that built AI-Hub datasets in 2021–2024 had closed or could no longer maintain their data, and that they had built or co-built 213 of the 721 datasets examined (29.5%).  
  _outcome · government · as of 2026-01 (publication) · scope: AI-Hub, South Korea_
  - “213종(주관기관 관련 66종, 참여기관 관련 147종)에 달하며, 이는 분석대상 전체(721종) 학습용 데이터의 29.5%에 해당한다” — Board of Audit and Inspection of Korea (감사원), performance audit report 'AI industry promotion III (AI training data)', July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v002** The Board of Audit found that NIA closed user complaints about errors in AI-Hub datasets built by since-closed firms without correcting the data, leaving the faulty datasets published as of December 2025, and told NIA to set up third-party maintenance.  
  _outcome · government · as of 2025-12 (publication) · scope: AI-Hub, South Korea_
  - “불가능한 것으로 민원을 종결 처리하고 있어 왜곡된 학습용 데이터가 계속해서” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v003** According to the Board of Audit, the Korean government spent KRW 1.6328 trillion from 2017 to 2024 building 903 AI training datasets for AI-Hub.  
  _number · government · as of 2025-11 (publication) · scope: AI-Hub, South Korea_ · **1632800000000 KRW** (government budget for building AI training datasets released through AI-Hub, cumulative; 2017–2024)
  - “총 1조 6,328억 원의 예산을 투입하여 AI 학습용 데이터세트 총 903종을 구축하였으며” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v004** NIA has the building consortium self-check each dataset's quality and then has an external verifier such as TTA check it against quality indicators before delivery, so quality claims on MSIT-built AI-Hub datasets are operator-verified.  
  _architecture · government · as of 2025-12 (publication) · scope: AI-Hub (MSIT/NIA-built datasets), South Korea_
  - “기술협회 등 외부 품질검증기관을 통한 제3자 품질검증 체계” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v005** NIA sets a post-management period of one to five years after each build project, during which the building organisations must correct data errors free of charge and answer user complaints.  
  _terms · government · as of 2025-12 (publication) · scope: AI-Hub (MSIT/NIA-built datasets), South Korea_
  - “일정 기간(1~5년)을 학습용 데이터 사후관리 기간으로 설정하여” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v006** As of November 2025, 7 of the 915 datasets released on AI-Hub had been withdrawn from publication pending re-verification of the data.  
  _number · government · as of 2025-11 (publication) · scope: AI-Hub, South Korea_ · **7 datasets** (datasets suspended from publication for re-verification, out of 915 released; as at November 2025)
  - “총 915종을 공개하였으나 그중 7종은 데이터 재검증을 위해 공개를 중단 중이며” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v007** NIA's September 2025 plan for a national integrated AI training-data provision system, as summarised by the Board of Audit, includes setting up a compensation system and a commerce system for AI training data.  
  _offer · government · as of 2025-09 (publication) · scope: Integrated AI training-data provision system (planned), South Korea_
  - “AI 학습용 데이터 보상·상거래 체계 정비” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact
- **v008** MSIT plans to start piloting the national integrated AI training-data provision system ('National AI Data Cluster'), which would supply the data itself rather than only pointers to it, in December 2026.  
  _event · government · as of 2025-12 (publication) · scope: Integrated AI training-data provision system (planned), South Korea_
  - “2026년 12월 중 시범 운영 개시 예정” — Board of Audit and Inspection of Korea (감사원), performance audit report, July 2026, released 2026-08-12, <https://www.korea.kr/common/download.do?fileId=198544589&tblKey=GMN> · regulator_guidance · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.exclusivity_offered` — not_published; tried <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do>, <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104>, <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2>, <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110>
- `matrix.versioning` — not_published; tried <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71969>, <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104>, <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104&pageIndex=2>, <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10549>
- `matrix.quality_evidence` — not_published; tried <https://www.aihub.or.kr/aihubnews/qlityguidance/list.do?currMenu=135&topMenu=103>, <https://www.aihub.or.kr/aihubnews/qlityguidance/view.do?currMenu=135&topMenu=103&nttSn=10523>, <https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71>
- `questions.Q4` — not_published; tried <https://www.aihub.or.kr/intrcn/guid/usagepolicy.do>, <https://www.aihub.or.kr/useStplat.do?currMenu=110&topMenu=110>, <https://www.aihub.or.kr/aihubnews/faq/list.do?currMenu=146&topMenu=104>
- `other.sovereign_data_size` — not_found; tried <https://www.aihub.or.kr/aihubnews/notice/view.do?pageIndex=1&currMenu=132&topMenu=103&nttSn=10567>, <https://www.msit.go.kr/bbs/list.do?sCode=user&mPid=208&mId=307>, <https://www.nia.or.kr/site/nia_kor/ex/bbs/List.do?cbIdx=90549>
- `other.vendor_contract_values` — not_found; tried <https://www.nia.or.kr/site/nia_kor/main.do>
- `other.provider_registration_form` — gated; tried <https://www.aihub.or.kr/partcptnmlrd/aiDataRegistReqst/regist.do?currMenu=517&topMenu=104>
- `other.data_guide_page` — not_found; tried <https://www.aihub.or.kr/intrcn/guid/dataprcuse.do?currMenu=151&topMenu=105>

## Conflicts

- c010, c044: The usage policy allows overseas entities to use the data under a separate agreement with the builders and NIA; the FAQ says data is hard to provide to anyone abroad or non-Korean regardless of affiliation. Both are live primary pages; the FAQ reads as current practice. (unresolved)
- c008, c028: The data usage policy permits for-profit R&D, while the site-wide 2018 terms bar any profit-making use of the service without prior consent; the data-specific policy and FAQ (F5) appear to govern the data. (unresolved)

## Leads, not cited

- <https://www.nia.or.kr/site/nia_kor/ex/bbs/List.do?cbIdx=78336> — NIA tender notices: contract values and scopes for commissioned dataset builds (not fetched).
- <https://www.msit.go.kr/bbs/list.do?sCode=user&mPid=208&mId=307> — MSIT press releases; the list renders by JavaScript. Likely source of the '29 datasets, ~1.56T tokens' sovereign-data figure.
- <https://github.com/aihub-git/AIHub-MCP> — AI-Hub MCP server for metadata search, linked from the FAQ.
- <https://aihub.or.kr/static/pdf/aihubshell_%EA%B0%80%EC%9D%B4%EB%93%9C.pdf> — aihubshell CLI download guide (PDF, not read).
- <https://www.aihub.or.kr/aihubnews/qlityguidance/view.do?currMenu=135&topMenu=103&nttSn=10523> — Quality guideline v4.0 PDFs; attachments download through JavaScript, which may say who verifies quality.
