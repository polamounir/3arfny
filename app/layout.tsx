import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3arfny | Anonymous Messaging",
  description: "Send and receive anonymous messages with style. 100% free and unrestricted.",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon?cachebust=1',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "3arfny",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground flex flex-col selection:bg-neon-purple/30">
        {children}
        <Toaster position="top-center" richColors theme="dark" closeButton />
      </body>
    </html>
  );
}

