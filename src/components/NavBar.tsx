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
    const stash = { prevPos: "" as string };

    const onPageHide = (e: PageTransitionEvent) => {
      // Only when going into bfcache
      if (!e.persisted || !navRef) {
        return;
      }
      const cs = getComputedStyle(navRef);
      stash.prevPos = cs.position; // remember sticky/fixed/static
      navRef.style.position = "relative"; // disable sticky before snapshot

      addMessage("nav paint", "pagehide: bfcache snapshot; disable sticky");
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (!navRef) {
        return;
      }
      // Restore whatever it was (sticky/fixed) if we changed it
      if (e.persisted && stash.prevPos) {
        navRef.style.position = stash.prevPos;
        // force reflow + layer refresh
        void navRef.offsetHeight;
        navRef.style.transform = "translateZ(1px)";
        requestAnimationFrame(
          () => (navRef!.style.transform = "translateZ(0)")
        );
      }

      addMessage("nav paint", "pageshow: bfcache restore; restore sticky");
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    onCleanup(() => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    });
  });

  onMount(() => {
    const onPop = () => {
      if (!navRef) {
        return;
      }
      addMessage("nav paint", "popstate: invalidate composited layer");

      navRef.style.transform = "translateZ(1px)";
      requestAnimationFrame(() => (navRef!.style.transform = "translateZ(0)"));
    };
    window.addEventListener("popstate", onPop);
    onCleanup(() => window.removeEventListener("popstate", onPop));
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
