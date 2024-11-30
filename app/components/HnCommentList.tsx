import React from "react";

import { HnComment } from "./HnComment";
import { InfiniteScrollContainer } from "./InfiniteScrollContainer";
import { KidsObj3 } from "@/stores/useDataStore";

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

export class HnCommentList extends React.Component<HnCommentListProps, {}> {
  constructor(props: HnCommentListProps) {
    super(props);
  }

  handleUpdateOpen: (
    id: number,
    newIsOpen: boolean,
    scrollId: number | undefined,
    comment: KidsObj3 | null,
    nextChildId: number | undefined
  ) => void = (id, newOpen, scrollId, comment, nextChildId) => {
    const { onUpdateOpen } = this.props;

    return onUpdateOpen(
      id,
      newOpen,
      scrollId ?? (newOpen ? comment?.id : nextChildId),
      comment,
      nextChildId
    );
  };

  render() {
    const { childComments, depth, authorChain } = this.props;

    const validChildren = childComments.filter((comm) => comm !== null);

    if (depth > 0) {
      // do not use infinite scroll for child comments - just render them all
      return validChildren.map((childComm, index) => (
        <div key={childComm!.id}>
          <HnComment
            comment={childComm}
            depth={depth}
            nextChildId={validChildren[index + 1]?.id}
            onUpdateOpen={this.handleUpdateOpen}
            authorChain={authorChain}
          />
        </div>
      ));
    }

    return (
      <InfiniteScrollContainer items={validChildren} itemsToAddOnRefresh={1}>
        {(childComm, index) => {
          if (childComm === null) {
            return null;
          }

          return (
            <div key={childComm.id}>
              <HnComment
                comment={childComm}
                depth={depth}
                nextChildId={validChildren[index + 1]?.id}
                onUpdateOpen={this.handleUpdateOpen}
                authorChain={authorChain}
              />
            </div>
          );
        }}
      </InfiniteScrollContainer>
    );
  }
}
