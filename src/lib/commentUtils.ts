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
    if (segment.includes("<pre><code>")) {
      // Regex to extract content within <pre><code>...</code></pre>
      // We do a simple replacer to handle the content
      return segment.replace(
        /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
        (match: string, codeContent: string) => {
          // 1. Split into lines
          const lines = codeContent.split("\n");

          // 2. Determine common indent (longest common prefix of leading whitespace)
          const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

          if (nonEmptyLines.length === 0) {
            return `<pre><code>${lines.join("\n")}</code></pre>`;
          }

          // Get leading whitespace of first line as candidate
          let commonPrefix = nonEmptyLines[0].match(/^[ \t]*/)?.[0] || "";

          for (let i = 1; i < nonEmptyLines.length; i++) {
            const line = nonEmptyLines[i];
            const currentWhitespace = line.match(/^[ \t]*/)?.[0] || "";

            // Reduce commonPrefix to match current line's whitespace
            let j = 0;
            while (
              j < commonPrefix.length &&
              j < currentWhitespace.length &&
              commonPrefix[j] === currentWhitespace[j]
            ) {
              j++;
            }
            commonPrefix = commonPrefix.slice(0, j);

            if (commonPrefix.length === 0) break;
          }

          // 3. Strip indent
          const strippedLines = lines.map((line) => {
            // Only strip if line starts with the common prefix (it should if non-empty, but check)
            if (line.startsWith(commonPrefix)) {
              return line.slice(commonPrefix.length);
            }
            return line;
          });

          const newContent = strippedLines.join("\n");
          return `<pre><code>${newContent}</code></pre>`;
        }
      );
    }

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
