import { A } from "@solidjs/router";

import { cn } from "~/lib/utils";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";

import { Shell } from "./Icon";

export function NavBar() {
  return (
    <nav class="flex w-full [transform:translateZ(0)] items-center justify-between space-x-2 border border-slate-300 bg-white p-1 will-change-transform [backface-visibility:hidden]">
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

        <div onClick={refreshActive}>
          <div
            class={cn(
              "transition-colors duration-300 ease-in-out hover:cursor-pointer hover:text-blue-500",
              { "animate-spin text-orange-500": isLoadingData() },
            )}
          >
            <Shell size="32" color="black" />
          </div>
        </div>
      </div>
    </nav>
  );
}
