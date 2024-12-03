import { KidsObj3 } from "@/stores/useDataStore";
import { HnComment } from "./HnComment";
import { InfiniteScrollContainer } from "./InfiniteScrollContainer";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;

  onUpdateOpen(
    id: number,
    newOpen: boolean,
    scrollId: number | undefined,
    comment: KidsObj3 | null,
    nextChildId: number | undefined
  ): void;

  authorChain: (string | undefined)[];
}

export function HnCommentList({
  childComments,
  depth,
  onUpdateOpen,
  authorChain,
}: HnCommentListProps) {
  function handleUpdateOpen(
    id: number,
    newOpen: boolean,
    scrollId: number | undefined,
    comment: KidsObj3 | null,
    nextChildId: number | undefined
  ) {
    return onUpdateOpen(
      id,
      newOpen,
      scrollId ?? (newOpen ? comment?.id : nextChildId),
      comment,
      nextChildId
    );
  }

  const validChildren = childComments.filter((comm) => comm !== null);

  if (depth > 0) {
    // do not use infinite scroll for child comments - just render them all
    return (
      <>
        {validChildren.map((childComm, index) => (
          <HnComment
            key={childComm!.id}
            comment={childComm}
            depth={depth}
            nextChildId={validChildren[index + 1]?.id}
            onUpdateOpen={handleUpdateOpen}
            authorChain={authorChain}
          />
        ))}
      </>
    );
  }

  return (
    <InfiniteScrollContainer items={validChildren} itemsToAddOnRefresh={1}>
      {(childComm, index) => {
        if (childComm === null) {
          return null;
        }

        return (
          <HnComment
            key={childComm.id}
            comment={childComm}
            depth={depth}
            nextChildId={validChildren[index + 1]?.id}
            onUpdateOpen={handleUpdateOpen}
            authorChain={authorChain}
          />
        );
      }}
    </InfiniteScrollContainer>
  );
}
