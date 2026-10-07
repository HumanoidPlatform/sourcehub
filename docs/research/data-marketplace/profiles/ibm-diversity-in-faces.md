# IBM Diversity in Faces

failure · light · status: **unknown** · also known as DiF, Diversity in Faces (DiF) dataset, IBM Research DiF Dataset

> Rendered from `ledger/ibm-diversity-in-faces.json`. Do not edit; change the ledger and re-render.

Calls its off-the-shelf side “dataset (IBM: 'a new large and diverse dataset called Diversity in Faces (DiF)'; released to 'the global research community')” and its bespoke side “none found; no collect-to-order offer was attached to DiF”.

## Matrix

| decision | value | claims | note |
|---|---|---|---|
| operator_role | not_applicable | c017, c016 | No intermediary: IBM Research built DiF and distributed it directly under its own terms of use, so there is no platform role to classify. |
| economics_model | free | c015 | Provided free of charge to approved researchers. |
| who_pays_fee | not_applicable | c015 | No fee on either side. |
| supply_models | public_or_scraped | c008, c009 | About one million Creative Commons Flickr photos drawn from Yahoo's public YFCC-100M release; IBM added its own machine-generated annotations. |
| custody_model | mixed | c017, c025, c039, c018 | The annotation files went out through a temporary Box link and were copied into each recipient's own storage (copy_to_buyer). The photos stayed on Flickr and were reached through links (links_only). |
| transaction_mode | free_download | c015, c021 | Free download link sent after a questionnaire and a manual check by IBM. |
| public_prices | not_applicable | c015 | Free; nothing priced. |
| licence_model | standard_licence | c016, c046 | One DiF terms of use for every recipient: non-commercial research only, no identification of individuals. The full text (Merler decl. Ex. H) was not reachable. |
| exclusivity_offered | no | c015, c020 | Handed out free to any approved research requester; about 250 organisations had requested it by March 2019. No exclusive offer found. |
| public_listing | public_summary_gated_detail | c052, c053, c015 | The announcement and the paper, with dataset statistics, were public. The data itself required an approved questionnaire. |
| buyer_vetting | case_by_case | c017, c022, c019 | An IBM researcher checked each request for a legitimate research purpose. IBM refused a journalist, and told an Amazon requester who cited 'internal testing' that the data was for research only, then still approved the request. |
| sample_mechanics | stats_only | c053 | The public paper carries statistical analysis of the annotations. No sample download was found. |
| versioning | mutable_latest | c021, c023, c024 | Numbered versions (1A, then 1B in April 2019). IBM told recipients to delete the superseded version, so only the latest version was valid. |
| human_subject_consent_docs | not_addressed | c049, c031, c009, c030 | The only rights basis was the photographer's Creative Commons licence. No consent or release from the people depicted was sought or passed on. |
| contributor_pay_model | not_applicable | c009, c055 | No contributors in the platform sense: the photos were reused under Creative Commons licences, and no payment to photographers was found. |
| catalogue_plus_custom | unknown |  | DiF was a single released dataset. Whether IBM Research offered collection to order alongside it was not established. |
| erasure_after_sale | takedown_only | c047, c048, c024 | IBM removed images from its own copy on request, and IBM itself said copies already shared were not affected. The one known recall was an email telling recipients to delete Version 1A when 1B shipped; whether that was a contractual duty is not shown. |
| quality_evidence | provider_asserted | c053, c026 | IBM's own paper and statistics. A recipient (Amazon) found the demographic annotations unreliable. |

## The twelve questions

| | state | answer | claims |
|---|---|---|---|
| Q1 | partial | Corporate and academic face-recognition teams requested it: about 250 organisations by March 2019 (IBM's figure), including Microsoft, Amazon, Google and FaceFirst (the last two only alleged), mainly for fairness benchmarking. Microsoft and Amazon found it unsuitable. | c020, c028, c026, c038, c041, c012 |
| Q2 | not_applicable | IBM distributed DiF itself by email and Box link; there was no marketplace listing to compare against. | c017 |
| Q3 | sourced | All inventory was public Flickr photos from Yahoo's YFCC-100M release, filtered to Creative Commons licences, plus IBM's machine-generated facial annotations. The only rights basis was the photographer's CC licence. | c008, c009, c011, c051, c055 |
| Q4 | not_applicable | No commissioned work was involved; the source images came from a public release. |  |
| Q5 | sourced | IBM was maker and sole licensor, and BIPA suits reached both IBM and the downloaders: Microsoft, Amazon, Google and FaceFirst. Microsoft and Amazon won summary judgment on extraterritoriality after a court held that downloading could be 'obtaining' under BIPA; IBM and FaceFirst were dismissed by stipulation, and Google settled (final dismissal 12 December 2025). | c001, c002, c003, c004, c005, c006, c027, c029, c034, c040, c044, c042, c043 |
| Q6 | sourced | IBM emailed a temporary Box link, and recipients copied the files into their own storage (Amazon S3, Azure, laptops). The files carried annotations and Flickr links, and the photos themselves stayed on Flickr. | c017, c025, c039, c018 |
| Q7 | sourced | IBM filtered on the photographer's Creative Commons licence only. No consent was sought from the people depicted, some of whom were strangers photographed on the street. The court in the IBM suit held that facial measurements taken from photographs can be biometric identifiers, and Microsoft's Creative Commons argument was never reached. | c009, c030, c031, c035, c045, c049 |
| Q8 | partial | The terms of use allowed non-commercial research only and banned identifying people. IBM said removals would not reach copies already shared, apart from an email telling recipients to delete Version 1A. No audit or fingerprinting was found. | c016, c046, c048, c024, c033 |
| Q9 | sourced | No sale took place: access was a free download after an emailed questionnaire and a manual check by IBM of the research purpose. | c015, c017, c021, c022 |
| Q10 | partial | The dataset held annotations for about one million faces plus Flickr links. It had numbered versions (1A, then 1B), and IBM told past recipients to delete the old version; what happened at withdrawal is not documented. | c010, c021, c023, c024, c054 |
| Q11 | partial | Before requesting, a user could see only the public paper and its statistics. Amazon's evaluators found the demographic annotations unreliable and the data unbalanced. | c053, c026 |
| Q12 | not_applicable | A single free research dataset with no bespoke collection side. |  |

## Claims

### positioning

- **c012** IBM stated its purpose for DiF as accelerating research towards fairer and more accurate facial recognition.  
  _offer · academic · as of 2019-04-08 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “we can accelerate research towards creating more fair and accurate facial recognition systems” — arXiv (Merler, Ratha, Feris, Smith; IBM Research), <https://arxiv.org/abs/1901.10436> · academic · retrieved 2026-10-01 · quote check: fuzzy 0.82
- **c050** IBM told NBC News that DiF was purely for academic research and would not be used to improve IBM's commercial facial recognition tools.  
  _terms · press_relayed · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “purely for academic research and won't be used to improve the company's commercial facial recognition tools” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c052** IBM's January 2019 announcement called DiF the first of its kind available to the global research community.  
  _offer · vendor_stated · as of 2019-01-29 (page_dated) · scope: IBM Diversity in Faces (DiF)_
  - “The first of its kind available to the global research community” — IBM Research (blog, John R. Smith), <https://research.ibm.com/blog/diversity-in-faces> · vendor_marketing · retrieved 2026-10-01 · quote check: exact

### supply

- **c008** IBM built DiF from about one million photos drawn from YFCC-100M, a set of roughly 100 million Flickr photos that Yahoo released publicly in 2014.  
  _offer · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “used one million of the photos in the YFCC-100M Dataset to develop the Diversity in Faces” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Same order, p.2: 'In 2014, Yahoo!, Flickr’s then-parent company, publicly released a dataset of about 100 million photographs'. The IBM MTD opinion (N.D. Ill. Dkt. 48) says 'over 99 million photos'. Part 2 finding: the profile cites the Microsoft order (W.D. Wash. 2:20-cv-01082 Dkt. 145). This is the separate Amazon order, in which the same judge restates the same finding from the Merler declaration. Both are court records, but they are not fully independent of each other.
    - “used one million of the photos in the YFCC-100M Dataset to develop the Diversity in Faces (“DiF”) Dataset” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Microsoft order Dkt. 145 supports the one-million figure. The YFCC-100M size and the 2014 Yahoo release are in the same order but not in the quote: 'In 2014, Yahoo!, Flickr’s then-parent company, publicly released a dataset of about 100 million photographs'.
- **c009** IBM's pipeline downloaded a YFCC-100M photo only if its licence type was Creative Commons.  
  _architecture · academic · as of 2019-04-08 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “We proceeded with the download only if the license type was Creative Commons” — arXiv (Merler, Ratha, Feris, Smith; IBM Research), <https://arxiv.org/pdf/1901.10436> · academic · retrieved 2026-10-01 · quote check: exact
- **c013** Exposing.ai counts 1,070,000 images from 98,153 Flickr users in DiF.  
  _number · independent · as of 2026-10-01 (retrieved_only) · scope: IBM Diversity in Faces (DiF)_ · **98153 Flickr users whose photos are in DiF** (Exposing.ai's count; total images stated as 1,070,000; as published)
  - “98,153” — Exposing.ai (Adam Harvey), <https://exposing.ai/ibm_dif/> · ngo_report · retrieved 2026-10-01 · quote check: exact

### object_model

- **c010** IBM's paper describes DiF as annotations of one million publicly available face images, produced with ten facial coding schemes.  
  _offer · academic · as of 2019-04-08 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “provides a new data set of annotations of one million publicly available face images” — arXiv (Merler, Ratha, Feris, Smith; IBM Research), <https://arxiv.org/pdf/1901.10436> · academic · retrieved 2026-10-01 · quote check: exact
- **c011** DiF annotations included craniofacial distances, areas and ratios, facial symmetry and contrast, skin colour, age and gender predictions, subjective annotations, and pose and resolution.  
  _offer · academic · as of 2019-04-08 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “craniofacial distances, areas and ratios, facial symmetry and contrast, skin color, age and gender predictions” — arXiv (Merler, Ratha, Feris, Smith; IBM Research), <https://arxiv.org/pdf/1901.10436> · academic · retrieved 2026-10-01 · quote check: exact
- **c023** On 8 April 2019 IBM emailed recipients that Version 1B of DiF was available.  
  _event · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “On April 8, 2019, IBM notified Dr. Hassner by email that Version 1B of the DiF” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c024** Following IBM's email instruction, Amazon's researcher deleted Version 1A from Amazon's storage when downloading Version 1B.  
  _terms · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “As IBM had instructed in its email, Dr. Xiong deleted Version 1A from the Amazon EBS and the S3 Bucket” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### trust

- **c026** Amazon's researchers concluded DiF was not demographically balanced and that its demographic annotations were unreliable.  
  _outcome · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “not a demographically balanced dataset and its demographic annotations were unreliable” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c053** IBM's DiF paper publishes a statistical analysis of the coding schemes extracted for the face images, which is what a prospective user could inspect without requesting the data.  
  _offer · academic · as of 2019-04-08 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “we provide a statistical analysis of the coding schemes extracted for the face images” — arXiv (Merler, Ratha, Feris, Smith; IBM Research), <https://arxiv.org/pdf/1901.10436> · academic · retrieved 2026-10-01 · quote check: exact

### transaction

- **c015** IBM provided the DiF dataset free of charge to researchers who filled out a questionnaire and emailed it to IBM.  
  _terms · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “IBM provided the DiF Dataset free of charge to researchers who filled out a” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Court's background section, citing IBM researcher Merler's declaration (so the underlying fact is IBM's sworn account, adopted by the court). Part 2 finding: the profile cites the Microsoft order (W.D. Wash. 2:20-cv-01082 Dkt. 145). This is the separate Amazon order, in which the same judge restates the same finding from the Merler declaration. Both are court records, but they are not fully independent of each other.
    - “IBM provided the DiF Dataset free of charge to researchers who filled out a questionnaire and submitted it to IBM via email.” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote stops at 'filled out a' and does not show the questionnaire or email. The full sentence is in the same order: '... filled out a questionnaire and submitted it to IBM via email.'
- **c021** IBM approved Amazon researcher Tal Hassner's questionnaire request and sent him a download link to Version 1A of the DiF dataset in February 2019.  
  _event · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “IBM approved the request and sent him a link” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The order dates Hassner's questionnaire to 9 Feb 2019 and the Amazon download to February 2019; it does not give the exact date of IBM's approval, so 'February 2019' is an inference bounded by those two facts. Part 2 finding: this is the same document the profile cites. No second independent document was found; no search available.
    - “IBM approved the request and sent him a link to download Version 1A of the DiF Dataset.” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: fuzzy 0.93
  - verifier (scope): **quote_incomplete** — 'IBM approved the request and sent him a link' omits 'to download Version 1A of the DiF Dataset' (next page) and any date. The order dates the questionnaire to 9 Feb 2019 and Amazon's download to February 2019, but gives no date for IBM's approval.

### licence

- **c014** Exposing.ai reports that IBM provides no attribution links or public credit for the Creative Commons images in DiF.  
  _terms · independent · as of 2026-10-01 (retrieved_only) · scope: IBM Diversity in Faces (DiF)_
  - “IBM does not provide any attribution links, nor any public credit for any of the images” — Exposing.ai (Adam Harvey), <https://exposing.ai/ibm_dif/> · ngo_report · retrieved 2026-10-01 · quote check: exact
- **c016** DiF's terms of use limited it to non-commercial research and prohibited using it to identify any individual in the linked images.  
  _terms · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “could only be used for non-commercial, research purposes and prohibited using the DiF Dataset to identify any” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The terms of use themselves (Merler Decl. Ex. H) were not reachable; the court's description of them is the independent source. Part 2 finding: the profile cites the Microsoft order (W.D. Wash. 2:20-cv-01082 Dkt. 145). This is the separate Amazon order, in which the same judge restates the same finding from the Merler declaration. Both are court records, but they are not fully independent of each other.
    - “could only be used for non-commercial, research purposes and prohibited using the DiF Dataset to identify any individuals” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — This is the court's paraphrase of the DiF terms of use, not the terms themselves; the profile's unknowns already say so.
- **c045** Microsoft argued that the plaintiffs had uploaded their photos under a Creative Commons licence rather than restricting access.  
  _terms · court · as of 2022-05-19 (publication) · scope: Vance v. Microsoft (defendant's brief)_
  - “they uploaded their photos under the Creative Commons license” — Microsoft Corporation, renewed motion for summary judgment (Vance v. Microsoft, Dkt. 127, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.127.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c046** Microsoft's brief states that the DiF terms of use prohibited recipients from attempting to identify any individuals in the dataset.  
  _terms · court · as of 2022-05-19 (publication) · scope: Vance v. Microsoft (defendant's brief)_
  - “to identify any individuals within the IBM Research DiF Dataset” — Microsoft Corporation, renewed motion for summary judgment (Vance v. Microsoft, Dkt. 127, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.127.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c051** NBC News noted that some of the Creative Commons licences on Flickr photos allow commercial use.  
  _terms · independent · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “Some of these licenses allow commercial use.” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact

### custody

- **c017** After verifying a request was for a legitimate research purpose, an IBM researcher emailed the requester a link to a temporary Box folder containing the dataset.  
  _architecture · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “via an email that included a link to a temporary Box folder that contained the DiF Dataset” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Same page: 'After verifying that a request was for a “legitimate research purpose,” IBM researcher Dr. Michele Merler sent the DiF Dataset'. Part 2 finding: the profile cites the Microsoft order (W.D. Wash. 2:20-cv-01082 Dkt. 145). This is the separate Amazon order, in which the same judge restates the same finding from the Merler declaration. Both are court records, but they are not fully independent of each other.
    - “via an email that included a link to a temporary Box folder that contained the DiF Dataset.” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows the Box link but not the vetting step, which this claim is used for (operator_role, buyer_vetting). It needs 'After verifying that a request was for a “legitimate research purpose,” IBM researcher Dr. Michele Merler sent'.
- **c018** DiF itself carried Flickr URLs, face coordinates and annotations; the downloader's evaluation used the Flickr URLs, a sample of photos and face spatial coordinates.  
  _architecture · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “his evaluation used only the Flickr URLs for the photos, a sample of” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c025** Amazon stored its downloaded copy of DiF in its own S3 bucket in an Oregon data centre, with access limited to about 50 research-team members.  
  _architecture · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “restricted to the approximately 50 members of the Research Team” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Same order: the S3 bucket was 'also physically located in the Oregon data center'; the copy was first downloaded to an EBS virtual machine in the same data centre. Part 2 finding: this is the same document the profile cites. No second independent document was found; no search available.
    - “Access to the S3 Bucket was restricted to the approximately 50 members of the Research Team.” — U.S. District Court W.D. Wash. (Order on Amazon's motion for summary judgment, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows the 50-member restriction only. The Oregon location is in the same order ('a specific cloud storage location also physically located in the Oregon data center'), as is the S3 bucket.
- **c039** The Google complaint alleged that what recipients received included the extracted biometric data plus links to each source photograph on Flickr.  
  _architecture · court · as of 2020-07-14 (publication) · scope: Vance v. Google_
  - “links to each photograph on Flickr from which IBM extracted the biometric data” — U.S. District Court, N.D. California (Vance v. Google complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.cand.362392/gov.uscourts.cand.362392.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### vetting

- **c019** NBC News reported IBM declined to share DiF with it, saying the dataset could be used only by academic or corporate research groups.  
  _terms · independent · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “saying it could be used only by academic or corporate research groups” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c022** When Amazon's researcher said he wanted DiF for 'research and internal testing', IBM's Dr. Merler replied that it was for research purposes only and directed him to the questionnaire.  
  _terms · court · as of 2022-10-17 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “Dr. Merler responded that the DiF Dataset was meant for research purposes only” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### contributor_pay

- **c055** NBC News explained that Creative Commons licences on Flickr let others reuse the pictures without paying licence fees.  
  _terms · independent · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “others can reuse their pictures without paying license fees” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The claim is about what NBC said, so the article is the record; it is also the profile's source. IBM's own 2019 announcement also calls YFCC-100M a Creative Commons dataset. Part 2 finding: the profile cites the same NBC article.
    - “Creative Commons licenses, which means that others can reuse their pictures without paying license fees” — NBC News (Olivia Solon, 12 Mar 2019), <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — This is NBC's general explanation of Creative Commons, not a DiF-specific term. It supports contributor_pay_model only by inference that Flickr photographers received nothing.

### post_sale

- **c033** The IBM complaint sought an injunction requiring IBM to delete the data, inform recipients, and claw back the data from third parties it was disseminated to.  
  _outcome · court · as of 2020-01-24 (publication) · scope: Vance v. IBM_
  - “claw back the data from any third parties to whom it was disseminated” — U.S. District Court, N.D. Illinois (Vance v. IBM complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c047** IBM told NBC News that people could send it links to photos they wanted removed from DiF, whether they took them or appear in them.  
  _terms · press_relayed · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “People can contact IBM with individual links to photographs they want removed from the dataset” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
- **c048** IBM told NBC News that removing an image would not remove it from copies of DiF already shared with research partners.  
  _terms · press_relayed · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “it won't be removed from the versions of the dataset already shared with research partners” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact

### changes

- **c001** The last DiF-related BIPA suit, Vance v. Google LLC (N.D. Cal. 5:20-cv-04696), ended on 12 December 2025 when the court approved the plaintiffs' stipulation of dismissal.  
  _event · court · as of 2025-12-12 (publication) · scope: Vance v. Google LLC_
  - “ORDER APPROVING 137 STIPULATION OF DISMISSAL” — CourtListener (docket of Vance v. Google, N.D. Cal. 5:20-cv-04696), <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348824&type=r&order_by=entry_date_filed%20desc> · court_record · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Docket entry 137 (12 Dec 2025) is the plaintiffs' stipulation of dismissal and 138 the order approving it. 'Last' checked against the other DiF dockets on CourtListener: Amazon and Microsoft ended on summary judgment 17 Oct 2022, IBM 11 May 2023, FaceFirst (C.D. Cal. 2:20-cv-06244) dismissed 17 Oct 2023. No search available, so a later suit outside CourtListener cannot be excluded. Part 2 finding: the profile cites the same CourtListener docket, under a different query URL, so this is not a second document. The docket is the authoritative record and no search was available to find another.
    - “ORDER APPROVING 137 STIPULATION OF DISMISSAL. Signed by Judge Beth Labson Freeman on 12/12/2025.” — CourtListener (Free Law Project), RECAP docket of N.D. Cal. 5:20-cv-04696, <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348824&type=rd&order_by=entry_date_filed+desc> · court_record · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (scope): **quote_incomplete** — Fact correct. The quote 'ORDER APPROVING 137 STIPULATION OF DISMISSAL' does not show the date; '... Signed by Judge Beth Labson Freeman on 12/12/2025' would. 'Last' is an inference across the other dockets (c003-c005), not something this source states.
- **c054** As of 2026-10-01 IBM's 2019 DiF announcement page is still live on research.ibm.com, but it carries no request or download link for the dataset.  
  _status · vendor_stated · as of 2026-10-01 (retrieved_only) · scope: IBM Diversity in Faces (DiF)_
  - “Today's release is simply the first step.” — IBM Research (blog, John R. Smith), <https://research.ibm.com/blog/diversity-in-faces> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - “Our trust in technology relies on understanding how it works.” — IBM Research, <https://research.ibm.com/artificial-intelligence/trusted-ai/diversity-in-faces/> · vendor_marketing · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **vendor_only** — Whether IBM's own page is live and lacks a link can only be checked on IBM's site. Fetched https://research.ibm.com/blog/diversity-in-faces on 2026-10-01: live, dated 29 Jan 2019 (updated 15 Feb 2019), and no link mentioning request, download, access or questionnaire was found. The Wayback Machine is blocked, so when the link disappeared cannot be established.
  - verifier (scope): **scope_ok** — The first source (research.ibm.com/blog/diversity-in-faces) is the dated DiF announcement and supports 'still live'. The absence of a link is not quotable, as LEDGER rule 13 allows. The second source (research.ibm.com/artificial-intelligence/trusted-ai/diversity-in-faces/) now serves IBM's generic 'Trustworthy AI' page, which does not mention DiF. Its quote is generic and supports nothing about DiF, except that the old DiF project URL no longer resolves to a DiF page; that is worth stating as such.

### demand

- **c020** IBM told NBC News that about 250 organisations had requested access to DiF by March 2019.  
  _number · press_relayed · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_ · **250 organisations that requested access** (IBM's figure relayed by NBC News; requests, not approvals; cumulative to March 2019)
  - “about 250 organizations have requested access so far” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_relayed** — NBC attributes the figure to IBM; no source independent of IBM gives a count. Reached by navigating from exposing.ai's DiF page, which links the article; no search available. This is the profile's own source, so it does not count as independent. Article dated 12 Mar 2019, updated 17 Mar 2019. Part 2 finding: the profile cites the same NBC article.
    - “about 250 organizations have requested access so far), IBM said.” — NBC News (Olivia Solon, 12 Mar 2019), <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · press_relaying_vendor · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The statement attributes the number to IBM, but the quote omits the attribution; 'about 250 organizations have requested access so far), IBM said.' shows it. The figure is IBM's own, so source_class press_relaying_vendor or origin vendor_stated would fit better than independent_press.
- **c028** Microsoft's contractor obtained DiF to help define a benchmark protocol for evaluating a third-party face recognition technology Microsoft was considering acquiring.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “defining a benchmark protocol for evaluating a third-party facial recognition” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c038** The complaint against Google alleged that Google applied for and obtained DiF from IBM.  
  _outcome · court · as of 2020-07-14 (publication) · scope: Vance v. Google_
  - “applied for and obtained the Diversity in Faces Dataset from IBM” — U.S. District Court, N.D. California (Vance v. Google complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.cand.362392/gov.uscourts.cand.362392.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c041** The complaint against FaceFirst, a retail face-recognition vendor, alleged that FaceFirst applied for and obtained DiF from IBM.  
  _outcome · court · as of 2020-07-14 (publication) · scope: Vance v. FaceFirst_
  - “FaceFirst applied for and obtained the Diversity in Faces Dataset from IBM” — U.S. District Court, C.D. California (Vance v. FaceFirst complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.cacd.788189/gov.uscourts.cacd.788189.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact

### regulation

- **c002** On 11 May 2023 Vance v. IBM (N.D. Ill. 1:20-cv-00577), the suit against the dataset's maker, was dismissed with prejudice under the parties' stipulation of dismissal.  
  _outcome · court · as of 2023-05-11 (publication) · scope: Vance v. IBM_
  - “this case is dismissed with prejudice” — CourtListener (docket of Vance v. IBM, N.D. Ill. 1:20-cv-00577), <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A16759907&type=r&order_by=entry_date_filed%20desc> · court_record · retrieved 2026-10-01 · quote check: fetch_failed
  - verifier (blind): **confirmed_independent** — Minute entry 209, entered 05/11/2023, Judge Nancy L. Maldonado, under Fed. R. Civ. P. 41(a)(1)(A)(ii). Part 2 finding: the profile cites the same CourtListener docket, under a different query URL, so this is not a second document. The docket is the authoritative record and no search was available to find another.
    - “the parties' Stipulation of Dismissal 208, this case is dismissed with prejudice. Civil case terminated.” — CourtListener (Free Law Project), RECAP docket of N.D. Ill. 1:20-cv-00577, <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A16759907&type=rd&order_by=entry_date_filed+desc> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — Fact correct. 'this case is dismissed with prejudice' does not show that it was under the stipulation; 'and the parties' Stipulation of Dismissal 208, this case is dismissed with prejudice' would. The date comes from the entry metadata (Entered: 05/11/2023).
- **c003** On 17 October 2022 the court granted Microsoft summary judgment in the DiF BIPA suit against it.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “JUDGMENT BY COURT: Defendant's motion for summary judgment is GRANTED” — CourtListener (docket of Vance v. Microsoft, W.D. Wash. 2:20-cv-01082), <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348496&type=r&order_by=entry_date_filed%20desc> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Judgment entry 146 of the same date records that the motion for summary judgment is granted. Amazon (W.D. Wash. 2:20-cv-01084) received summary judgment the same day (Dkt. 135/136). Part 2 finding: the profile cites the same CourtListener docket, under a different query URL, so this is not a second document. The docket is the authoritative record and no search was available to find another.
    - “ORDER granting Defendant's 127 Motion for Summary Judgment. Signed by Judge James L. Robart. (LH) (Entered: 10/17/2022)” — CourtListener (Free Law Project), RECAP docket of W.D. Wash. 2:20-cv-01082, <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348496&type=rd&order_by=entry_date_filed+desc> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Judgment entry 146 on the Microsoft docket (W.D. Wash. 2:20-cv-01082), dated 2022-10-17.
- **c004** On 17 October 2022 the court granted Amazon's renewed motion for summary judgment in the DiF BIPA suit against it.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Amazon_
  - “ORDER granting Defendant's 111 Renewed MOTION for Summary Judgment” — CourtListener (docket of Vance v. Amazon, W.D. Wash. 2:20-cv-01084), <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348493&type=r&order_by=entry_date_filed%20desc> · court_record · retrieved 2026-10-01 · quote check: exact
- **c005** On 17 October 2023 the DiF BIPA suit against FaceFirst was dismissed with prejudice on the parties' stipulation.  
  _outcome · court · as of 2023-10-17 (publication) · scope: Vance v. FaceFirst_
  - “the Court hereby DISMISSES this action with prejudice” — CourtListener (docket of Vance v. FaceFirst, C.D. Cal. 2:20-cv-06244), <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17352098&type=r&order_by=entry_date_filed%20desc> · court_record · retrieved 2026-10-01 · quote check: fetch_failed
- **c006** The Microsoft ruling held that BIPA does not apply extraterritorially, so the downloader's conduct had to have occurred primarily and substantially in Illinois, which the plaintiffs could not show.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “the extraterritoriality doctrine bars Plaintiffs' BIPA claims as a matter of law” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c007** The Microsoft court noted that the photo collection, scanning and generation of facial measurements were done by other entities (Flickr, Yahoo and IBM), not by the downloader.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “rather than Microsoft—were responsible for the collection of the photographs, the scanning of the photographs” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c027** The Amazon ruling, like the Microsoft one, held that BIPA's extraterritoriality doctrine barred the claims against the downloader.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Amazon_
  - “extraterritoriality doctrine bars Plaintiffs' BIPA claims as a matter of law” — U.S. District Court, W.D. Washington (Vance v. Amazon, Dkt. 135, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.135.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c029** The Microsoft court read BIPA section 15(b) as regulating the acquisition of biometric data, not the later encrypted storage of data already acquired.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “regulates only the acquisition of data, rather than the encrypted storage of data after it is acquired” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c030** One plaintiff photographed strangers on Chicago streets and did not know the names or residence of most people depicted in his photos in DiF.  
  _outcome · court · as of 2022-10-17 (publication) · scope: Vance v. Microsoft_
  - “he does not know the names or places of residence of the individuals depicted in most of his photos” — U.S. District Court, W.D. Washington (Vance v. Microsoft, Dkt. 145, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287400/gov.uscourts.wawd.287400.145.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c031** The complaint against IBM alleged that IBM never sought or received the plaintiff's consent before scanning his facial geometry.  
  _outcome · court · as of 2020-01-24 (publication) · scope: Vance v. IBM_
  - “never sought, nor received, his consent before doing so” — U.S. District Court, N.D. Illinois (Vance v. IBM complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c032** The complaint against IBM alleged that IBM released the database of facial measurements to third parties.  
  _outcome · court · as of 2020-01-24 (publication) · scope: Vance v. IBM_
  - “Defendant then released this database to third parties.” — U.S. District Court, N.D. Illinois (Vance v. IBM complaint, Dkt. 1, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.1.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c034** In September 2020 the court denied IBM's motion to dismiss the BIPA claims, following cases holding that biometric data obtained from photographs is a biometric identifier.  
  _outcome · court · as of 2020-09-15 (publication) · scope: Vance v. IBM_
  - “IBM's motion to dismiss Plaintiffs' BIPA claims is denied” — U.S. District Court, N.D. Illinois (Vance v. IBM memorandum opinion, Dkt. 48, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.48.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — Opinion dated 15 Sep 2020 concludes 'IBM’s motion to dismiss Plaintiffs’ BIPA claims is denied.' Nuance the statement omits: the court dismissed the BIPA s.15(a) count (Count One) sua sponte for lack of Article III standing and the injunctive-relief count; the s.15(b)-(e) and unjust-enrichment counts survived. Part 2 finding: this is the same document the profile cites. No second independent document was found; no search available.
    - “courts have held that biometric data obtained from photographs is a “biometric identifier.”” — U.S. District Court N.D. Ill. (Memorandum Opinion, Dkt. 48, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.48.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — Quote matches the court's words. The statement leaves out that the same opinion dismissed the BIPA s.15(a) count for lack of standing and dismissed the injunctive-relief count. 'The BIPA claims' therefore means the s.15(b)-(e) counts. Not wrong, but worth a qualifier.
- **c035** The IBM court noted that courts have held biometric data obtained from photographs to be a biometric identifier under BIPA, despite BIPA's exclusion of photographs.  
  _outcome · court · as of 2020-09-15 (publication) · scope: Vance v. IBM_
  - “courts have held that biometric data obtained from photographs is a biometric identifier” — U.S. District Court, N.D. Illinois (Vance v. IBM memorandum opinion, Dkt. 48, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.48.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c036** The DiF plaintiffs sought statutory damages of USD 5,000 per wilful or reckless BIPA violation.  
  _number · court · as of 2020-09-15 (publication) · scope: Vance v. IBM_ · **5000 USD per violation** (BIPA liquidated damages claimed by plaintiffs against the dataset maker, per wilful or reckless violation; per violation)
  - “Plaintiffs seek statutory damages of $5,000 for each willful and reckless violation” — U.S. District Court, N.D. Illinois (Vance v. IBM memorandum opinion, Dkt. 48, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.48.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — This is the pleading itself, a different document from the court's opinion (Dkt. 48), which also summarises the figure as '$5,000 for each willful and reckless violation'. The complaint ties $5,000 to 'intentional and reckless' violations, following BIPA's 'intentional or reckless'. Number confirmed.
    - “statutory damages of $5,000 per BIPA violation, or, alternatively, if Defendant IBM acted negligently” — Plaintiffs' Second Amended Class Action Complaint, N.D. Ill. 1:20-cv-00577 Dkt. 19 (via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.19.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok** — From the IBM opinion. The same plaintiffs brought every DiF suit, so 'the DiF plaintiffs' is fair, though the figure is the statutory amount in the IBM complaint as the court summarised it.
- **c037** The DiF plaintiffs sought statutory damages of USD 1,000 per negligent BIPA violation.  
  _number · court · as of 2020-09-15 (publication) · scope: Vance v. IBM_ · **1000 USD per violation** (BIPA liquidated damages claimed by plaintiffs, per negligent violation; per violation)
  - “and $1,000 for each negligent violation of BIPA” — U.S. District Court, N.D. Illinois (Vance v. IBM memorandum opinion, Dkt. 48, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.48.0_1.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c040** In October 2025 the Google suit was first dismissed without prejudice under a stipulation that referred to the parties' settlement agreement.  
  _outcome · court · as of 2025-10-10 (publication) · scope: Vance v. Google_
  - “solely for the purpose of enforcing the terms of the parties' settlement agreement” — U.S. District Court, N.D. California (Vance v. Google stipulation, Dkt. 134, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.cand.362392/gov.uscourts.cand.362392.134.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact_nospace
  - verifier (blind): **confirmed_independent** — Stipulation dated 10 Oct 2025 asks for dismissal 'with out prejudice' (pdf spacing) and says a with-prejudice stipulation will follow within 60 days; order 135 approved it on 10 Oct 2025. Part 2 finding: this is the same document the profile cites. No second independent document was found; no search available.
    - “solely for the purpose of enfor cing the terms of the parties’ settlement agreement” — U.S. District Court N.D. Cal. (Dkt. 134, via CourtListener RECAP), <https://storage.courtlistener.com/recap/gov.uscourts.cand.362392/gov.uscourts.cand.362392.134.0.pdf> · court_record · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **quote_incomplete** — The quote shows the settlement reference but not 'without prejudice'. 'the dismissal of this action with out prejudice' (pdf spacing) would show it. The date is on the face of the document (Filed 10/10/25).
- **c042** An Amazon shareholder used the DiF BIPA suit as grounds to demand Amazon's books and records to investigate possible privacy-law violations.  
  _outcome · court · as of 2023-04-24 (publication) · scope: Thompson v. Amazon.com_
  - “Thompson seeks to investigate possible wrongdoing by Amazon in violating privacy laws” — Court of Appeals of Washington, Division One (Thompson v. Amazon.com, No. 84066-5-I, via CourtListener), <https://storage.courtlistener.com/pdf/2023/04/24/aleta_thompson_v._amazon.com_inc..pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c043** After Amazon won summary judgment in the DiF suit, the Washington Court of Appeals vacated the shareholder inspection order and directed dismissal.  
  _outcome · court · as of 2023-04-24 (publication) · scope: Thompson v. Amazon.com_
  - “we vacate the superior court's inspection order and remand with instructions to dismiss Thompson's complaint” — Court of Appeals of Washington, Division One (Thompson v. Amazon.com, No. 84066-5-I, via CourtListener), <https://storage.courtlistener.com/pdf/2023/04/24/aleta_thompson_v._amazon.com_inc..pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c044** At the motion-to-dismiss stage the Vance v. Amazon court held that allegedly downloading DiF was enough to fall within BIPA section 15(b) ('otherwise obtain').  
  _outcome · court · as of 2023-04-24 (publication) · scope: Vance v. Amazon_
  - “the allegations that Amazon downloaded the Diversity in Faces dataset were sufficient” — Court of Appeals of Washington, Division One (Thompson v. Amazon.com, No. 84066-5-I, via CourtListener), <https://storage.courtlistener.com/pdf/2023/04/24/aleta_thompson_v._amazon.com_inc..pdf> · court_record · retrieved 2026-10-01 · quote check: exact
- **c049** A photographer whose Flickr photos were in DiF told NBC News that none of the people he photographed knew their images were used this way.  
  _outcome · independent · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “None of the people I photographed had any idea their images were being used in this way” — NBC News, <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (blind): **confirmed_independent** — The speaker is Greg Peverill-Conti, who NBC says has more than 700 photos in the dataset. The claim is about what NBC reported, so the article is the record itself; it is also the profile's source. No second outlet reachable without search. Part 2 finding: the profile cites the same NBC article.
    - “None of the people I photographed had any idea their images were being used in this way” — NBC News (Olivia Solon, 12 Mar 2019), <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: exact
  - verifier (scope): **scope_ok**

## Added by the verifier

- **v001** NBC News reported in March 2019 that IBM had not publicly shared the list of Flickr users and photos in DiF, so people had no easy way to find out whether their photos were included.  
  _terms · independent · as of 2019-03-12 (publication) · scope: IBM Diversity in Faces (DiF)_
  - “IBM has not publicly shared the list of Flickr users and photos included in the dataset” — NBC News (Olivia Solon), <https://www.nbcnews.com/tech/internet/facial-recognition-s-dirty-little-secret-millions-online-photos-scraped-n981921> · independent_press · retrieved 2026-10-01 · quote check: fuzzy 0.93

## Unknown

- `other.withdrawal` — not_found; tried <https://research.ibm.com/blog/diversity-in-faces>, <https://research.ibm.com/artificial-intelligence/trusted-ai/diversity-in-faces/>, <https://research.ibm.com/sitemap-0.xml>, <https://exposing.ai/ibm_dif/>, <https://exposing.ai/datasets/>, <https://www.courtlistener.com/api/rest/v4/search/?q=%22Diversity%20in%20Faces%22%20AND%20(%22no%20longer%22%20OR%20discontinued%20OR%20withdrew)&type=r>
- `matrix.catalogue_plus_custom` — not_published; tried <https://research.ibm.com/blog/diversity-in-faces>, <https://arxiv.org/abs/1901.10436>
- `other.terms_of_use_full_text` — paywalled; tried <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348496%20AND%20Merler&type=r>, <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A17348493%20AND%20Merler&type=r>
- `other.settlement_terms` — not_published; tried <https://storage.courtlistener.com/recap/gov.uscourts.cand.362392/gov.uscourts.cand.362392.134.0.pdf>, <https://storage.courtlistener.com/recap/gov.uscourts.ilnd.372910/gov.uscourts.ilnd.372910.208.0.pdf>
- `other.ibm_2020_face_recognition_exit` — not_found; tried <https://www.ibm.com/policy/facial-recognition-sunset-racial-justice-reforms/>, <https://www.ibm.com/blogs/policy/facial-recognition-sunset-racial-justice-reforms/>
- `other.courtlistener_html_pages` — blocked; tried <https://www.courtlistener.com/docket/17348496/145/vance-v-microsoft-corporation/>, <https://www.courtlistener.com/docket/17348824/138/vance-v-google-llc/>

## Leads, not cited

- <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A63265678&type=r> — Nelson v. Bezos (W.D. Wash. 2:22-cv-00559): stockholder derivative complaint citing the DiF suit; a further downstream effect on a buyer. Not read.
- <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A16821454&type=r> — Janecyk v. IBM (N.D. Ill. 1:20-cv-00783), a parallel suit against IBM, terminated 2023-08-09. Not read.
- <https://www.courtlistener.com/api/rest/v4/search/?q=docket_id%3A60033441&type=r> — Vance v. IBM miscellaneous matter (N.D. Cal. 3:21-mc-80156), probably third-party discovery about DiF recipients. Not read.
- <https://storage.courtlistener.com/recap/gov.uscourts.wawd.287404/gov.uscourts.wawd.287404.1.0.pdf> — Vance v. Amazon complaint; cites the IBM DiF paper dated Apr. 10, 2019. Not read.
- <https://arxiv.org/abs/2111.04424> — Luccioni et al., A Framework for Deprecating Datasets; cites the DiF litigation as a case where deprecation had legal grounds.
