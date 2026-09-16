"use client";

/**
 * @deprecated Use useAdminSession from '@/hooks/useAdminSession' instead.
 */
import { useAdminSession } from './useAdminSession';

export function useClientDevice() {
  const { deviceInfo, isMounted } = useAdminSession();
  return { deviceInfo, isMounted };
}

export default useClientDevice;
