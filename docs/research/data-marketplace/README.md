# How data marketplaces are built — research for the DataMind360 dataset catalogue

Research done 30 September – 1 October 2026, before designing a marketplace that lists finished
datasets next to DataMind360's existing commissioned-collection (RFP) business. It is research, not a
design: it informs the decisions and leaves the business choices to you.

**Start with [`decisions.md`](decisions.md)** — 21 design decisions, each with what the market does,
who does it, what went wrong for whom, and what DataMind360's own setup rules out. This page is the
summary.

## What was studied

- **A census of 144 platforms** (`census.csv`) and **168 dated market events** (`events.csv`).
- **41 platform profiles** (`profiles/`), 14 in depth: AI-training-data catalogues, licensing brokers,
  stock libraries selling to AI labs, phone-crowd capture businesses, physical-AI and egocentric-video
  vendors, two cloud exchanges, priced research catalogues, government portals, and six failures.
- **24 contracts read clause by clause** (`documents/`): buyer licences, provider and contributor
  agreements, fee schedules and marketplace terms.
- Everything rests on **4,957 sourced claims** in `ledger/`, each with the exact words on the page
  it came from. Comparisons are in `matrix.csv`, every published number in `facts.csv`, every source in
  `sources.md`.

## The findings that matter most

1. **Nobody shows buyers consent evidence.** 3 of 41 platforms give buyers anything about consent
   from the people in the footage; 19 only assert it; 11 do not address it. In the contracts, consent
   is a one-line warranty pushed onto whoever uploaded the file. DataMind360 runs the capture, the
   task, the QA gates and the worker, so it is the only kind of operator that could show the evidence —
   once it actually stores consent, which today it does not.

2. **These are sales-led businesses.** 23 of 41 close every deal through a salesperson, 9 sell some
   things self-serve and quote the rest, one is a pure shop. Image and video with people in it is
   quoted almost everywhere.

3. **The operator is usually the licensor** (27 of 41), giving the buyer one licence, one warranty
   and one indemnity. The venues that only host listings are the cloud exchanges and lead-generation
   sites, and they charge commissions of 1.5–30%.

4. **Relisting work a client paid for is the riskiest supply.** Nobody publishes how they carve resale
   out of commissioned work, and every after-the-fact terms change found drew litigation or press
   (Shutterstock, Wirestock, Kled, PIXTA; Everalbum had its models ordered destroyed). DataMind360
   has already told clients and workers their data serves one order.

5. **Nobody solves erasure after a sale.** No contract read lets a person's withdrawal reach specific
   copies a buyer already holds. DataMind360's blueprint already promises it.

6. **Catalogue and custom go together** (30 of 41), and the catalogue mostly feeds the custom side —
   which DataMind360 already has in its RFP flow. This is the best structural fit in the study.

7. **Demand is real but lumpy and vendor-reported.** Robotics and first-person video is the active
   pocket in 2026; Shutterstock's data revenue fell 26% in the first half; Defined.ai cut about 30% of
   staff in July after a reported fall in data sales.

8. **Paying capture workers a share of each resale is rare** (4 of 41 could be confirmed). Most pay
   once per accepted clip. Contributor terms at the closest phone-capture analogues (Kled, Poseidon,
   Luel) carry uncapped contributor indemnities against a USD 100 cap for the operator.

## What it means for DataMind360, in one paragraph

The platform's advantage is evidence: it knows who captured each file, on which task, with what
checks, and whether a person was in frame. Turning that into a catalogue needs four things the
codebase does not have yet — a dataset and version model that is not tied to a contract, consent
records stored on the server, a way to copy data out of clients' buckets with their permission, and a
licence written for AI training with erasure that reaches buyers. The custom side already exists. The
biggest unknowns are commercial, not technical: whether buyers will pay for off-the-shelf photo and
video at a price that covers capture, and how an Indian company collects and pays out across borders.

## Not covered, and why

- **Payments, tax and cross-border rules for an Indian operator** (GST, TDS, merchant of record,
  collecting from foreign buyers). Needs a CA and a payments provider, not desk research.
- **Indian and foreign law in depth** (DPDP, GDPR, biometric laws, copyright). The planned theme
  chapters were not run. Not legal advice; counsel is needed before anything with people in it ships.
- **Why buyers choose off-the-shelf over custom, and what they pay.** Vendor-reported only. Five to
  ten buyer interviews would settle more than further desk research.
- **New entrants since mid-2026.** Web search ran out partway through, and the run continued by
  navigating from known sites (your decision). Platforms nobody linked to were not found.

## How much to trust it

Every quote was checked against its page by a script, not by a model (`tools/quotecheck.py`): **4,831
of the 4,882 quotes that could be checked were found word for word on their page (99%)**; another 404
could not be checked because the site blocks scripts or the PDF would not parse. Of the 51 not found,
the report relies on two, and says so where it does. A second
agent then tried to confirm each profile's key facts **without seeing its sources**: of about 780
checks, 122 were confirmed by an independent source, 76 only by sources repeating the vendor, 396 are
facts that by nature exist only on the vendor's own site (a clause in its licence, a price on its page),
175 could not be checked, 7 were corrected and 4 disputed; none were refuted. 48 quotes were found not
to support their exact claim and are flagged in the profiles. Most numbers about traction and demand
are vendor-stated and labelled as such. Full method, preflight results and every limitation:
[`METHOD.md`](METHOD.md).

## The prototype

A clickable prototype built on these findings — public catalogue, dataset page, quote and licence,
licensed datasets with a withdrawal notice, listing a dataset, and operations review:
https://claude.ai/artifact/9vG7GQ1Bzgt4SkdLp1MNG3 (private until shared from its Share menu).

## Files

```
README.md        this summary
decisions.md     the 21 decisions — start here
METHOD.md        how it was done, what it could not reach
census.csv       144 platforms; why each was profiled, kept as context, or cut
events.csv       168 dated events, 2019–2026
matrix.csv       41 platforms x 18 design decisions, a claim id behind every cell
facts.csv        every sourced number, with its basis
gaps.md          which questions each segment could not answer
profiles/        one page per platform, rendered from the ledger
documents/       the 24 contracts: clause table (terms.csv) and index
sources.md       every URL cited, with retrieval dates
ledger/          the claims themselves (the source of truth)
tools/           the scripts that validate, check, render and summarise the ledger
```
