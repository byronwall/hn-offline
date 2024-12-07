import { orderBy, uniq } from "lodash-es";
import { mhvcToHex } from "munsell";

import { HnItem, KidsObj3 } from "~/stores/useDataStore";

export function getColorsForStory(story: HnItem): Record<string, string> {
  // iterate through the comments and assign unique colors to each user
  // when assigning colors, avoid collisions on nearby comments and parents
  // map of user to color
  const hueMap: Record<string, number> = {};

  // first color is HN orange
  // assign the first color to the story author
  hueMap[story.by] = 30;

  // now go into the children
  // keep track of the chain of hues being used
  // goal is to avoid collisions to any parent and immediate siblings

  processCommentsForObj(story.kidsObj || [], hueMap, []);

  // convert hue map to color map
  const colorMap: Record<string, string> = {};

  for (const user in hueMap) {
    const hue = hueMap[user];
    colorMap[user] =
      user === story.by ? "hsl(30, 100%, 50%)" : getRandHslForHue(hue);
  }

  return colorMap;
}

const recentHues: number[] = [];

function processCommentsForObj(
  comments: (KidsObj3 | undefined | null)[],
  hueMap: Record<string, number>,
  parentHueChain: number[]
) {
  let trueSiblingsToAvoid: number[] = [];
  let prevHue = null;
  for (const comment of comments) {
    if (!comment || !comment.by) {
      continue;
    }

    const colorsToAvoid = [
      ...parentHueChain,
      ...trueSiblingsToAvoid,
      ...recentHues,
    ];

    if (prevHue !== null) {
      colorsToAvoid.push(prevHue);
    }

    // get hue for this comment
    // either existing author or best color that avoids current ones
    const currentHue =
      hueMap[comment.by] ?? getColorThatAvoidsChain(colorsToAvoid);

    // keep up to 5 recent hues
    recentHues.push(currentHue);
    if (recentHues.length > 4) {
      recentHues.shift();
    }

    // store the hue
    hueMap[comment.by] = currentHue;

    // process children of this comment - will become recursive
    if (comment.kidsObj) {
      const finalChildHue = processCommentsForObj(comment.kidsObj, hueMap, [
        ...parentHueChain,
        currentHue,
      ]);

      // this final child is highly visible when rendered
      trueSiblingsToAvoid = [currentHue, ...finalChildHue];
    } else {
      trueSiblingsToAvoid = [currentHue];
    }

    prevHue = currentHue;
  }

  return trueSiblingsToAvoid;
}

function getRandHslForHue(hue: number): string {
  // method should convert hue from 0-360 to to 0-100
  // then pass through munsell mhvcToHex to get the color

  const h = (hue / 360) * 100;

  const hex = mhvcToHex(h, 4, 30);

  return hex;
}

function getColorThatAvoidsChain(hueChain: number[]): number {
  // find the hues that farthest apart and return the middle
  // this will help avoid collisions
  // sort the chain
  const copyHueChain = orderBy(uniq(hueChain));

  if (copyHueChain.length === 0) {
    return Math.floor(Math.random() * 360);
  }

  if (copyHueChain.length === 1) {
    // rotate 180 degrees
    return (copyHueChain[0] + 180 + Math.random() * 30 - 15) % 360;
  }

  // find the largest gap
  let largestGap = 0;
  let largestGapIndex = 0;

  for (let i = 0; i < copyHueChain.length; i++) {
    // consider wrap around at 360
    const gap =
      i === copyHueChain.length - 1
        ? copyHueChain[0] - copyHueChain[i] + 360
        : copyHueChain[i + 1] - copyHueChain[i];

    if (gap > largestGap) {
      largestGap = gap;
      largestGapIndex = i;
    }
  }

  // pick a random number in the middle fifth of the gap
  let newHue =
    copyHueChain[largestGapIndex] +
    (2 * largestGap) / 5 +
    (Math.random() * largestGap) / 5;

  if (newHue > 360) {
    newHue = newHue % 360;
  }

  // return the middle of the gap
  return newHue;
}
