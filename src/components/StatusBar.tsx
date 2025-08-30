import { createMemo, createSignal, For, Show } from "solid-js";

import { getMessages } from "~/stores/messages";
import { serviceWorkerVersion } from "~/stores/serviceWorkerStatus";

function formatDelta(deltaMs: number): string {
  if (deltaMs >= 3600000) {
    const h = deltaMs / 3600000;
    return `${h.toFixed(h >= 10 ? 0 : 1)}h`;
  }
  if (deltaMs >= 60000) {
    const m = deltaMs / 60000;
    return `${m.toFixed(m >= 10 ? 0 : 1)}m`;
  }
  const s = deltaMs / 1000;
  if (s >= 1) {
    return `${s.toFixed(s >= 10 ? 0 : 1)}s`;
  }
  return `${Math.round(deltaMs)}ms`;
}

function hashStringToHue(input: string): number {
  let hash = 0;
  for (let idx = 0; idx < input.length; idx++) {
    hash = (hash << 5) - hash + input.charCodeAt(idx);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return hue;
}

export function StatusBar() {
  const [expanded, setExpanded] = createSignal(false);

  const messagesWithMeta = createMemo(() => {
    const list = getMessages();
    const lastTimestampByKey = new Map<string, number>();
    const result = list.map((m) => ({
      m,
      hue: hashStringToHue(m.key),
      delta: undefined as number | undefined,
    }));
    for (let idx = list.length - 1; idx >= 0; idx--) {
      const item = result[idx];
      const prevTs = lastTimestampByKey.get(item.m.key);
      if (prevTs !== undefined) {
        item.delta = prevTs - item.m.timestamp;
      }
      lastTimestampByKey.set(item.m.key, item.m.timestamp);
    }
    return result;
  });

  return (
    <div
      class={`sticky bottom-0 z-10 w-full overflow-hidden border-t border-slate-300 bg-white transition-[height] duration-300 ${
        expanded() ? "h-[300px]" : "h-[36px]"
      }`}
    >
      <div
        class="flex w-full cursor-pointer items-center justify-center space-x-2 p-1 text-sm select-none"
        onClick={() => setExpanded((v) => !v)}
        title="Click to expand"
      >
        <span class="inline-flex items-center gap-2">
          <span class="text-blue-600" title="Service Worker Version">
            {serviceWorkerVersion() ?? "v-"}
          </span>
        </span>
        <span class="ml-2 text-slate-500">
          {expanded() ? "▲" : "▼"} {getMessages().length}
        </span>
      </div>

      <Show when={expanded()}>
        <div class="h-[1px] w-full bg-slate-200" />
        <div class="h-[calc(300px-36px-1px)] overflow-auto p-2">
          <div class="mb-1 text-xs text-slate-500">
            Messages ({getMessages().length})
          </div>
          <div class="space-y-2">
            <For each={messagesWithMeta()}>
              {(entry) => {
                const { m, hue, delta } = entry;
                const bg = `hsl(${hue}, 20%, 96%)`;
                const border = `hsl(${hue}, 20%, 75%)`;
                return (
                  <div
                    class={
                      "grid grid-cols-[120px_1fr] items-start gap-2 rounded border px-2 py-1 text-sm text-slate-700 md:grid-cols-[84px_52px_80px_1fr_auto]"
                    }
                    style={{ "background-color": bg, "border-color": border }}
                  >
                    <div class="col-span-1 flex items-center gap-2 md:col-auto md:contents">
                      <span class="text-[10px] whitespace-nowrap text-slate-500">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </span>
                      <Show
                        when={delta !== undefined}
                        fallback={
                          <span class="text-[10px] whitespace-nowrap text-slate-500" />
                        }
                      >
                        <span class="text-[10px] whitespace-nowrap text-slate-500">
                          +{formatDelta(delta!)}
                        </span>
                      </Show>
                    </div>
                    <span
                      class="col-span-1 col-start-1 row-start-2 min-w-0 rounded px-1 font-mono text-xs break-words md:col-auto md:row-auto"
                      style={{ "background-color": `hsl(${hue}, 20%, 90%)` }}
                    >
                      {m.key}
                    </span>
                    <span class="col-span-1 col-start-2 row-start-1 min-w-0 break-words md:col-auto md:row-auto">
                      {m.message}
                    </span>
                    <div class="col-span-1 flex min-w-0 flex-wrap items-start gap-1 md:col-auto">
                      <For each={m.args}>
                        {(arg) => (
                          <code class="max-w-full rounded bg-slate-100 px-1 py-[1px] text-[11px] break-all text-slate-700">
                            {(() => {
                              try {
                                return typeof arg === "string"
                                  ? arg
                                  : JSON.stringify(arg);
                              } catch {
                                return String(arg);
                              }
                            })()}
                          </code>
                        )}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
