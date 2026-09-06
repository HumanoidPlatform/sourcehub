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

/* --- file picker ------------------------------------------------------------- */

export interface FileItem {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
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
                {f.status === "uploading" ? "Uploading…" : f.status === "error" ? "Failed" : "Ready"}
              </span>
              <button type="button" className="iconbtn" aria-label={`Remove ${f.name}`} onClick={() => onRemove(i)}>
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
    <div className="callout" data-tone={tone}>
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

export function StageRail({ stages, current }: { stages: readonly string[]; current: string }) {
  const idx = stages.indexOf(current);
  return (
    <div className="stagerail">
      {stages.map((s, i) => (
        <div key={s} className="stage" data-state={i < idx ? "done" : i === idx ? "here" : undefined}>
          <span className="track" aria-hidden="true" />
          <span className="dot" aria-hidden="true" />
          <span className="small" style={{ fontWeight: i === idx ? 600 : 400 }}>{s.replace(/_/g, " ")}</span>
        </div>
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
}: {
  title: string;
  sub?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  foot: ReactNode;
  size?: "wide";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Focus the first field a person would actually fill. In a read-only
    // dialog there is none, and the first button is the header's Close — so
    // focusing "the first focusable" put focus on the control that dismisses
    // the dialog, ringed it, and made Enter close it on arrival. Fall back to
    // the dialog itself, which the focus trap below keeps hold of.
    const first = el?.querySelector<HTMLElement>("input, select, textarea");
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // a minimal focus trap: tab cycles inside the dialog
      if (e.key === "Tab" && el) {
        const focusables = el.querySelectorAll<HTMLElement>(
          "input, select, textarea, button, [href]",
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
  }, [onClose]);

  return (
    // data-open is load-bearing: the ported CSS ships .overlay{display:none}
    // and shows it only via .overlay[data-open] — the prototype kept ONE
    // permanent overlay div and toggled the attribute from JS. React mounts
    // the overlay conditionally instead, so it must mount already-open, or
    // every dialog in the app renders invisible.
    <div className="overlay" data-open="" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="dialog"
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
            <h2 style={{ margin: 0, fontSize: 15 }}>{title}</h2>
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
