import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Convenience hook for auth operations
 */
export function useAuth() {
  const store = useAuthStore();

  const login = useCallback(
    async (token: string, vaultUrl: string) => {
      await store.login(token, vaultUrl);
    },
    [store]
  );

  const logout = useCallback(() => {
    store.logout();
  }, [store]);

  return {
    // State
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    token: store.token,
    vaultUrl: store.vaultUrl,
    tokenInfo: store.tokenInfo,
    error: store.error,

    // Actions
    login,
    logout,
    refreshTokenInfo: store.refreshTokenInfo,
    restoreSession: store.restoreSession,
    clearError: store.clearError,
  };
}
