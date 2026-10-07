# CrowdWorks A1 Data Marketplace

ai_data_catalogue · light · status: **active** · also known as A1 Data Marketplace, A1 데이터 마켓플레이스, Crowdworks (크라우드웍스)

> Rendered from `ledger/crowdworks-a1-data-marketplace.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “A1 데이터 마켓플레이스 (A1 Data Marketplace); '판매 중인 데이터' / Datasets” and its bespoke side “커스텀 데이터 / 맞춤형 데이터셋 구축 ('Build custom DATA'); 신규 데이터 구축”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | reseller_licensor | c016, c022 | Buyer contracts with Crowdworks, which manages and sells partner data; the buyer contract itself is not public, so 'licensor of record' wording was not seen. |
| economics_model | mixed | c017, c032, c022 | Own-collected datasets sold as principal; partner data sold under a contract-specific revenue split. |
| who_pays_fee | seller | c017 | Crowdworks' cut comes out of sale proceeds via the contractual split; no buyer-side fee published. |
| supply_models | own_collection, third_party_providers | c032, c010, c038, c041, c022 | No evidence found either way that client-commissioned project data is relisted. |
| custody_model | unknown |  |  |
| transaction_mode | contact_sales | c016, c023 |  |
| public_prices | none | c016, c049, c048 | No price on any listing examined (robot arm, senior interviews, SERICEO, Korean architecture, Vietnam, doctor-patient dialogue); quotes only on inquiry. |
| licence_model | negotiated | c018, c048, c049 | Scope of use and price are set per inquiry and written into each customer contract; no standard licence text is published. |
| exclusivity_offered | unknown | c039 | Exclusive data is offered only as new collection on request (Vietnam listing); no evidence on exclusivity for listed stock. |
| public_listing | public_indexable | c030, c031 |  |
| buyer_vetting | unknown |  |  |
| sample_mechanics | sample_on_request | c044, c016 | Most listings carry a sample-request form; the newest 2026 listings examined (robot arm, Vietnam, senior interviews, architecture, SERICEO) had none. |
| versioning | unknown | c034 | Listings state update cycles (monthly, negotiable) but nothing on versions or what past buyers receive. |
| human_subject_consent_docs | unknown | c036, c045, c011 | Public pages give only assertions (voluntary parental participation on one listing, blanket no-legal-dispute claim) and are silent on the senior-interview listing; what the buyer contract delivers is not public. |
| contributor_pay_model | unknown | c031 | 145 global teleoperators contributed; how they were paid is not published. |
| catalogue_plus_custom | both | c024, c014, c039 |  |
| erasure_after_sale | unknown |  |  |
| quality_evidence | operator_verified | c010, c033, c055 | Operator verification is vendor-stated; no independent check found. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Crowdworks gives only company-wide customer counts (567 companies, 70% of KOSPI top-30) and dataset sizes; no A1 sales volume, unit or buyer mix is published. | c027, c028, c009, c015 |
| Q2 | partial | Holders list through Crowdworks, which signs a partner contract, sells under its own contract with the buyer, tells the seller which company is buying and shares revenue at a contracted ratio. | c022, c017, c019, c020 |
| Q3 | sourced | Inventory is Crowdworks' own collection (e.g. 145-operator teleoperation data, physical-AI lab data) plus partner holders' data (a Vietnamese conglomerate affiliate, a photo archive also on stock sites, SERICEO), all said to pass Crowdworks inspection. | c032, c008, c038, c041, c043, c010 |
| Q4 | unknown |  |  |
| Q5 | partial | The buyer contracts with Crowdworks, not the holder; Crowdworks asserts all data is free of copyright or other legal-dispute risk, but no warranty or indemnity text is public. | c016, c011, c054 |
| Q6 | unknown |  |  |
| Q7 | partial | Only assertions: data free of legal disputes, properly licensed, 'ethically built', and on one children's listing voluntary parental participation; the senior-interview listing withholds face-visible originals behind an NDA and says nothing on consent. | c011, c025, c036, c045 |
| Q8 | partial | Usage terms and price are set per scope of use in each customer contract; Crowdworks issues blockchain transaction certificates via its A1 Data Exchange; no exclusivity, audit or fingerprinting terms are published. | c018, c048, c050, c012, c039 |
| Q9 | sourced | No checkout: a 'data purchase inquiry' leads to a quote and a contract between customer and Crowdworks, priced by scope of use and data source; sellers get a revenue share at a contract-specific ratio. | c016, c023, c049, c048, c017 |
| Q10 | partial | A listing is a public page with a spec table (count, type, collection method, format, metadata, update cycle), some sold as quantity-expandable licence products; nothing is published on revisions, orders or entitlements. | c034, c030, c037, c046 |
| Q11 | partial | Listings show descriptive specs and most carry a sample-request form; trust rests on Crowdworks' own inspection claims, per-demonstration quality scores and blockchain transaction certificates; the homepage FAQ and testimonials are template filler. | c044, c010, c033, c050, c029 |
| Q12 | sourced | A1 sits alongside Crowdworks' core bespoke data-construction business: listings and the homepage offer to restructure listed data, collect new data (exclusive or not) or process buyer-owned data. | c024, c014, c039, c023, c056 |

## Claims

### supply

- **c007** On 2026-01-13 Crowdworks announced it had newly registered three robot-learning datasets (gripper dual-arm, sensor-glove, ten-finger humanoid) on A1 Data Marketplace.  
  _event · vendor_stated · as of 2026-01-13 (publication) · scope: A1 Data Marketplace_
  - “로봇 학습 데이터셋 3종을 자사 데이터 거래 플랫폼 ‘A1(에이원) 데이터 마켓플레이스’에 신규 등록했다고 13일 밝혔다” — Crowdworks (company blog), <https://crowdworks.blog/physical-ai-robot-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c008** On 2026-05-28 Crowdworks said data built in its new in-house Physical AI Data Lab will be supplied to robot companies worldwide through A1 Data Marketplace.  
  _event · vendor_stated · as of 2026-05-28 (publication) · scope: A1 Data Marketplace_
  - “‘A1(에이원) 데이터 마켓플레이스’를 통해 전 세계 로봇 기업들에게 공급해 나갈 계획이다” — Crowdworks (company blog), <https://crowdworks.blog/physical-ai-data-lab-launch> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c009** Crowdworks says A1 Data Marketplace distributes more than 100 TB of physical-AI data (gripper dual-arm robot, sensor-glove and ten-finger robot datasets).  
  _number · vendor_stated · as of 2026-05-28 (publication) · scope: A1 Data Marketplace_ · **100 TB of physical-AI data distributed (lower bound)** (vendor-stated volume listed on A1, not sales; as of 2026-05-28)
  - “10개 손가락을 가진 로봇 데이터셋 등 총 100TB 이상 규모의 데이터를 유통하고 있다” — Crowdworks (company blog), <https://crowdworks.blog/physical-ai-data-lab-launch> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — This 2026-05-28 article relays the Physical AI Data Lab announcement. Caution: the vendor's own blog (crowdworks.blog/physical-ai-robot-dataset, 2026-01-13) calls the sensor-glove dataset alone '100TB 규모', so the '100 TB+' total rests mostly on one dataset. The figure is vendor-stated volume, not independently measured.
    - “센서 글러브 기반 데이터셋, 10개 손가락 로봇 데이터셋 등 총 100TB 이상 규모의 데이터를 유통하고 있다” — Digital Daily (디지털데일리), <https://www.ddaily.co.kr/page/view/2026052809560175185> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The blog's sentence begins '실제로 이 플랫폼에서는 그리퍼(Gripper)기반 양팔 로봇 데이터…', where 'this platform' is 'A1(에이원) 데이터 마켓플레이스' in the sentence before. The scope is right. The figure is the total volume listed, not volume sold, and the profile's basis already says so.
- **c013** At launch Crowdworks said it was expanding partnerships with domestic and overseas data-holding companies and institutions, and that parties wishing to sell data can trade through A1.  
  _offer · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “국내외 데이터 보유 기업 및 기관들과의 제휴를 지속적으로 확대해 나가고 있으며, 데이터 판매를 원할 경우” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c015** Crowdworks said at launch that A1 offers a multilingual audio dataset of 570,000 tracks in total.  
  _number · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_ · **570000 audio tracks** (size of one listed multilingual audio dataset, vendor-stated; as of 2025-04-03)
  - “다국어 기반의 총 57만 트랙 오디오 데이터셋” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The launch coverage is dated 2025-04-03. Note that the vendor blog also carries an earlier post (2024-12-12) titled 'A1 데이터 거래소 오픈' with no figures, so 'at launch' means the April 2025 marketplace launch.
    - “다국어 기반의 총 57만 트랙 오디오 데이터셋” — Digital Daily (디지털데일리), <https://www.ddaily.co.kr/page/view/2025040309444759880> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The blog post is dated Apr 03, 2025 and is titled ''A1 데이터 마켓플레이스' 오픈'. The quote is in the list of what buyers 'can purchase' on A1.
- **c021** Crowdworks says the A1 data-sale contract process differs somewhat by industry and is explained by a staff member after an inquiry.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터 판매 계약 프로세는 업종마다 조금씩 다릅니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
- **c022** The A1 homepage says Crowdworks signs partner contracts with data-holding companies, manages and sells their data, and shares sales volumes and settles transparently.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “크라우드웍스는 다양한 데이터 보유 기업과 파트너 계약을 맺고 안전하게 데이터를 관리 및 판매합니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c026** The A1 homepage says Crowdworks collects large volumes of public data by crawling, which it describes as free of legal issues.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “크라우드웍스는 법적 이슈가 없는 대량의 퍼블릭 데이터를 안정적으로 수집합니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c032** The robot-arm teleoperation dataset was collected directly by Crowdworks, with users worldwide controlling a robot arm in real time via web or phone.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 로봇팔 원격조작 데이터셋_
  - “직접 수집 : 전 세계 사용자가 웹/휴대폰으로 로봇팔을 실시간 조작해 생성” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c038** The A1 Vietnam Physical AI listing says a partner company affiliated with a Vietnamese conglomerate collects the data on real industrial sites, from data it uses to train its own humanoid robots.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 베트남 Physical AI 데이터셋_
  - “베트남 소재 대기업 계열 파트너사가 공장·병원·요식업·숙박업 등 실제 산업 현장에서 직접 수집하고 있으며” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%b2%a0%ed%8a%b8%eb%82%a8-physical-ai-1%ec%9d%b8%ec%b9%ad-%ec%a1%b0%ec%9e%91%c2%b7%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91%c2%b7%eb%aa%a8%ec%85%98%ec%ba%a1%ec%b2%98-%eb%8d%b0%ec%9d%b4%ed%84%b0/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The claim is about what the listing says, and the partner is unnamed, so there is no route to its own site or filings. A Digital Daily site search for '베트남 피지컬' (2026) returned no results. Web search was not available, so Vietnamese press could not be searched.
  - verifier (scope): **quote_incomplete** — The quote supports collection by a Vietnamese conglomerate-affiliated partner on real sites (factories, hospitals, restaurants, hotels). The humanoid-robot part needs the next words: '자사 휴머노이드 로봇 학습에 사용 중인 데이터를 기반으로 고객 요청 시 신규 촬영도 가능합니다'. The page says new shooting is possible on request, built on the data the partner uses for its own humanoid robots.
- **c041** The A1 Korean traditional architecture image listing says the same images are also sold on Adobe Stock, Shutterstock and Getty Images, so the A1 listing is non-exclusive supply from an existing rights holder.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 한국 고건축 이미지 데이터베이스_
  - “등 세계 3대 프리미엄 이미지 스톡 플랫폼에 이미지 콘텐츠를 등록 하여 지속적으로 판매 중입니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%ed%95%9c%ea%b5%ad-%ea%b3%a0%ea%b1%b4%ec%b6%95-%ec%9d%b4%eb%af%b8%ec%a7%80-%eb%8d%b0%ec%9d%b4%ed%84%b0%eb%b2%a0%ec%9d%b4%ec%8a%a4-korean-traditional-architecture-image-database/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c043** The A1 SERICEO content-library listing is a third-party expert content service (for about 13,000 Korean business leaders) offered as video plus scripts, 23,000 short-form videos.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: SERICEO 콘텐츠 라이브러리_
  - “데이터 수량 : 항목 총 23,000여 개, 숏폼 영상 23,000 건” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/sericeo-%ec%bd%98%ed%85%90%ec%b8%a0-%eb%9d%bc%ec%9d%b4%eb%b8%8c%eb%9f%ac%eb%a6%ac/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c047** An A1 page on domain-specific data says Crowdworks holds a large volume of book data for which an AI-training-use licence has been secured.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 page: 전문 데이터 (도서 데이터셋)_
  - “라이선스 ‘가 확보된 대량의 도서데이터를 보유하고 있습니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/domain-specific-data/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### object_model

- **c034** The robot-arm teleoperation listing gives its update cycle as monthly, negotiable.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 로봇팔 원격조작 데이터셋_
  - “월간(협의 가능)” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c035** The robot-arm teleoperation listing's metadata includes an operator ID for each demonstration.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 로봇팔 원격조작 데이터셋_
  - “재현용 시드값, 조작자 ID, 수행 시각, 시연 길이” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### listing

- **c031** The A1 robot-arm teleoperation listing states 12,763 successful demonstrations across 12 task types by 145 participating operators (global users).  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 로봇팔 원격조작 데이터셋_ · **145 teleoperators contributing** (listing spec, vendor-stated; dataset as listed 2026-10-01)
  - “작업 종류 12가지, 참여 조작자 145명 (글로벌 유저)” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — The 2026-07-15 article restates the company announcement. It gives about 12,000 successes, 12 scenario types and 145 operators worldwide, which matches the listing's 12,763, 12 and 145. The exact 12,763 appears only on the listing. The 2026-07-01 Digital Daily piece gives the same figures.
    - “전 세계 145명의 오퍼레이터가 로봇팔을 직접 원격 조작해 수집한 성공 사례 1만 2천여 건으로 구성됐다” — Digital Daily (디지털데일리), <https://www.ddaily.co.kr/page/view/2026071509522572229> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote has the 12 task types and 145 operators but not the headline figure. That needs '총 12,763건의 성공 시연, 시연 1건당 평균 36초'. The listing also states '전 세계 사용자가 웹/휴대폰으로 로봇팔을 실시간 조작해 생성' and records an operator ID per episode. Nothing on how operators were paid.
- **c037** The senior life-review interview listing states 300 long-form videos totalling about 1,000 hours, with metadata including sex, birth year and region.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 시니어 생애 회고 인터뷰 녹화 데이터셋_ · **300 interview videos** (listing spec, vendor-stated; dataset as listed 2026-10-01)
  - “롱폼 영상 300건 / 총 약 1,000시간” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%ec%8b%9c%eb%8b%88%ec%96%b4-%ec%83%9d%ec%95%a0-%ed%9a%8c%ea%b3%a0-%ec%9d%b8%ed%84%b0%eb%b7%b0-%eb%85%b9%ed%99%94-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-senior-life-retrospective-interview-video-dataset/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing specifications for a dataset from an unnamed supplier. No independent route exists.
  - verifier (scope): **quote_incomplete** — The quote has '롱폼 영상 300건 / 총 약 1,000시간' but not the metadata. That needs '메타데이터 표정·상반신 생체 데이터, 성별, 생년, 지역, 전사본'. The statement also leaves out the facial-expression and upper-body biometric metadata.
- **c040** The Vietnam Physical AI listing states a stock of about 100,000 hours and a monthly collection capacity of 9,000-10,000 hours.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 베트남 Physical AI 데이터셋_ · **100000 hours of egocentric/teleoperation video in stock** (listing spec, vendor-stated; as listed 2026-10-01)
  - “재고 약 100,000시간(자사 로봇 학습용) / 월 수집 능력 9,000~10,000시간” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%b2%a0%ed%8a%b8%eb%82%a8-physical-ai-1%ec%9d%b8%ec%b9%ad-%ec%a1%b0%ec%9e%91%c2%b7%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91%c2%b7%eb%aa%a8%ec%85%98%ec%ba%a1%ec%b2%98-%eb%8d%b0%ec%9d%b4%ed%84%b0/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The stock and capacity figures are the unnamed partner's statements, carried on the listing. A Digital Daily site search for '베트남 피지컬' returned nothing. Web search was not available.
  - verifier (scope): **scope_ok** — The quote matches the spec table. The stock figure is labelled '(자사 로봇 학습용)', meaning it is the partner's own robot-training stock, so '100,000 hours in stock' is not necessarily all for sale. The profile's unit wording does not make that caveat.
- **c042** The Korean traditional architecture listing states 39,967 JPEG images totalling 390 GB, photographed over about 30 years from 1988.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 한국 고건축 이미지 데이터베이스_ · **39967 JPEG images** (listing spec, vendor-stated; as listed 2026-10-01)
  - “JPEG 이미지파일 : 39,967장 (390GB)” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%ed%95%9c%ea%b5%ad-%ea%b3%a0%ea%b1%b4%ec%b6%95-%ec%9d%b4%eb%af%b8%ec%a7%80-%eb%8d%b0%ec%9d%b4%ed%84%b0%eb%b2%a0%ec%9d%b4%ec%8a%a4-korean-traditional-architecture-image-database/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Listing specifications; the photographer and archive are not named, so there is no independent route. Web search was not available.
  - verifier (scope): **quote_incomplete** — The quote has '39,967장 (390GB)' but not the period. That needs '1988년부터 약 30년간 전국을 직접 발로 누비며 촬영한'. The intro also says '총 4만 컷', a rounded figure.

### discovery

- **c030** An anonymous visitor can browse A1 listings by category; on 2026-10-01 the category counts were Speech 42, Text 41, Video 18, Image 17, Physical AI 6, Audio 3.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “Audio (3) Image (17) Physical AI (6) Speech (42) Text (41)” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/datasets/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c044** A1 listings carry a 'request sample data' (샘플데이터 요청) form asking for company name, name, an email to receive the sample and a phone number; samples are sent on request rather than downloaded.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 의사-환자 대화문 데이터셋_
  - “샘플데이터 받을 이메일” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%ec%8b%a4%ec%a0%9c-%ec%9d%98%ec%82%ac-%ed%99%98%ec%9e%90-%eb%8c%80%ed%99%94-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### trust

- **c012** Crowdworks says it can issue blockchain-based certificates of data transaction history for A1 Data Marketplace trades.  
  _offer · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “크라우드웍스는 블록체인 기반의 데이터 거래 내역 인증서도 발급 가능하다” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c029** The A1 homepage's FAQ block and customer testimonials are generic template text about 'marketing solutions', not marketplace terms.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “We provide a comprehensive range of marketing solutions tailored to your business needs.” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c050** Crowdworks says that when a dataset is bought it issues a transaction certificate through its 'A1 Data Exchange' (A1 데이터 거래소), recorded on a blockchain so it cannot be forged.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터셋 구매 시 크라우드웍스가 운영하는 'A1 데이터 거래소'를 통해 거래 인증서를 발급합니다” — Crowdworks (corporate site), <https://www.crowdworks.ai/data/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c052** The A1 Data Exchange site (a1dx.crowdworks.ai) shows only a tagline about licensed data and blockchain transaction certification, and a login button.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 데이터 거래소 (A1 Data Exchange)_
  - “블록체인 거래 인증으로 믿을 수 있게 제공합니다” — Crowdworks (corporate site), <https://a1dx.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### transaction

- **c016** A1 Data Marketplace offers no online checkout: the marketplace shows only some sample data and actual sales proceed through a contract between the customer and Crowdworks.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “마켓플레이스에서는 일부 샘플데이터만 제공되며, 실제 데이터 판매는 고객사와 크라우드웍스의 계약을 통해 진행됩니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — How A1 purchases close is set out only by the vendor. The April 2025 launch coverage in Digital Daily says only that buyers 'can purchase' datasets and gives no mechanics; Crowdworks' DART filings say only that it sells data 'through a market it developed itself'. Nothing contradicts the claim. Web search was not available.
  - verifier (scope): **scope_ok** — The quote answers the sellers' FAQ question '구매자는 마켓플레이스에서 쇼핑몰처럼 온라인으로 결제하고 데이터를 구매하게 되나요?' with '아니요.' It applies to A1 as a whole and was live on 2026-10-01.
- **c019** Crowdworks tells an A1 seller which company or organisation intends to buy its data, but not the buyer's personal information.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “판매자에게 어떤 회사/조직에서 데이터를 구매하려고 하는지 알려드립니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
- **c023** A1's buyer route is a 'data purchase inquiry' (데이터 구매문의) contact covering purchase, new data construction and processing of the buyer's own data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터 구매 및 신규 데이터 구축, 보유 데이터 가공까지 데이터와 관련된 것이라면 무엇이든 문의해주세요” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A button label and contact route on the vendor's own site. This verifier saw the '데이터 구매 문의' button on a1dm.crowdworks.ai on 2026-10-01, which is the same domain and so not independent.
  - verifier (scope): **scope_ok** — The quote appears verbatim under 'for 구매자' on the A1 homepage, next to the '데이터 구매문의' button (re-fetched 2026-10-01).

### pricing

- **c017** When a seller's data is sold through A1, Crowdworks shares revenue with the seller at the ratio (or amount) stated in their contract; no standard percentage is published.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “크라우드웍스는 계약서에 명시된 비율(금액)로 판매자와 수익을 분배하게 됩니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The seller revenue-share rule is a vendor term. Related independent evidence: Crowdworks' DART half-year report shows a revenue line '입점수수료' (listing or entry commission) of KRW 28m in H1 2026 and KRW 29m in FY2025. It does not name the platform or a rate, so it neither confirms nor contradicts 'no standard percentage'.
  - verifier (scope): **scope_ok** — The quote is the A1 sellers' FAQ answer to '데이터 판매 시 수익분배가 궁금합니다'. 'No standard percentage is published' is an absence. The FAQ gives none and offers a service document only by email on request, which this verifier did not obtain.
- **c048** Crowdworks' corporate datasets page says the price can differ by scope of use and by data source, with quantity, detailed quote and scope of use given only on inquiry.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “요청하시는 데이터에 따라 활용 범위 및 데이터 출처별 금액 차이가 발생할 수 있습니다” — Crowdworks (corporate site), <https://www.crowdworks.ai/data/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — A pricing statement on the vendor's own page. For context only: the DART half-year report says prices for Crowdworks' services depend on the customer's requirements and that no standard price is set. That concerns build services, not catalogue datasets.
  - verifier (scope): **quote_incomplete** — The quote shows only that price can differ by scope of use and data source. The 'only on inquiry' half needs '데이터 수량과 세부 견젹, 활용 범위 등은 별도 문의 시 상세히 안내해 드립니다' ('견젹' is a typo on the page). The claim's scope.product is 'A1 Data Marketplace', but www.crowdworks.ai/data/datasets is Crowdworks' corporate dataset catalogue, a separate storefront. It mentions the 'A1 데이터 거래소' but not A1 Data Marketplace, so it is indirect evidence for A1's licence_model.
- **c049** Crowdworks' corporate datasets page says dataset quantities, detailed quotes and scope of use are explained on separate inquiry.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터 수량과 세부 견젹, 활용 범위 등은 별도 문의 시 상세히 안내해 드립니다” — Crowdworks (corporate site), <https://www.crowdworks.ai/data/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### licence

- **c011** Crowdworks states that all data on A1 Data Marketplace is free of legal-dispute elements such as copyright, so buyers can use it without legal risk.  
  _terms · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “제공되는 모든 데이터는 저작권 등 법적 분쟁 요소가 없는 데이터로 구성되어 구매자는 법적 리스크 없이 안전하게 사용할 수 있다” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c018** Crowdworks says A1 data sales are made by contract with the customer company and that contract clearly states the data's usage terms.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터 판매는 고객사와의 계약을 통해 진행되며, 해당 계약에는 데이터의 사용규약이 명확하게 명시되어 있습니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
- **c025** The A1 homepage claims its data is properly licensed and that 'ethically-built' data that passed an Ethical AI Survey can be provided.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “라이선스가 정상적으로 확보된 안전하고 믿을 수 있는 고품질 데이터를 제공합니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c036** The A1 senior life-review interview listing (300 face-on videos, ~1,000 hours) says originals showing faces can be supplied only by separate negotiation once an NDA is signed; the page says nothing about interviewee consent.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 시니어 생애 회고 인터뷰 녹화 데이터셋_
  - “동영상 (인터뷰 촬영본, 비밀유지계약 체결 시 얼굴 노출 원본 협의 가능)” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%ec%8b%9c%eb%8b%88%ec%96%b4-%ec%83%9d%ec%95%a0-%ed%9a%8c%ea%b3%a0-%ec%9d%b8%ed%84%b0%eb%b7%b0-%eb%85%b9%ed%99%94-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-senior-life-retrospective-interview-video-dataset/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The listing's own NDA and supply terms, and an absence on that page. No independent route exists.
  - verifier (scope): **scope_wrong** — The NDA part is right ('비밀유지계약 체결 시 얼굴 노출 원본 협의 가능'), and the page has no consent, release or de-identification wording (re-fetched 2026-10-01). But '300 face-on videos' claims more than the page says. It says each video shows one interviewee alone, and offers face-exposed originals only under an NDA. That implies the standard deliverable is not face-exposed. The metadata includes '표정·상반신 생체 데이터' (facial-expression and upper-body biometric data), which matters for Q7 and the profile does not say.
- **c045** The A1 children's-drawing (KHTP, ages 7-9) listing says the cases were collected through parents' voluntary participation; no consent documents are mentioned.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 아동 그림 표현 기반 정서·행동 추론 데이터셋_
  - “부모의 자발적 참여로 수집된 사례로 구성되어” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/k-child-sel-reasoning-dataset-khtp-%c2%b7-ages-7-9/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c046** The children's-drawing listing describes itself as a data-licence product whose quantity can be expanded in stages, with a small evaluation package negotiable separately.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 아동 그림 표현 기반 정서·행동 추론 데이터셋_
  - “단계별 수량 확장이 가능한 데이터 라이선스 상품” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/k-child-sel-reasoning-dataset-khtp-%c2%b7-ages-7-9/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c054** Crowdworks' corporate datasets page says it sells datasets whose licences have been properly secured so companies can use them without licence worries.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “라이선스가 정상적으로 확보된 안전하고 믿을 수 있는 데이터셋을 판매합니다” — Crowdworks (corporate site), <https://www.crowdworks.ai/data/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### vetting

- **c010** Crowdworks states that all data on A1 Data Marketplace was either built by Crowdworks itself or checked for expertise and quality through its own inspection system.  
  _offer · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “모든 데이터는 크라우드웍스가 직접 구축하거나 자체 검수 시스템을 통해 전문성과 품질을 검증했으며” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c020** The A1 seller process runs from an inquiry form to a Crowdworks review ('Data evaluation') of the seller's information, then a custom quote delivered by email.  
  _terms · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “Data evaluation We review your information” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/contact-for-sellers/> · docs · retrieved 2026-10-01 · quote check: exact
- **c033** On the robot-arm teleoperation listing every demonstration is automatically scored for success/failure and quality (0-100) and delivered filtered.  
  _architecture · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 로봇팔 원격조작 데이터셋_
  - “모든 시연은 성공/실패 여부와 품질 점수가 자동으로 매겨지고, 잘 걸러진 상태로 제공됩니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c055** Crowdworks says the datasets it sells were built with the direct participation of verified experts.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “크라우드웍스가 판매하는 데이터셋은 검증된 전문가들이 직접 구축에 참여하여” — Crowdworks (corporate site), <https://www.crowdworks.ai/data/datasets> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### catalogue_custom

- **c014** At launch Crowdworks said A1 also supports building bespoke datasets for companies through custom annotation, data augmentation and synthesis.  
  _offer · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “데이터 증강 및 합성을 통해 기업이 요구하는 맞춤형 데이터셋 구축도 지원한다” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c024** The A1 homepage says Crowdworks can restructure datasets on sale to a buyer's format and can also collect and process new data.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “판매 중인 데이터의 구조를 맞춤형으로 변환할 수 있으며, 신규 데이터의 수집 및 가공도 가능합니다” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c039** The Vietnam Physical AI listing offers new exclusive or non-exclusive data collection on customer request, alongside roughly 100,000 hours in stock.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 listing: 베트남 Physical AI 데이터셋_
  - “고객 요청 시 신규 독점·비독점 데이터 별도 수집 가능” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/%eb%b2%a0%ed%8a%b8%eb%82%a8-physical-ai-1%ec%9d%b8%ec%b9%ad-%ec%a1%b0%ec%9e%91%c2%b7%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91%c2%b7%eb%aa%a8%ec%85%98%ec%ba%a1%ec%b2%98-%eb%8d%b0%ec%9d%b4%ed%84%b0/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c056** Crowdworks' sales-inquiry form lists 'data purchase/sale' (데이터 구매/판매) as one service type alongside data collection and data processing.  
  _offer · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “데이터 수집 데이터 가공 데이터 구매/판매” — Crowdworks (corporate site), <https://www.crowdworks.ai/ko/company/contact> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** Crowdworks announced on 2025-04-03 that it had opened the A1 Data Marketplace, a platform for trading high-quality data for AI model training.  
  _event · vendor_stated · as of 2025-04-03 (publication) · scope: A1 Data Marketplace_
  - “고품질 데이터를 거래할 수 있는 ‘A1(에이원) 데이터 마켓플레이스’를 오픈했다고 3일 밝혔다” — Crowdworks (company blog), <https://crowdworks.blog/a1datamaketplace/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c002** The A1 Data Marketplace site was live on 2026-10-01, showing the Vietnam Physical AI dataset first among its recently registered datasets.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_
  - “베트남 Physical AI / 1인칭 조작·원격조작·모션캡처 데이터셋” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The regulatory filing (company-authored, lodged with the FSS) confirms the marketplace was operating as of the 2026-08-14 half-year report. The 'Vietnam Physical AI dataset shown first' detail exists only on the vendor site; this verifier fetched a1dm.crowdworks.ai on 2026-10-01 and it did list '베트남 Physical AI' first under recently registered datasets. Web search was not available.
    - “당사는 현재 국내 민간 기업 중 최초로 피지컬 AI 데이터를 데이터 마켓플레이스를 통해 유통하고 있으며” — DART, Financial Supervisory Service (Crowdworks half-year report 2026.06, filed 2026-08-14), <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260814001178&dcmNo=11529265&eleId=16&offset=214340&length=22769&dtd=dart4.xsd> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — The quote is the first entry under '최근 등록된 Datasets' on a1dm.crowdworks.ai, re-fetched 2026-10-01. A position on a page cannot be quoted, so the dataset title is the right quote. The site also still carries the operator's footer (대표이사 김광일).
- **c003** On 2026-07-01 Crowdworks announced it is supplying, via A1 Data Marketplace, a robot precision-manipulation dataset of about 12,000 successful demonstrations collected by 145 teleoperators worldwide, in LeRobot format.  
  _event · vendor_stated · as of 2026-07-01 (publication) · scope: A1 Data Marketplace_
  - “전 세계 145명의 오퍼레이터(조작자)가 로봇팔을 직접 원격 조작하여 수집한 1만 2천여 건의 성공 사례로 구성됐다” — Crowdworks (company blog), <https://crowdworks.blog/crowdworks-robot-precision-physical-ai-data> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c004** On 2026-09-10 Crowdworks announced it had set up a Gyeongnam (Changwon) branch as its first 'Physical AI Hub'; this is the newest dated company event found.  
  _event · vendor_stated · as of 2026-09-10 (publication) · scope: A1 Data Marketplace_
  - “크라우드웍스가 경상남도 창원에 경남 지사를 설립하고 피지컬 AI 시장 공략을 강화한다” — Crowdworks (company blog), <https://crowdworks.blog/crowdworks-physical-ai-hub> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **corrected** — corrected to: Crowdworks announced on 2026-09-10 that it had set up its first 'Physical AI Hub' in Changwon (Gyeongnam), but that is not its newest dated event: on 2026-09-30 the KOSDAQ Market Division gave notice that it intends to designate Crowdworks an unfaithful-disclosure corporation for withdrawing a third-party rights issue (decision due by 2026-10-27). — The branch announcement itself is relayed by Digital Daily (https://www.ddaily.co.kr/page/view/2026091017134553802, 2026-09-10: '크라우드웍스가 경남 창원에 피지컬 AI 허브 1호 거점을 구축했다고 10일 밝혔다'), linked from Gyeongnam Technopark's own press list. Newer dated events found through DART's own search: 2026-09-30 KOSDAQ notice (reversal of disclosure: 유상증자결정(제3자배정) 철회; original disclosure 2025-12-16, withdrawal 2026-08-21; the notice warns an 8+ point penalty can suspend trading for a day); 2026-09-30 corrected rights-issue report; 2026-09-18 result of a ~KRW 1bn small public offering decided 2026-09-10. Digital Daily also reports a 2026-09-21 Mobirus agricultural-driving annotation contract. Context the profile's event list should carry: control changed 2026-02-06 from founder Park Min-woo to XRP1 investment association, with CEO changed to Kim Kwang-il (half-year report). Re-checked 2026-10-01 by decoding the page: it is served as MS949, so an automated quote check that assumes UTF-8 may see mojibake; the same notice is listed at https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20260930901153.
    - “크라우드웍스/불성실공시법인지정예고/(2026.09.30)불성실공시법인지정예고(공시번복)” — DART / KOSDAQ Market Division, Korea Exchange, <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260930901153&dcmNo=11598125&eleId=0&offset=0&length=0&dtd=HTML> · filing · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The blog post is dated Sep 10, 2026 and covers the Changwon branch, but the quote only says a Gyeongnam branch was set up. The 'Physical AI Hub' label needs '크라우드웍스의 ‘피지컬 AI 허브’ 전략 거점인 경남 지사는', and 'first' needs '이번 경남 지사를 시작으로 울산, 전북 등'. No quote can carry the second half, 'this is the newest dated company event found', and the blind check shows it is false (2026-09-30 KOSDAQ notice).
- **c005** Crowdworks' September 2026 announcement quotes Kim Kwang-il (김광일) as CEO, whereas the April 2025 and January 2026 announcements quoted Kim Woo-seung (김우승), indicating a CEO change during 2026.  
  _event · vendor_stated · as of 2026-09-10 (publication) · scope: A1 Data Marketplace_
  - “김광일 크라우드웍스 대표는” — Crowdworks (company blog), <https://crowdworks.blog/crowdworks-physical-ai-hub> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c006** Crowdworks' January 2026 announcement of three physical-AI datasets on A1 quoted Kim Woo-seung (김우승) as CEO.  
  _event · vendor_stated · as of 2026-01-13 (publication) · scope: A1 Data Marketplace_
  - “김우승 크라우드웍스 대표는” — Crowdworks (company blog), <https://crowdworks.blog/physical-ai-robot-dataset> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c051** Crowdworks' company timeline lists the launch of the 'A1 Data Exchange' (A1 데이터 거래소) in December 2024, before the A1 Data Marketplace launch in April 2025.  
  _event · vendor_stated · as of 2024-12 (page_dated) · scope: A1 Data Marketplace_
  - “A1 데이터 거래소 런칭” — Crowdworks (corporate site), <https://www.crowdworks.ai/aboutusdp> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c053** Crowdworks' company timeline lists the launch of the AI-training-data purchase platform 'A1 Data Marketplace' in April 2025.  
  _event · vendor_stated · as of 2025-04 (page_dated) · scope: A1 Data Marketplace_
  - “AI 학습용 데이터 구매 플랫폼 'A1 데이터 마켓플레이스' 런칭” — Crowdworks (corporate site), <https://www.crowdworks.ai/aboutusdp> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
- **c057** Crowdworks' company timeline lists Kim Woo-seung's (김우승) appointment as CEO in March 2024.  
  _event · vendor_stated · as of 2024-03 (page_dated) · scope: A1 Data Marketplace_
  - “김우승 대표이사 취임” — Crowdworks (corporate site), <https://www.crowdworks.ai/aboutusdp> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### demand

- **c027** Crowdworks says on the A1 homepage that it has grown with 567 customer companies.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_ · **567 customer companies** (Crowdworks company-wide customers, vendor-stated, not A1-specific; cumulative)
  - “함께 성장한 고객 수 : 567개 기업” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — The exact figure 567 exists only on the A1 homepage (re-fetched 2026-10-01: '함께 성장한 고객 수 : 567개 기업'). Press relaying company boilerplate gives different counts: '550개 이상 기업과 협업' (Digital Daily, 2026-07-15, https://www.ddaily.co.kr/page/view/2026071509522572229) and '600개 이상 기업' (Digital Daily, 2026-09-10). DART filings give no customer count. The claim is attributive and holds as 'Crowdworks says', but the number drifts by source and is not independently verified. Web search was not available.
  - verifier (scope): **scope_ok** — The quote is verbatim on the A1 homepage. The profile's value basis correctly calls it company-wide, not A1-specific. The same block of the homepage also shows '12,000+ Happy Clients' and a testimonial from 'Alexander Barr, Sales Manager'. Those look like theme placeholder text and contradict 567, so the block is weak evidence.
- **c028** Crowdworks claims on the A1 homepage that 70% of the KOSPI top-30 companies by market capitalisation are its customers.  
  _number · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: A1 Data Marketplace_ · **70 percent of KOSPI top-30 companies that are customers** (Crowdworks company-wide, vendor-stated; cumulative)
  - “코스피 시가총액 Top30 기업 중 70%가 크라우드웍스 고객” — Crowdworks (A1 Data Marketplace), <https://a1dm.crowdworks.ai/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **unverifiable** — No independent source for the '70% of KOSPI top-30' customer claim. Crowdworks' DART annual (2025) and half-year (2026.06) business sections contain no such figure. A Digital Daily site search for '크라우드웍스 코스피' returned 0 results. No search available.
  - verifier (scope): **scope_ok** — The quote is verbatim on the A1 homepage. It is company-wide marketing and is correctly framed as 'Crowdworks claims'.

## Added by the verifier

- **v001** On 2026-09-30 the KOSDAQ Market Division of the Korea Exchange gave notice that it intends to designate Crowdworks an unfaithful-disclosure corporation for withdrawing a third-party-allotment rights issue (first disclosed 2025-12-16), with a decision due by 2026-10-27.  
  _event · filing · as of 2026-09-30 (publication) · scope: Crowdworks (operator of A1 Data Marketplace), KR_
  - “크라우드웍스/불성실공시법인지정예고/(2026.09.30)불성실공시법인지정예고(공시번복)” — DART / Korea Exchange KOSDAQ Market Division, <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260930901153&dcmNo=11598125&eleId=0&offset=0&length=0&dtd=HTML> · filing · retrieved 2026-10-01 · quote check: exact
- **v002** Crowdworks' 2026 half-year report records that in February 2026 its largest shareholder changed from founder Park Min-woo to the investment association XRP1 (엑스알피1호조합).  
  _event · filing · as of 2026-02-06 (publication) · scope: Crowdworks (operator of A1 Data Marketplace), KR_
  - “2026.02 최대주주 변경 (박민우 → 엑스알피1호조합)” — DART, Financial Supervisory Service (Crowdworks half-year report 2026.06), <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260814001178&dcmNo=11529265&eleId=3&offset=5790&length=125381&dtd=dart4.xsd> · filing · retrieved 2026-10-01 · quote check: exact
- **v003** Crowdworks' 2026 half-year report shows revenue from 'listing commissions' (입점수수료) of KRW 28 million in H1 2026, 0.5% of total revenue, against KRW 29 million in FY2025 and none in FY2024; it does not say which platform the fees come from.  
  _number · filing · as of 2026-06-30 (publication) · scope: Crowdworks (company-wide revenue line; plausibly A1 seller fees, not stated), KR_ · **28 KRW million** (company revenue line '입점수수료' (listing/entry commission), payer and platform not stated; H1 2026 (Jan-Jun))
  - “기타 사업 입점수수료 28 0.5 29 0.3” — DART, Financial Supervisory Service (Crowdworks half-year report 2026.06), <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260814001178&dcmNo=11529265&eleId=9&offset=131175&length=105974&dtd=dart4.xsd> · filing · retrieved 2026-10-01 · quote check: exact
- **v004** Crowdworks' 'AI Data' segment revenue was KRW 613 million in H1 2026 (11.8% of revenue), against KRW 3,564 million for the full year 2025 and KRW 4,523 million in 2024.  
  _number · filing · as of 2026-06-30 (publication) · scope: Crowdworks AI Data segment (company-wide), KR_ · **613 KRW million** (segment revenue as reported, half-year; prior figures are full-year; H1 2026 (Jan-Jun))
  - “AI Data 613 11.8 3,564 34.0 4,523 37.7” — DART, Financial Supervisory Service (Crowdworks half-year report 2026.06), <https://dart.fss.or.kr/report/viewer.do?rcpNo=20260814001178&dcmNo=11529265&eleId=9&offset=131175&length=105974&dtd=dart4.xsd> · filing · retrieved 2026-10-01 · quote check: exact

## Unknown

- `matrix.custody_model` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://a1dm.crowdworks.ai/>, <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/>, <https://a1dm.crowdworks.ai/%ec%8b%9c%eb%8b%88%ec%96%b4-%ec%83%9d%ec%95%a0-%ed%9a%8c%ea%b3%a0-%ec%9d%b8%ed%84%b0%eb%b7%b0-%eb%85%b9%ed%99%94-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-senior-life-retrospective-interview-video-dataset/>
- `matrix.buyer_vetting` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://a1dm.crowdworks.ai/>
- `matrix.erasure_after_sale` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://a1dm.crowdworks.ai/>
- `matrix.exclusivity_offered` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://a1dm.crowdworks.ai/%eb%b2%a0%ed%8a%b8%eb%82%a8-physical-ai-1%ec%9d%b8%ec%b9%ad-%ec%a1%b0%ec%9e%91%c2%b7%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91%c2%b7%eb%aa%a8%ec%85%98%ec%ba%a1%ec%b2%98-%eb%8d%b0%ec%9d%b4%ed%84%b0/>
- `matrix.versioning` — not_published; tried <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/>, <https://a1dm.crowdworks.ai/contact-for-sellers/>
- `matrix.human_subject_consent_docs` — not_published; tried <https://a1dm.crowdworks.ai/%ec%8b%9c%eb%8b%88%ec%96%b4-%ec%83%9d%ec%95%a0-%ed%9a%8c%ea%b3%a0-%ec%9d%b8%ed%84%b0%eb%b7%b0-%eb%85%b9%ed%99%94-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-senior-life-retrospective-interview-video-dataset/>, <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://crowdworks.blog/a1datamaketplace/>
- `matrix.contributor_pay_model` — not_published; tried <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/>, <https://crowdworks.blog/crowdworks-robot-precision-physical-ai-data>
- `questions.Q4` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://crowdworks.blog/a1datamaketplace/>, <https://a1dm.crowdworks.ai/>
- `questions.Q6` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://a1dm.crowdworks.ai/%eb%a1%9c%eb%b4%87%ed%8c%94-%ec%9b%90%ea%b2%a9%ec%a1%b0%ec%9e%91-%eb%8d%b0%ec%9d%b4%ed%84%b0%ec%85%8b-%ec%82%ac%eb%9e%8c%ec%9d%b4-%ea%b0%80%ec%83%81-%eb%a1%9c%eb%b4%87%ed%8c%94%ec%9d%84-%ec%a7%81/>
- `other.terms_of_service` — js_empty; tried <https://my.crowdworks.kr/policy/terms>
- `other.independent_press_and_filings` — not_found; tried <https://dart.fss.or.kr/corp/searchAutoComplete.do?textCrpNm=%ED%81%AC%EB%9D%BC%EC%9A%B0%EB%93%9C%EC%9B%8D%EC%8A%A4>
- `other.buyer_licence_text` — not_published; tried <https://a1dm.crowdworks.ai/contact-for-sellers/>, <https://www.crowdworks.ai/data/datasets>, <https://a1dx.crowdworks.ai/>
- `other.a1_data_exchange` — gated; tried <https://a1dx.crowdworks.ai/>

## Leads, not cited

- <https://dart.fss.or.kr/> — Crowdworks is KOSDAQ-listed; its annual/half-year reports on DART may break out A1 or data-sales revenue. Not reachable without search or an OpenDART key in this run.
- <https://my.crowdworks.kr/policy/terms> — Terms of service linked from the A1 footer; JavaScript-rendered, returned no text to WebFetch or a plain HTTP fetch.
- <https://a1dx.crowdworks.ai/> — A1 Data Exchange (blockchain transaction certificates) sits behind a login.
- <https://www.crowdworks.ai/datapartnership> — Global partnership page recruits labelling vendors, not dataset sellers; may be confused with A1 supply.
