// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "./client-layout-wrapper"; // Import the new component

const inter = Inter({ subsets: ["latin"] });

// --- METADATA STAYS HERE ---
export const metadata: Metadata = {
  title: "StrategyFlow - Build and Backtest Trading Strategies",
  description: "Create, test, and deploy event-driven trading strategies",
  icons: {
    icon: "/logo.png",
  },
};

// This remains a Server Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Use the Client Wrapper to handle providers and client logic */}
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}