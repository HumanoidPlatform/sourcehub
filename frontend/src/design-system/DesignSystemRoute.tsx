// The design system as a live route, generated from real code — the same
// primitives every screen uses, so it cannot drift into a stale style guide.

import { Button, Callout, Dl, Empty, fillDays, Meter, Metric, Panel, Pill, RowMenu, StageRail, TimeBars, View } from "@ds/primitives";
import { LIFECYCLE, requestStatus, statusMeta, taskStatus } from "@shared/status";

const TONES = ["neutral", "active", "attention", "success", "critical"] as const;

// Shaped like real capture data — a few busy days and a lot of quiet ones —
// so the gallery shows what the component actually has to cope with.
const DEMO_SERIES = [
  { day: "2026-09-04", count: 12 },
  { day: "2026-09-05", count: 31 },
  { day: "2026-09-11", count: 4 },
  { day: "2026-09-15", count: 52 },
  { day: "2026-09-16", count: 3 },
  { day: "2026-09-17", count: 29 },
];

export function DesignSystemRoute() {
  return (
    <View title="Design system" sub="Rendered from the live primitives. Tokens are ported unchanged from the prototype; where this page and it disagree, the prototype wins.">
      <Panel title="Status taxonomy" sub="Five tones; the VALUES are per-entity — 'submitted' means different things on a proposal and a task, so there is one map per table.">
        <div className="btnrow">
          {TONES.map((t) => <Pill key={t} tone={t}>{t}</Pill>)}
        </div>
        <div className="btnrow" style={{ marginTop: 10 }}>
          {Object.keys(requestStatus).map((s) => {
            const m = statusMeta(requestStatus, s);
            return <Pill key={s} tone={m.tone}>{m.label}</Pill>;
          })}
        </div>
        <div className="btnrow" style={{ marginTop: 6 }}>
          {Object.keys(taskStatus).map((s) => {
            const m = statusMeta(taskStatus, s);
            return <Pill key={s} tone={m.tone}>{m.label}</Pill>;
          })}
        </div>
      </Panel>

      <Panel title="Buttons">
        <div className="btnrow">
          <Button>Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="quiet">Quiet</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Panel>

      <div className="g3">
        <Metric label="Metric" value="82%" sub="with a subtitle" />
        <Metric label="Toned metric" value={3} tone="attention" foot="a tone always comes with words" />
        <Panel title="Meter"><Meter pct={64} /><div style={{ height: 8 }} /><Meter pct={100} tone="success" /></Panel>
      </div>

      <div className="g2">
        <Panel title="Callout"><Callout tone="attention" title="Waiting on a human decision">The attention tone means exactly this.</Callout></Panel>
        <Panel title="Bars" sub="Daily counts. The only chart in the product; percentage heights, so it reflows with its column and never measures a pixel.">
          <TimeBars data={fillDays(DEMO_SERIES, 21, new Date("2026-09-20T00:00:00Z"))} unit="captures" />
        </Panel>
      </div>

      <Panel title="Row menu" sub="For table rows with more than one or two actions. Positioned fixed, so it escapes the scroll clipping of .tablewrap.">
        <div className="rowactions">
          <RowMenu
            label="Example row actions"
            items={[
              { label: "View details", onSelect: () => {} },
              { label: "Withdraw", tone: "danger", onSelect: () => {} },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Lifecycle rail">
        <StageRail stages={LIFECYCLE} current="in_progress" />
      </Panel>

      <div className="g2">
        <Panel title="Definition list">
          <Dl rows={[["Format", "JPEG, minimum 12MP"], ["Quantity", "25,000 images"], ["Budget", "$60,000 – $85,000"]]} />
        </Panel>
        <Panel title="Empty state"><Empty title="Nothing here yet" hint="Empty states always say what will fill them." /></Panel>
      </div>
    </View>
  );
}
