import { decode } from "html-entities";
import { ArrowUpRightFromSquare } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import sanitizeHtml from "sanitize-html";

import { isValidComment } from "~/lib/isValidComment";
import { cn, isNavigator, timeSince } from "~/lib/utils";
import { useCommentStore } from "~/stores/useCommentStore";
import { KidsObj3, useDataStore } from "~/stores/useDataStore";

import { HnCommentList } from "./HnCommentList";
import { StoryContext } from "./HnStoryPage";

export interface HnCommentProps {
  comment: KidsObj3 | null;
  depth: number;

  onUpdateOpen(
    id: number,
    newIsOpen: boolean,
    scrollId: number | undefined,
    comment: KidsObj3 | null,
    nextChildId: number | undefined
  ): void;

  nextChildId: number | undefined;
  authorChain: (string | undefined)[];
}

export function HnComment({
  comment,
  depth,
  onUpdateOpen,
  nextChildId,
  authorChain,
}: HnCommentProps) {
  const divRef: React.RefObject<HTMLDivElement> = useRef(null);

  const clearScrollToId = useDataStore((s) => s.clearScrollToId);
  const scrollToId = useDataStore((s) => s.scrollToId);
  const collapsedIds = useCommentStore((s) => s.collapsedIds);

  const colorMap = useDataStore((s) => s.colorMap);
  const storyData = useContext(StoryContext);

  const _isOpen = comment?.id ? collapsedIds[comment.id] !== true : false;
  const [isOpen, setIsOpen] = useState(_isOpen);

  useEffect(() => {
    // update when IndexedDB changes
    setIsOpen(_isOpen);
  }, [_isOpen]);

  useEffect(() => {
    if (scrollToId !== comment?.id) return;

    const dims = divRef.current?.getBoundingClientRect().top;

    if (dims === undefined) {
      return;
    }

    // add scrollY to get the absolute position
    // subtract 80 to give a pleasant offset
    const newTop = window.scrollY + dims - 88;

    window.scrollTo({
      top: newTop,
      behavior: "smooth",
    });
    clearScrollToId();
  }, [clearScrollToId, comment?.id, scrollToId]);

  const handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (comment === null) return;

    let cleanText = sanitizeHtml(comment.text || "");
    cleanText = cleanText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$1");
    cleanText = cleanText.replace(/<p>/g, "\n");
    cleanText = cleanText.replace(/<[^>]+>/g, "");
    cleanText = decode(cleanText);

    const url = `https://hn.byroni.us/story/${comment.id}`;
    const shareText = `Comment by ${comment.by} on HN: ${url}\n\n${cleanText}`;

    console.log("share text", shareText);

    if (!isNavigator) return;

    navigator.share?.({
      title: `HN Comment by ${comment.by}`,
      text: shareText,
    });
  };

  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();

    if ("tagName" in e.target && e.target.tagName === "A") {
      return;
    }

    const newIsOpen = !isOpen;
    if (comment === null) return;
    onUpdateOpen(comment.id, newIsOpen, undefined, comment, nextChildId);

    setIsOpen(newIsOpen);
  }

  if (comment === null) return null;

  const depthMatchInAuthorChain = authorChain.lastIndexOf(
    comment.by || undefined
  );

  const shouldShowBar = depthMatchInAuthorChain >= 0;

  const paddingByDepth = [16, 15, 14, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const widths = paddingByDepth.map((val) => val + 4);

  let leftPos = 0;
  if (shouldShowBar) {
    leftPos = widths
      .slice(depthMatchInAuthorChain, depth)
      .reduce((acc, val) => acc - val, 0);
  }

  const childComments = (comment.kidsObj || []).filter(isValidComment);
  const commentText = comment.text || "";

  if (!isValidComment(comment)) return null;

  const childrenToShow = !isOpen ? null : (
    <>
      <p
        className="comment"
        dangerouslySetInnerHTML={{ __html: commentText }}
      />
      {childComments.length > 0 && (
        <HnCommentList
          childComments={childComments}
          depth={depth + 1}
          onUpdateOpen={onUpdateOpen}
          authorChain={[...authorChain, comment.by]}
        />
      )}
    </>
  );

  const isCommentByStoryAuthor = storyData?.by === comment.by;
  const borderColor = colorMap[comment.by ?? ""] ?? "#000";

  const stickyTop = 32 + depthMatchInAuthorChain * 8;
  const stickyHeight = Math.max(48 - depthMatchInAuthorChain * 8, 16);

  return (
    <div
      className={cn("bp3-card relative", { collapsed: !isOpen })}
      onClick={handleCardClick}
      style={
        {
          "--flash-color": borderColor,
          paddingLeft: 12 + Math.max(4 - depth, 0),
          marginLeft: 0,
          borderLeftColor: borderColor,
          borderLeftWidth: 4,
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
        } as React.CSSProperties
      }
    >
      {shouldShowBar && isOpen && (
        <div
          style={{
            position: "sticky",
            top: stickyTop,
            height: stickyHeight,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: leftPos - paddingByDepth[depth],
              width: Math.abs(leftPos + 4),
              backgroundColor: borderColor,
              height: 7,
              borderTop: "2px solid white",
              borderBottom: "2px solid white",
            }}
          ></div>
        </div>
      )}
      <p
        style={{
          fontWeight: isOpen ? 450 : 300,
          marginTop: shouldShowBar && isOpen ? -stickyHeight : 0,
        }}
        ref={divRef}
        className={cn("font-sans flex items-center gap-1")}
      >
        <span
          className={cn({
            "text-orange-700 font-bold": isCommentByStoryAuthor,
            truncate: true,
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
              onClick={handleShareClick}
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
}
