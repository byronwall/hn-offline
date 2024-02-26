"use client";

import { useDataStore } from "@/stores/useDataStore";
import { cn } from "@/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const url = usePathname();
  const refreshCurrent = useDataStore((s) => s.refreshCurrent);
  const isLoadingData = useDataStore((s) => s.isLoadingData);

  const handleRefresh = () => {
    if (!url) return;

    refreshCurrent(url);
  };

  return (
    <nav className="flex w-full justify-between items-center space-x-2 border p-1">
      <div className="flex items-center">
        <Link
          href="/"
          target="_self"
          className="flex items-center gap-1 hover:underline"
        >
          <img src="/hn-logo.png" alt="Hacker News Logo" className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Offline</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/day" target="_self" className="hover:underline">
          day
        </Link>
        <Link href="/week" target="_self" className="hover:underline">
          week
        </Link>

        <Loader2
          size="24"
          color="black"
          className={cn(
            "hover:cursor-pointer hover:stroke-blue-500 transition-colors duration-300 ease-in-out",
            { "animate-spin stroke-orange-500": isLoadingData }
          )}
          onClick={handleRefresh}
        />
      </div>
    </nav>
  );
}
