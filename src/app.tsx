import { Meta, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

import { NavBar } from "./components/NavBar";
import { StatusBar } from "./components/StatusBar";

import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <main class="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-between bg-white">
          <Title>HN Offline</Title>
          <Meta name="description" content="Hacker News Offline" />
          <div class="sticky top-0 z-10 w-full bg-white">
            <NavBar />
          </div>
          <div class="w-full flex-1 border border-slate-300 p-1">
            <Suspense>{props.children}</Suspense>
          </div>
          <StatusBar />
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
