import { A } from "@solidjs/router";

import { cn } from "~/lib/utils";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";

import { Shell } from "./Icon";

export function NavBar() {
  return (
    <nav class="flex w-full justify-between items-center space-x-2 border p-1">
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
