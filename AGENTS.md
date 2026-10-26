# AGENTS.md — HN Offline

HN Offline is a read-only Hacker News reader built for reading comment threads,
online or offline. SolidStart (SolidJS + vinxi/nitro), TypeScript, Tailwind v4,
pnpm. One server, one client, no accounts.

## Commands

| Task           | Command                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Install        | `pnpm install` (pnpm 11; native builds are approved in `pnpm-workspace.yaml`)                           |
| Types          | `pnpm typecheck`                                                                                        |
| Lint           | `pnpm lint` (the remaining warnings are old ones in `src/server`, `lib/validation.ts`, `app.config.ts`) |
| Tests          | `pnpm test` (Vitest: stores, comment formatting, server DB)                                             |
| Build          | `pnpm build` (first writes `public/sw.js` from `src/sw.js` with a new version; that file is gitignored) |
| Run prod build | `PORT=3219 node .output/server/index.mjs`                                                               |
| Dev            | `pnpm dev`                                                                                              |

Verify UI against the production build. In dev, a HEAD request that races a
lazy route (the Claude browser pane sends one) can render
"useAppData must be used within AppDataProvider". That is a dev-only race,
not a bug in the app. curl and real browsers do not hit it.

The refresh loop starts on the first server query after boot. From an empty
DB it takes ~8 s for top, ~4 s for day, ~40 s for week; the JSON path comes
from `db_path`. When you benchmark or wait on the server, watch its log
("refreshing <list>", "refreshed <list>: N stories in Xms") and give up after
~60 s with no new line. Do not wait minutes on a silent process.

## How data flows

```
hnSources.ts (HN Firebase items, Algolia lists) ──> server.ts refresh loop
  (checks every 5 min; refreshes a list when older than top 10 min,
   day 1 h, week 6 h; one run at a time; prunes to stories on a list)
  └─> database.ts: one JSON file, one record per story id, lists = ids
src/server/queries.ts (query() + "use server"; each calls ensureServerStarted)
  getStorySummariesByType  ── list pages, SSR: summaries only (~100 KB HTML)
  getStoryListByType       ── full stories + comment trees, client background fetch
  getStoryById             ── one story with comments
  searchStories.ts         ── Algolia full-text search for the nav popover
Client stores (src/stores, created in contexts/AppDataContext.tsx)
  useDataStore      STORY_SUMMARIES (one record per story), STORY_LIST_STORE
                    (ids per page), raw_<id> full stories, refresh, purge
  createPersistedStore  Solid store mirrored to one localForage key
  useReadItemsStore READ_ITEMS, READ_COMMENT_COUNTS, READ_SETTINGS
  useCommentStore   COLLAPSED_COMMENTS
  useRefreshStore   refresh timestamps per page
  storyUiStore      open story, author colors (memo), last visit time
```

- One story, one record, on both sides. The server DB keys items by id and
  lists hold ids. The client keeps `STORY_SUMMARIES` keyed by id (newest
  `lastUpdated` wins) and `STORY_LIST_STORE` holds only ids. Never store a
  per-list copy of story data; Top/Day/Week must show the same numbers.
- Server state lives on `globalThis.__hnServer`. SolidStart bundles server
  code twice (SSR and server functions); without this there are two DBs and
  two refresh loops. Start work with `ensureServerStarted()`; bare
  side-effect imports are dropped (`"sideEffects": false`).
- List page: SSR shows summaries. After hydration, `syncStoryList` saves them
  and fetches the full stories in the background so every story on the page
  reads offline.
- Service worker (`src/sw.js`, plain JS, production only): Top, Day, Week,
  and `/offline` are network first with a cached copy. Built assets are
  cache first, and install precaches every chunk in the Vite manifest. An
  uncached page offline redirects to `/offline?next=<path>`, which routes
  back in the client so the story reads from IndexedDB. Test it against the
  production build: stop the server to go offline.
- Deploys: install is all or nothing, so a failed precache keeps the old
  worker. The client checks for a new worker each time the app becomes
  visible. When one takes over, the page reloads the next time it is hidden,
  never mid-read. A failed chunk load (`vite:preloadError`) reloads once.
- IndexedDB: story reads and writes wait for `whenReady()`. Never call
  `localForage()?.setItem`: before storage opens, it skips the write and
  reports success. A persisted store whose load fails keeps retrying, and
  never hydrates with defaults that the next write would save over real data.
- Story page: on the client, `getContent` reads IndexedDB first, then the
  network. A failure returns `undefined`, and the page shows "not available".
  It never throws to the root error boundary.
- `createPersistedStore` writes go to memory at once. Writes made before
  IndexedDB loads are queued and replayed over the stored value. Set one key
  with `set(key, value)`; `undefined` deletes the key.

## Where things live

- `src/routes/` holds thin route files only. List pages use
  `features/storyList/StoryListRoute`.
- `src/features/storyList/`: `ServerStoryList` (data), `HnStoryListBody`
  (sort, hide-read filter, empty states), `HnStoryListHeader`, `HnListItem`.
- `src/features/comments/`: `HnStoryPage`, `HnComment` (collapse, sticky
  reply connector), `HnCommentList` (top level renders 8 threads per frame;
  nested lists render all), `HnThreadNav` (next thread / next new).
- `src/lib/scroll.ts` handles every programmatic scroll: `scrollToY` (a short
  glide, never a long ride), `keepInView` (after collapse/expand), and `flash`.
- `src/createClickGuard.tsx` is one body click handler. HN item links open
  in the app; external links open in a new tab.
- `docs/` holds Byron's blog drafts about the build (Coolify, PWA, the React
  port, threaded comments) and the open backend review. They are background
  reading, not specs, and parts are out of date.

## Rules that matter here

Solid:

- Do not destructure props. Use `<Show>`/`<Switch>`/`<For>`, not `&&` or `.map`.
- Call `useX()` hooks in the component body, never inside effects or handlers.
- Derive with thunks or `createMemo`. Do not write a signal from an effect.
- If an effect calls store code that reads other state, wrap the call in
  `on(source, fn)` or `untrack`. Without it, the effect re-runs on every
  write it causes.
- When many rows watch one value, use `createSelector` so a change wakes one
  row, not all of them.
- Comments render from `kidsObj`; filter with `isValidComment` (a type guard).

UI:

- Keep pages dense and stable, with no layout shift. Mobile first; the column
  is 640px max.
- Use one accent, HN orange, from the theme tokens in `app.css`: `hn` for
  fills, borders, and rails, `hn-ink` for accent text, `hn-soft` for tints.
  Do not add raw orange-\* or hex colors. Orange means "OP", "new", "active",
  or a link.
- `app.css` rules outside `@layer` beat Tailwind utilities. Do not add bare
  element rules (an old `button { margin: 0 }` broke every button margin).
- Motion: CSS keyframes and `lib/scroll.ts`. No animation libraries.
  `prefers-reduced-motion` is honored globally.
- SSR: the comment list shows a skeleton until the client mounts. Keep
  server and client markup the same up to that point.

General:

- Keep files under ~200 lines. Use named exports and type props in the same
  file.
- Do not log in hot paths. `addMessage` feeds the dev-only StatusBar and is
  a no-op in production.
- Write few tests, and only for real behavior (store hydration, comment
  formatting, DB limits).

## Known issues

- `docs/backend-review-2026-01-27.md` is historical. The server rework fixed
  its refresh overlap, non-atomic writes, and uptime-based cadence.
