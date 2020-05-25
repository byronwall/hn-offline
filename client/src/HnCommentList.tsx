import computeScrollIntoView from "compute-scroll-into-view";
import _ from "lodash";
import React from "react";

import { HnComment } from "./HnComment";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  canExpand: boolean;

  onUpdateOpen(
    id: number,
    newOpen: boolean,
    scrollId: number | undefined
  ): void;

  collapsedIds: number[];
  idToScrollTo: number | undefined;
}

export class HnCommentList extends React.Component<HnCommentListProps, {}> {
  childRefs: Array<React.RefObject<HnComment>> = [];
  constructor(props: HnCommentListProps) {
    super(props);
    props.childComments.forEach((item) => {
      if (item === null) {
        return;
      }
      this.childRefs[item.id] = React.createRef();
    });
  }
  render() {
    const validChildren = this.props.childComments.filter(
      (comm) => comm !== null
    );
    return (
      <React.Fragment>
        {validChildren.map((childComm, index) => (
          <HnComment
            key={childComm!.id}
            comment={childComm}
            depth={this.props.depth}
            canExpand={this.props.canExpand}
            ref={this.childRefs[childComm!.id]}
            onUpdateOpen={(id, newOpen) =>
              this.props.onUpdateOpen(id, newOpen, validChildren[index + 1]?.id)
            }
            isOpen={
              !(
                this.props.collapsedIds.findIndex(
                  (c) => childComm !== null && c === childComm.id
                ) >= 0
              )
            }
            collapsedIds={this.props.collapsedIds}
            idToScrollTo={this.props.idToScrollTo}
          />
        ))}
      </React.Fragment>
    );
  }
}
