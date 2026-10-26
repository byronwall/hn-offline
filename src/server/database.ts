import * as fs from "fs";
import * as path from "path";

import { _getUnixTimestamp } from "~/lib/utils";
import {
  type ItemExt,
  STORY_TYPE,
  type TopStories,
  type TopStoriesType,
} from "~/models/interfaces";

// One JSON file: items keyed by id, plus one id list per story type.
type DbShape = {
  [id: number]: ItemExt;
} & Partial<Record<TopStoriesType, TopStories>>;

// SolidStart bundles server code twice (SSR and server functions), so this
// module can load twice in one process. Keep the data on globalThis so both
// copies share one DB and one refresh loop.
type ServerState = { db: DbShape; loaded: boolean; refreshStarted: boolean };
const shared = globalThis as typeof globalThis & { __hnServer?: ServerState };
export const state = (shared.__hnServer ??= {
  db: {},
  loaded: false,
  refreshStarted: false,
});

const dbPath = process.env.db_path ?? "./newdb.json";
const maxDatabaseBytes = getMaxDatabaseBytes();

export function reloadDatabase() {
  state.loaded = true;
  if (!fs.existsSync(dbPath)) {
    state.db = {};
    return;
  }

  resetOversizedDatabase();

  try {
    state.db = JSON.parse(fs.readFileSync(dbPath, "utf8")) as DbShape;
  } catch (error) {
    console.error("Database JSON is unreadable; resetting local cache", error);
    resetDatabaseFile("invalid-json");
  }
}

// Write to a temp file, then rename, so a crash never leaves half a file.
export async function saveDatabase() {
  ensureDatabaseDir();
  const tmpPath = `${dbPath}.tmp`;
  await fs.promises.writeFile(tmpPath, JSON.stringify(state.db));
  await fs.promises.rename(tmpPath, dbPath);
}

// An item counts as stale once its last fetch is more than 25% of its age
// ago, so new threads refresh often and old ones rarely. `allowStale` returns
// it anyway (to serve something while a refresh runs).
export function getItem(
  id: number,
  options?: { allowStale?: boolean }
): ItemExt | null {
  const item = state.db[id];
  if (!item) {
    return null;
  }
  if (options?.allowStale) {
    return item;
  }
  const sinceFetch = _getUnixTimestamp() - item.lastUpdated;
  const ageAtFetch = item.lastUpdated - (item.time ?? 0);
  return sinceFetch / ageAtFetch > 0.25 ? null : item;
}

export function putItem(item: ItemExt) {
  state.db[item.id] = item;
}

export function getList(type: TopStoriesType): TopStories | undefined {
  return state.db[type];
}

export function putList(type: TopStoriesType, ids: number[]) {
  state.db[type] = { id: type, items: ids, lastUpdated: _getUnixTimestamp() };
}

// Drop every item not in `keepIds`, and any list key that is no longer a
// story type. Returns the number of items removed.
export function pruneItems(keepIds: Set<number>) {
  let removed = 0;
  for (const key of Object.keys(state.db)) {
    const id = Number(key);
    if (Number.isNaN(id)) {
      if (!STORY_TYPE.includes(key as TopStoriesType)) {
        delete (state.db as Record<string, unknown>)[key];
      }
      continue;
    }
    if (!keepIds.has(id)) {
      delete state.db[id];
      removed++;
    }
  }
  return removed;
}

function ensureDatabaseDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

function getMaxDatabaseBytes() {
  const value = Number(process.env.db_max_bytes);
  return Number.isFinite(value) && value > 0 ? value : 128 * 1024 * 1024;
}

function resetOversizedDatabase() {
  const { size } = fs.statSync(dbPath);
  if (size <= maxDatabaseBytes) {
    return;
  }
  console.error(
    `Database file is ${size} bytes, above limit ${maxDatabaseBytes}; resetting local cache`
  );
  resetDatabaseFile("oversized");
}

function resetDatabaseFile(reason: string) {
  ensureDatabaseDir();

  if (fs.existsSync(dbPath)) {
    if (shouldDeleteResetBackup()) {
      fs.unlinkSync(dbPath);
      console.error("Deleted database file");
    } else {
      const backupPath = `${dbPath}.${reason}.${Date.now()}.bak`;
      fs.renameSync(dbPath, backupPath);
      console.error("Moved database file to", backupPath);
    }
  }

  state.db = {};
  fs.writeFileSync(dbPath, "{}");
}

function shouldDeleteResetBackup() {
  return (
    process.env.db_delete_reset_backup === "true" ||
    process.env.db_delete_oversized_backup === "true"
  );
}
