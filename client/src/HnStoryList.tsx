import { Spinner } from "@blueprintjs/core";
import { History } from "history";
import React from "react";

import { TrueHash } from "./App";
import { HnStorySummary } from "./DataLayer";
import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items: HnStorySummary[];
  readIds: TrueHash;
  history: History;
  isLoading: boolean;
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
    const { history } = this.props;

    if (history.action === "POP") {
      // restore scroll pos if available
      const scrollPos = +sessionStorage.getItem(SESSION_SCROLL)!;

      if (!isNaN(scrollPos)) {
        console.log("fire off scroll", scrollPos);
        window.scrollTo({ top: scrollPos });
      }
    }
  }

  componentWillUnmount() {
    console.log("save scroll pos", window.scrollY);

    sessionStorage.setItem(SESSION_SCROLL, "" + window.scrollY);
  }

  render() {
    const { items, isLoading, readIds } = this.props;

    document.title = `HN: Offline`;

    const spinner =
      items.length === 0 && isLoading ? (
        <div style={{ marginTop: 20 }}>
          <Spinner size={200} intent="warning" />
        </div>
      ) : null;

    return (
      <div>
        {spinner}
        <div id="list-holder">
          {items.map((item) => (
            <HnListItem data={item} key={item.id} isRead={readIds[item.id]} />
          ))}
        </div>
      </div>
    );
  }
}
