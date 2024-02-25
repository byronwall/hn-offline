import _ from "lodash";
import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";

interface InfiniteScrollContainerProps<TItemType> {
  items: TItemType[];
  itemsToAddOnRefresh: number;

  children: (item: TItemType, index: number) => React.ReactNode;
}
interface InfiniteScrollContainerState<TItemType> {
  itemsToShow: TItemType[];
}

export class InfiniteScrollContainer<TItemType> extends React.PureComponent<
  InfiniteScrollContainerProps<TItemType>,
  InfiniteScrollContainerState<TItemType>
> {
  constructor(props: InfiniteScrollContainerProps<TItemType>) {
    super(props);

    this.state = {
      itemsToShow: props.items.slice(0, props.itemsToAddOnRefresh),
    };
  }

  componentDidUpdate(prevProps: InfiniteScrollContainerProps<TItemType>) {
    const { items, itemsToAddOnRefresh } = this.props;
    const { itemsToShow } = this.state;

    const didPropTasksChange = !_.isEqual(items, prevProps.items);
    if (didPropTasksChange) {
      // if new tasks come in, ensure we render as many as before

      this.setState({
        itemsToShow: items.slice(
          0,
          Math.max(itemsToShow.length, itemsToAddOnRefresh)
        ),
      });
    }
  }
  private handleNextItems = () => {
    // need to add NUMBER_OF_ITEMS_TO_LOAD more items at a time
    const { items, itemsToAddOnRefresh } = this.props;
    const { itemsToShow } = this.state;

    const currentLength = itemsToShow.length;

    const newItemsToShow = items.slice(0, currentLength + itemsToAddOnRefresh);

    this.setState(() => ({ itemsToShow: newItemsToShow }));
  };

  render() {
    const { items, children } = this.props;
    const { itemsToShow } = this.state;

    const hasMore = itemsToShow.length < items.length;

    return (
      <InfiniteScroll
        dataLength={itemsToShow.length}
        next={this.handleNextItems}
        loader={<div>loading...</div>}
        hasMore={hasMore}
        scrollThreshold={"600px"}
      >
        {itemsToShow.map((item, index) => children(item, index))}
      </InfiniteScroll>
    );
  }
}
