// Generic, domain-free components over the prototype's class names.
//
// The build guide: "build the components as React components over the same
// class names" — so every className here exists verbatim in components.css,
// and a visual change is a CSS change in the prototype first.

import {
  createContext,
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
  children,
  foot,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <section className="panel">
      {title !== undefined && (
        <header className="panel-head">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 14.5 }}>{title}</h2>
            {sub && <div className="small muted">{sub}</div>}
          </div>
          {actions && <div style={{ marginLeft: "auto" }} className="btnrow">{actions}</div>}
        </header>
      )}
      <div className="panel-body">{children}</div>
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

export function Dl({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="dl">
      {rows.map(([k, v]) => (
        <div key={k} className="specrow">
          <span className="muted small">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* --- dialog ------------------------------------------------------------------ */

export function Dialog({
  title,
  sub,
  onClose,
  children,
  foot,
}: {
  title: string;
  sub?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  foot: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    el?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
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
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="dialog-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 15 }}>{title}</h2>
            {sub && <div className="small muted">{sub}</div>}
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
