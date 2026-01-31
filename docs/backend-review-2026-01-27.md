# Backend Review (2026-01-27)

Scope: server-side code under `src/server/*` plus server queries that expose data to the UI.

Below are gaps/weaknesses or areas that are verbose/unclear, with proposed fixes.

---

## Reliability + Data Integrity

1. **Overlapping refresh jobs / unhandled failures**
   - **Where**: `src/server/server.ts`
   - **Issue**: `setInterval(updateData, ...)` triggers without awaiting prior runs. If `updateData` takes >10 min or throws, the next tick overlaps. Also unhandled rejections can terminate the process depending on Node settings.
   - **Fix**: Guard with a mutex (`isUpdating`) and wrap `updateData` in a try/catch that logs and continues. Consider `setTimeout` loop to schedule the next run after completion.

2. **Refresh cadence tied to an in-memory counter**
   - **Where**: `src/server/server.ts`
   - **Issue**: `index` resets on restart, so day/week/month updates are dependent on uptime, not real time. That can mean missing or extra refreshes after restarts.
   - **Fix**: Store last-refresh timestamps in DB (or in-memory + persisted) and compare against `Date.now()` to decide when to refresh each bucket.

3. **File-backed DB writes are non-atomic and blocking**
   - **Where**: `src/server/database.ts`
   - **Issue**: `fs.writeFileSync` blocks the event loop and writes directly to the target path. A crash mid-write can leave a corrupted JSON file.
   - **Fix**: Write to a temp file then `rename` (atomic on same volume). Switch to async `fs.promises` with try/catch and log errors.

4. **DB reload has no corruption handling**
   - **Where**: `src/server/database.ts`
   - **Issue**: `JSON.parse` on the DB file can throw; no recovery path or backup.
   - **Fix**: Wrap in try/catch. On parse error, keep an empty DB, write a `.bad` backup, and log a clear warning.

5. **Old-story cleanup returns an inaccurate removed count**
   - **Where**: `src/server/database.ts` (`db_clearOldStories`)
   - **Issue**: Return value is `allIds.length - idsToKeep.length`, which is wrong if `idsToKeep` contains IDs not in `db` or duplicates.
   - **Fix**: Track `removed` while deleting and return that count.

6. **No validation on server ingest**
   - **Where**: `src/server/getFullDataForIds.ts`, `src/server/database.ts`
   - **Issue**: HN/Algolia responses are stored without schema validation. The UI does validate before local storage, but the server cache can accept malformed items.
   - **Fix**: Reuse `validateHnItemWithComments` on server (or a lighter schema for cached items). Reject or sanitize invalid fields before caching.

---

## Performance + Scalability

7. **Sequential fetch for item lists**
   - **Where**: `src/server/api.ts` (`fetchItems`)
   - **Issue**: Items are fetched one-by-one, which is slow and increases update latency.
   - **Fix**: Fetch in parallel with a concurrency limit (e.g., `p-limit`) to balance speed and API load.

8. **Recursive comment expansion can explode**
   - **Where**: `src/server/database.ts` (`addAllChildren`, `addChildrenToItemRecurse`)
   - **Issue**: Recursively loading every descendant can blow memory/time for large threads and lacks a max depth/item cap.
   - **Fix**: Add configurable max depth and/or max total comments. Consider lazy loading deeper threads on-demand.

9. **No timeout/abort on external fetches**
   - **Where**: `src/server/api.ts`, `src/server/algolia.ts`
   - **Issue**: Long-hanging requests can stall updates and pile up overlapping runs.
   - **Fix**: Use `AbortController` with a timeout (e.g., 5–10s) and retry with backoff for transient failures.

---

## Clarity + Verbosity

10. **Duplicated Algolia queries**
    - **Where**: `src/server/algolia.ts` (`getDay`, `getWeek`, `getMonth`)
    - **Issue**: Three near-identical functions differ only by time window.
    - **Fix**: Implement a single helper (e.g., `getSince(secondsAgo)`) and delegate to it; keep named wrappers for readability if desired.

11. **`fetch` wrapper is over-verbose**
    - **Where**: `src/server/api.ts` (`fetch`)
    - **Issue**: Manually wraps a Promise around `get(...)` and uses `any` types.
    - **Fix**: Convert to `async fetch<T>()` with `try/catch` and typed return. Keep a single error path and log context.

12. **Cache warmup stores stale/null data**
    - **Where**: `src/server/server.ts` (`populateCacheFromDatabase`)
    - **Issue**: `getItemFromDb` can return null for stale items, but nulls are cached. That makes downstream results inconsistent.
    - **Fix**: Filter nulls before setting `cachedData[type]`.

13. **Staleness calculation can divide by zero**
    - **Where**: `src/server/database.ts` (`_isTimePastThreshold`)
    - **Issue**: Uses `itemExt.time!` and divides by `(lastUpdated - time)`. If `time` is missing or equals `lastUpdated`, result is invalid.
    - **Fix**: Guard `time` presence and non-zero delta; fall back to a simple max-age threshold.

---

## Observability + Testing

14. **No structured logging**
    - **Where**: `src/server/server.ts`, `src/server/api.ts`, `src/server/database.ts`
    - **Issue**: `console.log` with stringy output makes it hard to correlate update cycles or failures.
    - **Fix**: Log structured objects and include `storyType`, `durationMs`, and `error` fields. A lightweight logger (pino) can help.

15. **Missing server tests**
    - **Where**: `src/server/*`
    - **Issue**: No tests cover update cadence, DB cache/staleness, or error handling.
    - **Fix**: Add focused unit tests for:
      - `_isTimePastThreshold` edge cases
      - `db_clearOldStories` removal count
      - `getFullDataForIds` behavior with missing items
      - `getTopStories` validation error on unknown type

---

## Suggested Next Steps (small, high-impact)

1. Add a guarded update loop and error handling in `src/server/server.ts`.
2. Make DB writes atomic + async in `src/server/database.ts`.
3. Add a concurrency-limited fetch in `src/server/api.ts`.
4. Add a max depth limit for comment expansion.
5. Add minimal unit tests for the data layer.
