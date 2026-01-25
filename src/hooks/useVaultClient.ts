import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { VaultClient, createVaultClient } from '@/services/vault/client';

/**
 * Hook to get a memoized VaultClient instance
 * Returns null if not authenticated
 */
export function useVaultClient(): VaultClient | null {
  const { token, vaultUrl, logout, isAuthenticated } = useAuthStore();

  return useMemo(() => {
    if (!isAuthenticated || !token || !vaultUrl) {
      return null;
    }

    return createVaultClient({
      baseUrl: vaultUrl,
      token,
      onUnauthorized: logout,
    });
  }, [token, vaultUrl, isAuthenticated, logout]);
}

/**
 * Hook that throws if client is not available
 * Use in components that require authentication
 */
export function useRequiredVaultClient(): VaultClient {
  const client = useVaultClient();

  if (!client) {
    throw new Error('VaultClient is not available. User must be authenticated.');
  }

  return client;
}
