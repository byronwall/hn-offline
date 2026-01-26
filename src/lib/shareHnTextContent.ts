import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";

import { shareSafely } from "./utils";

type ShareHnTextContentOptions = {
  contentLabel: "Comment" | "Story";
  contentId?: number;
  author?: string;
  contentHtml?: string;
  storyId?: number;
  storyExternalUrl?: string;
  baseUrl?: string;
};

function toPlainText(html: string) {
  let cleanText = sanitizeHtml(html || "");
  cleanText = cleanText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$1");
  cleanText = cleanText.replace(/<p>/g, "\n");
  cleanText = cleanText.replace(/<[^>]+>/g, "");
  cleanText = decode(cleanText);
  return cleanText;
}

export async function shareHnTextContent(
  options: ShareHnTextContentOptions
): Promise<void> {
  if (!options.author || options.contentId === undefined) {
    return;
  }

  const baseUrl = options.baseUrl ?? "https://hn.byroni.us";
  const contentUrl = `${baseUrl}/story/${options.contentId}`;
  const storyHnUrl =
    options.storyId !== undefined && options.storyId !== options.contentId
      ? `${baseUrl}/story/${options.storyId}`
      : "";

  const cleanText = toPlainText(options.contentHtml ?? "");
  const shareTextLines = [
    `${options.contentLabel} by ${options.author} on HN: ${contentUrl}`,
  ];

  if (cleanText.trim().length > 0) {
    shareTextLines.push("", cleanText);
  }

  if (storyHnUrl || options.storyExternalUrl) {
    shareTextLines.push("");
    if (storyHnUrl) {
      shareTextLines.push(`HN story: ${storyHnUrl}`);
    }
    if (options.storyExternalUrl) {
      shareTextLines.push(`Content: ${options.storyExternalUrl}`);
    }
  }

  await shareSafely({
    title: `HN ${options.contentLabel} by ${options.author}`,
    text: shareTextLines.join("\n"),
  });
}
