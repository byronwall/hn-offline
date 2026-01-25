import { For, Show } from "solid-js";

import { useErrorOverlay } from "~/contexts/AppDataContext";

function copyToClipboard(text: string): void {
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export default function GlobalErrorOverlay() {
  const errorOverlay = useErrorOverlay();
  const isVisible = errorOverlay.isVisible;
  const error = errorOverlay.error;
  const hide = errorOverlay.hideErrorOverlay;

  const stackLines = () => (error()?.stack ? error()!.stack!.split("\n") : []);
  const fullText = () => {
    const e = error();
    if (!e) {
      return "";
    }
    const parts = [
      `id: ${e.id}`,
      `time: ${e.time}`,
      `${e.name}: ${e.message}`,
      e.stack ?? "<no stack>",
      e.cause ? `cause: ${JSON.stringify(e.cause, undefined, 2)}` : undefined,
      e.extras
        ? `extras: ${JSON.stringify(e.extras, undefined, 2)}`
        : undefined,
    ].filter(Boolean) as string[];
    return parts.join("\n\n");
  };

  return (
    <Show when={isVisible()}>
      <div class="fixed inset-0 z-[9999] bg-black/70 p-4 text-white">
        <div class="mx-auto max-w-[900px] rounded-md bg-zinc-900 p-4 shadow-lg">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Error</h2>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                onClick={() => copyToClipboard(fullText())}
                type="button"
              >
                Copy details
              </button>
              <button
                class="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload
              </button>
              <button
                class="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                onClick={hide}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <div class="mb-3 rounded border border-zinc-700 bg-zinc-950 p-3">
            <div class="mb-1 text-sm text-zinc-400">{error()?.time}</div>
            <div class="break-words whitespace-pre-wrap">
              <span class="font-semibold">{error()?.name}</span>: {" "}
              {error()?.message}
            </div>
          </div>

          <Show when={stackLines().length > 0}>
            <div class="rounded border border-zinc-700 bg-zinc-950 p-3">
              <div class="mb-1 text-sm font-semibold text-zinc-300">
                Stack trace
              </div>
              <pre class="max-h-[50vh] w-full overflow-x-hidden overflow-y-auto text-xs leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap">
                <For each={stackLines()}>{(line) => <div>{line}</div>}</For>
              </pre>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
