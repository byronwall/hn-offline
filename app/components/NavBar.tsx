import { useDataStore } from "@/stores/useDataStore";
import { cn } from "@/utils";
import { Link, useLocation } from "@remix-run/react";
import { Loader2 } from "lucide-react";

export function NavBar() {
  const url = useLocation().pathname;
  const refreshCurrent = useDataStore((s) => s.refreshCurrent);
  const isLoadingData = useDataStore((s) => s.isLoadingData);

  const shouldHideReadItems = useDataStore((s) => s.shouldHideReadItems);
  const setShouldHideReadItems = useDataStore((s) => s.setShouldHideReadItems);

  const toggleHideReadItems = () => {
    setShouldHideReadItems(!shouldHideReadItems);
  };

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

      <div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            value={shouldHideReadItems ? "true" : "false"}
            onChange={toggleHideReadItems}
            className="peer sr-only"
          />

          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/local" className="hover:underline">
          local
        </Link>
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
