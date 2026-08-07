import { db } from '../db/client';

export async function withTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    return await operation(tx);
  });
}
