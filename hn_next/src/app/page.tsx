import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 max-w-lg ">
      <div className="border flex-1">
        <NavBar />
      </div>
    </main>
  );
}
function NavBar() {
  return (
    <nav className="flex w-full justify-between items-center space-x-2">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">HN: Offline</h1>
      </div>
      <div className="flex items-center gap-2">
        <p>front</p>
        <p>day</p>
        <p>week</p>
      </div>
    </nav>
  );
}
