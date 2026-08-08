import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { baseColumns } from './base';
import { users } from './identity';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  storageKey: text('storage_key').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  ownerType: varchar('owner_type', { length: 50 }).notNull(), // 'project', 'expense', 'employee', etc.
  ownerId: uuid('owner_id').notNull(), // ID of the related record
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  ...baseColumns,
}, (table) => [
  index('documents_owner_idx').on(table.ownerType, table.ownerId),
]);
