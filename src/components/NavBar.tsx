import { A, useLocation } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";

import { cn } from "~/lib/utils";
import { useDataStore } from "~/stores/useDataStore";
import {
  isLocalForageInitialized,
  setShouldHideReadItems,
  shouldHideReadItems,
} from "~/stores/useReadItemsStore";

import { Shell } from "./Icon";

export function NavBar() {
  const refreshCurrent = (url: string) => console.log("REFRESH", url); // useDataStore((s) => s.refreshCurrent);
  const isLoadingData = useDataStore((s) => s.isLoadingData);
  const storyListSaveCount = useDataStore((s) => s.storyListSaveCount);

  const toggleHideReadItems = () => {
    setShouldHideReadItems(!shouldHideReadItems());
  };

  const url = () => useLocation().pathname;

  const handleRefresh = () => {
    if (!url()) {
      return;
    }

    refreshCurrent(url());
  };

  const [didCountChange, setDidCountChange] = createSignal(false);

  createEffect(() => {
    if (storyListSaveCount() > 0) {
      setDidCountChange(true);
    }
    // timer to reset in 1 second
    const timer = setTimeout(() => {
      setDidCountChange(false);
    }, 2000);

    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer);
  });

  const listUrls = ["/", "/day", "/week"];

  const isListUrl = () => listUrls.includes(url());

  return (
    <nav class="flex w-full justify-between items-center space-x-2 border p-1">
      <div class="flex items-center">
        <A href="/" class="flex items-center gap-1 hover:underline">
          <img
            src="/favicon-32x32.png"
            alt="Hacker News Logo"
            class={cn(
              "w-8 h-8",
              { "animate-spin": isLoadingData() },
              { "animate-bounce": didCountChange() },
              { "opacity-20": !isLocalForageInitialized() },
              { "opacity-100": isLocalForageInitialized() }
            )}
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

        <Shell
          size="32"
          color="black"
          class={cn(
            "hover:cursor-pointer hover:stroke-blue-500 transition-colors duration-300 ease-in-out",
            { "animate-spin stroke-orange-500": isLoadingData() }
          )}
          onClick={handleRefresh}
        />
      </div>
    </nav>
  );
}
