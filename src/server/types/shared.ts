import { z } from 'zod';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
  filter?: FilterNode;
}

export type FilterNode = {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'in' | 'gt' | 'lt' | 'between' | 'empty';
  value: any;
} | {
  and: FilterNode[];
} | {
  or: FilterNode[];
};

export interface ListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  q: z.string().optional(),
});
