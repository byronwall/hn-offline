import { createEffect, createSignal } from "solid-js";

import type { AddMessage } from "./messages";

export type ServiceWorkerStatus =
  | "unsupported"
  | "registering"
  | "installing"
  | "installed"
  | "activating"
  | "active"
  | "controllerchanged"
  | "error";

export type ServiceWorkerStore = {
  serviceWorkerStatus: () => ServiceWorkerStatus;
  serviceWorkerVersion: () => string | undefined;
  isOfflineMode: () => boolean;
  setServiceWorkerStatus: (status: ServiceWorkerStatus) => void;
  setServiceWorkerVersion: (version: string | undefined) => void;
  setIsOfflineMode: (offline: boolean) => void;
};

export function createServiceWorkerStatusStore(
  addMessage: AddMessage
): ServiceWorkerStore {
  const initialStatus: ServiceWorkerStatus =
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? "registering"
      : "unsupported";

  const [serviceWorkerStatus, setServiceWorkerStatusSignal] =
    createSignal<ServiceWorkerStatus>(initialStatus);

  const [serviceWorkerVersion, setServiceWorkerVersion] = createSignal<
    string | undefined
  >(undefined);

  const [isOfflineMode, setIsOfflineMode] = createSignal<boolean>(false);

  const setServiceWorkerStatus = (status: ServiceWorkerStatus) => {
    console.log("*** setting service worker status", status);
    setServiceWorkerStatusSignal(status);
  };

  createEffect(() => {
    addMessage("swStatus", serviceWorkerStatus());
  });

  createEffect(() => {
    const offline = isOfflineMode();
    addMessage(
      "offline",
      offline ? "Entered offline mode" : "Exited offline mode"
    );
  });

  return {
    serviceWorkerStatus,
    serviceWorkerVersion,
    isOfflineMode,
    setServiceWorkerStatus,
    setServiceWorkerVersion,
    setIsOfflineMode,
  };
}
