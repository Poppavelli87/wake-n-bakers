import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Wake 'n Baker's: Bacon Makers",
  description:
    "Silent-cartoon asymmetric multiplayer kitchen comedy. Welcome to Savoryville."
};

export const viewport: Viewport = {
  themeColor: "#fbf3e3"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${inter.variable}`}>
      <body className="bg-linen-100 text-skillet-900 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
