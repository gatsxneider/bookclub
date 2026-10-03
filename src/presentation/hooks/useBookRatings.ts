import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/presentation/lib/apiClient';
import { BookRatingSummary } from '@/domain/rules/bookRating';

export function useBookRatings() {
  const [ratings, setRatings] = useState<Record<string, BookRatingSummary>>({});
  const [loading, setLoading] = useState(false);

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ ratings: Record<string, BookRatingSummary> }>(
        '/api/books/ratings'
      );
      if (res && res.ratings) {
        setRatings(res.ratings);
      }
    } catch {
      // ignore network errors and fallback to empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return { ratings, loading, refetch: fetchRatings };
}
