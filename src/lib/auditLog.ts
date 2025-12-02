import { supabase } from '@/integrations/supabase/client';

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_UPDATED'
  | 'ROLE_CHANGED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'SETTINGS_UPDATED'
  | 'DATA_EXPORTED'
  | 'DATA_DELETED'
  | 'SALE_COMPLETED'
  | 'INVENTORY_UPDATED'
  | 'BULK_UPLOAD';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_event_type: entry.eventType,
      p_user_id: entry.userId || null,
      p_user_email: entry.userEmail || null,
      p_user_role: entry.userRole || null,
      p_action: entry.action,
      p_resource_type: entry.resourceType || null,
      p_resource_id: entry.resourceId || null,
      p_details: (entry.details || {}) as unknown as Record<string, never>,
      p_status: entry.status || 'success',
      p_error_message: entry.errorMessage || null,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(email: string, reason: string): Promise<void> {
  await logAuditEvent({
    eventType: 'LOGIN_FAILED',
    userEmail: email,
    action: 'Failed login attempt',
    details: { reason },
    status: 'failed',
    errorMessage: reason,
  });
}

/**
 * Log a successful login
 */
export async function logSuccessfulLogin(
  userId: string,
  email: string,
  role: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'LOGIN_SUCCESS',
    userId,
    userEmail: email,
    userRole: role,
    action: 'User logged in successfully',
  });
}

/**
 * Log a logout event
 */
export async function logLogout(userId: string, email: string): Promise<void> {
  await logAuditEvent({
    eventType: 'LOGOUT',
    userId,
    userEmail: email,
    action: 'User logged out',
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  userId: string | undefined,
  email: string | undefined,
  attemptedResource: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'UNAUTHORIZED_ACCESS',
    userId,
    userEmail: email,
    action: `Unauthorized access attempt to ${attemptedResource}`,
    resourceType: attemptedResource,
    status: 'failed',
  });
}

/**
 * Log settings change
 */
export async function logSettingsChange(
  userId: string,
  email: string,
  role: string,
  settingName: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  await logAuditEvent({
    eventType: 'SETTINGS_UPDATED',
    userId,
    userEmail: email,
    userRole: role,
    action: `Updated setting: ${settingName}`,
    resourceType: 'store_settings',
    details: { settingName, oldValue, newValue },
  });
}

/**
 * Log data export request
 */
export async function logDataExport(
  userId: string,
  email: string,
  exportType: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'DATA_EXPORTED',
    userId,
    userEmail: email,
    action: `Exported ${exportType} data`,
    resourceType: exportType,
  });
}
