import React from "react";

import { HnCommentList } from "./HnCommentList";
import { isNavigator, timeSince, cn } from "@/utils";
import { KidsObj3 } from "@/stores/useDataStore";
import { ArrowUpRightFromSquare } from "lucide-react";
import sanitizeHtml from "sanitize-html";
import { decode } from "html-entities";
import { StoryContext } from "./HnStoryPage";

export interface HnCommentProps {
  comment: KidsObj3 | null;
  depth: number;

  isOpen: boolean;
  onUpdateOpen(
    id: number,
    newIsOpen: boolean,
    scrollId: number | undefined,
    comment: KidsObj3 | null,
    nextChildId: number | undefined
  ): void;
  collapsedIds: number[];
  idToScrollTo: number | undefined;
  nextChildId: number | undefined;
}

const colors = [
  "#bc8672",
  "#c5be53",
  "#d46850",
  "#8c7f3b",
  "#dec392",
  "#c9893a",
];

export class HnComment extends React.Component<HnCommentProps> {
  divRef: React.RefObject<HTMLDivElement>;

  componentDidMount() {
    this.scrollIfDesired();
  }

  componentDidUpdate() {
    this.scrollIfDesired();
  }

  scrollIfDesired() {
    const { idToScrollTo, comment } = this.props;
    if (idToScrollTo === comment?.id) {
      const dims = this.divRef.current?.offsetTop;
      console.log("scrolling to me", dims);

      if (dims !== undefined) {
        window.scrollTo({ behavior: "smooth", top: dims - 80 });
      }
    }
  }

  constructor(props: HnCommentProps) {
    super(props);

    this.divRef = React.createRef();
  }

  getDivRef() {
    if (this.divRef.current === null) {
      throw new Error("should not be null");
    }
    return this.divRef.current;
  }

  handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const { comment } = this.props;

    if (comment === null) {
      return;
    }

    // comment text has HTML tags - remove those and share the text
    let cleanText = sanitizeHtml(comment.text || "");

    // replace any anchor tags with their hrefs
    cleanText = cleanText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$1");

    // replace any <p> tags with newlines
    cleanText = cleanText.replace(/<p>/g, "\n");

    // remove any other tags, opening and closing
    cleanText = cleanText.replace(/<[^>]+>/g, "");

    // replace html entities using decode
    cleanText = decode(cleanText);

    // share the comment as text with a header line
    const url = `https://hn.byroni.us/story/${comment.id}`;
    const shareText = `Comment by ${comment.by} on HN: ${url}\n\n${cleanText}`;

    console.log("share text", shareText);

    if (!isNavigator) {
      return;
    }

    navigator.share?.({
      title: `HN Comment by ${comment.by}`,
      text: shareText,
    });
  };

  render() {
    const { idToScrollTo, comment, isOpen, depth, onUpdateOpen, collapsedIds } =
      this.props;

    if (comment === null) {
      return null;
    }

    // TODO: don't modify this array here
    const childComments = (comment.kidsObj || []).filter(isValidComment);
    const commentText = comment.text || "";

    if (!isValidComment(comment)) {
      // kick out nothing if the comment was deleted and has no children
      return null;
    }

    const childrenToShow = !isOpen ? null : (
      <React.Fragment>
        <p
          className="comment"
          dangerouslySetInnerHTML={{ __html: commentText }}
        />

        {childComments.length > 0 && (
          <HnCommentList
            childComments={childComments}
            depth={depth + 1}
            onUpdateOpen={onUpdateOpen}
            collapsedIds={collapsedIds}
            idToScrollTo={idToScrollTo}
          />
        )}
      </React.Fragment>
    );

    const borderColor = depth < colors.length ? colors[depth] : "#bbb";
    return (
      <StoryContext.Consumer>
        {(storyData) => {
          const isCommentByStoryAuthor = storyData?.by === comment.by;

          return (
            <div
              className={cn("bp3-card", { collapsed: !isOpen })}
              onClick={this.handleCardClick}
              style={{
                paddingLeft: 12 + Math.max(4 - depth),
                marginLeft: 0,
                borderLeftColor: borderColor,
              }}
            >
              <p
                style={{ fontWeight: isOpen ? 450 : 300 }}
                ref={this.divRef}
                className={cn("font-sans flex items-center gap-1")}
              >
                <span
                  className={cn({
                    "text-orange-700 font-bold": isCommentByStoryAuthor,
                  })}
                >
                  {comment.by}
                </span>
                <span>{"|"}</span>

                {timeSince(comment.time)}
                {" ago"}
                {isNavigator && "share" in navigator && (
                  <>
                    <span>{"|"}</span>
                    <button
                      onClick={this.handleShareClick}
                      className="hover:text-orange-500 ml-1"
                    >
                      <ArrowUpRightFromSquare size={16} />
                    </button>
                  </>
                )}
              </p>

              {childrenToShow}
            </div>
          );
        }}
      </StoryContext.Consumer>
    );
  }
  private handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { comment, isOpen, onUpdateOpen, nextChildId } = this.props;

    // this is to prevent other cards from collapsing too

    e.stopPropagation();

    // don't update state if click was A link
    if ((e.target as any).tagName === "A") {
      return;
    }

    // allow some gutter expansion once shifted over

    const newIsOpen = !isOpen;

    if (comment === null) {
      return;
    }

    onUpdateOpen(comment.id, newIsOpen, undefined, comment, nextChildId);
  };
}

export function isValidComment(comment: KidsObj3 | null) {
  // TODO: these items need to be removed somewhere else
  if (comment === null) {
    return false;
  }
  const isBad =
    comment.deleted &&
    (comment.kidsObj === undefined || comment.kidsObj.length === 0);

  return !isBad;
}
