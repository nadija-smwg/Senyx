import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { ValidationError } from '../types/errors';

export async function validateBody<T>(schema: ZodSchema<T>, request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Invalid request body', error.errors);
    }
    throw new ValidationError('Malformed JSON body');
  }
}

export function validateSearchParams<T>(schema: ZodSchema<T>, url: URL): T {
  const params = Object.fromEntries(url.searchParams.entries());
  try {
    return schema.parse(params);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Invalid search parameters', error.errors);
    }
    throw error;
  }
}
