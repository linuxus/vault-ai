import { useQuery } from '@tanstack/react-query';
import { useRequiredVaultClient } from '@/hooks/useVaultClient';

/**
 * Query key for mounts
 */
export const mountsKeys = {
  all: ['mounts'] as const,
  kv: ['mounts', 'kv'] as const,
};

/**
 * Hook to list all mounts
 */
export function useMounts() {
  const client = useRequiredVaultClient();

  return useQuery({
    queryKey: mountsKeys.all,
    queryFn: () => client.listMounts(),
  });
}

/**
 * Hook to get KV mounts only
 */
export function useKVMounts() {
  const client = useRequiredVaultClient();

  return useQuery({
    queryKey: mountsKeys.kv,
    queryFn: () => client.getKVMounts(),
  });
}
