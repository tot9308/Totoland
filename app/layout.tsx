import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Totoland",
  description: "Seguimiento de plantas de casa",
  appleWebApp: { capable: true, title: "Totoland" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta name="theme-color" content="#059669" />
<link rel="icon" href="/icon-transparent.png" />
<link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
<SwRegister />
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <SWRegister />
        {children}
      </body>
    </html>
  );
}