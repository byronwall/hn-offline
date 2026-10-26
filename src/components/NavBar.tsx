import { A } from "@solidjs/router";
import { Show } from "solid-js";

import { useDataStore, useServiceWorkerStore } from "~/contexts/AppDataContext";
import { cn } from "~/lib/utils";

import { Shell } from "./Icon";

export function NavBar() {
  const dataStore = useDataStore();
  const serviceWorker = useServiceWorkerStore();

  return (
    <nav class="fixed top-0 left-1/2 z-10 flex h-12 w-full max-w-[640px] -translate-x-1/2 items-center justify-between space-x-2 border border-slate-300 bg-white p-1">
      <div class="flex items-center">
        <A
          href="/"
          class="flex items-center gap-1 hover:underline focus-visible:underline active:underline"
          end
        >
          <img
            src="/favicon-32x32.png"
            alt="Hacker News Logo"
            class={cn("h-8 w-8", {
              "animate-spin": dataStore.isLoadingData(),
            })}
          />
          <h1 class="text-2xl font-bold">Offline</h1>
        </A>
      </div>
      <div class="flex items-center gap-2 text-xl">
        <A
          href="/day"
          class="hover:underline focus-visible:underline active:underline"
        >
          day
        </A>
        <A
          href="/week"
          class="hover:underline focus-visible:underline active:underline"
        >
          week
        </A>
        <Show when={!serviceWorker.isOfflineMode()}>
          <button
            type="button"
            aria-label="Refresh"
            title="Refresh"
            disabled={dataStore.isLoadingData()}
            onClick={() => dataStore.refreshActive()}
            // -my-3/py-3 grows the tap target past the icon
            class="-my-3 px-2 py-3 transition-colors duration-300 ease-in-out hover:text-blue-500 focus-visible:text-blue-500"
          >
            <Shell
              width="32"
              height="32"
              class={cn({
                "animate-spin text-orange-500": dataStore.isLoadingData(),
              })}
            />
          </button>
        </Show>
      </div>
    </nav>
  );
}
