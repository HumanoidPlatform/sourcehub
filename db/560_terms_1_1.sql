-- ============================================================================
-- 560 · Terms & Conditions version 1.1: the agreement without placeholders
--
-- Version 1.0 (db/470) went live with bracketed values Legal had not filled
-- in. A version cannot change once anybody has accepted it, so the complete
-- text is a new version, effective when this migration runs. Everyone held to
-- the Terms (everyone but the crowd's worker role) accepts it at their next
-- sign-in; their acceptance of 1.0 stays on record, untouched.
--
-- 1.1 is 1.0 word for word except, as agreed on 20 October 2026:
--   1    the operator named: CoSarathi Group Private Limited
--   6.4  72 hours, 6.7 the Privacy Policy named, 7.1 30 days, 7.6 12 months,
--        13.2 30 days: Legal's proposed values, kept
--   7.7  no interest on overdue fees, set-off only
--   9.7  no grievance contact to write to
--   11.4 the overall cap is the fees paid in the 12 months before the claim
--   13   arbitration and the courts sentence removed; governed by the laws of
--        India (13.3); urgent relief renumbered 13.4
--   14.6 no address for notices to us; 14.9 the grievance contact removed
--   15   the version and date are not written into the text (the page shows them)
-- ============================================================================

INSERT INTO platform_terms (version, title, effective_at, checkbox_text, declaration, body)
VALUES (
  '1.1',
  'DataMind360 Onboarding Terms & Conditions',
  now(),
  'I have read, understood and agree to be bound by the DataMind360 Onboarding Terms & Conditions and the Privacy Policy.',
  ARRAY[
    'I am at least 18 years old and authorised to accept these Terms for myself or for the organisation I represent.',
    'All information I provide at registration and later is accurate and complete.',
    'DataMind360 is only a platform and is not a party to any Transaction. I alone am responsible for the Transactions I enter into, the Data I provide, collect, aggregate or use, and my compliance with Applicable Law.',
    'I accept the disclaimers, limits of liability, release and indemnity in Sections 10 and 11.',
    'I agree that my acceptance is recorded electronically, with date, time and account details, and is legally binding.'
  ],
  $fn$These Terms apply to every Data Seeker, Data Provider, Aggregator and Device Sponsor who registers on DataMind360, and take effect when you select "I Accept". DataMind360 is only a platform: the participants, not DataMind360, are responsible for the transactions they enter into.

## 1. Definitions and roles

In these Terms, the words below have the meanings given here.

- Platform: the DataMind360 website, portal, applications, APIs and related services, operated by CoSarathi Group Private Limited ("DataMind360", "we", "us").
- Participant ("you"): any individual or organisation that registers on the Platform in one or more of the roles below.
- Data Seeker: a Participant that searches for, requests, purchases, licenses or otherwise accesses Data through the Platform.
- Data Provider: a Participant that makes Data available through the Platform, whether the Data is owned, generated or lawfully authorised for sharing by that Participant.
- Aggregator: a Participant that collects, combines, curates or packages Data from multiple sources or contributors and offers it through the Platform.
- Device Sponsor: a Participant that supplies, funds, hosts or operates devices, sensors or connected endpoints that generate or collect Data for use on the Platform.
- Data: any information, dataset, signal, content or derived output that is listed, requested, shared or exchanged through the Platform.
- Transaction: any agreement, sale, licence, contribution, sponsorship or other dealing between Participants that is initiated, negotiated or carried out on or through the Platform.
- Applicable Law: all laws, rules, regulations, orders and binding guidelines that apply to a Participant, a Transaction or the Data, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, each as amended.
- Role-Specific Terms: additional terms that DataMind360 publishes for a particular role (for example, Tenant or Crowd Partner), which apply together with these Terms.

A Participant may hold more than one role. If you do, the obligations for every role you hold apply to you.

## 2. Acceptance and eligibility

2.1 You must select "I Accept" on the registration page before you can create an account or use any part of the Platform. If you do not accept these Terms, you may not register or use the Platform.

2.2 Selecting "I Accept" is your legally binding electronic acceptance of these Terms under the Information Technology Act, 2000. We record the date, time, account and version of the Terms you accepted, and may rely on that record as evidence.

2.3 If you register on behalf of an organisation, you confirm that you are authorised to bind it, and "you" then includes that organisation.

2.4 You must be at least 18 years old and legally capable of entering into a contract. The Platform is not intended for minors.

2.5 You agree to complete identity and business verification (KYC) when asked, and to keep your details current. We may refuse, suspend or revoke a registration if verification fails or we identify a risk.

2.6 We may update these Terms from time to time. We will notify material changes on the Platform or by email. Using the Platform after the effective date of a change means you accept it, and we may ask you to select "I Accept" again.

2.7 If Role-Specific Terms conflict with these Terms, the Role-Specific Terms prevail for that role, except that Sections 3, 10 and 11 always prevail.

## 3. Nature of the platform

3.1 DataMind360 is a neutral online platform that helps Participants find each other and offer, request and exchange Data. It acts as an intermediary and provides technology and discovery services only.

3.2 DataMind360 is not a party to any Transaction. Contracts are formed directly and solely between Participants. We do not buy, sell, own, license, endorse, guarantee, inspect or take custody of Data, unless we say so expressly in writing.

3.3 DataMind360 is not the agent, broker, employer, partner, trustee or fiduciary of any Participant. Any payment, escrow or settlement feature is delivered through licensed third-party providers on their terms.

3.4 Participants alone decide whether to enter into a Transaction. Participants alone are responsible for negotiating terms, pricing, delivery, quality, legality of Data, consents, compliance and payment.

3.5 Verification badges, ratings, scores, reviews, quality indicators and matching or AI-assisted suggestions on the Platform are informational aids. They are not guarantees, and you must carry out your own due diligence.

3.6 Third-party services used on the Platform (such as payment gateways, identity verification and cloud hosting) are governed by their own terms. DataMind360 is not responsible for them.

3.7 DataMind360 acts as an "intermediary" under the Information Technology Act, 2000, and relies on the protections available to intermediaries under that Act and Applicable Law.

## 4. General guidelines for use

4.1 Account and security. Keep your login credentials confidential. You are responsible for all activity under your account and must tell us promptly about any unauthorised access.

4.2 Accurate information. Provide information that is true, complete and current, including profile details, Data descriptions, source, provenance and licence terms.

4.3 Lawful purpose. Use the Platform only for lawful business purposes that fit your role and these Terms.

4.4 Prohibited conduct. You must not:

- violate Applicable Law or infringe anyone's rights;
- list, request or share Data that you do not have the right or consent to share;
- misrepresent your identity, role, authority, Data source, Data quality or intended use;
- re-identify, de-anonymise or attempt to link anonymised Data back to individuals;
- resell, sublicense or share Data beyond what your Transaction permits;
- scrape, probe, overload, reverse engineer or interfere with the Platform, or introduce malicious code;
- use bots or automated tools except through APIs we authorise;
- manipulate ratings, reviews, rankings or verification signals;
- use the Platform for fraud, money laundering, terrorist financing, sanctions evasion or any other unlawful activity;
- list or request restricted categories of Data that we publish from time to time (for example, sensitive personal data or children's data) without our prior written approval.

4.5 Content review. We may remove or restrict listings, requests or messages that appear to breach these Terms or Applicable Law, or that we are directed to remove. We are not obliged to monitor content.

4.6 Conduct towards others. Communicate professionally and honestly with other Participants and with us. Spam, harassment and abusive conduct are not allowed.

## 5. Ethical standards

Every Participant agrees to act ethically in every role. In particular, you will:

- Source lawfully and with consent. Collect, hold and share Data only on a valid lawful basis, with free, informed and specific consent where required. Keep records of consent and honour withdrawal.
- Be transparent and limit purpose. Use Data only for the purpose you declared to the Platform and to the people concerned. No hidden or incompatible uses.
- Protect privacy and dignity. Minimise personal data, anonymise wherever possible, and never use Data to surveil, stalk, harass, profile unlawfully or harm individuals or communities.
- Treat people fairly. Do not use Data or models built on it to discriminate unlawfully on grounds such as religion, caste, gender, age, disability, origin or health.
- Use AI responsibly. Where Data trains or powers AI systems, do not use outputs for deception, impersonation or unlawful profiling, and keep meaningful human oversight over decisions that significantly affect people.
- Protect the vulnerable. Take extra care with children and vulnerable people, and do not exploit them or their Data.
- Act with integrity. No fraud, bribery, undisclosed conflicts of interest, or misleading claims about Data quality, performance or origin.
- Report concerns. Tell us promptly if you become aware of misuse of Data, a consent failure or any breach of this Section.

We may suspend or terminate a Participant that breaches this Section, in line with Section 12.

## 6. Data protection and security

6.1 Your compliance. Each Participant is responsible for complying with Applicable Law on data protection, including the Digital Personal Data Protection Act, 2023 and its rules, and for working out its own legal role (for example, data fiduciary or processor) in each Transaction.

6.2 Personal data. Data Providers and Aggregators must ensure there is a valid lawful basis and, where required, consent for every item of personal data they share. Data Seekers must use personal data only for the stated purpose, and must delete or return it when that purpose ends unless the law requires retention.

6.3 Security safeguards. Each Participant must maintain reasonable security safeguards for the Data it handles, such as encryption in transit, access controls, logging and timely patching.

6.4 Breach notification. If you become aware of a personal data breach or unauthorised access involving Data exchanged through the Platform, you must notify DataMind360 and the affected counterparties without undue delay and within 72 hours. You must also notify regulators and individuals where the law requires.

6.5 Individuals' rights. Each Participant must respond to requests from individuals about Data it controls (such as access, correction, erasure and withdrawal of consent) and cooperate with other Participants to fulfil them.

6.6 Cross-border transfers. You are responsible for complying with any restrictions on transferring Data outside India or between jurisdictions.

6.7 Our handling of account information. How we handle your registration and account information is described in our Privacy Policy. Unless needed to run and secure the Platform or to comply with law, we do not access the content of Data exchanged between Participants.

## 7. Commercial terms

7.1 Platform fees. Subscription, listing, transaction, commission or other fees payable to DataMind360 are those published on the Platform or agreed in writing. We will give 30 days' notice of any increase.

7.2 Pricing between Participants. Participants set their own prices and terms. DataMind360 does not set, review or guarantee prices, volumes, revenue or demand.

7.3 Payments. Where the Platform offers payment or settlement features, they are processed by third-party providers. You bear your own bank, gateway and currency conversion charges. To the extent the law permits, we may delay or withhold a payout or settlement where we reasonably suspect fraud, a legal breach or an unresolved dispute, or where a court or authority directs us to.

7.4 Taxes. Each Participant is responsible for its own taxes, including GST, TDS and income tax, and for issuing valid invoices. Fees payable to us are exclusive of applicable taxes, which you will pay.

7.5 Refunds and Transaction disputes. Refunds, returns, quality claims and remedies between Participants are governed by their Transaction terms. DataMind360 fees are non-refundable unless we state otherwise or the law requires.

7.6 No bypassing. For 12 months after a Participant is introduced to you through the Platform, you must not move dealings with that Participant off the Platform to avoid paying fees.

7.7 Overdue amounts. We may set off amounts you owe us against any amount we hold for you.

7.8 Rewards and revenue share. Any revenue share, reward or incentive for Aggregators, Device Sponsors or other roles applies only as set out in the relevant Role-Specific Terms or written agreement.

## 8. Role-specific obligations

The obligations below apply in addition to the rest of these Terms, according to the role or roles you hold.

### 8.1 Data Seekers

- Use Data only for the purpose and within the licence agreed in the Transaction.
- Check that the Data suits your needs before relying on it. You alone are responsible for decisions you make using it.
- Keep your own lawful basis for any further processing, and do not re-identify or onward-share Data without permission.
- Delete or return Data when the licence ends, unless the law requires you to keep it.
- Pay agreed amounts on time.

### 8.2 Data Providers

- Own the Data or hold all rights, licences and consents needed to share it as listed.
- Describe the Data accurately, including source, collection method, date, format and known limitations.
- Deliver the quality, frequency and format you promised, and keep any promised refresh schedule.
- Correct or withdraw Data promptly if it is inaccurate, unlawful or consent is withdrawn.

### 8.3 Aggregators

- Carry out due diligence on every source and contributor, and keep records of provenance and consent for the Data you aggregate.
- Do not present aggregated Data as first-party Data, and be open about how you cleaned, combined, enriched or anonymised it.
- Make sure combining datasets does not create a risk of re-identification.
- Bind your contributors to terms at least as protective as these Terms. You are responsible for their acts and omissions.

### 8.4 Device Sponsors

- Make sure your devices, sensors and installations comply with Applicable Law, including equipment, telecom, safety and electronic-waste rules.
- Obtain permission from owners or occupiers of installation sites, and give clear notice to, and obtain consent from, people whose data devices capture.
- Never place devices where capture would be unlawful or intrusive, and never collect beyond the declared scope.
- Secure devices throughout their life: unique credentials, timely updates, and prompt decommissioning.
- Bear device, power, connectivity and maintenance costs unless agreed otherwise in writing.

## 9. Intellectual property and licences

9.1 Platform rights. DataMind360 and its licensors own the Platform, its software, design, trademarks and content. We grant you a limited, non-exclusive, non-transferable, revocable right to use the Platform as these Terms allow.

9.2 Data ownership. Data remains the property of the Data Provider or the rightful owner. Nothing in these Terms transfers ownership of Data to DataMind360.

9.3 Licence to us. You grant DataMind360 a limited, non-exclusive, worldwide, royalty-free licence to host, display and process your profile, listing information and metadata as needed to operate, secure and improve the Platform. This does not give us rights to the underlying Data exchanged in a Transaction, beyond the processing needed to run the Platform.

9.4 Licences between Participants. Scope, term, territory and permitted use are set in the Transaction terms. Unless agreed otherwise, a Data Seeker receives only a non-exclusive, non-transferable right to use the Data internally for the declared purpose.

9.5 Derived outputs. Ownership of insights, models and other outputs derived from Data is set in the Transaction terms. If they are silent, the Data Seeker owns outputs it creates, provided they do not expose or reproduce the source Data.

9.6 Feedback. We may use any suggestions or feedback you give us without restriction or payment.

9.7 Infringement notices. We may remove content on receiving a valid notice that it infringes someone's rights.

9.8 Aggregated statistics. We may use non-personal, aggregated usage statistics about the Platform to operate and improve it, without disclosing the content of any Participant's Data.

## 10. Disclaimers

10.1 Provided "as is". The Platform and all related services are provided "as is" and "as available". To the fullest extent permitted by law, DataMind360 disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, accuracy, completeness and uninterrupted or error-free operation.

10.2 No warranty on Data. DataMind360 does not review all content and does not warrant the accuracy, quality, completeness, legality, provenance, consent status or suitability of any Data, listing or statement made by a Participant.

10.3 No warranty on Participants. We do not guarantee the identity, solvency, capability, honesty or performance of any Participant. Verification on the Platform is limited, and you must carry out your own due diligence before dealing with anyone.

10.4 No warranty on outcomes. We make no promise about the results of any Transaction, including revenue, savings, model performance, business or regulatory outcomes.

10.5 Availability. The Platform may be interrupted for maintenance, upgrades, security events or reasons beyond our control. We do not guarantee that any Data or content will be retained on the Platform, so keep your own copies.

10.6 No professional advice. Content, scores and analytics on the Platform are not legal, financial, tax or compliance advice.

10.7 Your own risk. You acknowledge that you rely on Data, on other Participants and on third-party services at your own risk.

## 11. Liability and indemnity

11.1 Participants are solely responsible. Each Participant is solely and exclusively responsible and liable for the Transactions it enters into, the Data it provides, requests, aggregates, collects, receives or uses, its compliance with Applicable Law, and its acts and omissions towards other Participants and third parties, including the individuals whose data is involved.

11.2 No liability for Transactions. DataMind360, its affiliates, directors, officers, employees, agents and licensors (the "DataMind360 Parties") are not liable for any claim, loss or damage arising from or related to:

- any Transaction or dispute between Participants;
- any breach, default, misrepresentation or misconduct by a Participant;
- any Data, including its inaccuracy, illegality, infringement, misuse, loss or security breach;
- non-payment, non-delivery, delay or defects in anything exchanged between Participants;
- any act or omission of a third party, including payment, identity and hosting providers.

11.3 Excluded losses. In no event are the DataMind360 Parties liable for indirect, incidental, special, consequential, exemplary or punitive damages, or for loss of profit, revenue, data, goodwill or business opportunity, whether in contract, tort (including negligence), under statute or otherwise, even if we were told such loss was possible.

11.4 Overall cap. To the extent any liability of the DataMind360 Parties to you cannot be excluded, their total liability for all claims will not exceed the fees you paid to DataMind360 in the 12 months before the claim arose.

11.5 Limits of exclusion. Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under Applicable Law.

11.6 Release. You release the DataMind360 Parties from all claims, demands and damages, known or unknown, relating to the conduct of other Participants and to Transactions.

11.7 Indemnity. You will defend, indemnify and hold harmless the DataMind360 Parties against all claims, losses, damages, fines, penalties, costs and expenses (including reasonable legal fees) arising from or related to:

- your Transactions;
- the Data you provide, request, aggregate, collect or use;
- your breach of these Terms or Applicable Law;
- any infringement of intellectual property, privacy or other rights;
- claims by individuals, regulators or other Participants about your acts or omissions;
- your negligence, fraud or wilful misconduct.

11.8 Third-party and regulatory claims. If a regulator or third party makes a claim against a DataMind360 Party because of a Participant's Data or conduct, that Participant will cooperate fully and bear the resulting costs.

11.9 Between Participants. Participants allocate liability to each other in their Transaction terms. These Terms create no rights for one Participant against another, and no liability of DataMind360 towards either.

11.10 Basis of the bargain. You agree that this Section 11 and Section 10 fairly allocate risk between you and us, and that our fees reflect that allocation.

## 12. Suspension, termination and audit

12.1 Closing your account. You may close your account at any time, after settling any obligations still in progress.

12.2 Our right to act. We may suspend or restrict your access, remove listings, or terminate your account, with or without prior notice, if we reasonably believe that:

- you have breached these Terms, Role-Specific Terms or Applicable Law, including the ethical standards in Section 5;
- you pose a fraud, security or reputational risk to the Platform or other Participants;
- verification has failed or information you gave is false;
- fees are unpaid or the account has been inactive for a long period;
- a court, regulator or authority directs us to act.

12.3 Effect. When access ends, Transactions already agreed remain between the Participants, accrued obligations continue, and each Participant must handle Data as its Transaction terms and Section 6 require. We may keep records as the law requires. No compensation is payable for suspension or termination under this Section.

12.4 Audit and cooperation. On reasonable notice, we may ask for documents showing consent, provenance, licences and compliance, and you must cooperate with us and with any regulator or law enforcement agency. We may disclose information to authorities where the law requires or permits.

12.5 Survival. Sections 3, 5, 6, 9, 10, 11, 13 and 14 continue after termination.

## 13. Disputes and governing law

13.1 Disputes between Participants. Participants must resolve disputes between themselves, in good faith and under their Transaction terms. DataMind360 has no duty to mediate, arbitrate or decide them. We may, at our discretion, offer information or optional non-binding facilitation. Doing so does not make us a party, and does not create any liability or any binding decision.

13.2 Disputes with DataMind360. If you have a dispute with us, allow 30 days for good-faith discussion before taking any further step.

13.3 Governing law. These Terms are governed by the laws of India.

13.4 Urgent relief. DataMind360 may seek urgent injunctive relief from any competent court to protect its intellectual property, the security of the Platform or other Participants.

## 14. General provisions

14.1 Entire agreement. These Terms, any Role-Specific Terms, the fee schedule and the Privacy Policy are the entire agreement between you and DataMind360 about the Platform.

14.2 Relationship. You and DataMind360 are independent parties. Nothing creates an employment, agency, partnership or joint venture.

14.3 Severability and waiver. If any part of these Terms is unenforceable, the rest continues in force. A delay or failure to enforce a right is not a waiver of it.

14.4 Assignment. You may not assign or transfer your rights under these Terms without our written consent. We may assign ours to an affiliate or a successor to our business.

14.5 Force majeure. Neither party is liable for failure or delay caused by events beyond its reasonable control, including natural disasters, outages, cyber attacks, government action or pandemics.

14.6 Notices. We may give notice through the Platform or by email to the address on your account. Notices are treated as received 24 hours after they are sent.

14.7 Third-party rights. The DataMind360 Parties may enforce Sections 10 and 11. No other third party has rights under these Terms.

14.8 Electronic record and language. These Terms are an electronic record under the Information Technology Act, 2000, and need no physical or digital signature. The English version prevails over any translation.

## 15. Acceptance

The registration page shows the current version of these Terms and the date it took effect, with a checkbox and an "I Accept" button. The button stays disabled until the checkbox is ticked. Registration cannot be completed without acceptance.

### Checkbox wording

> I have read, understood and agree to be bound by the DataMind360 Onboarding Terms & Conditions and the Privacy Policy.

### Declaration shown above the "I Accept" button

> By selecting "I Accept", I confirm that:

- I am at least 18 years old and authorised to accept these Terms for myself or for the organisation I represent.
- All information I provide at registration and later is accurate and complete.
- DataMind360 is only a platform and is not a party to any Transaction. I alone am responsible for the Transactions I enter into, the Data I provide, collect, aggregate or use, and my compliance with Applicable Law.
- I accept the disclaimers, limits of liability, release and indemnity in Sections 10 and 11.
- I agree that my acceptance is recorded electronically, with date, time and account details, and is legally binding.
$fn$
);
