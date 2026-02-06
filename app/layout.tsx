import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEMB Console",
  description:
    "사업본부 관리 시스템 WEMB Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
