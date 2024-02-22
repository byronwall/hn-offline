"use client";

import { usePathname } from "next/navigation";
import { HnItem, useDataStore } from "../stores/useDataStore";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  // get slug from url using next nav
  const pathname = usePathname();

  const initLocal = useDataStore((s) => s.initializeFromLocalForage);

  const { data, isLoading } = useGetPageData(pathname);

  useEffect(() => {
    initLocal();
  }, [initLocal]);

  return (
    <div>
      Testing : {pathname}
      <div>
        {isLoading && <p>Loading...</p>}
        {data && (
          <ul>
            {data.map((item) => (
              <li key={item.id}>
                <Link href={`/story/${item.id}`}> {item.title}</Link> -{" "}
                {item.title} - {item.score}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function useGetSimpleData<T>(getter: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const newData = await getter();
      setData(newData);
      setIsLoading(false);
    }

    fetchData();
  }, [getter, setData]);

  return { data, isLoading };
}

function useGetPageData(pathname: string) {
  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);

  const getter = useCallback(
    () => getContentForPage(pathname),
    [getContentForPage, pathname, isInit]
  );

  return useGetSimpleData(getter);
}
