const colorMap: Record<string, string> = {};

export function stringToColor(
  str: string | undefined,
  isCommentByStoryAuthor: boolean
) {
  if (str === undefined) {
    return "#000000";
  }

  if (isCommentByStoryAuthor) {
    return "#f97316"; // orange color
  }

  if (colorMap[str]) {
    return colorMap[str];
  }

  const minLightness: number = 40;
  const maxLightness: number = 80;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  const s = 70 + (hash % 30); // Saturation between 70% and 100%
  const l = minLightness + (hash % (maxLightness - minLightness)); // Lightness between minLightness and maxLightness

  const color = `hsl(${h}, ${s}%, ${l}%)`;

  colorMap[str] = color;

  return color;
}
