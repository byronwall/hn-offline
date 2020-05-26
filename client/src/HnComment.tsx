import classNames from "classnames";
import React from "react";

import { HnCommentList } from "./HnCommentList";
import { timeSince } from "./timeSince";

export interface HnCommentProps {
  comment: KidsObj3 | null;
  depth: number;

  canExpand: boolean;

  isOpen: boolean;
  onUpdateOpen(
    id: number,
    newIsOpen: boolean,
    scrollId: number | undefined
  ): void;
  collapsedIds: number[];
  idToScrollTo: number | undefined;
}

interface HnCommentState {
  expandSelf: boolean;
}

const colors = [
  "#bc8672",
  "#c5be53",
  "#d46850",
  "#8c7f3b",
  "#dec392",
  "#c9893a",
];

export class HnComment extends React.Component<HnCommentProps, HnCommentState> {
  divRef: React.RefObject<HTMLDivElement>;

  componentDidMount() {
    this.scrollIfDesired();
  }

  componentDidUpdate() {
    this.scrollIfDesired();
  }

  scrollIfDesired() {
    console.log("scroll to id ", this.props.idToScrollTo);
    if (this.props.idToScrollTo === this.props.comment?.id) {
      const dims = this.divRef.current?.offsetTop;
      console.log("scrolling to me", dims);

      if (dims !== undefined) {
        window.scrollTo(0, dims - 80);
      }
    }
  }

  static getDerivedStateFromProps(
    props: HnCommentProps,
    state: HnCommentState
  ) {
    // if a parent expands, collapse this one
    if (!props.canExpand) {
      return { expandSelf: false };
    }

    return null;
  }

  constructor(props: HnCommentProps) {
    super(props);

    this.state = {
      expandSelf: false,
    };

    this.divRef = React.createRef();
  }

  getDivRef() {
    return this.divRef.current!;
  }

  render() {
    console.log("isOpen", this.props.isOpen);
    const comment = this.props.comment;

    if (comment === null) {
      return null;
    }

    const childComments = (comment.kidsObj || []).filter(isValidComment);
    const commentText = comment.text || "";

    if (!isValidComment(comment)) {
      // kick out nothing if the comment was deleted and has no children
      return null;
    }

    // TODO: rewrite links to hn to open in this site instead

    const childrenToShow = !this.props.isOpen ? null : (
      <React.Fragment>
        <p
          className="comment"
          dangerouslySetInnerHTML={{ __html: commentText }}
        />

        {childComments.length > 0 && (
          <HnCommentList
            childComments={childComments}
            canExpand={this.props.canExpand && !this.state.expandSelf}
            depth={this.props.depth + 1}
            onUpdateOpen={(id, newIsOpen, scrollId) =>
              this.props.onUpdateOpen(id, newIsOpen, scrollId)
            }
            collapsedIds={this.props.collapsedIds}
            idToScrollTo={this.props.idToScrollTo}
          />
        )}
      </React.Fragment>
    );

    const borderColor =
      this.props.depth < colors.length ? colors[this.props.depth] : "#bbb";
    return (
      <div
        className={classNames("bp3-card", { collapsed: !this.props.isOpen })}
        onClick={(e) => this.handleCardClick(e)}
        style={{
          paddingLeft: 12 + Math.max(4 - this.props.depth),
          marginLeft:
            this.state.expandSelf && this.props.isOpen
              ? -17 * this.props.depth
              : 0,

          borderLeftColor: borderColor,

          borderLeftWidth: this.state.expandSelf ? 6 : undefined,

          borderRight: this.state.expandSelf
            ? "1px solid" + borderColor
            : undefined,
          paddingRight: this.state.expandSelf ? 6 : undefined,
        }}
      >
        <p
          style={{ fontWeight: this.props.isOpen ? 450 : 300 }}
          ref={this.divRef}
        >
          {comment.by}
          {" | "}
          {comment.id}
          {" | "}
          {timeSince(comment.time)}
          {" ago"}
        </p>

        {childrenToShow}
      </div>
    );
  }
  handleCardClick(e: React.MouseEvent<HTMLDivElement>): void {
    // this is to prevent other cards from collapsing too

    e.stopPropagation();

    // dont update state if click was A link
    if ((e.target as any).tagName === "A") {
      return;
    }

    const target = e.target as any;

    // allow some gutter expansion once shifted over
    const gutterRatio = this.state.expandSelf ? 0.85 : 0.9;

    if (
      this.props.depth > 0 &&
      this.props.canExpand &&
      (e.pageX + target.offsetLeft) / window.innerWidth > gutterRatio
    ) {
      this.setState({ expandSelf: !this.state.expandSelf });
    } else {
      const isOpen = !this.props.isOpen;

      if (this.props.comment === null) {
        return;
      }

      this.props.onUpdateOpen(this.props.comment.id, isOpen, undefined);
    }
  }
}

export function isValidComment(comment: KidsObj3 | null) {
  if (comment === null) {
    return false;
  }
  const isBad =
    comment.deleted &&
    (comment.kidsObj === undefined || comment.kidsObj!.length === 0);

  return !isBad;
}
