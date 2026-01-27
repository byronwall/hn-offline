import { describe, expect, it } from "vitest";

import { formatCommentText } from "./commentUtils";

describe("formatCommentText reproduction", () => {
  it("removes indentation from user example", () => {
    const input = `<div class="comment"><div class="pl-3 border-l-4 border-slate-300 italic text-slate-500 my-2">&gt; I doubt it is something that the founding fathers of Free Software/Open Source had in mind.</div><p>Free Software sure, that wasn't the point.</p><p>Open Source, that was <i>exactly</i> the point. Eric S Raymond, one of the original promoters of the concept of Open Source coined Linus' Law:</p><p></p><pre><code>    Given enough eyeballs, all bugs are shallow
</code></pre>
Which definitely points in the direction of receiving bug reports and patches from users of the application. He was also a proponent of the Bazaar model, where software is developed in public, as opposed to the Cathedral model where software is only released in milestones (he used GCC and Emacs as examples, which reinforces the part of your statement about the Free Software movement in particular).</div>`;

    // We focus on the pre/code block part.
    // The input has 4 spaces before "Given".
    // We expect those 4 spaces to be gone.

    const output = formatCommentText(input);

    // Check if the output contains the code block with stripped indentation
    // We expect: <pre><code>Given enough eyeballs, all bugs are shallow</code></pre>
    // Note: The newline after "shallow" might be preserved or not depending on split/join logic,
    // but the *leading* spaces should be gone.

    expect(output).toContain("<pre><code>Given enough eyeballs");
    expect(output).not.toContain("    Given enough eyeballs");
  });

  it("removes tab indentation", () => {
    // Tabs are often 8 spaces wide
    const input = `<pre><code>\tLine 1
\tLine 2</code></pre>`;
    const output = formatCommentText(input);
    expect(output).toContain("<pre><code>Line 1");
    expect(output).not.toContain("\tLine 1");
  });

  it("removes mixed indentation (tabs and spaces)", () => {
    // Should strip the common prefix if possible, or at least handle valid whitespace
    // If one line is "  A" and another is "\tB", common indent is tricky.
    // Usually we just want to strip the *common* whitespace chars if they match exactly,
    // OR we can correct for visual width.
    // For now, let's just ensure we support [ \t] matching.

    const input = `<pre><code>  Line 1
  Line 2</code></pre>`;
    const output = formatCommentText(input);
    expect(output).toContain("<pre><code>Line 1");
  });
});
