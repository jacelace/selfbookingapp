import type { Metadata } from "next";
import RootLayout from "./layout";

export const metadata: Metadata = {
  title: "Therapy Session Booking",
  description: "Book your therapy sessions easily",
};

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayout>{children}</RootLayout>;
}
