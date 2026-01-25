import { useNavigate } from "@solidjs/router";
import { onCleanup, onMount } from "solid-js";

export function createClickGuard() {
  onMount(() => {
    const navigate = useNavigate();
    const anchorClickHandler = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName !== "A") {
        return;
      }

      const link = e.target as HTMLAnchorElement;

      if (!link || !link.href) {
        return;
      }

      const pathName = new URL(link.href).pathname;

      const internalPaths = ["/story", "/day", "/week", "/month"];
      if (internalPaths.some((path) => pathName.startsWith(path))) {
        // let the navigation happen
        return;
      }

      const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
      const matches = link.href.match(regex);

      if (matches === null) {
        // external link = open in new tab
        link.target = "_blank";
        return;
      }

      // we have an HN link - reroute internally
      navigate("/story/" + matches[1]);
      e.preventDefault();
      return false;
    };

    document.body.addEventListener("click", anchorClickHandler);

    onCleanup(() => {
      document.body.removeEventListener("click", anchorClickHandler);
    });
  });
}
