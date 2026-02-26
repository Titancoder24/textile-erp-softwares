import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextileOS - The Textile Industry's Operating System",
  description:
    "Complete textile ERP system. From fiber to fashion, from brand to factory floor. One platform.",
  keywords: [
    "textile",
    "ERP",
    "garment",
    "production",
    "quality",
    "inventory",
    "factory",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
