import {
  serviceWorkerStatus,
  serviceWorkerVersion,
} from "~/stores/serviceWorkerStatus";

export function StatusBar() {
  return (
    <div class="sticky bottom-0 bg-white z-10 w-full">
      <div class="flex w-full justify-center items-center space-x-2 border border-slate-300 p-1 text-sm">
        <span class="inline-flex items-center gap-2">
          <span class="text-green-600" title="Service Worker Status">
            {serviceWorkerStatus()}
          </span>
          <span class="text-blue-600" title="Service Worker Version">
            {serviceWorkerVersion() ?? "v-"}
          </span>
        </span>
      </div>
    </div>
  );
}
