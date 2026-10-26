import { useNavigate } from "@solidjs/router";
import { onCleanup, onMount } from "solid-js";

const HN_ITEM_URL = /^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;

// One click handler for every link in the app, including links inside
// comment HTML: HN item links open in this app, other external links open in
// a new tab.
export function createClickGuard() {
  const navigate = useNavigate();

  onMount(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || !(e.target instanceof Element)) {
        return;
      }
      const link = e.target.closest("a");
      if (!link?.href) {
        return;
      }

      const hnItem = link.href.match(HN_ITEM_URL);
      if (hnItem) {
        e.preventDefault();
        navigate("/story/" + hnItem[1]);
        return;
      }

      if (new URL(link.href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    };

    document.body.addEventListener("click", handleClick);
    onCleanup(() => document.body.removeEventListener("click", handleClick));
  });
}
