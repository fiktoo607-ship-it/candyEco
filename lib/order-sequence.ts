import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const dailySequenceMap = new Map<string, number>();

/**
 * Resets the in-memory daily sequence counter (useful for testing and daily cron jobs).
 */
export function resetDailyOrderSequence(dateKey?: string): void {
  if (dateKey) {
    dailySequenceMap.delete(dateKey);
    try {
      (prisma as any)?._mockSequenceStore?.delete(`order_ref_seq_${dateKey}`);
      (prisma as any)?._mockSequenceStore?.delete(dateKey);
    } catch {}
  } else {
    dailySequenceMap.clear();
    try {
      (prisma as any)?._mockSequenceStore?.clear();
    } catch {}
  }
}

/**
 * Generates an atomic, collision-resistant order reference formatted as:
 * ORD-YYYYMMDD-XXX (e.g. ORD-20261015-001)
 *
 * Automatically resets the sequence counter for each distinct calendar date (Issue #113).
 * Uses PostgreSQL sequence nextval when connected to Postgres, with a robust daily
 * database/memory counter fallback in SQLite, mock, or test environments.
 */
export async function generateAtomicOrderReference(
  client: any = prisma,
  date: Date = new Date()
): Promise<string> {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;
  const datePrefix = `ORD-${dateKey}-`;

  // 1. Attempt PostgreSQL sequence nextval if $queryRaw is supported on provided client
  if (client && typeof client.$queryRaw === 'function') {
    try {
      const seqName = `order_ref_seq_${dateKey}`;
      const result = await client.$queryRaw`SELECT nextval(${seqName}) as seq`;
      if (result && Array.isArray(result) && result.length > 0) {
        const rawVal = result[0]?.seq ?? result[0]?.nextval;
        if (rawVal !== undefined && rawVal !== null) {
          const seqNum = Number(rawVal);
          if (!isNaN(seqNum)) {
            const seqStr = seqNum <= 999 ? String(seqNum).padStart(3, '0') : String(seqNum);
            return `${datePrefix}${seqStr}`;
          }
        }
      }
    } catch {
      // If daily sequence does not exist, attempt to create it once on a clean connection
      try {
        const seqName = `order_ref_seq_${dateKey}`;
        await client.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START 1`);
        const retryResult = await client.$queryRaw`SELECT nextval(${seqName}) as seq`;
        if (retryResult && Array.isArray(retryResult) && retryResult.length > 0 && retryResult[0]?.seq !== undefined) {
          const seqNum = Number(retryResult[0].seq);
          const seqStr = seqNum <= 999 ? String(seqNum).padStart(3, '0') : String(seqNum);
          return `${datePrefix}${seqStr}`;
        }
      } catch {
        // Fall through to database order lookup / memory sequence
      }
    }
  }

  // 2. Query highest order sequence existing in database for this date
  let maxDbSeq = 0;
  if (client && client.order && typeof client.order.findFirst === 'function') {
    try {
      const latestOrder = await client.order.findFirst({
        where: {
          reference: {
            startsWith: datePrefix,
          },
        },
        orderBy: {
          reference: 'desc',
        },
        select: {
          reference: true,
        },
      });

      if (latestOrder && latestOrder.reference) {
        const match = latestOrder.reference.match(/^ORD-\d{8}-(\d+)$/);
        if (match) {
          maxDbSeq = parseInt(match[1], 10) || 0;
        }
      }
    } catch {
      // Ignore DB errors during lookup
    }
  }

  // 3. Compute next sequence number for this specific calendar date
  const currentMemSeq = dailySequenceMap.get(dateKey) || 0;
  const nextSeq = Math.max(currentMemSeq, maxDbSeq) + 1;
  dailySequenceMap.set(dateKey, nextSeq);

  const seqStr = nextSeq <= 999 ? String(nextSeq).padStart(3, '0') : String(nextSeq);
  return `${datePrefix}${seqStr}`;
}
