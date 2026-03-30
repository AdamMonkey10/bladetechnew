// Hook for warehouse repository injection
import { useMemo } from 'react';
import type { WarehouseRepo } from '../repo/WarehouseRepo';
import { SupabaseWarehouseRepo } from '../adapters/supabaseWarehouseRepo';
import { RestWarehouseRepo } from '../adapters/restWarehouseRepo';

interface UseWarehouseRepoOptions {
  dataSource?: 'supabase' | 'rest';
  restBaseUrl?: string;
  restApiKey?: string;
}

export function useWarehouseRepo(options: UseWarehouseRepoOptions = {}): WarehouseRepo {
  const {
    dataSource = 'supabase', // Default to Supabase instead of Firestore
    restBaseUrl = 'http://localhost:3001',
    restApiKey
  } = options;

  return useMemo(() => {
    switch (dataSource) {
      case 'rest':
        return new RestWarehouseRepo(restBaseUrl, restApiKey);
      case 'supabase':
      default:
        return new SupabaseWarehouseRepo();
    }
  }, [dataSource, restBaseUrl, restApiKey]);
}