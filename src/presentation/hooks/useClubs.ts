'use client';

import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/domain/entities';
import { apiClient } from '@/presentation/lib/apiClient';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ clubs: Club[] }>('/api/clubs');
      setClubs(data.clubs || []);
    } catch (err: any) {
      setError(err.message || '클럽 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return { clubs, loading, error, refetch: fetchClubs };
}
