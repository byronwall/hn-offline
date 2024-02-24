export function NavBar() {
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
