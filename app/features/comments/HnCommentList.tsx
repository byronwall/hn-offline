import { KidsObj3 } from "~/stores/useDataStore";

import { HnComment } from "./HnComment";
import { InfiniteScrollContainer } from "./InfiniteScrollContainer";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  authorChain: (string | undefined)[];
}

export function HnCommentList({
  childComments,
  depth,
  authorChain,
}: HnCommentListProps) {
  const validChildren = childComments.filter((comm) => comm !== null);

  if (depth > 0) {
    // do not use infinite scroll for child comments - just render them all
    return (
      <>
        {validChildren.map((childComm) => (
          <HnComment
            key={childComm!.id}
            comment={childComm}
            depth={depth}
            authorChain={authorChain}
          />
        ))}
      </>
    );
  }

  return (
    <InfiniteScrollContainer items={validChildren} itemsToAddOnRefresh={1}>
      {(childComm) => {
        if (childComm === null) {
          return null;
        }

        return (
          <HnComment
            key={childComm.id}
            comment={childComm}
            depth={depth}
            authorChain={authorChain}
          />
        );
      }}
    </InfiniteScrollContainer>
  );
}
