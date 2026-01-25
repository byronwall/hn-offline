import { Show } from "solid-js";

type HnStoryCommentBannerProps = {
  parentId: number;
  rootId?: number;
};

export const HnStoryCommentBanner = (props: HnStoryCommentBannerProps) => {
  const isRootParentSame = () =>
    props.rootId !== undefined && props.rootId === props.parentId;

  return (
    <div class="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
      <span class="mr-2 rounded bg-slate-200 px-1.5 py-0.5 font-semibold tracking-wide text-slate-700 uppercase">
        Comment
      </span>
      <span>
        <span class="mr-1">{isRootParentSame() ? "root" : "parent"}:</span>
        <a
          class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
          href={`/story/${props.parentId}`}
        >
          {props.parentId}
        </a>
        <Show when={props.rootId !== undefined && !isRootParentSame()}>
          <span class="mr-1 ml-3">root:</span>
          <a
            class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
            href={`/story/${props.rootId}`}
          >
            {props.rootId}
          </a>
        </Show>
      </span>
    </div>
  );
};
