'use client';

import { FirebaseProvider } from "./FirebaseProvider";
import { Toaster } from "./components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      {children}
      <Toaster />
    </FirebaseProvider>
  );
}
