"use client";

import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollContainerProps<TItemType> {
  items: TItemType[];
  itemsToAddOnRefresh: number;

  children: (item: TItemType, index: number) => React.ReactNode;
}

export function InfiniteScrollContainer<TItemType>(
  props: InfiniteScrollContainerProps<TItemType>
) {
  const { items, itemsToAddOnRefresh, children } = props;

  const [itemsToShow, setItemsToShow] = useState<TItemType[]>([]);

  const handleNextItems = useCallback(() => {
    // need to add NUMBER_OF_ITEMS_TO_LOAD more items at a time

    const currentLength = itemsToShow.length;

    const newItemsToShow = items.slice(0, currentLength + itemsToAddOnRefresh);

    setItemsToShow(newItemsToShow);

    console.log("handleNextItems", newItemsToShow);
  }, [items, itemsToAddOnRefresh, itemsToShow]);

  const hasMore = itemsToShow.length < items.length;

  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasMore) {
      handleNextItems();
    }
  }, [handleNextItems, hasMore, inView]);

  return (
    <div>
      {itemsToShow.map((item, index) => children(item, index))}
      <div ref={ref} />
    </div>
  );
}
