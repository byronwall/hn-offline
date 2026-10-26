import { For, Show } from "solid-js";

// Render `text` with each search term marked, without injecting HTML.
export function HighlightText(props: { text: string; terms: string[] }) {
  const parts = () => {
    const terms = props.terms.filter(Boolean);
    if (terms.length === 0) {
      return [{ text: props.text, match: false }];
    }
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // With one capture group, split puts every match at an odd index.
    return props.text
      .split(new RegExp(`(${escaped.join("|")})`, "gi"))
      .map((text, index) => ({ text, match: index % 2 === 1 }))
      .filter((part) => part.text);
  };

  return (
    <For each={parts()}>
      {(part) => (
        <Show when={part.match} fallback={part.text}>
          <mark class="bg-hn-soft text-hn-ink rounded-sm">{part.text}</mark>
        </Show>
      )}
    </For>
  );
}
