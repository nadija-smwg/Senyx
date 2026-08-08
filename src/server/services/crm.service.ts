import { db } from '../db/client';
import { accounts, contacts, interactions, activities } from '../db/schema/crm';
import { eq, and, desc, asc, isNull } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/crm',
      entityType: data.module,
      entityId: data.targetId || null,
      result: 'success',
      after: data.details,
      ipAddress: data.ipAddress || '127.0.0.1',
    });
  } catch (e) {
    console.error("Failed to insert audit log", e);
  }
}

// ----------------------------------------------------------------------------
// ACCOUNTS
// ----------------------------------------------------------------------------

export async function listAccounts() {
  // All authenticated users can view CRM (it is shared)
  return await db.select().from(accounts).where(isNull(accounts.deletedAt)).orderBy(desc(accounts.createdAt));
}

export async function getAccount(id: string) {
  const [account] = await db.select().from(accounts).where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));
  if (!account) return null;
  
  const accountContacts = await db.select().from(contacts).where(and(eq(contacts.accountId, id), isNull(contacts.deletedAt)));
  return { ...account, contacts: accountContacts };
}

export async function createAccount(input: any, actorUserId: string) {
  const [account] = await db.insert(accounts).values({
    name: input.name,
    industry: input.industry,
    size: input.size,
    website: input.website,
    address: input.address,
    status: input.status || 'prospect',
    ownerId: input.ownerId || null,
    createdBy: actorUserId,
    updatedBy: actorUserId,
  }).returning();

  if (!account) throw new Error('Failed to create account');

  await auditAction({
    userId: actorUserId,
    action: 'account.create',
    apiRoute: '/api/accounts',
    module: 'crm',
    targetId: account.id,
    details: input,
  });

  return account;
}

export async function updateAccount(id: string, input: any, actorUserId: string) {
  const [account] = await db.update(accounts).set({
    ...input,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(accounts.id, id), isNull(accounts.deletedAt))).returning();

  if (!account) throw new Error('Account not found');

  await auditAction({
    userId: actorUserId,
    action: 'account.update',
    apiRoute: `/api/accounts/${id}`,
    module: 'crm',
    targetId: account.id,
    details: input,
  });

  return account;
}

export async function deleteAccount(id: string, actorUserId: string) {
  const [account] = await db.update(accounts).set({
    deletedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(accounts.id, id), isNull(accounts.deletedAt))).returning();

  if (!account) throw new Error('Account not found');

  await auditAction({
    userId: actorUserId,
    action: 'account.delete',
    apiRoute: `/api/accounts/${id}`,
    module: 'crm',
    targetId: account.id,
  });

  return true;
}

// ----------------------------------------------------------------------------
// CONTACTS
// ----------------------------------------------------------------------------

export async function listContacts(accountId?: string) {
  const conditions = [isNull(contacts.deletedAt)];
  if (accountId) {
    conditions.push(eq(contacts.accountId, accountId));
  }
  
  return await db.select().from(contacts)
    .where(and(...conditions))
    .orderBy(desc(contacts.createdAt));
}

export async function createContact(input: any, actorUserId: string) {
  // Check if primary
  if (input.isPrimary) {
    // If making this one primary, unset others for this account
    await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.accountId, input.accountId));
  }

  const [contact] = await db.insert(contacts).values({
    accountId: input.accountId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    title: input.title,
    isPrimary: input.isPrimary || false,
    createdBy: actorUserId,
    updatedBy: actorUserId,
  }).returning();

  if (!contact) throw new Error('Failed to create contact');

  await auditAction({
    userId: actorUserId,
    action: 'contact.create',
    apiRoute: '/api/contacts',
    module: 'crm',
    targetId: contact.id,
    details: input,
  });

  return contact;
}

// ----------------------------------------------------------------------------
// INTERACTIONS & ACTIVITIES
// ----------------------------------------------------------------------------

export async function createInteraction(input: any, actorUserId: string) {
  const [interaction] = await db.insert(interactions).values({
    accountId: input.accountId || null,
    contactId: input.contactId || null,
    type: input.type,
    subject: input.subject,
    notes: input.notes,
    loggedById: actorUserId,
    createdBy: actorUserId,
  }).returning();

  if (!interaction) throw new Error('Failed to create interaction');

  await auditAction({
    userId: actorUserId,
    action: 'interaction.create',
    apiRoute: '/api/interactions',
    module: 'crm',
    targetId: interaction.id,
    details: input,
  });

  return interaction;
}

export async function listInteractions(accountId?: string, contactId?: string) {
  const conditions = [isNull(interactions.deletedAt)];
  if (accountId) {
    conditions.push(eq(interactions.accountId, accountId));
  }
  if (contactId) {
    conditions.push(eq(interactions.contactId, contactId));
  }
  return await db.select().from(interactions)
    .where(and(...conditions))
    .orderBy(desc(interactions.occurredAt));
}

export async function createActivity(input: any, actorUserId: string) {
  const [activity] = await db.insert(activities).values({
    subject: input.subject,
    type: input.type,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    assigneeId: input.assigneeId || actorUserId,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    status: input.status || 'open',
    createdBy: actorUserId,
  }).returning();

  if (!activity) throw new Error('Failed to create activity');

  await auditAction({
    userId: actorUserId,
    action: 'activity.create',
    apiRoute: '/api/activities',
    module: 'crm',
    targetId: activity.id,
    details: input,
  });

  return activity;
}

export async function listActivities(assigneeId?: string, status?: string) {
  const conditions = [isNull(activities.deletedAt)];
  if (assigneeId) {
    conditions.push(eq(activities.assigneeId, assigneeId));
  }
  if (status) {
    conditions.push(eq(activities.status, status));
  }
  return await db.select().from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt));
}

export async function updateActivity(id: string, input: any, actorUserId: string) {
  const [activity] = await db.update(activities).set({
    ...input,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(activities.id, id), isNull(activities.deletedAt))).returning();

  if (!activity) throw new Error('Activity not found');

  await auditAction({
    userId: actorUserId,
    action: 'activity.update',
    apiRoute: `/api/activities/${id}`,
    module: 'crm',
    targetId: activity.id,
    details: input,
  });

  return activity;
}
