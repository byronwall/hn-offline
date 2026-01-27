import { Meta, Title } from "@solidjs/meta";
import { type ParentProps, Show } from "solid-js";

import GlobalErrorOverlay from "./components/GlobalErrorOverlay";
import { NavBar } from "./components/NavBar";
import { StatusBar } from "./components/StatusBar";
import { createClickGuard } from "./createClickGuard";

export function AppShell(props: ParentProps) {
  createClickGuard();

  return (
    <main class="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-between bg-white">
      <Title>HN Offline</Title>
      <Meta name="description" content="Hacker News Offline" />
      <NavBar />

      <div class="h-12 w-full" />
      <div class="w-full flex-1 border-x border-b border-slate-300 p-1">
        {props.children}
      </div>
      <Show when={import.meta.env.DEV}>
        <GlobalErrorOverlay />
        <StatusBar />
      </Show>
    </main>
  );
}
