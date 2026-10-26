import { A } from "@solidjs/router";
import { For, Show } from "solid-js";

import { useDataStore, useServiceWorkerStore } from "~/contexts/AppDataContext";
import { cn } from "~/lib/utils";

import { Shell } from "./Icon";

const tabs = [
  { href: "/", label: "Top" },
  { href: "/day", label: "Day" },
  { href: "/week", label: "Week" },
];

export function NavBar() {
  const dataStore = useDataStore();
  const serviceWorker = useServiceWorkerStore();

  return (
    <nav class="fixed top-0 left-1/2 z-10 flex h-12 w-full max-w-[640px] -translate-x-1/2 items-center gap-3 border border-slate-300 bg-white px-2">
      <A href="/" end class="flex shrink-0 items-center gap-1" title="Top">
        <img src="/favicon-32x32.png" alt="" class="h-7 w-7" />
        <h1 class="text-xl font-bold">Offline</h1>
      </A>

      <div class="flex h-full items-stretch gap-1 text-[15px]">
        <For each={tabs}>
          {(tab) => (
            <A
              href={tab.href}
              end
              class="flex items-center border-b-2 px-2 text-slate-500 transition-colors duration-150 hover:text-slate-900"
              activeClass="border-orange-500 font-semibold text-slate-900"
              inactiveClass="border-transparent"
            >
              {tab.label}
            </A>
          )}
        </For>
      </div>

      <Show when={serviceWorker.isOfflineMode()}>
        <span class="ml-auto text-sm text-slate-500">Offline</span>
      </Show>
      <Show when={!serviceWorker.isOfflineMode()}>
        <button
          type="button"
          aria-label="Refresh"
          title="Refresh"
          disabled={dataStore.isLoadingData()}
          onClick={() => dataStore.refreshActive()}
          // -my-3/py-3 grows the tap target past the icon
          class="-my-3 ml-auto px-2 py-3 text-slate-700 transition-colors duration-150 hover:text-orange-600 focus-visible:text-orange-600"
        >
          <Shell
            width="26"
            height="26"
            class={cn({
              "animate-spin text-orange-500": dataStore.isLoadingData(),
            })}
          />
        </button>
      </Show>
    </nav>
  );
}
