'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Module Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border shadow-sm m-6">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Failed to load module data</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        An error occurred while loading this section. Please try again or contact support if the issue persists.
      </p>
      <Button variant="outline" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
