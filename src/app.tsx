import { Meta, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Show, Suspense, type ParentProps } from "solid-js";

import { AppDataProvider, useErrorOverlay } from "~/contexts/AppDataContext";

import GlobalErrorOverlay from "./components/GlobalErrorOverlay";
import { NavBar } from "./components/NavBar";
import { StatusBar } from "./components/StatusBar";

import "./app.css";

function AppShell(props: ParentProps) {
  const errorOverlay = useErrorOverlay();

  return (
    <main class="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-between bg-white">
      <Title>HN Offline</Title>
      <Meta name="description" content="Hacker News Offline" />
      <NavBar />
      <div class="h-12 w-full" />
      <div class="w-full flex-1 border-x border-b border-slate-300 p-1">
        <ErrorBoundary
          fallback={(err) => {
            // Surface the error overlay in all environments
            errorOverlay.showErrorOverlay(err);
            return (
              <div class="flex flex-col items-start gap-2 rounded border border-red-300 bg-red-50 p-3 text-red-800">
                <div class="font-semibold">Something went wrong</div>
                {/* reload the age */}
                <button
                  class="my-2 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none active:bg-slate-100"
                  onClick={() => {
                    window.location.reload();
                  }}
                  type="button"
                >
                  Reload
                </button>
                <pre class="text-xs whitespace-pre-wrap">{String(err)}</pre>
              </div>
            );
          }}
        >
          <Suspense fallback={<div class="relative pb-[70vh]" />}>
            {props.children}
          </Suspense>
        </ErrorBoundary>
      </div>
      <GlobalErrorOverlay />
      <Show when={import.meta.env.DEV}>
        <StatusBar />
      </Show>
    </main>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense fallback={<div class="relative pb-[70vh]" />}>
          <AppDataProvider>
            <AppShell>{props.children}</AppShell>
          </AppDataProvider>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
