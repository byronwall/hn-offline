export function processHtmlAndTruncateAnchorText(html: string) {
  if (typeof document === "undefined") {
    return html;
  }

  const el = document.createElement("div");
  el.innerHTML = html;

  const anchors = el.querySelectorAll("a");

  for (const anchor of anchors) {
    const text = anchor.textContent;
    if (text === null) {
      continue;
    }

    anchor.textContent =
      (text?.slice(0, 30) ?? "") + (text?.length > 30 ? "..." : "");
  }

  return el.innerHTML;
}
