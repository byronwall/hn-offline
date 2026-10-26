// Write public/sw.js from src/sw.js with a fresh VERSION, before the build.
// A new version makes browsers install the new worker, which precaches the
// new build's chunks and drops the old caches. Nitro then serves, compresses,
// and fingerprints the stamped file like any other public asset.
import { readFile, writeFile } from "node:fs/promises";

const src = await readFile("src/sw.js", "utf8");
const version = `v${Date.now()}`;
const out = src.replace(
  /const VERSION = "dev";/,
  `const VERSION = "${version}";`
);

if (out === src) {
  throw new Error(
    'stamp-sw-version: `const VERSION = "dev";` not found in src/sw.js'
  );
}

await writeFile("public/sw.js", out);
// eslint-disable-next-line no-console
console.log(`Stamped public/sw.js: ${version}`);
