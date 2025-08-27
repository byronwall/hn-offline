import { createMemo, createSignal, For, Show } from "solid-js";

import { getMessages } from "~/stores/messages";
import {
  serviceWorkerStatus,
  serviceWorkerVersion,
} from "~/stores/serviceWorkerStatus";

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
      class={`sticky bottom-0 bg-white z-10 w-full border-t border-slate-300 transition-[height] duration-300 overflow-hidden ${
        expanded() ? "h-[300px]" : "h-[36px]"
      }`}
    >
      <div
        class="flex w-full justify-center items-center space-x-2 p-1 text-sm cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        title="Click to expand"
      >
        <span class="inline-flex items-center gap-2">
          <span class="text-green-600" title="Service Worker Status">
            {serviceWorkerStatus()}
          </span>
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
        <div class="p-2 h-[calc(300px-36px-1px)] overflow-auto">
          <div class="text-xs text-slate-500 mb-1">
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
                      "text-sm rounded px-2 py-1 flex flex-wrap items-start gap-2 border text-slate-700 md:grid md:grid-cols-[84px_52px_80px_1fr_auto]"
                    }
                    style={{ "background-color": bg, "border-color": border }}
                  >
                    <span class="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                    <Show
                      when={delta !== undefined}
                      fallback={
                        <span class="text-[10px] text-slate-500 whitespace-nowrap" />
                      }
                    >
                      <span class="text-[10px] text-slate-500 whitespace-nowrap">
                        +{formatDelta(delta!)}
                      </span>
                    </Show>
                    <span
                      class="font-mono text-xs px-1 rounded truncate"
                      style={{ "background-color": `hsl(${hue}, 20%, 90%)` }}
                    >
                      {m.key}
                    </span>
                    <span class="min-w-0 break-words basis-full md:basis-auto">
                      {m.message}
                    </span>
                    <div class="flex flex-wrap gap-1 basis-full md:basis-auto">
                      <For each={m.args}>
                        {(arg) => (
                          <code class="text-[11px] bg-slate-100 text-slate-700 px-1 py-[1px] rounded">
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
