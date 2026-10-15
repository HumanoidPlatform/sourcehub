// A capture as the quality checks read it: a small grey image, row by row.
// Pure, like rules.ts — clip/frames.ts produces these from the file on disk;
// blur/, exposure/ and clip/ only ever see the numbers.

export interface GreyImage {
  width: number;
  height: number;
  /** width × height grey values (0..255), row by row */
  data: Uint8Array;
}

/** The image box-averaged down to size × size: the 16×16 patch the black
 *  and frozen checks (clip/clip.ts) compare between frames. Averaging rather
 *  than picking pixels, so one bright speck cannot move a patch. */
export function patchOf(img: GreyImage, size: number): Uint8Array {
  const out = new Uint8Array(size * size);
  if (img.width === 0 || img.height === 0) return out;
  for (let py = 0; py < size; py++) {
    const y0 = Math.floor((py * img.height) / size);
    const y1 = Math.max(y0 + 1, Math.floor(((py + 1) * img.height) / size));
    for (let px = 0; px < size; px++) {
      const x0 = Math.floor((px * img.width) / size);
      const x1 = Math.max(x0 + 1, Math.floor(((px + 1) * img.width) / size));
      let s = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += img.data[y * img.width + x];
      out[py * size + px] = Math.round(s / ((y1 - y0) * (x1 - x0)));
    }
  }
  return out;
}
