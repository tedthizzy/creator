import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator — Graphics Tool",
  description: "Internal tool for generating on-brand animated graphics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
