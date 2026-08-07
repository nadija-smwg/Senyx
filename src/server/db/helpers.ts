import { isNull } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';

export function withNotDeleted(table: { deletedAt: AnyPgColumn }) {
  return isNull(table.deletedAt);
}

export function applyPagination(query: any, page: number, pageSize: number) {
  return query.limit(pageSize).offset((page - 1) * pageSize);
}

export function applySort(query: any, sort: string, allowedColumns: Record<string, AnyPgColumn>) {
  // To be implemented fully, placeholder for sort
  return query;
}
