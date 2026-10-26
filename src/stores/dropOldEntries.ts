const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Keep only ids stamped (Date.now()) within the last week.
export function dropOldEntries(map: Record<number, number>) {
  const cutoff = Date.now() - ONE_WEEK_MS;
  return Object.fromEntries(
    Object.entries(map).filter(
      ([, ts]) => typeof ts === "number" && ts > cutoff
    )
  ) as Record<number, number>;
}
