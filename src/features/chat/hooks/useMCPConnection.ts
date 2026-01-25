import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { MCPClient, createMCPClient, getMCPClient, clearMCPClient } from '@/services/mcp/client';

// MCP proxy URL - uses Vite proxy in development
const MCP_PROXY_URL = '';

export function useMCPConnection() {
  const { token, isAuthenticated } = useAuthStore();
  const clientRef = useRef<MCPClient | null>(null);

  // Initialize or update client when auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      // Create new client or update token
      const existingClient = getMCPClient();
      if (existingClient) {
        existingClient.setVaultToken(token);
        clientRef.current = existingClient;
      } else {
        const client = createMCPClient({
          baseUrl: MCP_PROXY_URL,
          vaultToken: token,
        });
        clientRef.current = client;
      }
    } else {
      // Clear client on logout
      clearMCPClient();
      clientRef.current = null;
    }

    return () => {
      // Cleanup on unmount
      clearMCPClient();
      clientRef.current = null;
    };
  }, [token, isAuthenticated]);

  const getClient = useCallback((): MCPClient | null => {
    return clientRef.current || getMCPClient();
  }, []);

  return {
    getClient,
    isConnected: isAuthenticated && clientRef.current !== null,
  };
}
