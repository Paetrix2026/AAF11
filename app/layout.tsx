import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healynx — Clinical Intelligence",
  description: "Clinical AI Platform for Pandemic Response",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
