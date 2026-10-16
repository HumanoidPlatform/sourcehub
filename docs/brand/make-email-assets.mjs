// Regenerate the two images every platform e-mail references, into
// frontend/public/brand/ (nginx serves that folder as-is):
//
//   email-logo.png   the DataMind360 lockup (logo-on-light.svg) at 2x, shown
//                    200px wide by platform/mail/templates/base.html
//   linkedin.png     the LinkedIn mark (linkedin.svg) at 64px, shown 24px
//
//   npm install sharp --prefix /some/scratch/dir
//   SHARP_HOME=/some/scratch/dir node docs/brand/make-email-assets.mjs
//
// Why PNG and not the SVGs the console uses: mail clients do not render SVG
// (Gmail and Outlook drop it), so the mail needs rasters. Like make-icons.mjs,
// the PNGs are the committed artefact and this script is how they came to be;
// sharp is deliberately not a dependency of frontend/ or mobile/.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const brand = join(repo, "frontend", "public", "brand");

// Resolving by require() from a directory, rather than importing a file path,
// survives sharp moving its entry point — which it did between 0.34 and 0.35.
const sharp = createRequire(join(process.env.SHARP_HOME ?? repo, "-"))("sharp");

const LOGO_WIDTH = 400; // 2x of the 200px the template shows
const ICON = 64; // 2x+ of the 24px mark

/** The artwork of an SVG, without its wrapper or any web-only <style>. */
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

const lockup = artwork(join(brand, "logo-on-light.svg"));
const logoHeight = Math.round((LOGO_WIDTH * lockup.h) / lockup.w);

await Promise.all([
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_WIDTH}" height="${logoHeight}" ` +
        `viewBox="${lockup.x} ${lockup.y} ${lockup.w} ${lockup.h}">${lockup.inner}</svg>`,
    ),
  )
    .png({ compressionLevel: 9 })
    .toFile(join(brand, "email-logo.png")),
  sharp(readFileSync(join(brand, "linkedin.svg")))
    .resize(ICON, ICON)
    .png({ compressionLevel: 9 })
    .toFile(join(brand, "linkedin.png")),
]);

console.log(`wrote email-logo.png (${LOGO_WIDTH}x${logoHeight}) and linkedin.png (${ICON}x${ICON}) to ${brand}`);
