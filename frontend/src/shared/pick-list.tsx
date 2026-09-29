// Choosing several from a LONG fixed list: countries, languages.
//
// CheckGroup is the control for a short list, where every option can be seen
// at once. A hundred and twenty-five countries as checkboxes is a page of its
// own, and TagInput is free text, which a fixed vocabulary must not be. So:
// what has been chosen as removable chips, and a native select that adds one.
// Native because it is searchable by typing, works on a phone, and needs no
// popover that a dialog's scroll container would clip.

import { Field, selectCls } from "@ds/primitives";

export interface PickOption {
  value: string;
  label: string;
}

export function PickList({
  label,
  options,
  value,
  onChange,
  max,
  placeholder,
  hint,
}: {
  label: string;
  options: readonly PickOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** How many may be chosen. At the limit the select locks and says why. */
  max: number;
  placeholder: string;
  hint?: string;
}) {
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const left = options.filter((o) => !value.includes(o.value));
  const full = value.length >= max;
  return (
    <Field
      label={label}
      span
      hint={full ? `That is the most you can list (${max}). Remove one to add another.` : hint}
    >
      {(id) => (
        <div className="picklist">
          {value.length > 0 && (
            <div className="picklist-chosen">
              {value.map((v) => (
                <span className="chip" key={v}>
                  {labelOf(v)}
                  <button
                    type="button"
                    className="chip-x"
                    aria-label={`Remove ${labelOf(v)}`}
                    onClick={() => onChange(value.filter((x) => x !== v))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <select
            id={id}
            className={selectCls}
            // Always the placeholder: the select adds, the chips are the value.
            value=""
            disabled={full || left.length === 0}
            onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          >
            <option value="">{placeholder}</option>
            {left.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
    </Field>
  );
}
