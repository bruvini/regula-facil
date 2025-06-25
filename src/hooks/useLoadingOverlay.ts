
import { useState, useCallback } from 'react';

interface UseLoadingOverlayReturn {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoadingOverlay = (initialLoading = false): UseLoadingOverlayReturn => {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    setLoading,
    withLoading
  };
};
