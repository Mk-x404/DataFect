import { useState, useMemo } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  paginatedItems: T[];
  canNext: boolean;
  canPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, pageSize = 20 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-clamp page if items list shrinks
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const canNext = safePage < totalPages;
  const canPrev = safePage > 1;

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
  };

  const nextPage = () => {
    if (canNext) setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  const prevPage = () => {
    if (canPrev) setCurrentPage((p) => Math.max(p - 1, 1));
  };

  return {
    currentPage: safePage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    canNext,
    canPrev,
    goToPage,
    nextPage,
    prevPage,
  };
}
