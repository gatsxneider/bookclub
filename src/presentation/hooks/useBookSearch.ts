'use client';

import { useState, useCallback } from 'react';
import { Book } from '@/domain/entities';
import { apiClient } from '@/presentation/lib/apiClient';

export function useBookSearch() {
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const searchBooks = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ documents: Book[]; total_count: number }>('/api/books/search', {
        query: trimmed,
      });
      setResults(data.documents || []);
      setTotalCount(data.total_count || 0);
    } catch (err: any) {
      setError(err.message || '도서 검색에 실패했습니다.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setError(null);
  }, []);

  return { results, loading, totalCount, error, searchBooks, clear };
}
