'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-heading font-bold text-foreground mb-3">Something went wrong</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        An unexpected error occurred while processing your request. We've logged this issue, but please feel free to try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.href = '/'}>
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
