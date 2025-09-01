import { Meta, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";

import GlobalErrorOverlay from "./components/GlobalErrorOverlay";
import { NavBar } from "./components/NavBar";
import { StatusBar } from "./components/StatusBar";
import { showErrorOverlay } from "./stores/errorOverlay";

import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <main class="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-between bg-white">
          <Title>HN Offline</Title>
          <Meta name="description" content="Hacker News Offline" />
          <NavBar />
          <div class="h-12 w-full" />
          <div class="w-full flex-1 border border-slate-300 p-1">
            <ErrorBoundary
              fallback={(err) => {
                // Surface the error overlay in all environments
                showErrorOverlay(err);
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
              <Suspense>{props.children}</Suspense>
            </ErrorBoundary>
          </div>
          <GlobalErrorOverlay />
          <StatusBar />
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
