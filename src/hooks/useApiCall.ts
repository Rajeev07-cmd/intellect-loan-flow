import { useState, useCallback } from "react";

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  fallback?: T;
}

export function useApiCall<T, A extends unknown[] = []>(
  apiFn: (...args: A) => Promise<T>,
  options: UseApiCallOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const execute = useCallback(async (...args: A) => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const result = await apiFn(...args);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);

      if (options.fallback !== undefined) {
        setData(options.fallback);
        setUsingFallback(true);
        return options.fallback;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFn, options.fallback]);

  return { data, loading, error, usingFallback, execute };
}
