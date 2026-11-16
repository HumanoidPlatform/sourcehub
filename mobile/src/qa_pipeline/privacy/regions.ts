// What to cover, and where, in pixels of the upright picture.
//
// The deidentify module finds faces and reads text; this decides the
// rectangles it then pixelates (faces) or fills (plates). Pure and
// unit-tested. Boxes are generous on purpose: a detector's box hugs a face's
// features and leaves the hairline and ears, and a covered shelf edge costs a
// client far less than an uncovered face.
//
// A clip is looked at every so often, not frame by frame, so between two
// looks nobody knows where a face went. Every frame is covered by the boxes
// of BOTH looks either side of it, and a face seen at both is covered across
// the whole path between, so someone walking across the frame stays covered
// between looks. Someone who appears and leaves entirely between two looks is
// missed; the look interval is a setting (config.ts DEID_EVERY_MS).

import type { Box, Region, Span, TextLine } from "../../../modules/deidentify";

// the module's own shapes: what this decides is exactly what it is handed
export type { Box, Region, Span, TextLine };
export type Style = Region["style"];

/** How much a face's and a plate's box grow on each side, as a share of the box. */
export const FACE_PAD = 0.3;
export const PLATE_PAD = 0.15;

/** A box grown by `pad` of its size on every side, kept inside the picture. */
export function grow(b: Box, pad: number, width: number, height: number): Box {
  const dx = b.w * pad;
  const dy = b.h * pad;
  const x1 = Math.max(0, Math.floor(b.x - dx));
  const y1 = Math.max(0, Math.floor(b.y - dy));
  const x2 = Math.min(width, Math.ceil(b.x + b.w + dx));
  const y2 = Math.min(height, Math.ceil(b.y + b.h + dy));
  return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function union(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Overlapping regions of the same style become one, until none overlap.
 *  A fill swallows a pixelation it overlaps: the stronger cover wins. */
export function merge(regions: Region[]): Region[] {
  let out = regions.filter((r) => r.box.w > 0 && r.box.h > 0).map((r) => ({ ...r }));
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (!overlaps(out[i].box, out[j].box)) continue;
        const style: Style = out[i].style === "fill" || out[j].style === "fill" ? "fill" : "pixelate";
        const joined = { box: union(out[i].box, out[j].box), style };
        out = [...out.slice(0, i), joined, ...out.slice(i + 1, j), ...out.slice(j + 1)];
        changed = true;
        break outer;
      }
    }
  }
  return out;
}

/** Everything to cover in one picture: its faces pixelated, its plates filled. */
export function pictureRegions(faces: Box[], plates: Box[], width: number, height: number): Region[] {
  return merge([
    ...faces.map((b) => ({ box: grow(b, FACE_PAD, width, height), style: "pixelate" as const })),
    ...plates.map((b) => ({ box: grow(b, PLATE_PAD, width, height), style: "fill" as const })),
  ]);
}

function centre(b: Box): [number, number] {
  return [b.x + b.w / 2, b.y + b.h / 2];
}

/** Each region of one look paired with the nearest of the same style in the
 *  next, close enough to be the same thing moving, as one box over the whole
 *  path; anything without a partner stays as it was. */
function bridge(a: Region[], b: Region[], width: number, height: number): Region[] {
  const reach = 0.35 * Math.hypot(width, height);
  const taken = new Set<number>();
  const out: Region[] = [];
  for (const r of a) {
    const [ax, ay] = centre(r.box);
    let best = -1;
    let bestD = Infinity;
    b.forEach((s, j) => {
      if (taken.has(j) || s.style !== r.style) return;
      const [bx, by] = centre(s.box);
      const d = Math.hypot(ax - bx, ay - by);
      if (d < bestD) {
        best = j;
        bestD = d;
      }
    });
    if (best >= 0 && bestD <= reach) {
      taken.add(best);
      out.push({ box: union(r.box, b[best].box), style: r.style });
    } else {
      out.push(r);
    }
  }
  b.forEach((s, j) => {
    if (!taken.has(j)) out.push(s);
  });
  return merge(out);
}

export interface Look {
  tMs: number;
  regions: Region[];
}

/** A clip's looks as spans covering all of it, from 0 to durationMs. Between
 *  two looks, both looks' regions (bridged); before the first and after the
 *  last, that look's own, held to the clip's ends. */
export function spans(looks: Look[], durationMs: number, width: number, height: number): Span[] {
  const sorted = [...looks].sort((x, y) => x.tMs - y.tMs);
  if (sorted.length === 0) return [];
  const out: Span[] = [];
  const first = sorted[0];
  if (first.tMs > 0) out.push({ fromMs: 0, toMs: first.tMs, regions: first.regions });
  for (let i = 0; i + 1 < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    out.push({ fromMs: a.tMs, toMs: b.tMs, regions: bridge(a.regions, b.regions, width, height) });
  }
  const last = sorted[sorted.length - 1];
  out.push({ fromMs: last.tMs, toMs: Math.max(durationMs, last.tMs), regions: last.regions });
  return out.filter((s) => s.toMs > s.fromMs);
}
