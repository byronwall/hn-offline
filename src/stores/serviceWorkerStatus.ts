import { createEffect, createSignal } from "solid-js";

import { addMessage } from "./messages";

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

createEffect(() => {
  addMessage("swStatus", serviceWorkerStatus());
});

// Offline mode tracking
export const [isOfflineMode, setIsOfflineMode] = createSignal<boolean>(false);

createEffect(() => {
  const offline = isOfflineMode();
  addMessage(
    "offline",
    offline ? "Entered offline mode" : "Exited offline mode"
  );
});
