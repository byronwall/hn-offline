import React, { createContext, useEffect, useState } from "react";

import { getDomain, isNavigator, timeSince } from "@/utils";
import { isValidComment } from "./HnComment";
import { HnCommentList } from "./HnCommentList";

import { HnItem, useDataStore } from "@/stores/useDataStore";
import { Link, useNavigate } from "@remix-run/react";
import { ArrowUpRightFromSquare } from "lucide-react";

import { processHtmlAndTruncateAnchorText } from "./processHtmlAndTruncateAnchorText";
import { useGetContent } from "./useGetContent";
import { useGetNextPrevStoryIds } from "./useGetNextPrevStoryIds";

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
  const [collapsedComments, setCollapsedComments] = useState<number[]>([]);
  const [idToScrollTo, setIdToScrollTo] = useState<number | undefined>(
    undefined
  );

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
    if (newOpen) {
      const newIds = collapsedComments.filter((c) => c !== id);
      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      setCollapsedComments(newIds);
    } else {
      const newIds = [...collapsedComments, id];
      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      setCollapsedComments(newIds);
    }

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

    const strCollapsedIds = sessionStorage.getItem(SESSION_COLLAPSED);
    if (strCollapsedIds !== null) {
      const collapsedIds = JSON.parse(strCollapsedIds) as number[];
      setCollapsedComments(collapsedIds);
    }

    if (id !== undefined) {
      onVisitMarker(id);
    }

    return () => {
      document.body.removeEventListener("click", anchorClickHandler);
    };
  }, []);

  useEffect(() => {
    if (idToScrollTo) {
      setIdToScrollTo(undefined);
    }
  }, [idToScrollTo]);

  const nextPrevIds = useGetNextPrevStoryIds(id!);

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
        className="text-2xl font-bold mb-2 hover:underline"
        style={{ overflowWrap: "break-word" }}
      >
        {storyLinkEl}
      </h2>
      <h4>
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

      {/* link to next story */}
      <div className="flex justify-between bg-orange-100 px-2 font-semibold sticky top-[42px] -m-1">
        <div>
          {nextPrevIds?.prevId && (
            <Link
              to={`/story/${nextPrevIds?.prevId}`}
              className="hover:underline"
              replace
            >
              {"<"} Previous
            </Link>
          )}
        </div>

        <div>
          {nextPrevIds?.nextId && (
            <Link
              to={`/story/${nextPrevIds?.nextId}`}
              className="hover:underline"
              replace
            >
              Next {">"}
            </Link>
          )}
        </div>
      </div>

      {storyData.text !== undefined && (
        <p
          className="user-text break-words "
          dangerouslySetInnerHTML={{ __html: textToRender }}
        />
      )}

      <div className="user-text">
        <StoryContext.Provider value={storyData}>
          <HnCommentList
            childComments={comments}
            depth={0}
            collapsedIds={collapsedComments}
            onUpdateOpen={handleCollapseEvent}
            idToScrollTo={idToScrollTo}
          />
        </StoryContext.Provider>
      </div>
    </div>
  );
};
