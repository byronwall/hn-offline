import Link from "next/link";

export function NavBar() {
  return (
    <nav className="flex w-full justify-between items-center space-x-2 border">
      <div className="flex items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold">HN: Offline</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/front">front</Link>
        <Link href="/day">day</Link>
        <Link href="/week">week</Link>
      </div>
    </nav>
  );
}
