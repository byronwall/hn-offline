import { createSignal } from "solid-js";

export const [isOnline, setIsOnline] = createSignal<boolean>(
  typeof navigator === "undefined" ? true : navigator.onLine
);

export function setupNetworkListeners() {
  if (typeof window === "undefined") {
    return;
  }

  const onlineHandler = () => setIsOnline(true);
  const offlineHandler = () => setIsOnline(false);

  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);
}
