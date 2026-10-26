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
| Build          | `pnpm build` (also stamps the version into `public/sw.js`; revert that file before you commit)          |
| Run prod build | `PORT=3219 node .output/server/index.mjs`                                                               |
| Dev            | `pnpm dev`                                                                                              |

Verify UI against the production build. In dev, a HEAD request that races a
lazy route (the Claude browser pane sends one) can render
"useAppData must be used within AppDataProvider". That is a dev-only race,
not a bug in the app. curl and real browsers do not hit it.

The server fetches live HN data on startup, so the first request after start
can take a few seconds. The JSON database path comes from `db_path`.

## How data flows

```
HN Firebase API + Algolia ──> src/server/server.ts (refresh every 10 min:
                              top; day hourly; week every 6 h)
                              └─> JSON DB (database.ts) + in-memory cachedData
src/server/queries.ts (query() + "use server")
  getStorySummariesByType  ── list pages, SSR: summaries only (~100 KB HTML)
  getStoryListByType       ── full stories + comment trees, client background fetch
  getStoryById             ── one story with comments
Client stores (src/stores, created in contexts/AppDataContext.tsx)
  useDataStore      list + story loading, refresh, IndexedDB writes (raw_<id>)
  createPersistedStore  Solid store mirrored to one localForage key
  useReadItemsStore READ_ITEMS, READ_COMMENT_COUNTS, READ_SETTINGS
  useCommentStore   COLLAPSED_COMMENTS
  useRefreshStore   refresh timestamps per page
  storyUiStore      open story, author colors (memo), last visit time
```

- List page: SSR shows summaries. After hydration, `syncStoryList` saves them
  and fetches the full stories in the background so every story on the page
  reads offline.
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

- The service worker never registers in production. `serviceWorkerStatus.ts`
  registers `/_build/sw.js`, but that file is not built since VitePWA was
  commented out in `app.config.ts`. `public/sw.js` is served at `/sw.js`.
  Pick one before you rely on offline first loads.
- Server backlog: see `docs/backend-review-2026-01-27.md` (refresh overlap,
  non-atomic DB writes, uptime-based cadence).
