"use client";

import React from "react";

import { TrueHash } from "@/stores/useDataStore";
import { HnStorySummary } from "@/stores/useDataStore";
import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items: HnStorySummary[];
  readIds: TrueHash;
}

const SESSION_SCROLL = "SCROLL_LIST";
export class HnStoryList extends React.PureComponent<HnStoryListProps> {
  constructor(props: HnStoryListProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.scrollToPrevious();
  }

  private scrollToPrevious() {
    // if (history.action === "POP") {
    //   // restore scroll pos if available
    //   const scrollPos = +sessionStorage.getItem(SESSION_SCROLL)!;
    //   if (!isNaN(scrollPos)) {
    //     console.log("fire off scroll", scrollPos);
    //     window.scrollTo({ top: scrollPos });
    //   }
    // }
  }

  componentWillUnmount() {
    console.log("save scroll pos", window.scrollY);

    sessionStorage.setItem(SESSION_SCROLL, "" + window.scrollY);
  }

  render() {
    const { items, readIds } = this.props;

    return (
      <div>
        <div className="grid grid-cols-[1fr_1fr_1fr_3fr]">
          {items.map((item) => (
            <HnListItem data={item} key={item.id} isRead={readIds[item.id]} />
          ))}
        </div>
      </div>
    );
  }
}
