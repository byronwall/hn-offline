import { For } from "solid-js";

import { KidsObj3 } from "~/stores/useDataStore";

import { HnComment } from "./HnComment";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  authorChain: (string | undefined)[];
}

export function HnCommentList(props: HnCommentListProps) {
  const validChildren = props.childComments.filter((comm) => comm !== null);

  // do not use infinite scroll for child comments - just render them all
  return (
    <>
      <For each={validChildren}>
        {(childComm) => (
          <HnComment
            comment={childComm}
            depth={props.depth}
            authorChain={props.authorChain}
          />
        )}
      </For>
    </>
  );

  // return (
  //   <InfiniteScrollContainer items={validChildren} itemsToAddOnRefresh={1}>
  //     {(childComm) => {
  //       if (childComm === null) {
  //         return null;
  //       }

  //       return (
  //         <HnComment
  //           key={childComm.id}
  //           comment={childComm}
  //           depth={props.depth}
  //           authorChain={props.authorChain}
  //         />
  //       );
  //     }}
  //   </InfiniteScrollContainer>
  // );
}
