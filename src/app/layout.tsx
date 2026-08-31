import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AutoRefresh from "@/components/auto-refresh";
import NotificationBell from "@/components/notification-bell";
import { auth } from "@/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perago",
  description: "Manage project tenders, clients, documents and drawings.",
};

export const viewport: Viewport = {
  themeColor: "#15130f",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AutoRefresh />
        {session?.user && <NotificationBell />}
        {children}
      </body>
    </html>
  );
}
