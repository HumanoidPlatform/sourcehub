// The brand, in one place. The next rename is a three-constant edit here
// (plus the static index.html title, which cannot import this module).

export const BRAND = "Cosarathi";
export const BRAND_FULL = "Cosarathi Data Platform";
export const BRAND_GLYPH = "C";

export function BrandMark() {
  return (
    <div className="mark">
      <span className="mark-glyph" aria-hidden="true">{BRAND_GLYPH}</span>
      <span className="mark-name">{BRAND}</span>
    </div>
  );
}
