import { Show } from "solid-js";

import type { HnItem } from "~/models/interfaces";

type HnStoryCommentBannerProps = {
  story?: HnItem | undefined;
};

export const HnStoryCommentBanner = (props: HnStoryCommentBannerProps) => {
  const isComment = () => props.story?.type === "comment";
  const parentId = () => props.story?.parent;
  const rootId = () => props.story?.root;
  const isRootParentSame = () =>
    rootId() !== undefined && rootId() === parentId();

  return (
    <Show when={isComment() && parentId()} keyed>
      {(parent) => (
        <div class="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          <span class="mr-2 rounded bg-slate-200 px-1.5 py-0.5 font-semibold tracking-wide text-slate-700 uppercase">
            Comment
          </span>
          <span>
            <span class="mr-1">{isRootParentSame() ? "root" : "parent"}:</span>
            <a
              class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
              href={`/story/${parent}`}
            >
              {parent}
            </a>
            <Show when={rootId() !== undefined && !isRootParentSame()}>
              <span class="mr-1 ml-3">root:</span>
              <a
                class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
                href={`/story/${rootId()}`}
              >
                {rootId()}
              </a>
            </Show>
          </span>
        </div>
      )}
    </Show>
  );
};
