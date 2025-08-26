import { A } from "@solidjs/router";

import { cn } from "~/lib/utils";
import { isOnline } from "~/stores/networkStatus";
import {
  serviceWorkerStatus,
  serviceWorkerVersion,
} from "~/stores/serviceWorkerStatus";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";

import { Shell } from "./Icon";

export function NavBar() {
  return (
    <nav class="flex w-full justify-between items-center space-x-2 border border-slate-300 p-1">
      <div class="flex items-center">
        <A href="/" class="flex items-center gap-1 hover:underline">
          <img
            src="/favicon-32x32.png"
            alt="Hacker News Logo"
            class={cn("w-8 h-8", {
              "animate-spin": isLoadingData(),
            })}
          />
          <h1 class="text-2xl font-bold">Offline</h1>
        </A>
      </div>

      <div class="flex-1 text-center text-sm">
        <span class="inline-flex items-center gap-2">
          <span class="text-red-600" title="Offline">
            {isOnline() ? "Online" : "Offline"}
          </span>

          <span class="text-green-600" title="Service Worker Active">
            {serviceWorkerStatus()}
          </span>
          <span class="text-blue-600" title="Service Worker Version">
            {serviceWorkerVersion() ?? "v-"}
          </span>
        </span>
      </div>

      <div class="flex items-center gap-2 text-xl">
        <A href="/day" class="hover:underline">
          day
        </A>
        <A href="/week" class="hover:underline">
          week
        </A>

        <div onClick={refreshActive}>
          <div
            class={cn(
              "hover:cursor-pointer hover:stroke-blue-500 transition-colors duration-300 ease-in-out",
              { "animate-spin stroke-orange-500": isLoadingData() }
            )}
          >
            <Shell size="32" color="black" />
          </div>
        </div>
      </div>
    </nav>
  );
}
