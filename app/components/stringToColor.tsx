const colorMap: Record<string, string> = {};

const MIN_SATURATION = 30;
const MAX_SATURATION = 75;

const MIN_HUE = 0;
const MAX_HUE = 360;

const MIN_LIGHTNESS = 40;
const MAX_LIGHTNESS = 80;

export function stringToColor(
  str: string | undefined,
  isCommentByStoryAuthor: boolean
) {
  if (str === undefined) {
    return "#000";
  }

  if (isCommentByStoryAuthor) {
    return "#f97316"; // orange color
  }

  if (colorMap[str]) {
    return colorMap[str];
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  hash = Math.abs(hash);

  const h = MIN_HUE + (hash % (MAX_HUE - MIN_HUE)); // Hue between MIN_HUE and MAX_HUE
  const s = MIN_SATURATION + (hash % (MAX_SATURATION - MIN_SATURATION)); // Saturation between MIN_SATURATION and MAX_SATURATION
  const l = MIN_LIGHTNESS + (hash % (MAX_LIGHTNESS - MIN_LIGHTNESS)); // Lightness between minLightness and maxLightness

  const color = `hsl(${h}, ${s}%, ${l}%)`;

  colorMap[str] = color;

  return color;
}
