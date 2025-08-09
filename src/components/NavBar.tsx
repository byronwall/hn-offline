import { A, useLocation } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import { cn } from "~/lib/utils";
import { useDataStore } from "~/stores/useDataStore";
import {
  setShouldHideReadItems,
  shouldHideReadItems,
} from "~/stores/useReadItemsStore";

import { Shell } from "./Icon";

export function NavBar() {
  const refreshCurrent = useDataStore((s) => s.refreshCurrent);
  const isLoadingData = useDataStore((s) => s.isLoadingData);

  const toggleHideReadItems = () => {
    setShouldHideReadItems(!shouldHideReadItems());
  };

  const url = createMemo(() => useLocation().pathname);

  const handleRefresh = () => {
    if (!url()) {
      return;
    }

    refreshCurrent(url());
  };

  const listUrls = ["/", "/day", "/week"];

  const isListUrl = () => listUrls.includes(url());

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
      <Show when={isListUrl()}>
        <div class="flex items-center gap-2">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shouldHideReadItems()}
              onChange={toggleHideReadItems}
              class="peer sr-only"
            />

            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600" />
          </label>
        </div>
      </Show>
      <div class="flex items-center gap-2 text-xl">
        <A href="/day" class="hover:underline">
          day
        </A>
        <A href="/week" class="hover:underline">
          week
        </A>

        <div onClick={handleRefresh}>
          <Shell
            size="32"
            color="black"
            class={cn(
              "hover:cursor-pointer hover:stroke-blue-500 transition-colors duration-300 ease-in-out",
              { "animate-spin stroke-orange-500": isLoadingData() }
            )}
          />
        </div>
      </div>
    </nav>
  );
}
