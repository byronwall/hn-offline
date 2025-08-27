import { createSignal, For, Show } from "solid-js";

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

export function StatusBar() {
  const [expanded, setExpanded] = createSignal(false);

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
        <span class="ml-2 text-slate-500">{expanded() ? "▲" : "▼"}</span>
      </div>

      <Show when={expanded()}>
        <div class="h-[1px] w-full bg-slate-200" />
        <div class="p-2 h-[calc(300px-36px-1px)] overflow-auto">
          <div class="text-xs text-slate-500 mb-1">
            Messages ({getMessages().length})
          </div>
          <div class="space-y-2">
            <For each={getMessages()}>
              {(m, i) => (
                <div
                  class={`text-sm border rounded px-2 py-1 flex items-start gap-2 ${
                    m.level === "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : m.level === "warn"
                      ? "border-amber-300 text-amber-800 bg-amber-50"
                      : "border-slate-200 text-slate-700 bg-slate-50"
                  }`}
                >
                  <span class="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                  <Show when={getMessages()[i() + 1]}>
                    {(() => {
                      const prev = getMessages()[i() + 1]!;
                      const delta = m.timestamp - prev.timestamp;
                      return (
                        <span class="text-[10px] text-slate-400 whitespace-nowrap">
                          +{formatDelta(delta)}
                        </span>
                      );
                    })()}
                  </Show>
                  <span class="flex-1">{m.text}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
