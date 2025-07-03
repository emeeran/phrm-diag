import { prisma } from './prisma';

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'mfa_setup'
  | 'mfa_verify'
  | 'mfa_disable'
  | 'logout'
  | 'account_locked'
  | 'account_unlocked'
  | 'password_reset_requested'
  | 'password_changed'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'document_uploaded'
  | 'document_downloaded'
  | 'document_deleted'
  | 'api_key_created'
  | 'api_key_revoked';

export type ResourceType =
  | 'user'
  | 'session'
  | 'healthRecord'
  | 'document'
  | 'family'
  | 'invitation'
  | 'apiKey'
  | 'system';

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  description,
  ipAddress,
  userAgent,
}: {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      description,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resourceType: ResourceType,
  resourceId: string,
  limit = 100
) {
  return prisma.auditLog.findMany({
    where: {
      resourceType,
      resourceId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(
  page = 1,
  pageSize = 50,
  filters?: {
    action?: AuditAction;
    resourceType?: ResourceType;
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
) {
  const where: any = {};

  if (filters) {
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.userId) where.userId = filters.userId;
    
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalItems: total,
    },
  };
}
