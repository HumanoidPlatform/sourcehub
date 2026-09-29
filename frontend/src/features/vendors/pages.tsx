// vendors — the directory of delivery partners, and one partner's page.
//
// A client could only ever see the partners it had already dealt with: the
// ones that bid on its RFPs. This is where it looks BEFORE that — who is on
// the platform, what each of them does, and how their finished work was
// received — so that a first RFP is written with a supplier in mind.
//
// What a vendor's figures are made of is other clients' contracts, which this
// client may not read. They arrive as numbers only (partner_performance,
// db/260), and the same numbers are shown beside a bid and on a profile.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { get } from "@api/client";
import type { Contract, RatingRow, Vendor } from "@api/types";
import {
  Button, Callout, DataTable, Dl, Empty, inputCls, Meter, Panel, Pill, selectCls, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { PRODUCT } from "@shared/brand";
import { fmtDate, money } from "@shared/format";
import { OrgLogo } from "@shared/org-logo";
import { formatAddress } from "@shared/org-profile-form";
import { contractStatus, statusMeta } from "@shared/status";
import {
  applyFilters, chipsOf, cleared, countLine, isFiltered, MIN_RATINGS, readFilters, SORTS,
  writeFilters, type SortKey, type VendorFilters,
} from "./filters";
import { useVendor, useVendors } from "./hooks";
import {
  Figure, isNew, placeLine, projectsLine, Rating, Tags, VendorCard, WebsiteLink, yearsLine,
} from "./parts";
import {
  EXPERTISE_KEYS, EXPERTISE_LABEL, expertiseLabel, optionsOf, type ExpertiseKey,
} from "@shared/expertise";

/* --- cards or table, remembered -------------------------------------------- */

type Layout = "cards" | "table";
const LAYOUT_KEY = "sourcehub.vendors.layout";

function useLayout(): [Layout, (next: Layout) => void] {
  const [layout, setLayout] = useState<Layout>(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });
  const choose = (next: Layout) => {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* a private window: the choice lasts the visit */
    }
  };
  return [layout, choose];
}

/* --- the filter bar ----------------------------------------------------------- */

// Which way round the facets read in the bar: what, for whom, where.
const FACETS: readonly ExpertiseKey[] = ["data_types", "domains", "regions", "languages", "certifications"];

const FACET_NAME: Record<ExpertiseKey, string> = {
  data_types: "Data type",
  domains: "Domain",
  regions: "Region",
  languages: "Language",
  certifications: "Certification",
};

/** One list to narrow by. Choosing a value adds it; what is already chosen
 *  leaves the list and appears as a chip below, where it can be removed. */
function Facet({
  list,
  chosen,
  onAdd,
}: {
  list: ExpertiseKey;
  chosen: readonly string[];
  onAdd: (value: string) => void;
}) {
  const left = optionsOf(list).filter((o) => !chosen.includes(o.value));
  return (
    <select
      className={selectCls}
      aria-label={`Filter by ${FACET_NAME[list].toLowerCase()}`}
      // Always the placeholder: the select is a way to ADD, and the chips are
      // what say which values are in force.
      value=""
      disabled={left.length === 0}
      onChange={(e) => e.target.value && onAdd(e.target.value)}
    >
      <option value="">
        {FACET_NAME[list]}
        {chosen.length ? ` (${chosen.length})` : ""}
      </option>
      {left.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function FilterBar({
  filters,
  onChange,
  shown,
  total,
}: {
  filters: VendorFilters;
  onChange: (next: VendorFilters) => void;
  shown: number;
  total: number;
}) {
  // The box keeps what was typed, spaces and all; the URL keeps it trimmed.
  // Driven from the URL alone, a trailing space would vanish as it was typed
  // and no second word could ever be entered.
  const [typed, setTyped] = useState(filters.q);
  useEffect(() => {
    setTyped((t) => (t.trim() === filters.q ? t : filters.q));
  }, [filters.q]);

  const chips = chipsOf(filters);
  const filtered = isFiltered(filters);

  return (
    <section className="vfilters" aria-label="Filter vendors">
      <div className="vfilters-row">
        <input
          className={inputCls + " vfilters-search"}
          type="search"
          aria-label="Search vendors"
          placeholder="Search by name, place or what they do…"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            onChange({ ...filters, q: e.target.value.trim() });
          }}
        />
        {FACETS.map((list) => (
          <Facet
            key={list}
            list={list}
            chosen={filters[list]}
            onAdd={(value) => onChange({ ...filters, [list]: [...filters[list], value] })}
          />
        ))}
        <select
          className={selectCls}
          aria-label="Minimum rating"
          value={String(filters.min_rating)}
          onChange={(e) => onChange({ ...filters, min_rating: Number(e.target.value) })}
        >
          {MIN_RATINGS.map((r) => <option key={r.value} value={String(r.value)}>{r.label}</option>)}
        </select>
      </div>

      <div className="vfilters-active">
        {/* In the DOM from the start, so the count is announced as it changes. */}
        <span className="vfilters-count" role="status">{countLine(shown, total, filtered)}</span>
        {chips.map((c) => (
          <span className="chip" key={c.id}>
            {c.label}
            <button
              type="button"
              className="chip-x"
              aria-label={`Remove filter ${c.label}`}
              onClick={() => onChange(c.without)}
            >
              ×
            </button>
          </span>
        ))}
        {filtered && (
          <Button size="sm" variant="quiet" onClick={() => onChange(cleared(filters))}>Clear all</Button>
        )}
        <label className="vfilters-sort">
          <span className="muted small">Sort</span>
          <select
            className={selectCls}
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}

/* --- loading: the shape of what is coming ------------------------------------- */

function CardSkeletons() {
  return (
    <div className="vgrid" role="status" aria-label="Loading vendors">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="vcard" aria-hidden="true">
          <div className="vcard-head">
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 6 }} />
            <div className="vcard-title" style={{ gap: 8 }}>
              <div className="skeleton" style={{ height: 14, width: "70%" }} />
              <div className="skeleton" style={{ height: 11, width: "45%" }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 12 }} />
          <div className="skeleton" style={{ height: 12, width: "80%" }} />
          <div className="skeleton" style={{ height: 34 }} />
        </div>
      ))}
    </div>
  );
}

/* --- the directory --------------------------------------------------------------- */

const pct = (v: number | null) => (v == null ? "—" : `${v}%`);

function VendorTable({ rows, back }: { rows: Vendor[]; back: string }) {
  const nav = useNavigate();
  const open = (v: Vendor) => nav(`/vendors/${v.id}`, { state: { back } });
  return (
    <Panel flush>
      <DataTable
        rows={rows}
        rowKey={(v) => v.id}
        rowProps={(v) => ({ className: "tap", onClick: () => open(v) })}
        columns={[
          {
            header: "Vendor",
            className: "cell-primary",
            sortBy: (v) => v.name,
            cell: (v) => (
              <>
                {/* the row is clickable; the link is what a keyboard reaches */}
                <Link to={`/vendors/${v.id}`} state={{ back }} onClick={(e) => e.stopPropagation()}>{v.name}</Link>
                <div className="cell-meta" style={{ fontWeight: 400 }}>{placeLine(v) || v.reference_code}</div>
              </>
            ),
          },
          {
            header: "Data types",
            cell: (v) => (
              <span className="vcard-tags"><Tags list="data_types" values={v.expertise.data_types} tone="accent" max={3} /></span>
            ),
          },
          {
            header: "Regions",
            sortBy: (v) => v.expertise.regions.length,
            cell: (v) => (
              <span className="vcard-tags"><Tags list="regions" values={v.expertise.regions} tone="outline" max={4} /></span>
            ),
          },
          {
            header: "Rating",
            sortBy: (v) => v.performance.rating_avg,
            cell: (v) => <Rating avg={v.performance.rating_avg} count={v.performance.rating_count} />,
          },
          { header: "On time", className: "num", sortBy: (v) => v.performance.on_time_pct, cell: (v) => pct(v.performance.on_time_pct) },
          {
            header: "Accepted first time",
            className: "num",
            sortBy: (v) => v.performance.accepted_first_time_pct,
            cell: (v) => pct(v.performance.accepted_first_time_pct),
          },
          {
            header: "Projects",
            className: "num",
            sortBy: (v) => v.performance.contracts_completed,
            cell: (v) => (isNew(v.performance) ? <span className="vbadge" data-tone="new">New</span> : v.performance.contracts_completed),
          },
          {
            header: "Years",
            className: "num",
            sortBy: (v) => v.years_in_business,
            cell: (v) => v.years_in_business ?? "—",
          },
        ]}
      />
    </Panel>
  );
}

export function VendorsPage() {
  const [params, setParams] = useSearchParams();
  // Keyed on the string: useSearchParams hands back a new object every render.
  const search = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(search)), [search]);
  const vendors = useVendors();
  const [layout, setLayout] = useLayout();

  const all = vendors.data ?? [];
  const shown = useMemo(() => applyFilters(all, filters), [all, filters]);
  // replace, not push: ten clicks on filters must not be ten presses of Back
  const change = (next: VendorFilters) => setParams(writeFilters(next), { replace: true });
  // what a vendor's page is given, so its way back is to THIS directory
  const back = search ? `/vendors?${search}` : "/vendors";

  return (
    <View
      title="Vendors"
      sub={`Delivery partners on ${PRODUCT}: what each one does, and how its finished work was received.`}
      actions={
        <div className="seg" role="group" aria-label="Layout">
          {(["cards", "table"] as const).map((l) => (
            <button
              key={l}
              type="button"
              className="seg-btn"
              aria-pressed={layout === l}
              onClick={() => setLayout(l)}
            >
              {l === "cards" ? "Cards" : "Table"}
            </button>
          ))}
        </div>
      }
    >
      {vendors.isError ? (
        <Callout tone="critical" title="Could not load the vendors">
          {vendors.error instanceof Error ? vendors.error.message : "The request failed."}
        </Callout>
      ) : (
        <>
          <FilterBar filters={filters} onChange={change} shown={shown.length} total={all.length} />
          {vendors.isLoading ? (
            <CardSkeletons />
          ) : all.length === 0 ? (
            <Panel>
              <Empty
                title="No vendors yet"
                hint={`Delivery partners appear here as soon as they join ${PRODUCT}.`}
              />
            </Panel>
          ) : shown.length === 0 ? (
            <Panel>
              <Empty
                title="No vendor matches all of that"
                hint="A vendor has to cover everything you chose. Remove a filter to widen the search."
                action={<Button onClick={() => change(cleared(filters))}>Clear filters</Button>}
              />
            </Panel>
          ) : layout === "table" ? (
            <VendorTable rows={shown} back={back} />
          ) : (
            <div className="vgrid">
              {/* the link carries where it was opened from, so the vendor page
                  leads back to this directory, filters and all */}
              {shown.map((v) => <VendorCard key={v.id} v={v} to={`/vendors/${v.id}`} state={{ back }} />)}
            </div>
          )}
        </>
      )}
    </View>
  );
}

/* --- one vendor -------------------------------------------------------------------- */

function Distribution({ rows, total }: { rows: { score: number; count: number }[]; total: number }) {
  if (!total) return null;
  return (
    <ul className="vdist" aria-label="How clients scored this vendor">
      {rows.map((r) => (
        <li key={r.score}>
          <span className="num">{r.score} ★</span>
          <Meter pct={Math.round((r.count / total) * 100)} />
          <span className="num muted">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

function ExpertisePanel({ v }: { v: Vendor }) {
  const lists = EXPERTISE_KEYS.filter((k) => v.expertise[k].length > 0);
  const other = v.expertise.other_certifications;
  return (
    <Panel title="Expertise" sub="What this partner says it can deliver.">
      {lists.length === 0 && !other ? (
        <p className="muted small">This partner has not listed its expertise yet.</p>
      ) : (
        <div className="vexpertise">
          {lists.map((k) => (
            <div key={k} className="vexpertise-row">
              <h3 className="eyebrow">{EXPERTISE_LABEL[k]}</h3>
              <div className="vcard-tags">
                {v.expertise[k].map((value) => (
                  <span
                    key={value}
                    className="vtag"
                    data-tone={k === "data_types" ? "accent" : k === "certifications" ? "outline" : undefined}
                  >
                    {expertiseLabel(k, value)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {other && (
            <div className="vexpertise-row">
              <h3 className="eyebrow">Other certifications</h3>
              <span className="small">{other}</span>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function PerformancePanel({ v }: { v: Vendor }) {
  const p = v.performance;
  if (isNew(p)) {
    return (
      <Panel title="Performance">
        <Callout tone="neutral" title={`New on ${PRODUCT}`}>
          {v.name} has not completed a project here yet, so there is no record to show. Its expertise
          and company details are its own account of itself.
        </Callout>
      </Panel>
    );
  }
  return (
    <Panel
      title="Performance"
      sub={`Calculated from ${projectsLine(p).replace(" here", "")} completed on ${PRODUCT}. Nobody enters these figures.`}
    >
      <div className="g4 vperf">
        <div className="metric">
          <div className="eyebrow">Client rating</div>
          <Rating avg={p.rating_avg} count={p.rating_count} size="lg" />
          <Distribution rows={p.rating_distribution ?? []} total={p.rating_count} />
        </div>
        <div className="metric">
          <Figure label="On time" pct={p.on_time_pct} />
          <div className="foot">Completed contracts delivered on or before the date the client asked for.</div>
        </div>
        <div className="metric">
          <Figure label="Accepted first time" pct={p.accepted_first_time_pct} />
          <div className="foot">Completed contracts the client approved without sending the delivery back.</div>
        </div>
        <div className="metric">
          <Figure label="QA pass at its own gate" pct={p.qa_pass_pct} />
          <div className="foot">What the partner passed when reviewing its own suppliers. Its own verdict, not a client's.</div>
        </div>
      </div>
    </Panel>
  );
}

/** The client's own history with this vendor, read under the client's own
 *  policies: its contracts and what it scored them. Nobody else's. */
function OurWork({ v }: { v: Vendor }) {
  const contracts = useQuery({ queryKey: ["contracts"], queryFn: () => get<Contract[]>("/contracts") });
  const ratings = useQuery({ queryKey: ["ratings"], queryFn: () => get<RatingRow[]>("/network/ratings") });
  const mine = (contracts.data ?? []).filter((c) => c.partner_org_id === v.id);
  const scoreOf = (contractId: string) =>
    (ratings.data ?? []).find((r) => r.contract_id === contractId && r.to_name === v.name)?.score;

  return (
    <Panel title="Your work with this vendor" sub="Only your own contracts. Other clients' work is never shown.">
      {contracts.isLoading ? (
        <p className="muted small">Loading…</p>
      ) : contracts.isError ? (
        <Callout tone="critical" title="Could not load your contracts" />
      ) : mine.length === 0 ? (
        <p className="muted small">You have not worked with {v.name} yet.</p>
      ) : (
        <ul className="vwork">
          {mine.map((c) => {
            const m = statusMeta(contractStatus, c.status);
            const score = scoreOf(c.id);
            return (
              <li key={c.id}>
                <Link to={`/deliveries/${c.id}`} className="cell-primary">{c.title ?? c.reference_code}</Link>
                <span className="cell-meta">
                  <span className="id">{c.reference_code}</span>
                  <Pill tone={m.tone}>{m.label}</Pill>
                  <span className="num">{money(c.value, c.currency)}</span>
                  {c.completed_at && <span>Completed {fmtDate(c.completed_at)}</span>}
                  {score != null && <span className="num">You rated it ★ {score}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function VendorDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const location = useLocation();
  const vendor = useVendor(id);

  const own = !!id && session.org_id === id;
  const isClient = session.org_kind === "client";
  const back = (location.state as { back?: string } | null)?.back;
  // A partner cannot list the directory, only open its own page in it.
  const backLink = own && !isClient
    ? <Link className="btn" to="/organisation">Back to your profile</Link>
    : <Link className="btn" to={back?.startsWith("/vendors") ? back : "/vendors"}>Back to vendors</Link>;

  if (vendor.isLoading) {
    return (
      <View title="Vendor" actions={backLink}>
        <Panel>
          <div className="col" role="status" aria-label="Loading the vendor">
            {[100, 60, 100, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 14, width: `${w}%` }} />)}
          </div>
        </Panel>
      </View>
    );
  }
  const v = vendor.data;
  if (vendor.isError || !v) {
    return (
      <View title="Vendor" actions={backLink}>
        <Panel>
          <Callout tone="critical" title="This vendor is not available">
            It may have left the directory, or the link may be wrong. The directory lists every
            delivery partner that is active on {PRODUCT}.
          </Callout>
        </Panel>
      </View>
    );
  }

  const where = placeLine(v);
  const years = yearsLine(v.years_in_business);
  return (
    <View title={v.name} actions={backLink}>
      {own && (
        <Callout tone="neutral" title="This is your page, as clients see it">
          Clients browsing the vendors directory see exactly this. Update it from your{" "}
          <Link to="/organisation">organisation profile</Link>.
        </Callout>
      )}

      <Panel>
        <div className="vhero">
          <OrgLogo orgId={v.id} version={v.logo_version} name={v.name} size={72} />
          <div className="vhero-body">
            <div className="vhero-line">
              <span className="id">{v.reference_code}</span>
              {v.fair_work_attested && <span className="vbadge">Fair work attested</span>}
              {isNew(v.performance) && <span className="vbadge" data-tone="new">New on {PRODUCT}</span>}
            </div>
            <div className="vcard-meta">
              {where && <span>{where}</span>}
              {v.website && <WebsiteLink url={v.website} />}
              {v.partner_since && <span>On {PRODUCT} since {fmtDate(v.partner_since)}</span>}
              {years && <span>{years}</span>}
            </div>
            {!isNew(v.performance) && (
              <div className="vhero-line">
                <Rating avg={v.performance.rating_avg} count={v.performance.rating_count} />
                <span className="muted small">{projectsLine(v.performance)}</span>
              </div>
            )}
          </div>
        </div>
        <h2 className="eyebrow formsection">About</h2>
        <p className="vabout">
          {v.description?.trim() || <span className="muted">This partner has not added a description yet.</span>}
        </p>
      </Panel>

      <ExpertisePanel v={v} />
      <PerformancePanel v={v} />

      <Panel title="Company">
        <Dl
          rows={[
            ["Headquarters", v.hq ?? "—"],
            ["Country", v.country ?? "—"],
            ["Company size", v.company_size ? `${v.company_size} people` : "—"],
            ["Founded", v.founded_year ?? "—"],
            ["Registered address", formatAddress(v.registered_address) || "—"],
            ["Website", v.website ? <WebsiteLink url={v.website} /> : "—"],
          ]}
        />
      </Panel>

      {isClient && <OurWork v={v} />}
    </View>
  );
}
