import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

async function stampFile(swPath, timestamp) {
  try {
    await stat(swPath);
  } catch (_) {
    return false;
  }

  const content = await readFile(swPath, "utf8");
  const replaced = content.replace(
    /const\s+VERSION\s*=\s*(['"])\S*\1;/,
    (_m, quote) => `const VERSION = ${quote}v${timestamp}${quote};`
  );

  if (replaced === content) {
    // eslint-disable-next-line no-console
    console.warn(`stamp-sw-version: VERSION pattern not found in ${swPath}`);
    return false;
  }

  await writeFile(swPath, replaced);
  // eslint-disable-next-line no-console
  console.log(`Stamped service worker version in ${swPath}: v${timestamp}`);
  return true;
}

async function main() {
  const timestamp = Date.now();
  const candidates = [
    path.join(process.cwd(), ".output", "public", "sw.js"),
    path.join(process.cwd(), ".output", "public", "_build", "sw.js"),
    path.join(process.cwd(), "public", "sw.js"),
  ];

  const results = await Promise.all(
    candidates.map((p) => stampFile(p, timestamp))
  );

  if (!results.some(Boolean)) {
    // eslint-disable-next-line no-console
    console.warn("stamp-sw-version: skipping (no sw.js found or no matches)");
  }
}

main();
