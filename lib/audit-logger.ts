/**
 * Security Audit Logger & Sanitizer
 * 
 * Guarantees that sensitive authentication artifacts (tokens, passwords, secrets,
 * session cookies, authorization headers) are never exposed in log sinks, files,
 * or stdout/stderr streams.
 */

const SENSITIVE_KEY_PATTERNS = [
  /access_?token/i,
  /refresh_?token/i,
  /id_?token/i,
  /password/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /session_?token/i,
  /session_?state/i,
  /api_?key/i,
  /client_?secret/i,
  /private_?key/i,
  /credentials/i,
  /verification_?token/i,
  /pass/i,
];

/**
 * Recursively sanitizes any object or primitive, replacing values of sensitive keys with "[REDACTED]".
 */
export function sanitizeLogData<T = any>(data: T, depth = 0): T {
  if (depth > 8) return '[MAX_DEPTH_REACHED]' as unknown as T;
  if (data === null || data === undefined) return data;

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export interface AuditEvent {
  timestamp?: string;
  eventType:
    | 'AUTH_LOGIN'
    | 'AUTH_LOGOUT'
    | 'AUTH_REGISTER'
    | 'AUTH_VERIFY'
    | 'ORDER_CREATED'
    | 'ORDER_STATUS_UPDATED'
    | 'SECURITY_VIOLATION'
    | string;
  userId?: string | null;
  provider?: string | null;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Dispatches a structured, sanitized security audit event.
 */
export function logAuditEvent(event: AuditEvent): void {
  const sanitizedEvent: AuditEvent = {
    timestamp: event.timestamp || new Date().toISOString(),
    eventType: event.eventType,
    userId: event.userId || null,
    provider: event.provider || null,
    success: event.success,
    reason: event.reason,
    metadata: event.metadata ? sanitizeLogData(event.metadata) : undefined,
  };

  // Structured stdout logging without disk persistence of raw tokens
  if (process.env.NODE_ENV !== 'test') {
    const logPayload = JSON.stringify(sanitizedEvent);
    if (event.success) {
      console.info(`[SECURITY_AUDIT] ${logPayload}`);
    } else {
      console.warn(`[SECURITY_AUDIT] ${logPayload}`);
    }
  }
}

/**
 * Backwards-compatible sanitized logger for authentication events.
 */
export function logAuthData(data: { user?: any; account?: any; [key: string]: any }): void {
  const provider = data?.account?.provider || 'google';
  const userId = data?.user?.id || null;

  logAuditEvent({
    eventType: 'AUTH_LOGIN',
    provider,
    userId,
    success: true,
    metadata: {
      email: data?.user?.email,
      name: data?.user?.name,
    },
  });
}
