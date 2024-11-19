import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "./FirebaseProvider";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Therapy Session Booking",
  description: "Book your therapy sessions easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseProvider>
            <div className="relative min-h-screen bg-background font-sans antialiased">
              <Navbar />
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">
                  {children}
                </div>
              </div>
              <Toaster />
            </div>
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
