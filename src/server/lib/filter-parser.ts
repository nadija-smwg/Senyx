import { FilterNode } from '../types/shared';
import { and, or, eq, ne, gt, lt, inArray, like, SQL } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';

export function parseFilter(filterNode: FilterNode, allowedColumns: Record<string, AnyPgColumn>): SQL<unknown> | undefined {
  if ('and' in filterNode) {
    const conditions = filterNode.and.map((node) => parseFilter(node, allowedColumns)).filter(Boolean) as SQL<unknown>[];
    return conditions.length ? and(...conditions) : undefined;
  }
  if ('or' in filterNode) {
    const conditions = filterNode.or.map((node) => parseFilter(node, allowedColumns)).filter(Boolean) as SQL<unknown>[];
    return conditions.length ? or(...conditions) : undefined;
  }

  const column = allowedColumns[filterNode.field];
  if (!column) {
    return undefined; // Or throw error for invalid filter field
  }

  switch (filterNode.operator) {
    case 'eq':
      return eq(column, filterNode.value);
    case 'neq':
      return ne(column, filterNode.value);
    case 'contains':
      return like(column, `%${filterNode.value}%`);
    case 'in':
      return inArray(column, Array.isArray(filterNode.value) ? filterNode.value : [filterNode.value]);
    case 'gt':
      return gt(column, filterNode.value);
    case 'lt':
      return lt(column, filterNode.value);
    // Add between, empty etc. as needed
    default:
      return undefined;
  }
}
