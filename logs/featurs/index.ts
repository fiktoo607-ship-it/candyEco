/**
 * Secure Authentication Audit Logging
 * 
 * Re-exports sanitized audit logging routines.
 * Plaintext credential disk writes (authData.txt) have been permanently decommissioned.
 */

export { logAuthData, logAuditEvent, sanitizeLogData } from "@/lib/audit-logger";
