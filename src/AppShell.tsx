import { Meta, Title } from "@solidjs/meta";

import GlobalErrorOverlay from "./components/GlobalErrorOverlay";
import { NavBar } from "./components/NavBar";

import type { ParentProps } from "solid-js";

export function AppShell(props: ParentProps) {
  return (
    <main class="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-between bg-white">
      <Title>HN Offline</Title>
      <Meta name="description" content="Hacker News Offline" />
      <NavBar />

      <div class="h-12 w-full" />
      <div class="w-full flex-1 border-x border-b border-slate-300 p-1">
        {props.children}
      </div>
      <GlobalErrorOverlay />
    </main>
  );
}
