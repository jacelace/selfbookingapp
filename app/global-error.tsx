'use client';

import { Button } from '@/app/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
