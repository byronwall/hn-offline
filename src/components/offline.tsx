import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { onMount } from "solid-js";

import { useMessagesStore } from "~/contexts/AppDataContext";

import { Shell } from "./Icon";

export default function Offline() {
  const messagesStore = useMessagesStore();

  const navigate = useNavigate();
  const [params] = useSearchParams();

  onMount(() => {
    messagesStore.addMessage("Offline", "Loading offline shell");
    // The service worker sends uncached pages here; route back in the client.
    const next = params.next;
    if (typeof next === "string" && /^\/(?!\/)/.test(next)) {
      navigate(next, { replace: true });
    }
  });

  return (
    <div class="flex h-full w-full items-center justify-center p-4">
      <div class="mx-auto w-full max-w-[520px] rounded-md border border-slate-300 bg-white p-6 text-center">
        <div class="bg-hn-soft text-hn-ink ring-hn/30 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ring-1">
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
            end
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
