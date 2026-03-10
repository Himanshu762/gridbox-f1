import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-f1-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-f1-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-f1-oswald",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-f1-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "GridBox F1 — The Ultimate Formula 1 Hub",
  description:
    "Live timing, race analysis, standings, geo-maps, telemetry — everything an F1 enthusiast needs. Built for the passionate.",
  keywords: ["Formula 1", "F1", "racing", "live timing", "standings", "telemetry"],
};

export const viewport: Viewport = {
  themeColor: "#0F0F13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${oswald.variable} antialiased carbon-pattern text-[#F7F4F1] overflow-x-hidden`}
      >
        <Navbar />
        <div className="min-h-screen pt-28 pb-16 px-4 md:px-8">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
