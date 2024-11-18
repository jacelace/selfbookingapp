import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "./FirebaseProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/toaster";

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <FirebaseProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
