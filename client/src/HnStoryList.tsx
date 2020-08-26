import { Spinner } from "@blueprintjs/core";
import { History } from "history";
import React from "react";

import { TrueHash } from "./App";
import { HnListItem } from "./HnListItem";
import { HnStorySummary } from "./DataLayer";

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
    this.state = {
      items: [],
    };
  }

  componentDidMount() {
    this.scrollToPrevious();
  }

  private scrollToPrevious() {
    const history = this.props.history;

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
    document.title = `HN: Offline`;

    const spinner =
      this.props.items.length === 0 && this.props.isLoading ? (
        <div style={{ marginTop: 20 }}>
          <Spinner size={200} intent="warning" />
        </div>
      ) : null;

    return (
      <div>
        {spinner}
        <div>
          {this.props.items
            .filter((story) => story.commentCount !== undefined)
            .map((item) => (
              <HnListItem
                data={item}
                key={item.id}
                isRead={this.props.readIds[item.id]}
              />
            ))}
        </div>
      </div>
    );
  }
}
