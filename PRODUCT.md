# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The web console (`frontend/`). The crowd workers' phone app has its own record in `mobile/PRODUCT.md`.

## Users

Every role gets a workspace designed around its own job; none is subordinate to another (confirmed 16 Oct 2026).

- **Clients**: organisations that need real-world data, such as retail analytics, autonomous driving and AI teams. They publish RFPs, compare proposals, award contracts, review deliveries, approve them and pay invoices. They also browse and buy ready datasets on DataHub.
- **Delivery partners**: they answer RFPs, run the contracts they win, split the work into tasks for their network, review that work at partner QA, deliver to the client and raise invoices. They also list and sell datasets on DataHub.
- **Aggregators and business partners** (suppliers in a partner's network): aggregators run crowds of workers. They assign or offer tasks, review the crowd's batches at aggregator review, and submit the accepted work to the partner.
- **Device sponsors**: they lend capture equipment to the network. Each device carries what a borrower needs to choose it: make, model, where it is kept, labelled details, photos and documentation.
- **Operations (Cosarathi)**: the platform team. They run onboarding, accounts, billing oversight, DataHub listing review, the activity log and the mail log.
- **Crowd workers**: they capture on the phone app (see `mobile/PRODUCT.md`); the web console only shows them their assignments.

## Product Purpose

DataMind360 is a marketplace for real-world data: imagery, video, sensor readings and people-based field work. Clients who need data meet delivery partners who fulfil it through their own networks of crowd aggregators, vendor businesses and equipment sponsors. Every capture passes on-device checks, aggregator review and partner QA before a client sees it, and money follows accepted work through partner-raised invoices.

How success is measured has not been confirmed with the product owner (open).

## Positioning

Custom capture through RFPs and ready datasets from DataHub, in one place (confirmed 16 Oct 2026). A client commissions exactly the data it needs from competing delivery partners, or buys an existing dataset, with the same partners, terms, QA trail and invoicing.

## Operating Context

- Custom work: RFP draft → publish (every active delivery partner is notified) → proposals until bidding closes → award (the other proposals are declined) → contract → tasks for suppliers → crowd capture on phones → aggregator review → partner QA → delivery → client approval → partner invoices → payment recorded.
- Ready data: DataHub listings submitted for review by Ops, a public page per listing, quotes and deals between buyer and seller, deal invoices.
- Everyone except crowd workers accepts the Onboarding Terms & Conditions before using the platform, and acceptance is recorded as evidence.
- Every platform e-mail goes through a mail log that Ops can watch and re-send from.
- Tenancy is per organisation, enforced in the database; one organisation never sees another's data unless a contract or deal joins them.
- The interface is in English.

## Capabilities and Constraints

- Roles and capabilities are seeded per organisation kind: client, tenant (shown as "Delivery partner"), aggregator, business, sponsor, platform, worker.
- `docs/sourcehub-app.html`, the clickable prototype, is declared normative for state machines and design tokens. `frontend/src/design-system/tokens.css` and `components.css` were ported from it unchanged. A durable visual change is made in both places, or the divergence is recorded.
- Terminology decided on 16 Oct 2026, for user-visible text only (codes, routes, API fields and stored values keep their names):
  - Gate 1 is shown as "Aggregator review"; Gate 2 as "Partner QA".
  - Organisation kinds are shown by plain labels: tenant is "Delivery partner".
  - Audit event types are shown as plain phrases, never as raw codes.
  - Responses / Proposals / Bids keep their current wording (by request).
- Open: the Terms & Conditions text (version 1.0) still holds placeholders that Legal must fill before production.

## Brand Commitments

None declared binding in the interview. Existing assets in use:
- the DataMind360 logo, in `frontend/public/brand/`: `logo-on-light.svg`, `logo-on-dark.svg`, `email-logo.png`;
- the "by Cosarathi" byline;
- the DataMind360 blue `#091CFF`, from the UX team's ramp of 30 Sep 2026.

## Evidence on Hand

Seeded demo organisations and dev data only, such as Acme Retail Analytics, NorthStar Delivery Partners and Bengaluru Crowd Collective. There are no public customers, testimonials, benchmarks or published prices. Future work must not invent any.

## Product Principles

1. **Each role, its own workspace.** A screen is shaped by the job of the role that opens it, not by a shared template.
2. **One place for custom and ready data.** RFPs and DataHub share partners, terms, trail and money, and the interface makes that continuity visible.
3. **Always clear whose move it is.** Every record says who must act next, and the same rule applies everywhere it is shown.
4. **Plain words over internal terms.** Users read the language of their own work, never the system's codes.
5. **Accessible by default.** Meeting WCAG 2.2 AA is part of done, not a later pass.

## Accessibility & Inclusion

WCAG 2.2 AA for every screen and state (confirmed 16 Oct 2026): contrast, keyboard operation and visible focus, screen-reader names and states, target sizes, reflow and text scaling.
