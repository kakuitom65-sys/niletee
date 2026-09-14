import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NILETEE | Need it? NILETEE it.",
  description:
    "NILETEE makes it easy to request, source, purchase and deliver what you need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}