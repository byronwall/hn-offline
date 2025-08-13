import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

async function main() {
  try {
    const swPath = path.join(process.cwd(), ".output", "public", "sw.js");
    await stat(swPath);

    const content = await readFile(swPath, "utf8");
    const timestamp = Date.now();

    const replaced = content.replace(
      /const\s+VERSION\s*=\s*(['"])\S*\1;/,
      (_m, quote) => `const VERSION = ${quote}v${timestamp}${quote};`
    );

    await writeFile(swPath, replaced);
    // eslint-disable-next-line no-console
    console.log(`Stamped service worker version: v${timestamp}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "stamp-sw-version: skipping (no sw.js found or error)",
      // @ts-ignore - optional chaining on unknown
      err?.message ?? err
    );
  }
}

main();
