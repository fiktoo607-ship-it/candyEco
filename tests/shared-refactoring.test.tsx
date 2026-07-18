// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { isValidStatusTransition } from '@/types/orderStatusConfig';
import { useDashboardPagination } from '@/components/dashbord/hooks/useDashboardPagination';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Helper component to test useDashboardPagination hook
function TestPaginationComponent({
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  initialSortBy,
  filters,
  onHookValue,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  initialSortBy: string;
  filters?: any;
  onHookValue: (hookResult: any) => void;
}) {
  const hookResult = useDashboardPagination({
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    initialSortBy,
    filters,
  });
  
  onHookValue(hookResult);
  
  return <div>Test Hook</div>;
}

describe('Shared Refactoring Tests', () => {
  describe('isValidStatusTransition', () => {
    it('should allow valid transitions', () => {
      // PENDING
      expect(isValidStatusTransition('PENDING', 'ACCEPTED')).toBe(true);
      expect(isValidStatusTransition('PENDING', 'DELIVERED')).toBe(true);
      expect(isValidStatusTransition('PENDING', 'CANCELLED')).toBe(true);
      expect(isValidStatusTransition('PENDING', 'PENDING')).toBe(true);
      
      // ACCEPTED
      expect(isValidStatusTransition('ACCEPTED', 'DELIVERED')).toBe(true);
      expect(isValidStatusTransition('ACCEPTED', 'ACCEPTED')).toBe(true);
    });

    it('should block invalid transitions', () => {
      // CANCELLED
      expect(isValidStatusTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(isValidStatusTransition('CANCELLED', 'ACCEPTED')).toBe(false);
      expect(isValidStatusTransition('CANCELLED', 'DELIVERED')).toBe(false);
      
      // DELIVERED
      expect(isValidStatusTransition('DELIVERED', 'PENDING')).toBe(false);
      expect(isValidStatusTransition('DELIVERED', 'ACCEPTED')).toBe(false);
      expect(isValidStatusTransition('DELIVERED', 'CANCELLED')).toBe(false);

      // ACCEPTED
      expect(isValidStatusTransition('ACCEPTED', 'PENDING')).toBe(false);
      expect(isValidStatusTransition('ACCEPTED', 'CANCELLED')).toBe(false);
    });
  });

  describe('useDashboardPagination Hook', () => {
    let container: HTMLDivElement | null = null;
    let root: Root | null = null;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(() => {
      if (root && container) {
        act(() => {
          root!.unmount();
        });
        document.body.removeChild(container);
      }
    });

    it('should initialize pagination state correctly', async () => {
      let hookResult: any = null;
      const setSearchQuery = vi.fn();
      const setCurrentPage = vi.fn();

      await act(async () => {
        root!.render(
          <TestPaginationComponent
            searchQuery="query"
            setSearchQuery={setSearchQuery}
            currentPage={2}
            setCurrentPage={setCurrentPage}
            initialSortBy="createdAt"
            onHookValue={(result) => {
              hookResult = result;
            }}
          />
        );
      });

      expect(hookResult.currentPage).toBe(2);
      expect(hookResult.searchQuery).toBe('query');
      expect(hookResult.sortBy).toBe('createdAt');
      expect(hookResult.sortOrder).toBe('desc');
      expect(hookResult.limit).toBe(5);
    });

    it('should call setCurrentPage(1) when filters or search change', async () => {
      let hookResult: any = null;
      const setSearchQuery = vi.fn();
      const setCurrentPage = vi.fn();

      await act(async () => {
        root!.render(
          <TestPaginationComponent
            searchQuery="query"
            setSearchQuery={setSearchQuery}
            currentPage={2}
            setCurrentPage={setCurrentPage}
            initialSortBy="createdAt"
            filters={{ category: 'all' }}
            onHookValue={(result) => {
              hookResult = result;
            }}
          />
        );
      });

      // Initially, the useEffect triggers on mount since searchQuery/filters are dependencies
      expect(setCurrentPage).toHaveBeenCalledWith(1);
    });
  });
});
