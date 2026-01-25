import { createSignal } from "solid-js";

export type ColorMapStore = {
  colorMap: () => Record<string, string>;
  setColorMap: (map: Record<string, string>) => void;
};

export function createColorMapStore(): ColorMapStore {
  const [colorMap, setColorMap] = createSignal<Record<string, string>>({});

  return {
    colorMap,
    setColorMap,
  };
}
