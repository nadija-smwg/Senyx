import { db } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { documents } from '../db/schema/core';
import { auditLogs } from '../db/schema/platform';
import { AuthContext } from '../types/context';
import { uploadDocumentToR2, getSignedDownloadUrl as getR2Url, deleteDocumentFromR2, generateStorageKey } from '../lib/r2-client';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/zip',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function upload(
  ctx: AuthContext, 
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string, 
  sizeBytes: number,
  ownerType: string, 
  ownerId: string
) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Unsupported file type');
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const storageKey = generateStorageKey(ownerType, ownerId, fileName);
  await uploadDocumentToR2(fileBuffer, storageKey, mimeType);

  const [doc] = await db.insert(documents).values({
    ownerType,
    ownerId,
    storageKey,
    fileName,
    mimeType,
    sizeBytes,
    uploadedBy: ctx.userId,
  }).returning();

  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    action: 'document.upload',
    entityType: 'documents',
    entityId: doc?.id,
    apiRoute: ctx.apiRoute,
    ipAddress: ctx.ip || '',
    device: ctx.deviceInfo.device,
    os: ctx.deviceInfo.os,
    browser: ctx.deviceInfo.browser,
    result: 'success',
  });

  return doc;
}

export async function getDownloadUrl(ctx: AuthContext, documentId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
  if (!doc) {
    throw new Error('Document not found');
  }

  const roles = ctx.roles.map(r => r.toLowerCase());
  const isAdmin = roles.includes('admin') || roles.includes('owner') || roles.includes('system admin');
  
  if (!isAdmin) {
    // Basic verification: user must have permissions on the module matching ownerType, or have uploaded it
    const moduleName = doc.ownerType.toLowerCase();
    const hasViewPerm = ctx.permissions.some(p => p.module === moduleName && p.action === 'view');
    const hasManagePerm = ctx.permissions.some(p => p.module === moduleName && p.action === 'manage');
    const hasEditPerm = ctx.permissions.some(p => p.module === moduleName && p.action === 'edit');
    const isUploader = doc.uploadedBy === ctx.userId;
    
    if (!hasViewPerm && !hasManagePerm && !hasEditPerm && !isUploader) {
      throw new Error('Unauthorized to view this document');
    }
  }
  
  const url = await getR2Url(doc.storageKey);
  return { url, fileName: doc.fileName };
}

export async function deleteDocument(ctx: AuthContext, documentId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
  if (!doc) {
    throw new Error('Document not found');
  }

  await deleteDocumentFromR2(doc.storageKey);
  await db.delete(documents).where(eq(documents.id, documentId));

  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    action: 'document.delete',
    entityType: 'documents',
    entityId: doc.id,
    apiRoute: ctx.apiRoute,
    ipAddress: ctx.ip || '',
    device: ctx.deviceInfo.device,
    os: ctx.deviceInfo.os,
    browser: ctx.deviceInfo.browser,
    result: 'success',
  });
}

export async function listByOwner(ctx: AuthContext, ownerType: string, ownerId: string) {
  return await db.select().from(documents).where(and(
    eq(documents.ownerType, ownerType),
    eq(documents.ownerId, ownerId)
  ));
}
