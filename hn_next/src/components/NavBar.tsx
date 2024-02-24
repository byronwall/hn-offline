import Link from "next/link";

export function NavBar() {
  return (
    <nav className="flex w-full justify-between items-center space-x-2 border">
      <div className="flex items-center">
        <Link href="/" target="_self">
          <h1 className="text-2xl font-bold">HN: Offline</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/front" target="_self">
          front
        </Link>
        <Link href="/day" target="_self">
          day
        </Link>
        <Link href="/week" target="_self">
          week
        </Link>
      </div>
    </nav>
  );
}
