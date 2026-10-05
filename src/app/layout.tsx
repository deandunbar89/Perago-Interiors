import type { Metadata, Viewport } from "next";
import { Libre_Baskerville } from "next/font/google";
import AutoRefresh from "@/components/auto-refresh";
import NotificationBell from "@/components/notification-bell";
import { auth } from "@/auth";
import "./globals.css";

// Brand heading face. Helvetica Now (body) is a licensed font, so it is set via the CSS font stack
// in globals.css and falls back to Arial / Liberation Sans where it isn't installed.
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Perago",
  description: "Manage project tenders, clients, documents and drawings.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="en" className={`${libreBaskerville.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AutoRefresh />
        {session?.user && <NotificationBell />}
        {children}
      </body>
    </html>
  );
}
