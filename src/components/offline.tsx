import { A } from "@solidjs/router";
import { onMount } from "solid-js";

import { addMessage } from "~/stores/messages";

import { Shell } from "./Icon";

export default function Offline() {
  onMount(() => {
    addMessage("Offline", "Loading offline shell");
  });

  return (
    <div class="flex h-full w-full items-center justify-center p-4">
      <div class="mx-auto w-full max-w-[520px] rounded-md border border-slate-300 bg-white p-6 text-center">
        <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-200">
          <Shell />
        </div>
        <h2 class="text-2xl font-semibold">You are offline</h2>
        <p class="mt-1 text-slate-600">
          This is the offline shell. You can still browse cached pages or try to
          reconnect.
        </p>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          <A
            href="/"
            class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none active:bg-slate-100"
          >
            Home
          </A>
          <A
            href="/day"
            class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none active:bg-slate-100"
          >
            Day
          </A>
          <A
            href="/week"
            class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none active:bg-slate-100"
          >
            Week
          </A>
        </div>

        <div class="mt-6 text-xs text-slate-500">
          Tip: Add this app to your home screen for the best offline experience.
        </div>
      </div>
    </div>
  );
}
