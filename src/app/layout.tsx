import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burrow - Explore Ideas",
  description: "A visual exploration tool for brainstorming and organizing ideas",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      }
    ],
    apple: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      }
    ]
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="MobileOptimized" content="width" />
        {/* Script to prevent zoom via keyboard and gesture */}
        <script dangerouslySetInnerHTML={{
          __html: `
          document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
            document.body.style.zoom = 1.0;
            return false;
          }, { passive: false });
          document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
              e.preventDefault();
              return false;
            }
          }, { passive: false });
          `
        }} />
      </head>
      <body className={`min-h-screen bg-background font-sans antialiased overflow-hidden ${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
