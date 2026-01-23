export function formatCommentText(html: string): string {
  if (!html) {
    return "";
  }

  // HN comments usually use <p> tags for line breaks/paragraphs.
  // We split by <p> to process each block.
  // Note: HN HTML is often malformed or just a series of segments separated by <p>.
  // <p> in HN usually means "start of new paragraph", essentially acting as a separator.
  const segments = html.split("<p>");

  const processedSegments = segments.map((segment) => {
    // Check if the segment starts with '>' or '&gt;' (ignoring whitespace)
    // We assume the quote indicator is at the very start of the text content of the paragraph.
    const trimmed = segment.trim();

    // Simple check for > or &gt; at the start
    if (trimmed.startsWith("&gt;") || trimmed.startsWith(">")) {
      // It's a quote. Wrap it.
      // We can use a border-l and some padding/color to verify.
      // Using consistent tailwind classes for "block quote" look.
      return `<div class="pl-3 border-l-4 border-slate-300 italic text-slate-500 my-2">${segment}</div>`;
    }

    // Check if it starts with <pre><code> which is code blocks in HN
    // Code blocks shouldn't be touched usually, but good to know.

    return segment;
  });

  // Rejoin with <p>.
  // IMPORTANT: HN <p> tags are often treating as "lines" rather than closed paragraphs.
  // If we split by <p>, we are removing them. We should put them back as separators or just join them.
  // However, if we wrap a segment in a <div>, that <div> is block level.
  // We might want to be careful about simply joining with <p> again if we introduced divs.

  // If we just join with <p>, we get: "text<p><div class='...'>quote</div><p>more text"
  // Browsers handle this messy HTML reasonably well (implicit closing of p).
  return processedSegments.join("<p>");
}
