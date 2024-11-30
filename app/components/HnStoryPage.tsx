import React, { createContext, useEffect, useState } from "react";

import { cn, getDomain, isNavigator, timeSince } from "@/utils";
import { isValidComment } from "./isValidComment";
import { HnCommentList } from "./HnCommentList";

import { HnItem, useDataStore } from "@/stores/useDataStore";
import { useNavigate } from "@remix-run/react";
import { ArrowUpRightFromSquare } from "lucide-react";

import { processHtmlAndTruncateAnchorText } from "./processHtmlAndTruncateAnchorText";
import { useGetContent } from "./useGetContent";
import { useCommentStore } from "~/features/comments/indexedDb";

interface HnStoryPageProps {
  id: number | undefined;
  storyData?: HnItem;
}

export const SESSION_COLLAPSED = "SESSION_COLLAPSED";

// context to track the current story data
export const StoryContext = createContext<HnItem | undefined>(undefined);

export const HnStoryPage: React.FC<HnStoryPageProps> = ({
  id,
  storyData: _storyData,
}) => {
  const updateCollapsedState = useCommentStore((s) => s.updateCollapsedState);

  const setIdToScrollTo = useDataStore((s) => s.setScrollToId);

  const storyData = useGetContent(id!, _storyData);

  const textToRender = processHtmlAndTruncateAnchorText(storyData?.text || "");

  console.log("HnStoryPage", { id, storyData });

  const onVisitMarker = useDataStore((s) => s.saveIdToReadList);

  const handleShareClick = () => {
    navigator.share?.({ url: window.location.href });
  };

  const navigate = useNavigate();

  const handleCollapseEvent = (
    id: number,
    newOpen: boolean,
    scrollId: number | undefined
  ) => {
    updateCollapsedState(id, !newOpen);

    console.log("handleCollapseEvent", { id, newOpen, scrollId });

    if (scrollId !== undefined) {
      setIdToScrollTo(scrollId);
    }
  };

  useEffect(() => {
    const anchorClickHandler = (e: any) => {
      if (e.target.tagName !== "A") {
        return;
      }

      const link = e.target as HTMLAnchorElement;

      const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
      const matches = link.href.match(regex);

      if (matches === null) {
        link.target = "_blank";
        return;
      }

      navigate("/story/" + matches[1]);
      e.preventDefault();
      return false;
    };

    window.scrollTo({ top: 0 });
    document.body.addEventListener("click", anchorClickHandler);

    if (id !== undefined) {
      onVisitMarker(id);
    }

    return () => {
      document.body.removeEventListener("click", anchorClickHandler);
    };
  }, []);

  const [isTextCollapsed, setIsTextCollapsed] = useState(false);

  if (!storyData) {
    return null;
  }

  const storyLinkEl =
    storyData.url === undefined ? (
      <span>{storyData.title}</span>
    ) : (
      <a href={storyData.url}>{storyData.title}</a>
    );

  const comments = (storyData.kidsObj || []).filter(isValidComment);

  return (
    <div className="relative">
      <h2
        className="text-2xl font-bold hover:underline mb-2"
        style={{ overflowWrap: "break-word" }}
      >
        {storyLinkEl}
      </h2>

      <div
        className={cn(
          {
            "border-l-4 border-orange-500 px-2 rounded-tl rounded-bl":
              storyData.text,
          },
          {
            collapsed: isTextCollapsed,
          }
        )}
        onClick={() => {
          if (!storyData.text) {
            return;
          }

          const newIsCollapsed = !isTextCollapsed;

          setIsTextCollapsed(newIsCollapsed);

          // scroll to first comment if it exists
          if (newIsCollapsed && comments.length > 0 && comments[0]?.id) {
            setIdToScrollTo(comments[0]?.id);
          }
        }}
      >
        <h4 className="mb-2">
          <span>{storyData.by}</span>
          <span>{" | "}</span>
          <span>
            {storyData.score}
            {" points"}
          </span>
          <span>{" | "}</span>
          <span>{timeSince(storyData.time)} ago</span>
          <span>{" | "}</span>
          <span>{getDomain(storyData.url)}</span>
          {isNavigator && "share" in navigator && (
            <>
              <span>{" | "}</span>
              <button
                onClick={handleShareClick}
                className="hover:text-orange-500"
              >
                <ArrowUpRightFromSquare size={16} />
              </button>
            </>
          )}
        </h4>

        {storyData.text !== undefined && !isTextCollapsed && (
          <p
            className="user-text break-words "
            dangerouslySetInnerHTML={{ __html: textToRender }}
          />
        )}
      </div>

      <div className="user-text">
        <StoryContext.Provider value={storyData}>
          <HnCommentList
            childComments={comments}
            depth={0}
            onUpdateOpen={handleCollapseEvent}
            authorChain={[]}
          />
        </StoryContext.Provider>
      </div>
    </div>
  );
};
