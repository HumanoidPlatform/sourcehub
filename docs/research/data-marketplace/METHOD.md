# Method, and what it could not do

How this research was produced, so a reader can judge how far to trust it. The plan it follows was
approved on 2026-09-30.

## The unit of evidence

Every statement in the report traces to a **claim** in `ledger/` — one sentence, one fact, with the URL
it came from and a verbatim quote of at most 125 characters. `tools/LEDGER.md` is the contract the
researching agents worked to; `tools/vocab.json` holds every allowed value.

Three checks stand between a claim and the report:

1. **Mechanical.** `tools/quotecheck.py` fetches each cited URL raw and string-matches the quote. No
   model is involved. The agents read pages through a summarising fetcher, so a second agent re-reading
   the same page would inherit the same distortion; a byte comparison does not.
2. **Blind re-derivation.** For every number, every platform status and the claims behind the main
   matrix cells, a second agent is given the statement *without* its sources and must find support on a
   different domain and of a different source class. Its verdicts are appended in
   `ledger/<slug>.verify.json`; the profile is never edited.
3. **Scope.** The same agent then reads each quote against its statement: right product, tier, region,
   date?

`unverifiable` is a legitimate verdict. Much of what is known about private data vendors exists only
on their own sites, and the report says so where that is the case rather than implying corroboration.

## Selection criteria — written before the census ran

About sixty candidates, two depths. These rules were fixed first so the cut could not be fitted to
what turned out to be easy to research.

A platform earns a **deep** teardown (about 14) when it meets at least three of:

- it sells or licenses image or video datasets off the shelf, not only a collection service;
- its supply matches one of the three models DataMind360 intends — commissioned work resold, its own
  speculative collection, or third-party providers — with human capturers or contributors in the chain;
- it publishes primary documents: terms, a contributor or provider agreement, prices or licence tiers;
- it offers a mechanism that transfers to a specific design decision (sharing data in place from the
  owner's storage, an object model for revisions and entitlements, gated access).

Quotas, against the pull of easy evidence: at least 7 of the 14 deep slots go to AI-training-data
catalogues, priced catalogues, licensing marketplaces, stock media and crowd-capture businesses; at
most 2 to cloud exchanges; at least 5 profiles of any depth are failures or withdrawals.

Everything else is **light** (a matrix row and the twelve questions) or **cut**, and `census.csv`
records which, with one of these reasons: `services_only` · `no_public_evidence` · `duplicate_alias` ·
`no_transferable_mechanism` · `defunct_no_live_sources` · `superseded`.

## Preflight, 2026-09-30 — what the tools can and cannot reach

| check | result | consequence |
|---|---|---|
| Web search | refused at first (session budget spent); working again after a change of account | the full method runs as planned |
| Wayback Machine | the fetcher refuses `web.archive.org` | defunct platforms are researched from what is still live — retirement notices, filings, press, papers. No archived pages are cited anywhere. |
| PDF | the fetcher cannot read PDF text but saves the file | agents open the saved file directly; the quote checker parses PDFs itself |
| EUR-Lex | returns an empty page to both the fetcher and raw HTTP | EU legal text is cited from other official or faithful reproductions, and marked where that is so |
| Client-rendered pricing page (AWS) | readable; quote matched raw HTML exactly | — |
| Verbatim quotes | the fetcher will not return more than about 125 characters verbatim | quotes are capped at 125 characters |

## Stage log

| stage | date | agents | result |
|---|---|---|---|
| 0 Tooling and preflight | 2026-09-30 | — | done; see above |
| 1 Pilot, first attempt | 2026-09-30 | 3 | lost: the account's access was revoked mid-run and no agent had saved anything. Agents now save their file early and after every few claims. |
| 1 Pilot | 2026-09-30 | 6 | Defined.ai, AWS Data Exchange, LAION-5B: 350 claims; **308 of 309 checkable quotes found word for word** on their pages. Verifiers found a 30% staff cut the profile missed, a regional fee stated as flat, and two quotes that did not support their statements. Ten quotes carried garbled characters that the string match had tolerated; repaired, and the validator now rejects them. |
| 2 Census | 2026-10-01 | 10 | 236 rows, merged to **144 platforms** and **168 dated events** (`census.csv`, `events.csv`). Selected 14 deep and 27 light under the rules above; 79 kept as context, 24 cut, each with a reason. **Web search ran out partway through** (a 200-per-session cap on the new account too): four scouts (failures, video, the open sweep, recent events) ran with no search and could only confirm names already known, so discovery of recent entrants is incomplete there. |
| — Decision | 2026-10-01 | — | **The owner chose to write the report from the evidence collected** rather than run the planned theme chapters, skeptics, gap critics and report auditors (about 40 more agents). Consequences: no dedicated chapters on Indian payments and tax, regulation, or demand; the report audit was done by the orchestrator instead (below). |
| — Quote check | 2026-10-01 | — | All 5,286 quotes in the ledger: **4,831 of 4,882 checkable found on their page (99.0%)** — 4,742 exact, 53 only in the page's embedded data, 13 matching once PDF spacing is ignored, 23 fuzzy. 51 not found, mostly on pages that change (homepages, JSON listings, blog posts rendered in the browser). 404 could not be checked: 386 fetches refused (mostly HTTP 403 to scripts), 16 unparseable PDFs, 2 browser-only pages. A first run reported far more misses on Japanese and Korean pages; that was a bug in the checker (its normaliser dropped all non-Latin characters), fixed before the figures above. |
| 7 Report | 2026-10-01 | — | `decisions.md` and `README.md` written from the ledger. **Citation audit:** a script confirmed every platform-attributed citation resolves to a real claim (108 of 108); the orchestrator then read the statement behind each one and found **8 that pointed at a real claim from the right platform but not the one supporting the sentence** (e.g. Getty "non-exclusive" cited for "bans AI training"), plus 3 imprecise wordings from a spot check; all 11 corrected. 39 citations name the platform only in the surrounding sentence and were not individually re-read. |
| — Decision | 2026-10-01 | — | **The owner chose to continue without web search.** From here agents discover by navigation only: vendor sites and their sitemaps, links inside fetched pages, and the own search of primary-source repositories (SEC EDGAR, CourtListener, regulators, arXiv). General search engines and news aggregators are not used by any route. Consequence: blind verification can reach filings, court records and linked press, but not unlinked independent reporting, so more verdicts will be `vendor_only` or `unverifiable` than in the pilot; and post-mid-2026 entrants not already found by the census stay missing. |
| 3 Profiles | 2026-10-01 | 76 | 38 platforms (12 deep, 26 light), each profiled then verified; with the pilot, **41 profiles**. 73 of 76 agents completed; 3 stalled, but all 38 profiles had already been saved — only vAIsual's verification is missing. 105 of 105 ledger files validate; 1,014 source URLs. |
| 4 Primary documents | 2026-10-01 | 24 | 23 buyer licences, provider and contributor agreements, fee schedules and marketplace terms, plus one standard ML data licence (CDLA-Permissive 2.0), each read in full from the document's own text (`tools/pagetext.py`, not a summarising fetcher) into `documents/terms.csv`. All 24 completed. Statutes are left to the regulation chapters. |
| — Instruction fixes | 2026-09-30 | — | From the pilot agents' own feedback: a working PDF extractor (`tools/pdftext.py`); plain definitions for every matrix field; `links_only` custody and two versioning values; three source classes; `not_applicable` may rest on a stated reason; verdicts `confirmed_relayed`, `vendor_only` and `quote_incomplete`, so a wire story repeating a vendor no longer counts as independent confirmation; a scratch folder per agent. |
