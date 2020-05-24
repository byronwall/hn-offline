import React from "react";

import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items: HnItem[];
}

const SESSION_SCROLL = "SCROLL_LIST";
export class HnStoryList extends React.Component<HnStoryListProps> {
  constructor(props: HnStoryListProps) {
    super(props);
    this.state = {
      items: [],
    };
  }

  componentDidMount() {
    // TODO: get the types right for this
    const history = (this.props as any).history;
    console.log("story list mount", history);

    if (history.action === "POP") {
      // restore scroll pos if available
      const scrollPos = +sessionStorage.getItem(SESSION_SCROLL)!;

      if (!isNaN(scrollPos)) {
        console.log("fire off scroll", scrollPos);
        window.scrollTo(0, scrollPos);
      }
    }
  }

  componentWillUnmount() {
    console.log("save scroll pos", window.scrollY);

    sessionStorage.setItem(SESSION_SCROLL, "" + window.scrollY);
  }

  render() {
    document.title = `HN: Offline`;
    return (
      <div>
        {this.props.items
          .filter((story) => story.descendants !== undefined)
          .map((item) => (
            <HnListItem data={item} key={item.id} />
          ))}
      </div>
    );
  }
}
