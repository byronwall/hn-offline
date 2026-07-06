import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type ItemExt } from "~/models/interfaces";

let tmpDir = "";

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hn-client-db-"));
  vi.resetModules();
});

afterEach(() => {
  delete process.env.db_path;
  delete process.env.db_max_bytes;
  delete process.env.db_delete_reset_backup;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("database startup recovery", () => {
  it("resets oversized database files before reading them", async () => {
    const dbPath = path.join(tmpDir, "db.json");
    fs.writeFileSync(dbPath, JSON.stringify({ old: "x".repeat(100) }));
    process.env.db_path = dbPath;
    process.env.db_max_bytes = "10";

    const database = await import("./database");

    database.reloadDatabase();

    expect(fs.readFileSync(dbPath, "utf8")).toBe("{}");
    expect(fs.readdirSync(tmpDir).some((name) => name.includes("oversized"))).toBe(
      true
    );
  });

  it("counts only stories actually removed during cleanup", async () => {
    const dbPath = path.join(tmpDir, "db.json");
    process.env.db_path = dbPath;

    const database = await import("./database");

    database.reloadDatabase();
    database.addItemToDb(createItem(1));
    database.addItemToDb(createItem(2));

    await expect(database.db_clearOldStories([1, 999])).resolves.toBe(1);
    expect(database.getItemFromDb(1)?.id).toBe(1);
    expect(database.getItemFromDb(2)).toBeNull();
  });
});

function createItem(id: number): ItemExt {
  const now = Math.floor(Date.now() / 1000);

  return {
    by: "test",
    id,
    lastUpdated: now,
    time: now - 1,
    title: `Story ${id}`,
    type: "story",
  };
}
