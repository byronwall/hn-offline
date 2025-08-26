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
        <main class="bg-white mx-auto flex min-h-screen flex-col items-center justify-between max-w-[640px] w-full pb-[90vh]">
          <Title>HN Offline</Title>
          <Meta name="description" content="Hacker News Offline" />
          <div class="sticky top-0 bg-white z-10 w-full">
            <NavBar />
          </div>
          <div class="border border-slate-300 flex-1 w-full p-1">
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
