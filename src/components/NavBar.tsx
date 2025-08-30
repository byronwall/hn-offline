import { A, useLocation } from "@solidjs/router";
import { createEffect, onCleanup, onMount } from "solid-js";

import { cn } from "~/lib/utils";
import { addMessage } from "~/stores/messages";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";

import { Shell } from "./Icon";

export function NavBar() {
  let navRef: HTMLElement | undefined;
  const location = useLocation();

  const forceNavPaint = (reason: string) => {
    if (document.visibilityState !== "visible") {
      return;
    }
    const el = navRef;
    if (!el) {
      return;
    }
    addMessage("nav paint", "force opacity change", reason);
    el.style.setProperty("-webkit-transform", "translateZ(0)");
    const previousOpacity = el.style.opacity;
    el.style.opacity = "0.999";
    requestAnimationFrame(() => {
      el.style.opacity = previousOpacity;
    });
  };

  onMount(() => {
    const handleVisibilityChange = () => {
      forceNavPaint("visibilitychange");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    onCleanup(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  });

  onMount(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) {
        return; // only when restoring from bfcache
      }
      const el = navRef;
      if (!el) {
        return;
      }

      addMessage(
        "nav paint",
        "pageshow: bfcache restore; invalidate composited layer"
      );

      // Toggle position to invalidate the cached composited layer
      const prev = getComputedStyle(el).position; // 'sticky' or 'fixed' or 'static'
      el.style.position = "relative";
      void el.offsetHeight; // force reflow
      el.style.position = prev === "static" ? "" : prev;

      // Secondary nudge: flip transform value then restore
      el.style.transform = "translateZ(1px)";
      requestAnimationFrame(() => {
        el.style.transform = "translateZ(0)";
      });
    };

    window.addEventListener("pageshow", onPageShow);
    onCleanup(() => window.removeEventListener("pageshow", onPageShow));
  });

  // Also force a paint after client-side navigations
  createEffect(() => {
    // Track all parts of the URL that change during navigation
    const current = `${location.pathname}${location.search}${location.hash}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    current;
    forceNavPaint("routechange");
  });

  return (
    <nav
      ref={(el) => {
        navRef = el;
      }}
      class="flex w-full [transform:translateZ(0)] items-center justify-between space-x-2 border border-slate-300 bg-white p-1 will-change-transform [backface-visibility:hidden]"
    >
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
              { "animate-spin text-orange-500": isLoadingData() }
            )}
          >
            <Shell size="32" color="black" />
          </div>
        </div>
      </div>
    </nav>
  );
}
