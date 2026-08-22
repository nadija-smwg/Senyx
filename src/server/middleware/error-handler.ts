import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../types/errors';
import fs from 'fs';

export function handleError(error: unknown) {
  try {
    fs.appendFileSync('error.log', new Date().toISOString() + ': ' + ((error as any).stack || (error as any).message || String(error)) + '\n');
  } catch (e) {
    console.error('Failed to write to error.log', e);
  }

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
