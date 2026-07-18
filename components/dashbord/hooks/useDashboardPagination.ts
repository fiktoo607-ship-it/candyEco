import { useState, useEffect } from 'react';

export interface UseDashboardPaginationProps<TFilter extends Record<string, any> = Record<string, any>> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  initialSortBy: string;
  initialSortOrder?: string;
  initialLimit?: number;
  filters?: TFilter;
}

export function useDashboardPagination<TFilter extends Record<string, any> = Record<string, any>>({
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  initialSortBy,
  initialSortOrder = 'desc',
  initialLimit = 5,
  filters,
}: UseDashboardPaginationProps<TFilter>) {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [limit, setLimit] = useState(initialLimit);

  // Serialize filter values for dependency array
  const filterDeps = filters ? Object.values(filters) : [];

  // Reset page to 1 whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage, ...filterDeps]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return {
    currentPage,
    setCurrentPage: handlePageChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    limit,
    setLimit,
  };
}
