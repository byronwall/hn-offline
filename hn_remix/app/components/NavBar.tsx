"use client";

import { useDataStore } from "@/stores/useDataStore";
import { cn } from "@/utils";
import { Link, useLocation } from "@remix-run/react";
import { Loader2 } from "lucide-react";

export function NavBar() {
  const url = useLocation().pathname;
  const refreshCurrent = useDataStore((s) => s.refreshCurrent);
  const isLoadingData = useDataStore((s) => s.isLoadingData);

  const handleRefresh = () => {
    if (!url) return;

    refreshCurrent(url);
  };

  return (
    <nav className="flex w-full justify-between items-center space-x-2 border p-1">
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-1 hover:underline">
          <img
            src="/favicon-32x32.png"
            alt="Hacker News Logo"
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold">Offline</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/day" className="hover:underline">
          day
        </Link>
        <Link to="/week" className="hover:underline">
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
