# Frontend Review (Jan 27, 2026)

Scope: SolidJS frontend code under `src/` (routes, components, features, and shared libs).

## Gaps / Weaknesses

1. **Anchor click guard misses nested clicks + security attributes**

- **Where:** `src/createClickGuard.tsx`
- **Issue:** The handler only checks `e.target.tagName === "A"`, so clicks on child elements inside a link do not get handled. It also sets `target="_blank"` without `rel="noopener noreferrer"`.
- **Why it matters:** External link handling and internal route rerouting won’t work reliably; missing `rel` is a security risk.
- **Proposed fix:** Use `const link = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;` and early return if `!link`. When setting `target`, also set `rel`. Consider `link.rel = "noopener noreferrer"`.

2. **Hook usage is non-idiomatic in `createClickGuard`**

- **Where:** `src/createClickGuard.tsx`
- **Issue:** `useNavigate()` is invoked inside `onMount`. This isn’t a functional bug today, but it makes hook usage harder to reason about and can trip lint rules or future refactors.
- **Proposed fix:** Call `useNavigate()` at the top of `createClickGuard` so hook usage remains consistent and predictable.

3. **Invalid/NaN story id is not handled**

- **Where:** `src/routes/story/[id].tsx`
- **Issue:** `id = createMemo(() => +params.id)` will be `NaN` for invalid params (e.g., `/story/abc`), which is then passed into `getStoryById` and store updates.
- **Why it matters:** Potential server call with invalid ID and undefined behavior in UI/state.
- **Proposed fix:** Guard with `Number.isFinite(id())` and show a 404 or redirect. Example: if invalid, return a small “Not Found” view or throw to an `ErrorBoundary`.

4. **No Suspense for story list data**

- **Where:** `src/features/storyList/StoryListRoute.tsx`
- **Issue:** TODO indicates missing Suspense + skeleton. Without it, list routes can render empty state or flicker on hydration.
- **Proposed fix:** Wrap `ServerStoryList` with `<Suspense fallback={<StoryListSkeleton />}>`. Add a lightweight skeleton component that preserves layout height to avoid jump.

5. **DOM-only HTML processing causes SSR/CSR mismatch risk**

- **Where:** `src/lib/processHtmlAndTruncateAnchorText.tsx`
- **Issue:** On server, HTML is returned as-is; on client, anchors are truncated via `document`. This can cause markup differences between SSR and hydration.
- **Proposed fix:** Use a string-based HTML parser (e.g., `htmlparser2`) that runs on both server and client. Alternatively, keep SSR output consistent by doing truncation at data fetch time or apply a CSS-based truncation without mutating HTML.

6. **Unsanitized `innerHTML` usage**

- **Where:** `src/features/comments/HnComment.tsx`, `src/features/comments/HnStoryContentCard.tsx`
- **Issue:** Raw HTML is inserted via `innerHTML` without explicit sanitization. HN content is generally safe, but this is an XSS boundary.
- **Proposed fix:** Add a small sanitizer (whitelist tags and attributes) before `innerHTML`, or use a vetted sanitizer (e.g., `DOMPurify`) if acceptable for bundle size. If relying on upstream sanitization, document that assumption and add a guard for unexpected tags.

7. **Icon buttons are not keyboard-accessible**

- **Where:** `src/components/NavBar.tsx`
- **Issue:** The refresh action is bound to a `<div>` with an `onClick`. This is not keyboard-focusable and lacks button semantics.
- **Proposed fix:** Replace with `<button type="button">` and move the icon inside. If you have a shared `IconButton`, use it to match the UI guidelines.

8. **`Icon` components use `any` and ignore `size` prop**

- **Where:** `src/components/Icon.tsx`
- **Issue:** Props are `any` (violates repo TS rules) and `Shell` ignores `size` even though callers pass it. That is a functional bug (size prop has no effect).
- **Proposed fix:** Type props as `JSX.SvgSVGAttributes<SVGSVGElement>` (or `ComponentProps<"svg">`). Add a `size?: number | string` prop and apply it to `width/height` so callers can control sizing.

9. **Console logging in production paths**

- **Where:** `src/features/storyList/StoryListRoute.tsx`, `src/features/storyList/HnListItem.tsx`, `src/routes/day.tsx`, `src/app.tsx`
- **Issue:** `console.log/console.warn` are used in production execution paths, which can leak noise in user consoles.
- **Proposed fix:** Guard with `if (import.meta.env.DEV)` or replace with the existing `messages` store if logs are meant for the debug overlay.

10. **`HnCommentList` lazy-load pump is overly complex/expensive**

- **Where:** `src/features/comments/HnCommentList.tsx`
- **Issue:** A RAF loop increments `visibleCount` while intersecting, with `BATCH_SIZE=1`. This can drive heavy re-renders for long threads and is hard to reason about.
- **Proposed fix:** Increment by a chunk (e.g., 10–20) per intersection event, or throttle updates (e.g., `setTimeout` at 100–200ms). Consider a simpler “Load more” button fallback for very long threads.

11. **`setTimeout` in `HnStoryContentCard` lacks cleanup**

- **Where:** `src/features/comments/HnStoryContentCard.tsx`
- **Issue:** `setTimeout` fires even if the component unmounts quickly; it can dispatch `setScrollToId` after unmount.
- **Proposed fix:** Store the timeout id and clear it in `onCleanup`.

12. **Raw hex colors in CSS bypass token usage**

- **Where:** `src/app.css`
- **Issue:** `#f6f6f6` and `#ff6600` violate the “token usage only” guideline.
- **Proposed fix:** Replace with Tailwind utilities where possible or define CSS variables for palette tokens and reference them in CSS.

## Verbosity / Clarity

1. **`formatCommentText` is hard to test and reason about**

- **Where:** `src/lib/commentUtils.ts`
- **Issue:** The function mixes parsing logic, quoting rules, and code-block normalization inline, which makes behavior opaque and hard to extend.
- **Proposed fix:** Split into small helpers: `wrapQuotes`, `normalizeCodeBlocks`, `splitParagraphs`, each unit-tested with sample HN HTML input.

2. **`getColorsForStory` uses shared mutable state**

- **Where:** `src/lib/getColorsForStory.tsx`
- **Issue:** Global `recentHues` is mutated, which obscures data flow and makes reuse harder.
- **Proposed fix:** Move `recentHues` into local scope inside `getColorsForStory` and pass through recursion so the function is pure for a given input.

3. **`useSortFunction` is named like a hook but is a pure utility**

- **Where:** `src/hooks/useSortFunction.tsx`
- **Issue:** Name suggests a hook with reactive behavior, but it’s a pure function. This can confuse maintainers.
- **Proposed fix:** Rename to `sortStories` or move to `src/lib/sortStories.ts` to clarify intent.

4. **Repeated “Refresh now” button logic**

- **Where:** `src/features/storyList/HnStoryListRefreshBar.tsx`
- **Issue:** The refresh button logic is duplicated for the main button and the request message button.
- **Proposed fix:** Extract a small `RefreshButton` component or helper function to reduce repetition and keep behavior consistent.

5. **List rendering conditions are scattered**

- **Where:** `src/features/storyList/HnStoryListBody.tsx`, `src/features/storyList/HnStoryListItems.tsx`
- **Issue:** Filtering, sorting, and hide-read logic are split across components, making the list rules harder to follow.
- **Proposed fix:** Move list filtering/sorting into a single memo in `HnStoryListBody` and pass only the ready-to-render items to `HnStoryListItems`.

## Optional quality improvements

- Add route-level `ErrorBoundary` around `StoryListRoute` and `HnStoryPage` to align with the repo guideline that “major feature islands” be protected.
- Consider `min-height` on list and comments sections to reduce layout shift on initial load.
