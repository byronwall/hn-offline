import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { formatCommentText } from "./commentUtils";

const window = new Window();
const document = window.document;

describe("formatCommentText", () => {
  const parseHtml = (html: string) => {
    document.body.innerHTML = html;
    return document.body;
  };

  it("handles empty input", () => {
    expect(formatCommentText("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    const input = "Hello world";
    expect(formatCommentText(input)).toBe("Hello world");
  });

  it("detects a simple block quote with >", () => {
    const input = "> This is a quote";
    const output = formatCommentText(input);
    expect(output).toContain("This is a quote");

    // Check structure
    const body = parseHtml(output);
    const div = body.querySelector("div");
    expect(div).not.toBeNull();
    expect(div?.textContent).toContain("This is a quote");
  });

  it("detects a block quote with &gt;", () => {
    const input = "&gt; This is a quote";
    const output = formatCommentText(input);
    expect(output).toContain("This is a quote");
  });

  it("handles quote amidst paragraphs", () => {
    const input = "First line<p>> Quote line<p>Reply line";
    const output = formatCommentText(input);

    // Expect: "First line" ... <p> ... <div ...>Quote line</div> ... <p> ... "Reply line"
    expect(output).toContain("First line");
    expect(output).toContain("Reply line");
    expect(output).toContain("<div");

    const body = parseHtml(output);
    expect(body.childNodes.length).toBeGreaterThan(0);
    // Rough check of content
    expect(body.textContent).toContain("First line");
    expect(body.textContent).toContain("Quote line");
    expect(body.textContent).toContain("Reply line");
  });

  it("preserves links inside quotes", () => {
    const input = "> Quote with <a href='foo'>link</a>";
    const output = formatCommentText(input);
    expect(output).toContain("<a href='foo'>link</a>");
    expect(output).toContain("Quote with");
  });

  it("detects block quote in complex user example", () => {
    const input = "&gt; I've often dreamed of a system...<p>Have a bot...";
    const output = formatCommentText(input);
    expect(output).toContain("I've often dreamed");
  });

  it("does not mix up code blocks", () => {
    // HN code blocks: <pre><code>...</code></pre>
    const input = "<pre><code>> not a quote</code></pre>";
    // Our logic splits by <p>, so if this is one block, it shouldn't split inside pre.
    // However, if the user starts a line with > inside a paragraph that is just text, it triggers.
    // If it starts with <pre>, then trimmed it starts with <.
    const output = formatCommentText(input);
    expect(output).not.toContain("border-l-4");
    expect(output).toBe(input);
  });

  it("removes common indentation from code blocks", () => {
    const input = `<pre><code>    line 1
    line 2
      indented line 3</code></pre>`;

    // We expect the 4 spaces to be removed from line 1 and 2, and 4 spaces from line 3 (leaving 2)
    const expected = `<pre><code>line 1
line 2
  indented line 3</code></pre>`;

    const output = formatCommentText(input);
    // Normalize newlines for comparison just in case
    expect(output.replace(/\n/g, "")).toBe(expected.replace(/\n/g, ""));
  });
});
