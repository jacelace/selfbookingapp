'use client';

import { ToastProvider as Provider } from '@radix-ui/react-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}
