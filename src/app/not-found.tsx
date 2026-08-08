'use client';

import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-muted/30 text-muted-foreground rounded-full flex items-center justify-center mb-6 shadow-sm border">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-4xl font-heading font-black text-foreground mb-3 tracking-tight">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        We couldn't find the page you were looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
      </p>
      <Button asChild>
        <Link href="/">
          Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}
