import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect } from "react";
import { cn } from "@/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HN: Offline",
  description: "An alternative client to Hacker News that works offline",
  icons: ["/hn-logo.png"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "bg-orange-50")}>
        <main className="bg-white mx-auto flex min-h-screen flex-col items-center justify-between pb-24 max-w-[640px] w-full ">
          <NavBar />

          <div className="border flex-1 w-full p-1">{children}</div>
        </main>
      </body>
    </html>
  );
}
