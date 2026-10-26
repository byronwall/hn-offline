const wait = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

// IndexedDB calls fail now and then (Safari, private tabs, quota). Retry with
// backoff (250ms, 500ms, ...) before giving up.
export async function withRetries<T>(
  operation: () => Promise<T>,
  onRetry?: (attempt: number, delayMs: number) => void,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      const delayMs = 250 * 2 ** (attempt - 1);
      onRetry?.(attempt, delayMs);
      await wait(delayMs);
    }
  }
}
