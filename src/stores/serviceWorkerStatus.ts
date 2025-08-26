import { createSignal } from "solid-js";

export type ServiceWorkerStatus =
  | "unsupported"
  | "registering"
  | "installing"
  | "installed"
  | "activating"
  | "active"
  | "controllerchanged"
  | "error";

const initialStatus: ServiceWorkerStatus =
  typeof navigator !== "undefined" && "serviceWorker" in navigator
    ? "registering"
    : "unsupported";

export const [serviceWorkerStatus, _setServiceWorkerStatus] =
  createSignal<ServiceWorkerStatus>(initialStatus);

export const [serviceWorkerVersion, setServiceWorkerVersion] = createSignal<
  string | undefined
>(undefined);

export const setServiceWorkerStatus = (status: ServiceWorkerStatus) => {
  console.log("*** setting service worker status", status);
  _setServiceWorkerStatus(status);
};
