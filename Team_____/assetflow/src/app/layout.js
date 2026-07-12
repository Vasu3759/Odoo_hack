import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: "AssetFlow | Odoo Integrated",
  description: "Enterprise asset lifecycle management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-gray-50/30 min-h-screen`}>
        <Sidebar />
        <main className="flex-1 w-full pt-20 pb-12 px-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
