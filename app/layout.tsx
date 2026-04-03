import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Furui — 思考を篩にかける",
  description:
    "頭の中を全部出して、一対一の直感比較で優先順位を見つけるツール。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
