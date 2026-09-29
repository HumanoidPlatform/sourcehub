// Regenerate the capture app's launcher, adaptive and splash images.
//
//   npm install sharp --prefix /some/scratch/dir
//   SHARP_HOME=/some/scratch/dir node docs/brand/make-icons.mjs
//
// SHARP_HOME has to be spelled out because ES modules resolve bare names relative
// to the importing FILE, not the working directory, and ignore NODE_PATH — so a
// package installed anywhere else cannot be borrowed without saying where.
//
// Sharp is deliberately NOT a dependency of mobile/. It would be installed on
// every EAS build to produce files that are already committed. The PNGs are the
// artefact; this script is how they came to exist.
//
// WHY THE SOURCES ARE THE WEB'S. favicon.svg is the DataMind360 mark already cut
// out of the lockup for the browser tab — "the paths left of the wordmark,
// unchanged". Re-cutting it here would be a second opinion about where the mark
// ends, and the two would drift. One cut, two platforms.
//
// The mobile app cannot render SVG (no react-native-svg, no metro.config.js), so
// every one of these has to be a raster.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(repo, "mobile", "assets", "images");

// Resolving by require() from a directory, rather than importing a file path,
// survives sharp moving its entry point — which it did between 0.34 and 0.35.
const sharp = createRequire(join(process.env.SHARP_HOME ?? repo, "-"))("sharp");

const MARK = join(repo, "frontend", "public", "brand", "favicon.svg");
const LOCKUP = join(repo, "docs", "brand", "DataMind360_Dark_Logo.svg");

// The only colour this script chooses. The ink and the brand blue come from the
// artwork, so they are never restated here and cannot drift from it.
const WHITE = "#FFFFFF";

/** The artwork of an SVG, without its wrapper or its web-only <style>.
 *
 *  favicon.svg carries a prefers-color-scheme rule so the mark turns white on a
 *  dark browser tab. librsvg has no such notion and a launcher icon has no theme
 *  to follow, so the rule is dropped rather than half-applied. */
function artwork(file) {
  const svg = readFileSync(file, "utf8");
  const box = /viewBox="([^"]+)"/.exec(svg);
  if (!box) throw new Error(`${file} has no viewBox`);
  const [x, y, w, h] = box[1].trim().split(/\s+/).map(Number);
  const inner = svg
    .slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"))
    .replace(/<style[\s\S]*?<\/style>/g, "");
  return { inner, x, y, w, h };
}

/** Draw `art` centred on a square canvas, filling `share` of its width.
 *
 *  The source box is placed, not the ink: the mark sits slightly off-centre
 *  inside its own 70x70 box on purpose, and honouring that keeps it identical to
 *  the favicon. */
function square(art, size, share, { background = null, flatten = null } = {}) {
  const side = size * share;
  const scale = side / Math.max(art.w, art.h);
  const tx = (size - art.w * scale) / 2 - art.x * scale;
  const ty = (size - art.h * scale) / 2 - art.y * scale;
  const body = flatten ? art.inner.replace(/fill="[^"]*"/g, `fill="${flatten}"`) : art.inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    (background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : "") +
    `<g transform="translate(${tx} ${ty}) scale(${scale})">${body}</g></svg>`;
}

// Rasterise at the final size rather than resizing afterwards: the source is 70
// units across, so anything else is an upscale of a 70px bitmap.
const write = (svg, name) =>
  sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(out, name));

const mark = artwork(MARK);
const lockup = artwork(LOCKUP);

// 1024 is what Expo wants for every icon slot; it downscales the rest itself.
//
// The two shares are not a guess. An adaptive icon is a 108dp canvas of which
// only the centre 66dp is guaranteed to survive the launcher's mask, so the
// foreground stays inside 66/108 with room to spare. icon.png is masked to a
// rounded square and nothing more, so it can afford to be bigger.
const ADAPTIVE = 0.59;
const LAUNCHER = 0.66;

await Promise.all([
  write(square(mark, 1024, LAUNCHER, { background: WHITE }), "icon.png"),
  write(square(mark, 1024, ADAPTIVE), "android-icon-foreground.png"),
  write(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">` +
        `<rect width="1024" height="1024" fill="${WHITE}"/></svg>`, "android-icon-background.png"),

  // Android 13+ themed icons throw the colours away and tint the silhouette to
  // the wallpaper, so every path collapses to one opaque fill. Leaving the brand
  // blue in would simply be discarded — but leaving the mark's counters as
  // separate colours would not, and the shape would fill in.
  write(square(mark, 1024, ADAPTIVE, { flatten: "#000000" }), "android-icon-monochrome.png"),

  // The splash gets the whole lockup, not the mark: it is the one place with room
  // for the product's name, and the plugin paints #F3F5F7 behind it.
  write(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${Math.round((1000 * lockup.h) / lockup.w)}" ` +
      `viewBox="${lockup.x} ${lockup.y} ${lockup.w} ${lockup.h}">${lockup.inner}</svg>`,
    "splash-icon.png",
  ),
]);

console.log(`wrote 5 images to ${out}`);
console.log(`  mark   ${mark.w}x${mark.h} from ${MARK}`);
console.log(`  lockup ${lockup.w}x${lockup.h} from ${LOCKUP}`);
