import { create } from 'zustand';
import type { TokenInfo } from '@/types/vault';
import { createVaultClient, clearVaultClient } from '@/services/vault/client';

const SESSION_TOKEN_KEY = 'vault_token';
const SESSION_URL_KEY = 'vault_url';

interface AuthState {
  token: string | null;
  vaultUrl: string | null;
  tokenInfo: TokenInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string, vaultUrl: string) => Promise<void>;
  logout: () => void;
  refreshTokenInfo: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  vaultUrl: null,
  tokenInfo: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (token: string, vaultUrl: string) => {
    set({ isLoading: true, error: null });

    try {
      // Create client and verify token
      const client = createVaultClient({
        baseUrl: vaultUrl,
        token,
        onUnauthorized: () => get().logout(),
      });

      const tokenInfo = await client.lookupSelf();

      // Persist to session storage
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_URL_KEY, vaultUrl);

      set({
        token,
        vaultUrl,
        tokenInfo,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      clearVaultClient();
      set({
        token: null,
        vaultUrl: null,
        tokenInfo: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
      throw error;
    }
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_URL_KEY);
    clearVaultClient();

    set({
      token: null,
      vaultUrl: null,
      tokenInfo: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  refreshTokenInfo: async () => {
    const { token, vaultUrl } = get();
    if (!token || !vaultUrl) return;

    try {
      const client = createVaultClient({
        baseUrl: vaultUrl,
        token,
        onUnauthorized: () => get().logout(),
      });

      const tokenInfo = await client.lookupSelf();
      set({ tokenInfo });
    } catch {
      // If refresh fails, don't logout - let the error propagate
    }
  },

  restoreSession: async (): Promise<boolean> => {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const vaultUrl = sessionStorage.getItem(SESSION_URL_KEY);

    if (!token || !vaultUrl) {
      return false;
    }

    try {
      await get().login(token, vaultUrl);
      return true;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
