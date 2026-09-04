import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../types/errors';

export function handleError(error: unknown) {
  // Log to console (compatible with Vercel serverless & edge runtimes)
  console.error('[Senyx Error]', error instanceof Error ? error.stack : error);

  if (error instanceof AppError) {
    return NextResponse.json({
      error: {
        code: error.code,
        message: error.message,
        details: (error as any).details || undefined,
      }
    }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.issues,
      }
    }, { status: 400 });
  }

  console.error('Unhandled error:', error);

  return NextResponse.json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    }
  }, { status: 500 });
}
