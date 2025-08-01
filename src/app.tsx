import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

import "./app.css";
import { NavBar } from "./components/NavBar";

export default function App() {
  return (
    <Router
      root={(props) => (
        <main class="bg-white mx-auto flex min-h-screen flex-col items-center justify-between max-w-[640px] w-full pb-[90vh]">
          <div class="sticky top-0 bg-white z-10 w-full">
            <NavBar />
          </div>
          <div class="border flex-1 w-full p-1">
            <Suspense>{props.children}</Suspense>
          </div>
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
