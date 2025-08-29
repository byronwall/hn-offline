import { createEffect, createSignal, ParentProps, Show } from "solid-js";

import { isLoadingData } from "~/stores/useDataStore";

type PullToRefreshProps = ParentProps<{
  onRefresh: () => Promise<void> | void;
  activationThreshold?: number;
  disabled?: boolean;
}>;

export function PullToRefresh(props: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = createSignal(0);
  const [isPulling, setIsPulling] = createSignal(false);
  const [isRefreshing, setIsRefreshing] = createSignal(false);

  let startY = 0;
  const activationThreshold = () => props.activationThreshold ?? 64;

  const shouldDisable = () => props.disabled === true;

  const onTouchStart = (ev: TouchEvent) => {
    if (typeof window === "undefined" || shouldDisable()) {
      return;
    }
    if (isLoadingData() || isRefreshing()) {
      return;
    }
    if (window.scrollY > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    startY = ev.touches[0]?.clientY ?? 0;
    setIsPulling(true);
    setPullDistance(0);
  };

  const onTouchMove = (ev: TouchEvent) => {
    if (!isPulling()) {
      return;
    }
    const currentY = ev.touches[0]?.clientY ?? 0;
    const delta = currentY - startY;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    const damped = Math.min(160, delta * 0.5);
    setPullDistance(damped);
  };

  const onTouchEnd = async () => {
    if (!isPulling()) {
      return;
    }
    const shouldRefresh =
      pullDistance() >= activationThreshold() && !isLoadingData();
    setIsPulling(false);
    if (shouldRefresh) {
      setIsRefreshing(true);
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          (
            navigator as unknown as {
              vibrate: (p: number | number[]) => boolean;
            }
          ).vibrate(20);
        }
      } catch (_err) {
        /* noop */
      }

      await props.onRefresh();
    }
    setPullDistance(0);
  };

  createEffect(() => {
    if (!isLoadingData() && isRefreshing()) {
      setIsRefreshing(false);
    }
  });

  return (
    <div
      class="w-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ "touch-action": "pan-y" }}
    >
      <div
        class="flex items-center justify-center text-sm text-slate-500 transition-[height] duration-150 ease-out select-none"
        style={{ height: `${pullDistance()}px` }}
      >
        <Show when={pullDistance() > 0}>
          <span>
            {pullDistance() >= activationThreshold()
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </Show>
      </div>

      {props.children}
    </div>
  );
}
