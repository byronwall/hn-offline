import { NavBar } from "../components/NavBar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 max-w-lg ">
      <div className="border flex-1">
        <NavBar />
      </div>
    </main>
  );
}
