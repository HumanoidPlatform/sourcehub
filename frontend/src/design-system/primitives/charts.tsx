// Charts. A deliberate new pattern rather than a port, in the same sense
// RowMenu is: the prototype has no chart anywhere, but it reserved
// --chart-grid in all three theme blocks, so the slot was left open on purpose.
//
// Built from elements with percentage heights, not SVG, for the same reason
// .meter is a div: this console has no ResizeObserver and no JS media queries,
// so a component that needs its own pixel width to draw would be the first
// thing here that breaks when .g-main collapses to one column at 1240px. A
// percentage height inside a flex row reflows on its own, and the labels stay
// real text at their real size instead of being scaled by a viewBox.
//
// Colour comes from tokens only, so both themes work with no rule of its own,
// and no value is carried by hue alone — every bar's number is in the
// accessible name, and the extremes are printed beside the chart.

const DAY_MS = 86_400_000;

export interface DayCount {
  day: string; // ISO date, "2026-09-15"
  count: number;
}

/**
 * Pad a sparse series out to one entry per day, oldest first.
 *
 * The API returns only days that have captures. Drawn as-is, three busy days
 * three weeks apart would sit side by side and read as three consecutive days
 * — the chart would be telling a lie about time. Missing days are zeros.
 */
export function fillDays(series: DayCount[], days: number, today = new Date()): DayCount[] {
  const have = new Map(series.map((d) => [d.day, d.count]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const out: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(end - i * DAY_MS).toISOString().slice(0, 10);
    out.push({ day: key, count: have.get(key) ?? 0 });
  }
  return out;
}

function shortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * One bar per day. `data` is expected to be dense — run it through fillDays.
 *
 * `unit` is the plural noun for the accessible name and the total: "captures".
 */
export function TimeBars({
  data,
  unit,
  total,
}: {
  data: DayCount[];
  unit: string;
  total?: number;
}) {
  // noUncheckedIndexedAccess: every index below is guarded or defaulted.
  const counts = data.map((d) => d.count);
  const peak = counts.length ? Math.max(...counts) : 0;
  const sum = total ?? counts.reduce((a, b) => a + b, 0);
  const first = data[0];
  const last = data[data.length - 1];
  const busiest = peak > 0 ? data.find((d) => d.count === peak) : undefined;

  const described =
    peak === 0
      ? `No ${unit} recorded in this period.`
      : `${sum} ${unit} over ${data.length} days. Busiest day ${shortDay(busiest!.day)} with ${peak}.`;

  return (
    <div className="bars">
      <div className="bars-scale">
        <span className="eyebrow">{peak > 0 ? `peak ${peak}` : "no data yet"}</span>
      </div>
      <div className="bars-plot" role="img" aria-label={described}>
        {data.map((d) => (
          <i
            key={d.day}
            data-empty={d.count === 0 ? "" : undefined}
            style={{ height: peak > 0 ? `${Math.max((100 * d.count) / peak, d.count > 0 ? 2 : 0)}%` : "0%" }}
          />
        ))}
      </div>
      <div className="bars-axis">
        <span>{first ? shortDay(first.day) : ""}</span>
        <span className="muted">{described}</span>
        <span>{last ? shortDay(last.day) : ""}</span>
      </div>
    </div>
  );
}
