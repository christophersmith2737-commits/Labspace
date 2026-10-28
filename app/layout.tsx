import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabSpace — 实验室物料管理",
  description: "像整理房间一样管理实验室物料。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
