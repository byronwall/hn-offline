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

export const [serviceWorkerStatus, setServiceWorkerStatus] =
  createSignal<ServiceWorkerStatus>(initialStatus);

export const [serviceWorkerVersion, setServiceWorkerVersion] = createSignal<
  string | undefined
>(undefined);
