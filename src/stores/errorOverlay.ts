import { type Accessor, createSignal } from "solid-js";

export type AppErrorDetails = {
  id: number;
  name: string;
  message: string;
  stack?: string;
  time: string;
  cause?: unknown;
  extras?: unknown;
};

export type ErrorOverlayStore = {
  isVisible: Accessor<boolean>;
  error: Accessor<AppErrorDetails | null>;
  showErrorOverlay: (errorLike: unknown, extras?: unknown) => void;
  hideErrorOverlay: () => void;
  attachGlobalErrorHandlers: () => void;
  normalizeErrorDetails: (input: unknown, extras?: unknown) => AppErrorDetails;
};

export function createErrorOverlayStore(): ErrorOverlayStore {
  let nextErrorId = 1;

  const [isErrorOverlayVisible, setIsErrorOverlayVisible] = createSignal(false);
  const [currentErrorDetails, setCurrentErrorDetails] = createSignal<
    AppErrorDetails | null
  >(null);

  function safeStringify(value: unknown): string {
    try {
      return JSON.stringify(
        value,
        Object.getOwnPropertyNames(value as object),
        2
      );
    } catch (_) {
      try {
        return String(value);
      } catch {
        return "<unstringifiable value>";
      }
    }
  }

  const normalizeErrorDetails = (
    input: unknown,
    extras?: unknown
  ): AppErrorDetails => {
    const base = {
      id: nextErrorId++,
      name: "Error",
      message: "Unknown error",
      stack: undefined as string | undefined,
      time: new Date().toISOString(),
      cause: undefined as unknown,
      extras,
    };

    if (input instanceof Error) {
      return {
        ...base,
        name: input.name || "Error",
        message: input.message || base.message,
        stack: input.stack,
        cause: (input as unknown as { cause?: unknown }).cause ?? undefined,
      };
    }

    if (typeof input === "string") {
      return { ...base, message: input };
    }

    if (input && typeof input === "object") {
      const anyInput = input as Record<string, unknown>;
      const name = typeof anyInput.name === "string" ? anyInput.name : base.name;
      const message =
        typeof anyInput.message === "string"
          ? anyInput.message
          : safeStringify(input);
      const stack =
        typeof anyInput.stack === "string"
          ? (anyInput.stack as string)
          : undefined;
      return { ...base, name, message, stack };
    }

    return { ...base, message: safeStringify(input) };
  };

  const showErrorOverlay = (errorLike: unknown, extras?: unknown): void => {
    const details = normalizeErrorDetails(errorLike, extras);
    setCurrentErrorDetails(details);
    setIsErrorOverlayVisible(true);
    // Also surface to console for browser devtools
    // eslint-disable-next-line no-console
    console.error("App error:", details.name, details.message, details.stack);
  };

  const hideErrorOverlay = (): void => {
    setIsErrorOverlayVisible(false);
  };

  const attachGlobalErrorHandlers = (): void => {
    if (typeof window === "undefined") {
      return;
    }

    // Avoid multiple registrations
    const marker = "__hn_client_error_handlers_attached__" as const;
    const windowRecord = window as unknown as Record<string, unknown>;
    if (windowRecord[marker]) {
      return;
    }
    windowRecord[marker] = true;

    window.addEventListener("error", (event) => {
      console.error("Unhandled error", event.error || event.message, event);
      showErrorOverlay(event.error || event.message, { type: "error" });
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection", event.reason, event);
      showErrorOverlay(event.reason, { type: "unhandledrejection" });
    });
  };

  return {
    isVisible: isErrorOverlayVisible,
    error: currentErrorDetails,
    showErrorOverlay,
    hideErrorOverlay,
    attachGlobalErrorHandlers,
    normalizeErrorDetails,
  };
}
