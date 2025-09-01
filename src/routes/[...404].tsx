import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 text-6xl font-thin text-sky-700 uppercase">
        Page not found
      </h1>
      <p class="mt-8">The page you requested doesn't exist.</p>
      <p class="my-4 flex items-center justify-center gap-4 text-lg">
        <A href="/" class="text-sky-600 hover:underline">
          Home
        </A>
        <A href="/day" class="text-sky-600 hover:underline">
          Day
        </A>
        <A href="/week" class="text-sky-600 hover:underline">
          Week
        </A>
        <A href="/offline" class="text-sky-600 hover:underline">
          Offline
        </A>
      </p>
    </main>
  );
}
