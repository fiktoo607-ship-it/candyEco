import { prisma } from './prisma';
import { parseDeviceInfo, extractLocationInfo } from './device-geo';

export interface RecordLoginHistoryParams {
  userId?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  role?: string | null;
  userAgent?: string | null;
  headers?: Headers | Record<string, string | string[] | undefined>;
  status?: 'success' | 'failed';
}

/**
 * Persists a user or admin login event with device and geo metadata.
 */
export async function recordLoginHistory(params: RecordLoginHistoryParams) {
  try {
    const deviceInfo = parseDeviceInfo(params.userAgent);
    const locationInfo = extractLocationInfo(params.headers);

    const record = await prisma.loginHistory.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || null,
        userPhone: params.userPhone || null,
        userEmail: params.userEmail || null,
        role: params.role || 'user',
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceLabel: deviceInfo.label,
        ip: locationInfo.ip,
        location: locationInfo.label,
        userAgent: params.userAgent || null,
        status: params.status || 'success',
      },
    });

    return record;
  } catch (error) {
    // Non-blocking error logging - auth must not fail if audit logging encounters a transient DB error
    console.error('[LoginHistory] Failed to record login history:', error);
    return null;
  }
}
