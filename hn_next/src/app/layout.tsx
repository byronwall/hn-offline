import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HN: Offline",
  description: "An alternative client to Hacker News that works offline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="flex min-h-screen flex-col items-center justify-between pb-24 max-w-[1200px] ">
          <NavBar />

          <div className="border flex-1 w-full">{children}</div>
        </main>
      </body>
    </html>
  );
}
