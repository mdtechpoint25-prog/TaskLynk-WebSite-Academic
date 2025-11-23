"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
  cache?: 'no-cache' | 'force-cache' | 'default';
}

const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useApi<T = any>(
  url: string | null,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const {
    method = 'GET',
    enabled = true,
    refetchInterval = 0,
    onSuccess,
    onError,
    retries = 2,
    retryDelay = 1000,
    cache = 'default'
  } = options;

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    try {
      setError(null);

      // Check cache first
      if (method === 'GET' && cache === 'force-cache') {
        const cached = queryCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (mountedRef.current) {
        setData(result);
        if (method === 'GET' && cache === 'force-cache') {
          queryCache.set(url, { data: result, timestamp: Date.now() });
        }
        retryCountRef.current = 0;
        onSuccess?.(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (retryCountRef.current < retries) {
        retryCountRef.current++;
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData();
          }
        }, retryDelay * Math.pow(2, retryCountRef.current - 1));
      } else {
        if (mountedRef.current) {
          setError(error);
          onError?.(error);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, enabled, method, options.headers, onSuccess, onError, retries, retryDelay, cache]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    let interval: ReturnType<typeof setInterval>;
    if (refetchInterval > 0) {
      interval = setInterval(fetchData, refetchInterval);
    }

    return () => {
      mountedRef.current = false;
      if (interval) clearInterval(interval);
    };
  }, [fetchData, refetchInterval]);

  return { data, loading, error };
}

export function useApiMutation<T = any>(options: Omit<UseApiOptions, 'enabled'> = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (url: string, body?: any): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;

        const response = await fetch(url, {
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { mutate, loading, error };
}
