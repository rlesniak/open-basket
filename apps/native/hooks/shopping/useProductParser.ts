import { useState, useCallback } from 'react';
import { env } from '@listonic/env/native';
import { ParsedProduct } from '@/types/shopping';

export const useProductParser = () => {
  const [isParsing, setIsParsing] = useState(false);

  const parseProduct = useCallback(async (input: string): Promise<(ParsedProduct & { assignedStoreId: string | null }) | null> => {
    setIsParsing(true);
    try {
      const response = await fetch(`${env.EXPO_PUBLIC_SERVER_URL}/shopping/parse-product-with-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parseProduct, isParsing };
};
