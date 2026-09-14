// Generic, domain-free components over the prototype's class names.
//
// The build guide: "build the components as React components over the same
// class names" — so every className here exists verbatim in components.css,
// and a visual change is a CSS change in the prototype first.

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Tone } from "@shared/status";

/* --- buttons --------------------------------------------------------------- */

export function Button({
  variant,
  size,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "danger" | "quiet";
  size?: "sm";
}) {
  return <button type="button" className="btn" data-variant={variant} data-size={size} {...rest} />;
}

/* --- status pill ----------------------------------------------------------- */

export function Pill({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="pill" data-tone={tone === "neutral" ? undefined : tone}>
      {children}
    </span>
  );
}

/* --- panel ------------------------------------------------------------------ */

export function Panel({
  title,
  sub,
  actions,
  tabs,
  flush,
  children,
  foot,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  /** A [role="tablist"]. The prototype frames tabs as the panel head, which is
   *  where [role="tablist"]'s border-bottom and s-4 inset come from. */
  tabs?: ReactNode;
  /** Drop the body padding, for a table or a tabbed body that owns its own. */
  flush?: boolean;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <section className="panel">
      {title !== undefined && (
        <header className="panel-head">
          {/* .titles carries flex:1 — without the class the head needs a
              margin-left:auto hack on the actions to push them right. */}
          <div className="titles">
            <h2 style={{ margin: 0, fontSize: 14.5 }}>{title}</h2>
            {sub && <span className="sub">{sub}</span>}
          </div>
          {actions && <div className="btnrow">{actions}</div>}
        </header>
      )}
      {tabs}
      <div className={flush ? "panel-body flush" : "panel-body"}>{children}</div>
      {foot && <footer className="panel-foot">{foot}</footer>}
    </section>
  );
}

/* --- metric ----------------------------------------------------------------- */

export function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="metric">
      <div className="eyebrow">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="small muted">{sub}</div>}
    </div>
  );
}

/* --- form fields ------------------------------------------------------------ */

let fieldSeq = 0;

export function Field({
  label,
  required,
  hint,
  error,
  children,
  span,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: (id: string) => ReactNode;
  span?: boolean;
}) {
  const idRef = useRef(`f${++fieldSeq}`);
  return (
    <div className="field" style={span ? { gridColumn: "1 / -1" } : undefined} data-invalid={!!error}>
      <label htmlFor={idRef.current}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {children(idRef.current)}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" style={{ display: "block" }}>{error}</span>}
    </div>
  );
}

export const inputCls = "input";
export const textareaCls = "textarea";
// The stylesheet has carried .select since the port; nothing in TS named it,
// so every <select> was rendering unstyled next to its siblings.
export const selectCls = "select";

/* --- choosing several from a fixed list ------------------------------------ */

/** A set of options, any number chosen.
 *
 * A fieldset rather than a Field: a group of checkboxes has no single control
 * for a label to point at, and `htmlFor` on the first one would make clicking
 * the group's name toggle an arbitrary member.
 *
 * The options come from one shared vocabulary per field, so what is offered
 * here cannot drift from what the database will accept.
 */
export function CheckGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  columns = 2,
}: {
  label: string;
  options: { value: T; label: string; hint?: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  hint?: string;
  columns?: number;
}) {
  const toggle = (v: T) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="field span" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend>{label}</legend>
      {hint && <span className="hint" style={{ display: "block", marginBottom: 6 }}>{hint}</span>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 6 }}>
        {options.map((o) => (
          <label className="checkline" key={o.value}>
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            <span>
              {o.label}
              {o.hint && <span className="cl-sub">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A free-text list — countries, regulations. Typing Enter or a comma commits
 *  a tag; Backspace on an empty box removes the last one, which is what every
 *  tag input does and what people try first.
 *
 *  Free text because the column it feeds has no CHECK: `regulations` is
 *  deliberately open-ended, and a fixed list would go stale.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  transform,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** e.g. upper-casing an ISO country code as it is committed. */
  transform?: (raw: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const raw = draft.trim().replace(/,$/, "").trim();
    if (!raw) return;
    const next = transform ? transform(raw) : raw;
    if (next && !value.includes(next)) onChange([...value, next]);
    setDraft("");
  };
  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
          {value.map((v) => (
            <span className="chip" key={v}>
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                style={{ border: 0, background: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        className={inputCls}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

/* --- file picker ------------------------------------------------------------- */

export interface FileItem {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  /** Already saved on the record, so it cannot be removed from here. */
  locked?: boolean;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Dumb by design: the caller owns the list, the uploads and the rules.
export function FileField({
  label,
  accept,
  disabled,
  files,
  onPick,
  onRemove,
}: {
  label: string;
  accept?: string;
  disabled?: boolean;
  files: FileItem[];
  onPick: (files: FileList) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="filefield">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onPick(e.target.files);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      <button type="button" className="btn" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      {files.length > 0 && (
        <div className="filelist">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="filelist-row" data-status={f.status}>
              <span className="filelist-name">{f.name}</span>
              <span className="filelist-size">{fmtBytes(f.size)}</span>
              <span className="chip">
                {f.status === "uploading"
                  ? "Uploading…"
                  : f.status === "error"
                    ? "Failed"
                    : f.locked
                      ? "Attached"
                      : "Ready"}
              </span>
              {/* A file already saved on the record cannot be removed: there
                  is no delete endpoint, so the × used to drop it from the list
                  and leave it attached — the row vanished and the file stayed. */}
              <button
                type="button"
                className="iconbtn"
                aria-label={f.locked ? `${f.name} is already attached` : `Remove ${f.name}`}
                disabled={f.locked}
                title={f.locked ? "Already attached to this request; it cannot be removed here." : undefined}
                onClick={() => onRemove(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- meter ------------------------------------------------------------------ */

export function Meter({ pct, tone }: { pct: number; tone?: Tone }) {
  return (
    <div className="meter" data-tone={tone} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/* --- callout ---------------------------------------------------------------- */

export function Callout({ tone, title, children }: { tone?: Tone; title: string; children?: ReactNode }) {
  return (
    // A critical callout is almost always the answer to something the person
    // just did — a refused Continue, a failed save. Announce it, or pressing
    // the button and going nowhere is silent for a screen reader.
    <div className="callout" data-tone={tone} role={tone === "critical" ? "alert" : undefined}>
      <b>{title}</b>
      {children && <div className="small" style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}

/* --- empty state ------------------------------------------------------------ */

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="glyph" aria-hidden="true">·</div>
      <div className="title">{title}</div>
      {hint && <div className="small muted" style={{ maxWidth: "44ch" }}>{hint}</div>}
      {action}
    </div>
  );
}

/* --- table ------------------------------------------------------------------ */

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="tablewrap">{children}</div>;
}

/* --- lifecycle stage rail --------------------------------------------------- */

export function StageRail({
  stages,
  current,
  label,
}: {
  stages: readonly string[];
  current: string;
  /** How to render a stage. Without it the rail printed raw enum values, so a
   *  request detail page showed "accepted" on the rail and "Awarded" in the
   *  pill beside it — two names for one state on one screen. */
  label?: (stage: string) => string;
}) {
  const idx = stages.indexOf(current);
  return (
    <div className="stagerail">
      {stages.map((s, i) => (
        // .node and .name, not .dot and .small: the stylesheet styles the
        // former (a numbered 24px circle and an 11.5px label) and has no rule
        // for the latter, which left the rail as bare text on a track line.
        <div
          key={s}
          className="stage"
          data-state={i < idx ? "done" : i === idx ? "here" : "todo"}
          aria-current={i === idx ? "step" : undefined}
        >
          <span className="track" aria-hidden="true" />
          <span className="node" aria-hidden="true">{i < idx ? "✓" : i + 1}</span>
          <span className="name">{label ? label(s) : s.replace(/_/g, " ")}</span>
        </div>
      ))}
    </div>
  );
}

/* --- loading ----------------------------------------------------------------- */

// The stylesheet has shipped a .skeleton shimmer since the port and nothing
// ever emitted it, so every list in the app showed its EMPTY state while the
// query was still in flight — "No requests yet" to a client who has ten.
export function Skeleton({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="col" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: i % 3 === 2 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

/* --- definition list -------------------------------------------------------- */

// dt and dd must be DIRECT children of .dl: the grid is one narrow label column
// and one wide value column, so a wrapper per row would make each pair a single
// cell and land pairs two-across. Fragment adds no DOM node; it only carries the
// key. .dl dt, .dl dd and the responsive collapse all hang off this shape.
export function Dl({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="dl">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/* --- row menu ---------------------------------------------------------------- */

// The prototype has no row-actions menu — its rows carry inline size="sm"
// buttons — so this is a deliberate new pattern rather than a port. It lives
// here because focus, Escape and outside-click are design-system concerns.
//
// Positioned FIXED, not absolute like .pop's own rule: a row menu lives inside
// .tablewrap, whose overflow-x:auto computes overflow-y to auto and would clip
// an absolutely-positioned child. Fixed escapes that, since no ancestor
// establishes a containing block.
export function RowMenu({
  label = "Actions",
  items,
}: {
  label?: string;
  items: { label: string; onSelect: () => void; tone?: "danger" }[];
}) {
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const WIDTH = 200;

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (close(), btnRef.current?.focus());
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // fixed coordinates go stale the moment anything moves underneath
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [at]);

  const open = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setAt({ top: r.bottom + 6, left: Math.max(8, r.right - WIDTH) });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="iconbtn"
        aria-haspopup="menu"
        aria-expanded={at !== null}
        aria-label={label}
        onClick={() => (at ? setAt(null) : open())}
      >
        ⋯
      </button>
      {at && (
        <div
          ref={popRef}
          className="pop"
          role="menu"
          aria-label={label}
          style={{ position: "fixed", top: at.top, left: at.left, width: WIDTH }}
        >
          <div className="pop-list">
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className="pop-item"
                style={it.tone === "danger" ? { color: "var(--t-critical)" } : undefined}
                onClick={() => {
                  setAt(null);
                  it.onSelect();
                }}
              >
                <span className="txt">{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* --- dialog ------------------------------------------------------------------ */

export function Dialog({
  title,
  sub,
  onClose,
  children,
  foot,
  size,
  busy,
}: {
  title: string;
  sub?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  foot: ReactNode;
  size?: "wide";
  /** A mutation is in flight. Escape and the backdrop stop dismissing, because
   *  a dialog that vanishes mid-request leaves the person unsure whether it
   *  happened. Cancel and the × stay live — those are deliberate. */
  busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useRef(`dlg${++fieldSeq}`);
  // Whoever opened this, so focus can go back there on close.
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    opener.current = document.activeElement as HTMLElement | null;

    // Focus the first field a person would actually fill. In a read-only
    // dialog there is none, and the first button is the header's Close — so
    // focusing "the first focusable" put focus on the control that dismisses
    // the dialog, ringed it, and made Enter close it on arrival. Fall back to
    // the dialog itself, which the focus trap below keeps hold of.
    const first = el?.querySelector<HTMLElement>(
      "input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])",
    );
    (first ?? el)?.focus();

    // The page behind must not scroll under the scrim.
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      window.scrollTo({ top: scrollY });
      // Without this every dismissal drops focus to <body> and a keyboard user
      // restarts from the top of the page.
      opener.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
      // a minimal focus trap: tab cycles inside the dialog
      if (e.key === "Tab" && el) {
        // Filtering :disabled is the point. Every confirm dialog disables its
        // primary while its mutation runs, and an unfiltered query made that
        // disabled button the `last` element activeElement can never equal —
        // so Tab went uncaught and focus escaped behind the scrim at exactly
        // the moment the dialog was least dismissable.
        const focusables = Array.from(
          el.querySelectorAll<HTMLElement>(
            "input, select, textarea, button, [href], [tabindex]",
          ),
        ).filter(
          (f) =>
            !f.hasAttribute("disabled") &&
            !f.hasAttribute("hidden") &&
            f.getAttribute("aria-hidden") !== "true" &&
            f.getAttribute("tabindex") !== "-1",
        );
        if (!focusables.length) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    // data-open is load-bearing: the ported CSS ships .overlay{display:none}
    // and shows it only via .overlay[data-open] — the prototype kept ONE
    // permanent overlay div and toggled the attribute from JS. React mounts
    // the overlay conditionally instead, so it must mount already-open, or
    // every dialog in the app renders invisible.
    <div
      className="overlay"
      data-open=""
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="dialog"
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-busy={busy || undefined}
        // focused on open so the trap has somewhere to start; it is not
        // tab-reachable, so suppressing its ring costs keyboard users
        // nothing — the controls inside still show theirs.
        tabIndex={-1}
        style={{ outline: "none" }}
        ref={ref}
      >
        <header className="dialog-head">
          {/* .titles is load-bearing: .dialog-head has no justify-content, so
              its flex:1 is the only thing pushing the close button right. */}
          <div className="titles">
            <h2 id={titleId.current} style={{ margin: 0, fontSize: 15 }}>{title}</h2>
            {sub && <span className="sub">{sub}</span>}
          </div>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="dialog-body">{children}</div>
        <footer className="dialog-foot">{foot}</footer>
      </div>
    </div>
  );
}

/* --- toasts ------------------------------------------------------------------ */

interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone?: Tone;
}

const ToastContext = createContext<(title: string, body?: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((title: string, body?: string, tone?: Tone) => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { id, title, body, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast" data-tone={t.tone}>
            <b>{t.title}</b>
            {t.body && <div className="small muted">{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* --- view scaffold ----------------------------------------------------------- */

export function View({
  title,
  sub,
  actions,
  children,
}: {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="view">
      <div className="view-head">
        <div className="titles">
          <h1 style={{ margin: 0, fontSize: 21 }}>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {actions && <div className="view-actions btnrow">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
