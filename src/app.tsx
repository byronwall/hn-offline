// @refresh reload

import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";

import { AppShell } from "./AppShell";
import { AppDataProvider } from "./contexts/AppDataContext";
import { Fallback } from "./Fallback";

import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
          <MetaProvider>
            <AppDataProvider>
              <Suspense fallback={<Fallback />}>
                <AppShell>{props.children}</AppShell>
              </Suspense>
            </AppDataProvider>
          </MetaProvider>
        </ErrorBoundary>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
