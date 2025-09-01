import { A } from "@solidjs/router";
import { Show } from "solid-js";

import { cn } from "~/lib/utils";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";

import { Shell } from "./Icon";

export function NavBar() {
  return (
    <nav class="fixed top-0 left-1/2 z-10 flex h-12 w-full max-w-[640px] -translate-x-1/2 items-center justify-between space-x-2 border border-slate-300 bg-white p-1">
      <div class="flex items-center">
        <A href="/" class="flex items-center gap-1 hover:underline">
          <img
            src="/favicon-32x32.png"
            alt="Hacker News Logo"
            class={cn("h-8 w-8", {
              "animate-spin": isLoadingData(),
            })}
          />
          <h1 class="text-2xl font-bold">Offline</h1>
        </A>
      </div>
      <div class="flex items-center gap-2 text-xl">
        <A href="/day" class="hover:underline">
          day
        </A>
        <A href="/week" class="hover:underline">
          week
        </A>
        <Show when={!isOfflineMode()}>
          <div
            onClick={() => {
              if (isOfflineMode()) {
                return;
              }
              refreshActive();
            }}
          >
            <div
              class={cn(
                "transition-colors duration-300 ease-in-out hover:cursor-pointer hover:text-blue-500",
                { "animate-spin text-orange-500": isLoadingData() }
              )}
            >
              <Shell size="32" color="black" />
            </div>
          </div>
        </Show>
      </div>
    </nav>
  );
}
